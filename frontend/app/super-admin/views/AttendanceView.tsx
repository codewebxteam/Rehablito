import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAttendance, useAdminAttendanceStats, AdminAttendance } from '../hooks/useAdminData';
import { api } from '@/lib/api';

export const AttendanceView = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance = [], isLoading, error, refetch } = useAdminAttendance(today);
  const { data: stats, isLoading: statsLoading } = useAdminAttendanceStats();
  const [search, setSearch] = useState('');

  const filteredAttendance = attendance.filter((a: AdminAttendance) =>
    a.staffId?.toLowerCase().includes(search.toLowerCase()) ||
    a.status?.toLowerCase().includes(search.toLowerCase())
  );

  const present = attendance.filter((a: AdminAttendance) => a.status === 'present').length;
  const absent  = attendance.filter((a: AdminAttendance) => a.status === 'absent').length;

  const markAttendance = async (staffId: string, status: 'present' | 'absent') => {
    try {
      await api.post('/admin/attendance', { staffId, date: today, status });
      refetch();
    } catch { /* silent */ }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">Present Today</p>
            <h3 className="text-3xl font-black text-green-600 mt-1">{statsLoading ? '…' : (stats?.present ?? present)}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">Absent Today</p>
            <h3 className="text-3xl font-black text-error mt-1">{statsLoading ? '…' : absent}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
            <XCircle size={24} />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">Total Staff</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{statsLoading ? '…' : (stats?.total ?? attendance.length)}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold font-headline text-on-surface">Daily Attendance Register</h3>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input 
                type="text" 
                placeholder="Search staff or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-on-surface"
              />
            </div>
            <button onClick={refetch} className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 my-4 px-6 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center justify-between">
            <span>Failed to load attendance: {error}</span>
            <button onClick={refetch} className="underline">Retry</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Staff ID</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-8 py-4">
                        <div className="h-3 bg-surface-container-low animate-pulse rounded-full w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <AnimatePresence>
                  {filteredAttendance.map((record: AdminAttendance) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={record._id} 
                      className="hover:bg-surface-container-low/20 transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">#</div>
                          <span className="text-sm font-bold text-on-surface">{record.staffId ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm font-medium text-on-surface-variant">{record.date}</td>
                      <td className="px-8 py-4">
                        <span className={cn(
                          "px-3 py-1 text-[11px] font-black rounded-lg uppercase tracking-wider",
                          record.status === 'present' && "bg-green-100 text-green-700",
                          record.status === 'absent'  && "bg-error/10 text-error",
                          record.status === 'late'    && "bg-amber-100 text-amber-700"
                        )}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => markAttendance(record.staffId ?? record._id, 'present')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              record.status === 'present' 
                                ? "bg-green-600 text-white shadow-md shadow-green-600/20" 
                                : "bg-surface-container-low text-on-surface-variant hover:bg-green-50 hover:text-green-600"
                            )}
                          >
                            Present
                          </button>
                          <button 
                            onClick={() => markAttendance(record.staffId ?? record._id, 'absent')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              record.status === 'absent' 
                                ? "bg-error text-white shadow-md shadow-error/20" 
                                : "bg-surface-container-low text-on-surface-variant hover:bg-error/10 hover:text-error"
                            )}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
          
          {!isLoading && filteredAttendance.length === 0 && !error && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No attendance records for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
