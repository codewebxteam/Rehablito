import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

type UiStatus = 'Present' | 'Absent' | 'On Leave' | 'Not Marked';

interface Branch {
  _id: string;
  name: string;
}

interface StaffMember {
  _id: string;
  name: string;
  staffId?: string;
  role: 'staff' | 'branch_manager';
  branchId: string;
}

interface ApiStaff {
  _id: string;
  name: string;
  staffId?: string;
  role: 'staff' | 'branch_manager';
  branchId?: { _id: string; name: string } | string | null;
}

interface ApiAttendance {
  _id: string;
  userId: { _id: string; name: string } | string;
  branchId: { _id: string; name: string } | string;
  date: string;
  checkIn?: string;
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'on_duty';
}

interface AttendanceRow {
  userId: string;
  name: string;
  branchId: string;
  checkIn: string;
  status: UiStatus;
  attendanceId?: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const mapApiStatus = (s: ApiAttendance['status']): UiStatus => {
  if (s === 'present' || s === 'on_duty' || s === 'half_day') return 'Present';
  if (s === 'absent') return 'Absent';
  if (s === 'leave') return 'On Leave';
  return 'Not Marked';
};

export const AttendanceView = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<ApiAttendance[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [date, setDate] = useState<string>(todayIso());
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUser, setPendingUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        const [staffRes, branchRes, attendanceRes] = await Promise.all([
          api.get('/admin/staff'),
          api.get('/admin/branches'),
          api.get(`/admin/attendance?date=${date}`),
        ]);

        if (branchRes.data.success) setBranches(branchRes.data.data || []);

        if (staffRes.data.success) {
          const list: StaffMember[] = (staffRes.data.data as ApiStaff[]).map(s => ({
            _id: s._id,
            name: s.name,
            staffId: s.staffId,
            role: s.role,
            branchId: typeof s.branchId === 'object' && s.branchId ? s.branchId._id : (s.branchId as string) || '',
          }));
          setStaff(list);
        }

        if (attendanceRes.data.success) setAttendance(attendanceRes.data.data || []);
      } catch (err) {
        console.error('Failed to load attendance:', err);
        toast.error('Failed to load attendance');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [date]);

  const rows: AttendanceRow[] = useMemo(() => {
    const byUser = new Map<string, ApiAttendance>();
    attendance.forEach(a => {
      const uid = typeof a.userId === 'object' ? a.userId._id : a.userId;
      byUser.set(uid, a);
    });

    return staff.map(s => {
      const att = byUser.get(s._id);
      return {
        userId: s._id,
        name: s.name,
        branchId: s.branchId,
        checkIn: att?.checkIn || '—',
        status: att ? mapApiStatus(att.status) : 'Not Marked',
        attendanceId: att?._id,
      };
    });
  }, [staff, attendance]);

  const filteredRows = rows.filter(r => {
    const q = search.toLowerCase();
    const branchName = branches.find(b => b._id === r.branchId)?.name || '';
    return r.name.toLowerCase().includes(q) || branchName.toLowerCase().includes(q);
  });

  const stats = {
    present: rows.filter(r => r.status === 'Present').length,
    absent: rows.filter(r => r.status === 'Absent').length,
    leave: rows.filter(r => r.status === 'On Leave').length,
  };

  const markStatus = async (row: AttendanceRow, uiStatus: 'Present' | 'Absent') => {
    if (!row.branchId) {
      toast.error('Staff member has no branch assigned');
      return;
    }
    try {
      setPendingUser(row.userId);
      const apiStatus = uiStatus === 'Present' ? 'present' : 'absent';
      const checkIn = uiStatus === 'Present'
        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined;

      const { data } = await api.post('/admin/attendance', {
        userId: row.userId,
        branchId: row.branchId,
        date,
        status: apiStatus,
        checkIn,
      });

      if (data.success) {
        toast.success(`Marked ${uiStatus.toLowerCase()}`);
        setAttendance(prev => {
          const other = prev.filter(a => {
            const uid = typeof a.userId === 'object' ? a.userId._id : a.userId;
            return uid !== row.userId;
          });
          return [...other, data.data as ApiAttendance];
        });
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError?.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setPendingUser(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">Present</p>
            <h3 className="text-3xl font-black text-green-600 mt-1">{stats.present}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-on-surface-variant opacity-70">Absent</p>
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
          <h3 className="text-xl font-bold font-headline text-on-surface">Attendance Register</h3>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-on-surface"
              />
            </div>
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
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant">Loading attendance...</p>
            </div>
          </div>
        ) : (
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
                  {filteredRows.map((row) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={row.userId}
                      className="hover:bg-surface-container-low/20 transition-colors"
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {row.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-bold text-on-surface">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm font-medium text-on-surface-variant">
                        {branches.find(b => b._id === row.branchId)?.name || 'Unknown'}
                      </td>
                      <td className="px-8 py-4 text-sm font-medium text-on-surface-variant opacity-80">{row.checkIn}</td>
                      <td className="px-8 py-4">
                        <span className={cn(
                          "px-3 py-1 text-[11px] font-black rounded-lg uppercase tracking-wider",
                          row.status === 'Present' && "bg-green-100 text-green-700",
                          row.status === 'Absent' && "bg-error/10 text-error",
                          row.status === 'On Leave' && "bg-amber-100 text-amber-700",
                          row.status === 'Not Marked' && "bg-surface-container-low text-on-surface-variant"
                        )}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        {row.status !== 'On Leave' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => markStatus(row, 'Present')}
                              disabled={pendingUser === row.userId}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60",
                                row.status === 'Present'
                                  ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                                  : "bg-surface-container-low text-on-surface-variant hover:bg-green-50 hover:text-green-600"
                              )}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => markStatus(row, 'Absent')}
                              disabled={pendingUser === row.userId}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60",
                                row.status === 'Absent'
                                  ? "bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700"
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

            {filteredRows.length === 0 && (
              <div className="p-10 text-center text-on-surface-variant opacity-60">
                No staff found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
