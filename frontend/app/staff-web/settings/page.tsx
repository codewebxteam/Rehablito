"use client";

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Bell, 
  Lock, 
  Eye, 
  Globe, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user } = useAuth();

  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: User, label: 'Profile Information', description: 'Update your personal details and clinical role', color: 'text-primary' },
        { icon: Lock, label: 'Security & Password', description: 'Manage your password and 2FA settings', color: 'text-secondary' },
        { icon: ShieldCheck, label: 'Privacy Settings', description: 'Control how your data is shared', color: 'text-tertiary' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Configure shift alerts and hospital updates', color: 'text-primary' },
        { icon: Eye, label: 'Appearance', description: 'Customize your dashboard theme and layout', color: 'text-secondary' },
        { icon: Globe, label: 'Language & Region', description: 'Set your preferred language and timezone', color: 'text-tertiary' },
      ]
    }
  ];

  return (
    <div className="space-y-6 md:space-y-8 max-w-4xl mx-auto md:mx-0">
      <div className="space-y-1 text-center md:text-left">
        <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">System Configuration</p>
        <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">User Settings</h3>
      </div>

      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
        <img 
          src={user?.photoUrl || "https://picsum.photos/seed/user/100/100"} 
          alt="Profile" 
          className="w-24 h-24 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 space-y-1">
          <h4 className="text-xl font-bold text-on-surface">{user?.name}</h4>
          <p className="text-on-surface-variant font-medium">{user?.role} • {user?.staffId}</p>
          <button className="mt-3 py-2 px-4 bg-primary/10 sm:p-0 sm:bg-transparent rounded-lg text-primary text-sm font-bold sm:hover:underline transition-colors w-full sm:w-auto">
            Change Profile Photo
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {sections.map((section, i) => (
          <div key={i} className="space-y-4">
            <h5 className="text-xs font-bold text-outline uppercase tracking-widest px-2">{section.title}</h5>
            <div className="bg-surface-container-low rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
              {section.items.map((item, j) => (
                <button 
                  key={j} 
                  className={cn(
                    "w-full flex flex-row items-start sm:items-center justify-between p-4 sm:p-6 hover:bg-surface-container-lowest transition-all group gap-4",
                    j !== section.items.length - 1 && "border-b border-outline-variant/10"
                  )}
                >
                  <div className="flex flex-row items-start sm:items-center gap-4 sm:gap-5 text-left flex-1 min-w-0">
                    <div className={cn("p-3 rounded-xl bg-surface-container-lowest shadow-sm sm:group-hover:scale-110 transition-transform flex-shrink-0", item.color)}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface truncate">{item.label}</p>
                      <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 sm:mt-0 line-clamp-2 sm:line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors flex-shrink-0 mt-3 sm:mt-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
