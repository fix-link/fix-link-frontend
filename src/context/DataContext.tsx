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
    const [jobsLoading, setJobsLoading] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

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
            return;
        }

        setNotificationsLoading(true);
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("DataContext: refreshNotifications failed", error);
            setNotifications([]);
        } finally {
            setNotificationsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            setJobs([]);
            setNotifications([]);
            return;
        }

        refreshJobs();
        refreshNotifications();
    }, [user?.id]); // Removed refreshJobs, refreshNotifications from deps to prevent unnecessary re-runs

    useEffect(() => {
        if (!user?.id) return;

        const maybeRefresh = () => {
            if (document.visibilityState !== "visible") return;
            refreshNotifications();
            refreshJobs();
        };

        const interval = setInterval(maybeRefresh, 30000);
        document.addEventListener("visibilitychange", maybeRefresh);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", maybeRefresh);
        };
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
                jobsLoading,
                notificationsLoading,
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
