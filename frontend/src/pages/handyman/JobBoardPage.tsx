import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { jobsService } from '../../services/jobs';
import { handymenService } from '../../services/handymen';
import { useStore } from '../../store';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { JobStatus } from '../../types';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Available', value: 'PENDING' },
  { label: 'My Jobs', value: 'MATCHED' },
  { label: 'Active', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'COMPLETED' },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  MATCHED: 'bg-purple-100 text-purple-700',
  EN_ROUTE: 'bg-blue-100 text-blue-700',
  ARRIVED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function HandymanJobBoardPage() {
  const { user, addToast } = useStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const LIMIT = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['handymanJobs', user?.id, statusFilter, page],
    queryFn: () => jobsService.getHandymanJobs(user!.id, { status: statusFilter || undefined, page, limit: LIMIT }),
    enabled: !!user?.id,
    placeholderData: keepPreviousData,
    refetchInterval: statusFilter === 'PENDING' ? 10000 : false,
  });

  const toggleMutation = useMutation({
    mutationFn: (active: boolean) => handymenService.toggleActive(user!.id, active),
    onSuccess: (_, active) => {
      setIsActive(active);
      addToast(active ? 'You are now available' : 'You are now offline', 'info');
    },
    onError: () => addToast('Failed to update availability', 'error'),
  });

  const acceptMutation = useMutation({
    mutationFn: (jobId: string) => jobsService.updateJobStatus(jobId, 'MATCHED' as JobStatus),
    onSuccess: () => {
      addToast('Job accepted!', 'success');
      queryClient.invalidateQueries({ queryKey: ['handymanJobs'] });
    },
    onError: () => addToast('Failed to accept job', 'error'),
  });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const totalEarned = data?.totalEarned ?? 0;
  const hasMore = page * LIMIT < total;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Job Board</h1>
        <button
          onClick={() => toggleMutation.mutate(!isActive)}
          disabled={toggleMutation.isPending}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
          aria-label={isActive ? 'Go offline' : 'Go online'}
          aria-pressed={isActive}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Availability label */}
      <p className="text-xs text-gray-500">
        Status: <span className={`font-semibold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>{isActive ? 'Online' : 'Offline'}</span>
      </p>

      {/* Earnings summary */}
      {totalEarned > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">Total Earned</span>
          <span className="font-bold text-blue-900">{fmt(totalEarned)}</span>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔧</p>
          <p className="font-semibold text-gray-700">
            {statusFilter === 'PENDING' ? 'No available jobs right now' : 'No jobs found'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter === 'PENDING' ? 'Check back soon — new jobs appear automatically.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.jobId}>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{job.category}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {job.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Payout</span>
                  <span className="font-bold text-green-700">{fmt(job.payout)}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/handyman/jobs/${job.jobId}`}
                    className="flex-1 text-center py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                  >
                    View Details
                  </Link>
                  {job.status === 'PENDING' && (
                    <button
                      onClick={() => acceptMutation.mutate(job.jobId)}
                      disabled={acceptMutation.isPending}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                    >
                      Accept
                    </button>
                  )}
                  {(job.status === 'MATCHED' || job.status === 'EN_ROUTE' || job.status === 'ARRIVED' || job.status === 'IN_PROGRESS') && (
                    <Link
                      to={`/handyman/jobs/${job.jobId}`}
                      className="flex-1 text-center py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                    >
                      Open Job
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-full py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Load more
        </button>
      )}
    </div>
  );
}
