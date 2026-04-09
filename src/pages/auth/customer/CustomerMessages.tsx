import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import CustomerNavbar from './components/CustomerNavbar';
import { useAuth } from '../../../context/AuthContext';
import { updateJobStatus } from '../../../api/jobs.api';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';
import { getMessages, sendMessage, markAsRead, getOrCreateConversation, getConversationById } from '../../../api/conversations.api';
import { useData } from '../../../context/DataContext';

const CustomerMessages = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [userRequests, setUserRequests] = useState<any[]>([]);
    const [activeUserDetails, setActiveUserDetails] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { jobs, notifications, jobsLoading, notificationsLoading } = useData();
    const navigate = useNavigate();

    // Prevent blocking UI flash during background context polling
    const isLoading = (jobsLoading || notificationsLoading) && jobs.length === 0;

    useEffect(() => {
        if (!user?.id) {
            setUserRequests([]);
            return;
        }

        // Removed status filter to show all chats including pending/previous
        const myRequests = jobs.filter((job: any) => {
            const customerId = job.customer?.id || job.customer || job.customer_id || job.customer_detail?.id;
            return customerId === user?.id;
        });

        console.log("CustomerMessages: My Requests:", myRequests);
        setUserRequests(myRequests);
    }, [jobs, user?.id]);

    // Sidebar Hydration: Fetch details for ALL professionals in the list
    const [hydratedRequests, setHydratedRequests] = useState<any[]>([]);

    useEffect(() => {
        const hydrate = async () => {
            if (jobsLoading) return;

            if (userRequests.length === 0) {
                setHydratedRequests([]);
                return;
            }

            const professionalIds = Array.from(new Set(
                userRequests
                    .map(job => job.professional || job.assigned_to)
                    .filter(Boolean)
            )) as string[];

            const detailsById: Record<string, any> = {};
            await Promise.all(professionalIds.map(async (proId) => {
                try {
                    detailsById[proId] = await getUserDetails(proId);
                } catch (err) {
                    console.error("CustomerMessages: Failed to hydrate professional details:", proId, err);
                    detailsById[proId] = null;
                }
            }));

            const jobsWithDetails = userRequests.map((job) => {
                const proId = job.professional || job.assigned_to;
                return {
                    ...job,
                    professional_detail: job.professional_detail || detailsById[proId] || job.professional_detail,
                };
            });

            setHydratedRequests(jobsWithDetails);
        };
        hydrate();
    }, [userRequests, jobsLoading]);

    // Get active request from URL or default to first
    const urlRequestId = searchParams.get('requestId');
    const urlConversationId = searchParams.get('conversationId');
    const urlMessageSessionId = searchParams.get('messageSessionId');

    const findActiveRequest = useCallback((id?: string) => {
        if (!id) return undefined;
        // Search raw jobs pool immediately to ensure deep-links resolve without waiting for hydration
        return jobs.find((r: any) => [
            r.id,
            r.conversation_id,
            r.message_session_id,
            r.job_id,
            r.request_id,
        ].includes(id));
    }, [jobs]);

    const activeRequest = useMemo(() => {
        const found =
            (urlConversationId && findActiveRequest(urlConversationId)) ||
            (urlMessageSessionId && findActiveRequest(urlMessageSessionId)) ||
            (urlRequestId && findActiveRequest(urlRequestId)) ||
            null;

        return found;
    }, [findActiveRequest, urlConversationId, urlMessageSessionId, urlRequestId]);

    const activeRequestId = activeRequest?.id;
    const requestId = activeRequestId;

    useEffect(() => {
        if (urlConversationId && !activeRequest) {
            getConversationById(urlConversationId)
                .then(conv => {
                    const mappedJobId = conv.job || conv.job_id;
                    if (mappedJobId) {
                        setSearchParams(prev => {
                            const params = new URLSearchParams(prev);
                            params.set('requestId', mappedJobId);
                            return params;
                        });
                    }
                })
                .catch(err => console.error("CustomerMessages: Failed to map conversation to job:", err));
        }
    }, [urlConversationId, activeRequest, setSearchParams]);

    useEffect(() => {
        const urlId = searchParams.get('conversationId');
        if (urlId) {
            setConversationId(urlId);
        } else if (activeRequest?.conversation_id) {
            setConversationId(activeRequest.conversation_id);
        } else if (activeRequest?.id) {
             const proId = activeRequest.professional || activeRequest.assigned_to;
             if (proId) {
                 // Fallback for new jobs without conversation_id cached yet
                 getOrCreateConversation(proId, activeRequest.id)
                    .then(conv => setConversationId(conv.id))
                    .catch(err => console.error("CustomerMessages: Sync error", err));
             }
        }
    }, [activeRequestId, activeRequest?.conversation_id, activeRequest?.professional, activeRequest?.assigned_to, searchParams.get('conversationId')]);

    // Polling for messages
    useEffect(() => {
        if (!conversationId) return;

        const fetchMessages = async () => {
            try {
                const list = await getMessages(conversationId);
                setMessages(prev => {
                    if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
                    return list;
                });
                // Mark as read
                if (list.some(m => !m.is_read && m.sender !== user?.id)) {
                    markAsRead(conversationId);
                }
            } catch (err) {
                console.error("CustomerMessages: Polling error", err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [conversationId, user?.id]);

    // Auto-scroll to bottom (most recent message)
    useEffect(() => {
        if (conversationId && messages.length > 0) {
            const timer = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages, conversationId]);

    // Debug activeRequest changes
    useEffect(() => {
        if (urlRequestId || urlConversationId || urlMessageSessionId) {
            console.log("CustomerMessages: Deep-linking detected", {
                activeRequest: activeRequest?.id,
                urlRequestId,
                urlConversationId,
                urlMessageSessionId,
                hydratedRequestsCount: hydratedRequests.length
            });
        }
    }, [activeRequest?.id, urlRequestId, urlConversationId, urlMessageSessionId, hydratedRequests.length]);

    // Fetch details for active professional
    useEffect(() => {
        if (activeRequest?.professional_detail) {
            setActiveUserDetails(activeRequest.professional_detail);
        } else {
            const proId = activeRequest?.professional || activeRequest?.assigned_to;
            if (proId) {
                getUserDetails(proId).then(setActiveUserDetails).catch(console.error);
            }
        }
    }, [activeRequestId, activeRequest?.professional_detail]);

    const handleSelectRequest = (id: string) => {
        setSearchParams({ requestId: id });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = messageInput.trim();
        if (!text || !conversationId || isSending) return;

        try {
            setIsSending(true);
            setMessageInput(""); // Optimistic clear
            const newMsg = await sendMessage(conversationId, text);
            setMessages(prev => [...prev, newMsg]);
        } catch (error) {
            console.error("CustomerMessages: Send failed", error);
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const [showStatus, setShowStatus] = useState(false);

    const getStepStatus = (stepIndex: number, jobStatus: string) => {
        const s = jobStatus.toLowerCase();
        // Map all known backend statuses to the correct step index
        const statusToIndex: Record<string, number> = {
            'pending':    0, // Request Sent Current
            'accepted':   2, // Pro Accepted COMPLETE. Booking & Payment CURRENT
            'assigned':   2, 
            'booked':     3, // Booking COMPLETE. Work In Progress CURRENT
            'in_progress':3, // Work In Progress CURRENT
            'done':       4, // Work In Progress COMPLETE. Final Approval CURRENT
            'completed':  5,
            'cancelled':  -1,
        };
        const currentIndex = statusToIndex[s] ?? 0;
        
        if (currentIndex > stepIndex) return "completed";
        if (currentIndex === stepIndex) return "current";
        return "upcoming";
    };

    const jobSteps = [
        {
            title: "Request Sent",
            status: getStepStatus(0, activeRequest?.status || 'pending'),
            date: activeRequest?.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : "--"
        },
        {
            title: "Pro Accepted",
            status: getStepStatus(1, activeRequest?.status || 'pending')
        },
        {
            title: "Booking & Payment",
            status: getStepStatus(2, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'accepted' || activeRequest?.status === 'assigned',
            date: activeRequest?.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : null
        },
        {
            title: "Work In Progress",
            status: getStepStatus(3, activeRequest?.status || 'pending')
        },
        {
            title: "Final Approval",
            status: getStepStatus(4, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'done'
        }
    ];

    const formatTime = (dateInput: any) => {
        if (!dateInput) return "--:--";
        let dateStr = dateInput;
        if (typeof dateStr === 'object' && !(dateStr instanceof Date)) {
            // Explicit checks first
            dateStr = dateStr.created_at || dateStr.createdAt || dateStr.timestamp || dateStr.updated_at || dateStr.updatedAt;
            // Fallback key scanner
            if (!dateStr) {
                const keys = Object.keys(dateInput);
                const dateKey = keys.find(k => k.toLowerCase().includes('time') || k.toLowerCase().includes('date') || k.toLowerCase().includes('created'));
                if (dateKey) dateStr = dateInput[dateKey];
            }
        }
        if (!dateStr) return "?:??"; // Indicates no date field was found natively
        try {
            if (typeof dateStr === 'string' && dateStr.includes(' ') && !dateStr.includes('T')) {
                dateStr = dateStr.replace(' ', 'T');
            }
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "INV!"; // Indicates valid field found, but unparseable format
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return "ERR";
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-slate-950 font-display text-text-primary dark:text-white overflow-hidden transition-all duration-500">
            <CustomerNavbar />

            <main className="flex w-full h-full p-0 gap-0 flex-1 overflow-hidden items-stretch">

                {/* Left Column: Conversation List */}
                <div className={`
                    flex flex-col w-full md:w-80 lg:w-96 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shrink-0 transition-all duration-300
                    ${requestId ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-sm font-black flex items-center gap-2 tracking-tight">
                            <span className="material-symbols-outlined text-primary text-xl">forum</span>
                            Messages
                        </h3>
                        {userRequests.length > 0 && (
                            <div className="flex gap-2">
                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {userRequests.length} Total
                                    </span>
                                    {notifications.filter(n => !n.is_read).length > 0 && (
                                        <span className="bg-red-500 text-white text-[10px) font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                            {notifications.filter(n => !n.is_read).length} New
                                        </span>
                                    )}
                                </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-60">
                                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                                <p className="text-xs font-bold mt-3">Loading conversations...</p>
                            </div>
                        ) : hydratedRequests.length === 0 ? (
                            <div className="p-10 text-center space-y-3 opacity-40">
                                <span className="material-symbols-outlined text-4xl block">forum</span>
                                <p className="text-xs font-black uppercase tracking-widest">No conversation yet</p>
                                <p className="text-[10px] font-bold leading-relaxed">Request services from professionals to start chatting.</p>
                            </div>
                        ) : (
                            [...hydratedRequests].sort((a, b) => {
                                const aTime = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0).getTime();
                                const bTime = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0).getTime();
                                return bTime - aTime;
                            }).map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => handleSelectRequest(req.id)}
                                    className={`p-4 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 group ${activeRequestId === req.id ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            <div className="size-11 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                                                {req.professional_detail?.profile_picture || req.professional_detail?.profile_photo ? (
                                                    <img src={getImageUrl(req.professional_detail.profile_picture || req.professional_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                                )}
                                            </div>
                                            {notifications.some(n => n.link?.includes(req.id) && !n.is_read) && (
                                                <div className="absolute -top-1 -right-1 z-20">
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className={`text-sm tracking-tight truncate ${activeRequestId === req.id ? 'font-black text-primary' : 'font-bold'}`}>
                                                {(() => {
                                                    const detail = req.professional_detail;
                                                    if (!detail) return "Professional";
                                                    const first = detail.first_name || detail.user?.first_name;
                                                    const last = detail.last_name || detail.user?.last_name || "";
                                                    return first ? `${first} ${last}`.trim() : "Professional";
                                                })()}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5 uppercase font-medium tracking-wide">
                                                {req.description?.substring(0, 20)}...
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">
                                                {(req.created_at || req.createdAt) ? new Date(req.created_at || req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "--"}
                                            </span>
                                            {req.status === 'pending' && <span className="size-2 bg-primary rounded-full" />}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Middle Column: Chat Experience */}
                <div className={`
                    flex flex-col flex-1 bg-white dark:bg-slate-950 relative z-0 overflow-hidden
                    ${!requestId ? 'hidden md:flex' : 'flex'}
                `}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 p-10">
                            <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black tracking-tight text-text-primary dark:text-white">Connecting to chat...</h3>
                                <p className="text-sm font-medium text-text-secondary dark:text-gray-400 max-w-xs">
                                    Fetching your conversations securely.
                                </p>
                            </div>
                        </div>
                    ) : !activeRequest ? (
                        (() => {
                            const isDeepLinking = !!(urlRequestId || urlConversationId || urlMessageSessionId);
                            if (isDeepLinking) {
                                return (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 p-10 animate-in fade-in">
                                        <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black tracking-tight text-text-primary dark:text-white">Opening conversation...</h3>
                                            <p className="text-sm font-medium text-text-secondary dark:text-gray-400 max-w-xs">Connecting you with your professional.</p>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-12 animate-in fade-in zoom-in duration-700 bg-slate-50/50 dark:bg-slate-900/20">
                                    <div className="relative">
                                        <div className="size-32 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl shadow-primary/20 border border-slate-100 dark:border-slate-700 relative z-10">
                                            <span className="material-symbols-outlined text-6xl text-primary animate-pulse">forum</span>
                                        </div>
                                        <div className="absolute -top-2 -right-2 size-10 bg-primary rounded-full border-4 border-white dark:border-slate-900 shadow-lg z-20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-lg font-black">bolt</span>
                                        </div>
                                    </div>
                                    <div className="max-w-sm space-y-3">
                                        <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Select a Conversation</h3>
                                        <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                            Select a professional from your request list to view the project timeline and start a conversation.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs opacity-20 capitalize text-[10px] font-black tracking-widest text-slate-400">
                                        <div className="flex flex-col items-center gap-2"><span className="material-symbols-outlined">security</span>Secure</div>
                                        <div className="flex flex-col items-center gap-2"><span className="material-symbols-outlined">bolt</span>Fast</div>
                                        <div className="flex flex-col items-center gap-2"><span className="material-symbols-outlined">verified</span>Verified</div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100/60 dark:border-slate-800/50 bg-white/90 dark:bg-card-dark/90 backdrop-blur-xl sticky top-0 z-20 transition-all shadow-sm">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <button
                                        onClick={() => setSearchParams({})}
                                        className="md:hidden size-9 flex items-center justify-center text-slate-400 hover:text-primary transition-all bg-slate-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                                    </button>
                                    <div className="relative group cursor-pointer">
                                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-white dark:border-slate-700 shadow-md transform group-hover:scale-105 transition-transform overflow-hidden">
                                            {activeRequest.professional_detail?.profile_picture || activeRequest.professional_detail?.profile_photo ? (
                                                <img src={getImageUrl(activeRequest.professional_detail.profile_picture || activeRequest.professional_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined">person</span>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-[2.5px] border-white dark:border-slate-900 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-950" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <Link 
                                            to={`/customer/profile/${activeRequest.professional || activeRequest.assigned_to}`}
                                            className="hover:text-primary transition-colors cursor-pointer group/name flex items-center gap-1"
                                        >
                                            <h3 className="text-text-primary dark:text-white text-base font-black tracking-tight leading-none group-hover/name:text-primary transition-colors">
                                                {(() => {
                                                    const detail = activeUserDetails || activeRequest.professional_detail;
                                                    if (!detail) return "Professional";
                                                    const first = detail.first_name || detail.user?.first_name || detail.user_detail?.first_name;
                                                    const last = detail.last_name || detail.user?.last_name || detail.user_detail?.last_name || "";
                                                    return first ? `${first} ${last}`.trim() : "Professional";
                                                })()}
                                            </h3>
                                            <span className="material-symbols-outlined text-sm opacity-0 group-hover/name:opacity-100 transition-all -translate-x-1 group-hover/name:translate-x-0">chevron_right</span>
                                        </Link>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <span className="size-1.5 bg-green-500 rounded-full animate-blink" />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2">
                                    {(activeRequest.status === 'booked' || activeRequest.status === 'in_progress' || activeRequest.status === 'done' || activeRequest.status === 'completed') && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/20 animate-in fade-in zoom-in mr-2">
                                            <span className="material-symbols-outlined text-sm text-primary">call</span>
                                            <span className="text-xs font-black text-primary tracking-tight">
                                                {activeUserDetails?.phone || activeRequest.professional_detail?.phone || "+251 9XX XXX XXX"}
                                            </span>
                                        </div>
                                    )}
                                    <button className="size-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800/80 rounded-xl transition-all border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <span className="material-symbols-outlined text-xl">videocam</span>
                                    </button>
                                    <button className="size-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800/80 rounded-xl transition-all border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <span className="material-symbols-outlined text-xl">call</span>
                                    </button>
                                    <button
                                        onClick={() => setShowStatus(!showStatus)}
                                        className={`size-10 flex lg:hidden items-center justify-center rounded-xl transition-all border ${showStatus ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-primary/10 hover:text-primary'}`}
                                    >
                                        <span className="material-symbols-outlined text-xl">{showStatus ? 'close' : 'analytics'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 flex flex-col gap-6 relative scroll-smooth custom-scrollbar"
                                 style={{
                                    backgroundColor: '#efeae2', // Creamy Ivory
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000' stroke-width='0.4' stroke-linecap='round' opacity='0.09'%3E%3C!-- Bear Face --%3E%3Cpath d='M20 20a5 5 0 1110 0 5 5 0 01-10 0zM18 16a2 2 0 114 0 2 2 0 01-4 0zM28 16a2 2 0 114 0 2 2 0 01-4 0zM23 21a1 1 0 112 0 1 1 0 01-2 0z'/%3E%3C!-- Heart --%3E%3Cpath d='M60 30c-2-2-5-2-7 0s-2 5 0 7l7 7 7-7c2-2 2-5 0-7s-5-2-7 0z'/%3E%3C!-- Sparkle --%3E%3Cpath d='M100 20l2 4 4 2-4 2-2 4-2-4-4-2 4-2z'/%3E%3C!-- Small Paw --%3E%3Ccircle cx='140' cy='30' r='3'/%3E%3Ccircle cx='136' cy='24' r='1.5'/%3E%3Ccircle cx='140' cy='22' r='1.5'/%3E%3Ccircle cx='144' cy='24' r='1.5'/%3E%3C!-- Chat Bubble --%3E%3Cpath d='M30 80a5 5 0 0110 0v5l-3-2-2 2z'/%3E%3C!-- Flower --%3E%3Ccircle cx='80' cy='80' r='2'/%3E%3Cpath d='M80 76a2 2 0 110 4 2 2 0 010-4zM84 80a2 2 0 11-4 0 2 2 0 014 0zM80 84a2 2 0 110-4 2 2 0 010 4zM76 80a2 2 0 114 0 2 2 0 01-4 0z'/%3E%3C!-- Star --%3E%3Cpath d='M120 70l2 5h5l-4 3 1 5-4-3-4 3 1-5-4-3h5z'/%3E%3C!-- Bone/Tool --%3E%3Cpath d='M160 80h10M158 78c1-2 3-2 4 0l-4 4zM172 78c-1-2-3-2-4 0l4 4z'/%3E%3C!-- More Hearts/Sparkles --%3E%3Cpath d='M40 130c-1-1-2.5-1-3.5 0s-1 2.5 0 3.5l3.5 3.5 3.5-3.5c1-1 1-2.5 0-3.5s-2.5-1-3.5 0z'/%3E%3Cpath d='M90 120l1 3 3 1-3 1-1 3-1-3-3-1 3-1z'/%3E%3Cpath d='M140 140c-2-2-4-2-6 0s-2 4 0 6 4 2 6 0 2-4 0-6z'/%3E%3C/g%3E%3C/svg%3E")`,
                                    backgroundSize: '240px 240px',
                                    backgroundAttachment: 'local'
                                 }}>
                                <div className="flex justify-center mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-5 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                                        Secure Channel Started • {(activeRequest.created_at || activeRequest.createdAt) ? new Date(activeRequest.created_at || activeRequest.createdAt).toLocaleDateString() : "Just Now"}
                                    </span>
                                </div>

                                {/* Real Message Thread */}
                                <div className="flex flex-col gap-4 py-4 min-h-full">
                                    {/* Virtual Message: Original Request Description (Customer View: Right/Outgoing) */}
                                    <div className="flex justify-end animate-in fade-in slide-in-from-right-4">
                                        <div className="flex flex-col items-end gap-1.5 max-w-[80%] md:max-w-[70%] group">
                                            <div className="relative text-sm font-medium leading-relaxed rounded-[20px] rounded-tr-none px-4 py-3 bg-primary text-white shadow-lg shadow-primary/10 border border-primary/20 transition-all hover:shadow-xl">
                                                <div className="pr-12 md:pr-14">
                                                    {activeRequest.description || "Hello! I'd like to request your services."}
                                                </div>
                                                <div className="absolute bottom-1 right-3 flex items-center gap-1 opacity-70 text-[9px] font-bold tracking-tight select-none">
                                                    {formatTime(activeRequest)}
                                                    <span className="material-symbols-outlined text-[10px] font-black">done_all</span>
                                                </div>
                                            </div>
                                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mr-2 opacity-0 group-hover:opacity-100 transition-opacity">Initial Request</span>
                                        </div>
                                    </div>

                                    {/* Virtual Message: Pro Acceptance (Customer View: Left) */}
                                    {activeRequest.status !== 'pending' && (
                                        <div className="flex items-end gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-left-4 duration-500 group">
                                            <div className="size-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-1">
                                                {activeRequest.professional_detail?.profile_picture || activeRequest.professional_detail?.profile_photo ? (
                                                    <img src={getImageUrl(activeRequest.professional_detail.profile_picture || activeRequest.professional_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-primary text-base font-black">construction</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1 text-left">
                                                <div className="relative text-sm font-medium leading-relaxed rounded-[20px] rounded-tl-none px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md border border-slate-100 dark:border-slate-700 transition-all hover:shadow-lg">
                                                    <div className="pr-10 md:pr-12">
                                                        {activeRequest.status === 'accepted' || activeRequest.status === 'assigned' || activeRequest.status === 'booked'
                                                            ? `Hello! I've reviewed your request and I'm happy to help. I've accepted the project!`
                                                            : activeRequest.status === 'done' || activeRequest.status === 'completed'
                                                            ? "I've finished the job! Please review the work and approve the payment when you're ready."
                                                            : "The job has been updated to: " + activeRequest.status}
                                                    </div>
                                                    <div className="absolute bottom-1 right-3 opacity-40 text-[9px] font-bold tracking-tight select-none">
                                                        {formatTime(activeRequest.updated_at || activeRequest.updatedAt || activeRequest)}
                                                    </div>
                                                </div>
                                                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest ml-2 opacity-0 group-hover:opacity-100 transition-opacity">Professional Action</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message History */}
                                    {messages.map((msg, i) => {
                                        const isMe = msg.sender === user?.id || msg.is_me;
                                        return (
                                            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2.5'} animate-in fade-in slide-in-from-bottom-2`}>
                                                {!isMe && (
                                                    <div className="size-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-1 transition-transform hover:scale-105">
                                                         {activeRequest.professional_detail?.profile_picture ? (
                                                            <img src={getImageUrl(activeRequest.professional_detail.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-xs">person</span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className={`relative max-w-[75%] md:max-w-[65%] px-4 py-2.5 shadow-md transition-all hover:shadow-lg ${
                                                    isMe 
                                                    ? 'bg-primary text-white rounded-[18px] rounded-tr-none shadow-primary/5' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-[18px] rounded-tl-none shadow-slate-100/5'
                                                }`}>
                                                    <div className="pr-12 md:pr-14">
                                                        <p className="text-sm font-medium leading-relaxed break-words">{msg.body || msg.text || msg.content}</p>
                                                    </div>
                                                    <div className={`absolute bottom-1 right-3 flex items-center gap-1 text-[9px] font-bold tracking-tight select-none ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                        {formatTime(msg)}
                                                        {isMe && <span className="material-symbols-outlined text-[10px] font-black">{msg.is_read || msg.isRead ? 'done_all' : 'done'}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Messaging Input with WhatsApp Clean UI */}
                             <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 pb-6">
                                 <div className="flex items-center gap-2 max-w-5xl mx-auto">
                                     <div className="flex-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 ring-1 ring-slate-200/50 dark:ring-slate-700 shadow-sm focus-within:bg-white dark:focus-within:bg-slate-800 transition-all focus-within:ring-primary/20">
                                         <button type="button" className="text-slate-400 hover:text-primary transition-all p-1">
                                             <span className="material-symbols-outlined text-2xl">sentiment_satisfied</span>
                                         </button>
                                         <input
                                             className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 dark:text-white placeholder-slate-400 outline-none py-2 px-2"
                                             placeholder="Message..."
                                             type="text"
                                             value={messageInput}
                                             onChange={(e) => setMessageInput(e.target.value)}
                                             disabled={isSending}
                                         />
                                         <button type="button" className="text-slate-400 hover:text-primary transition-all p-1">
                                             <span className="material-symbols-outlined text-2xl">attachment</span>
                                         </button>
                                     </div>
                                     <button
                                         type="submit"
                                         className="size-11 flex items-center justify-center bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                         disabled={!messageInput.trim() || isSending || !conversationId}
                                     >
                                         {isSending ? (
                                             <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
                                         ) : (
                                             <span className="material-symbols-outlined text-xl ml-1">send</span>
                                         )}
                                     </button>
                                 </div>
                             </form>
                        </>
                    )}
                </div>

                {/* Right Column: Project Insights */}
                <div className={`
                    ${showStatus ? 'fixed inset-0 z-[60] flex bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm p-6 animate-in fade-in slide-in-from-right duration-300' : 'hidden'} 
                    xl:relative xl:inset-auto xl:z-0 xl:flex xl:bg-white xl:dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 xl:p-0 
                    w-full xl:w-80 2xl:w-96 flex-col gap-0 overflow-y-auto custom-scrollbar pr-0 shrink-0
                `}>
                    {showStatus && (
                        <button
                            onClick={() => setShowStatus(false)}
                            className="xl:hidden absolute top-6 right-6 size-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-lg z-[70] border-2 border-white dark:border-slate-700"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                    {activeRequest ? (
                        <>
                            {/* Stepper */}
                            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 p-8">
                                <h3 className="text-sm font-black text-text-primary dark:text-white uppercase tracking-[0.15em] mb-10 text-center">Project Timeline</h3>

                                <div className="relative flex flex-col gap-12">
                                    <div className="absolute left-[11px] top-6 bottom-6 w-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                    {jobSteps.map((step, index) => {
                                        const isCompleted = step.status === 'completed';
                                        const isCurrent = step.status === 'current';

                                        return (
                                            <div key={index} className={`flex gap-6 relative group transition-all duration-500 ${!isCompleted && !isCurrent ? 'opacity-40 grayscale' : ''}`}>
                                                <div className="relative shrink-0 z-10">
                                                    {isCompleted ? (
                                                        <div className="size-[26px] bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/40 ring-4 ring-white dark:ring-slate-900">
                                                            <span className="material-symbols-outlined text-sm font-black">check</span>
                                                        </div>
                                                    ) : isCurrent ? (
                                                        <div className="size-[26px] bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/40 ring-4 ring-white dark:ring-slate-900">
                                                            <div className="size-2.5 bg-white rounded-full animate-ping" />
                                                        </div>
                                                    ) : (
                                                        <div className="size-[26px] bg-slate-200 dark:bg-slate-700 rounded-full ring-4 ring-white dark:ring-slate-900" />
                                                    )}
                                                </div>

                                                <div className="flex flex-col flex-1 gap-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-sm font-black tracking-tight ${isCurrent ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {step.title}
                                                        </span>
                                                        {step.date && <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">{step.date}</span>}
                                                    </div>
                                                    <span className={`text-[11px] font-bold ${isCurrent ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                                                        {isCompleted ? 'Phase Finalized' : isCurrent ? 'Active Phase • action required' : 'Future Milestone'}
                                                    </span>

                                                    {isCurrent && step.actionRequired && (
                                                        <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                            <p className="text-[10px] font-black text-primary leading-snug">
                                                                {activeRequest.status === 'accepted' || activeRequest.status === 'assigned'
                                                                    ? "The professional has accepted! Pay now to secure your booking in escrow."
                                                                    : "The professional has finished the work. Please review and approve to finalize the project."}
                                                            </p>
                                                            {activeRequest.status === 'accepted' || activeRequest.status === 'assigned' ? (
                                                                <button 
                                                                    onClick={() => navigate('/customer/checkout/' + activeRequestId)}
                                                                    className="w-full py-2 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">payments</span>
                                                                    Book & Pay Escrow
                                                                </button>
                                                            ) : (
                                                                <div className="flex flex-col gap-2">
                                                                    <button 
                                                                        onClick={() => updateJobStatus(activeRequestId, 'completed')}
                                                                        className="w-full py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center gap-2"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">verified</span>
                                                                        Approve Job Done
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => alert("Report submitted. Our team will review this issue.")}
                                                                        className="w-full py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">flag</span>
                                                                        Report an Issue
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>


                                                    )}
                                                    {isCurrent && activeRequest.status === 'completed' && (
                                                        <div className="mt-3">
                                                            <button 
                                                                onClick={() => alert("Opening Reviews...")}
                                                                className="w-full py-2 bg-white border border-slate-200 text-text-primary text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-sm text-amber-400">star</span>
                                                                Leave a Review
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Job Details */}
                            <div className="max-w-lg mx-auto w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xl shadow-slate-200/50 dark:shadow-none animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 bg-primary rounded-full animate-pulse" />
                                        <h3 className="text-[10px] font-black text-text-primary dark:text-white uppercase tracking-[0.2em]">Job Details</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 tracking-widest">VERIFIED</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 italic">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                            "{activeRequest.description || "Project request details..."}"
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">Your Location</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                                    {activeRequest.address || activeRequest.location || "Addis Ababa"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span className="material-symbols-outlined text-green-500 text-xl">payments</span>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">Estimated Budget</p>
                                                <p className="text-sm font-black text-green-600 dark:text-green-400">
                                                    {activeRequest.budget || "TBD"} ETB
                                                </p>
                                            </div>
                                        </div>
                                        {(activeRequest.scheduled_at || activeRequest.preferredDate) && (
                                            <div className="flex items-center gap-4 px-4 py-3 bg-primary/5 rounded-xl border border-primary/10">
                                                <span className="material-symbols-outlined text-primary text-xl">event_available</span>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">Scheduled For</p>
                                                    <p className="text-sm font-black text-primary">
                                                        {new Date(activeRequest.scheduled_at || activeRequest.preferredDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Escrow Banner */}
                            <div className="bg-slate-900 dark:bg-primary/20 p-5 rounded-2xl flex gap-4 overflow-hidden relative shadow-lg shadow-slate-900/20">
                                <span className="material-symbols-outlined text-3xl text-primary shrink-0 opacity-80">verified_user</span>
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Safety Lock</h4>
                                    <p className="text-[11px] text-white/70 dark:text-white/80 font-bold leading-relaxed pr-2">
                                        Fix-Link holds payments in escrow until you confirm the job is 100% complete. Secure. Trusted. Verified.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-20 grayscale border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <span className="material-symbols-outlined text-8xl">analytics</span>
                            <p className="text-sm font-black uppercase tracking-widest">Project Insights Disabled</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CustomerMessages;
