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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-6 pb-6 pt-2 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent pointer-events-none">
      <div className="bg-surface-container-low/90 backdrop-blur-2xl border border-outline-variant/20 shadow-2xl rounded-[2rem] p-1.5 flex items-center justify-between h-[72px] relative overflow-hidden pointer-events-auto max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center h-full rounded-[1.5rem] flex-1 transition-all duration-300",
                isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <item.icon className={cn("w-[22px] h-[22px] transition-transform duration-300", isActive ? "scale-110 mb-0.5" : "scale-100 opacity-60")} />
                {isActive && <span className="text-[9px] font-black tracking-widest uppercase">{item.label}</span>}
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-primary/10 rounded-[1.5rem]"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
