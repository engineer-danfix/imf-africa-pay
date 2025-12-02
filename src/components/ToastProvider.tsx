import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

type Toast = { id: number; message: string; type: 'success' | 'error' };

const ToastContext = createContext<{ showToast: (message: string, type?: 'success' | 'error') => void }>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Generate unique IDs
  let toastIdCounter = 0;
  const generateId = () => ++toastIdCounter;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-white font-medium flex items-center text-sm ${
              toast.type === 'success' 
                ? 'bg-green-600 dark:bg-green-700' 
                : 'bg-red-600 dark:bg-red-700'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            {toast.message}
          </motion.div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};