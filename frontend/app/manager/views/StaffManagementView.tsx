"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  History, CheckCircle2, MapPin, MoreVertical,
  Activity, Clock, AlertCircle, XCircle,
  Eye, EyeOff, Edit, Trash2, Download, Plus
} from 'lucide-react';
import { Staff } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React, { useRef } from 'react';
import { Button } from '../components/ui/Button';

interface StaffManagementProps {
  staff: Staff[];
  onToggleStatus: (id: string) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateStaff: (staff: Staff & { password?: string }) => void;
  onAddStaff: (staff: Partial<Staff> & { password?: string }) => void;
  isLoading?: boolean;
}

interface AttendanceStats {
  today: { date: string; present: number; absent: number; leave: number; halfDay: number; notMarked: number; totalStaff: number };
  monthly: { month: string; present: number; absent: number; leave: number; halfDay: number };
}

const getInitials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();

// ── Card dropdown menu ──
function RowMenu({ memberId, onView, onEdit, onDelete }: { memberId: string; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)} className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors">
        <MoreVertical size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.1 }}
            className="absolute right-0 top-9 w-36 bg-white rounded-xl shadow-xl border border-outline-variant/20 z-50 overflow-hidden">
            {[
              { label: 'View', icon: Eye, action: onView, cls: 'text-primary' },
              { label: 'Edit', icon: Edit, action: onEdit, cls: 'text-on-surface' },
              { label: 'Delete', icon: Trash2, action: onDelete, cls: 'text-error' },
            ].map(({ label, icon: Icon, action, cls }) => (
              <button key={label} onClick={() => { action(); setOpen(false); }}
                className={cn('w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:bg-surface-container-low transition-colors', cls)}>
                <Icon size={14} />{label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StaffManagementView({ staff, onToggleStatus, onDeleteStaff, onUpdateStaff, onAddStaff, isLoading = false }: StaffManagementProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', staffId: '', mobileNumber: '' });
  const [editingStaff, setEditingStaff] = useState<(Staff & { password?: string }) | null>(null);
  const [showAddPass, setShowAddPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    api.get('/manager/attendance/stats')
      .then(({ data }) => { if (data.success) setAttendanceStats(data.data as AttendanceStats); })
      .catch(() => {})
      .finally(() => setAttendanceLoading(false));
  }, []);

  const monthlyHours = attendanceStats ? attendanceStats.monthly.present * 8 : 0;
  const capacityPercent = attendanceStats?.today.totalStaff
    ? Math.round((attendanceStats.today.present / attendanceStats.today.totalStaff) * 100) : 0;

  return (
    <div className="space-y-6 w-full min-w-0">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">Staff Directory</h2>
          <p className="text-on-surface-variant text-sm mt-0.5">Manage roles, monitor attendance and GPS tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* <button onClick={() => { setIsProcessing(true); setTimeout(() => setIsProcessing(false), 1500); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-white text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors">
            <Download size={15} /> Export Report
          </button> */}
          <button onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus size={15} /> Add Staff
          </button>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full min-w-0">

        {/* Staff List */}
        <section className="xl:col-span-8 w-full min-w-0">
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant/10 flex flex-wrap justify-between items-center gap-3">
              <h3 className="font-bold text-base">Healthcare Professionals</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                {staff.filter(s => s.status === 'Active').length} Active
              </div>
            </div>

            {staff.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant text-sm">No staff members found.</div>
            ) : (
              <>
                {/* Desktop table — hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        {['Staff Member', 'Role', 'GPS', 'Status', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
                            <p className="text-on-surface-variant font-medium">Loading staff...</p>
                          </td>
                        </tr>
                      ) : (
                        staff.map(member => (
                          <tr key={member.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {getInitials(member.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-on-surface truncate">{member.name}</p>
                                <p className="text-xs text-on-surface-variant truncate">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={cn('px-2 py-1 rounded-md text-[11px] font-bold uppercase whitespace-nowrap',
                              member.role === 'Physio' ? 'bg-primary/10 text-primary' :
                              member.role === 'Admin' ? 'bg-secondary/10 text-secondary' :
                              'bg-surface-container-high text-on-surface-variant')}>
                              {member.role}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {member.status === 'Active'
                              ? <span className="flex items-center gap-1.5 text-secondary font-bold text-xs whitespace-nowrap"><MapPin size={13} />Active</span>
                              : <span className="text-on-surface-variant/50 text-xs">Offline</span>}
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => onToggleStatus(member.id)}
                              className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
                                member.status === 'Active' ? 'bg-secondary' : 'bg-surface-container-high')}>
                              <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform',
                                member.status === 'Active' ? 'translate-x-4.5' : 'translate-x-0.5')} />
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <RowMenu memberId={member.id}
                              onView={() => setSelectedStaff(member)}
                              onEdit={() => { setEditingStaff(member); }}
                              onDelete={() => { if (window.confirm('Are you sure you want to delete this staff member? This will remove their record from your branch.')) onDeleteStaff(member.id); }} />
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-outline-variant/10">
                  {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-3"></div>
                      <p className="text-sm text-on-surface-variant font-medium">Loading staff...</p>
                    </div>
                  ) : (
                    staff.map(member => (
                      <div key={member.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {getInitials(member.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate">{member.name}</p>
                            <p className="text-xs text-on-surface-variant truncate">{member.email}</p>
                          </div>
                        </div>
                        <RowMenu memberId={member.id}
                          onView={() => setSelectedStaff(member)}
                          onEdit={() => { setEditingStaff(member); }}
                          onDelete={() => { if (window.confirm('Delete this staff member? This will remove their record from your branch.')) onDeleteStaff(member.id); }} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={cn('px-2 py-1 rounded-md text-[11px] font-bold uppercase',
                          member.role === 'Physio' ? 'bg-primary/10 text-primary' :
                          member.role === 'Admin' ? 'bg-secondary/10 text-secondary' :
                          'bg-surface-container-high text-on-surface-variant')}>
                          {member.role}
                        </span>
                        {member.status === 'Active'
                          ? <span className="flex items-center gap-1 text-secondary font-bold text-xs"><MapPin size={12} />Active</span>
                          : <span className="text-on-surface-variant/50 text-xs">Offline</span>}
                        <button onClick={() => onToggleStatus(member.id)}
                          className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors ml-auto',
                            member.status === 'Active' ? 'bg-secondary' : 'bg-surface-container-high')}>
                          <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform',
                            member.status === 'Active' ? 'translate-x-4.5' : 'translate-x-0.5')} />
                        </button>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Attendance Hub Sidebar ── */}
        <aside className="xl:col-span-4 w-full min-w-0 space-y-5">
          <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm p-5 w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Attendance Hub</h3>
              <Activity className="text-on-surface-variant/60 shrink-0" size={18} />
            </div>

            {attendanceLoading ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-on-surface-variant">Loading...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Monthly summary */}
                <div className="p-3 bg-primary/5 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider truncate">
                      {attendanceStats?.monthly.month || 'This Month'}
                    </span>
                    <span className="text-lg font-black text-primary shrink-0">{monthlyHours}h</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-1.5">
                    {capacityPercent}% today · {attendanceStats?.today.present ?? 0}/{attendanceStats?.today.totalStaff ?? 0} staff
                  </p>
                </div>

                {/* Status rows */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Today's Status</p>
                  {[
                    { label: 'Present',    value: attendanceStats?.today.present    ?? 0, color: 'bg-secondary' },
                    { label: 'Half Day',   value: attendanceStats?.today.halfDay    ?? 0, color: 'bg-orange-400' },
                    { label: 'On Leave',   value: attendanceStats?.today.leave      ?? 0, color: 'bg-amber-400' },
                    { label: 'Absent',     value: attendanceStats?.today.absent     ?? 0, color: 'bg-error' },
                    { label: 'Not Marked', value: attendanceStats?.today.notMarked  ?? 0, color: 'bg-surface-container-high' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', item.color)} />
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold shrink-0 ml-2">{item.value}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => { setIsProcessing(true); setTimeout(() => setIsProcessing(false), 1000); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-outline-variant/40 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                  <Download size={14} /> Export Attendance Log
                </button>
              </div>
            )}
          </div>

          {/* Staff Map */}
          <div className="relative bg-on-surface text-white rounded-2xl p-5 overflow-hidden w-full min-w-0">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="text-secondary shrink-0" size={18} />
                <h3 className="font-bold text-base">Staff Map</h3>
              </div>
              <p className="text-xs text-white/60 mb-4">Real-time GPS for active therapists.</p>
              <div className="space-y-2.5 mb-4">
                {[
                  { label: 'Downtown Branch', value: '8 Staff' },
                  { label: 'North Suburban',  value: '4 Staff' },
                  { label: 'Westside Center', value: '2 Staff' },
                ].map((loc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5">
                    <span className="truncate mr-2 text-white/80">{loc.label}</span>
                    <span className="font-bold shrink-0">{loc.value}</span>
                  </div>
                ))}
              </div>
              <button className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors">
                Open Full Map
              </button>
            </div>
            <div className="absolute -right-16 -bottom-16 w-48 h-48 opacity-20 pointer-events-none bg-gradient-to-tr from-secondary to-primary rounded-full blur-3xl" />
          </div>
        </aside>
      </div>

      {/* ── Recent Logs ── */}
      <div className="bg-surface-container-low px-5 py-4 rounded-2xl flex items-center gap-4 overflow-hidden w-full min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <History className="text-primary shrink-0" size={18} />
          <span className="font-bold text-xs uppercase tracking-widest whitespace-nowrap">Recent Logs</span>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex gap-10 animate-marquee whitespace-nowrap text-xs text-on-surface-variant">
            {[
              { time: '14:02', text: 'Sarah Jenkins checked in at North Suburban Clinic' },
              { time: '13:45', text: 'Lisa Thompson completed payroll sync' },
              { time: '12:30', text: 'Shift Swap: Thomas Chen & Marcus Wright approved' },
            ].map((log, i) => (
              <span key={i} className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-on-surface">{log.time}</span>
                <span>{log.text}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── View Modal ── */}
      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                    {getInitials(selectedStaff.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold truncate">{selectedStaff.name}</h3>
                    <p className="text-on-surface-variant text-sm truncate">{selectedStaff.role} · {selectedStaff.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors shrink-0">
                  <XCircle size={22} />
                </button>
              </div>

              <h4 className="font-bold mb-3">Attendance — Last 7 Days</h4>
              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => (
                  <div key={i} className="text-center space-y-1.5">
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase">{day}</p>
                    <div className={cn('h-10 rounded-xl flex items-center justify-center',
                      i < 4 ? 'bg-secondary/10 text-secondary' : i === 4 ? 'bg-orange-50 text-orange-400' : 'bg-surface-container-low text-on-surface-variant/40')}>
                      {i < 4 ? <CheckCircle2 size={16} /> : i === 4 ? <Clock size={16} /> : <AlertCircle size={16} />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl space-y-3 mb-6">
                {[
                  ['Avg Check-in', '08:52 AM'],
                  ['Total Hours (Week)', '38.5h / 40h'],
                  ['Compliance Score', '96%'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                  <Download size={15} /> Download
                </button>
                <button onClick={() => setSelectedStaff(null)}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Modal ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold mb-5">Add New Staff</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsProcessing(true);
                await onAddStaff(newStaff);
                setIsAddModalOpen(false);
                setNewStaff({ name: '', email: '', password: '', staffId: '', mobileNumber: '' });
                setShowAddPass(false);
                setIsProcessing(false);
              }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name *</label>
                  <input type="text" required value={newStaff.name}
                    onChange={e => setNewStaff(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email *</label>
                  <input type="email" required value={newStaff.email}
                    onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="john@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Password *</label>
                  <div className="relative">
                    <input type={showAddPass ? "text" : "password"} required value={newStaff.password}
                      onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))}
                      className="w-full bg-surface-container-low rounded-xl pl-4 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Min 6 characters" />
                    <button
                      type="button"
                      onClick={() => setShowAddPass(!showAddPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                    >
                      {showAddPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Staff ID</label>
                    <input type="text" value={newStaff.staffId}
                      onChange={e => setNewStaff(p => ({ ...p, staffId: e.target.value }))}
                      className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="RHB-STF-001" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mobile</label>
                    <input type="tel" value={newStaff.mobileNumber}
                      onChange={e => setNewStaff(p => ({ ...p, mobileNumber: e.target.value }))}
                      className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="+91..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isProcessing}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                    {isProcessing ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold mb-5">Edit Staff Member</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsProcessing(true);
                await onUpdateStaff(editingStaff);
                setEditingStaff(null);
                setShowEditPass(false);
                setIsProcessing(false);
              }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                  <input type="text" required value={editingStaff.name}
                    onChange={e => setEditingStaff(p => p ? { ...p, name: e.target.value } : null)}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
                  <input type="email" required value={editingStaff.email}
                    onChange={e => setEditingStaff(p => p ? { ...p, email: e.target.value } : null)}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input type={showEditPass ? "text" : "password"} value={editingStaff.password || ''}
                      onChange={e => setEditingStaff(p => p ? { ...p, password: e.target.value } : null)}
                      className="w-full bg-surface-container-low rounded-xl pl-4 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Leave blank to keep current" />
                    <button
                      type="button"
                      onClick={() => setShowEditPass(!showEditPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                    >
                      {showEditPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Staff ID</label>
                    <input type="text" value={editingStaff.staffId || ''}
                      onChange={e => setEditingStaff(p => p ? { ...p, staffId: e.target.value } : null)}
                      className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mobile</label>
                    <input type="tel" value={editingStaff.mobileNumber || ''}
                      onChange={e => setEditingStaff(p => p ? { ...p, mobileNumber: e.target.value } : null)}
                      className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setEditingStaff(null); setShowEditPass(false); }}
                    className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isProcessing}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                    {isProcessing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
