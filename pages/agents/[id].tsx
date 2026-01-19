import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAgent, useAgents } from '../../renderer/hooks/useAgents';
import { useSchedulesForAgent } from '../../renderer/hooks/useSchedules';
import { useRunsForAgent, useRuns } from '../../renderer/hooks/useRuns';
import Card from '../../renderer/components/ui/Card';
import Button from '../../renderer/components/ui/Button';
import Input from '../../renderer/components/ui/Input';
import Textarea from '../../renderer/components/ui/Textarea';
import StatusPill from '../../renderer/components/ui/StatusPill';
import Toggle from '../../renderer/components/ui/Toggle';
import EmptyState from '../../renderer/components/ui/EmptyState';
import Modal from '../../renderer/components/ui/Modal';
import {
  Bot, Play, Save, Calendar, Clock, ChevronDown, ChevronUp,
  Trash2, Settings, Terminal, Plus, Pause, FileText
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import type { AgentUpdateInput, Schedule } from '@shared/types';

export default function AgentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { agent, loading, refetch } = useAgent(id as string);
  const { updateAgent, deleteAgent } = useAgents();
  const { schedules, refetch: refetchSchedules } = useSchedulesForAgent(id as string);
  const { runs } = useRunsForAgent(id as string);
  const { runNow, stopRun } = useRuns();

  const [editing, setEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<AgentUpdateInput>({});
  const [saving, setSaving] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteScheduleModal, setDeleteScheduleModal] = useState<Schedule | null>(null);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        prompt: agent.prompt,
        command: agent.command,
        working_directory: agent.working_directory,
        env_vars: agent.env_vars,
        tags: agent.tags,
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await updateAgent(agent.id, formData);
      setEditing(false);
      await refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    if (!agent) return;
    setRunningNow(true);
    try {
      await runNow(agent.id);
    } finally {
      setRunningNow(false);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    await deleteAgent(agent.id);
    router.push('/agents');
  };

  const handleToggleSchedule = async (schedule: Schedule) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.schedules.toggle(schedule.id, !schedule.enabled);
      await refetchSchedules();
    }
  };

  const handleDeleteSchedule = async () => {
    if (deleteScheduleModal && typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.schedules.delete(deleteScheduleModal.id);
      setDeleteScheduleModal(null);
      await refetchSchedules();
    }
  };

  const currentRun = runs.find(r => r.status === 'running');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!agent) {
    return (
      <EmptyState
        icon={Bot}
        title="Agent not found"
        description="This agent may have been deleted."
        action={
          <Link href="/agents">
            <Button variant="secondary">Back to Agents</Button>
          </Link>
        }
        className="h-full"
      />
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
            <Bot size={28} className="text-primary-600" />
          </div>
          <div>
            {editing ? (
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="font-semibold text-xl mb-1"
              />
            ) : (
              <h1 className="text-xl font-semibold text-gray-900">{agent.name}</h1>
            )}
            {editing ? (
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description"
                className="text-sm"
              />
            ) : (
              <p className="text-sm text-gray-500">{agent.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              {currentRun ? (
                <Button variant="danger" onClick={() => stopRun(currentRun.id)}>
                  <Pause size={16} />
                  Stop Run
                </Button>
              ) : (
                <Button onClick={handleRunNow} disabled={runningNow}>
                  <Play size={16} />
                  {runningNow ? 'Starting...' : 'Run Now'}
                </Button>
              )}
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Prompt */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-gray-900">Prompt</h2>
          <Terminal size={16} className="text-gray-400" />
        </div>
        {editing ? (
          <Textarea
            value={formData.prompt || ''}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            monospace
            rows={8}
            placeholder="Enter the prompt for the AI agent..."
          />
        ) : (
          <pre className="text-sm text-gray-700 font-mono bg-gray-50 rounded-lg p-4 whitespace-pre-wrap overflow-auto max-h-64">
            {agent.prompt}
          </pre>
        )}
      </Card>

      {/* Advanced Settings */}
      <Card>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-gray-400" />
            <span className="font-medium text-gray-900">Advanced Settings</span>
          </div>
          {showAdvanced ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Command
              </label>
              {editing ? (
                <Input
                  value={formData.command || ''}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  placeholder="claude"
                  hint="The command to execute. Default: claude"
                />
              ) : (
                <code className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {agent.command}
                </code>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Working Directory
              </label>
              {editing ? (
                <Input
                  value={formData.working_directory || ''}
                  onChange={(e) => setFormData({ ...formData, working_directory: e.target.value })}
                  placeholder="/path/to/directory"
                />
              ) : (
                <span className="text-sm text-gray-500">
                  {agent.working_directory || 'Not set'}
                </span>
              )}
            </div>

            {!editing && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteModal(true)}
                >
                  <Trash2 size={14} />
                  Delete Agent
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Schedules */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="font-medium text-gray-900">Schedules</span>
          </div>
          <Link href={`/schedules/new?agentId=${agent.id}`}>
            <Button size="sm" variant="secondary">
              <Plus size={14} />
              Add Schedule
            </Button>
          </Link>
        </div>

        {schedules.length === 0 ? (
          <p className="text-sm text-gray-500">No schedules configured.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg border',
                  schedule.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'font-medium',
                      schedule.enabled ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {schedule.name}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">
                      {schedule.recurrence_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {format(new Date(schedule.start_datetime), 'h:mm a')} • {schedule.timezone}
                    {schedule.run_window_minutes && ` • ${schedule.run_window_minutes} min window`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={schedule.enabled}
                    onChange={() => handleToggleSchedule(schedule)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteScheduleModal(schedule)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Runs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="font-medium text-gray-900">Recent Runs</span>
          </div>
          <Link href="/runs">
            <Button size="sm" variant="ghost">
              View All
            </Button>
          </Link>
        </div>

        {runs.length === 0 ? (
          <p className="text-sm text-gray-500">No runs yet.</p>
        ) : (
          <div className="space-y-2">
            {runs.slice(0, 5).map((run) => (
              <Link
                key={run.id}
                href={`/runs?id=${run.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusPill status={run.status} size="sm" />
                  <span className="text-sm text-gray-600">
                    {run.actual_start
                      ? formatDistanceToNow(new Date(run.actual_start), { addSuffix: true })
                      : 'Queued'}
                  </span>
                </div>
                <FileText size={14} className="text-gray-400" />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Agent Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Agent"
        size="sm"
      >
        <div className="p-5">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{agent.name}</strong>? This will also delete all schedules and run history.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Schedule Modal */}
      <Modal
        isOpen={!!deleteScheduleModal}
        onClose={() => setDeleteScheduleModal(null)}
        title="Delete Schedule"
        size="sm"
      >
        <div className="p-5">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{deleteScheduleModal?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteScheduleModal(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSchedule}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
