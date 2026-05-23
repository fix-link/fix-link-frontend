import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import CustomerNavbar from './components/CustomerNavbar';
import { useAuth } from '../../../context/AuthContext';
import { updateJobStatus } from '../../../api/jobs.api';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';
import { sendMessage, getOrCreateConversation, getConversationById } from '../../../api/conversations.api';
import { useConversationMessageSync } from '../../../hooks/useConversationMessageSync';
import { useData } from '../../../context/DataContext';
import {
  MessageSquare, User, ArrowLeft, ChevronRight, 
  Activity, X, CheckCheck, Check, Smile, Paperclip, Loader2, Send, 
  CheckCircle2, CreditCard, ShieldCheck, Star, MapPin, Calendar, 
  Shield, Zap, RefreshCw, MoreHorizontal,
  Mic, Image as ImageIcon, Sparkles, Flag, AlertTriangle
} from "lucide-react";
import DisputeModal from '../../../components/DisputeModal';
import ReviewModal from '../../../components/ReviewModal';

const CustomerMessages = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [userRequests, setUserRequests] = useState<any[]>([]);
    const [activeUserDetails, setActiveUserDetails] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { 
        jobs, 
        refreshJobs, 
        notifications, 
        notificationsLoading,
        jobsLoading,
        reviews,
        refreshReviews
    } = useData();
    const navigate = useNavigate();

    // Prevent blocking UI flash during background context polling
    const isLoading = (jobsLoading || notificationsLoading) && jobs.length === 0;

    useEffect(() => {
        if (!user?.id) {
            setUserRequests([]);
            return;
        }

        // Filter jobs that have an assigned professional to prevent empty placeholder chats for pending requests
        const myRequests = jobs.filter((job: any) => {
            const customerId = job.customer?.id || job.customer || job.customer_id || job.customer_detail?.id;
            const hasPro = !!(job.professional || job.assigned_to);
            return customerId === user?.id && hasPro;
        });

        console.log("CustomerMessages: My Requests:", myRequests);
        setUserRequests(myRequests);
    }, [jobs, user?.id]);

    // Sidebar Hydration: Fetch details for ALL professionals in the list
    const [hydratedRequests, setHydratedRequests] = useState<any[]>([]);
    const isHydrating = userRequests.length > 0 && hydratedRequests.length === 0;

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

    useConversationMessageSync(
        conversationId,
        setMessages,
        (list) => list.some((m) => !m.is_read && m.sender !== user?.id)
    );

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

    const [approvingJobId, setApprovingJobId] = useState<string | null>(null);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleVerifyAndPay = async (jobId: string) => {
        setApprovingJobId(jobId);
        try {
            await updateJobStatus(jobId, 'completed');
            await refreshJobs(true);
        } catch (error) {
            console.error("Failed to verify & pay:", error);
            alert("Failed to verify & pay. Please try again.");
        } finally {
            setApprovingJobId(null);
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
            title: t('common.request_sent'),
            status: getStepStatus(0, activeRequest?.status || 'pending'),
            date: activeRequest?.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : "--"
        },
        {
            title: t('common.pro_accepted'),
            status: getStepStatus(1, activeRequest?.status || 'pending')
        },
        {
            title: t('common.booking_payment'),
            status: getStepStatus(2, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'accepted' || activeRequest?.status === 'assigned',
            date: activeRequest?.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric'}) : null
        },
        {
            title: t('common.work_in_progress'),
            status: getStepStatus(3, activeRequest?.status || 'pending')
        },
        {
            title: t('common.final_approval'),
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
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white overflow-hidden transition-all duration-500 relative">
            {/* Background decorative blobs with animation */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:2s]"></div>
            <div className="fixed top-[20%] left-[10%] w-[30%] h-[30%] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none z-0 animate-blob [animation-delay:4s]"></div>

            <CustomerNavbar />

            <main className="flex w-full h-full p-4 md:p-6 gap-4 md:gap-6 flex-1 overflow-hidden items-stretch relative z-10 animate-fade-in-up">

                {/* Left Column: Conversation List */}
                <div className={`
                    flex flex-col w-full md:w-80 lg:w-96 glass-panel rounded-[32px] shrink-0 transition-all duration-300 overflow-hidden
                    ${requestId ? 'hidden md:flex' : 'flex'}
                `}>
                    <div className="p-6 border-b border-slate-100/50 dark:border-slate-800/50 flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3 tracking-tighter text-slate-900 dark:text-white">
                            <div className="size-11 rounded-[1.2rem] bg-primary/10 flex items-center justify-center shadow-inner">
                                <MessageSquare className="text-primary" size={24} />
                            </div>
                            <span className="text-gradient">{t('common.messages')}</span>
                        </h3>
                        {userRequests.length > 0 && (
                            <div className="flex gap-2">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50">
                                    {userRequests.length}
                                </span>
                                {notifications.filter(n => !n.is_read).length > 0 && (
                                    <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/30 animate-pulse">
                                        {t('common.new')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        {isLoading || isHydrating ? (
                            <div className="flex flex-col items-center justify-center h-full opacity-60">
                                <Loader2 size={36} className="animate-spin text-primary" />
                                <p className="text-xs font-bold mt-3">{t('common.loading_conversations')}</p>
                            </div>
                        ) : hydratedRequests.length === 0 ? (
                            <div className="p-10 text-center space-y-3 opacity-40">
                                <MessageSquare size={36} className="mx-auto" />
                                <p className="text-xs font-black uppercase tracking-widest mt-2">{t('common.no_conversation_yet')}</p>
                                <p className="text-[10px] font-bold leading-relaxed">{t('common.request_services_to_chat')}</p>
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
                                        className={`p-4 mx-3 my-2 rounded-2xl cursor-pointer transition-all duration-300 group relative ${isActive ? 'bg-white dark:bg-slate-800 shadow-glass-hover ring-1 ring-slate-200/50 dark:ring-slate-700 scale-[1.02] z-10' : 'hover:bg-white/50 dark:hover:bg-slate-800/50 hover:scale-[1.01] hover:shadow-glass'}`}
                                    >
                                        {isActive && <div className="absolute left-[-12px] top-1/4 bottom-1/4 w-1.5 bg-primary rounded-r-full shadow-[4px_0_12px_rgba(13,147,242,0.4)] animate-in slide-in-from-left duration-300"></div>}
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="relative shrink-0">
                                                <div className={`size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 transition-all duration-300 overflow-hidden ${isActive ? 'border-primary ring-4 ring-primary/10 scale-105' : 'border-white dark:border-slate-700 shadow-sm group-hover:scale-105'}`}>
                                                     {(() => {
                                                         const detail = req.professional_detail || req.assigned_to_detail;
                                                         if (!detail) return <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"><User size={24} className="text-slate-400" /></div>;
                                                         const pic = detail.profile_picture_url || detail.profile_picture || detail.profile_photo_url || detail.profile_photo || detail.user?.profile_picture_url || detail.user?.profile_photo_url;
                                                         return pic ? (
                                                             <img src={getImageUrl(pic)} alt="" className="w-full h-full object-cover" />
                                                         ) : (
                                                             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                                                 <User size={24} className="text-slate-400" />
                                                             </div>
                                                         );
                                                     })()}
                                                </div>
                                                {hasUnread && (
                                                    <div className="absolute -top-1 -right-1 z-20">
                                                        <span className="relative flex h-4 w-4">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-white dark:border-slate-900"></span>
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className={`text-sm tracking-tight truncate ${isActive ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors'}`}>
                                                         {(() => {
                                                             const detail = req.professional_detail || req.assigned_to_detail;
                                                             if (!detail) return "Professional";
                                                             const first = detail.first_name || detail.user?.first_name;
                                                             const last = detail.last_name || detail.user?.last_name || "";
                                                             return first ? `${first} ${last}`.trim() : "Professional";
                                                         })()}
                                                    </h4>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                        {(req.created_at || req.createdAt) ? new Date(req.created_at || req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "--"}
                                                    </span>
                                                </div>
                                                <p className={`text-[11px] truncate leading-tight transition-colors ${isActive ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500'}`}>
                                                    {req.description || "No description available"}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                        {req.status?.replace('_', ' ') || 'Unknown'}
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

                {/* Middle Column: Chat Experience */}
                <div className={`
                    flex flex-col flex-1 glass-panel rounded-[32px] relative z-0 overflow-hidden transition-all duration-500
                    ${!requestId ? 'hidden md:flex' : 'flex'}
                `}>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 p-10">
                            <Loader2 size={36} className="animate-spin text-primary" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-black tracking-tight text-text-primary dark:text-white">{t('common.connecting_to_chat')}</h3>
                                <p className="text-sm font-medium text-text-secondary dark:text-gray-400 max-w-xs">
                                    {t('common.fetching_securely')}
                                </p>
                            </div>
                        </div>
                    ) : !activeRequest ? (
                        (() => {
                            const isDeepLinking = !!(urlRequestId || urlConversationId || urlMessageSessionId);
                            if (isDeepLinking) {
                                return (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60 p-10 animate-in fade-in">
                                        <RefreshCw size={36} className="animate-spin text-primary" />
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black tracking-tight text-text-primary dark:text-white">{t('common.opening_conversation')}</h3>
                                            <p className="text-sm font-medium text-text-secondary dark:text-gray-400 max-w-xs">{t('common.fetching_securely')}</p>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-12 animate-in fade-in zoom-in duration-700 bg-slate-50/50 dark:bg-slate-900/20">
                                    <div className="relative">
                                        <div className="size-32 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl shadow-primary/20 border border-slate-100 dark:border-slate-700 relative z-10">
                                            <MessageSquare size={48} className="text-primary animate-pulse" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 size-10 bg-primary rounded-[12px] border-4 border-white dark:border-slate-900 shadow-lg z-20 flex items-center justify-center rotate-12">
                                            <Zap size={18} fill="white" className="text-white" />
                                        </div>
                                    </div>
                                    <div className="max-w-sm space-y-3">
                                        <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">{t('common.select_conversation')}</h3>
                                        <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                            {t('common.request_services_to_chat')}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs opacity-30 capitalize text-[10px] font-black tracking-widest text-slate-400">
                                        <div className="flex flex-col items-center gap-2"><Shield size={18} />{t('common.secure')}</div>
                                        <div className="flex flex-col items-center gap-2"><Zap size={18} />{t('common.fast')}</div>
                                        <div className="flex flex-col items-center gap-2"><ShieldCheck size={18} />{t('common.verified')}</div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xl sticky top-0 z-20 transition-all">
                                <div className="flex items-center gap-4 md:gap-5">
                                    <button
                                        onClick={() => setSearchParams({})}
                                        className="md:hidden size-10 flex items-center justify-center text-slate-400 hover:text-primary transition-all bg-white dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className="relative group cursor-pointer">
                                        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-white dark:border-slate-700 shadow-lg transform group-hover:scale-105 transition-all overflow-hidden ring-4 ring-primary/5">
                                            {(() => {
                                                const detail = activeUserDetails || activeRequest.professional_detail || activeRequest.assigned_to_detail;
                                                if (!detail) return <User size={28} />;
                                                const pic = detail.profile_picture_url || detail.profile_picture || detail.profile_photo_url || detail.profile_photo || detail.user?.profile_picture_url || detail.user?.profile_photo_url;
                                                return pic ? (
                                                    <img src={getImageUrl(pic)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={28} />
                                                );
                                            })()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 size-4.5 bg-green-500 border-[3px] border-white dark:border-slate-900 rounded-full shadow-sm" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <Link 
                                            to={`/customer/profile/${activeRequest.professional || activeRequest.assigned_to}`}
                                            className="hover:text-primary transition-colors cursor-pointer group/name flex items-center gap-2"
                                        >
                                            <h3 className="text-slate-900 dark:text-white text-lg font-black tracking-tight leading-none group-hover/name:translate-x-1 transition-all">
                                                {(() => {
                                                    const detail = activeUserDetails || activeRequest.professional_detail || activeRequest.assigned_to_detail;
                                                    if (!detail) return "Professional";
                                                    const first = detail.first_name || detail.user?.first_name || detail.user_detail?.first_name;
                                                    const last = detail.last_name || detail.user?.last_name || detail.user_detail?.last_name || "";
                                                    return first ? `${first} ${last}`.trim() : "Professional";
                                                })()}
                                            </h3>
                                            <ChevronRight size={16} className="text-slate-400 opacity-0 group-hover/name:opacity-100 transition-all" />
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                {t('common.active_now')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-3">
                                    <button
                                        onClick={() => setShowStatus(!showStatus)}
                                        className={`size-12 flex lg:hidden items-center justify-center rounded-2xl transition-all border ${showStatus ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'text-slate-400 border-slate-200/50 dark:border-slate-700/50 hover:bg-primary/10 hover:text-primary'}`}
                                    >
                                        <Activity size={22} />
                                    </button>
                                    <div className="relative" ref={moreMenuRef}>
                                        <button 
                                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                                            className={`size-12 flex items-center justify-center rounded-2xl transition-all border shadow-sm ${showMoreMenu ? 'bg-primary text-white border-primary shadow-primary/30' : 'text-slate-400 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-700/50'}`}
                                        >
                                            <MoreHorizontal size={22} />
                                        </button>
                                        {showMoreMenu && (
                                            <div className="absolute right-0 top-full mt-3 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 z-[100]">
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
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                             <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 flex flex-col gap-10 relative scroll-smooth custom-scrollbar">
                                {/* Mesh Gradient & Premium Patterns */}
                                <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                                    <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[140%] bg-[radial-gradient(circle_at_50%_50%,rgba(13,147,242,0.08)_0%,rgba(139,92,246,0.05)_30%,transparent_70%)] animate-pulse duration-[10s]" />
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/micro-fabrics.png')] opacity-[0.04] dark:opacity-[0.08]" />
                                </div>
                                
                                <div className="flex justify-center mb-8">
                                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                        <Shield size={14} className="text-emerald-500" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                                            {t('common.end_to_end_encrypted')} • {(activeRequest.created_at || activeRequest.createdAt) ? new Date(activeRequest.created_at || activeRequest.createdAt).toLocaleDateString() : "Just Now"}
                                        </span>
                                    </div>
                                </div>

                                {/* Real Message Thread */}
                                <div className="flex flex-col gap-6 py-4 min-h-full">
                                    {/* Virtual Message: Original Request Description */}
                                    <div className="flex justify-end animate-in fade-in zoom-in slide-in-from-right-8 duration-700">
                                        <div className="flex flex-col items-end gap-2 max-w-[80%] md:max-w-[70%] group">
                                            <div className="relative text-[12.5px] font-medium leading-relaxed rounded-2xl rounded-tr-none px-3 py-2 bg-gradient-to-br from-primary via-primary to-primary-dark text-white shadow-[0_4px_16px_-4px_rgba(13,147,242,0.3)] border border-white/10 transition-shadow">
                                                <div className="pb-6 text-pretty relative z-10">
                                                    {activeRequest.description || "Project initiated."}
                                                </div>
                                                <div className="absolute inset-x-3 bottom-2 flex items-center justify-between opacity-80 text-[8px] font-black tracking-tight select-none relative z-10 gap-4">
                                                    <span>{formatTime(activeRequest)}</span>
                                                    <CheckCheck size={12} strokeWidth={3} />
                                                </div>
                                            </div>
                                            <span className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mr-4 opacity-0 group-hover:opacity-100 transition-all duration-300">Job Request</span>
                                        </div>
                                    </div>

                                    {/* Virtual Message: Pro Acceptance */}
                                    {activeRequest.status !== 'pending' && (
                                        <div className="flex items-end gap-3 max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-left-6 duration-700 group">
                                            <div className="size-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-md border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mb-0.5 ring-2 ring-slate-100 dark:ring-slate-900/50">
                                                {activeRequest.professional_detail?.profile_picture || activeRequest.professional_detail?.profile_photo ? (
                                                    <img src={getImageUrl(activeRequest.professional_detail.profile_picture || activeRequest.professional_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Sparkles size={16} className="text-primary" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1.5 text-left">
                                                <div className="relative text-[12.5px] font-medium leading-relaxed rounded-2xl rounded-tl-none px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md">
                                                    <div className="pb-5 text-pretty">
                                                        {activeRequest.status === 'accepted' || activeRequest.status === 'assigned' || activeRequest.status === 'booked'
                                                            ? `I've reviewed your project requirements and I'm ready to start. I've accepted the request!`
                                                            : activeRequest.status === 'done' || activeRequest.status === 'completed'
                                                            ? "Great news! I've completed the work. Please take a moment to review and finalize the project."
                                                            : "The project status has been updated to: " + activeRequest.status.replace('_', ' ')}
                                                    </div>
                                                    <div className="absolute left-3.5 bottom-2 opacity-40 text-[8px] font-bold tracking-tight select-none">
                                                        {formatTime(activeRequest.updated_at || activeRequest.updatedAt || activeRequest)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message History */}
                                    {messages.map((msg, i) => {
                                        const isMe = msg.sender === user?.id || msg.is_me;
                                        return (
                                            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end gap-3'} animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500`}>
                                                {!isMe && (
                                                    <div className="size-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-md border border-slate-200/50 dark:border-slate-700/50 overflow-hidden mb-0.5 ring-2 ring-slate-100 dark:ring-slate-900/50 transition-all hover:scale-110">
                                                         {activeRequest.professional_detail?.profile_picture ? (
                                                            <img src={getImageUrl(activeRequest.professional_detail.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={18} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                )}
                                                <div className={`relative max-w-[75%] md:max-w-[65%] px-3 py-2 transition-shadow group/msg ${
                                                    isMe 
                                                    ? 'bg-gradient-to-br from-primary via-primary to-primary-dark text-white rounded-2xl rounded-tr-none shadow-[0_4px_16px_-4px_rgba(13,147,242,0.25)]' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60 rounded-2xl rounded-tl-none shadow-sm'
                                                }`}>
                                                    <div className="pb-6 text-pretty relative z-10">
                                                        <p className="text-[12.5px] font-medium leading-[1.5] break-words">{msg.body || msg.text || msg.content}</p>
                                                    </div>
                                                    <div className={`absolute inset-x-3 bottom-2 flex items-center justify-between text-[8px] font-black tracking-tight select-none relative z-10 gap-4 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                        <span>{formatTime(msg)}</span>
                                                        {isMe && (
                                                            msg.is_read || msg.isRead ? <CheckCheck size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>                             {/* Messaging Input */}
                             <form onSubmit={handleSendMessage} className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-slate-100/50 dark:border-slate-800/50">
                                 <div className="flex items-end gap-3 max-w-5xl mx-auto">
                                     <div className="flex-1 flex flex-col gap-2">
                                         <div className="flex items-center gap-1 mb-1 px-2">
                                             <button type="button" className="p-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary">
                                                 <ImageIcon size={18} />
                                             </button>
                                             <button type="button" className="p-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary">
                                                 <Paperclip size={18} />
                                             </button>
                                             <button type="button" className="p-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary">
                                                 <Mic size={18} />
                                             </button>
                                             <button type="button" className="p-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-primary">
                                                 <Smile size={18} />
                                             </button>
                                         </div>
                                         <div className="flex items-center bg-white dark:bg-slate-800 rounded-[24px] px-5 py-2 ring-1 ring-slate-200/50 dark:ring-slate-700/50 shadow-sm focus-within:ring-primary/30 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
                                             <input
                                                 className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-medium text-slate-700 dark:text-white placeholder-slate-400 outline-none py-2.5"
                                                 placeholder={t('common.type_message')}
                                                 type="text"
                                                 value={messageInput}
                                                 onChange={(e) => setMessageInput(e.target.value)}
                                                 disabled={isSending}
                                             />
                                             <div className="flex items-center gap-2">
                                                 <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest hidden sm:block">
                                                     {t('common.press_enter_to_send')}
                                                 </span>
                                             </div>
                                         </div>
                                     </div>
                                     <button
                                         type="submit"
                                         className="size-14 flex items-center justify-center bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 group"
                                         disabled={!messageInput.trim() || isSending || !conversationId}
                                     >
                                         {isSending ? (
                                             <Loader2 size={24} className="animate-spin" />
                                         ) : (
                                             <Send size={24} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                         )}
                                     </button>
                                 </div>
                             </form>
                        </>
                    )}
                </div>

                {/* Right Column: Project Insights */}
                <div className={`
                    ${showStatus ? 'fixed inset-0 z-[60] flex bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm p-6 animate-in fade-in slide-in-from-right-8 duration-500' : 'hidden'} 
                    xl:relative xl:inset-auto xl:z-0 xl:flex xl:glass-panel xl:rounded-[32px]
                    w-full xl:w-80 2xl:w-96 flex-col gap-0 overflow-hidden shrink-0 min-h-0
                `}>
                    {showStatus && (
                        <button
                            onClick={() => setShowStatus(false)}
                            className="xl:hidden absolute top-6 right-6 size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xl z-[70] border border-slate-200/50 dark:border-slate-700/50"
                        >
                            <X size={24} />
                        </button>
                    )}
                    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar">
                    {activeRequest ? (
                        <>
                            {/* Stepper */}
                            <div className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div className="w-12 h-px bg-slate-100 dark:bg-slate-800" />
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] text-center flex items-center justify-center gap-3">
                                        <span className="text-gradient">{t('common.project_journey')}</span>
                                    </h3>
                                    {activeRequest?.status?.toLowerCase() === 'completed' && !reviews.some(r => String(r.job) === String(activeRequest.id)) && (
                                        <button 
                                            onClick={() => setIsReviewModalOpen(true)}
                                            className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-widest"
                                        >
                                            <Star size={12} fill="currentColor" />
                                            {t('common.rate')}
                                        </button>
                                    )}
                                    <div className="w-12 h-px bg-slate-100 dark:bg-slate-800" />
                                </div>

                                <div className="relative flex flex-col gap-6">
                                        <div className="absolute left-[11px] top-6 bottom-6 w-0.5 whitespace-pre-wrap bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10 rounded-full" />
                                    {jobSteps.map((step, index) => {
                                        const isCompleted = step.status === 'completed';
                                        const isCurrent = step.status === 'current';

                                        return (
                                            <div key={index} className={`flex gap-4 relative group transition-all duration-700 ${!isCompleted && !isCurrent ? 'opacity-20 grayscale' : ''}`}>
                                                <div className="relative shrink-0 z-10 flex flex-col items-center">
                                                    {isCompleted ? (
                                                        <div className="size-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-4 ring-white dark:ring-slate-900">
                                                            <Check size={12} strokeWidth={4} />
                                                        </div>
                                                    ) : isCurrent ? (
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping duration-[3s]" />
                                                            <div className="size-6 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(13,147,242,0.4)] ring-4 ring-white dark:ring-slate-900 z-10 relative">
                                                                <div className="size-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="size-6 bg-slate-200 dark:bg-slate-700 rounded-full ring-4 ring-white dark:ring-slate-900" />
                                                    )}
                                                </div>

                                                <div className="flex flex-col flex-1 gap-0.5 group-hover:translate-x-2 transition-transform duration-500">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[12px] font-black tracking-tight ${isCurrent ? 'text-primary' : isCompleted ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                                                            {step.title}
                                                        </span>
                                                        {step.date && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{step.date}</span>}
                                                    </div>
                                                    <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${isCurrent ? 'text-primary/70' : 'text-slate-400'}`}>
                                                        {isCompleted ? 'Phase Finalized' : isCurrent ? 'Active Milestone' : 'Upcoming Phase'}
                                                    </span>

                                                    {isCurrent && step.actionRequired && (
                                                        <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-primary/10 shadow-md space-y-2 animate-in fade-in duration-500">
                                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                                                                {activeRequest.status === 'accepted' || activeRequest.status === 'assigned'
                                                                    ? "Ready to proceed — complete checkout to confirm."
                                                                    : "Work complete — verify and release payment."}
                                                            </p>
                                                            {activeRequest.status === 'accepted' || activeRequest.status === 'assigned' ? (
                                                                <button 
                                                                    onClick={() => navigate('/customer/checkout/' + activeRequestId)}
                                                                    className="w-full py-2 bg-primary text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <CreditCard size={12} />
                                                                    Complete Booking
                                                                </button>
                                                            ) : activeRequest.status === 'completed' ? (
                                                                <button 
                                                                    onClick={() => setIsReviewModalOpen(true)}
                                                                    className="w-full py-2 bg-amber-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                                                                >
                                                                    <Star size={12} className="fill-current" />
                                                                    Rate Professional
                                                                </button>
                                                            ) : (
                                                                <div className="flex flex-col gap-1.5">
                                                                    <button 
                                                                        onClick={() => handleVerifyAndPay(activeRequestId)}
                                                                        disabled={approvingJobId === activeRequestId}
                                                                        className="w-full py-2 bg-emerald-500 text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed"
                                                                    >
                                                                        {approvingJobId === activeRequestId ? (
                                                                            <Loader2 size={12} className="animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle2 size={12} />
                                                                        )}
                                                                        {approvingJobId === activeRequestId ? 'Processing...' : 'Verify & Pay'}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setIsDisputeModalOpen(true)}
                                                                        className="w-full py-1.5 text-red-500 text-[8px] font-black rounded-lg uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                                                                    >
                                                                        Raise Dispute
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Project Snapshot */}
                            <div className="p-8 space-y-6 relative overflow-hidden shrink-0 border-t border-slate-100/50 dark:border-slate-800/50">
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                                        <div className="size-1 bg-primary rounded-full" />
                                        <span className="text-gradient">Project Snapshot</span>
                                    </h3>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-md">
                                        <ShieldCheck size={12} className="text-primary" />
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">Verified</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 italic">
                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                            "{activeRequest.description || "Project request details..."}"
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-all hover:bg-white dark:hover:bg-slate-800">
                                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Location</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                                    {activeRequest.address || activeRequest.city || "Addis Ababa"}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-all hover:bg-white dark:hover:bg-slate-800">
                                            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <CreditCard size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Project Budget</p>
                                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                                    {activeRequest.budget || "TBD"} ETB
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-all hover:bg-white dark:hover:bg-slate-800">
                                            <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <Calendar size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Scheduled Date</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    {activeRequest.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : "Not TBD"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {/* Safety / Escrow Banner */}
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-[28px] flex gap-4 overflow-hidden relative group shadow-2xl shadow-slate-950/20">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 relative z-10 border border-primary/20">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="relative z-10">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                                                Payment Protection
                                                <div className="size-1 bg-primary rounded-full animate-pulse" />
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                                Held securely until verification.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-40">
                            <div className="size-24 rounded-[32px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 animate-pulse">
                                <Activity size={40} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">Insights Offline</p>
                                <p className="text-[11px] font-bold text-slate-400 max-w-[200px] leading-relaxed">Select a conversation to pull project details and progress</p>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </main>
            <DisputeModal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                jobId={activeRequestId || ''}
                jobTitle={activeRequest?.service_title || activeRequest?.description || 'Job Request'}
                againstUserId={activeRequest?.professional || activeRequest?.assigned_to || ''}
                onSuccess={() => {
                    alert("Dispute raised successfully. Our team will review it shortly.");
                }}
            />

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                jobId={activeRequestId || ''}
                professionalId={activeRequest?.professional || activeRequest?.assigned_to || ''}
                onSuccess={() => {
                    refreshJobs(true);
                    refreshReviews();
                    alert("Thank you for your review!");
                }}
            />
        </div>
    );
};

export default CustomerMessages;
