"use client";

import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  FileBarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Data Analytics</p>
          <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Performance Reports</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-surface-container-low text-on-surface-variant rounded-xl text-sm font-bold shadow-sm hover:bg-surface-container-high transition-all min-h-[44px]">
            <Calendar className="w-4 h-4 flex-shrink-0" /> Last 30 Days
          </button>
          <button className="flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] min-h-[44px]">
            <Download className="w-4 h-4 flex-shrink-0" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-on-surface">Attendance Rate</h4>
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-2 md:py-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-surface-container-low" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-secondary" strokeDasharray="92, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl md:text-3xl font-black text-on-surface">92%</span>
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">On Time</span>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:gap-8 w-full">
              <div className="text-center p-3 bg-surface-container-low rounded-xl">
                <p className="text-[10px] md:text-xs font-bold text-outline uppercase tracking-widest mb-1">Present</p>
                <p className="text-lg md:text-xl font-bold text-on-surface">24 Days</p>
              </div>
              <div className="text-center p-3 bg-surface-container-low rounded-xl">
                <p className="text-[10px] md:text-xs font-bold text-outline uppercase tracking-widest mb-1">Late</p>
                <p className="text-lg md:text-xl font-bold text-tertiary">2 Days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/10 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-8 min-w-[400px]">
            <h4 className="font-bold text-on-surface">Weekly Hours Trend</h4>
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-48 md:h-64 flex items-end justify-between gap-2 md:gap-4 px-2 md:px-4 min-w-[400px]">
            {[40, 42, 38, 45, 40, 35, 44].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 md:gap-3 group">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-primary/20 rounded-t-xl group-hover:bg-primary/40 transition-all cursor-pointer" 
                    style={{ height: `${height * (typeof window !== 'undefined' && window.innerWidth < 768 ? 3 : 4)}px` }}
                  ></div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {height}h
                  </div>
                </div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">W{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 bg-surface-container-low p-6 md:p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-on-surface">Key Insights</h4>
            <FileBarChart className="w-5 h-5 text-outline" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Efficiency</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Your average shift completion rate has increased by <span className="text-secondary font-bold">12%</span> this month.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5">
              <div className="flex items-center gap-2 text-primary mb-2">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Overtime</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                You&apos;ve logged <span className="text-primary font-bold">8.5 hours</span> of overtime in the Surgery Ward this week.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/5">
              <div className="flex items-center gap-2 text-tertiary mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Consistency</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                You have maintained a <span className="text-tertiary font-bold">100% check-in</span> accuracy within the geofence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
