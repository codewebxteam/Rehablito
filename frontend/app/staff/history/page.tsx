"use client";

import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { 
  CalendarDays, 
  TrendingUp, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSearch } from '../context/SearchContext';

export default function HistoryPage() {
  const { records } = useAttendance();
  const { searchQuery } = useSearch();

  const filteredRecords = records.filter(record => 
    record.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
    format(parseISO(record.date), 'MMM dd, yyyy').toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Attendance History</p>
          <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Monthly Records</h3>
        </div>
        <button className="text-primary font-bold text-sm hover:underline flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest p-6 md:p-8 rounded-2xl relative overflow-hidden border border-outline-variant/10 shadow-sm">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-on-surface-variant text-sm font-label tracking-wider uppercase">October Summary</h3>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
              <div>
                <p className="text-4xl md:text-5xl font-headline font-extrabold text-primary">
                  {Math.floor(records.reduce((acc, r) => acc + (r.totalHours || 0), 0))}
                </p>
                <p className="text-on-surface-variant text-sm font-medium mt-1">Total Hours Worked</p>
              </div>
              <div className="h-px bg-outline-variant/20 md:hidden w-full"></div>
              <div>
                <p className="text-4xl md:text-5xl font-headline font-extrabold text-secondary">{records.length}</p>
                <p className="text-on-surface-variant text-sm font-medium mt-1">Days Present</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 bg-surface-container-low rounded-2xl p-4 md:p-8 border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-5 px-6 pb-2 text-[10px] font-label uppercase text-outline tracking-wider">
              <div>Date & Ward</div>
              <div>Check In</div>
              <div>Check Out</div>
              <div>Total Hours</div>
              <div>Status</div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
                <CalendarDays className="w-12 h-12 text-outline/30 mx-auto mb-3" />
                <p className="text-on-surface-variant font-medium">No attendance records found.</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="flex flex-col md:grid md:grid-cols-5 gap-3 md:gap-0 items-start md:items-center p-4 md:px-6 md:py-4 bg-surface-container-lowest rounded-2xl md:hover:translate-x-1 transition-transform cursor-default border border-outline-variant/5">
                  <div className="flex flex-col w-full md:w-auto pb-3 md:pb-0 border-b border-outline-variant/10 md:border-none">
                    <span className="font-bold text-on-surface text-sm">{format(parseISO(record.date), 'MMM dd, yyyy')}</span>
                    <span className="text-xs text-on-surface-variant">{record.ward}</span>
                  </div>
                  
                  <div className="flex justify-between md:block w-full md:w-auto text-sm font-medium text-on-surface">
                    <span className="md:hidden text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Check In</span>
                    <span>{format(parseISO(record.checkIn), 'hh:mm a')}</span>
                  </div>
                  
                  <div className="flex justify-between md:block w-full md:w-auto text-sm font-medium text-on-surface">
                    <span className="md:hidden text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Check Out</span>
                    <span>{record.checkOut ? format(parseISO(record.checkOut), 'hh:mm a') : "--:--"}</span>
                  </div>
                  
                  <div className="flex justify-between md:block w-full md:w-auto text-sm font-black text-on-surface">
                    <span className="md:hidden text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Total</span>
                    <span>{record.totalHours ? `${Math.floor(record.totalHours)}h ${Math.round((record.totalHours % 1) * 60)}m` : "--"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center md:block w-full md:w-auto pt-2 md:pt-0">
                    <span className="md:hidden text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Status</span>
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-bold uppercase tracking-tight rounded-full whitespace-nowrap",
                      record.status === 'COMPLETED' && "bg-secondary/10 text-secondary",
                      record.status === 'OVERTIME' && "bg-primary/10 text-primary",
                      record.status === 'SHORT_SHIFT' && "bg-tertiary/10 text-tertiary",
                    )}>
                      {record.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h3 className="text-xl md:text-2xl font-headline font-bold">October 2023</h3>
          <div className="flex gap-4">
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors bg-surface-container-lowest shadow-sm">
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors bg-surface-container-lowest shadow-sm">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center gap-y-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-[0.6875rem] font-label text-on-surface-variant uppercase tracking-widest pb-4">{day}</div>
          ))}
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const hasRecord = records.some(r => new Date(r.date).getDate() === day);
            return (
              <div key={day} className={cn(
                "h-16 flex items-center justify-center font-medium relative cursor-pointer hover:bg-white rounded-xl transition-all",
                day === new Date().getDate() && "bg-primary text-white shadow-lg font-bold"
              )}>
                {day}
                {hasRecord && (
                  <div className={cn(
                    "absolute bottom-3 w-1.5 h-1.5 rounded-full",
                    day === new Date().getDate() ? "bg-white" : "bg-primary"
                  )}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
