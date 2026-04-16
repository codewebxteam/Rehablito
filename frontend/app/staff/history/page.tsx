"use client";

import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  CalendarDays, 
  TrendingUp, 
  ArrowRight,
  FileText,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Download,
  ShieldCheck,
  ClipboardList,
  Filter,
  BarChart3,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSearch } from '../context/SearchContext';
import { motion } from 'motion/react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const item = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function HistoryPage() {
  const { records } = useAttendance();
  const { searchQuery, setSearchQuery } = useSearch();

  const safeFormat = (dateStr: string | undefined | null, formatStr: string, fallback = '--:--') => {
    if (!dateStr) return fallback;
    try {
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return fallback;
      return format(date, formatStr);
    } catch {
      return fallback;
    }
  };

  const filteredRecords = records.filter(record => 
    (record.branchId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    safeFormat(record.date, 'MMM dd, yyyy').toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalHours = records.reduce((acc, r) => acc + (r.totalHours || 0), 0);
  const avgHours = totalHours / (records.length || 1);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* App Header: Summary & Export */}
      <motion.div variants={item} className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-2xl font-headline font-black text-on-surface tracking-tight">Attendance Log</h3>
          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <button className="p-2.5 bg-surface-container-low text-primary rounded-xl border border-outline-variant/10 shadow-sm active:scale-95 transition-all">
          <Download className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Primary Metrics Row: High Density */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Hours', value: totalHours.toFixed(1), icon: Clock, color: 'text-primary' },
          { label: 'Days Active', value: records.length, icon: CalendarDays, color: 'text-secondary' },
          { label: 'Consistency', value: '94%', icon: TrendingUp, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface-container-low p-4 rounded-[1.5rem] border border-outline-variant/5 flex flex-col items-center text-center gap-1 shadow-sm">
            <stat.icon className={cn("w-4 h-4 mb-1", stat.color)} />
            <p className="text-xl font-headline font-black text-on-surface tracking-tight leading-none">{stat.value}</p>
            <p className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Main Activity Feed */}
      <div className="space-y-4">
        <motion.div variants={item} className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-lg font-headline font-black tracking-tight text-on-surface">Recent Activity</h4>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all"><BarChart3 className="w-4 h-4" /></button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="px-2">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Ward, Date or Status..."
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-container-high rounded-full transition-all"
                >
                  <Filter className="w-3 h-3 text-on-surface-variant/40" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-2">
          {filteredRecords.length === 0 ? (
            <div key="empty-state" className="p-20 flex flex-col items-center text-center opacity-30">
              <ClipboardList className="w-12 h-12 mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">No entries found</p>
            </div>
          ) : (
            filteredRecords.slice(0, 10).map((record, i) => (
              <div 
                key={record.id || i} 
                className="bg-surface-container-low p-1.5 rounded-[1.5rem] border border-outline-variant/5 transition-all active:scale-[0.99] group shadow-sm"
              >
                <div className="bg-surface-container-lowest p-4 rounded-[1.25rem] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center shrink-0 border border-outline-variant/5">
                      <span className="text-[8px] font-black text-primary uppercase leading-none mb-0.5">{safeFormat(record.date, 'MMM')}</span>
                      <span className="text-base font-black text-on-surface leading-none tracking-tighter">{safeFormat(record.date, 'dd')}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h5 className="font-black text-sm text-on-surface truncate tracking-tight">{record.branchId?.name || 'Main Center'}</h5>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          record.status === 'present' ? "bg-secondary" : "bg-primary"
                        )}></div>
                      </div>
                      <p className="text-[10px] font-bold text-on-surface-variant/50 leading-none truncate uppercase tracking-widest">
                        {safeFormat(record.checkIn, 'hh:mm a')} — {record.checkOut ? safeFormat(record.checkOut, 'hh:mm a') : 'On-going'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <p className="text-lg font-headline font-black text-on-surface tracking-tighter leading-none">
                      {record.totalHours ? `${Math.floor(record.totalHours)}h` : '--'}
                    </p>
                    <p className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Duration</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>

      {/* Standard App Calendar View */}
      <motion.div variants={item} className="space-y-4">
        <div className="px-2">
          <h4 className="text-lg font-headline font-black tracking-tight text-on-surface">Presence Calendar</h4>
        </div>
        
        <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/5 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="font-black text-sm tracking-tight">{format(new Date(), 'MMMM yyyy')}</div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 bg-surface-container-lowest border border-outline-variant/10 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-1.5 bg-surface-container-lowest border border-outline-variant/10 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest text-center">{day}</div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const hasRecord = records.some(r => {
                const d = parseISO(r.date);
                return !isNaN(d.getTime()) && d.getDate() === day;
              });
              const isToday = day === new Date().getDate();
              return (
                <div key={day} className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative overflow-hidden",
                  isToday ? "bg-primary text-white shadow-lg" : "hover:bg-surface-container-high"
                )}>
                  <span className="text-xs font-black">{day}</span>
                  {hasRecord && (
                    <div className={cn(
                      "w-1 h-1 rounded-full mt-0.5",
                      isToday ? "bg-white" : "bg-primary"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Attended</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40">
              <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span>Absent</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Importing missing icons for the redesign

