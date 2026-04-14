import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jobsService } from '../../../services/jobs';
import { useStore } from '../../../store';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

interface BookingState {
  jobId: string;
  categoryName?: string;
  priceEstimate?: { total: number; currency: string };
}

interface ConfirmedData {
  handymanName: string;
  handymanAvatar: string | null;
  eta: string;
}

export default function BookConfirmedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BookingState | null;
  const { setActiveJob } = useStore();

  const [confirmed, setConfirmed] = useState<ConfirmedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noHandyman, setNoHandyman] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function doConfirm() {
    if (!state?.jobId) {
      navigate('/client/book/category', { replace: true });
      return;
    }
    setLoading(true);
    setNoHandyman(false);
    try {
      const res = await jobsService.confirmJob(state.jobId);
      setConfirmed({
        handymanName: res.handyman?.name ?? 'Your handyman',
        handymanAvatar: res.handyman?.avatarUrl ?? null,
        eta: res.eta,
      });
      setActiveJob(state.jobId, 'MATCHED', res.eta);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        setNoHandyman(true);
      } else {
        setNoHandyman(true);
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }

  useEffect(() => {
    doConfirm();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRetry() {
    setRetrying(true);
    doConfirm();
  }

  function etaDisplay(etaStr: string) {
    const diff = Math.ceil((new Date(etaStr).getTime() - Date.now()) / 60000);
    if (diff <= 0) return 'Arriving very soon';
    return `${diff} minutes`;
  }

  if (loading || retrying) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <LoadingSpinner />
        <p className="text-sm text-gray-500 mt-4">
          {retrying ? 'Searching for a handyman…' : 'Confirming your booking…'}
        </p>
      </div>
    );
  }

  if (noHandyman) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center text-3xl mx-auto">
          😔
        </div>
        <h2 className="text-xl font-bold text-gray-900">No handymen available</h2>
        <p className="text-sm text-gray-500">
          There are no handymen available in your area right now. Please try again in a few minutes.
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition"
        >
          Try again
        </button>
        <button
          onClick={() => navigate('/client/book/category')}
          className="block w-full py-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:underline"
        >
          Start over
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1.5 rounded-full flex-1 bg-blue-600" />
        ))}
      </div>

      {/* Success state */}
      <div className="text-center space-y-6">
        {/* Checkmark */}
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking confirmed!</h1>
          <p className="text-sm text-gray-500 mt-1">
            {state?.categoryName && `Your ${state.categoryName} booking is confirmed.`}
          </p>
        </div>

        {/* Job reference */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-sm space-y-2 text-left">
          <div className="flex justify-between text-gray-600">
            <span>Job reference</span>
            <span className="font-mono font-semibold text-gray-900">{state?.jobId?.slice(-8).toUpperCase()}</span>
          </div>
          {state?.priceEstimate && (
            <div className="flex justify-between text-gray-600">
              <span>Estimate</span>
              <span className="font-semibold text-gray-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: state.priceEstimate.currency ?? 'USD' }).format(state.priceEstimate.total)}
              </span>
            </div>
          )}
        </div>

        {/* Handyman info */}
        {confirmed && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {confirmed.handymanAvatar ? (
                <img src={confirmed.handymanAvatar} alt={confirmed.handymanName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-blue-600">
                  {confirmed.handymanName[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500">Your handyman</p>
              <p className="font-semibold text-gray-900">{confirmed.handymanName}</p>
              {confirmed.eta && (
                <p className="text-sm text-blue-600 font-medium mt-0.5">
                  ETA: {etaDisplay(confirmed.eta)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Track button */}
        {state?.jobId && (
          <button
            onClick={() => navigate(`/client/jobs/${state.jobId}/track`)}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition"
          >
            Track your Handyman
          </button>
        )}

        <button
          onClick={() => navigate('/client/home')}
          className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:underline"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
