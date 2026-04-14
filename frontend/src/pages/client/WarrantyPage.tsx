import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { warrantiesService } from '../../services/warranties';
import { useStore } from '../../store';
import { LoadingSpinner } from '../../components/LoadingSpinner';

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    CLAIMED: 'bg-yellow-100 text-yellow-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

export default function ClientWarrantyPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [descError, setDescError] = useState('');

  const { data: warranty, isLoading, isError } = useQuery({
    queryKey: ['warranty', jobId],
    queryFn: () => warrantiesService.getWarranty(jobId!),
    enabled: !!jobId,
    retry: false,
  });

  const isExpired = warranty ? new Date(warranty.validUntil) < new Date() : false;
  const canClaim = warranty?.status === 'ACTIVE' && !isExpired;

  async function handleSubmitClaim() {
    if (!description.trim()) { setDescError('Please describe the issue'); return; }
    setDescError('');
    setSubmitting(true);
    try {
      await warrantiesService.fileClaim(jobId!, { description, photoUrl: photoUrl || undefined });
      addToast('Claim submitted successfully', 'success');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['warranty', jobId] });
    } catch {
      addToast('Failed to submit claim', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Warranty</h1>
      </div>

      {isError || !warranty ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
          <p className="text-4xl mb-3">🛡️</p>
          <p className="font-semibold text-yellow-800">Warranty not yet available</p>
          <p className="text-sm text-yellow-600 mt-1">The warranty will be issued once your job is marked as complete.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">🛡️ Warranty Details</span>
              <StatusBadge status={warranty.status} />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Valid until</span>
                <span className="font-medium text-gray-900">{new Date(warranty.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Issued</span>
                <span className="font-medium text-gray-900">{new Date(warranty.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {isExpired && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">Warranty period has ended.</p>
            )}
          </div>

          {canClaim && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
            >
              File a Claim
            </button>
          )}

          {warranty.status === 'CLAIMED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              A claim has been filed for this warranty and is under review.
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">File a Warranty Claim</h2>
              <div>
                <label htmlFor="claim-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="claim-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue…"
                  aria-describedby={descError ? 'claim-desc-error' : undefined}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                {descError && <p id="claim-desc-error" className="text-xs text-red-500 mt-1">{descError}</p>}
              </div>
              <div>
                <label htmlFor="claim-photo" className="block text-sm font-medium text-gray-700 mb-1">Photo URL (optional)</label>
                <input
                  id="claim-photo"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitClaim}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {submitting ? 'Submitting…' : 'Submit Claim'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
