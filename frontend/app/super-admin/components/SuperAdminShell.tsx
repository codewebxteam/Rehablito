"use client";

import React, { useState } from 'react';
import { Bell, Menu, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';

import { Sidebar } from './Sidebar';
import { SuperAdminTab, isSuperAdminTab } from '../lib/navigation';
import { AddTransactionProvider, useAddTransaction } from './AddTransactionContext';
import { AddTransactionModal } from './AddTransactionModal';
import { BranchProvider } from './BranchContext';

interface SuperAdminShellProps {
  children: React.ReactNode;
}

/** Inner shell — has access to the AddTransaction context */
function ShellInner({ children }: SuperAdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    services: {
      title: 'Therapy Services',
      subtitle: 'Manage common therapy services and dynamic base pricing'
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Configure platform-wide preferences'
    }
  };

  const currentView = viewConfig[activeTab];

  const handleTabChange = React.useCallback(
    (tab: SuperAdminTab) => {
      router.push(`/super-admin/${tab}`);
      setIsMobileMenuOpen(false);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar — visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar
          active={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {/* Mobile/Tablet sidebar overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-screen z-[70] lg:hidden"
            >
              <Sidebar
                active={activeTab}
                onChange={handleTabChange}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content — full width on mobile, offset on desktop */}
      <main className="flex-1 lg:ml-[270px] relative min-h-screen flex flex-col w-full">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #ffe4e6 0%, #f7f9fb 40%)',
            zIndex: 0
          }}
        />

        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 lg:py-5 w-full sticky top-0 z-40 glass border-b border-outline-variant/10">
          {/* Hamburger — visible below lg */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors mr-3"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <motion.div
            key={currentView.title}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex-1 min-w-0"
          >
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-on-surface font-headline tracking-tight truncate">{currentView.title}</h2>
            <p className="text-xs sm:text-sm font-medium text-on-surface-variant mt-0.5 opacity-60 truncate">{currentView.subtitle}</p>
          </motion.div>

          <div className="flex items-center gap-2 sm:gap-3 ml-4">
            {/* Notification bell */}
            {/* <div className="relative group">
              <button className="text-on-surface-variant p-2.5 sm:p-3 bg-surface-container-lowest hover:bg-surface-container-low rounded-xl sm:rounded-2xl border border-outline-variant/20 transition-all shadow-sm">
                <Bell size={18} />
              </button>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white animate-pulse"></span>
            </div> */}
          </div>
        </header>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-8 lg:pb-16 relative z-10 overflow-auto">
          <div className="w-full max-w-[1440px] mx-auto">
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
        </div>
      </main>

      {/* Global modal — rendered at root level */}
      <AddTransactionModal />
    </div>
  );
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  return (
    <BranchProvider>
      <AddTransactionProvider>
        <ShellInner>{children}</ShellInner>
      </AddTransactionProvider>
    </BranchProvider>
  );
}
