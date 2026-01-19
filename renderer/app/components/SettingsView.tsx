'use client';

import React from 'react';

const SettingsView: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your scheduler</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform</span>
                <span className="text-gray-900">Electron + Next.js</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage</h3>
            <p className="text-sm text-gray-600 mb-4">
              All your data is stored locally on your machine. Your agents, schedules, and run history are saved in a SQLite database.
            </p>
            <p className="text-xs text-gray-500">
              Database location: ~/Library/Application Support/claude-agent-scheduler/ (macOS)
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Learn more about creating agents, setting up schedules, and managing runs.
            </p>
            <a
              href="https://github.com/anthropics/claude-agent-scheduler"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Documentation →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
