import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobsService } from '../../services/jobs';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PriceBreakdown } from '../../components/PriceBreakdown';

const ACTIVE_STATUSES = new Set(['EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'MATCHED']);

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  MATCHED: 'bg-purple-100 text-purple-700',
  EN_ROUTE: 'bg-blue-100 text-blue-700',
  ARRIVED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function ClientJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id!),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!job) return <div className="p-6 text-center text-gray-500">Job not found.</div>;

  const isActive = ACTIVE_STATUSES.has(job.status);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{job.category.name}</h1>
          <p className="text-xs text-gray-400">#{job.jobId.slice(0, 8)}</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      {/* Handyman */}
      {job.handyman && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            {job.handyman.avatarUrl
              ? <img src={job.handyman.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
              : <span className="text-blue-600 font-bold">{job.handyman.name[0]}</span>}
          </div>
          <div>
            <p className="text-xs text-gray-400">Assigned handyman</p>
            <p className="font-semibold text-gray-900">{job.handyman.name}</p>
            {job.handyman.rating > 0 && <p className="text-xs text-yellow-500">★ {job.handyman.rating.toFixed(1)}</p>}
          </div>
        </div>
      )}

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Location</p>
        <p className="text-sm text-gray-900">{job.locationAddress}</p>
      </div>

      {/* Description */}
      {job.description && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Notes</p>
          <p className="text-sm text-gray-700">{job.description}</p>
        </div>
      )}

      {/* Price */}
      <PriceBreakdown
        laborCost={job.laborCost}
        materialCost={job.materialCost}
        transportCost={job.transportCost}
        total={job.quotedPrice}
        finalPrice={job.finalPrice}
      />

      {/* Actions */}
      <div className="space-y-3 pt-1">
        {isActive && (
          <Link
            to={`/client/jobs/${id}/track`}
            className="block w-full text-center py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          >
            Track Handyman
          </Link>
        )}
        {job.status === 'COMPLETED' && (
          <>
            <Link
              to={`/client/jobs/${id}/warranty`}
              className="block w-full text-center py-3 bg-green-50 text-green-700 border border-green-200 font-semibold rounded-xl hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition"
            >
              🛡️ View Warranty
            </Link>
            {job.finalPrice == null && (
              <Link
                to={`/client/jobs/${id}/payment`}
                className="block w-full text-center py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
              >
                Pay Now
              </Link>
            )}
          </>
        )}
        <Link
          to={`/client/jobs/${id}/chat`}
          className="block w-full text-center py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
        >
          💬 Open Chat
        </Link>
      </div>
    </div>
  );
}
