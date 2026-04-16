"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home', path: '/staff/dashboard' },
  { id: 'attendance', icon: CalendarDays, label: 'Punch', path: '/staff/attendance' },
  { id: 'history', icon: Clock, label: 'History', path: '/staff/history' },
  { id: 'profile', icon: User, label: 'Profile', path: '/staff/settings' }, // Assuming settings is profile
];

export const MobileNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 focus:outline-none">
      <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/10 shadow-2xl rounded-3xl p-2 flex items-center justify-around h-16 relative overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 rounded-2xl w-full transition-all duration-300",
                isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <item.icon className={cn("w-5 h-5", isActive ? "scale-110" : "scale-100")} />
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary/5 rounded-2xl border-t border-primary/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
