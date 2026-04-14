import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobsService } from '../../services/jobs';
import { LoadingSpinner } from '../../components/LoadingSpinner';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function ClientReceiptPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsService.getJob(jobId!),
    enabled: !!jobId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!job) return <div className="p-6 text-center text-gray-500">Job not found.</div>;

  const paid = job.finalPrice ?? job.quotedPrice;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Success header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful</h1>
        <p className="text-sm text-gray-500">Thank you for using Handrix</p>
      </div>

      {/* Receipt card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Receipt</p>
          <p className="font-semibold text-gray-900 mt-0.5">{job.category.name}</p>
        </div>

        <div className="px-5 py-4 space-y-2 text-sm">
          {job.handyman && (
            <div className="flex justify-between text-gray-600">
              <span>Handyman</span>
              <span className="font-medium text-gray-900">{job.handyman.name}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Date</span>
            <span className="font-medium text-gray-900">{new Date(job.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Location</span>
            <span className="font-medium text-gray-900 text-right max-w-[60%]">{job.locationAddress}</span>
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Labor</span><span>{fmt(job.laborCost)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Materials</span><span>{fmt(job.materialCost)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Transport</span><span>{fmt(job.transportCost)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total Paid</span><span className="text-blue-600">{fmt(paid)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          to={`/client/jobs/${jobId}/warranty`}
          className="block w-full text-center py-3 bg-green-50 border border-green-200 text-green-700 font-semibold text-sm rounded-xl hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          🛡️ View Warranty
        </Link>
        <button
          onClick={() => navigate('/client/jobs')}
          className="block w-full py-3 text-center bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Done
        </button>
      </div>
    </div>
  );
}
