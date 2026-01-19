import { useState, useEffect } from 'react';
import Card from '../../renderer/components/ui/Card';
import Select from '../../renderer/components/ui/Select';
import Input from '../../renderer/components/ui/Input';
import Toggle from '../../renderer/components/ui/Toggle';
import Button from '../../renderer/components/ui/Button';
import { Settings, Save, RefreshCw } from 'lucide-react';
import type { AppSettings } from '@shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  runOverlapPolicy: 'queue',
  maxConcurrentRuns: 3,
  logRetentionDays: 30,
  startMinimized: false,
  showNotifications: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const storedSettings = await window.electronAPI.settings.getAll();
      setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await window.electronAPI.settings.set(key as keyof AppSettings, value);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure how Claude Agent Scheduler works.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <h2 className="font-medium text-gray-900 mb-4">Appearance</h2>
          <div className="space-y-4">
            <Select
              label="Theme"
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as AppSettings['theme'] })}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
              hint="Choose how the app looks. System follows your OS setting."
            />
          </div>
        </Card>

        {/* Scheduler */}
        <Card>
          <h2 className="font-medium text-gray-900 mb-4">Scheduler</h2>
          <div className="space-y-4">
            <Select
              label="Overlap Policy"
              value={settings.runOverlapPolicy}
              onChange={(e) => setSettings({ ...settings, runOverlapPolicy: e.target.value as AppSettings['runOverlapPolicy'] })}
              options={[
                { value: 'queue', label: 'Queue' },
                { value: 'skip', label: 'Skip' },
              ]}
              hint="What to do when a scheduled run overlaps with a running one. Queue: wait in line. Skip: don't run."
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Concurrent Runs
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxConcurrentRuns}
                  onChange={(e) => setSettings({ ...settings, maxConcurrentRuns: parseInt(e.target.value, 10) || 1 })}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of agents that can run at the same time.
              </p>
            </div>
          </div>
        </Card>

        {/* Data */}
        <Card>
          <h2 className="font-medium text-gray-900 mb-4">Data</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Log Retention
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.logRetentionDays}
                  onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value, 10) || 30 })}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                How long to keep run logs before automatically deleting them.
              </p>
            </div>
          </div>
        </Card>

        {/* Behavior */}
        <Card>
          <h2 className="font-medium text-gray-900 mb-4">Behavior</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Start Minimized</div>
                <div className="text-xs text-gray-500">
                  Start the app in the system tray instead of showing the window.
                </div>
              </div>
              <Toggle
                checked={settings.startMinimized}
                onChange={(checked) => setSettings({ ...settings, startMinimized: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Show Notifications</div>
                <div className="text-xs text-gray-500">
                  Display system notifications for run completions and failures.
                </div>
              </div>
              <Toggle
                checked={settings.showNotifications}
                onChange={(checked) => setSettings({ ...settings, showNotifications: checked })}
              />
            </div>
          </div>
        </Card>

        {/* About */}
        <Card variant="filled">
          <h2 className="font-medium text-gray-900 mb-2">About</h2>
          <p className="text-sm text-gray-600">
            Claude Agent Scheduler v1.0.0
          </p>
          <p className="text-xs text-gray-500 mt-1">
            A local-first desktop app to create, schedule, and manage AI agents.
          </p>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={loadSettings}>
            <RefreshCw size={16} />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : saved ? (
              <>Saved!</>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
