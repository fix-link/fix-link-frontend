import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useAuth } from '../../../context/AuthContext';
import { updateJobStatus } from '../../../api/jobs.api';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';
import { sendMessage, getOrCreateConversation, getConversationById } from '../../../api/conversations.api';
import { useConversationMessageSync } from '../../../hooks/useConversationMessageSync';
import { useData } from '../../../context/DataContext';
import { 
    Inbox, 
    RefreshCw, 
    Clock, 
    User, 
    Activity, 
    Cpu, 
    ArrowLeft, 
    X, 
    BarChart2, 
    MoreVertical, 
    ShieldCheck, 
    Check, 
    Circle, 
    Zap, 
    MapPin, 
    CreditCard, 
    Calendar, 
    Paperclip, 
    Send,
    CheckCheck,
    Flag,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import DisputeModal from '../../../components/DisputeModal';

const ProfessionalMessages = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [professionalRequests, setProfessionalRequests] = useState<any[]>([]);
    const [activeUserDetails, setActiveUserDetails] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [showStatus, setShowStatus] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showCustomerProfile, setShowCustomerProfile] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { jobs, notifications, jobsLoading, notificationsLoading, refreshJobs } = useData();

    // Prevent blocking UI flash during background context polling
    const isLoading = (jobsLoading || notificationsLoading) && jobs.length === 0;

    useEffect(() => {
        const userId = (user as any)?.user?.id || user?.id;
        const proId = (user as any)?.id;

        if (!userId) {
            setProfessionalRequests([]);
            return;
        }

        const myRequests = jobs.filter((job: any) =>
            job.assigned_to === userId || job.assigned_to === proId || 
            job.professional === userId || job.professional === proId
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

    useConversationMessageSync(
        conversationId,
        setMessages,
        (list) => {
            const userId = (user as any)?.user?.id || user?.id;
            const proId = (user as any)?.id;
            return list.some((m) => !m.is_read && m.sender !== userId && m.sender !== proId);
        }
    );

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
    }, [activeRequestId, activeRequest?.customer, activeRequest?.customer_detail]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            alert(t('common.failed_send_message'));
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
        setIsUpdatingStatus('accepted');
        try {
            console.log("ProfessionalMessages: ATTEMPTING ACCEPT for ID:", activeRequestId);
            const updated = await updateJobStatus(activeRequestId, 'accepted');
            console.log("ProfessionalMessages: ACCEPT SUCCESS response:", updated);
            
            const updatedRequests = (prev: any[]) => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'accepted' } : r
            );
            
            setProfessionalRequests(updatedRequests);
            setHydratedRequests(updatedRequests);
            await refreshJobs(true);
            
            console.log("ProfessionalMessages: State updated to 'accepted'");
        } catch (error: any) {
            console.error("ProfessionalMessages: ACCEPT FAILURE:", error);
            alert(t('common.failed_accept', { error: error.message }));
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const getStepStatus = (index: number, currentStatus: string) => {
        const statusMap: Record<string, number> = {
            'pending':      1, // Active: Accept Assignment
            'accepted':     2, // Active: Customer Booking
            'booked':       3, // Active: Start Working
            'in_progress':  4, // Active: Mark Finished
            'done':         5, // Active: Final Approval
            'completed':    6,
            'cancelled':   -1,
        };
        const currentIndex = statusMap[currentStatus.toLowerCase()] ?? 0;
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'upcoming';
    };

    const jobSteps = [
        {
            title: t('common.request_received'),
            status: getStepStatus(0, activeRequest?.status || 'pending'),
            date: activeRequest?.created_at ? new Date(activeRequest.created_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : null
        },
        {
            title: t('common.accept_assignment'),
            status: getStepStatus(1, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'pending'
        },
        {
            title: t('common.customer_booking'),
            status: getStepStatus(2, activeRequest?.status || 'pending'),
            date: activeRequest?.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : null
        },
        {
            title: t('common.start_working'),
            status: getStepStatus(3, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'booked'
        },
        {
            title: t('common.mark_finished'),
            status: getStepStatus(4, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'in_progress'
        },
        {
            title: t('common.final_approval'),
            status: getStepStatus(5, activeRequest?.status || 'pending')
        }
    ];

    const handleStartJob = async () => {
        if (!activeRequestId) return;
        setIsUpdatingStatus('in_progress');
        try {
            await updateJobStatus(activeRequestId, 'in_progress');
            const updated = (prev: any[]) => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'in_progress' } : r
            );
            setProfessionalRequests(updated);
            setHydratedRequests(updated);
            await refreshJobs(true);
        } catch (error: any) {
            alert(t('common.failed_start_job', { error: error.message }));
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handleMarkDone = async () => {
        if (!activeRequestId) return;
        setIsUpdatingStatus('done');
        try {
            await updateJobStatus(activeRequestId, 'done');
            setProfessionalRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'done' } : r
            ));
            setHydratedRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'done' } : r
            ));
            await refreshJobs(true);
        } catch (error: any) {
            alert(t('common.failed_mark_done', { error: error.message }));
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handleDecline = async () => {
        if (!activeRequestId) return;
        setIsUpdatingStatus('cancelled');
        try {
            await updateJobStatus(activeRequestId, 'cancelled');
            setProfessionalRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'cancelled' } : r
            ));
            setHydratedRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, status: 'cancelled' } : r
            ));
            await refreshJobs(true);
        } catch (error: any) {
            alert(t('common.failed_decline', { error: error.message }));
        } finally {
            setIsUpdatingStatus(null);
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
        <div className="flex h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-hidden transition-all duration-500 relative">
            {/* Background decorative blobs - matching customer dashboard */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>
            <div className="fixed top-[30%] left-[20%] w-[30%] h-[30%] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:4s]"></div>

            <Sidebar />

            <div className="flex flex-col flex-1 overflow-hidden lg:ml-64 relative z-10">
                <Header />

                <main className="flex w-full flex-1 overflow-hidden items-stretch p-3 md:p-4 lg:p-4 gap-4 md:gap-4 animate-fade-in-up">
                    {/* Left Column: Conversation List */}
                        <div className={`
                        flex flex-col w-full md:w-56 lg:w-60 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-xl shrink-0 transition-all duration-300 overflow-hidden
                        ${requestId ? 'hidden md:flex' : 'flex'}
                    `}>
                        <div className="p-5 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/40">
                            <h3 className="text-lg font-black flex items-center gap-3 tracking-tighter text-slate-900 dark:text-white">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner border border-primary/5">
                                    <Inbox size={20} className="text-primary" />
                                </div>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">{t('common.jobs')}</span>
                            </h3>
                            {professionalRequests.length > 0 && (
                                <div className="flex gap-2">
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50">
                                        {professionalRequests.length}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-60 py-20">
                                    <div className="size-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                                        <RefreshCw size={32} className="animate-spin text-primary" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">{t('common.syncing_data')}</p>
                                </div>
                            ) : hydratedRequests.length === 0 ? (
                                <div className="py-20 text-center space-y-4 opacity-40">
                                    <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <Clock size={40} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black uppercase tracking-widest">{t('common.no_active_leads')}</p>
                                        <p className="text-[9px] font-bold max-w-[200px] mx-auto opacity-60">{t('common.new_requests_appear_here')}</p>
                                    </div>
                                </div>
                            ) : (
                                [...hydratedRequests].sort((a, b) => {
                                    const aTime = new Date(a.updated_at || a.updatedAt || a.created_at || a.createdAt || 0).getTime();
                                    const bTime = new Date(b.updated_at || b.updatedAt || b.created_at || b.createdAt || 0).getTime();
                                    return bTime - aTime;
                                }).map(req => {
                                    const isActive = activeRequestId === req.id;
                                    const hasUnread = notifications.some(n => n.link?.includes(req.id) && !n.is_read);
                                    
                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => handleSelectRequest(req.id)}
                                            className={`p-5 rounded-[2rem] cursor-pointer transition-all duration-500 group relative border
                                                ${isActive 
                                                    ? 'bg-white dark:bg-slate-800 border-primary shadow-2xl shadow-primary/10 scale-[1.02] z-10' 
                                                    : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-slate-800/40 hover:border-slate-100 dark:hover:border-slate-700/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <div className={`size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 transition-all duration-500 overflow-hidden ${isActive ? 'border-primary ring-8 ring-primary/5' : 'border-white dark:border-slate-700 shadow-sm group-hover:scale-110 group-hover:rotate-3'}`}>
                                                        {req.customer_detail?.profile_picture ? (
                                                            <img src={getImageUrl(req.customer_detail.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                                                <User size={20} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {hasUnread && (
                                                        <div className="absolute -top-1 -right-1 z-20">
                                                            <span className="relative flex h-4 w-4">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white dark:border-slate-900 shadow-lg"></span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={`text-[13px] tracking-tight truncate ${isActive ? 'font-black text-slate-900 dark:text-white' : 'font-black text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors'}`}>
                                                            {(() => {
                                                                const detail = req.customer_detail;
                                                                if (!detail) return "Customer Profile";
                                                                const first = detail.first_name || detail.user?.first_name;
                                                                const last = detail.last_name || detail.user?.last_name || "";
                                                                return first ? `${first} ${last}`.trim() : "Verified Customer";
                                                            })()}
                                                        </h4>
                                                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-60">
                                                            {(req.created_at || req.createdAt) ? new Date(req.created_at || req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "--"}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[11px] truncate leading-tight transition-colors ${isActive ? 'text-slate-500 dark:text-slate-400 font-bold' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500'}`}>
                                                        {req.description || t('common.job_details_hidden')}
                                                    </p>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border shadow-sm ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                                                            {req.status?.replace('_', ' ') || 'Syncing'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Middle Column: Messaging */}
                    <div className={`
                        flex flex-col flex-1 bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-100 dark:border-slate-800/50 shadow-xl relative z-0 overflow-hidden transition-all duration-500
                        ${!requestId ? 'hidden md:flex' : 'flex'}
                    `}>
                        {!activeRequest ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-10 p-12 animate-in fade-in zoom-in duration-1000">
                                <div className="relative">
                                    <div className="size-40 rounded-[3rem] bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl shadow-primary/20 border border-slate-100 dark:border-slate-700 relative z-10 overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent group-hover:scale-110 transition-transform duration-700" />
                                        <Activity size={80} className="text-primary animate-pulse" />
                                    </div>
                                    <div className="absolute -top-4 -right-4 size-14 bg-primary rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl z-20 flex items-center justify-center rotate-12 animate-bounce">
                                        <Cpu size={24} className="text-white" />
                                    </div>
                                </div>
                                <div className="max-w-md space-y-4">
                                    <h3 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white leading-tight">{t('common.professional')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">{t('common.command_center')}</span></h3>
                                    <p className="text-xs font-bold leading-relaxed text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] opacity-60">
                                        {t('common.select_conversation')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl sticky top-0 z-20 transition-all">
                                    <div className="flex items-center gap-5 md:gap-6">
                                        <button
                                            onClick={() => setSearchParams({})}
                                            className="md:hidden size-10 flex items-center justify-center text-slate-400 hover:text-primary transition-all bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div className="relative group cursor-pointer" onClick={() => setShowCustomerProfile(p => !p)}>
                                            <div className="size-14 rounded-[1.2rem] bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-white dark:border-slate-700 shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all overflow-hidden ring-8 ring-primary/5">
                                                {(activeUserDetails?.profile_picture || activeRequest.customer_detail?.profile_picture) ? (
                                                    <img src={getImageUrl(activeUserDetails?.profile_picture || activeRequest.customer_detail.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={28} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 border-[4px] border-white dark:border-slate-900 rounded-full shadow-lg" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-slate-900 dark:text-white text-xl font-black tracking-tight leading-none group-hover:text-primary transition-colors">
                                                {(() => {
                                                    const detail = activeUserDetails || activeRequest.customer_detail;
                                                    if (!detail) return t('common.customer');
                                                    const first = detail.first_name || detail.user?.first_name || detail.user_detail?.first_name;
                                                    const last = detail.last_name || detail.user?.last_name || detail.user_detail?.last_name || "";
                                                    return first ? `${first} ${last}`.trim() : t('common.verified_customer');
                                                })()}
                                            </h3>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                                                    <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                                                        {t('common.active_terminal')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowStatus(!showStatus)}
                                            className={`size-11 flex xl:hidden items-center justify-center rounded-[1rem] transition-all border shadow-xl ${showStatus ? 'bg-primary text-white border-primary shadow-primary/30' : 'text-slate-400 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 hover:bg-primary/10 hover:text-primary'}`}
                                        >
                                            {showStatus ? <X size={20} /> : <BarChart2 size={20} />}
                                        </button>
                                        <div className="relative" ref={moreMenuRef}>
                                            <button 
                                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                                className={`size-11 flex items-center justify-center rounded-[1rem] transition-all border shadow-xl ${showMoreMenu ? 'bg-primary text-white border-primary shadow-primary/30' : 'text-slate-400 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-700/50'}`}
                                            >
                                                <MoreVertical size={20} />
                                            </button>
                                            {showMoreMenu && (
                                                <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 z-[100]">
                                                    <div className="p-2">
                                                        <button 
                                                            onClick={() => {
                                                                setShowMoreMenu(false);
                                                                setIsDisputeModalOpen(true);
                                                            }}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all group"
                                                        >
                                                            <AlertTriangle size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                                                            {t('common.raise_dispute')}
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setShowMoreMenu(false);
                                                                alert(t('common.conversation_flagged_review'));
                                                            }}
                                                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-amber-500/5 hover:text-amber-500 rounded-xl transition-all group"
                                                        >
                                                            <AlertTriangle size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                                            {t('common.flag_chat')}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 flex flex-col gap-8 relative scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {/* Message History Thread */}
                                    <div className="flex flex-col gap-8 py-4 min-h-full">
                                        <div className="flex justify-center mb-10">
                                            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
                                                <ShieldCheck size={20} className="text-emerald-500" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                                                    {t('common.secure_chat_history')} • {formatTime(activeRequest.created_at || activeRequest.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Original Request (Left) */}
                                        <div className="flex justify-start animate-in fade-in slide-in-from-left-8 duration-700">
                                            <div className="flex items-end gap-4 max-w-[85%] md:max-w-[75%] group">
                                                <div className="size-10 rounded-[1rem] bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mb-1 ring-4 ring-slate-100 dark:ring-slate-900/50 transition-all group-hover:scale-110">
                                                    {activeUserDetails?.profile_picture || activeUserDetails?.profilePhoto ? (
                                                        <img src={getImageUrl(activeUserDetails.profile_picture || activeUserDetails.profilePhoto)} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={20} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="relative text-[14px] font-bold leading-relaxed rounded-[1.5rem] rounded-tl-none px-6 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xl border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-2xl">
                                                        <div className="pb-6 text-pretty whitespace-pre-wrap">
                                                            {activeRequest.description || t('common.new_job_requests_appear')}
                                                        </div>
                                                        <div className="absolute left-6 bottom-3 opacity-40 text-[9px] font-black tracking-widest uppercase select-none">
                                                            {formatTime(activeRequest)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Real Time Messages */}
                                        {messages.map((msg, i) => {
                                            const userId = (user as any)?.user?.id || user?.id;
                                            const proId = (user as any)?.id;
                                            const isMe = msg.sender === userId || msg.sender === proId || msg.is_me;
                                            return (
                                                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-4'} animate-in fade-in zoom-in slide-in-from-bottom-6 duration-500`}>
                                                    {!isMe && (
                                                        <div className="size-10 rounded-[1rem] bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mb-1 ring-4 ring-slate-100 dark:ring-slate-900/50 transition-all hover:scale-110">
                                                            {activeUserDetails?.profile_picture ? (
                                                                <img src={getImageUrl(activeUserDetails.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={24} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className={`relative max-w-[80%] md:max-w-[70%] px-6 py-4 transition-all group/msg shadow-xl ${
                                                        isMe 
                                                        ? 'bg-gradient-to-br from-primary via-primary-light to-primary-dark text-white rounded-[1.5rem] rounded-tr-none shadow-primary/20 border border-white/10' 
                                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-[1.5rem] rounded-tl-none'
                                                    }`}>
                                                        <div className="pb-6 text-pretty relative z-10 whitespace-pre-wrap">
                                                            <p className="text-[14px] font-bold leading-relaxed">{msg.body || msg.text || msg.content}</p>
                                                        </div>
                                                        <div className={`absolute inset-x-6 bottom-3 flex items-center justify-between text-[9px] font-black tracking-widest uppercase select-none relative z-10 gap-6 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                            <span>{formatTime(msg)}</span>
                                                            {isMe && (msg.is_read || msg.isRead ? <CheckCheck size={12} className="text-white/70" /> : <Check size={12} className="text-white/70" />)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                {/* Messaging Input */}
                                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-3 max-w-5xl mx-auto">
                                        <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-full px-5 py-1.5 ring-1 ring-slate-200/50 dark:ring-slate-700/50 focus-within:ring-primary/50 transition-all">
                                            <input
                                                className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-medium text-slate-700 dark:text-white placeholder-slate-400 outline-none py-2.5"
                                                placeholder={t('common.type_message')}
                                                type="text"
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                disabled={isSending}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="size-12 flex items-center justify-center bg-primary text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 group"
                                            disabled={!messageInput.trim() || isSending || !conversationId}
                                        >
                                            {isSending ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>

                    {/* Right Column: Timeline & Details */}
                    <div className={`
                        ${showStatus ? 'fixed inset-0 z-[60] flex bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl p-6 animate-in fade-in slide-in-from-right-8 duration-700' : 'hidden'} 
                        xl:relative xl:inset-auto xl:z-0 xl:flex bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-xl
                        w-full xl:w-64 2xl:w-72 flex-col gap-0 overflow-hidden shrink-0 min-h-0
                    `}>
                        {showStatus && (
                            <button
                                onClick={() => setShowStatus(false)}
                                className="xl:hidden absolute top-8 right-8 size-14 bg-white dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xl z-[70] border border-slate-200/50 dark:border-slate-700/50"
                            >
                                <X size={24} />
                            </button>
                        )}
                        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-8">
                            {activeRequest ? (
                                <>
                                    {/* Action Status Card */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Zap size={20} className="text-primary" />
                                            </div>
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">{t('common.project_journey')}</h3>
                                        </div>

                                        <div className="space-y-8 relative">
                                            {/* Timeline Connector Line */}
                                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800/50" />

                                            {jobSteps.map((step, idx) => (
                                                <div key={idx} className="relative flex gap-6 group">
                                                    <div className={`size-10 rounded-xl shrink-0 flex items-center justify-center z-10 transition-all duration-500 border-4 border-white dark:border-slate-900 shadow-xl
                                                        ${step.status === 'completed' ? 'bg-emerald-500 text-white' : 
                                                          step.status === 'current' ? 'bg-primary text-white animate-pulse ring-4 ring-primary/20' : 
                                                          'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}
                                                    `}>
                                                            {step.status === 'completed' ? <Check size={16} /> : 
                                                             step.status === 'current' ? <RefreshCw size={16} className="animate-spin" /> : 
                                                             <Circle size={16} />}
                                                    </div>
                                                    <div className="flex-1 pt-0.5 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-[13px] font-black tracking-tight ${step.status === 'upcoming' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
                                                                {step.title}
                                                            </p>
                                                            {step.date && <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">{step.date}</span>}
                                                        </div>
                                                        {step.actionRequired && step.status === 'current' && (
                                                            <div className="bg-primary/5 rounded-[1.2rem] border border-primary/10 p-5 space-y-4 animate-in zoom-in slide-in-from-top-4 duration-500">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/80 leading-relaxed">
                                                                    {activeRequest.status === 'pending' ? t('common.accept_job_start_working') :
                                                                     activeRequest.status === 'booked' ? t('common.customer_confirmed_start') :
                                                                     activeRequest.status === 'in_progress' ? t('common.working_on_job_mark_done') :
                                                                     t('common.finalizing_job')}
                                                                </p>                                                                 <div className="flex flex-col gap-2">
                                                                    {activeRequest.status === 'pending' && (
                                                                        <div className="flex gap-2">
                                                                            <button onClick={handleAccept} disabled={isUpdatingStatus !== null} className="flex-1 py-3 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                                {isUpdatingStatus === 'accepted' ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                                {t('common.accept')}
                                                                            </button>
                                                                            <button onClick={handleDecline} disabled={isUpdatingStatus !== null} className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-500 text-[10px] font-black rounded-xl uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:text-rose-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                                {isUpdatingStatus === 'cancelled' ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                                {t('common.decline')}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {activeRequest.status === 'booked' && (
                                                                        <button onClick={handleStartJob} disabled={isUpdatingStatus !== null} className="w-full py-3.5 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                            {isUpdatingStatus === 'in_progress' ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                            {t('common.start_job')}
                                                                        </button>
                                                                    )}
                                                                    {activeRequest.status === 'in_progress' && (
                                                                        <button onClick={handleMarkDone} disabled={isUpdatingStatus !== null} className="w-full py-3.5 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                                                            {isUpdatingStatus === 'done' ? <Loader2 size={12} className="animate-spin" /> : null}
                                                                            {t('common.finish_job')}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mission Details Card */}
                                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                                                <Zap size={20} className="text-accent-purple" />
                                            </div>
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">{t('common.project_snapshot')}</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic opacity-80">
                                                    "{activeRequest.description || t('common.job_details_pending')}"
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:border-primary/20 group">
                                                    <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center transition-all group-hover:scale-110">
                                                        <MapPin size={20} className="text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('common.location')}</p>
                                                        <p className="text-[13px] font-black text-slate-800 dark:text-white truncate">{activeRequest.address || activeRequest.city || t('common.addis_ababa_et')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:border-emerald-500/20 group">
                                                    <div className="size-10 rounded-xl bg-emerald-500/5 flex items-center justify-center transition-all group-hover:scale-110">
                                                        <CreditCard size={20} className="text-emerald-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t('common.project_budget')}</p>
                                                        <p className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">{activeRequest.budget ? `${t('common.etb')} ${activeRequest.budget}` : t('common.to_be_negotiated')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {activeRequest.scheduled_at && (
                                                <div className="p-4 bg-primary/5 rounded-[1.5rem] border border-primary/10 flex items-center gap-4 shadow-inner">
                                                    <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                        <Calendar size={20} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60 mb-0.5">{t('common.scheduled_date')}</p>
                                                        <p className="text-[13px] font-black text-primary">
                                                            {new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-20 grayscale transition-all duration-1000">
                                    <div className="size-32 rounded-[2.5rem] border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-5xl font-light">monitoring</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em]">{t('common.details_offline')}</p>
                                        <p className="text-[9px] font-bold max-w-[180px] mx-auto leading-relaxed">{t('common.select_job_see_details')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Customer Detail Card Modal */}
            {showCustomerProfile && activeRequest && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-10 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0" 
                        onClick={() => setShowCustomerProfile(false)}
                    />
                    <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        {/* Modal Header/Hero */}
                        <div className="p-10 pb-0 flex flex-col items-center text-center">
                            <div className="size-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                                {activeUserDetails?.profile_picture || activeRequest.customer_detail?.profile_picture ? (
                                    <img src={getImageUrl(activeUserDetails?.profile_picture || activeRequest.customer_detail.profile_picture)} alt="" className="size-full object-cover rounded-3xl" />
                                ) : (
                                    <User size={48} className="text-primary" />
                                )}
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                                {(() => {
                                    const detail = activeUserDetails || activeRequest.customer_detail;
                                    if (!detail) return t('common.valued_client');
                                    const first = detail.first_name || detail.user?.first_name || detail.user_detail?.first_name;
                                    const last = detail.last_name || detail.user?.last_name || detail.user_detail?.last_name || "";
                                    return first ? `${first} ${last}`.trim() : t('common.verified_customer');
                                })()}
                            </h2>
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-800">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.verified_identity')}</p>
                            </div>
                        </div>

                        <div className="p-10 space-y-10">
                            {/* Contact & Logistics Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.communication')}</p>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-800 dark:text-white">
                                            {(activeUserDetails || activeRequest.customer_detail)?.phonenumber || (activeUserDetails || activeRequest.customer_detail)?.phone || t('common.private_information')}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400">{(activeUserDetails || activeRequest.customer_detail)?.email || t('common.email_pending')}</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.project_location')}</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{activeRequest.address || activeRequest.city || "Addis Ababa, ET"}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.budget_estimate')}</p>
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                        {activeRequest.budget ? `${t('common.etb')} ${activeRequest.budget}` : t('common.to_be_negotiated')}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.target_date')}</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">
                                        {activeRequest.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { day: 'numeric', month: 'short' }) : t('common.not_scheduled_yet')}
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowCustomerProfile(false)}
                                className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                {t('common.close_detail')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <DisputeModal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                jobId={activeRequestId || ''}
                jobTitle={activeRequest?.service_title || activeRequest?.description || 'Job Request'}
                againstUserId={activeRequest?.customer || activeRequest?.requested_by || ''}
                onSuccess={() => {
                    alert("Dispute raised successfully. Our team will review it shortly.");
                }}
            />
        </div>
    );
};

export default ProfessionalMessages;
