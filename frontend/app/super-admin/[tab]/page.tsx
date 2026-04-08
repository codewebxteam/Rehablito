import { notFound } from 'next/navigation';

import { isSuperAdminTab } from '../lib/navigation';
import SuperAdminTabContent from '../components/SuperAdminTabContent';

interface SuperAdminTabPageProps {
  params: Promise<{ tab: string }>;
}

export default async function SuperAdminTabPage({ params }: SuperAdminTabPageProps) {
  const { tab } = await params;

  if (!isSuperAdminTab(tab)) {
    notFound();
  }

  return <SuperAdminTabContent tab={tab} />;
}
