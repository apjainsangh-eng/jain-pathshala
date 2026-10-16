'use client';

import dynamic from 'next/dynamic';

const SuperAdminApp = dynamic(() => import('@/components/superadmin/SuperAdminApp'), { ssr: false });

export default function SuperAdminPage() {
  return <SuperAdminApp />;
}
