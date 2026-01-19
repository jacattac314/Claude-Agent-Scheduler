import { useState, useEffect, useCallback } from 'react';
import type { Schedule, ScheduleCreateInput, ScheduleUpdateInput, ScheduledRunInfo } from '@shared/types';

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.schedules.list();
      setSchedules(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();

    // Subscribe to schedule updates
    if (typeof window !== 'undefined' && window.electronAPI) {
      const unsubscribe = window.electronAPI.on.scheduleUpdate((schedule) => {
        setSchedules(prev => {
          const index = prev.findIndex(s => s.id === schedule.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = schedule;
            return updated;
          }
          return prev;
        });
      });
      return unsubscribe;
    }
  }, [fetchSchedules]);

  const createSchedule = useCallback(async (input: ScheduleCreateInput): Promise<Schedule> => {
    const schedule = await window.electronAPI.schedules.create(input);
    setSchedules(prev => [schedule, ...prev]);
    return schedule;
  }, []);

  const updateSchedule = useCallback(async (id: string, input: ScheduleUpdateInput): Promise<Schedule> => {
    const schedule = await window.electronAPI.schedules.update(id, input);
    setSchedules(prev => prev.map(s => s.id === id ? schedule : s));
    return schedule;
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<void> => {
    await window.electronAPI.schedules.delete(id);
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleSchedule = useCallback(async (id: string, enabled: boolean): Promise<Schedule> => {
    const schedule = await window.electronAPI.schedules.toggle(id, enabled);
    setSchedules(prev => prev.map(s => s.id === id ? schedule : s));
    return schedule;
  }, []);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
  };
}

export function useSchedulesForAgent(agentId: string | undefined) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!agentId || typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.schedules.listForAgent(agentId);
      setSchedules(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
  };
}

export function useNextRuns(limit: number = 10) {
  const [nextRuns, setNextRuns] = useState<ScheduledRunInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNextRuns = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await window.electronAPI.schedules.getNextRuns(limit);
      setNextRuns(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch next runs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNextRuns();

    // Refresh every minute
    const interval = setInterval(fetchNextRuns, 60000);
    return () => clearInterval(interval);
  }, [fetchNextRuns]);

  return {
    nextRuns,
    loading,
    error,
    refetch: fetchNextRuns,
  };
}
