"use client";

import React from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';

import { Sidebar } from './Sidebar';

import { SuperAdminTab, isSuperAdminTab } from '../lib/navigation';

interface SuperAdminShellProps {
  children: React.ReactNode;
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const tabSegment = pathname.split('/')[2] ?? 'dashboard';
  const activeTab: SuperAdminTab = isSuperAdminTab(tabSegment) ? tabSegment : 'dashboard';

  const viewConfig: Record<SuperAdminTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Global Dashboard',
      subtitle: 'Consolidated insights across all locations'
    },
    patients: {
      title: 'Patients Management',
      subtitle: 'Manage admitted and discharged patients'
    },
    leads: {
      title: 'Leads Pipeline',
      subtitle: 'Track and convert upcoming leads'
    },
    staff: {
      title: 'Staff Management',
      subtitle: 'Manage employee records and roles'
    },
    attendance: {
      title: 'Daily Attendance',
      subtitle: 'Live staff presence and tracking'
    },
    finance: {
      title: 'Financial Overview',
      subtitle: 'Revenue, expenses, and transaction logs'
    },
    branches: {
      title: 'Branches',
      subtitle: 'Manage and configure branch locations'
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Configure platform-wide preferences'
    }
  };

  const currentView = viewConfig[activeTab];

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar
        active={activeTab}
        onChange={(tab) => router.push(`/super-admin/${tab}`)}
      />

      <main className="flex-1 ml-72 relative min-h-screen flex flex-col">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #ffe4e6 0%, #f7f9fb 40%)',
            zIndex: 0
          }}
        />

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

          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div className="relative group">
              <button className="text-on-surface-variant p-3 bg-surface-container-lowest hover:bg-surface-container-low rounded-2xl border border-outline-variant/20 transition-all shadow-sm">
                <Bell size={20} />
              </button>
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white animate-pulse"></span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-10 pt-6 pb-16 relative z-10 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
