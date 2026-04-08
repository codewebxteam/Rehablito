"use client";
/**
 * Rehablito RMS — Super Admin Data Hooks
 * Each hook fetches real data from /api/admin/* endpoints.
 * Falls back to loading/error states instead of crashing.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// ─── Generic hook factory ─────────────────────────────────────────────────────

function useApiData<T>(endpoint: string, deps: unknown[] = []) {
  const [data, setData]       = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api.get<T>(endpoint)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminPatient {
  _id: string;
  name: string;
  age?: number;
  condition?: string;
  branchId?: string;
  status: string;
  createdAt: string;
}

export interface AdminLead {
  _id: string;
  name: string;
  phone: string;
  source?: string;
  status: string;
  branchId?: string;
  createdAt: string;
}

export interface AdminStaff {
  _id: string;
  name: string;
  email: string;
  role: string;
  branchId?: string;
  staffId?: string;
  mobileNumber?: string;
}

export interface AdminFee {
  _id: string;
  patientId?: string;
  amount: number;
  type?: string;
  createdAt: string;
}

export interface AdminAttendance {
  _id: string;
  staffId?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface AdminBranch {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  location?: { latitude?: number; longitude?: number; radiusMeters?: number };
  managerName?: string;
  patients?: number;
  staff?: number;
}

export interface PatientStats  { total?: number; active?: number; discharged?: number; }
export interface LeadStats     { total?: number; converted?: number; conversionRate?: number; }
export interface FeeSummary    { totalRevenue?: number; totalDue?: number; totalPaid?: number; }
export interface AttendanceStats { present?: number; total?: number; }

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAdminPatients(search = '') {
  const [data, setData]         = useState<AdminPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    api.get<{ data?: AdminPatient[]; patients?: AdminPatient[] }>(`/admin/patients${qs}`)
      .then((res) => setData(res.data ?? res.patients ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [search]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, error, refetch };
}

export function useAdminLeads(statusFilter = '') {
  const [data, setData]         = useState<AdminLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    api.get<{ data?: AdminLead[]; leads?: AdminLead[] }>(`/admin/leads${qs}`)
      .then((res) => setData(res.data ?? res.leads ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, error, refetch };
}

export function useAdminStaff() {
  const [data, setData]         = useState<AdminStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    api.get<{ data?: AdminStaff[]; staff?: AdminStaff[] }>('/admin/staff')
      .then((res) => setData(res.data ?? res.staff ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, error, refetch };
}

export function useAdminFees() {
  const [data, setData]         = useState<AdminFee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    api.get<{ data?: AdminFee[]; fees?: AdminFee[] }>('/admin/fees')
      .then((res) => setData(res.data ?? res.fees ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, error, refetch };
}

export function useAdminAttendance(date = '') {
  const [data, setData]         = useState<AdminAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    const qs = date ? `?date=${date}` : '';
    api.get<{ data?: AdminAttendance[]; attendance?: AdminAttendance[] }>(`/admin/attendance${qs}`)
      .then((res) => setData(res.data ?? res.attendance ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [date]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, error, refetch };
}

export function useAdminBranches() {
  const [data, setData]         = useState<AdminBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    api.get<{ data?: AdminBranch[]; branches?: AdminBranch[] }>('/admin/branches')
      .then((res) => setData(res.data ?? res.branches ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, error, refetch };
}

export function useAdminPatientStats() {
  return useApiData<PatientStats>('/admin/patients/stats');
}

export function useAdminLeadStats() {
  return useApiData<LeadStats>('/admin/leads/stats');
}

export function useAdminFeeSummary() {
  return useApiData<FeeSummary>('/admin/fees/summary');
}

export function useAdminAttendanceStats() {
  return useApiData<AttendanceStats>('/admin/attendance/stats');
}
