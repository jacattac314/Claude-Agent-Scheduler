import clsx from 'clsx';
import type { RunStatus } from '@shared/types';

interface StatusPillProps {
  status: RunStatus;
  size?: 'sm' | 'md';
}

const statusLabels: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
  canceled: 'Canceled',
  timed_out: 'Timed Out',
};

const statusColors: Record<RunStatus, string> = {
  queued: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-700',
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  canceled: 'bg-yellow-100 text-yellow-700',
  timed_out: 'bg-orange-100 text-orange-700',
};

export default function StatusPill({ status, size = 'md' }: StatusPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        statusColors[status],
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-xs': size === 'md',
        }
      )}
    >
      {status === 'running' && (
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 animate-pulse" />
      )}
      {statusLabels[status]}
    </span>
  );
}
