'use client';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full border transition-all duration-300 flex items-center px-0.5"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(61,82,255,0.2), rgba(0,212,255,0.1))'
          : 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.1))',
        borderColor: isDark ? 'rgba(61,82,255,0.3)' : 'rgba(251,191,36,0.35)',
      }}
      title={isDark ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
      aria-label="تغییر تم"
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-300"
        style={{
          transform: isDark ? 'translateX(0)' : 'translateX(28px)',
          background: isDark
            ? 'linear-gradient(135deg, #3d52ff, #00d4ff)'
            : 'linear-gradient(135deg, #fbbf24, #f97316)',
        }}
      >
        {isDark
          ? <Moon className="w-3.5 h-3.5 text-white" />
          : <Sun className="w-3.5 h-3.5 text-white" />
        }
      </span>
    </button>
  );
}
