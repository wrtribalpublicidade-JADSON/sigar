import React from 'react';
import { ViewState } from '../types';
import { Sidebar } from './layout/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  isAdmin: boolean;
  userName: string | null;
  userEmail: string | null;
  notificationCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onChangeView,
  onLogout,
  isAdmin,
  userName,
  userEmail,
  notificationCount = 0
}) => {
  return (
    <div className="h-screen bg-brand-light flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onChangeView}
        onLogout={onLogout}
        userName={userName}
        userEmail={userEmail}
        isAdmin={isAdmin}
        notificationCount={notificationCount}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 pt-16 md:pt-6 overflow-y-auto h-full selection:bg-brand-orange selection:text-white">
        <div className="max-w-[1600px] 2xl:max-w-[1900px] 3xl:max-w-[2400px] mx-auto animate-fade-in relative z-10">
          {children}
        </div>

        {/* Subtle Decorative Grid Base */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </main>
    </div>
  );
};
