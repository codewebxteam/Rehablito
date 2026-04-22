"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  UserCheck,
  CreditCard,
  Settings,
  Plus,
  Search,
  Bell,
  Calendar,
  ClipboardList,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAuth } from '../context/AuthContext';
import {
  Patient,
  Lead,
  Staff,
  BillingRecord,
  NewPaymentInput,
  ViewType
} from './types';

// Views
import DashboardView from './views/DashboardView';
import PatientOnboardingView from './views/PatientOnboardingView';
import LeadManagementView from './views/LeadManagementView';
import StaffManagementView from './views/StaffManagementView';
import BillingManagementView from './views/BillingManagementView';
import PatientsListView from './views/PatientsListView';
import ServicesView from './views/ServicesView';

// ── Lead API types & mappers ──
type ApiLeadStatus = 'new' | 'contacted' | 'converted' | 'closed';

interface ApiLead {
  _id: string;
  childName: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  age?: number;
  diagnosis?: string;
  referredBy?: string;
  status: ApiLeadStatus;
  createdAt: string;
}

const apiToUiStatus = (s: ApiLeadStatus): Lead['status'] => {
  if (s === 'new') return 'New';
  if (s === 'contacted') return 'Contacted';
  if (s === 'converted') return 'Converted';
  return 'Cold';
};

const uiToApiStatus = (s: Lead['status']): ApiLeadStatus => {
  if (s === 'New') return 'new';
  if (s === 'Contacted' || s === 'In Discussion' || s === 'Hot') return 'contacted';
  if (s === 'Converted') return 'converted';
  return 'closed';
};

const apiLeadToUi = (l: ApiLead): Lead => ({
  id: l._id,
  name: l.childName || l.parentName || 'Unknown',
  parentName: l.parentName,
  phone: l.parentPhone || '',
  email: l.parentEmail,
  age: l.age,
  service: l.diagnosis,
  source: l.referredBy || 'Direct',
  status: apiToUiStatus(l.status),
  dateReceived: new Date(l.createdAt).toISOString().split('T')[0],
});

// ── Staff API types & mappers ──
interface ApiStaff {
  _id: string;
  name: string;
  email: string;
  role: 'staff' | 'branch_manager';
  staffId?: string;
  mobileNumber?: string;
  branchId?: { _id: string; name: string } | string | null;
  todayStatus?: 'present' | 'absent' | 'leave' | 'half_day' | 'on_duty' | 'not_marked';
}

const apiStaffToUi = (s: ApiStaff): Staff => ({
  id: s._id,
  name: s.name,
  email: s.email,
  role: s.role === 'branch_manager' ? 'Admin' : 'Physio',
  status: s.todayStatus && s.todayStatus !== 'not_marked' && s.todayStatus !== 'absent' ? 'Active' : 'Inactive',
  attendance: [],
});

// ── Patient API types & mappers ──
interface ApiPatient {
  _id: string;
  patientId?: string;
  name: string;
  parentName?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  diagnosis?: string;
  therapyType?: string[];
  address?: string;
  parentPhone?: string;
  admissionDate?: string;
  createdAt?: string;
  totalFee?: number;
  serviceId?: string;
}

const capitalize = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const apiPatientToUi = (p: ApiPatient): Patient => ({
  id: p._id,
  patientId: p.patientId || `RX-${p._id.slice(-6).toUpperCase()}`,
  name: p.name,
  parentName: p.parentName,
  age: p.age ?? 0,
  gender: capitalize(p.gender),
  therapyType: p.therapyType?.[0],
  condition: p.diagnosis || '',
  address: p.address,
  phone: p.parentPhone || '',
  onboardedAt: p.admissionDate || p.createdAt || new Date().toISOString(),
  totalFee: p.totalFee ?? 0,
  serviceId: p.serviceId,
});

// ── Billing API types & mappers ──
interface ApiFeePayment {
  _id: string;
  patientId?: { _id: string; name: string; parentName?: string } | string | null;
  amount: number;
  dueAmount?: number;
  paymentDate?: string;
  method?: 'cash' | 'upi' | 'bank_transfer' | 'card';
  status?: 'paid' | 'partial' | 'overdue' | 'pending';
  receiptNumber?: string;
  description?: string;
  createdAt?: string;
}

