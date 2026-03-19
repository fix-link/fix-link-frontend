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

    // Get the active request from search params, or default to first one
    const requestId = searchParams.get('requestId') || professionalRequests[0]?.id;
    const activeRequest = professionalRequests.find(r => r.id === requestId);
    const activeRequestId = activeRequest?.id;

    // Fetch details for active user if not present (Lazy Hydration)
    useEffect(() => {
        const fetchDetails = async () => {
            if (!activeRequest) {
                setActiveUserDetails(null);
                return;
            }
            const customerId = activeRequest.customer;
            if (!customerId) return;
            
            try {
                const details = await getUserDetails(customerId);
                setActiveUserDetails(details);
            } catch (err) {
                console.error("Failed to fetch customer details:", err);
            }
        };
        fetchDetails();
    }, [activeRequestId]);

    const [messageInput, setMessageInput] = useState("");
    const [showStatus, setShowStatus] = useState(false);

    const handleSelectRequest = (id: string) => {
        setSearchParams({ requestId: id });
    };

    const handleAccept = async () => {
        if (!activeRequestId) return;
        try {
            const updated = await updateJobStatus(activeRequestId, 'accepted');
            console.log("ProfessionalMessages: Accepted Job Response:", updated);
            // Merge updated status with existing hydrated request to keep details like customer_detail
            setProfessionalRequests(prev => prev.map(r => 
                r.id === activeRequestId ? { ...r, ...updated } : r
            ));
        } catch (error: any) {
            alert("Failed to accept: " + error.message);
        }
    };

    const handleMarkDone = async () => {
        if (!activeRequestId) return;
        try {
            const updated = await updateJobStatus(activeRequestId, 'done');
            setProfessionalRequests(prev => prev.map(r => r.id === activeRequestId ? updated : r));
        } catch (error: any) {
            alert("Failed to mark as done: " + error.message);
        }
    };

    const handleDecline = async () => {
        if (!activeRequestId) return;
        try {
            const updated = await updateJobStatus(activeRequestId, 'cancelled');
            setProfessionalRequests(prev => prev.map(r => r.id === activeRequestId ? updated : r));
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
                                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                                            {notifications.filter(n => !n.is_read).length} New
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {professionalRequests.length === 0 ? (
                                <div className="p-10 text-center space-y-3 opacity-40">
                                    <span className="material-symbols-outlined text-4xl block">pending_actions</span>
                                    <p className="text-xs font-bold leading-relaxed">No requests yet.<br />Your profile is live and visible!</p>
                                </div>
                            ) : (
                                professionalRequests.map(req => (
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
                                                {req.status === 'pending' && <div className="absolute -top-0.5 -right-0.5 size-3 bg-primary rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />}
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
                                                {req.status === 'pending' && <span className="size-2 bg-primary rounded-full animate-pulse" />}
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
                                        <div className="flex flex-col gap-0.5">
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
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Customer • Online</span>
                                            </div>
                                        </div>
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

                                {/* Messaging Area */}
                                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:24px_24px]">

                                    {/* Project Insight Card */}
                                    <div className="max-w-lg mx-auto w-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary/20 p-6 space-y-4 shadow-2xl shadow-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-primary">
                                                <span className="material-symbols-outlined font-black">assignment</span>
                                                <h4 className="font-black text-xs uppercase tracking-widest">Inbound Proposal</h4>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 tracking-tighter">
                                                ID: {activeRequest.id.substring(0, 8)}
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                                                "{activeRequest.description}"
                                            </p>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase tracking-wide opacity-40 leading-none mb-1">Location</p>
                                                        <p className="text-xs font-bold truncate">{activeRequest.location}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-green-500 text-lg">payments</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase tracking-wide opacity-40 leading-none mb-1">Budget</p>
                                                        <p className="text-xs font-bold truncate text-green-600 dark:text-green-400">{activeRequest.budget}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {activeRequest.preferredDate && (
                                                <div className="bg-primary/5 p-3 rounded-xl flex items-center gap-3 border border-primary/10">
                                                    <span className="material-symbols-outlined text-primary text-lg">event_upcoming</span>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] font-black uppercase tracking-wide opacity-50 leading-none mb-1 text-primary">Target Completion</p>
                                                        <p className="text-xs font-black text-primary">
                                                            {new Date(activeRequest.preferredDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {activeRequest.photos?.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto py-1 custom-scrollbar">
                                                    {activeRequest.photos.map((p: string, i: number) => (
                                                        <img key={i} src={p} alt="" className="size-20 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-sm hover:scale-105 transition-transform" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                         {activeRequest.status === 'pending' ? (
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={handleAccept}
                                                    className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                                                >
                                                    Accept & Connect
                                                </button>
                                                <button
                                                    onClick={handleDecline}
                                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-red-50 hover:text-red-500"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        ) : activeRequest.status === 'accepted' || activeRequest.status === 'assigned' || activeRequest.status === 'in_progress' ? (
                                            <button
                                                onClick={handleMarkDone}
                                                className="w-full py-3 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 active:scale-95"
                                            >
                                                Mark as Job Done
                                            </button>
                                        ) : (
                                            <div className={`py-3 text-center rounded-xl text-xs font-black uppercase tracking-[0.2em] ${activeRequest.status === 'completed' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                                }`}>
                                                Status: {activeRequest.status}
                                            </div>
                                        )}

                                    </div>

                                    <div className="flex justify-center my-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                                        Session Started • {(activeRequest.created_at || activeRequest.createdAt) ? new Date(activeRequest.created_at || activeRequest.createdAt).toLocaleDateString() : "--"}
                                    </span>
                                    </div>

                                    {/* Inbound Customer Message (Real Description) */}
                                    <div className="flex justify-start animate-in fade-in slide-in-from-left-4">
                                        <div className="flex flex-col gap-1.5 max-w-[85%]">
                                            <div className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl rounded-bl-none px-4 py-3 text-sm font-medium shadow-sm border border-slate-100 dark:border-slate-700">
                                                {activeRequest.description || "Hello! I'm interested in your services for my project. Looking forward to your response!"}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">
                                                Received • {(activeRequest.created_at || activeRequest.createdAt) ? new Date(activeRequest.created_at || activeRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pro Response (Sent after Accept) */}
                                    {activeRequest.status !== 'pending' && (
                                        <div className="flex justify-end animate-in fade-in slide-in-from-right-4">
                                            <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                                                <div className="bg-primary text-white rounded-2xl rounded-br-none px-4 py-3 text-sm font-medium shadow-lg shadow-primary/20 border border-primary/20">
                                                    {activeRequest.status === 'accepted' || activeRequest.status === 'assigned'
                                                        ? "I've reviewed your request and accepted the project! Let's get started."
                                                        : activeRequest.status === 'done'
                                                        ? "I've marked the job as completed. Please review and release payment."
                                                        : "Status updated to: " + activeRequest.status}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mr-1">
                                                    Sent • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                            placeholder={activeRequest.status === 'accepted' ? "Reply to customer..." : "Accept request to start messaging"}
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            disabled={activeRequest.status !== 'accepted'}
                                        />
                                        <button
                                            className="flex items-center justify-center bg-primary text-white rounded-xl px-5 py-2.5 gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30 disabled:opacity-40 disabled:scale-100"
                                            disabled={activeRequest.status !== 'accepted'}
                                        >
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
                            <div className={`bg-white dark:bg-card-dark rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 p-6 relative overflow-hidden ${activeRequest?.status === 'accepted' ? 'ring-2 ring-green-500/20' : ''}`}>
                                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />



                                <div className="space-y-8 relative">
                                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />

                                    {/* Timeline Steps */}
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="size-4 rounded-full bg-green-500 flex items-center justify-center text-white ring-4 ring-white dark:ring-slate-900 shadow-sm">
                                            <span className="material-symbols-outlined text-[10px] font-black">check</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300">Request Received</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Initial Inquiry</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`size-4 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm ${activeRequest?.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            {activeRequest?.status !== 'pending' ? <span className="material-symbols-outlined text-[10px] font-black">check</span> : <div className="size-1.5 bg-slate-400 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black ${activeRequest?.status !== 'pending' ? 'text-green-600' : 'text-slate-500'}`}>Accepted</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pro Ready</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`size-4 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm ${(activeRequest?.status === 'booked' || activeRequest?.status === 'in_progress' || activeRequest?.status === 'done' || activeRequest?.status === 'completed') ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            {(activeRequest?.status === 'booked' || activeRequest?.status === 'in_progress' || activeRequest?.status === 'done' || activeRequest?.status === 'completed') ? <span className="material-symbols-outlined text-[10px] font-black">check</span> : <div className="size-1.5 bg-slate-400 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black ${(activeRequest?.status === 'booked' || activeRequest?.status === 'in_progress') ? 'text-blue-600' : 'text-slate-500'}`}>Job Booked</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Customer Paid</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`size-4 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm ${(activeRequest?.status === 'done' || activeRequest?.status === 'completed') ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            {(activeRequest?.status === 'done' || activeRequest?.status === 'completed') ? <span className="material-symbols-outlined text-[10px] font-black">check</span> : <div className="size-1.5 bg-slate-400 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black ${activeRequest?.status === 'done' ? 'text-emerald-600' : 'text-slate-500'}`}>Marked Done</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Awaiting Approval</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`size-4 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm ${activeRequest?.status === 'completed' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                            {activeRequest?.status === 'completed' ? <span className="material-symbols-outlined text-[10px] font-black">payments</span> : <div className="size-1.5 bg-slate-400 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black ${activeRequest?.status === 'completed' ? 'text-amber-600' : 'text-slate-500'}`}>Verified & Paid</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Funds Released</p>
                                        </div>
                                    </div>
                                </div>

                                {(['booked', 'in_progress'].includes(activeRequest?.status)) && (
                                    <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20 animate-in bounce-in duration-500">
                                        <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Job is Active</h5>
                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-4">
                                            Funds are in Escrow. You can now mark the job as done when finished.
                                        </p>
                                        <button 
                                            onClick={() => updateJobStatus(activeRequestId, 'done')}
                                            className="w-full py-2.5 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">task_alt</span>
                                            Mark as Completed
                                        </button>
                                    </div>
                                )}

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
