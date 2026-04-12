"use client";

import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Mail,
  Phone,
  MoreVertical,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useSearch } from '../context/SearchContext';

interface ApiBranchStaff {
  _id: string;
  name: string;
  email: string;
  role: 'staff' | 'branch_manager';
  staffId?: string;
  mobileNumber?: string;
  branchId?: { _id: string; name: string } | null;
  todayStatus?: 'present' | 'absent' | 'leave' | 'half_day' | 'on_duty' | 'not_marked';
}

interface StaffItem {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  staffId: string;
  status: 'On Duty' | 'On Break' | 'Off Duty' | 'On Leave';
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const mapStatus = (s: ApiBranchStaff['todayStatus']): StaffItem['status'] => {
  switch (s) {
    case 'on_duty': return 'On Duty';
    case 'half_day': return 'On Break';
    case 'leave': return 'On Leave';
    case 'absent':
    case 'not_marked':
    default: return 'Off Duty';
    case 'present': return 'On Duty';
  }
};

const mapRoleLabel = (role: ApiBranchStaff['role']) =>
  role === 'branch_manager' ? 'Branch Manager' : 'Therapist';

export default function StaffDirectoryPage() {
  const { searchQuery, setSearchQuery } = useSearch();
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/staff/branch-staff');
        if (data.success) {
          const list: StaffItem[] = (data.data as ApiBranchStaff[]).map(s => ({
            id: s._id,
            name: s.name,
            role: mapRoleLabel(s.role),
            department: s.branchId?.name || 'Branch',
            email: s.email,
            phone: s.mobileNumber || '',
            staffId: s.staffId || s._id.slice(-8).toUpperCase(),
            status: mapStatus(s.todayStatus),
          }));
          setStaff(list);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch branch staff:', err);
        setError('Failed to load staff directory');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Branch Team</p>
          <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Staff Directory</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search name, role, or staff ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
            />
          </div>
          <button className="p-3 bg-surface-container-low rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5 shrink-0" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-10 text-center text-error font-semibold">{error}</div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-10 text-center text-on-surface-variant opacity-60">No teammates found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <div key={member.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg"
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                      member.status === 'On Duty' ? "bg-secondary" :
                      member.status === 'On Break' ? "bg-tertiary" :
                      member.status === 'On Leave' ? "bg-amber-400" : "bg-outline"
                    )}></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface flex items-center gap-1">
                      {member.name}
                      <BadgeCheck className="w-4 h-4 text-primary" />
                    </h4>
                    <p className="text-xs text-on-surface-variant font-medium font-mono">{member.staffId}</p>
                  </div>
                </div>
                <button className="p-1 text-outline hover:text-on-surface transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline font-medium uppercase tracking-wider">Branch</span>
                  <span className="font-bold text-on-surface truncate max-w-[60%] text-right">{member.department}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline font-medium uppercase tracking-wider">Role</span>
                  <span className="font-bold text-on-surface">{member.role}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-outline font-medium uppercase tracking-wider">Status</span>
                  <span className={cn(
                    "font-bold",
                    member.status === 'On Duty' ? "text-secondary" :
                    member.status === 'On Break' ? "text-tertiary" :
                    member.status === 'On Leave' ? "text-amber-600" : "text-outline"
                  )}>{member.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <a
                  href={member.email ? `mailto:${member.email}` : undefined}
                  aria-disabled={!member.email}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all min-h-[44px]",
                    !member.email && "pointer-events-none opacity-50"
                  )}
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
                <a
                  href={member.phone ? `tel:${member.phone}` : undefined}
                  aria-disabled={!member.phone}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface-variant hover:bg-secondary/5 hover:text-secondary transition-all min-h-[44px]",
                    !member.phone && "pointer-events-none opacity-50"
                  )}
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
