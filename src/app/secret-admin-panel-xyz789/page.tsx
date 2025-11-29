import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  redirect('/secret-admin-panel-xyz789/dashboard');
}