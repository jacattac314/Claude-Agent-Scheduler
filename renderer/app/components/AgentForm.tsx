'use client';

import React, { useState } from 'react';
import { Agent, CreateAgentInput } from '../../../shared/types';

interface AgentFormProps {
  agent?: Agent | null;
  onClose: () => void;
}

const AgentForm: React.FC<AgentFormProps> = ({ agent, onClose }) => {
  const [formData, setFormData] = useState<CreateAgentInput>({
    name: agent?.name || '',
    description: agent?.description || '',
    prompt: agent?.prompt || '',
    command: agent?.command || 'claude',
    working_directory: agent?.working_directory || '',
    env_vars: agent?.env_vars || {},
    tags: agent?.tags || [],
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = agent
        ? await window.electronAPI.updateAgent({ id: agent.id, ...formData })
        : await window.electronAPI.createAgent(formData);

      if (response.success) {
        onClose();
      } else {
        alert(`Failed to save agent: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
      alert('Failed to save agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {agent ? 'Edit Agent' : 'New Agent'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {agent ? 'Update agent configuration' : 'Create a new AI agent'}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-8 overflow-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Night Shift Job Hunter"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              id="description"
              type="text"
              required
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this agent does"
            />
          </div>

          {/* Prompt */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
            </label>
            <textarea
              id="prompt"
              required
              rows={8}
              className="textarea"
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              placeholder="Detailed instructions for the AI agent..."
            />
          </div>

          {/* Advanced settings */}
          <div className="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 pl-6">
                {/* Command */}
                <div>
                  <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-2">
                    Command
                  </label>
                  <input
                    id="command"
                    type="text"
                    className="input"
                    value={formData.command}
                    onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                    placeholder="claude"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The command to run. Use {'{prompt}'} to insert the prompt text.
                  </p>
                </div>

                {/* Working Directory */}
                <div>
                  <label htmlFor="working_directory" className="block text-sm font-medium text-gray-700 mb-2">
                    Working Directory
                  </label>
                  <input
                    id="working_directory"
                    type="text"
                    className="input"
                    value={formData.working_directory}
                    onChange={(e) => setFormData({ ...formData, working_directory: e.target.value })}
                    placeholder="/path/to/directory"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    id="tags"
                    type="text"
                    className="input"
                    value={formData.tags?.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="automation, jobs, daily"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentForm;
