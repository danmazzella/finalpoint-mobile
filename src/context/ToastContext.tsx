import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastContextType {
    showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
    hideToast: () => void;
    toast: {
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        isVisible: boolean;
        duration: number;
    };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Return default values instead of throwing an error
        return {
            showToast: () => { },
            hideToast: () => { },
            toast: {
                message: '',
                type: 'info' as 'success' | 'error' | 'info' | 'warning',
                isVisible: false,
                duration: 6000,
            },
        };
    }
    return context;
};

interface ToastProviderProps {
    children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState({
        message: '',
        type: 'info' as const,
        isVisible: false,
        duration: 6000,
    });

    const showToast = useCallback((
        message: string,
        type: 'success' | 'error' | 'info' | 'warning',
        duration: number = 6000
    ) => {
        setToast({
            message,
            type,
            isVisible: true,
            duration,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({
            ...prev,
            isVisible: false,
        }));
    }, []);

    const value = {
        showToast,
        hideToast,
        toast,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};
