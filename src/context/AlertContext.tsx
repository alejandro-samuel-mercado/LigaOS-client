'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertMessage {
    id: string;
    type: AlertType;
    title?: string;
    message: string;
}

interface AlertContextProps {
    showAlert: (type: AlertType, message: string, title?: string) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}

const getAlertStyles = (type: AlertType) => {
    switch (type) {
        case 'success':
            return 'bg-emerald-500/10 border-emerald-500 text-emerald-500';
        case 'error':
            return 'bg-red-500/10 border-red-500 text-black';
        case 'warning':
            return 'bg-amber-500/10 border-amber-500 text-amber-500';
        case 'info':
            return 'bg-blue-500/10 border-blue-500 text-blue-500';
    }
};

const getAlertIcon = (type: AlertType) => {
    switch (type) {
        case 'success':
            return <CheckCircle2 size={24} strokeWidth={2.5} />;
        case 'error':
            return <XCircle size={24} strokeWidth={2.5} />;
        case 'warning':
            return <AlertCircle size={24} strokeWidth={2.5} />;
        case 'info':
            return <Info size={24} strokeWidth={2.5} />;
    }
};

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alerts, setAlerts] = useState<AlertMessage[]>([]);

    const showAlert = useCallback((type: AlertType, message: string, title?: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setAlerts((prev) => [...prev, { id, type, message, title }]);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        }, 5000);
    }, []);

    const success = useCallback((message: string, title?: string) => showAlert('success', message, title), [showAlert]);
    const error = useCallback((message: string, title?: string) => showAlert('error', message, title), [showAlert]);
    const info = useCallback((message: string, title?: string) => showAlert('info', message, title), [showAlert]);
    const warning = useCallback((message: string, title?: string) => showAlert('warning', message, title), [showAlert]);

    const removeAlert = (id: string) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    };

    return (
        <AlertContext.Provider value={{ showAlert, success, error, info, warning }}>
            {children}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`flex items-start gap-4 p-4 border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] pointer-events-auto backdrop-blur-md bg-black/90 ${getAlertStyles(
                                alert.type
                            )}`}
                        >
                            <div className="shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                            <div className="flex-1 space-y-1">
                                {alert.title && (
                                    <h3 className="font-black uppercase italic tracking-tighter text-sm">
                                        {alert.title}
                                    </h3>
                                )}
                                <p className="text-xs font-medium text-red-400">{alert.message}</p>
                            </div>
                            <button
                                onClick={() => removeAlert(alert.id)}
                                className="shrink-0 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={18} strokeWidth={3} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </AlertContext.Provider>
    );
}
