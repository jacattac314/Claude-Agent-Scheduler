'use client';

import React, { useState } from 'react';
import { Agent, Schedule } from '../../../shared/types';
import ScheduleForm from './ScheduleForm';

interface AgentDetailProps {
  agent: Agent;
  schedules: Schedule[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AgentDetail: React.FC<AgentDetailProps> = ({ agent, schedules, onBack, onEdit, onDelete }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const handleRunNow = async () => {
    try {
      const response = await window.electronAPI.runNow(agent.id);
      if (response.success) {
        alert('Agent started successfully!');
      } else {
        alert(`Failed to start agent: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to run agent:', error);
      alert('Failed to start agent');
    }
  };

  const handleScheduleCreated = () => {
    setShowScheduleForm(false);
    // Refresh page or schedules
    window.location.reload();
  };

  if (showScheduleForm) {
    return <ScheduleForm agentId={agent.id} onClose={handleScheduleCreated} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="btn-ghost">
            ← Back
          </button>
          <div className="flex gap-3">
            <button onClick={handleRunNow} className="btn-primary">
              Run Now
            </button>
            <button onClick={() => setShowScheduleForm(true)} className="btn-secondary">
              New Schedule
            </button>
            <button onClick={onEdit} className="btn-secondary">
              Edit
            </button>
            <button onClick={onDelete} className="btn-danger">
              Delete
            </button>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">{agent.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{agent.description}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Prompt */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Prompt</h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
              {agent.prompt}
            </div>
          </div>

          {/* Schedules */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedules</h3>
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No schedules configured</p>
                <button onClick={() => setShowScheduleForm(true)} className="btn-secondary">
                  Create Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {schedule.recurrence_type === 'one_time' ? 'One time' :
                         schedule.recurrence_type === 'daily' ? 'Daily' :
                         schedule.recurrence_type === 'weekly' ? 'Weekly' :
                         'Monthly'}
                        {' at '}
                        {new Date(schedule.start_datetime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.timezone}
                        {schedule.run_window_minutes && ` • ${schedule.run_window_minutes} min window`}
                      </div>
                    </div>
                    <span className={schedule.enabled ? 'badge-success' : 'badge-gray'}>
                      {schedule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advanced settings */}
          <div className="card">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
              <span className="text-gray-400">{showAdvanced ? '▼' : '▶'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Command
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
                    {agent.command}
                  </div>
                </div>

                {agent.working_directory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Working Directory
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm">
                      {agent.working_directory}
                    </div>
                  </div>
                )}

                {agent.env_vars && Object.keys(agent.env_vars).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Environment Variables
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      {Object.entries(agent.env_vars).map(([key, value]) => (
                        <div key={key} className="font-mono text-sm">
                          <span className="text-gray-600">{key}:</span>{' '}
                          <span className="text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {agent.tags && agent.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {agent.tags.map((tag, i) => (
                        <span key={i} className="badge-info">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
