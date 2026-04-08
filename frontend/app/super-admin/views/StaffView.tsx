import React, { useState } from 'react';
import { Search, Plus, Filter, UserCog, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  branch: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

const INITIAL_STAFF: Staff[] = [
  { id: 'EMP-001', name: 'Dr. Sameer Khan', role: 'Senior Therapist', department: 'Physiotherapy', branch: 'Mumbai', status: 'Active' },
  { id: 'EMP-002', name: 'Alia Bhattacharya', role: 'Behavioral Expert', department: 'Autism Center', branch: 'Delhi', status: 'Active' },
  { id: 'EMP-003', name: 'Rohan Mehta', role: 'Junior Therapist', department: 'Physiotherapy', branch: 'Mumbai', status: 'On Leave' },
  { id: 'EMP-004', name: 'Kritika Singh', role: 'Receptionist', department: 'Admin', branch: 'Patna', status: 'Active' },
  { id: 'EMP-005', name: 'Dr. Anita Desai', role: 'Consultant', department: 'Autism Center', branch: 'Patna', status: 'Inactive' },
];

export const StaffView = () => {
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-container rounded-xl text-primary">
            <UserCog size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Staff Directory</h3>
            <p className="text-xs text-on-surface-variant font-medium opacity-60">Manage employee records and roles</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input 
              type="text" 
              placeholder="Search staff, roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-on-surface"
            />
          </div>
          <button className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <Filter size={18} />
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white p-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Staff</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Employee</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Role</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Department</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {filteredStaff.map((staff) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={staff.id} 
                  className="hover:bg-surface-container-low/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface-variant/70 text-sm">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{staff.name}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60 font-bold">{staff.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{staff.role}</td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                    <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {staff.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{staff.branch}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider",
                      staff.status === 'Active' && "bg-green-50 text-green-700",
                      staff.status === 'On Leave' && "bg-amber-50 text-amber-700",
                      staff.status === 'Inactive' && "bg-surface-container-low text-on-surface-variant"
                    )}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-surface-container-low rounded-lg text-primary transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredStaff.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No staff found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
