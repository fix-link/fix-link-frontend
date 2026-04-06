import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useAuth } from '../../../context/AuthContext';
import { updateJobStatus } from '../../../api/jobs.api';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';
import { getMessages, sendMessage, getOrCreateConversation, markAsRead, getConversationById } from '../../../api/conversations.api';
import { useData } from '../../../context/DataContext';

const ProfessionalMessages = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [professionalRequests, setProfessionalRequests] = useState<any[]>([]);
    const [activeUserDetails, setActiveUserDetails] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { jobs, notifications, jobsLoading, notificationsLoading } = useData();

    // Prevent blocking UI flash during background context polling
    const isLoading = (jobsLoading || notificationsLoading) && jobs.length === 0;

    useEffect(() => {
        if (!user?.id) {
            setProfessionalRequests([]);
            return;
        }

        const myRequests = jobs.filter((job: any) =>
            job.assigned_to === user?.id || job.professional === user?.id
        );

        console.log("ProfessionalMessages: My Jobs:", myRequests);
        setProfessionalRequests(myRequests);
    }, [jobs, user?.id]);

    // Sidebar Hydration: Fetch details for ALL customers in the list
    const [hydratedRequests, setHydratedRequests] = useState<any[]>([]);

    useEffect(() => {
        const hydrate = async () => {
            if (jobsLoading) return;

            if (professionalRequests.length === 0) {
                setHydratedRequests([]);
                return;
            }

            const customerIds = Array.from(new Set(
                professionalRequests
                    .map(job => job.customer)
                    .filter(Boolean)
            )) as string[];

            const detailsById: Record<string, any> = {};
            await Promise.all(customerIds.map(async (customerId) => {
                try {
                    detailsById[customerId] = await getUserDetails(customerId);
                } catch (err) {
                    console.error("ProfessionalMessages: Failed to hydrate customer details:", customerId, err);
                    detailsById[customerId] = null;
                }
            }));

            const jobsWithDetails = professionalRequests.map((job) => ({
                ...job,
                customer_detail: job.customer_detail || detailsById[job.customer] || job.customer_detail,
            }));

            setHydratedRequests(jobsWithDetails);
        };
        hydrate();
    }, [professionalRequests, jobsLoading]);

    // Active Chat Hydration (for Header/Project info)
    const urlRequestId = searchParams.get('requestId');
    const urlConversationId = searchParams.get('conversationId');
    const urlMessageSessionId = searchParams.get('messageSessionId');

    const findActiveRequest = useCallback((id?: string) => {
        if (!id) return undefined;
        return hydratedRequests.find((r) => [
            r.id,
            r.conversation_id,
            r.message_session_id,
            r.job_id,
            r.request_id,
        ].includes(id));
    }, [hydratedRequests]);

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
                .catch(err => console.error("ProfessionalMessages: Failed to map conversation to job:", err));
        }
    }, [urlConversationId, activeRequest, setSearchParams]);

    useEffect(() => {
        const urlId = searchParams.get('conversationId');
        if (urlId) {
            setConversationId(urlId);
        } else if (activeRequest?.conversation_id) {
            setConversationId(activeRequest.conversation_id);
        } else if (activeRequest?.id) {
            // Need to get or create
            getOrCreateConversation(activeRequest.customer, activeRequest.id)
                .then(conv => setConversationId(conv.id))
                .catch(err => console.error("ProfessionalMessages: Sync error", err));
        }
    }, [activeRequestId, searchParams.get('conversationId')]);

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
                console.error("ProfessionalMessages: Polling error", err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [conversationId, user?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (conversationId && messages.length > 0) {
            const timer = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages, conversationId]);

    // Debugging active request matches
    useEffect(() => {
        if (activeRequest) {
            console.log("ProfessionalMessages: Active request identified:", activeRequest.id);
        }
    }, [activeRequest?.id]);

    // UseEffect to fetch customer details if missing
    useEffect(() => {
        if (activeRequest?.customer_detail) {
            setActiveUserDetails(activeRequest.customer_detail);
        } else if (activeRequest?.customer) {
            getUserDetails(activeRequest.customer).then(setActiveUserDetails).catch(console.error);
        }
    }, [activeRequestId, activeRequest?.customer_detail]);

    const [messageInput, setMessageInput] = useState("");
    const [showStatus, setShowStatus] = useState(false);
    const [showCustomerProfile, setShowCustomerProfile] = useState(false);

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
            console.error("ProfessionalMessages: Send failed", error);
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSelectRequest = (id: string) => {
        setSearchParams({ requestId: id });
    };

    const handleAccept = async () => {
        if (!activeRequestId) {
            console.error("ProfessionalMessages: No activeRequestId found for handleAccept");
            return;
        }
        try {
            console.log("ProfessionalMessages: ATTEMPTING ACCEPT for ID:", activeRequestId);
            const updated = await updateJobStatus(activeRequestId, 'accepted');
            console.log("ProfessionalMessages: ACCEPT SUCCESS response:", updated);
            
            // Force immediate UI reflection by updating all sets
            const updatedRequests = (prev: any[]) => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'accepted' } : r
            );
            
            setProfessionalRequests(updatedRequests);
            setHydratedRequests(updatedRequests);
            
            console.log("ProfessionalMessages: State updated to 'accepted'");
        } catch (error: any) {
            console.error("ProfessionalMessages: ACCEPT FAILURE:", error);
            alert("Failed to accept: " + error.message);
        }
    };

    const getStepStatus = (index: number, currentStatus: string) => {
        const statusMap: Record<string, number> = {
            'pending': 0,
            'accepted': 1,
            'booked': 2,
            'in_progress': 2,
            'done': 3,
            'completed': 4
        };
        const currentIndex = statusMap[currentStatus.toLowerCase()] || 0;
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'upcoming';
    };

    const jobSteps = [
        {
            title: "Request Received",
            status: getStepStatus(0, activeRequest?.status || 'pending'),
            date: activeRequest?.created_at ? new Date(activeRequest.created_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : null
        },
        {
            title: "Pro Ready",
            status: getStepStatus(1, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'pending'
        },
        {
            title: "Job Booked",
            status: getStepStatus(2, activeRequest?.status || 'pending'),
            date: activeRequest?.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : null
        },
        {
            title: "Work Finished",
            status: getStepStatus(3, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'booked' || activeRequest?.status === 'in_progress'
        },
        {
            title: "Paid & Released",
            status: getStepStatus(4, activeRequest?.status || 'pending')
        }
    ];

    const handleMarkDone = async () => {
        if (!activeRequestId) return;
        try {
            await updateJobStatus(activeRequestId, 'done');
            setProfessionalRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'done' } : r
            ));
            setHydratedRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'done' } : r
            ));
        } catch (error: any) {
            alert("Failed to mark as done: " + error.message);
        }
    };

    const handleDecline = async () => {
        if (!activeRequestId) return;
        try {
            await updateJobStatus(activeRequestId, 'cancelled');
            setProfessionalRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'cancelled' } : r
            ));
            setHydratedRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'cancelled' } : r
            ));
        } catch (error: any) {
            alert("Failed to decline: " + error.message);
        }
    };

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
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-display text-text-primary dark:text-white overflow-hidden">
            <Sidebar />

            <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
                <Header />

                <main className="flex w-full flex-1 overflow-hidden items-stretch p-0 gap-0">
                    {/* Left Sidebar: Conversation List */}
                    <div className={`
                        flex flex-col w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shrink-0 transition-all duration-300
                        ${requestId ? 'hidden md:flex' : 'flex'}
                    `}>
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-sm font-black flex items-center gap-2 tracking-tight">
                                <span className="material-symbols-outlined text-primary text-xl">inbox</span>
                                Requests
                            </h3>
                            {professionalRequests.length > 0 && (
                                <div className="flex gap-2">
                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {professionalRequests.length} Total
                                    </span>
                                    {notifications.filter(n => !n.is_read && (n.message?.toLowerCase().includes('request') || n.message?.toLowerCase().includes('job'))).length > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
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
                                    <p className="text-xs font-bold mt-3">Loading requests...</p>
                                </div>
                            ) : hydratedRequests.length === 0 ? (
                                <div className="p-10 text-center space-y-3 opacity-40">
                                    <span className="material-symbols-outlined text-4xl block">pending_actions</span>
                                    <p className="text-xs font-bold leading-relaxed">No requests yet.<br />Your profile is live and visible!</p>
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
                                                    {req.customer_detail?.profile_picture ? (
                                                        <img src={getImageUrl(req.customer_detail.profile_picture)} alt="" className="w-full h-full object-cover" />
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
                                                {req.status === 'pending' && <div className="absolute -top-0.5 -right-0.5 size-3 bg-primary rounded-full border-2 border-white dark:border-slate-900" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`text-sm tracking-tight truncate ${activeRequestId === req.id ? 'font-black text-primary' : 'font-bold'}`}>
                                                    {(() => {
                                                        const detail = req.customer_detail;
                                                        if (!detail) return "Customer";
                                                        const first = detail.first_name || detail.user?.first_name;
                                                        const last = detail.last_name || detail.user?.last_name || "";
                                                        return first ? `${first} ${last}`.trim() : "Customer";
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

                    {/* Middle Column: Messaging */}
                    <div className={`
                        flex flex-col flex-1 bg-white dark:bg-slate-950 relative z-0 overflow-hidden transition-all
                        ${!requestId ? 'hidden md:flex' : 'flex'}
                    `}>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 p-10">
                                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black tracking-tight text-text-primary dark:text-white">Connecting to chat...</h3>
                                    <p className="text-sm font-medium text-text-secondary dark:text-gray-400 max-w-xs">
                                        Fetching your requests securely.
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
                                                <p className="text-sm font-medium text-text-secondary dark:text-gray-400 max-w-xs">Connecting you with your customer.</p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-12 animate-in fade-in zoom-in duration-700 bg-slate-50/50 dark:bg-slate-900/20">
                                        <div className="relative">
                                            <div className="size-32 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl shadow-primary/20 border border-slate-100 dark:border-slate-700 relative z-10">
                                                <span className="material-symbols-outlined text-6xl text-primary animate-pulse">quick_reference_all</span>
                                            </div>
                                            <div className="absolute -top-2 -right-2 size-10 bg-primary rounded-full border-4 border-white dark:border-slate-900 shadow-lg z-20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-lg font-black">bolt</span>
                                            </div>
                                        </div>
                                        <div className="max-w-sm space-y-3">
                                            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Professional Inbox</h3>
                                            <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                                Select a customer request from the sidebar to view project requirements, address details, and start messaging.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100/60 dark:border-slate-800/50 bg-white/90 dark:bg-card-dark/90 backdrop-blur-xl sticky top-0 z-20 shadow-sm transition-all">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <button
                                            onClick={() => setSearchParams({})}
                                            className="md:hidden size-9 flex items-center justify-center text-slate-400 hover:text-primary transition-all bg-slate-50 dark:bg-slate-800 rounded-lg"
                                        >
                                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                                        </button>
                                        {/* Clickable customer identity */}
                                        <button
                                            onClick={() => setShowCustomerProfile(p => !p)}
                                            className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity"
                                        >
                                        <div className="relative group cursor-pointer">
                                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-white dark:border-slate-700 shadow-md transform group-hover:scale-105 transition-transform overflow-hidden">
                                                {(activeUserDetails?.profile_picture || activeRequest.customer_detail?.profile_picture) ? (
                                                    <img src={getImageUrl(activeUserDetails?.profile_picture || activeRequest.customer_detail.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined">person</span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-[2.5px] border-white dark:border-slate-900 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-950" />
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-left">
                                            <h3 className="text-text-primary dark:text-white text-base font-black tracking-tight leading-none">
                                                {(() => {
                                                    const detail = activeUserDetails || activeRequest.customer_detail;
                                                    if (!detail) return "Customer";
                                                    const first = detail.first_name || detail.user?.first_name || detail.user_detail?.first_name;
                                                    const last = detail.last_name || detail.user?.last_name || detail.user_detail?.last_name || "";
                                                    return first ? `${first} ${last}`.trim() : "Customer";
                                                })()}
                                            </h3>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <span className="size-1.5 bg-green-500 rounded-full animate-blink" />
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Online</span>
                                            </div>
                                        </div>
                                        </button>

                                        {/* Customer Mini-Profile Popup */}
                                        {showCustomerProfile && (() => {
                                            const detail = activeUserDetails || activeRequest.customer_detail;
                                            const photo = detail?.profile_picture || detail?.user?.profile_picture;
                                            const first = detail?.first_name || detail?.user?.first_name || "Customer";
                                            const last = detail?.last_name || detail?.user?.last_name || "";
                                            const fullName = `${first} ${last}`.trim();
                                            const email = detail?.email || detail?.user?.email;
                                            const phone = detail?.phonenumber || detail?.phone || detail?.user?.phonenumber;
                                            const location = detail?.city || detail?.location || detail?.user?.city;
                                            return (
                                                <div
                                                    className="absolute left-4 top-[4.5rem] z-[100] w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <div className="h-16 bg-gradient-to-r from-primary/30 to-primary/10 relative" />
                                                    <div className="px-5 pb-5 -mt-8">
                                                        <div className="size-16 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden bg-primary/10 flex items-center justify-center shadow-lg mb-3">
                                                            {photo ? (
                                                                <img src={getImageUrl(photo)} alt={fullName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-3xl text-primary">person</span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-black text-base text-slate-900 dark:text-white">{fullName}</h4>
                                                        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">Customer</p>
                                                        <div className="space-y-2">
                                                            {location && (
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                    <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                                                                    <span className="font-medium">{location}</span>
                                                                </div>
                                                            )}
                                                            {email && (
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                    <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                                                                    <span className="font-medium truncate">{email}</span>
                                                                </div>
                                                            )}
                                                            {phone && (
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                    <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                                                                    <span className="font-medium">{phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => setShowCustomerProfile(false)}
                                                            className="mt-4 w-full py-2 text-[11px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowStatus(!showStatus)}
                                            className={`size-10 flex lg:hidden items-center justify-center rounded-xl transition-all border ${showStatus ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-primary/10 hover:text-primary'}`}
                                        >
                                            <span className="material-symbols-outlined text-xl">{showStatus ? 'close' : 'analytics'}</span>
                                        </button>
                                        <button className="size-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
                                            <span className="material-symbols-outlined">more_vert</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Messaging Canvas */}
                                 <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 flex flex-col gap-6 relative scroll-smooth custom-scrollbar" 
                                      style={{ 
                                         backgroundColor: '#efeae2', // Creamy Ivory
                                         backgroundImage: `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000' stroke-width='0.4' stroke-linecap='round' opacity='0.09'%3E%3C!-- Bear Face --%3E%3Cpath d='M20 20a5 5 0 1110 0 5 5 0 01-10 0zM18 16a2 2 0 114 0 2 2 0 01-4 0zM28 16a2 2 0 114 0 2 2 0 01-4 0zM23 21a1 1 0 112 0 1 1 0 01-2 0z'/%3E%3C!-- Heart --%3E%3Cpath d='M60 30c-2-2-5-2-7 0s-2 5 0 7l7 7 7-7c2-2 2-5 0-7s-5-2-7 0z'/%3E%3C!-- Sparkle --%3E%3Cpath d='M100 20l2 4 4 2-4 2-2 4-2-4-4-2 4-2z'/%3E%3C!-- Small Paw --%3E%3Ccircle cx='140' cy='30' r='3'/%3E%3Ccircle cx='136' cy='24' r='1.5'/%3E%3Ccircle cx='140' cy='22' r='1.5'/%3E%3Ccircle cx='144' cy='24' r='1.5'/%3E%3C!-- Chat Bubble --%3E%3Cpath d='M30 80a5 5 0 0110 0v5l-3-2-2 2z'/%3E%3C!-- Flower --%3E%3Ccircle cx='80' cy='80' r='2'/%3E%3Cpath d='M80 76a2 2 0 110 4 2 2 0 010-4zM84 80a2 2 0 11-4 0 2 2 0 014 0zM80 84a2 2 0 110-4 2 2 0 010 4zM76 80a2 2 0 114 0 2 2 0 01-4 0z'/%3E%3C!-- Star --%3E%3Cpath d='M120 70l2 5h5l-4 3 1 5-4-3-4 3 1-5-4-3h5z'/%3E%3C!-- Bone/Tool --%3E%3Cpath d='M160 80h10M158 78c1-2 3-2 4 0l-4 4zM172 78c-1-2-3-2-4 0l4 4z'/%3E%3C!-- More Hearts/Sparkles --%3E%3Cpath d='M40 130c-1-1-2.5-1-3.5 0s-1 2.5 0 3.5l3.5 3.5 3.5-3.5c1-1 1-2.5 0-3.5s-2.5-1-3.5 0z'/%3E%3Cpath d='M90 120l1 3 3 1-3 1-1 3-1-3-3-1 3-1z'/%3E%3Cpath d='M140 140c-2-2-4-2-6 0s-2 4 0 6 4 2 6 0 2-4 0-6z'/%3E%3C/g%3E%3C/svg%3E")`,
                                         backgroundSize: '240px 240px',
                                         backgroundAttachment: 'local'
                                      }}>
                                     <div className="flex justify-center mb-2 sticky top-0 z-10 pointer-events-none">
                                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-5 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                                             Secure Chat Sync • {formatTime(activeRequest.created_at || activeRequest.createdAt)}
                                         </span>
                                     </div>

                                    {/* Inbound Summary Card */}
                                    <div className="max-w-lg mx-auto w-full bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800 pb-4">
                                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                                <span className="material-symbols-outlined text-xl">assignment_late</span>
                                                <h4 className="font-bold text-sm tracking-tight">Inbound Proposal</h4>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                ID-{activeRequest.id.substring(0, 6)}
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl italic">
                                                "{activeRequest.description}"
                                            </p>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                                    <span className="text-xs font-bold leading-tight truncate">
                                                        {activeRequest.address || activeRequest.city || activeRequest.subcity || activeRequest.location || "Addis Ababa"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                                    <span className="material-symbols-outlined text-sm">payments</span>
                                                    <span className="text-xs font-bold">
                                                        {activeRequest.budget ? `${activeRequest.budget} ETB` : "Budget TBD"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            {activeRequest.status === 'pending' ? (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleAccept}
                                                        className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-primary/30 hover:bg-primary/90"
                                                    >
                                                        Accept Request
                                                    </button>
                                                    <button
                                                        onClick={handleDecline}
                                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-red-50 hover:text-red-500"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            ) : (activeRequest.status === 'accepted' || activeRequest.status === 'assigned' || activeRequest.status === 'in_progress' || activeRequest.status === 'booked') ? (
                                                <button
                                                    onClick={handleMarkDone}
                                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                                                >
                                                    Mark Job Done
                                                </button>
                                            ) : (
                                                <div className={`py-3 text-center rounded-xl text-xs font-bold uppercase tracking-widest ${activeRequest.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    Status: {activeRequest.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message History Thread */}
                                    <div className="flex flex-col gap-4 py-4 min-h-full">
                                        {/* Original Request (Left) */}
                                        <div className="flex justify-start animate-in fade-in slide-in-from-left-4">
                                            <div className="flex items-end gap-2.5 max-w-[85%] group">
                                                <div className="size-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-1 transition-transform hover:scale-110">
                                                    {activeUserDetails?.profile_picture || activeUserDetails?.profilePhoto ? (
                                                        <img src={getImageUrl(activeUserDetails.profile_picture || activeUserDetails.profilePhoto)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-xs">person</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="relative text-sm font-medium leading-relaxed rounded-[18px] rounded-tl-none px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md border border-slate-100 dark:border-slate-700 transition-all hover:shadow-lg">
                                                        <div className="pr-10 md:pr-12">
                                                            {activeRequest.description || "I'd like to request your services."}
                                                        </div>
                                                        <div className="absolute bottom-1 right-3 text-[9px] font-bold tracking-tight select-none opacity-40">
                                                            {formatTime(activeRequest)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* System Notification: Acceptance (Right) */}
                                        {activeRequest.status !== 'pending' && (
                                            <div className="flex justify-end animate-in fade-in slide-in-from-right-4 duration-500 group">
                                                <div className="flex flex-col items-end gap-1 max-w-[80%] md:max-w-[70%]">
                                                    <div className="relative text-sm font-medium leading-relaxed rounded-[18px] rounded-tr-none px-4 py-3 bg-primary text-white shadow-lg shadow-primary/10 border border-primary/20 italic transition-all hover:shadow-xl">
                                                        <div className="pr-12 md:pr-14">
                                                            {activeRequest.status === 'accepted' || activeRequest.status === 'assigned' || activeRequest.status === 'booked'
                                                                ? `I've reviewed this request and accepted the project. Chatting with customer now!`
                                                                : activeRequest.status === 'done' || activeRequest.status === 'completed'
                                                                ? "I've marked this job as finished. Awaiting customer confirmation and payment."
                                                                : "Job status updated to: " + activeRequest.status}
                                                        </div>
                                                        <div className="absolute bottom-1 right-3 flex items-center gap-1 opacity-70 text-[9px] font-bold tracking-tight select-none">
                                                            {formatTime(activeRequest.updated_at || activeRequest.updatedAt || activeRequest)}
                                                            <span className="material-symbols-outlined text-[10px] font-black">done_all</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mr-2 opacity-0 group-hover:opacity-100 transition-opacity">System Notification</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Real Time Messages */}
                                        {messages.map((msg, i) => {
                                            const isMe = msg.sender === user?.id || msg.is_me;
                                            return (
                                                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-2.5'} animate-in fade-in slide-in-from-bottom-2`}>
                                                    {!isMe && (
                                                        <div className="size-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-1 transition-transform hover:scale-105">
                                                            {activeUserDetails?.profile_picture ? (
                                                                <img src={getImageUrl(activeUserDetails.profile_picture)} alt="" className="w-full h-full object-cover" />
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

                                {/* Send Bar with WhatsApp Clean UI */}
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
                                            disabled={!messageInput.trim() || isSending}
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
                    </div>                    {/* Right Sidebar: Timeline with Clean Look */}
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
                            <div className="flex flex-col gap-6">
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
                                                            {isCompleted ? 'Phase Finalized' : isCurrent ? 'Active Phase • Action required' : 'Future Milestone'}
                                                        </span>
    
                                                        {isCurrent && step.actionRequired && (
                                                            <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                                <p className="text-[10px] font-black text-primary leading-tight">
                                                                    {activeRequest.status === 'pending' ? "Review this request and accept to begin." : "Ready to finalize? Mark this job as done."}
                                                                </p>
                                                                {activeRequest.status === 'pending' ? (
                                                                    <button 
                                                                        onClick={handleAccept}
                                                                        className="w-full py-2.5 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">handshake</span>
                                                                        Accept Request
                                                                    </button>
                                                                ) : (activeRequest.status === 'booked' || activeRequest.status === 'in_progress') && (
                                                                    <button 
                                                                        onClick={handleMarkDone}
                                                                        className="w-full py-2.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                                                        Mark as Completed
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
    
                                {activeRequest?.status === 'completed' && (
                                    <div className="mt-8 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 animate-in zoom-in">
                                        <div className="flex items-center gap-2 mb-2 text-amber-600">
                                            <span className="material-symbols-outlined text-lg">payments</span>
                                            <h5 className="text-[10px] font-black uppercase tracking-widest">Payment Released</h5>
                                        </div>
                                        <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                            The customer approved the work! Your balance has been updated (+{activeRequest.budget || '1,500'} ETB).
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-20 grayscale border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <span className="material-symbols-outlined text-6xl">query_stats</span>
                                <p className="text-xs font-black uppercase tracking-widest">Pipeline Empty</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfessionalMessages;
