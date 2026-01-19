'use client';

import React, { useState, useEffect } from 'react';
import { Agent, Schedule } from '../../../shared/types';
import AgentDetail from './AgentDetail';
import AgentForm from './AgentForm';

const AgentsView: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    loadAgents();
    loadSchedules();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await window.electronAPI.getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await window.electronAPI.getSchedules();
      if (response.success && response.data) {
        setSchedules(response.data);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setShowForm(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAgent(null);
    loadAgents();
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This will also delete all associated schedules.')) {
      return;
    }

    try {
      const response = await window.electronAPI.deleteAgent(agentId);
      if (response.success) {
        loadAgents();
        if (selectedAgent?.id === agentId) {
          setSelectedAgent(null);
        }
      } else {
        alert(`Failed to delete agent: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
      alert('Failed to delete agent');
    }
  };

  const getAgentSchedules = (agentId: string) => {
    return schedules.filter(s => s.agent_id === agentId);
  };

  if (selectedAgent) {
    return (
      <AgentDetail
        agent={selectedAgent}
        schedules={getAgentSchedules(selectedAgent.id)}
        onBack={() => setSelectedAgent(null)}
        onEdit={() => handleEditAgent(selectedAgent)}
        onDelete={() => handleDeleteAgent(selectedAgent.id)}
      />
    );
  }

  if (showForm) {
    return <AgentForm agent={editingAgent} onClose={handleFormClose} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Agents</h2>
            <p className="text-sm text-gray-500 mt-1">Create and manage your AI agents</p>
          </div>
          <button onClick={handleCreateAgent} className="btn-primary">
            New Agent
          </button>
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 p-8 overflow-auto">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No agents yet</h3>
            <p className="text-gray-500 mb-6">Create your first agent to get started</p>
            <button onClick={handleCreateAgent} className="btn-primary">
              Create Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const agentSchedules = getAgentSchedules(agent.id);
              const enabledSchedules = agentSchedules.filter(s => s.enabled);

              return (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className="card cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {enabledSchedules.length > 0
                        ? `${enabledSchedules.length} active schedule${enabledSchedules.length !== 1 ? 's' : ''}`
                        : 'No schedules'}
                    </span>
                    {agent.tags && agent.tags.length > 0 && (
                      <div className="flex gap-1">
                        {agent.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="badge-gray">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsView;
