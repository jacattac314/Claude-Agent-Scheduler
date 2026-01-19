'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CalendarEvent } from '../../../shared/types';

const localizer = momentLocalizer(moment);

const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, [date, view]);

  const loadEvents = async () => {
    try {
      // Calculate date range based on current view
      const { start, end } = getDateRange(date, view);

      const response = await window.electronAPI.getCalendarEvents(
        start.toISOString(),
        end.toISOString()
      );

      if (response.success && response.data) {
        // Convert date strings back to Date objects
        const eventsData = response.data.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  };

  const getDateRange = (date: Date, view: any) => {
    const start = moment(date).startOf(view === Views.MONTH ? 'month' : view === Views.WEEK ? 'week' : 'day').subtract(7, 'days').toDate();
    const end = moment(date).endOf(view === Views.MONTH ? 'month' : view === Views.WEEK ? 'week' : 'day').add(7, 'days').toDate();
    return { start, end };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleRunNow = async () => {
    if (!selectedEvent) return;

    try {
      const response = await window.electronAPI.runNow(selectedEvent.resource.agent.id);
      if (response.success) {
        alert('Agent started successfully!');
        setSelectedEvent(null);
      } else {
        alert(`Failed to start agent: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to run agent:', error);
      alert('Failed to start agent');
    }
  };

  const handleToggleSchedule = async () => {
    if (!selectedEvent) return;

    try {
      const response = await window.electronAPI.toggleSchedule(selectedEvent.resource.schedule.id);
      if (response.success) {
        loadEvents();
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Calendar</h2>
            <p className="text-sm text-gray-500 mt-1">View and manage scheduled agents</p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="bg-white rounded-xl shadow-apple p-6 h-full">
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
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
          />
        </div>
      </div>

      {/* Event detail drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-apple-lg max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedEvent.resource.agent.name}
            </h3>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-900">{selectedEvent.resource.agent.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Schedule</label>
                <p className="text-gray-900">
                  {selectedEvent.resource.schedule.recurrence_type === 'one_time' ? 'One time' :
                   selectedEvent.resource.schedule.recurrence_type === 'daily' ? 'Daily' :
                   selectedEvent.resource.schedule.recurrence_type === 'weekly' ? 'Weekly' :
                   'Monthly'}
                  {' at '}
                  {moment(selectedEvent.start).format('h:mm A')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Next Run</label>
                <p className="text-gray-900">{moment(selectedEvent.start).format('MMMM D, YYYY [at] h:mm A')}</p>
              </div>

              {selectedEvent.resource.schedule.run_window_minutes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-gray-900">{selectedEvent.resource.schedule.run_window_minutes} minutes</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">
                  <span className={selectedEvent.resource.schedule.enabled ? 'badge-success' : 'badge-gray'}>
                    {selectedEvent.resource.schedule.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleRunNow} className="btn-primary flex-1">
                Run Now
              </button>
              <button onClick={handleToggleSchedule} className="btn-secondary flex-1">
                {selectedEvent.resource.schedule.enabled ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => setSelectedEvent(null)} className="btn-ghost">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
