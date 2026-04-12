"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  History, 
  CheckCircle2, 
  MapPin, 
  MoreVertical, 
  UserPlus, 
  Activity,
  ChevronRight,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  X,
  Download
} from 'lucide-react';
import { Staff } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { Button } from '../components/ui/Button';

interface StaffManagementProps {
  staff: Staff[];
  onToggleStatus: (id: string) => void;
  onDeleteStaff: (id: string) => void;
  onUpdateStaff: (staff: Staff) => void;
}

interface AttendanceStats {
  today: {
    date: string;
    present: number;
    absent: number;
    leave: number;
    halfDay: number;
    notMarked: number;
    totalStaff: number;
  };
  monthly: {
    month: string;
    present: number;
    absent: number;
    leave: number;
    halfDay: number;
  };
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function StaffManagementView({ staff, onToggleStatus, onDeleteStaff, onUpdateStaff }: StaffManagementProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setAttendanceLoading(true);
        const { data } = await api.get('/manager/attendance/stats');
        if (data.success) setAttendanceStats(data.data as AttendanceStats);
      } catch (err) {
        console.error('Failed to load attendance stats:', err);
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchStats();
  }, []);

  const monthlyHours = attendanceStats ? attendanceStats.monthly.present * 8 : 0;
  const capacityPercent = attendanceStats && attendanceStats.today.totalStaff > 0
    ? Math.round((attendanceStats.today.present / attendanceStats.today.totalStaff) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">Staff Directory</h2>
          <p className="text-on-surface-variant font-medium text-sm md:text-base">Manage clinical roles, monitor attendance, and live GPS tracking.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="surface"
            onClick={() => {
              setIsProcessing(true);
              setTimeout(() => setIsProcessing(false), 1500);
            }}
            isLoading={isProcessing}
            className="flex-1 md:flex-none"
          >
            <Download size={16} /> Export Report
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              setIsProcessing(true);
              setTimeout(() => setIsProcessing(false), 800);
            }}
            isLoading={isProcessing}
            className="flex-1 md:flex-none"
          >
            <Clock size={18} /> Check-in
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Staff List */}
        <section className="col-span-12 lg:col-span-8 min-w-0 space-y-6 max-w-full">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
            <div className="p-6 border-b border-surface-container-low flex justify-between items-center">
              <h3 className="font-bold text-lg">Healthcare Professionals</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                {staff.filter(s => s.status === 'Active').length} Currently Active
              </div>
            </div>
            {/* Desktop/Tablet Table View (> 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">Staff Member</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">Clinical Role</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">Live GPS</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">Status</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {staff.map((member) => (
                    <tr key={member.id} className="group hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            aria-hidden="true"
                            className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs"
                          >
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-on-surface">{member.name}</p>
                            <p className="text-xs text-on-surface-variant">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[11px] font-bold uppercase",
                          member.role === 'Physio' ? "bg-primary-fixed text-on-primary-fixed" :
                          member.role === 'Admin' ? "bg-secondary-fixed text-on-secondary-fixed" :
                          "bg-surface-container-high text-on-surface-variant"
                        )}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.status === 'Active' ? (
                          <div className="flex items-center gap-2 text-secondary font-bold text-xs">
                            <MapPin size={14} />
                            Active
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/60 text-xs">Offline</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => onToggleStatus(member.id)}
                          className={cn(
                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                            member.status === 'Active' ? "bg-secondary" : "bg-surface-container-high"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            member.status === 'Active' ? "translate-x-4.5" : "translate-x-0.5"
                          )} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                          className="text-on-surface-variant hover:text-primary transition-all p-2 rounded-lg hover:bg-surface-container-high"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {activeMenu === member.id && (
                          <div className="absolute right-12 top-12 w-32 bg-white rounded-xl shadow-xl border border-outline-variant/10 z-50 py-2 overflow-hidden text-left">
                            <button 
                              onClick={() => {
                                setSelectedStaff(member);
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button 
                              onClick={() => {
                                setEditingStaff(member);
                                setIsEditModalOpen(true);
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this staff member?')) {
                                  onDeleteStaff(member.id);
                                  setActiveMenu(null);
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low text-error flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 640px) */}
            <div className="sm:hidden divide-y divide-outline-variant/10">
              {staff.map((member) => (
                <div key={member.id} className="p-4 sm:p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        aria-hidden="true"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0"
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">{member.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{member.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                      className="text-on-surface-variant p-2 rounded-lg hover:bg-surface-container-high"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {activeMenu === member.id && (
                      <div className="absolute right-12 top-12 w-32 bg-white rounded-xl shadow-xl border border-outline-variant/10 z-50 py-2 overflow-hidden text-left">
                        <button 
                          onClick={() => {
                            setSelectedStaff(member);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button 
                          onClick={() => {
                            setEditingStaff(member);
                            setIsEditModalOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this staff member?')) {
                              onDeleteStaff(member.id);
                              setActiveMenu(null);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low text-error flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Clinical Role</p>
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                        member.role === 'Physio' ? "bg-primary-fixed text-on-primary-fixed" :
                        member.role === 'Admin' ? "bg-secondary-fixed text-on-secondary-fixed" :
                        "bg-surface-container-high text-on-surface-variant"
                      )}>
                        {member.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Live GPS</p>
                      {member.status === 'Active' ? (
                        <div className="flex items-center gap-1 text-secondary font-bold text-[10px]">
                          <MapPin size={12} />
                          Active
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/60 text-[10px]">Offline</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Status</p>
                      <button 
                        onClick={() => onToggleStatus(member.id)}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                          member.status === 'Active' ? "bg-secondary" : "bg-surface-container-high"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          member.status === 'Active' ? "translate-x-4.5" : "translate-x-0.5"
                        )} />
                      </button>
                    </div>
                    <button 
                      onClick={() => setSelectedStaff(member)}
                      className="text-primary text-[10px] font-bold hover:underline"
                    >
                      View Full History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Analytics Sidebar */}
        <aside className="col-span-12 lg:col-span-4 min-w-0 space-y-6 lg:sticky lg:top-24 h-fit max-w-full">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Attendance Hub</h3>
              <Activity className="text-on-surface-variant/60" size={20} />
            </div>
            {attendanceLoading ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-3"></div>
                <p className="text-xs text-on-surface-variant">Loading attendance...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-primary tracking-widest uppercase">{attendanceStats?.monthly.month || 'This Month'}</span>
                    <span className="text-2xl font-black text-primary">{monthlyHours.toLocaleString()}h</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(capacityPercent, 100)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-2">
                    {capacityPercent}% of clinical capacity present today ({attendanceStats?.today.present || 0}/{attendanceStats?.today.totalStaff || 0})
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Today&apos;s Check-in Status</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Present', value: attendanceStats?.today.present ?? 0, color: 'bg-secondary' },
                      { label: 'Half Day', value: attendanceStats?.today.halfDay ?? 0, color: 'bg-orange-400' },
                      { label: 'On Leave', value: attendanceStats?.today.leave ?? 0, color: 'bg-amber-400' },
                      { label: 'Absent', value: attendanceStats?.today.absent ?? 0, color: 'bg-error' },
                      { label: 'Not Marked', value: attendanceStats?.today.notMarked ?? 0, color: 'bg-surface-container-high' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-surface-container-low rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", item.color)}></div>
                          <span className="text-sm font-semibold">{item.label}</span>
                        </div>
                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="surface"
                  size="sm"
                  onClick={() => {
                    setIsProcessing(true);
                    setTimeout(() => setIsProcessing(false), 1000);
                  }}
                  isLoading={isProcessing}
                  className="w-full border-dashed"
                >
                  <Download size={14} /> Export Attendance Log
                </Button>
              </div>
            )}
          </div>

          <div className="relative bg-on-surface text-white rounded-xl p-6 overflow-hidden min-h-[300px] flex flex-col">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-secondary-container" size={20} />
                <h3 className="font-bold text-lg">Staff Map Overview</h3>
              </div>
              <p className="text-sm text-white/70 mb-6">Real-time GPS tracking for active field therapists.</p>
              <div className="space-y-4">
                {[
                  { label: 'Downtown Branch', value: '8 Staff' },
                  { label: 'North Suburban', value: '4 Staff' },
                  { label: 'Westside Center', value: '2 Staff' },
                ].map((loc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-white/10 pb-3">
                    <span>{loc.label}</span>
                    <span className="font-bold">{loc.value}</span>
                  </div>
                ))}
              </div>
              <Button 
                variant="secondary"
                onClick={() => {
                  setIsProcessing(true);
                  setTimeout(() => setIsProcessing(false), 1200);
                }}
                isLoading={isProcessing}
                className="w-full mt-6"
              >
                Open Full Map
              </Button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 opacity-20 pointer-events-none bg-gradient-to-tr from-secondary-container to-primary rounded-full blur-3xl"></div>
          </div>
        </aside>
      </div>

      {/* Recent Logs */}
      <div className="bg-surface-container-low p-6 rounded-xl flex items-center gap-8 overflow-hidden w-full max-w-full">
        <div className="flex items-center gap-2 shrink-0">
          <History className="text-primary" size={20} />
          <span className="font-bold text-sm uppercase tracking-widest">Recent Logs</span>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex gap-12 animate-marquee whitespace-nowrap text-sm text-on-surface-variant w-max pr-8">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">14:02</span>
            <span>Sarah Jenkins checked in at North Suburban Clinic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">13:45</span>
            <span>Lisa Thompson completed payroll sync</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">12:30</span>
            <span>Shift Swap: Thomas Chen & Marcus Wright approved</span>
          </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg"
                >
                  {getInitials(selectedStaff.name)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedStaff.name}</h3>
                  <p className="text-on-surface-variant font-medium">{selectedStaff.role} • {selectedStaff.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-lg">Attendance History (Last 7 Days)</h4>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={i} className="space-y-2 text-center">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">{day}</p>
                    <div className={cn(
                      "h-12 rounded-xl flex items-center justify-center",
                      i < 4 ? "bg-secondary/10 text-secondary" : i === 4 ? "bg-orange-50 text-orange-400" : "bg-surface-container-low text-on-surface-variant/40"
                    )}>
                      {i < 4 ? <CheckCircle2 size={20} /> : i === 4 ? <Clock size={20} /> : <AlertCircle size={20} />}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-surface-container-low p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-on-surface-variant">Average Check-in Time</span>
                  <span className="font-bold">08:52 AM</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-on-surface-variant">Total Hours (This Week)</span>
                  <span className="font-bold">38.5h / 40h</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-on-surface-variant">Compliance Score</span>
                  <span className="text-secondary font-bold">96%</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsProcessing(true);
                  setTimeout(() => setIsProcessing(false), 1000);
                }}
                isLoading={isProcessing}
                className="flex-1"
              >
                <Download size={16} />
                Download Report
              </Button>
              <Button 
                onClick={() => setSelectedStaff(null)}
                className="flex-1"
              >
                Close History
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Edit Staff Member</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsProcessing(true);
                  setTimeout(() => {
                    onUpdateStaff(editingStaff);
                    setIsEditModalOpen(false);
                    setIsProcessing(false);
                  }, 800);
                }} 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingStaff.name}
                    onChange={e => setEditingStaff(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={editingStaff.email}
                    onChange={e => setEditingStaff(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Clinical Role</label>
                  <select 
                    value={editingStaff.role}
                    onChange={e => setEditingStaff(prev => prev ? ({ ...prev, role: e.target.value as Staff['role'] }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Physio">Physio</option>
                    <option value="Admin">Admin</option>
                    <option value="Nurse">Nurse</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4 md:col-span-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    isLoading={isProcessing}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

