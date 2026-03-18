import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import CustomerNavbar from './components/CustomerNavbar';
import { useAuth } from '../../../context/AuthContext';
import { listJobs, updateJobStatus } from '../../../api/jobs.api';
import { getNotifications, type Notification } from '../../../api/notifications.api';
import { getImageUrl, getUserDetails } from '../../../api/auth.api';

const CustomerMessages = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [userRequests, setUserRequests] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeUserDetails, setActiveUserDetails] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allJobs, allNotifications] = await Promise.all([
                    listJobs(),
                    getNotifications()
                ]);
                
                const myRequests = allJobs.filter((job: any) => 
                    job.customer === user?.id && 
                    job.status !== 'pending'
                );
                
                console.log("CustomerMessages: My Requests:", myRequests);
                setUserRequests(myRequests);
                setNotifications(allNotifications);
            } catch (error) {
                console.error("Error fetching customer data:", error);
            }
        };

        if (user?.id) {
            fetchData();
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Get active request from URL or default to first
    const requestId = searchParams.get('requestId') || userRequests[0]?.id;
    const activeRequest = userRequests.find(r => r.id === requestId);
    const activeRequestId = activeRequest?.id;

    // Fetch details for active professional if not present (Lazy Hydration)
    useEffect(() => {
        const fetchDetails = async () => {
            if (!activeRequest) {
                setActiveUserDetails(null);
                return;
            }
            const proId = activeRequest.professional || activeRequest.assigned_to;
            if (!proId) return;
            
            try {
                const details = await getUserDetails(proId);
                setActiveUserDetails(details);
            } catch (err) {
                console.error("Failed to fetch professional details:", err);
            }
        };
        fetchDetails();
    }, [activeRequestId]);

    const handleSelectRequest = (id: string) => {
        setSearchParams({ requestId: id });
    };

    const [messageInput, setMessageInput] = useState("");
    const [showStatus, setShowStatus] = useState(false);

    const getStepStatus = (stepIndex: number, jobStatus: string) => {
        const s = jobStatus.toLowerCase();
        // Updated stages: pending -> accepted -> assigned/booked -> done -> completed
        const statuses = ['pending', 'accepted', 'assigned', 'done', 'completed'];
        const currentIndex = statuses.indexOf(s);
        
        if (currentIndex > stepIndex) return "completed";
        if (currentIndex === stepIndex) return "current";
        return "upcoming";
    };

    const jobSteps = [
        {
            title: "Request Sent",
            date: activeRequest?.scheduled_at ? new Date(activeRequest.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "--",
            status: getStepStatus(0, activeRequest?.status || 'pending')
        },
        {
            title: "Pro Accepted",
            status: getStepStatus(1, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'accepted'
        },
        {
            title: "Job Booked",
            status: getStepStatus(2, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'booked'
        },
        {
            title: "Work Finished",
            status: getStepStatus(3, activeRequest?.status || 'pending'),
            actionRequired: activeRequest?.status === 'done'
        },
        {
            title: "Paid & Released",
            status: getStepStatus(4, activeRequest?.status || 'pending')
        }
    ];

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-display text-text-primary dark:text-white overflow-hidden">
            <CustomerNavbar />

            <main className="flex w-full max-w-[1600px] mx-auto p-0 md:p-6 gap-0 md:gap-4 flex-1 overflow-hidden items-stretch">

                {/* Left Column: Conversation List */}
                <div className={`
                    w-full md:w-80 flex-col bg-white dark:bg-card-dark rounded-none md:rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border-b md:border border-slate-200/60 dark:border-slate-800 overflow-hidden shrink-0
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
                                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                                            {notifications.filter(n => !n.is_read).length} New
                                        </span>
                                    )}
                                </div>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {userRequests.length === 0 ? (
                            <div className="p-10 text-center space-y-3 opacity-40">
                                <span className="material-symbols-outlined text-4xl block">forum</span>
                                <p className="text-xs font-black uppercase tracking-widest">No conversation yet</p>
                                <p className="text-[10px] font-bold leading-relaxed">Pending requests will appear here once accepted.</p>
                            </div>
                        ) : (
                            userRequests.map(req => (
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
                                            {req.status === 'pending' && <span className="size-2 bg-primary rounded-full animate-pulse" />}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Middle Column: Chat Experience */}
                <div className={`
                    flex flex-col flex-1 bg-white dark:bg-card-dark rounded-none md:rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border-x md:border border-slate-200/60 dark:border-slate-800 relative z-0 overflow-hidden
                    ${!requestId ? 'hidden md:flex' : 'flex'}
                `}>
                    {!activeRequest ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40 p-10 animate-in fade-in zoom-in">
                            <div className="size-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-6xl">chat_paste_go</span>
                            </div>
                            <div className="max-w-xs">
                                <h3 className="text-xl font-black tracking-tight mb-2">Pick a Conversation</h3>
                                <p className="text-sm font-medium leading-relaxed">Select a professional from the list to view your project status and messages.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100/60 dark:border-slate-800/50 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md sticky top-0 z-10 transition-all">
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
                                        <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 border-[2.5px] border-white dark:border-slate-900 rounded-full shadow-sm" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-text-primary dark:text-white text-base font-black tracking-tight leading-none">
                                            {(() => {
                                                const detail = activeUserDetails || activeRequest.professional_detail;
                                                if (!detail) return "Professional";
                                                const first = detail.first_name || detail.user?.first_name || detail.user_detail?.first_name;
                                                const last = detail.last_name || detail.user?.last_name || detail.user_detail?.last_name || "";
                                                return first ? `${first} ${last}`.trim() : "Professional";
                                            })()}
                                        </h3>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <span className="size-1.5 bg-green-500 rounded-full animate-blink" />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                {activeRequest.status} • Online
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-3">
                                    {(activeRequest.status === 'booked' || activeRequest.status === 'in_progress' || activeRequest.status === 'done' || activeRequest.status === 'completed') && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/20 animate-in fade-in zoom-in">
                                            <span className="material-symbols-outlined text-sm text-primary">call</span>
                                            <span className="text-xs font-black text-primary">
                                                {activeUserDetails?.phone || activeRequest.professional_detail?.phone || "+251 9XX XXX XXX"}
                                            </span>
                                        </div>
                                    )}
                                    <button className="size-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
                                        <span className="material-symbols-outlined text-xl">videocam</span>
                                    </button>
                                    <button className="size-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
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

                            {/* Messaging Canvas */}
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px]">
                                <div className="flex justify-center my-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                                        Session Started • {(activeRequest.created_at || activeRequest.createdAt) ? new Date(activeRequest.created_at || activeRequest.createdAt).toLocaleDateString() : "--"}
                                    </span>
                                </div>



                                {/* Customer Initial Message (Real Description) */}
                                <div className="flex justify-end animate-in fade-in slide-in-from-right-4">
                                    <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                                        <div className="text-sm font-medium leading-relaxed rounded-2xl rounded-br-sm px-4 py-3 bg-primary text-white shadow-lg shadow-primary/20">
                                            {activeRequest.description || "Hello! I'd like to request your services for my project."}
                                        </div>
                                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-tighter mr-1">
                                            Sent • {(activeRequest.created_at || activeRequest.createdAt) ? new Date(activeRequest.created_at || activeRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                        </span>
                                    </div>
                                </div>

                                {/* Pro Response (Only after Accept) */}
                                {activeRequest.status !== 'pending' && (
                                    <div className="flex items-end gap-3 max-w-[85%] animate-in fade-in slide-in-from-left-4 duration-500">
                                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                            {activeRequest.professional_detail?.profile_picture || activeRequest.professional_detail?.profile_photo ? (
                                                <img src={getImageUrl(activeRequest.professional_detail.profile_picture || activeRequest.professional_detail.profile_photo)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-xs">person</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-sm font-medium leading-relaxed rounded-2xl rounded-bl-sm px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700">
                                                {activeRequest.status === 'accepted' || activeRequest.status === 'assigned'
                                                    ? `Hello! I've reviewed your request and I'm happy to help. I've accepted the project!`
                                                    : activeRequest.status === 'done'
                                                    ? "I've finished the job! Please review the work and approve the payment when you're ready."
                                                    : "The job has been updated to: " + activeRequest.status}
                                            </div>
                                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-tighter ml-1">
                                                Received • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Status Update Overlay */}
                                {activeRequest.status === 'accepted' && (
                                    <div className="mx-auto max-w-sm w-full bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in zoom-in duration-500">
                                        <div className="size-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/40">
                                            <span className="material-symbols-outlined font-black">verified</span>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-tight">Project Accepted</h5>
                                            <p className="text-[10px] font-bold text-green-600/80 leading-tight mt-0.5">The professional is ready to start! Review the status steps to proceed.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Premium Bottom Bar */}
                            <div className="p-4 bg-white dark:bg-card-dark border-t border-slate-100 dark:border-slate-800 px-6 pb-6">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-4 py-2 ring-1 ring-slate-100 dark:ring-slate-800 focus-within:ring-primary focus-within:ring-2 transition-all">
                                    <button className="text-slate-400 hover:text-primary transition-all transform hover:rotate-12">
                                        <span className="material-symbols-outlined text-2xl">add_circle</span>
                                    </button>
                                    <input
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 dark:text-white placeholder-slate-400"
                                        placeholder="Type your reply here..."
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                    />
                                    <button className="flex items-center justify-center bg-primary text-white rounded-xl px-5 py-2.5 gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30">
                                        <span className="text-xs font-black uppercase tracking-wider">Send</span>
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
                        <>

                            {/* Attractive Stepper */}
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
                                                        {isCompleted ? 'Phase Finalized' : isCurrent ? 'Active Phase • action required' : 'Future Milestone'}
                                                    </span>

                                                    {isCurrent && step.actionRequired && (
                                                        <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                            <p className="text-[10px] font-black text-primary leading-snug">
                                                                {activeRequest.status === 'accepted' ? "Pro accepted! Book now to secure your spot." : "Professional marked as Done. Confirm to release payment."}
                                                            </p>
                                                            {activeRequest.status === 'accepted' ? (
                                                                <button 
                                                                    onClick={() => updateJobStatus(activeRequestId, 'booked')}
                                                                    className="w-full py-2 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">payments</span>
                                                                    Book & Pay Escrow
                                                                </button>
                                                            ) : (
                                                                <div className="flex flex-col gap-2">
                                                                    <button 
                                                                        onClick={() => updateJobStatus(activeRequestId, 'completed')}
                                                                        className="w-full py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-md"
                                                                    >
                                                                        Confirm Completion
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => alert("Re-do request sent.")}
                                                                        className="w-full py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-slate-200 transition-all"
                                                                    >
                                                                        Ask to Re-do
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

                            {/* Security Helper */}
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
