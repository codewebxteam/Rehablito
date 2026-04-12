import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Calendar,
  FileText,
  CreditCard,
  User
} from 'lucide-react';
import { Patient, BillingRecord } from '../types';

interface PatientsListViewProps {
  patients: Patient[];
  billing: BillingRecord[];
}

export default function PatientsListView({ patients, billing }: PatientsListViewProps) {
  // Aggregate billing data per patient name (this could be per id if billing had patientId)
  const getBillingStats = (patientName: string) => {
    const patientBills = billing.filter(b => b.patientName.toLowerCase() === patientName.toLowerCase());
    const totalPaid = patientBills.reduce((sum, bill) => sum + bill.amountPaid, 0);
    const totalDue = patientBills.reduce((sum, bill) => sum + bill.dueAmount, 0);
    return { totalPaid, totalDue, recordCount: patientBills.length };
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface font-headline tracking-tight">Patient Directory</h1>
          <p className="text-sm text-on-surface-variant font-medium">View all registered patients and billing summaries</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="flex-1 md:flex-none flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-outline-variant/20 shadow-sm">
            <Search size={16} className="text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="bg-transparent border-none focus:ring-0 text-sm w-full md:w-48 placeholder:text-on-surface-variant/60"
            />
          </div>
          <button className="p-2.5 bg-white border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-outline-variant/20 text-center shadow-sm">
          <User className="mx-auto h-12 w-12 text-outline-variant opacity-50 mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No Patients Found</h3>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">
            You haven't onboarded any patients yet. Go to Patient Onboarding to add your first patient.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map((patient, idx) => {
            const stats = getBillingStats(patient.name);
            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Patient Header */}
                <div className="p-5 border-b border-outline-variant/10 flex justify-between items-start bg-secondary/5">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-on-surface leading-tight">{patient.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant font-medium">
                      <span>{patient.age} yrs • {patient.gender}</span>
                      <span className="flex items-center gap-1"><Phone size={10} /> {patient.phone}</span>
                    </div>
                  </div>
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1 -mr-1">
                    <MoreVertical size={16} />
                  </button>
                </div>
                
                {/* Clinical Details */}
                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Condition / Treatment</span>
                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low inline-block px-2.5 py-1 rounded-md">
                      {patient.condition || 'Not specified'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                    <Calendar size={14} className="text-primary/70" />
                    Onboarded: {new Date(patient.onboardedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Billing Summary Footer */}
                <div className="p-5 pt-4 border-t border-outline-variant/10 bg-surface-container-lowest grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <CreditCard size={12} className="text-secondary" /> Paid
                    </span>
                    <p className="text-lg font-extrabold text-secondary">₹{stats.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <FileText size={12} className="text-error" /> Due
                    </span>
                    <p className={`text-lg font-extrabold ${stats.totalDue > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                      ₹{stats.totalDue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
