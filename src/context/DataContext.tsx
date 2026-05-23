import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { listJobs } from "../api/jobs.api";
import { getNotifications, type Notification } from "../api/notifications.api";
import { connectNotificationsSocket } from "../api/realtime";
import { devLog } from "../utils/devLog";

interface DataContextType {
    jobs: any[];
    notifications: Notification[];
    jobsLoading: boolean;
    notificationsLoading: boolean;
    refreshJobs: (force?: boolean) => Promise<void>;
    refreshNotifications: () => Promise<void>;
    reviews: any[];
    refreshReviews: () => Promise<void>;
    earningsSummary: any;
    earningsLoading: boolean;
    refreshEarnings: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [earningsSummary, setEarningsSummary] = useState<any>(null);
    
    // Use a flag to track if we've EVER completed a fetch to prevent flashing "0"
    const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
    
    // Loading is true if we are actively fetching OR if we have a user but haven't fetched anything yet
    const [jobsLoading, setJobsLoading] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [earningsLoading, setEarningsLoading] = useState(false);

    const isLoadingJobs = jobsLoading || (!!user?.id && !hasInitiallyFetched);
    const isLoadingNotifications = notificationsLoading || (!!user?.id && !hasInitiallyFetched);
    const isLoadingEarnings = earningsLoading || (!!user?.id && user?.role === "professional" && !earningsSummary);

    const refreshReviews = useCallback(async () => {
        if (!user?.id) {
            setReviews([]);
            return;
        }

        try {
            const { getReviews } = await import("../api/auth.api");
            const data = await getReviews();
            setReviews(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error("DataContext: refreshReviews failed", error);
            setReviews([]);
        }
    }, [user?.id]);

    const refreshJobs = useCallback(async (force = false) => {
        if (!user?.id) {
            setJobs([]);
            return;
        }

        devLog("DataContext: refreshJobs starting", force ? "(force)" : "");
        setJobsLoading(true);
        try {
            const data = await listJobs(force);
            setJobs(Array.isArray(data) ? data : []);
            setHasInitiallyFetched(true);
            devLog("DataContext: refreshJobs completed, jobs:", data?.length);
        } catch (error) {
            console.error("DataContext: refreshJobs failed", error);
            setJobs([]);
        } finally {
            setJobsLoading(false);
        }
    }, [user?.id]);

    const refreshNotifications = useCallback(async () => {
        if (!user?.id) {
            setNotifications([]);
            setNotificationsLoading(false);
            return;
        }

        setNotificationsLoading(true);
        try {
            const data = await getNotifications();
            setNotifications(data);
            setHasInitiallyFetched(true);
        } catch (error) {
            console.error("DataContext: refreshNotifications failed", error);
            setNotifications([]);
        } finally {
            setNotificationsLoading(false);
        }
    }, [user?.id]);

    const refreshEarnings = useCallback(async () => {
        const userId = (user as any)?.user?.id || user?.id;
        if (!userId || user?.role !== "professional") {
            setEarningsSummary(null);
            return;
        }

        setEarningsLoading(true);
        try {
            const { getEarningsSummary } = await import("../api/payments.api");
            const summary = await getEarningsSummary(userId);
            setEarningsSummary(summary);
        } catch (error) {
            console.error("DataContext: refreshEarnings failed", error);
        } finally {
            setEarningsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            refreshJobs(true);
            refreshNotifications();
            refreshReviews();
            if (user?.role === "professional") {
                refreshEarnings();
            }

            const interval = setInterval(() => {
                refreshJobs(false);
                refreshNotifications();
                refreshReviews();
                if (user?.role === "professional") {
                    refreshEarnings();
                }
            }, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user?.id, user?.role, refreshJobs, refreshNotifications, refreshReviews, refreshEarnings]);

    // Real-time notifications (WebSocket)
    useEffect(() => {
        if (!user?.id) return;

        const cleanup = connectNotificationsSocket({
            onEvent: (ev) => {
                // Any notification event -> refresh notifications.
                // For job-related events, refreshing jobs keeps UI in sync too.
                if (ev?.event_type) {
                    refreshNotifications();
                    if (String(ev.event_type).toLowerCase().includes("job")) {
                        refreshJobs(true);
                    }
                    if (user?.role === "professional" && (
                        String(ev.event_type).toLowerCase().includes("payment") || 
                        String(ev.event_type).toLowerCase().includes("escrow") ||
                        String(ev.event_type).toLowerCase().includes("job")
                    )) {
                        refreshEarnings();
                    }
                }
            },
            onError: () => {
                // silently ignore; polling still keeps UI updated
            },
        });

        return () => cleanup();
    }, [user?.id, user?.role, refreshJobs, refreshNotifications, refreshEarnings]);

    // Clear all data when user changes to prevent cross-user data leakage
    useEffect(() => {
        setJobs([]);
        setNotifications([]);
        setReviews([]);
        setEarningsSummary(null);
        setJobsLoading(false);
        setNotificationsLoading(false);
        setEarningsLoading(false);
    }, [user?.id]);

    return (
        <DataContext.Provider
            value={{
                jobs,
                notifications,
                jobsLoading: isLoadingJobs,
                notificationsLoading: isLoadingNotifications,
                refreshJobs,
                refreshNotifications,
                reviews,
                refreshReviews,
                earningsSummary,
                earningsLoading: isLoadingEarnings,
                refreshEarnings,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
};
