import { useState } from 'react';
import Link from 'next/link';
import { useAgents } from '../../renderer/hooks/useAgents';
import { useNextRuns } from '../../renderer/hooks/useSchedules';
import { useRuns } from '../../renderer/hooks/useRuns';
import Card from '../../renderer/components/ui/Card';
import Button from '../../renderer/components/ui/Button';
import StatusPill from '../../renderer/components/ui/StatusPill';
import EmptyState from '../../renderer/components/ui/EmptyState';
import Modal from '../../renderer/components/ui/Modal';
import { Bot, Plus, Clock, Play, MoreHorizontal, Trash2, Edit, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Agent } from '@shared/types';

export default function AgentsPage() {
  const { agents, loading, deleteAgent } = useAgents();
  const { nextRuns } = useNextRuns(100);
  const { runs, runNow } = useRuns(50);
  const [deleteModal, setDeleteModal] = useState<Agent | null>(null);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  const getNextRunForAgent = (agentId: string) => {
    return nextRuns.find(r => r.agentId === agentId);
  };

  const getLastRunForAgent = (agentId: string) => {
    return runs.find(r => r.agent_id === agentId);
  };

  const handleRunNow = async (agentId: string) => {
    setRunningAgent(agentId);
    try {
      await runNow(agentId);
    } finally {
      setRunningAgent(null);
    }
  };

  const handleDelete = async () => {
    if (deleteModal) {
      await deleteAgent(deleteModal.id);
      setDeleteModal(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title="No agents yet"
        description="Create your first AI agent to automate tasks."
        action={
          <Link href="/agents/new">
            <Button>
              <Plus size={16} />
              Create Agent
            </Button>
          </Link>
        }
        className="h-full"
      />
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const nextRun = getNextRunForAgent(agent.id);
          const lastRun = getLastRunForAgent(agent.id);

          return (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card interactive className="h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Bot size={20} className="text-primary-600" />
                  </div>
                  <div className="flex items-center gap-1">
                    {lastRun && (
                      <StatusPill status={lastRun.status} size="sm" />
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{agent.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{agent.description}</p>

                <div className="space-y-2 text-sm">
                  {nextRun && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      <span>
                        Next: {formatDistanceToNow(new Date(nextRun.nextRun), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                  {lastRun && lastRun.actual_start && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={14} className="text-gray-400" />
                      <span>
                        Last: {formatDistanceToNow(new Date(lastRun.actual_start), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRunNow(agent.id);
                    }}
                    disabled={runningAgent === agent.id}
                  >
                    <Play size={14} />
                    {runningAgent === agent.id ? 'Starting...' : 'Run Now'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteModal(agent);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Agent"
        size="sm"
      >
        <div className="p-5">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This will also delete all associated schedules and run history.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
