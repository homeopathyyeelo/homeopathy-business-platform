'use client';

import DynamicLayout from './DynamicLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ProductionERPLayout({ children }: LayoutProps) {
  return (
    <DynamicLayout>
      {children}
    </DynamicLayout>
  );
}
