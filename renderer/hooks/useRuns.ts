import { useState, useEffect, useCallback } from 'react';
import type { Run } from '@shared/types';

export function useRuns(limit: number = 50) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.runs.list(limit);
      setRuns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch runs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRuns();

    // Subscribe to run updates
    if (typeof window !== 'undefined' && window.electronAPI) {
      const unsubscribe = window.electronAPI.on.runUpdate((run) => {
        setRuns(prev => {
          const index = prev.findIndex(r => r.id === run.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = run;
            return updated;
          }
          // New run, add to beginning
          return [run, ...prev].slice(0, limit);
        });
      });
      return unsubscribe;
    }
  }, [fetchRuns, limit]);

  const runNow = useCallback(async (agentId: string): Promise<Run> => {
    const run = await window.electronAPI.runs.runNow(agentId);
    return run;
  }, []);

  const stopRun = useCallback(async (runId: string): Promise<boolean> => {
    return window.electronAPI.runs.stop(runId);
  }, []);

  return {
    runs,
    loading,
    error,
    refetch: fetchRuns,
    runNow,
    stopRun,
  };
}

export function useRunsForAgent(agentId: string | undefined, limit: number = 20) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!agentId || typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.runs.listForAgent(agentId, limit);
      setRuns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch runs');
    } finally {
      setLoading(false);
    }
  }, [agentId, limit]);

  useEffect(() => {
    fetchRuns();

    // Subscribe to run updates for this agent
    if (typeof window !== 'undefined' && window.electronAPI && agentId) {
      const unsubscribe = window.electronAPI.on.runUpdate((run) => {
        if (run.agent_id === agentId) {
          setRuns(prev => {
            const index = prev.findIndex(r => r.id === run.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = run;
              return updated;
            }
            return [run, ...prev].slice(0, limit);
          });
        }
      });
      return unsubscribe;
    }
  }, [fetchRuns, agentId, limit]);

  return {
    runs,
    loading,
    error,
    refetch: fetchRuns,
  };
}

export function useRunLogs(runId: string | undefined) {
  const [logs, setLogs] = useState<{ stdout: string; stderr: string }>({ stdout: '', stderr: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!runId || typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.runs.getLogs(runId);
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
  };
}
