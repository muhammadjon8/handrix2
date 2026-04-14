import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Finding a handyman…',
  MATCHED: 'Handyman matched',
  EN_ROUTE: 'Handyman on the way',
  ARRIVED: 'Handyman has arrived',
  IN_PROGRESS: 'Work in progress',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  MATCHED: 'bg-purple-100 text-purple-800',
  EN_ROUTE: 'bg-blue-100 text-blue-800',
  ARRIVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
};

export default function ClientHomePage() {
  const navigate = useNavigate();
  const { user, jobId, status, eta } = useStore();

  // Keep websocket alive on home page
  useWebSocket();

  const hasActiveJob = jobId !== null && status !== null && status !== 'COMPLETED' && status !== 'CANCELLED';

  function etaDisplay() {
    if (!eta) return null;
    const diff = Math.ceil((new Date(eta).getTime() - Date.now()) / 60000);
    if (diff <= 0) return 'Arriving soon';
    return `ETA: ${diff} min`;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-sm text-gray-500">Good day,</p>
        <h1 className="text-2xl font-bold text-gray-900">{user?.name ?? 'there'}</h1>
      </div>

      {/* Active job card */}
      {hasActiveJob && (
        <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-0.5">Active Job</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status!] ?? 'bg-blue-100 text-blue-800'}`}>
                {STATUS_LABELS[status!] ?? status}
              </span>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
              🔧
            </div>
          </div>

          {eta && (
            <p className="text-blue-100 text-sm mb-4">{etaDisplay()}</p>
          )}

          <button
            onClick={() => navigate(`/client/jobs/${jobId}/track`)}
            className="w-full bg-white text-blue-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition"
          >
            Track Handyman
          </button>
        </div>
      )}

      {/* Book a job CTA */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
            🛠️
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Need something fixed?</h2>
            <p className="text-sm text-gray-500">Book a skilled handyman in minutes</p>
          </div>
        </div>
        <Link
          to="/client/book/category"
          className="block w-full text-center bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition"
        >
          Book a Job
        </Link>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/client/jobs"
            className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          >
            <span className="text-2xl">📋</span>
            Job History
          </Link>
          <Link
            to="/client/book/category"
            className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          >
            <span className="text-2xl">⚡</span>
            New Booking
          </Link>
        </div>
      </div>

      {/* Info strip */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🛡️</span>
        <div>
          <p className="text-sm font-medium text-gray-900">Warranty included</p>
          <p className="text-xs text-gray-500 mt-0.5">All jobs come with a 90-day workmanship warranty.</p>
        </div>
      </div>
    </div>
  );
}
