"use client";

import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Bell, 
  Lock, 
  Eye, 
  Globe, 
  ShieldCheck,
  ChevronRight,
  LogOut,
  Settings as SettingsIcon,
  CreditCard,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: User, label: 'Profile Information', description: 'Personal details & role', color: 'text-primary' },
        { icon: Lock, label: 'Security & Password', description: 'Password & 2FA settings', color: 'text-secondary' },
        { icon: ShieldCheck, label: 'Privacy Settings', description: 'Data & permissions', color: 'text-orange-500' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Shift alerts & updates', color: 'text-primary' },
        { icon: Eye, label: 'Appearance', description: 'Dark mode & layout', color: 'text-secondary' },
        { icon: Globe, label: 'Language & Region', description: 'Timezone & display', color: 'text-blue-500' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', description: 'Guides & Support', color: 'text-primary' },
        { icon: Sparkles, label: 'What\'s New', description: 'App updates & news', color: 'text-secondary' },
      ]
    }
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Premium Centered Hero */}
      <motion.div variants={item} className="flex flex-col items-center pt-4 pb-2">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl group-hover:bg-primary/30 transition-all duration-500 opacity-50 overflow-hidden"></div>
          <div className="relative p-1 bg-white rounded-3xl border border-outline-variant/10 shadow-2xl">
            <img 
              src={user?.photoUrl || "https://picsum.photos/seed/user/120/120"} 
              alt="Profile" 
              className="w-28 h-28 rounded-2xl object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button className="absolute -bottom-2 -right-2 p-2 bg-secondary text-white rounded-xl shadow-lg border-2 border-white active:scale-90 transition-all">
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-6 text-center space-y-1">
          <h3 className="text-2xl font-headline font-black text-on-surface tracking-tight">{user?.name}</h3>
          <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">
            {user?.role} • {user?.staffId || 'RHB-STF-001'}
          </p>
          <div className="pt-4">
            <button className="px-6 py-2.5 bg-surface-container-low border border-outline-variant/10 rounded-full text-xs font-black text-primary shadow-sm active:scale-95 transition-all">
              Change Profile Photo
            </button>
          </div>
        </div>
      </motion.div>

      {/* Inset Grouped Settings */}
      <div className="space-y-8">
        {sections.map((section, i) => (SectionView(section, i)))}

        {/* Action Group */}
        <motion.div variants={item} className="space-y-3 pt-2">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 p-5 bg-error/5 hover:bg-error/10 text-error rounded-[2rem] border border-error/10 transition-all active:scale-[0.98] group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-headline font-black text-sm uppercase tracking-widest">Sign Out Account</span>
          </button>
          <p className="text-center text-[10px] font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">Version 2.4.1 (Stable Build)</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SectionView(section: any, i: number) {
  return (
    <motion.div key={i} variants={item} className="space-y-3 px-2">
      <h5 className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] px-2">{section.title}</h5>
      <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/5 shadow-sm overflow-hidden">
        {section.items.map((item: any, j: number) => (
          <button 
            key={j} 
            className={cn(
              "w-full flex items-center justify-between p-4 hover:bg-surface-container-high transition-all group",
              j !== section.items.length - 1 && "border-b border-outline-variant/5"
            )}
          >
            <div className="flex items-center gap-4 text-left min-w-0">
              <div className={cn("w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0", item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm text-on-surface tracking-tight leading-none mb-1">{item.label}</p>
                <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest truncate">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-on-surface-variant/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
