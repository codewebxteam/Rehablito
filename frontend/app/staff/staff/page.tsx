"use client";

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MoreVertical,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '../context/SearchContext';

const MOCK_STAFF_LIST = [
  { id: 1, name: 'Dr. Sarah Chen', role: 'Senior Surgeon', department: 'Surgery', status: 'On Duty', image: 'https://picsum.photos/seed/sarah/100/100' },
  { id: 2, name: 'James Wilson', role: 'Head Nurse', department: 'Emergency', status: 'Off Duty', image: 'https://picsum.photos/seed/james/100/100' },
  { id: 3, name: 'Dr. Elena Rodriguez', role: 'Pediatrician', department: 'Pediatrics', status: 'On Duty', image: 'https://picsum.photos/seed/elena/100/100' },
  { id: 4, name: 'Michael Chang', role: 'Radiologist', department: 'Radiology', status: 'On Break', image: 'https://picsum.photos/seed/michael/100/100' },
  { id: 5, name: 'Dr. Robert Taylor', role: 'Cardiologist', department: 'Cardiology', status: 'On Duty', image: 'https://picsum.photos/seed/robert/100/100' },
  { id: 6, name: 'Lisa Thompson', role: 'Lab Technician', department: 'Laboratory', status: 'Off Duty', image: 'https://picsum.photos/seed/lisa/100/100' },
];

export default function StaffDirectoryPage() {
  const { searchQuery, setSearchQuery } = useSearch();

  const filteredStaff = MOCK_STAFF_LIST.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-primary font-bold text-xs uppercase tracking-widest font-label">Hospital Staff</p>
          <h3 className="text-2xl md:text-3xl font-headline font-extrabold text-on-surface">Staff Directory</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Search staff, role, or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
            />
          </div>
          <button className="p-3 bg-surface-container-low rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5 flex-shrink-0" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => (
          <div key={staff.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={staff.image} 
                    alt={staff.name} 
                    className="w-14 h-14 rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                    staff.status === 'On Duty' ? "bg-secondary" : staff.status === 'On Break' ? "bg-tertiary" : "bg-outline"
                  )}></div>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface flex items-center gap-1">
                    {staff.name}
                    <BadgeCheck className="w-4 h-4 text-primary" />
                  </h4>
                  <p className="text-xs text-on-surface-variant font-medium">{staff.role}</p>
                </div>
              </div>
              <button className="p-1 text-outline hover:text-on-surface transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-outline-variant/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline font-medium uppercase tracking-wider">Department</span>
                <span className="font-bold text-on-surface">{staff.department}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline font-medium uppercase tracking-wider">Status</span>
                <span className={cn(
                  "font-bold",
                  staff.status === 'On Duty' ? "text-secondary" : staff.status === 'On Break' ? "text-tertiary" : "text-outline"
                )}>{staff.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all min-h-[44px]">
                <Mail className="w-3.5 h-3.5" /> Message
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface-variant hover:bg-secondary/5 hover:text-secondary transition-all min-h-[44px]">
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
