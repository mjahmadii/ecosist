import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'دستیار هوشمند حاکمیت شرکتی | گروه سرمایه‌گذاری بانک سپه',
  description: 'پلتفرم مدیریت حاکمیت شرکتی و تحلیل مالی هوشمند برای مدیران ارشد',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏦</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
