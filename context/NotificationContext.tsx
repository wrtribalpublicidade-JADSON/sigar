import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type NotificationType = 'success' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextData {
  showNotification: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextData>({} as NotificationContextData);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border w-80 animate-fade-in transition-all transform
              ${notification.type === 'success' 
                ? 'bg-white border-l-4 border-l-green-500 border-slate-100' 
                : 'bg-white border-l-4 border-l-red-500 border-slate-100'}
            `}
            role="alert"
          >
            <div className="shrink-0 mt-0.5">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {notification.type === 'success' ? 'Sucesso' : 'Erro'}
              </h4>
              <p className="text-sm text-slate-600 mt-1 leading-tight">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-slate-400 hover:text-slate-600 transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};