import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claude Agent Scheduler',
  description: 'Schedule and manage your AI agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
