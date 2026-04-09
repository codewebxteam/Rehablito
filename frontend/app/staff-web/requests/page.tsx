"use client";

import React from 'react';
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RequestsPage() {
  const requests = [
    { id: 1, type: 'Leave Request', reason: 'Annual Vacation', date: 'Oct 15, 2023', status: 'Approved', color: 'text-secondary' },
    { id: 2, type: 'Shift Swap', reason: 'Family Emergency', date: 'Oct 20, 2023', status: 'Pending', color: 'text-primary' },
    { id: 3, type: 'Overtime Claim', reason: 'Emergency Surgery Support', date: 'Oct 22, 2023', status: 'Pending', color: 'text-primary' },
    { id: 4, type: 'Leave Request', reason: 'Medical Checkup', date: 'Oct 05, 2023', status: 'Rejected', color: 'text-error' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Administrative Actions</p>
          <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Requests & Approvals</h3>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] w-full sm:w-auto min-h-[44px]">
          <Plus className="w-4 h-4 flex-shrink-0" /> New Request
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 md:gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2 px-2 border-b border-outline-variant/10 md:border-none pb-2 md:pb-0">
            <button className="text-sm font-bold text-primary border-b-2 border-primary pb-2 px-2 md:px-0">All Requests</button>
            <button className="text-sm font-medium text-on-surface-variant pb-2 px-2 md:px-0">Pending</button>
            <button className="text-sm font-medium text-on-surface-variant pb-2 px-2 md:px-0">Approved</button>
          </div>

          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-surface-container-lowest p-4 md:p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 group hover:border-primary/20 transition-all">
                <div className="flex items-start md:items-center gap-4 md:gap-5 w-full md:w-auto">
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 md:mt-0",
                    req.status === 'Approved' ? "bg-secondary/10 text-secondary" : 
                    req.status === 'Pending' ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                  )}>
                    {req.status === 'Approved' ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : 
                     req.status === 'Pending' ? <Clock className="w-5 h-5 md:w-6 md:h-6" /> : <XCircle className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-on-surface text-sm md:text-base">{req.type}</h5>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">{req.reason}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-outline font-bold uppercase tracking-wider">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      Submitted on {req.date}
                    </div>
                  </div>
                  
                  {/* Mobile Actions Header */}
                  <div className="md:hidden pt-1">
                    <button className="p-2 -mr-2 text-outline hover:text-on-surface transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto pt-3 md:pt-0 border-t border-outline-variant/10 md:border-none mt-2 md:mt-0">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full",
                    req.status === 'Approved' ? "bg-secondary/10 text-secondary" : 
                    req.status === 'Pending' ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                  )}>
                    {req.status}
                  </span>
                  <button className="hidden md:block p-1 ml-4 text-outline hover:text-on-surface transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low p-6 md:p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
            <h4 className="text-lg font-headline font-bold mb-6">Request Summary</h4>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm text-on-surface-variant font-medium">Pending</span>
                </div>
                <span className="font-bold text-on-surface">2</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <span className="text-sm text-on-surface-variant font-medium">Approved</span>
                </div>
                <span className="font-bold text-on-surface">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  <span className="text-sm text-on-surface-variant font-medium">Rejected</span>
                </div>
                <span className="font-bold text-on-surface">1</span>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-outline-variant/10">
              <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Leave Balance</span>
                </div>
                <p className="text-2xl font-black text-on-surface">14 Days</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-1">Available for current year</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
