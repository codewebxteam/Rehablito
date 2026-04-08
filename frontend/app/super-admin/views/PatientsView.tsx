import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Filter, MoreVertical, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  branch: string;
  status: 'Active' | 'Discharged' | 'Critical';
  lastVisit: string;
}

// --- Mock Data ---
const PATIENTS: Patient[] = [
  { id: 'PT-001', name: 'Aarav Gupta', age: 34, condition: 'Post-Op Rehab', branch: 'Mumbai', status: 'Active', lastVisit: '10 May 2026' },
  { id: 'PT-002', name: 'Riya Sharma', age: 10, condition: 'Autism Spectrum', branch: 'Delhi', status: 'Active', lastVisit: '09 May 2026' },
  { id: 'PT-003', name: 'Karan Desai', age: 65, condition: 'Knee Replacement', branch: 'Patna', status: 'Discharged', lastVisit: '25 Apr 2026' },
  { id: 'PT-004', name: 'Ananya Verma', age: 28, condition: 'Sports Injury', branch: 'Mumbai', status: 'Active', lastVisit: '11 May 2026' },
  { id: 'PT-005', name: 'Vihaan Singh', age: 8, condition: 'ADHD / Autism', branch: 'Delhi', status: 'Active', lastVisit: '08 May 2026' },
  { id: 'PT-006', name: 'Megha Rao', age: 45, condition: 'Stroke Paralysis', branch: 'Patna', status: 'Critical', lastVisit: '11 May 2026' },
];

export const PatientsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredPatients = PATIENTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Patients Directory</h3>
            <p className="text-xs text-on-surface-variant font-medium opacity-60">Manage all admitted and discharged patients</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
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
            <span className="hidden sm:inline">Add Patient</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Patient</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Age</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Condition</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Last Visit</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {filteredPatients.map((patient) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={patient.id} 
                  className="hover:bg-surface-container-low/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{patient.name}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60 font-bold">{patient.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.age} yrs</td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.condition}</td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.branch}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant opacity-80">{patient.lastVisit}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider",
                      patient.status === 'Active' && "bg-blue-50 text-blue-700",
                      patient.status === 'Discharged' && "bg-surface-container-low text-on-surface-variant",
                      patient.status === 'Critical' && "bg-error/10 text-error"
                    )}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredPatients.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No patients found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
