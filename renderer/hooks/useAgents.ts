import { useState, useEffect, useCallback } from 'react';
import type { Agent, AgentCreateInput, AgentUpdateInput } from '@shared/types';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.agents.list();
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = useCallback(async (input: AgentCreateInput): Promise<Agent> => {
    const agent = await window.electronAPI.agents.create(input);
    setAgents(prev => [agent, ...prev]);
    return agent;
  }, []);

  const updateAgent = useCallback(async (id: string, input: AgentUpdateInput): Promise<Agent> => {
    const agent = await window.electronAPI.agents.update(id, input);
    setAgents(prev => prev.map(a => a.id === id ? agent : a));
    return agent;
  }, []);

  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    await window.electronAPI.agents.delete(id);
    setAgents(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}

export function useAgent(id: string | undefined) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    if (!id || typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.agents.get(id);
      setAgent(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  return {
    agent,
    loading,
    error,
    refetch: fetchAgent,
  };
}