const apiFeeToUi = (f: ApiFeePayment): BillingRecord => {
  const patient = typeof f.patientId === 'object' && f.patientId ? f.patientId : null;
  const date = f.paymentDate || f.createdAt || new Date().toISOString();
  return {
    id: f._id,
    patientId: patient?._id || (typeof f.patientId === 'string' ? f.patientId : undefined),
    patientName: patient?.name || 'Unknown',
    amountPaid: f.amount || 0,
    dueAmount: f.dueAmount || 0,
    date: date.split('T')[0],
    method: f.method,
    status: f.status,
    receiptNumber: f.receiptNumber,
    description: f.description,
    items: f.description
      ? [{ description: f.description, sessions: 1, price: f.amount || 0 }]
      : [],
  };
};

export default function ManagerDashboardApp() {
  const { logout, user } = useAuth();
  const [branchName, setBranchName] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  // Responsive Sidebar States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check-in / duty status
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const resolveViewFromPath = (path: string): ViewType => {
    const segment = path.split('/')[2];
    const validViews: ViewType[] = ['dashboard', 'onboarding', 'patients', 'leads', 'staff', 'billing', 'services'];
    return validViews.includes(segment as ViewType) ? (segment as ViewType) : 'dashboard';
  };

  const navigateToView = (view: ViewType) => {
    setIsSidebarOpen(false);
    router.push(`/manager/${view}`);
  };

  const currentView = resolveViewFromPath(pathname);

  const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const addPatient = (patient: Patient) => {
    setPatients(prev => [patient, ...prev]);
    const newBilling: BillingRecord = {
      id: `INV-${Date.now()}`,
      patientName: patient.name,
      amountPaid: 0,
      dueAmount: 500,
      date: new Date().toISOString().split('T')[0],
      items: [{ description: 'Initial Consultation', sessions: 1, price: 500 }]
    };
    setBilling(prev => [newBilling, ...prev]);
    addNotification(`Patient ${patient.name} onboarded successfully!`);
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data } = await api.get('/manager/leads');
        if (data.success) {
          setLeads((data.data as ApiLead[]).map(apiLeadToUi));
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        addNotification('Failed to load leads', 'error');
      }
    };
    const fetchStaff = async () => {
      try {
        const { data } = await api.get('/manager/staff');
        if (data.success) {
          const list = data.data as ApiStaff[];
          setStaff(list.map(apiStaffToUi));
          const populated = list.find(s => s.branchId && typeof s.branchId === 'object');
          if (populated && typeof populated.branchId === 'object' && populated.branchId) {
            setBranchName(populated.branchId.name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
        addNotification('Failed to load staff', 'error');
      }
    };
    const fetchDutyStatus = async () => {
      try {
        const { data } = await api.get('/staff/duty-status');
        if (data.success) {
          setIsOnDuty(!!data.data.isOnDuty);
        }
      } catch (err) {
        console.error('Failed to fetch duty status:', err);
      }
    };
    const fetchPatients = async () => {
      try {
        const { data } = await api.get('/manager/patients');
        if (data.success) {
          setPatients((data.data as ApiPatient[]).map(apiPatientToUi));
        }
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        addNotification('Failed to load patients', 'error');
      }
    };
    const fetchPayments = async () => {
      try {
        const { data } = await api.get('/manager/billing');
        if (data.success) {
          setBilling((data.data as ApiFeePayment[]).map(apiFeeToUi));
        }
      } catch (err) {
        console.error('Failed to fetch billing:', err);
        addNotification('Failed to load billing', 'error');
      }
    };
    fetchLeads();
    fetchStaff();
    fetchPatients();
    fetchPayments();
    fetchDutyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  };

  const handleCheckInOut = async () => {
    if (checkinLoading) return;
    setCheckinLoading(true);
    try {
      const pos = await getCurrentPosition();
      const payload = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      const endpoint = isOnDuty ? '/staff/check-out' : '/staff/check-in';
      const { data } = await api.post(endpoint, payload);
      if (data.success) {
        setIsOnDuty(!isOnDuty);
        addNotification(data.message || (isOnDuty ? 'Checked out' : 'Checked in'));
      } else {
        addNotification(data.message || 'Action failed', 'error');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.message || axiosErr?.message || 'Check-in failed';
      addNotification(msg, 'error');
    } finally {
      setCheckinLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    try {
      const { data } = await api.put(`/manager/leads/${id}`, { status: uiToApiStatus(status) });
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === id ? apiLeadToUi(data.data as ApiLead) : l));
        addNotification(`Lead status updated to ${status}`);
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
      addNotification('Failed to update lead status', 'error');
    }
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'dateReceived'>) => {
    try {
      const payload = {
        childName: lead.name,
        parentName: lead.parentName || lead.name,
        parentPhone: lead.phone,
        parentEmail: lead.email,
        age: lead.age,
        diagnosis: lead.service,
        referredBy: lead.source || undefined,
        status: uiToApiStatus(lead.status),
      };
      const { data } = await api.post('/manager/leads', payload);
      if (data.success) {
        setLeads(prev => [apiLeadToUi(data.data as ApiLead), ...prev]);
        addNotification(`New lead ${lead.name} added`);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      addNotification(axiosError?.response?.data?.message || 'Failed to add lead', 'error');
    }
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    addNotification('Lead removed from view', 'error');
  };

  const updateLead = async (updatedLead: Lead) => {
    try {
      const payload = {
        childName: updatedLead.name,
        parentName: updatedLead.parentName || updatedLead.name,
        parentPhone: updatedLead.phone,
        parentEmail: updatedLead.email,
        age: updatedLead.age,
        diagnosis: updatedLead.service,
        referredBy: updatedLead.source || undefined,
        status: uiToApiStatus(updatedLead.status),
      };
      const { data } = await api.put(`/manager/leads/${updatedLead.id}`, payload);
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === updatedLead.id ? apiLeadToUi(data.data as ApiLead) : l));
        addNotification(`Lead ${updatedLead.name} updated`);
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
      addNotification('Failed to update lead', 'error');
    }
  };

  const toggleStaffStatus = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s));
    const member = staff.find(s => s.id === id);
    addNotification(`Staff ${member?.name} is now ${member?.status === 'Active' ? 'Inactive' : 'Active'}`);
  };

  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    addNotification(`Staff member removed`, 'error');
  };

  const updateStaff = (updatedStaff: Staff) => {
    setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
    addNotification(`Staff member ${updatedStaff.name} updated`);
  };

  const addBilling = async (input: NewPaymentInput): Promise<BillingRecord | null> => {
    try {
      const payload = {
        patientId: input.patientId,
        amount: input.amount,
        dueAmount: input.dueAmount || 0,
        description: input.description || undefined,
        method: input.method || 'cash',
        status: (input.dueAmount || 0) > 0 ? 'partial' : 'paid',
      };
      const { data } = await api.post('/manager/billing', payload);
      if (data.success) {
        const record = apiFeeToUi(data.data as ApiFeePayment);
        setBilling(prev => [record, ...prev]);
        addNotification(`New payment recorded for ${record.patientName}`);
        return record;
      }
      return null;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addNotification(axiosErr?.response?.data?.message || 'Failed to record payment', 'error');
      return null;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await api.delete(`/manager/patients/${id}`);
    } catch (_) {}
    setPatients(prev => prev.filter(p => p.id !== id));
    addNotification('Patient removed successfully');
  };

  const updatePatientRecord = async (updated: Patient) => {
    try {
      const payload = {
        name: updated.name,
        parentName: updated.parentName,
        age: updated.age,
        gender: updated.gender.toLowerCase(),
        therapyType: updated.therapyType ? [updated.therapyType] : [],
        diagnosis: updated.condition,
        address: updated.address,
        parentPhone: updated.phone,
      };
      const { data } = await api.put(`/manager/patients/${updated.id}`, payload);
      if (data.success) {
        setPatients(prev => prev.map(p => p.id === updated.id ? apiPatientToUi(data.data) : p));
        addNotification(`Patient ${updated.name} updated`);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      addNotification(e?.response?.data?.message || 'Failed to update patient', 'error');
    }
  };

  const deleteBilling = (id: string) => {
    setBilling(prev => prev.filter(b => b.id !== id));
    addNotification('Invoice removed from view', 'error');
  };

  const updateBilling = async (updatedRecord: BillingRecord) => {
    try {
      const payload: Record<string, unknown> = {
        amount: updatedRecord.amountPaid,
        dueAmount: updatedRecord.dueAmount,
        description: updatedRecord.description,
        method: updatedRecord.method,
      };
      if (updatedRecord.dueAmount > 0) payload.status = 'partial';
      else payload.status = 'paid';

      const { data } = await api.put(`/manager/billing/${updatedRecord.id}`, payload);
      if (data.success) {
        const record = apiFeeToUi(data.data as ApiFeePayment);
        setBilling(prev => prev.map(b => b.id === record.id ? record : b));
        addNotification(`Billing record for ${record.patientName} updated`);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      addNotification(axiosErr?.response?.data?.message || 'Failed to update billing', 'error');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Patient Onboarding', icon: UserPlus },
    { id: 'patients', label: 'Patients', icon: ClipboardList },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'staff', label: 'Staff', icon: UserCheck },
    { id: 'services', label: 'Services', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen bg-surface overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-60 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-surface border-r border-outline-variant/10 flex flex-col transition-all duration-300 z-70",
        // Mobile (< 1024px)
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",

        isSidebarCollapsed ? "lg:w-20" : "lg:w-64",
        // Force fixed on large desktop
        "2xl:translate-x-0 2xl:w-64"
      )}>
        <div className={cn(
          "flex items-center justify-between py-8 px-6",
          isSidebarCollapsed && "lg:px-4 lg:justify-center"
        )}>
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-0">
              <div className="w-14 h-14 bg-transparent rounded-xl flex shrink-0 items-center justify-center overflow-hidden">
                <Image src="/logo.jpeg" alt="Rehablito Logo" width={56} height={56} className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col justify-center whitespace-nowrap -ml-1">
                <span className="text-xl font-extrabold font-display text-primary tracking-tighter leading-none">Rehablito</span>
                <span className="text-[10px] font-bold text-[#7dce82] tracking-wide leading-none mt-1">Physio & Autism Center</span>
                <span className="text-[9px] font-bold text-on-surface leading-none mt-1">Everyone Deserves Trusted Hands...</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-transparent rounded-xl flex items-center justify-center overflow-hidden">
              <Image src="/logo.jpeg" alt="R" width={40} height={40} className="w-full h-full object-contain scale-125" />
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateToView(item.id as ViewType)}
              title={isSidebarCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm tracking-tight",
                currentView === item.id
                  ? "text-primary bg-surface-container-low border-r-4 border-primary"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low",
                isSidebarCollapsed && "lg:justify-center lg:px-0 lg:border-r-0 lg:border-b-4"
              )}
            >
              <item.icon size={20} />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-1 px-4 pb-8">
          {!isSidebarCollapsed ? (
            <button
              onClick={() => navigateToView('onboarding')}
              className="w-full mb-6 bg-linear-to-br from-secondary to-[#00897b] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <Plus size={18} />
              Add New Patient
            </button>
          ) : (
            <button
              onClick={() => navigateToView('onboarding')}
              className="w-12 h-12 mx-auto mb-6 bg-secondary text-white rounded-xl flex items-center justify-center shadow-md hover:opacity-90 transition-all"
            >
              <Plus size={24} />
            </button>
          )}

          <button className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant font-semibold text-sm hover:text-primary transition-colors",
            isSidebarCollapsed && "lg:justify-center lg:px-0"
          )}>
            <Settings size={18} />
            {!isSidebarCollapsed && <span>Settings</span>}
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex 2xl:hidden w-full items-center gap-3 px-4 py-2 text-on-surface-variant font-semibold text-sm hover:text-primary transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>

          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant font-semibold text-sm hover:text-error transition-colors",
            isSidebarCollapsed && "lg:justify-center lg:px-0"
          )}>
            <LogOut size={18} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen min-w-0 overflow-x-hidden pink-gradient-bg relative transition-all duration-300",
        isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
        "2xl:ml-64"
      )}>
        {/* Top Navbar */}
        <header className={cn(
          "fixed top-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-outline-variant/15 flex justify-between items-center px-4 md:px-8 h-24 shadow-sm transition-all duration-300",
          "left-0",
          isSidebarCollapsed ? "lg:left-20" : "lg:left-64",
          "2xl:left-64"
        )}>
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex flex-col justify-center bg-surface-container-lowest border border-outline-variant/15 rounded-2xl px-4 py-2.5 shadow-sm min-w-62.5">
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-primary/70">Manager Workspace</span>
              <span className="text-base font-extrabold text-on-surface mt-1 leading-none">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="hidden md:flex bg-surface-container-low px-3 py-1.5 rounded-full items-center gap-2 w-48 lg:w-64">
              <Search size={16} className="text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-on-surface-variant/60"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2 md:gap-4 text-on-surface-variant">
              <button className="p-2 hover:text-primary transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
              </button>
              <button className="hidden sm:block p-2 hover:text-primary transition-all">
                <Calendar size={20} />
              </button>
            </div>
            <div className="hidden sm:block h-8 w-px bg-outline-variant/30 mx-2"></div>
            <button
              onClick={handleCheckInOut}
              disabled={checkinLoading}
              className={cn(
                "hidden md:block text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                isOnDuty ? "bg-error" : "bg-primary"
              )}
            >
              {checkinLoading ? 'Please wait...' : isOnDuty ? 'Check-out' : 'Check-in'}
            </button>
            <div className="flex items-center gap-2 md:gap-3 ml-2">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-on-surface">{user?.name || 'Manager'}</p>
                <p className="text-[10px] text-on-surface-variant">{branchName || (user?.role === 'branch_manager' ? 'Branch Manager' : 'Manager')}</p>
              </div>
              <Image
                src="https://picsum.photos/seed/manager/100/100"
                alt="Profile"
                width={36}
                height={36}
                unoptimized
                className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover ring-2 ring-primary/10"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="pt-28 md:pt-32 px-4 md:px-8 pb-12 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && (
                <DashboardView
                  leads={leads}
                  staff={staff}
                  billing={billing}
                  patients={patients}
                  onNavigate={navigateToView}
                />
              )}
              { currentView === 'onboarding' && (
                <PatientOnboardingView onOnboard={addPatient} />
              )}
              { currentView === 'patients' && (
              <PatientsListView patients={patients} billing={billing} onDelete={deletePatient} onUpdate={updatePatientRecord} onAddPayment={addBilling} />
              )}
              {currentView === 'leads' && (
                <LeadManagementView
                  leads={leads}
                  onUpdateStatus={updateLeadStatus}
                  onAddLead={addLead}
                  onDeleteLead={deleteLead}
                  onUpdateLead={updateLead}
                />
              )}
              {currentView === 'staff' && (
                <StaffManagementView
                  staff={staff}
                  onToggleStatus={toggleStaffStatus}
                  onDeleteStaff={deleteStaff}
                  onUpdateStaff={updateStaff}
                />
              )}
              {currentView === 'services' && <ServicesView />}
              {currentView === 'billing' && (
                <BillingManagementView
                  billing={billing}
                  patients={patients}
                  onAddPayment={addBilling}
                  onDeleteBilling={deleteBilling}
                  onUpdateBilling={updateBilling}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="fixed bottom-8 right-8 z-100 space-y-2">
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "px-6 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-2",
                  n.type === 'success' ? "bg-secondary text-white" : "bg-error text-white"
                )}
              >
                {n.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {n.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden z-10"
              >
                <div className="absolute top-0 right-0 p-4">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-outline" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-headline font-bold text-on-surface">Confirm Logout</h3>
                    <p className="text-on-surface-variant">
                      Are you sure you want to log out? Any unsaved changes might be lost.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full pt-4">
                    <button 
                      onClick={() => setShowLogoutConfirm(false)}
                      className="px-6 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        logout();
                        router.push('/');
                      }}
                      className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
