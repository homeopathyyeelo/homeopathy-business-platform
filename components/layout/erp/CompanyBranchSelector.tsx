"use client";

import { Building2, Store, ChevronDown } from 'lucide-react';
import { useCompanyContext } from '@/contexts/CompanyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CompanyBranchSelector() {
  const {
    selectedCompany,
    selectedBranch,
    setSelectedCompany,
    setSelectedBranch,
    companies,
    branches,
    currentCompany,
    currentBranch,
    isLoading,
  } = useCompanyContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-40 bg-gray-200 animate-pulse rounded-lg"></div>
        <div className="h-9 w-40 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Company Selector */}
      {companies.length > 1 && (
        <Select value={selectedCompany || undefined} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-[180px] h-9">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Select Company">
                {currentCompany?.name || 'Select Company'}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{company.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Branch Selector */}
      {branches.length > 0 && (
        <Select value={selectedBranch || undefined} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-[180px] h-9">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-gray-500" />
              <SelectValue placeholder="Select Branch">
                {currentBranch?.name || 'Select Branch'}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span>{branch.name}</span>
                  {branch.code && (
                    <span className="text-xs text-gray-500">({branch.code})</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Display current selection for single company/branch */}
      {companies.length === 1 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
          <Building2 className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">{currentCompany?.name}</span>
        </div>
      )}

      {branches.length === 1 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
          <Store className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">{currentBranch?.name}</span>
        </div>
      )}
    </div>
  );
}
