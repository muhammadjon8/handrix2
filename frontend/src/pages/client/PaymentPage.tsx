import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { jobsService } from '../../services/jobs';
import { paymentsService } from '../../services/payments';
import { PriceBreakdown } from '../../components/PriceBreakdown';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

function PaymentForm({ jobId, amount }: { jobId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  async function handlePay() {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setLoading(true);
    setStripeError('');
    try {
      const { clientSecret } = await paymentsService.createIntent(jobId);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
      if (error) {
        setStripeError(error.message ?? 'Payment failed');
        return;
      }
      if (paymentIntent?.status === 'succeeded') {
        await paymentsService.confirmPayment(jobId, paymentIntent.id);
        navigate(`/client/jobs/${jobId}/receipt`);
      }
    } catch {
      setStripeError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">Card details</label>
        <div className="border border-gray-300 rounded-xl px-3 py-3">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#111827', '::placeholder': { color: '#9ca3af' } } } }} />
        </div>
        {stripeError && (
          <p className="text-sm text-red-500" role="alert">{stripeError}</p>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Secured by Stripe · Your card details are never stored on our servers.
      </p>

      <button
        onClick={handlePay}
        disabled={loading || !stripe}
        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
      >
        {loading ? 'Processing…' : `Pay $${amount.toFixed(2)}`}
      </button>
    </div>
  );
}

export default function ClientPaymentPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsService.getJob(jobId!),
    enabled: !!jobId,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!job) return <div className="p-6 text-center text-gray-500">Job not found.</div>;

  const payAmount = job.finalPrice ?? job.quotedPrice;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Payment</h1>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-800">Job complete!</p>
          <p className="text-sm text-green-600">{job.category.name} · {job.handyman?.name}</p>
        </div>
      </div>

      <PriceBreakdown
        laborCost={job.laborCost}
        materialCost={job.materialCost}
        transportCost={job.transportCost}
        total={job.quotedPrice}
        finalPrice={job.finalPrice}
      />

      <Elements stripe={stripePromise}>
        <PaymentForm jobId={jobId!} amount={payAmount} />
      </Elements>
    </div>
  );
}
