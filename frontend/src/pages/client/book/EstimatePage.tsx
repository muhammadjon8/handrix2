import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { jobsService } from '../../../services/jobs';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { PriceBreakdown } from '../../../components/PriceBreakdown';

interface BookingState {
  categoryId: string;
  categoryName: string;
  locationLat: number;
  locationLng: number;
  locationAddress: string;
  description?: string;
}

interface EstimateData {
  jobId: string;
  laborCost: number;
  materialCost: number;
  transportCost: number;
  total: number;
  currency: string;
  estimatedDuration: number;
}

export default function BookEstimatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as BookingState | null;

  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!state?.categoryId) {
      navigate('/client/book/category', { replace: true });
      return;
    }

    let cancelled = false;

    async function fetchEstimate() {
      setLoading(true);
      setError('');
      try {
        const res = await jobsService.createJob({
          categoryId: state!.categoryId,
          locationLat: state!.locationLat,
          locationLng: state!.locationLng,
          locationAddress: state!.locationAddress,
          description: state!.description,
        });
        if (cancelled) return;
        setEstimate({
          jobId: res.jobId,
          laborCost: res.priceEstimate.laborCost,
          materialCost: res.priceEstimate.materialCost,
          transportCost: res.priceEstimate.transportCost,
          total: res.priceEstimate.total,
          currency: res.priceEstimate.currency,
          estimatedDuration: res.estimatedDuration,
        });
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('[EstimatePage] createJob failed:', err);
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(msg ? `Error: ${msg}` : 'Could not fetch an estimate. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEstimate();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirm() {
    if (!estimate) return;
    setConfirming(true);
    navigate('/client/book/confirmed', {
      state: {
        ...state,
        jobId: estimate.jobId,
        priceEstimate: {
          laborCost: estimate.laborCost,
          materialCost: estimate.materialCost,
          transportCost: estimate.transportCost,
          total: estimate.total,
          currency: estimate.currency,
        },
      },
    });
    setConfirming(false);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <LoadingSpinner />
        <p className="text-sm text-gray-500 mt-4">Calculating your estimate…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 3 of 4</p>
        <h1 className="text-2xl font-bold text-gray-900">Your estimate</h1>
        {state?.categoryName && (
          <p className="text-sm text-gray-500 mt-1">Service: {state.categoryName}</p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 ${i <= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {error ? (
        <div className="text-center py-8">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link
            to="/client/book/category"
            className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            Start over
          </Link>
        </div>
      ) : estimate ? (
        <div className="space-y-4">
          {/* Job summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 text-sm">Job summary</h3>
            <div className="text-sm space-y-1 text-gray-600">
              <div className="flex justify-between">
                <span>Location</span>
                <span className="text-right text-gray-800 max-w-[60%] truncate">{state?.locationAddress}</span>
              </div>
              {estimate.estimatedDuration > 0 && (
                <div className="flex justify-between">
                  <span>Duration estimate</span>
                  <span className="text-gray-800">{estimate.estimatedDuration} min</span>
                </div>
              )}
            </div>
          </div>

          <PriceBreakdown
            laborCost={estimate.laborCost}
            materialCost={estimate.materialCost}
            transportCost={estimate.transportCost}
            total={estimate.total}
            currency={estimate.currency}
          />

          <p className="text-xs text-gray-400 text-center">
            Final price may vary based on actual materials and time used.
          </p>

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition"
          >
            {confirming ? 'Please wait…' : 'Confirm & Book'}
          </button>

          <Link
            to="/client/book/category"
            className="block w-full text-center py-3 text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:underline"
          >
            Cancel
          </Link>
        </div>
      ) : null}
    </div>
  );
}
