import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface EstimateRequest {
    id: string;
    customerId: string;
    customerName: string;
    professionalId: string;
    professionalName: string; // Added
    professionalImage?: string; // Added (Optional for mock)
    description: string;
    location: string;
    budget: string;
    preferredDate?: string; // Added for timeline preference
    photos: string[];
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'new_request' | 'request_accepted' | 'new_message';
    requestId: string;
    isRead: boolean;
    createdAt: string;
}

interface MockServiceContextType {
    requests: EstimateRequest[];
    notifications: Notification[];
    addRequest: (request: Omit<EstimateRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
    updateRequestStatus: (requestId: string, status: 'accepted' | 'declined') => Promise<void>;
    markNotificationAsRead: (notificationId: string) => void;
}

const MockServiceContext = createContext<MockServiceContextType | undefined>(undefined);

export const MockServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [requests, setRequests] = useState<EstimateRequest[]>(() => {
        const saved = localStorage.getItem('mock_requests');
        return saved ? JSON.parse(saved) : [];
    });

    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const saved = localStorage.getItem('mock_notifications');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('mock_requests', JSON.stringify(requests));
    }, [requests]);

    useEffect(() => {
        localStorage.setItem('mock_notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addRequest = async (newRequestData: Omit<EstimateRequest, 'id' | 'status' | 'createdAt'>) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newRequest: EstimateRequest = {
            ...newRequestData,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        setRequests(prev => [newRequest, ...prev]);
        console.log("MockService: Added Request", newRequest);

        // Add notification for professional
        const notification: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            userId: newRequest.professionalId,
            message: 'You have got new request',
            type: 'new_request',
            requestId: newRequest.id,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [notification, ...prev]);
        console.log("MockService: Added Notification", notification);
    };

    const updateRequestStatus = async (requestId: string, status: 'accepted' | 'declined') => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        setRequests(prev => prev.map(req =>
            req.id === requestId ? { ...req, status } : req
        ));

        const request = requests.find(r => r.id === requestId);
        if (request && status === 'accepted') {
            // Add notification for customer
            const notification: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                userId: request.customerId,
                message: 'u got request accepted',
                type: 'request_accepted',
                requestId: requestId,
                isRead: false,
                createdAt: new Date().toISOString(),
            };
            setNotifications(prev => [notification, ...prev]);
        }
    };

    const markNotificationAsRead = (notificationId: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
        ));
    };

    return (
        <MockServiceContext.Provider value={{
            requests,
            notifications,
            addRequest,
            updateRequestStatus,
            markNotificationAsRead
        }}>
            {children}
        </MockServiceContext.Provider>
    );
};

export const useMockService = () => {
    const context = useContext(MockServiceContext);
    if (!context) {
        throw new Error('useMockService must be used within a MockServiceProvider');
    }
    return context;
};
