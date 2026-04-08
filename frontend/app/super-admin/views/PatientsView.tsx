import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Filter, MoreVertical, FileText, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminPatients, AdminPatient } from '../hooks/useAdminData';
import { api } from '@/lib/api';

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':     return 'bg-blue-50 text-blue-700';
    case 'discharged': return 'bg-surface-container-low text-on-surface-variant';
    case 'critical':   return 'bg-error/10 text-error';
    default:           return 'bg-surface-container-low text-on-surface-variant';
  }
};

export const PatientsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: patients, isLoading, error, refetch } = useAdminPatients(searchTerm);

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  };

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
          <button
            onClick={refetch}
            title="Refresh"
            className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <Filter size={18} />
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white p-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Patient</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center justify-between">
          <span>Failed to load patients: {error}</span>
          <button onClick={refetch} className="underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Patient</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Condition</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Registered</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-surface-container-low animate-pulse rounded-full w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                (patients ?? []).map((patient: AdminPatient) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={patient._id} 
                    className="hover:bg-surface-container-low/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{patient.name}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60 font-bold">
                          {patient._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.condition ?? '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.branchId ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant opacity-80">{formatDate(patient.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider",
                        statusColor(patient.status)
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
                ))
              )}
            </tbody>
          </table>
          
          {!isLoading && (patients ?? []).length === 0 && !error && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No patients found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
