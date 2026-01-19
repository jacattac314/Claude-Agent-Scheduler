import { useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useNextRuns } from '../renderer/hooks/useSchedules';
import { useRuns } from '../renderer/hooks/useRuns';
import { useAgents } from '../renderer/hooks/useAgents';
import Drawer from '../renderer/components/ui/Drawer';
import Button from '../renderer/components/ui/Button';
import StatusPill from '../renderer/components/ui/StatusPill';
import EmptyState from '../renderer/components/ui/EmptyState';
import { Calendar as CalendarIcon, Play, Pause, Clock, Bot } from 'lucide-react';
import type { CalendarEvent, ScheduledRunInfo, Run } from '@shared/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarPage() {
  const { nextRuns, loading: loadingNextRuns } = useNextRuns(100);
  const { runs, loading: loadingRuns, runNow, stopRun } = useRuns(50);
  const { agents } = useAgents();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Convert schedules and runs to calendar events
  const events = useMemo((): CalendarEvent[] => {
    const calendarEvents: CalendarEvent[] = [];

    // Add scheduled runs
    nextRuns.forEach((scheduled: ScheduledRunInfo) => {
      const start = new Date(scheduled.nextRun);
      const end = scheduled.runWindowMinutes
        ? addMinutes(start, scheduled.runWindowMinutes)
        : addMinutes(start, 30); // Default 30 min display

      calendarEvents.push({
        id: `schedule-${scheduled.scheduleId}`,
        title: scheduled.agentName,
        start,
        end,
        resource: {
          agentId: scheduled.agentId,
          scheduleId: scheduled.scheduleId,
          type: 'scheduled',
        },
      });
    });

    // Add recent/current runs
    runs.forEach((run: Run) => {
      if (run.status === 'running' || run.status === 'queued') {
        const start = run.actual_start ? new Date(run.actual_start) : new Date(run.planned_start);
        const end = addMinutes(start, 30);
        const agent = agents.find(a => a.id === run.agent_id);

        calendarEvents.push({
          id: `run-${run.id}`,
          title: agent?.name || 'Unknown Agent',
          start,
          end,
          resource: {
            agentId: run.agent_id,
            runId: run.id,
            status: run.status,
            type: 'run',
          },
        });
      }
    });

    return calendarEvents;
  }, [nextRuns, runs, agents]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  }, []);

  const handleRunNow = useCallback(async () => {
    if (selectedEvent?.resource.agentId) {
      await runNow(selectedEvent.resource.agentId);
      setDrawerOpen(false);
    }
  }, [selectedEvent, runNow]);

  const handleStopRun = useCallback(async () => {
    if (selectedEvent?.resource.runId) {
      await stopRun(selectedEvent.resource.runId);
    }
  }, [selectedEvent, stopRun]);

  // Event styling
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    let backgroundColor = '#0ea5e9'; // primary-500

    if (event.resource.type === 'run') {
      switch (event.resource.status) {
        case 'running':
          backgroundColor = '#3b82f6'; // blue-500
          break;
        case 'queued':
          backgroundColor = '#6b7280'; // gray-500
          break;
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 1,
        color: 'white',
        border: '0',
        display: 'block',
      },
    };
  }, []);

  const getSelectedScheduleInfo = () => {
    if (!selectedEvent) return null;

    if (selectedEvent.resource.scheduleId) {
      return nextRuns.find(s => s.scheduleId === selectedEvent.resource.scheduleId);
    }
    return null;
  };

  const getSelectedRunInfo = () => {
    if (!selectedEvent?.resource.runId) return null;
    return runs.find(r => r.id === selectedEvent.resource.runId);
  };

  const scheduleInfo = getSelectedScheduleInfo();
  const runInfo = getSelectedRunInfo();
  const selectedAgent = agents.find(a => a.id === selectedEvent?.resource.agentId);

  if (loadingNextRuns || loadingRuns) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No scheduled runs"
          description="Create an agent and schedule it to see events on your calendar."
          className="flex-1"
        />
      ) : (
        <div className="flex-1 bg-white rounded-apple shadow-apple p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            style={{ height: '100%' }}
          />
        </div>
      )}

      {/* Event Details Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Event Details"
        width="md"
      >
        {selectedEvent && (
          <div className="p-5 space-y-6">
            {/* Agent Info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Bot size={20} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedAgent?.name}</h3>
                <p className="text-sm text-gray-500">{selectedAgent?.description}</p>
              </div>
            </div>

            {/* Status */}
            {runInfo && (
              <div className="flex items-center gap-2">
                <StatusPill status={runInfo.status} />
              </div>
            )}

            {/* Schedule Info */}
            {scheduleInfo && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-700">
                    Next run: {format(new Date(scheduleInfo.nextRun), 'PPpp')}
                  </span>
                </div>
                {scheduleInfo.runWindowMinutes && (
                  <div className="text-sm text-gray-500">
                    Duration: {scheduleInfo.runWindowMinutes} minutes
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Timezone: {scheduleInfo.timezone}
                </div>
              </div>
            )}

            {/* Run Info */}
            {runInfo && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Started:</span>{' '}
                  <span className="text-gray-900">
                    {runInfo.actual_start
                      ? format(new Date(runInfo.actual_start), 'PPpp')
                      : 'Not started'}
                  </span>
                </div>
                {runInfo.actual_end && (
                  <div className="text-sm">
                    <span className="text-gray-500">Ended:</span>{' '}
                    <span className="text-gray-900">
                      {format(new Date(runInfo.actual_end), 'PPpp')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              {runInfo?.status === 'running' ? (
                <Button variant="danger" onClick={handleStopRun}>
                  <Pause size={16} />
                  Stop Run
                </Button>
              ) : (
                <Button onClick={handleRunNow}>
                  <Play size={16} />
                  Run Now
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedAgent) {
                    window.location.href = `/agents/${selectedAgent.id}`;
                  }
                }}
              >
                View Agent
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
