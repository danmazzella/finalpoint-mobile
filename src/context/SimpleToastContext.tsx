import React, { createContext, useContext, useState, useCallback } from 'react';

interface SimpleToastContextType {
    showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
    hideToast: () => void;
    toast: {
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        isVisible: boolean;
        duration: number;
    };
}

const SimpleToastContext = createContext<SimpleToastContextType | undefined>(undefined);

export const useSimpleToast = () => {
    const context = useContext(SimpleToastContext);
    if (!context) {
        return {
            showToast: () => { },
            hideToast: () => { },
            toast: {
                message: '',
                type: 'info' as 'success' | 'error' | 'info' | 'warning',
                isVisible: false,
                duration: 10000,
            },
        };
    }
    return context;
};

interface SimpleToastProviderProps {
    children: React.ReactNode;
}

export const SimpleToastProvider: React.FC<SimpleToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState({
        message: '',
        type: 'info' as 'success' | 'error' | 'info' | 'warning',
        isVisible: false,
        duration: 10000,
    });

    const showToast = useCallback((
        message: string,
        type: 'success' | 'error' | 'info' | 'warning',
        duration: number = 10000
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
        <SimpleToastContext.Provider value={value}>
            {children}
        </SimpleToastContext.Provider>
    );
};
