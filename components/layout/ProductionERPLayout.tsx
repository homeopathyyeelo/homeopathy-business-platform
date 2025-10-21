'use client';

import DynamicLayout from './DynamicLayout';

export default function ProductionERPLayout({ children }: { children: React.ReactNode }) {
  return <DynamicLayout>{children}</DynamicLayout>;
}
