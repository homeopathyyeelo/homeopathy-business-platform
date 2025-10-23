'use client';

import { usePathname } from 'next/navigation';
import MainERPLayout from './MainERPLayout';

interface DynamicLayoutProps {
  children: React.ReactNode;
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  return <MainERPLayout>{children}</MainERPLayout>;
}
