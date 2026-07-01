'use client';
import { useAppStore } from '@/store/appStore';
import LoginPage from '@/components/auth/LoginPage';
import ApiKeyConfig from '@/components/auth/ApiKeyConfig';
import AppShell from '@/components/dashboard/AppShell';
import ThemeProvider from '@/components/ui/ThemeProvider';

export default function Home() {
  const { isAuthenticated, apiKeyConfigured } = useAppStore();

  return (
    <ThemeProvider>
      {!isAuthenticated ? <LoginPage /> : !apiKeyConfigured ? <ApiKeyConfig /> : <AppShell />}
    </ThemeProvider>
  );
}
