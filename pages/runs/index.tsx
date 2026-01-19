import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useRuns, useRunLogs } from '../../renderer/hooks/useRuns';
import { useAgents } from '../../renderer/hooks/useAgents';
import Card from '../../renderer/components/ui/Card';
import Button from '../../renderer/components/ui/Button';
import StatusPill from '../../renderer/components/ui/StatusPill';
import EmptyState from '../../renderer/components/ui/EmptyState';
import Drawer from '../../renderer/components/ui/Drawer';
import { Play, Clock, Bot, FileText, RefreshCw, Square, Terminal } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import type { Run } from '@shared/types';

export default function RunsPage() {
  const router = useRouter();
  const { id: queryRunId } = router.query;
  const { runs, loading, stopRun, refetch } = useRuns(100);
  const { agents } = useAgents();
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stdout' | 'stderr'>('stdout');

  const { logs, refetch: refetchLogs } = useRunLogs(selectedRun?.id);

  // Open drawer from URL query
  useEffect(() => {
    if (queryRunId && runs.length > 0) {
      const run = runs.find(r => r.id === queryRunId);
      if (run) {
        setSelectedRun(run);
        setDrawerOpen(true);
      }
    }
  }, [queryRunId, runs]);

  // Update selected run when runs update
  useEffect(() => {
    if (selectedRun) {
      const updated = runs.find(r => r.id === selectedRun.id);
      if (updated) {
        setSelectedRun(updated);
      }
    }
  }, [runs, selectedRun]);

  // Auto-refresh logs for running tasks
  useEffect(() => {
    if (selectedRun?.status === 'running') {
      const interval = setInterval(refetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedRun?.status, refetchLogs]);

  const handleSelectRun = (run: Run) => {
    setSelectedRun(run);
    setDrawerOpen(true);
    router.push(`/runs?id=${run.id}`, undefined, { shallow: true });
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    router.push('/runs', undefined, { shallow: true });
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Unknown Agent';
  };

  const handleStopRun = async () => {
    if (selectedRun) {
      await stopRun(selectedRun.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={Play}
        title="No runs yet"
        description="Runs will appear here when you execute agents."
        className="h-full"
      />
    );
  }

  // Group runs by date
  const groupedRuns = runs.reduce((acc, run) => {
    const date = format(new Date(run.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(run);
    return acc;
  }, {} as Record<string, Run[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Run History</h2>
        <Button variant="secondary" size="sm" onClick={refetch}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedRuns).map(([date, dateRuns]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h3>
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {dateRuns.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => handleSelectRun(run)}
                    className={clsx(
                      'w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left',
                      selectedRun?.id === run.id && 'bg-primary-50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <StatusPill status={run.status} />
                      <div>
                        <div className="font-medium text-gray-900">
                          {getAgentName(run.agent_id)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock size={12} />
                          {run.actual_start
                            ? format(new Date(run.actual_start), 'h:mm a')
                            : 'Queued'}
                          {run.actual_end && (
                            <span>
                              • Duration: {formatDistanceToNow(new Date(run.actual_start!), { includeSeconds: true }).replace('about ', '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <FileText size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Run Details Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title="Run Details"
        width="lg"
      >
        {selectedRun && (
          <div className="flex flex-col h-full">
            {/* Run Info */}
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} className="text-primary-500" />
                    <span className="font-medium text-gray-900">
                      {getAgentName(selectedRun.agent_id)}
                    </span>
                  </div>
                  <StatusPill status={selectedRun.status} />
                </div>
                {selectedRun.status === 'running' && (
                  <Button variant="danger" size="sm" onClick={handleStopRun}>
                    <Square size={14} />
                    Stop
                  </Button>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Planned Start</dt>
                  <dd className="text-gray-900">
                    {format(new Date(selectedRun.planned_start), 'PPpp')}
                  </dd>
                </div>
                {selectedRun.actual_start && (
                  <div>
                    <dt className="text-gray-500">Actual Start</dt>
                    <dd className="text-gray-900">
                      {format(new Date(selectedRun.actual_start), 'PPpp')}
                    </dd>
                  </div>
                )}
                {selectedRun.actual_end && (
                  <div>
                    <dt className="text-gray-500">Ended</dt>
                    <dd className="text-gray-900">
                      {format(new Date(selectedRun.actual_end), 'PPpp')}
                    </dd>
                  </div>
                )}
                {selectedRun.exit_code !== undefined && selectedRun.exit_code !== null && (
                  <div>
                    <dt className="text-gray-500">Exit Code</dt>
                    <dd className={clsx(
                      'font-mono',
                      selectedRun.exit_code === 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {selectedRun.exit_code}
                    </dd>
                  </div>
                )}
              </dl>

              {selectedRun.error_message && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <div className="text-sm font-medium text-red-800">Error</div>
                  <div className="text-sm text-red-700 mt-1">{selectedRun.error_message}</div>
                </div>
              )}
            </div>

            {/* Logs */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200 px-5">
                <button
                  onClick={() => setActiveTab('stdout')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'stdout'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Terminal size={14} className="inline mr-1.5" />
                  Output
                </button>
                <button
                  onClick={() => setActiveTab('stderr')}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'stderr'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Terminal size={14} className="inline mr-1.5" />
                  Errors
                </button>
              </div>

              {/* Log Content */}
              <div className="flex-1 overflow-auto p-4 bg-gray-900">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                  {activeTab === 'stdout'
                    ? logs.stdout || 'No output yet...'
                    : logs.stderr || 'No errors...'}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Link href={`/agents/${selectedRun.agent_id}`}>
                <Button variant="secondary" size="sm">
                  <Bot size={14} />
                  View Agent
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
