import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Calendar, Bot, Play, Settings, Plus, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/', label: 'Calendar', icon: Calendar },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/runs', label: 'Runs', icon: Play },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [pageTitle, setPageTitle] = useState('Calendar');

  useEffect(() => {
    // Listen for navigation events from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      const unsubscribe = window.electronAPI.on.navigate((path: string) => {
        router.push(path);
      });
      return unsubscribe;
    }
  }, [router]);

  useEffect(() => {
    const currentNav = navItems.find(item => item.href === router.pathname);
    if (currentNav) {
      setPageTitle(currentNav.label);
    } else if (router.pathname.startsWith('/agents/')) {
      setPageTitle('Agent Details');
    } else if (router.pathname.startsWith('/schedules/')) {
      setPageTitle('Schedule');
    }
  }, [router.pathname]);

  const getActionButton = () => {
    if (router.pathname === '/agents' || router.pathname === '/') {
      return (
        <Link
          href="/agents/new"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors no-drag"
        >
          <Plus size={16} />
          New Agent
        </Link>
      );
    }
    if (router.pathname.startsWith('/agents/') && router.pathname !== '/agents/new') {
      return (
        <Link
          href={`/schedules/new?agentId=${router.query.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors no-drag"
        >
          <Plus size={16} />
          New Schedule
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-100/80 border-r border-gray-200 flex flex-col">
        {/* Drag region for title bar */}
        <div className="h-12 drag-region flex items-center px-4">
          <div className="w-16" /> {/* Space for traffic lights */}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = router.pathname === href ||
                (href !== '/' && router.pathname.startsWith(href));

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white shadow-apple-sm text-gray-900'
                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                    )}
                  >
                    <Icon size={18} className={isActive ? 'text-primary-500' : 'text-gray-400'} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            Claude Agent Scheduler
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 drag-region">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-gray-900">{pageTitle}</h1>
            {router.pathname.startsWith('/agents/') && router.pathname !== '/agents/new' && (
              <>
                <ChevronRight size={14} className="text-gray-400" />
                <span className="text-sm text-gray-500">Details</span>
              </>
            )}
          </div>
          <div className="no-drag">
            {getActionButton()}
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
