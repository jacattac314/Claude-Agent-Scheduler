import React from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: 'calendar' | 'agents' | 'runs' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'runs', label: 'Runs', icon: '▶️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="w-[var(--sidebar-width)] bg-white border-r border-gray-200 flex flex-col">
      {/* App title */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Claude Scheduler</h1>
        <p className="text-xs text-gray-500 mt-1">AI Agent Automation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id as any)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${
                    currentView === item.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
