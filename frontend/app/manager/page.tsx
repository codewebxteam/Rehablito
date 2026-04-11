"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
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
  ViewType
} from './types';

// Views
import DashboardView from './views/DashboardView';
import PatientOnboardingView from './views/PatientOnboardingView';
import LeadManagementView from './views/LeadManagementView';
import StaffManagementView from './views/StaffManagementView';
import BillingManagementView from './views/BillingManagementView';

// Mock Data
const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'Ananya Sharma', phone: '9876541234', source: 'Facebook Ads', status: 'Hot', dateReceived: '2023-10-24' },
  { id: '2', name: 'Rahul Verma', phone: '8765435678', source: 'Google Maps', status: 'In Discussion', dateReceived: '2023-10-23' },
  { id: '3', name: 'Meera Kapoor', phone: '7654329012', source: 'Direct Walk-in', status: 'Hot', dateReceived: '2023-10-22' },
  { id: '4', name: 'Sanjay Mishra', phone: '6543213456', source: 'Website Referral', status: 'Cold', dateReceived: '2023-10-21' },
];

const INITIAL_STAFF: Staff[] = [
  { id: '1', name: 'Dr. Sarah Jenkins', role: 'Physio', status: 'Active', email: 'sarah.j@rehablito.com', attendance: [] },
  { id: '2', name: 'Marcus Wright', role: 'Admin', status: 'Inactive', email: 'm.wright@rehablito.com', attendance: [] },
  { id: '3', name: 'Elena Rodriguez', role: 'Support', status: 'Active', email: 'elena.r@rehablito.com', attendance: [] },
  { id: '4', name: 'Dr. Thomas Chen', role: 'Physio', status: 'Active', email: 't.chen@rehablito.com', attendance: [] },
];

const INITIAL_BILLING: BillingRecord[] = [
  {
    id: 'INV-2023-9042',
    patientName: 'Elena Rodriguez',
    amountPaid: 1200,
    dueAmount: 0,
    date: '2023-10-24',
    items: [
      { description: 'Post-Op Lower Limb Rehab', sessions: 8, price: 800 },
      { description: 'Personal Mobility Assessment', sessions: 1, price: 250 },
      { description: 'Wellness Equipment Rental', sessions: '—', price: 150 },
    ]
  },
  { id: 'INV-2023-9043', patientName: 'James Miller', amountPaid: 450, dueAmount: 850, date: '2023-10-22', items: [] },
  { id: 'INV-2023-9044', patientName: 'Sarah Chen', amountPaid: 2800, dueAmount: 0, date: '2023-10-20', items: [] },
];

export default function ManagerDashboardApp() {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [billing, setBilling] = useState<BillingRecord[]>(INITIAL_BILLING);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  // Responsive Sidebar States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const resolveViewFromPath = (path: string): ViewType => {
    const segment = path.split('/')[2];
    const validViews: ViewType[] = ['dashboard', 'onboarding', 'leads', 'staff', 'billing'];
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

  const updateLeadStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    addNotification(`Lead status updated to ${status}`);
  };

  const addLead = (lead: Omit<Lead, 'id' | 'dateReceived'>) => {
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      dateReceived: new Date().toISOString().split('T')[0]
    };
    setLeads(prev => [newLead, ...prev]);
    addNotification(`New lead ${lead.name} added`);
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    addNotification(`Lead deleted`, 'error');
  };

  const updateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    addNotification(`Lead ${updatedLead.name} updated`);
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

  const addBilling = (record: BillingRecord) => {
    setBilling(prev => [record, ...prev]);
    addNotification(`New payment recorded for ${record.patientName}`);
  };

  const deleteBilling = (id: string) => {
    setBilling(prev => prev.filter(b => b.id !== id));
    addNotification(`Invoice deleted`, 'error');
  };

  const updateBilling = (updatedRecord: BillingRecord) => {
    setBilling(prev => prev.map(b => b.id === updatedRecord.id ? updatedRecord : b));
    addNotification(`Billing record for ${updatedRecord.patientName} updated`);
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

        <nav className="flex-1 space-y-1 px-4">
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
            onClick={logout}
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
            <button className="hidden md:block bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 active:scale-95 transition-all">
              Check-in
            </button>
            <div className="flex items-center gap-2 md:gap-3 ml-2">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-on-surface">Admin Manager</p>
                <p className="text-[10px] text-on-surface-variant">Center Lead</p>
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
      </main>
    </div>
  );
}
