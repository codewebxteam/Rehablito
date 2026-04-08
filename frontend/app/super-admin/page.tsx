"use client";

import React, { useState } from 'react';
import { Bell, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Auth
import { useRequireAuth, useAuth } from '../context/AuthContext';

// Reusable Components
import { Sidebar } from './components/Sidebar';

// Views
import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { LeadsView } from './views/LeadsView';
import { StaffView } from './views/StaffView';
import { AttendanceView } from './views/AttendanceView';
import { FinanceView } from './views/FinanceView';

export default function SuperAdminPage() {
  const { user, isLoading } = useRequireAuth(['super_admin']);
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Show spinner while auth is resolving
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-sage/30 border-t-brand-sage rounded-full animate-spin" />
          <p className="text-sm font-semibold text-on-surface-variant">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Map active tab to its component and respective header text
  const viewConfig: Record<string, { component: React.ReactNode, title: string, subtitle: string }> = {
    'Dashboard': {
      component: <DashboardView />,
      title: 'Global Dashboard',
      subtitle: 'Consolidated insights across all locations'
    },
    'Patients': {
      component: <PatientsView />,
      title: 'Patients Management',
      subtitle: 'Manage admitted and discharged patients'
    },
    'Leads': {
      component: <LeadsView />,
      title: 'Leads Pipeline',
      subtitle: 'Track and convert upcoming leads'
    },
    'Staff': {
      component: <StaffView />,
      title: 'Staff Management',
      subtitle: 'Manage employee records and roles'
    },
    'Attendance': {
      component: <AttendanceView />,
      title: 'Daily Attendance',
      subtitle: 'Live staff presence and tracking'
    },
    'Finance': {
      component: <FinanceView />,
      title: 'Financial Overview',
      subtitle: 'Revenue, expenses, and transaction logs'
    },
  };

  const currentView = viewConfig[activeTab] || viewConfig['Dashboard'];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Fixed Sidebar */}
      <Sidebar active={activeTab} onChange={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="flex-1 ml-72 relative min-h-screen flex flex-col">
        {/* Background Gradient: #ffe4e6 (0%) to #f7f9fb (40%) */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
            background: 'linear-gradient(180deg, #ffe4e6 0%, #f7f9fb 40%)',
            zIndex: 0
          }} 
        />
        
        {/* Dynamic Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-10 py-8 w-full sticky top-0 z-40 glass border-b border-outline-variant/10">
          <motion.div 
            key={currentView.title}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <h2 className="text-3xl font-black text-on-surface font-headline tracking-tight">{currentView.title}</h2>
            <p className="text-sm font-medium text-on-surface-variant mt-1 opacity-60">{currentView.subtitle}</p>
          </motion.div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* User info pill */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-brand-sage/10 flex items-center justify-center">
                  <User size={14} className="text-brand-sage" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-on-surface leading-none">{user.name}</p>
                  <p className="text-on-surface-variant mt-0.5 font-medium leading-none capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="relative group">
              <button className="text-on-surface-variant p-3 bg-surface-container-lowest hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all shadow-sm">
                <Bell size={20} />
              </button>
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white animate-pulse"></span>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="text-on-surface-variant p-3 bg-surface-container-lowest hover:bg-red-50 hover:text-red-500 rounded-2xl border border-outline-variant/20 transition-all shadow-sm"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Content Rendering */}
        <div className="flex-1 px-10 pt-6 pb-16 relative z-10 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {currentView.component}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
