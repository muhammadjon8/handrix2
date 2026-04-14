import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobsService } from '../../services/jobs';
import { useStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MapEmbed, type MapPin } from '../../components/MapEmbed';
import { JobStatusBar } from '../../components/JobStatusBar';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function ClientTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { status: storeStatus, eta: storeEta, handymanLocation } = useStore();
  useWebSocket();

  const [countdown, setCountdown] = useState<number | null>(null);
  const autoNavRef = useRef(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id!),
    enabled: !!id,
    refetchInterval: 30_000,
  });

  const currentStatus = storeStatus ?? job?.status ?? null;
  const etaString = storeEta ?? job?.eta ?? null;

  // ETA countdown — update every 30 seconds
  useEffect(() => {
    function calcCountdown() {
      if (!etaString) { setCountdown(null); return; }
      const diff = Math.ceil((new Date(etaString).getTime() - Date.now()) / 60000);
      setCountdown(diff);
    }
    calcCountdown();
    const interval = setInterval(calcCountdown, 30_000);
    return () => clearInterval(interval);
  }, [etaString]);

  // Auto navigate to payment when job completes
  useEffect(() => {
    if (currentStatus === 'COMPLETED' && !autoNavRef.current && id) {
      autoNavRef.current = true;
      const timer = setTimeout(() => navigate(`/client/jobs/${id}/payment`), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStatus, id, navigate]);

  const mapCenter: [number, number] = job
    ? [job.locationLat, job.locationLng]
    : [51.505, -0.09];

  const pins: MapPin[] = [];
  if (job) {
    pins.push({ lat: job.locationLat, lng: job.locationLng, label: job.locationAddress, type: 'default' });
  }
  if (handymanLocation) {
    pins.push({ lat: handymanLocation.lat, lng: handymanLocation.lng, label: 'Handyman', type: 'handyman' });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tracking</h1>
          {job?.category?.name && (
            <p className="text-sm text-gray-500">{job.category.name}</p>
          )}
        </div>
        <button
          onClick={() => navigate(`/client/jobs/${id}/chat`)}
          className="relative flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat
        </button>
      </div>

      {/* COMPLETED banner */}
      {currentStatus === 'COMPLETED' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-700 font-bold text-lg">Job Complete!</p>
          <p className="text-green-600 text-sm mt-1">Redirecting to payment…</p>
        </div>
      )}

      {/* Status bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3">
        <JobStatusBar currentStatus={currentStatus} />
      </div>

      {/* ETA */}
      {currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">Estimated arrival</span>
          <span className="text-sm font-bold text-blue-700">
            {countdown === null
              ? '—'
              : countdown <= 0
              ? 'Arriving soon'
              : `${countdown} min`}
          </span>
        </div>
      )}

      {/* Handyman info */}
      {job?.handyman && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.handyman.avatarUrl ? (
              <img src={job.handyman.avatarUrl} alt={job.handyman.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-blue-600">{job.handyman.name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Your handyman</p>
            <p className="font-semibold text-gray-900">{job.handyman.name}</p>
            {job.handyman.rating > 0 && (
              <p className="text-xs text-yellow-500">{'★'.repeat(Math.round(job.handyman.rating))} {job.handyman.rating.toFixed(1)}</p>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <MapEmbed
        center={handymanLocation ? [handymanLocation.lat, handymanLocation.lng] : mapCenter}
        zoom={14}
        pins={pins}
        className="h-64 w-full rounded-2xl border border-gray-200"
      />

      {/* Address */}
      {job?.locationAddress && (
        <div className="text-sm text-gray-500 flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{job.locationAddress}</span>
        </div>
      )}
    </div>
  );
}
