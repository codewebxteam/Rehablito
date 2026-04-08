"use client";

import { useState, useEffect } from 'react';
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import {
  Patient,
  Lead,
  Staff,
  BillingRecord,
  ViewType
} from './types';

// Auth
import { useRequireAuth, useAuth } from '../context/AuthContext';

// API
import { api } from '@/lib/api';
import {
  useManagerPatients,
  useManagerLeads,
  useManagerStaff,
  useManagerBilling,
  ManagerPatient,
  ManagerLead,
  ManagerStaff,
  ManagerBilling,
} from './hooks/useManagerData';

// Views
import DashboardView from './views/DashboardView';
import PatientOnboardingView from './views/PatientOnboardingView';
import LeadManagementView from './views/LeadManagementView';
import StaffManagementView from './views/StaffManagementView';
import BillingManagementView from './views/BillingManagementView';

// Mock Data
// Notification helper type
type NotifType = { id: string; message: string; type: 'success' | 'error' };

export default function ManagerDashboardApp() {
  const { user, isLoading: authLoading } = useRequireAuth(['branch_manager', 'super_admin']);
  const { logout } = useAuth();

  // Live data
  const { data: apiPatients, refetch: refetchPatients } = useManagerPatients();
  const { data: apiLeads,    refetch: refetchLeads    } = useManagerLeads();
  const { data: apiStaff                              } = useManagerStaff();
  const { data: apiBilling,  refetch: refetchBilling  } = useManagerBilling();

  const patients: Patient[] = (apiPatients ?? []).map((p: ManagerPatient) => ({
    id:            p._id,
    name:          p.name,
    age:           p.age ?? 0,
    diagnosis:     p.diagnosis ?? p.condition ?? '',
    phone:         p.phone ?? '',
    address:       p.address ?? '',
    admissionDate: p.createdAt?.slice(0, 10) ?? '',
    status:        (p.status as Patient['status']) ?? 'Active',
  }));

  const leads: Lead[] = (apiLeads ?? []).map((l: ManagerLead) => ({
    id: l._id,
    name: l.name,
    phone: l.phone,
    source: l.source ?? '',
    status: (l.status as Lead['status']) ?? 'Hot',
    dateReceived: l.createdAt?.slice(0, 10) ?? '',
  }));

  const staff: Staff[] = (apiStaff ?? []).map((s: ManagerStaff) => ({
    id: s._id,
    name: s.name,
    role: s.role,
    status: 'Active' as Staff['status'],
    email: s.email,
    attendance: [],
  }));

  const billing: BillingRecord[] = (apiBilling ?? []).map((b: ManagerBilling) => ({
    id: b._id,
    patientName: b.patientName ?? 'Patient',
    amountPaid: b.amount ?? 0,
    dueAmount: b.dueAmount ?? 0,
    date: b.createdAt?.slice(0, 10) ?? '',
    items: [],
  }));

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => { setIsSidebarOpen(false); }, [currentView]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-semibold text-on-surface-variant">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // ─── API-backed actions ─────────────────────────────────────────────────────

  const addPatient = async (patient: Patient) => {
    try {
      await api.post('/manager/patients', {
        name: patient.name, age: patient.age,
        diagnosis: patient.diagnosis, phone: patient.phone,
        address: patient.address,
      });
      refetchPatients();
      addNotification(`Patient ${patient.name} onboarded successfully!`);
    } catch (e: unknown) {
      addNotification(e instanceof Error ? e.message : 'Failed to add patient', 'error');
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    try {
      await api.put(`/manager/leads/${id}`, { status });
      refetchLeads();
      addNotification(`Lead status updated to ${status}`);
    } catch { addNotification('Failed to update lead', 'error'); }
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'dateReceived'>) => {
    try {
      await api.post('/manager/leads', lead);
      refetchLeads();
      addNotification(`New lead ${lead.name} added`);
    } catch { addNotification('Failed to add lead', 'error'); }
  };

  const deleteLead = (_id: string) => {
    refetchLeads();
  };

  const updateLead = async (updatedLead: Lead) => {
    try {
      await api.put(`/manager/leads/${updatedLead.id}`, updatedLead);
      refetchLeads();
      addNotification(`Lead ${updatedLead.name} updated`);
    } catch { addNotification('Failed to update lead', 'error'); }
  };

  const toggleStaffStatus = (_id: string) => {
    addNotification('Staff status updated (local only)');
  };

  const deleteStaff = (_id: string) => {
    addNotification('Staff removal requires admin action', 'error');
  };

  const updateStaff = async (updatedStaff: Staff) => {
    addNotification(`Staff ${updatedStaff.name} updated locally`);
  };

  const addBilling = async (record: BillingRecord) => {
    try {
      await api.post('/manager/billing', {
        patientName: record.patientName,
        amount: record.amountPaid,
        dueAmount: record.dueAmount,
      });
      refetchBilling();
      addNotification(`Payment recorded for ${record.patientName}`);
    } catch { addNotification('Failed to record payment', 'error'); }
  };

  const deleteBilling = (_id: string) => {
    addNotification('Invoice deleted (local)', 'error');
  };

  const updateBilling = async (updatedRecord: BillingRecord) => {
    try {
      await api.put(`/manager/billing/${updatedRecord.id}`, {
        amount: updatedRecord.amountPaid,
        dueAmount: updatedRecord.dueAmount,
      });
      refetchBilling();
      addNotification(`Billing for ${updatedRecord.patientName} updated`);
    } catch { addNotification('Failed to update billing', 'error'); }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Patient Onboarding', icon: UserPlus },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'staff', label: 'Staff', icon: UserCheck },
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
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-surface border-r border-outline-variant/10 flex flex-col transition-all duration-300 z-[70]",
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
                <img src="/logo.jpeg" alt="Rehablito Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col justify-center whitespace-nowrap -ml-1">
                <span className="text-xl font-extrabold font-display text-primary tracking-tighter leading-none">Rehablito</span>
                <span className="text-[10px] font-bold text-[#7dce82] tracking-wide leading-none mt-1">Physio & Autism Center</span>
                <span className="text-[9px] font-bold text-on-surface leading-none mt-1">Everyone Deserves Trusted Hands...</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-transparent rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/logo.jpeg" alt="R" className="w-full h-full object-contain scale-125" />
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as ViewType)}
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
              onClick={() => setCurrentView('onboarding')}
              className="w-full mb-6 bg-gradient-to-br from-secondary to-[#00897b] text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            >
              <Plus size={18} />
              Add New Patient
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('onboarding')}
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

          {/* Collapse Toggle for Desktop - Only show on Tablet/Laptop range */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex 2xl:hidden w-full items-center gap-3 px-4 py-2 text-on-surface-variant font-semibold text-sm hover:text-primary transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isSidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen pink-gradient-bg relative transition-all duration-300",
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
            <div className="flex items-center gap-0">
              <div className="w-16 h-16 bg-transparent rounded-xl flex shrink-0 items-center justify-center overflow-hidden">
                <img src="/logo.jpeg" alt="Rehablito Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col justify-center whitespace-nowrap -ml-1">
                <span className="text-2xl font-extrabold font-display text-primary tracking-tighter leading-none">Rehablito</span>
                <span className="text-[10px] font-bold text-[#7dce82] tracking-wide leading-none mt-1.5">Physio & Autism Center</span>
                <span className="text-[9px] font-bold text-on-surface leading-none mt-1">Everyone Deserves Trusted Hands...</span>
              </div>
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
            <div className="hidden sm:block h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
            <button className="hidden md:block bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 active:scale-95 transition-all">
              Check-in
            </button>
                <div className="flex items-center gap-2 md:gap-3 ml-2">
                  <div className="hidden lg:block text-right">
                    <p className="text-xs font-bold text-on-surface">{user?.name ?? 'Manager'}</p>
                    <p className="text-[10px] text-on-surface-variant capitalize">{user?.role?.replace('_', ' ') ?? 'Branch Manager'}</p>
                  </div>
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {user?.name?.[0]?.toUpperCase() ?? 'M'}
                  </div>
                  <button
                    onClick={logout}
                    title="Logout"
                    className="p-2 hover:text-red-500 text-on-surface-variant transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
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
                  onNavigate={setCurrentView}
                />
              )}
              {currentView === 'onboarding' && (
                <PatientOnboardingView onOnboard={addPatient} />
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
              {currentView === 'billing' && (
                <BillingManagementView
                  billing={billing}
                  onAddPayment={addBilling}
                  onDeleteBilling={deleteBilling}
                  onUpdateBilling={updateBilling}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="fixed bottom-8 right-8 z-[100] space-y-2">
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
      </main>
    </div>
  );
}
