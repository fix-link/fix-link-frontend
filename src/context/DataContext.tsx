import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { listJobs } from "../api/jobs.api";
import { getNotifications, type Notification } from "../api/notifications.api";
import { connectNotificationsSocket } from "../api/realtime";

interface DataContextType {
    jobs: any[];
    notifications: Notification[];
    jobsLoading: boolean;
    notificationsLoading: boolean;
    refreshJobs: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // Use a flag to track if we've EVER completed a fetch to prevent flashing "0"
    const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
    
    // Loading is true if we are actively fetching OR if we have a user but haven't fetched anything yet
    const [jobsLoading, setJobsLoading] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    const isLoadingJobs = jobsLoading || (!!user?.id && !hasInitiallyFetched);
    const isLoadingNotifications = notificationsLoading || (!!user?.id && !hasInitiallyFetched);

    const refreshJobs = useCallback(async () => {
        if (!user?.id) {
            setJobs([]);
            return;
        }

        console.log("DataContext: refreshJobs starting");
        setJobsLoading(true);
        try {
            const data = await listJobs();
            setJobs(Array.isArray(data) ? data : []);
            setHasInitiallyFetched(true);
            console.log("DataContext: refreshJobs completed, jobs:", data?.length);
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

    useEffect(() => {
        if (user?.id) {
            refreshJobs();
            refreshNotifications();

            const interval = setInterval(() => {
                refreshJobs();
                refreshNotifications();
            }, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user?.id, refreshJobs, refreshNotifications]);

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
                        refreshJobs();
                    }
                }
            },
            onError: () => {
                // silently ignore; polling still keeps UI updated
            },
        });

        return () => cleanup();
    }, [user?.id, refreshJobs, refreshNotifications]);

    // Clear all data when user changes to prevent cross-user data leakage
    useEffect(() => {
        setJobs([]);
        setNotifications([]);
        setJobsLoading(false);
        setNotificationsLoading(false);
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
