import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useAuth } from '../../../context/AuthContext';
import { listJobs, updateJobStatus } from '../../../api/jobs.api';
import { getNotifications, type Notification } from '../../../api/notifications.api';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';

const ProfessionalMessages = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [professionalRequests, setProfessionalRequests] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeUserDetails, setActiveUserDetails] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allJobs, allNotifications] = await Promise.all([
                    listJobs(),
                    getNotifications()
                ]);
                
                // Filter jobs assigned to this pro
                const myRequests = allJobs.filter((job: any) => 
                    job.assigned_to === user?.id || job.professional === user?.id
                );
                
                console.log("ProfessionalMessages: My Jobs:", myRequests);
                setProfessionalRequests(myRequests);
                setNotifications(allNotifications);
            } catch (error) {
                console.error("Error fetching pro data:", error);
            }
        };

        if (user?.id) {
            fetchData();
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Sidebar Hydration: Fetch details for ALL customers in the list
    const [hydratedRequests, setHydratedRequests] = useState<any[]>([]);

    useEffect(() => {
        const hydrate = async () => {
            if (professionalRequests.length === 0) {
                setHydratedRequests([]);
                return;
            }

            const jobsWithDetails = await Promise.all(professionalRequests.map(async (job) => {
                // If backend already provides detail, use it; otherwise fetch.
                if (job.customer_detail?.first_name || job.customer_detail?.user?.first_name) {
                    return job;
                }
                try {
                    const details = await getUserDetails(job.customer);
                    return { ...job, customer_detail: details };
                } catch (err) {
                    console.error("Failed to hydrate job customer:", job.id, err);
                    return job;
                }
            }));
            setHydratedRequests(jobsWithDetails);
        };
        hydrate();
    }, [professionalRequests]);

    // Active Chat Hydration (for Header/Project info)
    const urlRequestId = searchParams.get('requestId');
    const urlConversationId = searchParams.get('conversationId');
    const urlJobTitle = searchParams.get('jobTitle');

    // Priority: conversationId > requestId > jobTitle > first item
    const activeRequest = (urlConversationId ? hydratedRequests.find(r => r.conversation_id === urlConversationId || r.id === urlConversationId) : null) ||
                          hydratedRequests.find(r => r.id === urlRequestId) || 
                          (urlJobTitle ? hydratedRequests.find(r => {
                              const match = r.title?.toLowerCase() === urlJobTitle.toLowerCase();
                              if (urlJobTitle) console.log(`Comparing Pro Job "${r.title?.toLowerCase()}" vs "${urlJobTitle.toLowerCase()}": ${match}`);
                              return match;
                          }) : null) ||
                          hydratedRequests[0];
                          
    if (urlConversationId && activeRequest) {
        console.log("ProfessionalMessages: Matched job by conversationId:", activeRequest.id);
    } else if (urlJobTitle && activeRequest && !urlRequestId) {
        console.log("ProfessionalMatched job by title fallback:", activeRequest.title);
    }
    const requestId = activeRequest?.id;
    const activeRequestId = activeRequest?.id;

    // When jobs finish loading, make sure the URL's requestId is still honoured.
    // This handles the case where a notification click navigates before data loads.
    useEffect(() => {
        const urlRequestId = searchParams.get('requestId');
        if (urlRequestId && hydratedRequests.length > 0) {
            const match = hydratedRequests.find(r => r.id === urlRequestId);
            if (!match) {
                console.warn('ProfessionalMessages: requestId from URL not found in job list:', urlRequestId);
            }
        }
    }, [hydratedRequests]);

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

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-display text-text-primary dark:text-white overflow-hidden">
            <Sidebar />

            <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
                <Header />

                <main className="flex w-full flex-1 overflow-hidden items-stretch p-0 md:p-6 gap-0 md:gap-4">
                    {/* Left Sidebar: Conversation List */}
                    <div className={`
                        w-full md:w-80 flex-col bg-white dark:bg-card-dark rounded-none md:rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border-b md:border border-slate-200/60 dark:border-slate-800 overflow-hidden shrink-0
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
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {hydratedRequests.length === 0 ? (
                                <div className="p-10 text-center space-y-3 opacity-40">
                                    <span className="material-symbols-outlined text-4xl block">pending_actions</span>
                                    <p className="text-xs font-bold leading-relaxed">No requests yet.<br />Your profile is live and visible!</p>
                                </div>
                            ) : (
                                hydratedRequests.map(req => (
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
                        flex flex-col flex-1 bg-white dark:bg-card-dark rounded-none md:rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border-x md:border border-slate-200/60 dark:border-slate-800 relative z-0 overflow-hidden
                        ${!requestId ? 'hidden md:flex' : 'flex'}
                    `}>
                        {!activeRequest ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40 p-10 animate-in fade-in zoom-in">
                                <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-6xl">quick_reference_all</span>
                                </div>
                                <div className="max-w-xs">
                                    <h3 className="text-xl font-black tracking-tight mb-2">Review Inbound Work</h3>
                                    <p className="text-sm font-medium leading-relaxed">Select a customer request from the list to view project details and start messaging.</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100/60 dark:border-slate-800/50 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <button
                                            onClick={() => setSearchParams({})}
                                            className="md:hidden size-9 flex items-center justify-center text-slate-400 hover:text-primary transition-all bg-slate-50 dark:bg-slate-800 rounded-lg"
                                        >
                                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                                        </button>
                                        {/* Clickable customer identity — opens mini profile */}
                                        <button
                                            onClick={() => setShowCustomerProfile(p => !p)}
                                            className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity"
                                        >
                                        <div className="relative group cursor-pointer">
                                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-white dark:border-slate-700 shadow-md overflow-hidden">
                                                {(activeUserDetails?.profile_picture || activeRequest.customer_detail?.profile_picture) ? (
                                                    <img src={getImageUrl(activeUserDetails?.profile_picture || activeRequest.customer_detail.profile_picture)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined">person</span>
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-[2.5px] border-white dark:border-slate-900 rounded-full shadow-sm" />
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-left">
                                            <h3 className="text-text-primary dark:text-white text-base font-black tracking-tight leading-none underline-offset-2 hover:underline">
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
                                            const first = detail?.first_name || detail?.user?.first_name || "Customer";
                                            const last = detail?.last_name || detail?.user?.last_name || "";
                                            const fullName = `${first} ${last}`.trim();
                                            const photo = detail?.profile_picture || detail?.user?.profile_picture;
                                            const email = detail?.email || detail?.user?.email;
                                            const phone = detail?.phonenumber || detail?.phone || detail?.user?.phonenumber;
                                            const location = detail?.city || detail?.location || detail?.user?.city;
                                            return (
                                                <div
                                                    className="absolute left-4 top-[4.5rem] z-[100] w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {/* Mini cover */}
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

                                {/* Messaging Canvas with Premium Background */}
                                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative" 
                                     style={{ 
                                        backgroundColor: 'transparent',
                                        backgroundImage: `
                                            radial-gradient(circle at 2px 2px, rgba(148, 163, 184, 0.05) 1px, transparent 0),
                                            linear-gradient(to bottom, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.8))
                                        `,
                                        backgroundSize: '32px 32px, 100% 100%'
                                     }}>                                    {/* Project Insight Card - Simplified */}
                                    <div className="max-w-lg mx-auto w-full bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800 pb-4">
                                            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                                                <span className="material-symbols-outlined text-xl">assignment_late</span>
                                                <h4 className="font-bold text-sm tracking-tight text-text-primary dark:text-white">Inbound Proposal</h4>
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

                                            {(activeRequest.scheduled_at || activeRequest.preferredDate) && (
                                                <div className="bg-primary/5 p-3 rounded-xl flex items-center gap-3 border border-primary/10">
                                                    <span className="material-symbols-outlined text-primary text-lg">event_upcoming</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-bold uppercase tracking-wide opacity-50 leading-none mb-1 text-primary">Target Completion</p>
                                                        <p className="text-xs font-bold text-primary">
                                                            {new Date(activeRequest.scheduled_at || activeRequest.preferredDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
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
                                            ) : (activeRequest.status === 'accepted' || activeRequest.status === 'assigned' || activeRequest.status === 'in_progress') ? (
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

                                    {/* Timeline Marker */}
                                    <div className="flex justify-center my-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 bg-white/50 dark:bg-slate-900/50 px-4 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                            Chat Started • {(activeRequest.created_at || activeRequest.createdAt) ? new Date(activeRequest.created_at || activeRequest.createdAt).toLocaleDateString() : "--"}
                                        </span>
                                    </div>

                                    {/* Inbound Customer Message */}
                                    <div className="flex justify-start animate-in fade-in slide-in-from-left-4">
                                        <div className="flex flex-col gap-1.5 max-w-[85%]">
                                            <div className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl rounded-bl-none px-4 py-3 text-sm font-medium shadow-sm border border-slate-100 dark:border-slate-700">
                                                {activeRequest.description || "Hello! Looking forward to working with you."}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">
                                                Received • {new Date(activeRequest.created_at || activeRequest.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Professional Response */}
                                    {activeRequest.status !== 'pending' && (
                                        <div className="flex justify-end animate-in fade-in slide-in-from-right-4">
                                            <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                                                <div className="bg-primary text-white rounded-2xl rounded-br-none px-4 py-3 text-sm font-medium shadow-lg shadow-primary/20">
                                                    {activeRequest.status === 'accepted' || activeRequest.status === 'assigned'
                                                        ? "I've reviewed your request and accepted the project! Let's get started."
                                                        : activeRequest.status === 'done'
                                                        ? "I've marked the job as completed. Please review and release payment."
                                                        : "Status updated to: " + activeRequest.status}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mr-1">
                                                    Sent • Just now
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Chat Input Area */}
                                <div className="p-4 bg-white dark:bg-card-dark border-t border-slate-100 dark:border-slate-800 px-6 pb-6">
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-4 py-2 ring-1 ring-slate-100 dark:ring-slate-800 focus-within:ring-primary focus-within:ring-2 transition-all">
                                        <button className="text-slate-400 hover:text-primary transition-all">
                                            <span className="material-symbols-outlined text-2xl">add_circle</span>
                                        </button>
                                        <input
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 dark:text-white placeholder-slate-400 py-3"
                                            placeholder={['accepted', 'assigned', 'in_progress'].includes(activeRequest.status) ? "Reply to customer..." : "Accept request to start messaging"}
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            disabled={!['accepted', 'assigned', 'in_progress'].includes(activeRequest.status)}
                                        />
                                        <button
                                            className="flex items-center justify-center bg-primary text-white rounded-xl px-5 py-2.5 gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-40"
                                            disabled={!['accepted', 'assigned', 'in_progress'].includes(activeRequest.status)}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-wider">Send</span>
                                            <span className="material-symbols-outlined text-sm">send</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column: Dynamic Project Status */}
                    <div className={`
                        ${showStatus ? 'fixed inset-0 z-[60] flex bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm p-6 animate-in fade-in slide-in-from-right duration-300' : 'hidden'} 
                        xl:relative xl:inset-auto xl:z-0 xl:flex xl:bg-transparent xl:dark:bg-transparent xl:backdrop-blur-none xl:p-0 
                        w-full xl:w-80 2xl:w-96 flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 shrink-0 lg:pt-2
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
                                {/* Clean Timeline */}
                                <div className="bg-white dark:bg-card-dark rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 p-8">
                                    <h3 className="text-sm font-black text-text-primary dark:text-white uppercase tracking-[0.15em] mb-10 text-center">Project Timeline</h3>
    
                                    <div className="relative flex flex-col gap-12">
                                        {/* Progress Line */}
                                        <div className="absolute left-[11px] top-6 bottom-6 w-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
    
                                        {jobSteps.map((step, index) => {
                                            const isCompleted = step.status === 'completed';
                                            const isCurrent = step.status === 'current';
    
                                            return (
                                                <div key={index} className={`flex gap-6 relative group transition-all duration-500 ${!isCompleted && !isCurrent ? 'opacity-40 grayscale' : ''}`}>
                                                    {/* Stepper Node */}
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
