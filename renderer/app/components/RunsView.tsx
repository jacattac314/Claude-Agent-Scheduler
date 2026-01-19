'use client';

import React, { useState, useEffect } from 'react';
import { Run, Agent, RunStatus } from '../../../shared/types';

const RunsView: React.FC = () => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [logs, setLogs] = useState<{ stdout: string; stderr: string } | null>(null);

  useEffect(() => {
    loadRuns();
    loadAgents();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadRuns();
      if (selectedRun) {
        loadLogs(selectedRun.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadRuns = async () => {
    try {
      const response = await window.electronAPI.getRuns(100);
      if (response.success && response.data) {
        setRuns(response.data);
      }
    } catch (error) {
      console.error('Failed to load runs:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await window.electronAPI.getAgents();
      if (response.success && response.data) {
        const agentsMap: Record<string, Agent> = {};
        response.data.forEach((agent: Agent) => {
          agentsMap[agent.id] = agent;
        });
        setAgents(agentsMap);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadLogs = async (runId: string) => {
    try {
      const response = await window.electronAPI.getRunLogs(runId);
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleSelectRun = async (run: Run) => {
    setSelectedRun(run);
    await loadLogs(run.id);
  };

  const handleStopRun = async (runId: string) => {
    try {
      const response = await window.electronAPI.stopRun(runId);
      if (response.success) {
        loadRuns();
        if (selectedRun?.id === runId) {
          setSelectedRun(null);
          setLogs(null);
        }
      } else {
        alert(`Failed to stop run: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to stop run:', error);
      alert('Failed to stop run');
    }
  };

  const getStatusBadge = (status: RunStatus) => {
    switch (status) {
      case 'succeeded':
        return <span className="badge-success">Succeeded</span>;
      case 'failed':
        return <span className="badge-error">Failed</span>;
      case 'running':
        return <span className="badge-info">Running</span>;
      case 'queued':
        return <span className="badge-gray">Queued</span>;
      case 'canceled':
        return <span className="badge-warning">Canceled</span>;
      case 'timed_out':
        return <span className="badge-warning">Timed Out</span>;
      default:
        return <span className="badge-gray">{status}</span>;
    }
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '—';
    if (!end) return 'Running...';

    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="h-full flex">
      {/* Runs list */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h2 className="text-2xl font-semibold text-gray-900">Runs</h2>
          <p className="text-sm text-gray-500 mt-1">View execution history and logs</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto">
          {runs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">▶️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No runs yet</h3>
              <p className="text-gray-500">Runs will appear here when agents execute</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {runs.map((run) => {
                const agent = agents[run.agent_id];
                return (
                  <div
                    key={run.id}
                    onClick={() => handleSelectRun(run)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedRun?.id === run.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900">
                        {agent?.name || 'Unknown Agent'}
                      </div>
                      {getStatusBadge(run.status)}
                    </div>

                    <div className="text-sm text-gray-500 space-y-1">
                      <div>
                        Started: {new Date(run.planned_start).toLocaleString()}
                      </div>
                      <div>
                        Duration: {formatDuration(run.actual_start, run.actual_end)}
                      </div>
                      {run.exit_code !== undefined && run.exit_code !== null && (
                        <div>Exit code: {run.exit_code}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Logs panel */}
      {selectedRun && (
        <div className="w-1/2 flex flex-col bg-gray-900 text-gray-100">
          {/* Header */}
          <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">
                  {agents[selectedRun.agent_id]?.name || 'Unknown Agent'}
                </h3>
                <p className="text-sm text-gray-400">
                  {new Date(selectedRun.planned_start).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {selectedRun.status === 'running' && (
                  <button
                    onClick={() => handleStopRun(selectedRun.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Stop
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedRun(null);
                    setLogs(null);
                  }}
                  className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700">
            <div className="flex px-6">
              <button className="px-4 py-2 border-b-2 border-primary-500 text-white">
                stdout
              </button>
            </div>
          </div>

          {/* Log content */}
          <div className="flex-1 overflow-auto p-6 font-mono text-sm">
            {logs ? (
              <div className="whitespace-pre-wrap">
                {logs.stdout || 'No output'}
                {logs.stderr && (
                  <div className="text-red-400 mt-4">
                    <div className="font-bold mb-2">STDERR:</div>
                    {logs.stderr}
                  </div>
                )}
                {selectedRun.error_message && (
                  <div className="text-red-400 mt-4">
                    <div className="font-bold mb-2">ERROR:</div>
                    {selectedRun.error_message}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Loading logs...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RunsView;
