import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { jobsService } from '../../services/jobs';
import { useStore } from '../../store';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  MATCHED: 'bg-purple-100 text-purple-700',
  EN_ROUTE: 'bg-blue-100 text-blue-700',
  ARRIVED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'IN_PROGRESS' },
  { label: 'Matched', value: 'MATCHED' },
  { label: 'Done', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function ClientJobHistoryPage() {
  const { user } = useStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['clientJobs', user?.id, statusFilter, page],
    queryFn: () => jobsService.getClientJobs(user!.id, { status: statusFilter || undefined, page, limit: LIMIT }),
    enabled: !!user?.id,
    placeholderData: keepPreviousData,
  });

  const jobs = data?.jobs ?? [];
  const total = data?.total ?? 0;
  const hasMore = page * LIMIT < total;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((f) => (
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
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-gray-700">No jobs yet</p>
          <p className="text-sm text-gray-500 mt-1">Your job history will appear here.</p>
          <Link
            to="/client/book/category"
            className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
          >
            Book a Job
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.jobId}>
              <Link
                to={`/client/jobs/${job.jobId}`}
                className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{job.category}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.warrantyStatus === 'ACTIVE' && (
                      <span title="Active warranty" className="text-green-500 text-xs">🛡️ Warranty</span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {job.finalPrice != null ? `$${job.finalPrice.toFixed(2)}` : `$${job.quotedPrice.toFixed(2)} est.`}
                  </span>
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
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
