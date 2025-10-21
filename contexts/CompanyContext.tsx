"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCompanies, useBranches, getSelectedCompany, getSelectedBranch, setSelectedCompany as saveCompany, setSelectedBranch as saveBranch, Company, Branch } from '@/lib/hooks/company';

interface CompanyContextType {
  selectedCompany: string | null;
  selectedBranch: string | null;
  setSelectedCompany: (companyId: string | null) => void;
  setSelectedBranch: (branchId: string | null) => void;
  companies: Company[];
  branches: Branch[];
  currentCompany: Company | null;
  currentBranch: Branch | null;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  selectedCompany: null,
  selectedBranch: null,
  setSelectedCompany: () => {},
  setSelectedBranch: () => {},
  companies: [],
  branches: [],
  currentCompany: null,
  currentBranch: null,
  isLoading: true,
});

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyContext must be used within CompanyProvider');
  }
  return context;
}

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [selectedCompany, setSelectedCompanyState] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranchState] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { companies, isLoading: companiesLoading } = useCompanies();
  const { branches, isLoading: branchesLoading } = useBranches(selectedCompany);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedCompany = getSelectedCompany();
    const savedBranch = getSelectedBranch();
    
    if (savedCompany) {
      setSelectedCompanyState(savedCompany);
    }
    if (savedBranch) {
      setSelectedBranchState(savedBranch);
    }
    
    setInitialized(true);
  }, []);

  // Auto-select first company if none selected
  useEffect(() => {
    if (initialized && !selectedCompany && companies.length > 0) {
      const firstCompany = companies[0];
      setSelectedCompanyState(firstCompany.id);
      saveCompany(firstCompany.id);
    }
  }, [initialized, selectedCompany, companies]);

  // Auto-select first branch if none selected
  useEffect(() => {
    if (initialized && selectedCompany && !selectedBranch && branches.length > 0) {
      const firstBranch = branches[0];
      setSelectedBranchState(firstBranch.id);
      saveBranch(firstBranch.id);
    }
  }, [initialized, selectedCompany, selectedBranch, branches]);

  const setSelectedCompany = (companyId: string | null) => {
    setSelectedCompanyState(companyId);
    saveCompany(companyId);
    // Reset branch when company changes
    setSelectedBranchState(null);
    saveBranch(null);
  };

  const setSelectedBranch = (branchId: string | null) => {
    setSelectedBranchState(branchId);
    saveBranch(branchId);
  };

  const currentCompany = companies.find(c => c.id === selectedCompany) || null;
  const currentBranch = branches.find(b => b.id === selectedBranch) || null;

  const value: CompanyContextType = {
    selectedCompany,
    selectedBranch,
    setSelectedCompany,
    setSelectedBranch,
    companies,
    branches,
    currentCompany,
    currentBranch,
    isLoading: companiesLoading || branchesLoading || !initialized,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}
