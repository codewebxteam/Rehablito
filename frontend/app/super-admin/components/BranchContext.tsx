"use client";

import React, { createContext, useContext, useState } from 'react';

interface BranchContextValue {
  selectedBranchId: string | null;   // null = All Branches
  selectedBranchName: string;
  setBranch: (id: string | null, name: string) => void;
}

const BranchContext = createContext<BranchContextValue>({
  selectedBranchId: null,
  selectedBranchName: 'All Branches',
  setBranch: () => {},
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState('All Branches');

  const setBranch = (id: string | null, name: string) => {
    setSelectedBranchId(id);
    setSelectedBranchName(name);
  };

  return (
    <BranchContext.Provider value={{ selectedBranchId, selectedBranchName, setBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);
