"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Users, UserCheck, UserMinus, 
  Clock, Activity, MapPin, CheckCircle2 
} from "lucide-react";
import api from "@/lib/api"; 
import { toast } from "sonner";

// ─── TYPES ───
interface Patient {
  _id: string;
  name: string;
  parentName: string;
  therapyType: string;
  attendanceStatus: "not_marked" | "checked_in" | "checked_out";
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface Summary {
  totalActivePatients: number;
  currentlyAvailable: number;
  checkedOutToday: number;
}

export default function PatientAttendanceView() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalActivePatients: 0,
    currentlyAvailable: 0,
    checkedOutToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ─── FETCH DATA ───
  const fetchAttendance = async () => {
    try {
      const { data } = await api.get("/manager/patient-attendance/today");
      if (data.success) {
        setPatients(data.data.list);
        setSummary(data.data.summary);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAttendance, 120000);
    return () => clearInterval(interval);
  }, []);

  // ─── HANDLERS ───
  const handleCheckIn = async (patientId: string) => {
    if (processingId) return;
    setProcessingId(patientId);
    try {
      const { data } = await api.post("/manager/patient-attendance/check-in", { patientId });
      if (data.success) {
        toast.success("Patient checked in successfully!");
        fetchAttendance();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Check-in failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckOut = async (patientId: string) => {
    if (processingId) return;
    setProcessingId(patientId);
    try {
      const { data } = await api.post("/manager/patient-attendance/check-out", { patientId });
      if (data.success) {
        toast.success("Patient checked out successfully!");
        fetchAttendance();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Check-out failed");
    } finally {
      setProcessingId(null);
    }
  };

  // ─── FILTER ───
  const filteredPatients = useMemo(() => {
    return patients.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.parentName && p.parentName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [patients, searchQuery]);

  // ─── FORMAT TIME ───
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
        
      {/* Header section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Patient Attendance</h1>
          <p className="mt-1 text-slate-500">Manage real-time clinic inflow and departures.</p>
        </div>
        
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient or parent name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard 
          title="Total Active" 
          value={summary.totalActivePatients} 
          icon={<Users className="h-6 w-6 text-indigo-500" />} 
          delay={0.1} 
        />
        <StatCard 
          title="Currently In-Clinic" 
          value={summary.currentlyAvailable} 
          icon={<UserCheck className="h-6 w-6 text-emerald-500" />} 
          delay={0.2} 
          active
        />
        <StatCard 
          title="Checked Out Today" 
          value={summary.checkedOutToday} 
          icon={<UserMinus className="h-6 w-6 text-orange-500" />} 
          delay={0.3} 
        />
      </div>

      {/* Patient List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200/60 bg-white/60 p-1 shadow-sm backdrop-blur-xl"
      >
        <div className="overflow-x-auto rounded-xl bg-white">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient Info</th>
                <th className="px-6 py-4 font-semibold">Therapy</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Time Log</th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      No patients found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient, idx) => (
                    <motion.tr 
                      key={patient._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group transition-colors hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{patient.name}</div>
                        <div className="text-xs text-slate-500">P: {patient.parentName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <Activity className="h-3 w-3 text-indigo-500" />
                          {patient.therapyType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={patient.attendanceStatus} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-slate-500">
                          {patient.checkInTime && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-emerald-500" /> 
                              In: <strong className="text-slate-700">{formatTime(patient.checkInTime)}</strong>
                            </span>
                          )}
                          {patient.checkOutTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-orange-400" /> 
                              Out: <strong className="text-slate-700">{formatTime(patient.checkOutTime)}</strong>
                            </span>
                          )}
                          {!patient.checkInTime && !patient.checkOutTime && (
                            <span className="text-slate-400">Not arrived yet</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {patient.attendanceStatus === "not_marked" && (
                          <ActionButton 
                            label="Check In" 
                            variant="primary" 
                            loading={processingId === patient._id}
                            onClick={() => handleCheckIn(patient._id)}
                          />
                        )}
                        {patient.attendanceStatus === "checked_in" && (
                          <ActionButton 
                            label="Check Out" 
                            variant="danger" 
                            loading={processingId === patient._id}
                            onClick={() => handleCheckOut(patient._id)}
                          />
                        )}
                        {patient.attendanceStatus === "checked_out" && (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
                            <CheckCircle2 className="h-4 w-4" /> Completed
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

// ─── SUB-COMPONENTS ───

function StatCard({ title, value, icon, delay, active = false }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md ${
        active ? "border-indigo-200 ring-1 ring-indigo-50" : "border-slate-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${active ? "bg-indigo-50" : "bg-slate-50"}`}>
          {icon}
        </div>
      </div>
      {active && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "checked_in":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          In Clinic
        </span>
      );
    case "checked_out":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
          Checked Out
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
          Not Arrived
        </span>
      );
  }
}

function ActionButton({ label, variant, loading, onClick }: any) {
  const isPrimary = variant === "primary";
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 ${
        isPrimary 
          ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg focus:ring-indigo-500" 
          : "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-100 focus:ring-rose-500"
      }`}
    >
      {loading ? (
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className={`mr-2 h-4 w-4 rounded-full border-2 border-t-transparent ${isPrimary ? "border-white" : "border-rose-600"}`}
        />
      ) : null}
      {label}
    </motion.button>
  );
}