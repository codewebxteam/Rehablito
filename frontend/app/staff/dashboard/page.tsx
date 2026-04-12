"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Clock,
  CalendarDays,
  ArrowRight,
  Hourglass,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import api from '@/lib/api';

interface DashboardToday {
  isOnDuty: boolean;
  elapsedSeconds: number;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkIn: string | null;
  checkOut: string | null;
  dutyHours: number;
  status: string;
}

interface DashboardMonthly {
  month: string;
  totalHours: number;
  averageHours: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  totalRecorded: number;
}

interface DashboardData {
  profile: { name: string; staffId?: string; email?: string; branch?: { name?: string } | null };
  today: DashboardToday;
  monthly: DashboardMonthly;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await api.get('/staff/dashboard');
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Failed to fetch staff dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const firstName = (user?.name || data?.profile.name || '').split(' ')[0] || 'there';

  const stats = [
    {
      label: 'Hours This Month',
      value: data ? data.monthly.totalHours.toFixed(1) : '0',
      icon: Clock,
      color: 'text-primary',
    },
    {
      label: 'Days Present',
      value: data ? data.monthly.presentDays : 0,
      icon: CalendarDays,
      color: 'text-secondary',
    },
    {
      label: 'Avg Daily Hours',
      value: data ? data.monthly.averageHours.toFixed(1) : '0',
      icon: Hourglass,
      color: 'text-tertiary',
    },
  ];

  const isOnDuty = !!data?.today.isOnDuty;
  const hasCheckedOut = !!data?.today.hasCheckedOut;
  const branchName = data?.profile.branch?.name;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Overview</p>
          <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">
            Welcome, {firstName}
          </h3>
          {data?.monthly.month && (
            <p className="text-sm text-on-surface-variant">{data.monthly.month}{branchName ? ` · ${branchName}` : ''}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="col-span-12 md:col-span-4 bg-surface-container-lowest p-4 md:p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-center min-h-[110px]">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <div className={cn("p-2 rounded-lg bg-surface-container-low", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <p className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">
              {isLoading ? '—' : stat.value}
            </p>
            <p className="text-on-surface-variant text-sm font-medium mt-1">{stat.label}</p>
          </div>
        ))}

        <div className="col-span-12 lg:col-span-8 bg-primary text-white p-5 md:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between relative group overflow-hidden gap-5 md:gap-0">
          <div className="absolute inset-0 bg-white/5 opacity-10"></div>
          <div className="relative z-10 space-y-4">
            <div>
              <p className="text-white/70 text-xs font-label uppercase tracking-widest mb-1">Quick Action</p>
              <h3 className="text-xl md:text-2xl font-headline font-bold">Ready for your next shift?</h3>
              <p className="text-white/80 text-sm max-w-md mt-1 mb-6">Check your schedule and prepare for today&apos;s clinical rounds.</p>
            </div>
            <Link href="/staff/attendance" className="inline-flex bg-white text-primary px-6 py-4 md:py-3 rounded-xl text-sm font-bold shadow-xl hover:bg-surface-container-low transition-colors items-center justify-center gap-2 w-full md:w-auto min-h-[44px]">
              Go to Attendance
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative z-10 w-36 h-36 hidden md:block">
            <img 
              src="https://picsum.photos/seed/dashboard/200/200" 
              alt="Dashboard" 
              className="w-full h-full object-cover rounded-2xl shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-3xl p-5 md:p-6 border border-outline-variant/10 shadow-sm flex flex-col justify-center">
          <h4 className="text-lg font-headline font-bold mb-4">Current Status</h4>
          <div className="space-y-4">
            <div className={cn(
              "p-4 rounded-xl flex items-center gap-4",
              isOnDuty ? "bg-secondary/10 text-secondary"
                : hasCheckedOut ? "bg-primary/10 text-primary"
                : "bg-surface-container-low text-on-surface-variant"
            )}>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                {hasCheckedOut ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Shift Status</p>
                <p className="font-bold">
                  {isOnDuty ? 'On Duty' : hasCheckedOut ? 'Shift Completed' : 'Not Checked In'}
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isOnDuty && data?.today.checkIn
                ? `Checked in at ${data.today.checkIn}. Duty hours logging now.`
                : hasCheckedOut && data?.today.checkOut
                ? `Shift ended at ${data.today.checkOut}. Total: ${data.today.dutyHours.toFixed(1)} hrs.`
                : 'You are not currently clocked in. Please head to the attendance panel to start your shift.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
