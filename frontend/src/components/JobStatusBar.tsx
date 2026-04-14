import type { JobStatus } from '../types';

const STEPS: { status: JobStatus; label: string }[] = [
  { status: 'MATCHED', label: 'Matched' },
  { status: 'EN_ROUTE', label: 'En Route' },
  { status: 'ARRIVED', label: 'Arrived' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'COMPLETED', label: 'Completed' },
];

function stepIndex(status: JobStatus | null) {
  return STEPS.findIndex((s) => s.status === status);
}

interface Props {
  currentStatus: JobStatus | null;
}

export function JobStatusBar({ currentStatus }: Props) {
  const current = stepIndex(currentStatus);

  return (
    <div role="list" aria-label="Job status steps" className="flex items-center w-full px-2 py-3">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        return (
          <div key={step.status} role="listitem" className="flex-1 flex flex-col items-center relative">
            {i < STEPS.length - 1 && (
              <div className={`absolute top-3 left-1/2 w-full h-0.5 ${done && i < current ? 'bg-blue-500' : 'bg-gray-200'}`} />
            )}
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                done ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
              } ${active ? 'ring-2 ring-blue-300' : ''}`}
            >
              {done && !active ? '✓' : i + 1}
            </span>
            <span className={`text-xs mt-1 text-center ${active ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
