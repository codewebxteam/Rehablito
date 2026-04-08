"use client";
/**
 * Rehablito RMS — Manager Data Hooks
 * All hooks fetch from /api/manager/* — scoped to the authenticated manager's branch.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ManagerPatient {
  _id: string;
  name: string;
  age?: number;
  diagnosis?: string;
  condition?: string;
  phone?: string;
  address?: string;
  status?: string;
  branchId?: string;
  createdAt: string;
}

export interface ManagerLead {
  _id: string;
  name: string;
  phone: string;
  source?: string;
  status: string;
  notes?: { text: string; createdAt: string }[];
  branchId?: string;
  createdAt: string;
}

export interface ManagerStaff {
  _id: string;
  name: string;
  email: string;
  role: string;
  staffId?: string;
  branchId?: string;
  mobileNumber?: string;
}

export interface ManagerAttendance {
  _id: string;
  staffId?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface ManagerBilling {
  _id: string;
  patientId?: string;
  patientName?: string;
  amount: number;
  dueAmount?: number;
  type?: string;
  notes?: string;
  createdAt: string;
}

export interface BillingSummary {
  totalRevenue?: number;
  totalPaid?: number;
  totalDue?: number;
  totalPayments?: number;
}

export interface PatientStats { total?: number; active?: number; }
export interface LeadStats    { total?: number; converted?: number; conversionRate?: number; }
export interface AttendanceStats { present?: number; absent?: number; total?: number; }

// ─── Generic hook ─────────────────────────────────────────────────────────────

function useList<T>(endpoint: string, listKey?: string) {
  const [data, setData]           = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    api.get<Record<string, T[]>>(endpoint)
      .then((res) => {
        if (listKey && res[listKey]) {
          setData(res[listKey]);
        } else {
          // Try common keys
          const d = (res as Record<string, T[]>);
          const found = d.data ?? d.patients ?? d.leads ?? d.staff ?? d.payments ?? d.attendance ?? [];
          setData(found);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [endpoint, listKey]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, isLoading, error, refetch };
}

function useStat<T>(endpoint: string) {
  const [data, setData]           = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    api.get<T>(endpoint)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [endpoint]);

  return { data, isLoading, error };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useManagerPatients() {
  return useList<ManagerPatient>('/manager/patients');
}

export function useManagerLeads() {
  return useList<ManagerLead>('/manager/leads');
}

export function useManagerStaff() {
  return useList<ManagerStaff>('/manager/staff');
}

export function useManagerBilling() {
  return useList<ManagerBilling>('/manager/billing', 'payments');
}

export function useManagerAttendance(date?: string) {
  const endpoint = date ? `/manager/attendance?date=${date}` : '/manager/attendance';
  return useList<ManagerAttendance>(endpoint, 'attendance');
}

export function useManagerPatientStats() {
  return useStat<PatientStats>('/manager/patients/stats');
}

export function useManagerLeadStats() {
  return useStat<LeadStats>('/manager/leads/stats');
}

export function useManagerBillingSummary() {
  return useStat<BillingSummary>('/manager/billing/summary');
}

export function useManagerAttendanceStats() {
  return useStat<AttendanceStats>('/manager/attendance/stats');
}
