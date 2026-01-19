import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAgents } from '../../renderer/hooks/useAgents';
import { useSchedules } from '../../renderer/hooks/useSchedules';
import Card from '../../renderer/components/ui/Card';
import Button from '../../renderer/components/ui/Button';
import Input from '../../renderer/components/ui/Input';
import Select from '../../renderer/components/ui/Select';
import { Bot, Calendar, Clock, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import clsx from 'clsx';
import type { ScheduleCreateInput, RecurrenceType, DayOfWeek } from '@shared/types';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const RECURRENCE_OPTIONS = [
  { value: 'one_time', label: 'One time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function NewSchedulePage() {
  const router = useRouter();
  const { agentId: queryAgentId } = router.query;
  const { agents, loading: loadingAgents } = useAgents();
  const { createSchedule } = useSchedules();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [systemTimezone, setSystemTimezone] = useState('UTC');

  const [formData, setFormData] = useState<ScheduleCreateInput>({
    agent_id: '',
    name: '',
    start_datetime: '',
    timezone: 'UTC',
    recurrence_type: 'daily',
    recurrence_interval: 1,
    days_of_week: [],
    day_of_month: 1,
    run_window_minutes: undefined,
    enabled: true,
  });

  // Time inputs (separate for easier handling)
  const [time, setTime] = useState('09:00');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Load timezones
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.system.getTimezones().then(setTimezones);
      window.electronAPI.system.getSystemTimezone().then((tz) => {
        setSystemTimezone(tz);
        setFormData(prev => ({ ...prev, timezone: tz }));
      });
    }
  }, []);

  // Set agent from query
  useEffect(() => {
    if (queryAgentId && typeof queryAgentId === 'string') {
      setFormData(prev => ({ ...prev, agent_id: queryAgentId }));
    }
  }, [queryAgentId]);

  const selectedAgent = agents.find(a => a.id === formData.agent_id);

  const handleDayToggle = (day: DayOfWeek) => {
    const current = formData.days_of_week || [];
    if (current.includes(day)) {
      setFormData({
        ...formData,
        days_of_week: current.filter(d => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        days_of_week: [...current, day].sort(),
      });
    }
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        return !!formData.agent_id && !!formData.name.trim();
      case 2:
        return !!time && (formData.recurrence_type !== 'one_time' || !!date);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);

    try {
      // Build the start datetime
      const [hours, minutes] = time.split(':').map(Number);
      let startDate = new Date(date);
      startDate = setHours(startDate, hours);
      startDate = setMinutes(startDate, minutes);

      const scheduleData: ScheduleCreateInput = {
        ...formData,
        start_datetime: startDate.toISOString(),
        run_window_minutes: formData.run_window_minutes || undefined,
        days_of_week: formData.recurrence_type === 'weekly' ? formData.days_of_week : undefined,
        day_of_month: formData.recurrence_type === 'monthly' ? formData.day_of_month : undefined,
      };

      await createSchedule(scheduleData);
      router.push(`/agents/${formData.agent_id}`);
    } catch (error) {
      console.error('Failed to create schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAgents) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                s < step
                  ? 'bg-primary-500 text-white'
                  : s === step
                  ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {s < step ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div
                className={clsx(
                  'w-16 h-0.5 mx-2',
                  s < step ? 'bg-primary-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Agent */}
      {step === 1 && (
        <div className="space-y-6 animate-in">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Choose Agent</h1>
            <p className="text-sm text-gray-500 mt-1">
              Select the agent and name this schedule.
            </p>
          </div>

          <Card>
            <div className="space-y-4">
              <Select
                label="Agent"
                value={formData.agent_id}
                onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                options={agents.map(a => ({ value: a.id, label: a.name }))}
                placeholder="Select an agent..."
              />

              {selectedAgent && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={16} className="text-primary-500" />
                    <span className="font-medium text-gray-900">{selectedAgent.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">{selectedAgent.description}</p>
                </div>
              )}

              <Input
                label="Schedule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Nightly run, Weekly report"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={!validateStep(1)}>
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: When */}
      {step === 2 && (
        <div className="space-y-6 animate-in">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900">When to Run</h1>
            <p className="text-sm text-gray-500 mt-1">
              Set the schedule timing and recurrence.
            </p>
          </div>

          <Card>
            <div className="space-y-4">
              <Select
                label="Frequency"
                value={formData.recurrence_type}
                onChange={(e) => setFormData({
                  ...formData,
                  recurrence_type: e.target.value as RecurrenceType,
                })}
                options={RECURRENCE_OPTIONS}
              />

              {formData.recurrence_type === 'one_time' && (
                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              )}

              {formData.recurrence_type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value as DayOfWeek)}
                        className={clsx(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          formData.days_of_week?.includes(day.value as DayOfWeek)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.recurrence_type === 'monthly' && (
                <Select
                  label="Day of Month"
                  value={String(formData.day_of_month || 1)}
                  onChange={(e) => setFormData({
                    ...formData,
                    day_of_month: parseInt(e.target.value, 10),
                  })}
                  options={Array.from({ length: 28 }, (_, i) => ({
                    value: String(i + 1),
                    label: String(i + 1),
                  }))}
                />
              )}

              <Input
                label="Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />

              <Select
                label="Timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                options={timezones.map(tz => ({ value: tz, label: tz }))}
                hint={`System timezone: ${systemTimezone}`}
              />

              {formData.recurrence_type !== 'one_time' && (
                <Select
                  label="Repeat Every"
                  value={String(formData.recurrence_interval)}
                  onChange={(e) => setFormData({
                    ...formData,
                    recurrence_interval: parseInt(e.target.value, 10),
                  })}
                  options={[
                    { value: '1', label: `Every ${formData.recurrence_type === 'daily' ? 'day' : formData.recurrence_type === 'weekly' ? 'week' : 'month'}` },
                    { value: '2', label: `Every 2 ${formData.recurrence_type === 'daily' ? 'days' : formData.recurrence_type === 'weekly' ? 'weeks' : 'months'}` },
                    { value: '3', label: `Every 3 ${formData.recurrence_type === 'daily' ? 'days' : formData.recurrence_type === 'weekly' ? 'weeks' : 'months'}` },
                  ]}
                />
              )}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleBack}>
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button onClick={handleNext} disabled={!validateStep(2)}>
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Duration & Review */}
      {step === 3 && (
        <div className="space-y-6 animate-in">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Duration & Review</h1>
            <p className="text-sm text-gray-500 mt-1">
              Set run duration and review your schedule.
            </p>
          </div>

          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Run Window (optional)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.run_window_minutes || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      run_window_minutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })}
                    placeholder="30"
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  If set, the run will be stopped after this duration.
                </p>
              </div>
            </div>
          </Card>

          {/* Review */}
          <Card variant="filled">
            <h3 className="font-medium text-gray-900 mb-4">Review</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Agent</dt>
                <dd className="text-gray-900 font-medium">{selectedAgent?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Schedule Name</dt>
                <dd className="text-gray-900">{formData.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Frequency</dt>
                <dd className="text-gray-900 capitalize">
                  {formData.recurrence_type.replace('_', ' ')}
                  {formData.recurrence_type === 'weekly' && formData.days_of_week?.length
                    ? ` (${formData.days_of_week.map(d => DAYS_OF_WEEK[d].label).join(', ')})`
                    : ''}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Time</dt>
                <dd className="text-gray-900">{time}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Timezone</dt>
                <dd className="text-gray-900">{formData.timezone}</dd>
              </div>
              {formData.run_window_minutes && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Run Window</dt>
                  <dd className="text-gray-900">{formData.run_window_minutes} minutes</dd>
                </div>
              )}
            </dl>
          </Card>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleBack}>
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create Schedule'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
