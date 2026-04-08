import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffAttendance {
  id: string;
  name: string;
  branch: string;
  checkIn: string;
  status: 'Present' | 'Absent' | 'On Leave';
}

const INITIAL_ATTENDANCE: StaffAttendance[] = [
  { id: '1', name: 'Priya Sharma', branch: 'Mumbai', checkIn: '08:45 AM', status: 'Present' },
  { id: '2', name: 'Ravi Kumar', branch: 'Patna', checkIn: '09:15 AM', status: 'Present' },
  { id: '3', name: 'Anjali Singh', branch: 'Delhi', checkIn: '—', status: 'On Leave' },
  { id: '4', name: 'Mohit Verma', branch: 'Mumbai', checkIn: '09:00 AM', status: 'Present' },
  { id: '5', name: 'Sneha Rao', branch: 'Delhi', checkIn: '—', status: 'Absent' },
  { id: '6', name: 'Vikram Patel', branch: 'Mumbai', checkIn: '08:50 AM', status: 'Present' },
  { id: '7', name: 'Neha Gupta', branch: 'Patna', checkIn: '—', status: 'Absent' },
];

export const AttendanceView = () => {
  const [attendance, setAttendance] = useState<StaffAttendance[]>(INITIAL_ATTENDANCE);
  const [search, setSearch] = useState('');

  const filteredAttendance = attendance.filter(staff => 
    staff.name.toLowerCase().includes(search.toLowerCase()) || 
    staff.branch.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    leave: attendance.filter(a => a.status === 'On Leave').length,
  };

  const toggleStatus = (id: string, newStatus: 'Present' | 'Absent') => {
    setAttendance(prev => prev.map(staff => {
      if (staff.id === id && staff.status !== 'On Leave') {
        return { 
          ...staff, 
          status: newStatus,
          checkIn: newStatus === 'Present' ? (staff.checkIn !== '—' ? staff.checkIn : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : '—'
        };
      }
      return staff;
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">Present Today</p>
            <h3 className="text-3xl font-black text-green-600 mt-1">{stats.present}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">Absent Today</p>
            <h3 className="text-3xl font-black text-error mt-1">{stats.absent}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
            <XCircle size={24} />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">On Leave</p>
            <h3 className="text-3xl font-black text-amber-600 mt-1">{stats.leave}</h3>
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
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input 
              type="text" 
              placeholder="Search staff or branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-on-surface"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Staff Member</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Check-In</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              <AnimatePresence>
                {filteredAttendance.map((staff) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={staff.id} 
                    className="hover:bg-surface-container-low/20 transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {staff.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-bold text-on-surface">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-on-surface-variant">{staff.branch}</td>
                    <td className="px-8 py-4 text-sm font-medium text-on-surface-variant opacity-80">{staff.checkIn}</td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "px-3 py-1 text-[11px] font-black rounded-lg uppercase tracking-wider",
                        staff.status === 'Present' && "bg-green-100 text-green-700",
                        staff.status === 'Absent' && "bg-error/10 text-error",
                        staff.status === 'On Leave' && "bg-amber-100 text-amber-700"
                      )}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {staff.status !== 'On Leave' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleStatus(staff.id, 'Present')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              staff.status === 'Present' 
                                ? "bg-green-600 text-white shadow-md shadow-green-600/20" 
                                : "bg-surface-container-low text-on-surface-variant hover:bg-green-50 hover:text-green-600"
                            )}
                          >
                            Present
                          </button>
                          <button 
                            onClick={() => toggleStatus(staff.id, 'Absent')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              staff.status === 'Absent' 
                                ? "bg-error text-white shadow-md shadow-error/20" 
                                : "bg-surface-container-low text-on-surface-variant hover:bg-error/10 hover:text-error"
                            )}
                          >
                            Absent
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-on-surface-variant/50">Not Applicable</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredAttendance.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No staff found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
