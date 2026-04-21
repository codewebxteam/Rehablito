"use client";

import React, { createContext, useCallback, useContext, useState } from 'react';

export interface NewTransaction {
  _id: string;
  amount: number;
  paymentDate: string;
  method: 'cash' | 'upi' | 'bank_transfer' | 'card';
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  description?: string;
  receiptNumber?: string;
  patientId?: { _id: string; name: string } | null;
  branchId?: { _id: string; name: string } | null;
}

export interface AddTransactionInitPayload {
  patientId?: string;
  branchId?: string;
}

interface AddTransactionCtx {
  isOpen: boolean;
  initialPayload: AddTransactionInitPayload | null;
  openModal: (payload?: AddTransactionInitPayload) => void;
  closeModal: () => void;
  /** Called by FinanceView to receive newly saved transactions */
  onSaved: (tx: NewTransaction) => void;
  /** FinanceView registers its handler here */
  registerSavedHandler: (handler: (tx: NewTransaction) => void) => void;
  /** Live Feed items (dashboard uses this) */
  liveFeedItems: LiveFeedItem[];
  pushLiveFeedItem: (item: LiveFeedItem) => void;
}

export interface LiveFeedItem {
  id: string;
  icon: 'payment' | 'patient' | 'inquiry';
  label: string;
  sub: string;
  time: string; // ISO
}

const ctx = createContext<AddTransactionCtx | null>(null);

export function AddTransactionProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialPayload, setInitialPayload] = useState<AddTransactionInitPayload | null>(null);
  const [savedHandler, setSavedHandler] = useState<((tx: NewTransaction) => void) | null>(null);
  const [liveFeedItems, setLiveFeedItems] = useState<LiveFeedItem[]>([]);

  const openModal = useCallback((payload?: AddTransactionInitPayload) => {
    if (payload) setInitialPayload(payload);
    setIsOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setInitialPayload(null), 300);
  }, []);

  const onSaved = useCallback((tx: NewTransaction) => {
    if (savedHandler) savedHandler(tx);
  }, [savedHandler]);

  const registerSavedHandler = useCallback((handler: (tx: NewTransaction) => void) => {
    setSavedHandler(() => handler);
  }, []);

  const pushLiveFeedItem = useCallback((item: LiveFeedItem) => {
    setLiveFeedItems(prev => [item, ...prev].slice(0, 20));
  }, []);

  return (
    <ctx.Provider value={{ isOpen, initialPayload, openModal, closeModal, onSaved, registerSavedHandler, liveFeedItems, pushLiveFeedItem }}>
      {children}
    </ctx.Provider>
  );
}

export function useAddTransaction() {
  const value = useContext(ctx);
  if (!value) throw new Error('useAddTransaction must be used inside AddTransactionProvider');
  return value;
}
