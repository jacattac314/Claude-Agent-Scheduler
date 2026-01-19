'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import AgentsView from './components/AgentsView';
import RunsView from './components/RunsView';
import ChartsView from './components/ChartsView';
import SettingsView from './components/SettingsView';

type View = 'calendar' | 'agents' | 'runs' | 'charts' | 'settings';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('calendar');

  const renderView = () => {
    switch (currentView) {
      case 'calendar':
        return <CalendarView />;
      case 'agents':
        return <AgentsView />;
      case 'runs':
        return <RunsView />;
      case 'charts':
        return <ChartsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}
