"use client";

import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SchedulesPage() {
  const shifts = [
    { day: 'Mon', date: 'Oct 23', ward: 'Surgery Ward B', time: '08:00 AM - 04:00 PM', type: 'Morning' },
    { day: 'Tue', date: 'Oct 24', ward: 'Emergency Unit', time: '04:00 PM - 12:00 AM', type: 'Evening' },
    { day: 'Wed', date: 'Oct 25', ward: 'Surgery Ward B', time: '08:00 AM - 04:00 PM', type: 'Morning' },
    { day: 'Thu', date: 'Oct 26', ward: 'OFF', time: '-', type: 'Off' },
    { day: 'Fri', date: 'Oct 27', ward: 'ICU', time: '12:00 AM - 08:00 AM', type: 'Night' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Clinical Rotations</p>
          <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Shift Schedules</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-surface-container-low p-1 rounded-xl flex-1 sm:flex-none">
            <button className="flex-1 sm:flex-none px-4 py-2 bg-surface-container-lowest rounded-lg text-sm font-bold shadow-sm">Week</button>
            <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-on-surface-variant">Month</button>
          </div>
          <button className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] min-h-[44px]">
            <Plus className="w-4 h-4 flex-shrink-0" /> Request Change
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h4 className="font-bold text-on-surface">October 23 - October 29, 2023</h4>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-surface-container-low rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="space-y-4">
            {shifts.map((shift, i) => (
              <div key={i} className={cn(
                "p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 group transition-all",
                shift.type === 'Off' 
                  ? "bg-surface-container-low border-outline-variant/10 opacity-60" 
                  : "bg-surface-container-lowest border-outline-variant/10 shadow-sm hover:border-primary/30"
              )}>
                <div className="flex items-start md:items-center gap-4 md:gap-8 w-full md:w-auto">
                  <div className="text-left md:text-center min-w-[60px]">
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{shift.day}</p>
                    <p className="text-xl md:text-xl font-headline font-black text-on-surface">{shift.date.split(' ')[1]}</p>
                  </div>
                  <div className="hidden md:block w-px h-10 bg-outline-variant/30"></div>
                  <div className="md:hidden w-px h-10 bg-outline-variant/30 ml-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between md:justify-start w-full">
                      <h5 className="font-bold text-on-surface">{shift.ward}</h5>
                      <span className={cn(
                        "md:hidden px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full",
                        shift.type === 'Morning' && "bg-secondary/10 text-secondary",
                        shift.type === 'Evening' && "bg-primary/10 text-primary",
                        shift.type === 'Night' && "bg-tertiary/10 text-tertiary",
                        shift.type === 'Off' && "bg-outline/10 text-outline",
                      )}>
                        {shift.type}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                        <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{shift.time}</span>
                      </div>
                      {shift.type !== 'Off' && (
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                          <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                          <span>Main Building</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                    shift.type === 'Morning' && "bg-secondary/10 text-secondary",
                    shift.type === 'Evening' && "bg-primary/10 text-primary",
                    shift.type === 'Night' && "bg-tertiary/10 text-tertiary",
                    shift.type === 'Off' && "bg-outline/10 text-outline",
                  )}>
                    {shift.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
            <h4 className="text-lg font-headline font-bold mb-6">Weekly Stats</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant font-medium">Total Shifts</span>
                <span className="font-bold text-on-surface">5 Shifts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant font-medium">Total Hours</span>
                <span className="font-bold text-primary">40 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant font-medium">On-call Days</span>
                <span className="font-bold text-secondary">2 Days</span>
              </div>
              <div className="pt-6 border-t border-outline-variant/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-outline uppercase tracking-widest">Target Completion</span>
                  <span className="text-xs font-bold text-primary">80%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="w-[80%] h-full bg-primary rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-tertiary/10 rounded-lg text-tertiary">
                <Calendar className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-on-surface">Upcoming Holiday</h5>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Hospital Foundation Day is on Oct 31st. All non-emergency staff have a mandatory holiday.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
