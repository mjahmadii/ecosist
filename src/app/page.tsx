'use client';
import { useAppStore } from '@/store/appStore';
import LoginPage from '@/components/auth/LoginPage';
import ApiKeyConfig from '@/components/auth/ApiKeyConfig';
import AppShell from '@/components/dashboard/AppShell';

export default function Home() {
  const { isAuthenticated, apiKeyConfigured } = useAppStore();

  if (!isAuthenticated) return <LoginPage />;
  if (!apiKeyConfigured) return <ApiKeyConfig />;
  return <AppShell />;
}
