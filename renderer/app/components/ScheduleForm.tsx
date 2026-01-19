'use client';

import React, { useState, useEffect } from 'react';
import { CreateScheduleInput, RecurrenceType } from '../../../shared/types';

interface ScheduleFormProps {
  agentId: string;
  onClose: () => void;
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ agentId, onClose }) => {
  const [step, setStep] = useState(1);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateScheduleInput>({
    agent_id: agentId,
    start_datetime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recurrence_type: 'daily',
    recurrence_interval: 1,
    enabled: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimezones();
  }, []);

  const loadTimezones = async () => {
    try {
      const response = await window.electronAPI.getTimezones();
      if (response.success && response.data) {
        setTimezones(response.data);
      }
    } catch (error) {
      console.error('Failed to load timezones:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await window.electronAPI.createSchedule(formData);
      if (response.success) {
        onClose();
      } else {
        alert(`Failed to create schedule: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">When should this run?</h3>
      </div>

      {/* Recurrence type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frequency
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'one_time', label: 'One time' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, recurrence_type: option.value as RecurrenceType })}
              className={`p-4 rounded-lg border-2 transition-colors ${
                formData.recurrence_type === option.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date and time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            className="input"
            onChange={(e) => {
              const time = formData.start_datetime
                ? new Date(formData.start_datetime).toTimeString().substring(0, 5)
                : '01:00';
              setFormData({
                ...formData,
                start_datetime: `${e.target.value}T${time}:00`,
              });
            }}
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <input
            id="time"
            type="time"
            required
            className="input"
            defaultValue="01:00"
            onChange={(e) => {
              const date = formData.start_datetime
                ? new Date(formData.start_datetime).toISOString().substring(0, 10)
                : new Date().toISOString().substring(0, 10);
              setFormData({
                ...formData,
                start_datetime: `${date}T${e.target.value}:00`,
              });
            }}
          />
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          id="timezone"
          className="select"
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly - days of week */}
      {formData.recurrence_type === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days of week
          </label>
          <div className="flex gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const isSelected = formData.days_of_week?.includes(index);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const current = formData.days_of_week || [];
                    const updated = isSelected
                      ? current.filter((d) => d !== index)
                      : [...current, index].sort();
                    setFormData({ ...formData, days_of_week: updated });
                  }}
                  className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly - day of month */}
      {formData.recurrence_type === 'monthly' && (
        <div>
          <label htmlFor="day_of_month" className="block text-sm font-medium text-gray-700 mb-2">
            Day of month
          </label>
          <input
            id="day_of_month"
            type="number"
            min="1"
            max="31"
            className="input"
            value={formData.day_of_month || 1}
            onChange={(e) =>
              setFormData({ ...formData, day_of_month: parseInt(e.target.value) })
            }
          />
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Run window (optional)</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set a maximum duration for this task. The agent will be stopped if it runs longer than this time.
        </p>
      </div>

      <div>
        <label htmlFor="run_window" className="block text-sm font-medium text-gray-700 mb-2">
          Maximum duration (minutes)
        </label>
        <input
          id="run_window"
          type="number"
          min="1"
          className="input"
          value={formData.run_window_minutes || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              run_window_minutes: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder="e.g., 30"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty for no time limit
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review</h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <div className="text-sm font-medium text-gray-500">Frequency</div>
          <div className="text-gray-900">
            {formData.recurrence_type === 'one_time' ? 'One time' :
             formData.recurrence_type === 'daily' ? 'Daily' :
             formData.recurrence_type === 'weekly' ? 'Weekly' :
             'Monthly'}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-500">Start time</div>
          <div className="text-gray-900">
            {formData.start_datetime
              ? new Date(formData.start_datetime).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Not set'}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-500">Timezone</div>
          <div className="text-gray-900">{formData.timezone}</div>
        </div>

        {formData.recurrence_type === 'weekly' && formData.days_of_week && (
          <div>
            <div className="text-sm font-medium text-gray-500">Days</div>
            <div className="text-gray-900">
              {formData.days_of_week
                .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
                .join(', ')}
            </div>
          </div>
        )}

        {formData.recurrence_type === 'monthly' && (
          <div>
            <div className="text-sm font-medium text-gray-500">Day of month</div>
            <div className="text-gray-900">{formData.day_of_month}</div>
          </div>
        )}

        {formData.run_window_minutes && (
          <div>
            <div className="text-sm font-medium text-gray-500">Maximum duration</div>
            <div className="text-gray-900">{formData.run_window_minutes} minutes</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">New Schedule</h2>
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? 'bg-primary-600 text-white'
                    : s < step
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 ${
                    s < step ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-8 py-6">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!formData.start_datetime}
              className="btn-primary flex-1"
            >
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleForm;
