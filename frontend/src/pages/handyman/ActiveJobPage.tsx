import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService } from '../../services/jobs';
import { handymenService } from '../../services/handymen';
import { useStore } from '../../store';
import type { JobStatus } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { JobStatusBar } from '../../components/JobStatusBar';

const STATUS_NEXT: Partial<Record<JobStatus, JobStatus>> = {
  MATCHED: 'EN_ROUTE',
  EN_ROUTE: 'ARRIVED',
  ARRIVED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

const STATUS_BUTTON_LABEL: Partial<Record<JobStatus, string>> = {
  MATCHED: 'Start Driving',
  EN_ROUTE: 'Mark Arrived',
  ARRIVED: 'Start Work',
  IN_PROGRESS: 'Complete Job',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function HandymanActiveJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToast } = useStore();
  const queryClient = useQueryClient();
  const watchIdRef = useRef<number | null>(null);
  const [locationError, setLocationError] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id!),
    enabled: !!id,
    refetchInterval: 15000,
  });

  // Geolocation watch — send location updates to backend
  useEffect(() => {
    if (!user?.id) return;
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        handymenService.updateLocation(user.id, pos.coords.latitude, pos.coords.longitude).catch(() => {
          // non-fatal — don't surface to user
        });
        setLocationError('');
      },
      () => {
        setLocationError('Location access denied. Clients won\'t see your position.');
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [user?.id]);

  const statusMutation = useMutation({
    mutationFn: (status: JobStatus) => jobsService.updateJobStatus(id!, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      if (data.status === 'COMPLETED') {
        addToast('Job marked complete', 'success');
        navigate('/handyman/jobs');
      }
    },
    onError: () => addToast('Failed to update status', 'error'),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!job) return <div className="p-6 text-center text-gray-500">Job not found.</div>;

  const nextStatus = STATUS_NEXT[job.status as JobStatus];
  const buttonLabel = STATUS_BUTTON_LABEL[job.status as JobStatus];

  // OSM navigate link (opens in Google Maps or default map app via geo: URI, falls back to OSM)
  const osmUrl = job.locationLat && job.locationLng
    ? `https://www.openstreetmap.org/directions?from=&to=${job.locationLat},${job.locationLng}`
    : null;

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
      </div>

      {/* Status stepper */}
      <JobStatusBar currentStatus={job.status as JobStatus} />

      {/* Location error */}
      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-sm text-yellow-800" role="alert">
          {locationError}
        </div>
      )}

      {/* Client info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Location</p>
        <p className="text-sm text-gray-900">{job.locationAddress}</p>
        {osmUrl && (
          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Navigate (OpenStreetMap)
          </a>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Client Notes</p>
          <p className="text-sm text-gray-700">{job.description}</p>
        </div>
      )}

      {/* Payout summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Your Payout</span>
        <span className="font-bold text-green-700 text-lg">{fmt(job.finalPrice ?? job.quotedPrice)}</span>
      </div>

      {/* Price breakdown */}
      <PriceBreakdown
        laborCost={job.laborCost}
        materialCost={job.materialCost}
        transportCost={job.transportCost}
        total={job.quotedPrice}
        finalPrice={job.finalPrice}
      />

      {/* Actions */}
      <div className="space-y-3 pt-1">
        {nextStatus && buttonLabel && (
          <button
            onClick={() => statusMutation.mutate(nextStatus)}
            disabled={statusMutation.isPending}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          >
            {statusMutation.isPending ? 'Updating…' : buttonLabel}
          </button>
        )}

        {job.status === 'COMPLETED' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-green-800 font-semibold">Job Complete</p>
            <p className="text-sm text-green-600 mt-1">Waiting for client payment.</p>
          </div>
        )}

        <Link
          to={`/handyman/jobs/${id}/chat`}
          className="block w-full text-center py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
        >
          💬 Chat with Client
        </Link>
      </div>
    </div>
  );
}
