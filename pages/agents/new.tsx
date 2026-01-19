import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAgents } from '../../renderer/hooks/useAgents';
import Card from '../../renderer/components/ui/Card';
import Button from '../../renderer/components/ui/Button';
import Input from '../../renderer/components/ui/Input';
import Textarea from '../../renderer/components/ui/Textarea';
import { Bot, ChevronDown, ChevronUp, Settings, Sparkles } from 'lucide-react';
import type { AgentCreateInput } from '@shared/types';

// Template agents
const templates = [
  {
    id: 'blank',
    name: 'Blank Agent',
    description: 'Start from scratch',
    icon: '📝',
    data: {
      name: '',
      description: '',
      prompt: '',
      command: 'claude',
    },
  },
  {
    id: 'job-hunter',
    name: 'Night Shift Job Hunter',
    description: 'Searches and applies for jobs during off-hours',
    icon: '🌙',
    data: {
      name: 'Night Shift Job Hunter',
      description: 'Searches for job postings and applies automatically during nighttime hours',
      prompt: `You are a job application assistant. Your task is to:

1. Navigate to the specified job board URL
2. Search for positions matching the provided keywords
3. Filter results by location and experience level
4. For each matching position:
   - Review the job description
   - Determine if it's a good fit based on the criteria
   - If suitable, prepare and submit an application
5. Log all actions and results

Configuration:
- Target URL: [REPLACE_WITH_JOB_BOARD_URL]
- Keywords: [REPLACE_WITH_KEYWORDS]
- Location: [REPLACE_WITH_LOCATION]
- Experience Level: [REPLACE_WITH_LEVEL]

IMPORTANT: This is a template. Replace the placeholder values above with actual configuration before running.

Note: Browser automation is currently stubbed. When WebTaskRunner is implemented with Playwright, this agent will be able to perform actual browser automation.`,
      command: 'claude',
    },
  },
  {
    id: 'report-generator',
    name: 'Daily Report Generator',
    description: 'Generates daily summary reports',
    icon: '📊',
    data: {
      name: 'Daily Report Generator',
      description: 'Generates and saves daily summary reports from specified data sources',
      prompt: `Generate a daily summary report including:

1. Key metrics and statistics
2. Notable changes from previous day
3. Any alerts or anomalies detected
4. Recommendations for action

Output format: Markdown
Save location: ./reports/

Customize this prompt with your specific data sources and metrics.`,
      command: 'claude',
    },
  },
  {
    id: 'backup-checker',
    name: 'Backup Verification',
    description: 'Verifies backup integrity',
    icon: '💾',
    data: {
      name: 'Backup Verification',
      description: 'Checks backup files for integrity and reports status',
      prompt: `Verify backup integrity:

1. Check if backup files exist at specified location
2. Verify file checksums
3. Test restore capability (dry run)
4. Report any issues or failures

Backup location: [REPLACE_WITH_PATH]
Expected files: [LIST_EXPECTED_FILES]

Report results via stdout.`,
      command: 'claude',
    },
  },
];

export default function NewAgentPage() {
  const router = useRouter();
  const { createAgent } = useAgents();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AgentCreateInput>({
    name: '',
    description: '',
    prompt: '',
    command: 'claude',
    working_directory: '',
    env_vars: {},
    tags: [],
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        ...template.data,
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    try {
      const agent = await createAgent(formData);
      router.push(`/agents/${agent.id}`);
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create New Agent</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure an AI agent to automate tasks.
        </p>
      </div>

      {/* Templates */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Start from a template
        </label>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateSelect(template.id)}
              className={`p-4 rounded-apple border text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{template.icon}</div>
              <div className="font-medium text-gray-900 text-sm">{template.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Agent"
              error={errors.name}
            />

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this agent does"
              hint="Optional. Helps you identify the agent later."
            />
          </div>
        </Card>

        {/* Prompt */}
        <Card>
          <Textarea
            label="Prompt"
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            placeholder="Enter the instructions for the AI agent..."
            monospace
            rows={10}
            error={errors.prompt}
            hint="This is the main instruction that will be sent to the Claude CLI."
          />
        </Card>

        {/* Advanced Settings */}
        <Card>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gray-400" />
              <span className="font-medium text-gray-900">Advanced Settings</span>
            </div>
            {showAdvanced ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <Input
                label="Command"
                value={formData.command}
                onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                placeholder="claude"
                hint="The command to execute. Default: claude"
              />

              <Input
                label="Working Directory"
                value={formData.working_directory || ''}
                onChange={(e) => setFormData({ ...formData, working_directory: e.target.value })}
                placeholder="/path/to/directory"
                hint="Optional. The directory to run the command in."
              />
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
}
