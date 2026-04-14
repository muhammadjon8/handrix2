import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin';
import { useStore } from '../../store';
import { LoadingSpinner } from '../../components/LoadingSpinner';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const JOB_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  MATCHED: 'bg-purple-100 text-purple-700',
  EN_ROUTE: 'bg-blue-100 text-blue-700',
  ARRIVED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function AdminDashboardPage() {
  const { addToast } = useStore();
  const queryClient = useQueryClient();
  const [jobStatusFilter, setJobStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const JOB_LIMIT = 20;

  // Stats — auto-refresh every 60s
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard(),
    refetchInterval: 60000,
  });

  // Jobs table
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['adminJobs', jobStatusFilter, jobPage],
    queryFn: () => adminService.getAdminJobs({ status: jobStatusFilter || undefined, page: jobPage, limit: JOB_LIMIT }),
    keepPreviousData: true,
  } as Parameters<typeof useQuery>[0]);

  // Handymen table
  const { data: handymenData, isLoading: handymenLoading } = useQuery({
    queryKey: ['adminHandymen'],
    queryFn: () => adminService.getHandymen(),
    refetchInterval: 30000,
  });

  const vetMutation = useMutation({
    mutationFn: ({ id, isVetted }: { id: string; isVetted: boolean }) => adminService.vetHandyman(id, isVetted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHandymen'] });
      addToast('Handyman status updated', 'success');
    },
    onError: () => addToast('Failed to update handyman', 'error'),
  });

  const jobs: Array<{ jobId: string; category: string; status: string; clientId?: string; handymanId?: string; quotedPrice?: number; finalPrice?: number; createdAt: string }> = (jobsData as { jobs?: typeof jobs })?.jobs ?? [];
  const jobsTotal: number = (jobsData as { total?: number })?.total ?? 0;
  const handymen = handymenData?.handymen ?? [];
  const hasMoreJobs = jobPage * JOB_LIMIT < jobsTotal;

  // Client-side search filter on handymen
  const filteredHandymen = searchQuery
    ? handymen.filter((h) => h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : handymen;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats cards */}
      {statsLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Active Jobs"
            value={stats?.activeJobs ?? 0}
            icon="⚡"
            color="blue"
          />
          <StatCard
            label="Available Handymen"
            value={stats?.availableHandymen ?? 0}
            icon="🔧"
            color="green"
          />
          <StatCard
            label="Revenue Today"
            value={fmt(stats?.revenueToday ?? 0)}
            icon="💰"
            color="purple"
          />
        </div>
      )}

      {/* Jobs table */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-gray-900">Jobs</h2>
          <select
            value={jobStatusFilter}
            onChange={(e) => { setJobStatusFilter(e.target.value); setJobPage(1); }}
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="MATCHED">Matched</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="ARRIVED">Arrived</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {jobsLoading ? (
          <LoadingSpinner />
        ) : jobs.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No jobs found.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Job ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map((job) => (
                    <tr key={job.jobId} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{job.jobId.slice(0, 8)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{job.category}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${JOB_STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {job.finalPrice != null ? fmt(job.finalPrice) : job.quotedPrice != null ? `${fmt(job.quotedPrice)} est.` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMoreJobs && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => setJobPage((p) => p + 1)}
                  className="w-full py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Handymen table */}
      <section>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-gray-900">Handymen</h2>
          <input
            type="search"
            placeholder="Search by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
            aria-label="Search handymen"
          />
        </div>

        {handymenLoading ? (
          <LoadingSpinner />
        ) : filteredHandymen.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No handymen found.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vetted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredHandymen.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                      <td className="px-4 py-3 text-yellow-500">
                        {h.rating > 0 ? `★ ${h.rating.toFixed(1)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {h.skills.slice(0, 3).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s}</span>
                          ))}
                          {h.skills.length > 3 && (
                            <span className="text-xs text-gray-400">+{h.skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`w-2 h-2 rounded-full inline-block ${h.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="ml-1.5 text-xs text-gray-500">{h.isActive ? 'Online' : 'Offline'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {h.isVetted
                          ? <span className="text-green-600 text-xs font-semibold">✓ Vetted</span>
                          : <span className="text-gray-400 text-xs">Unvetted</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => vetMutation.mutate({ id: h.id, isVetted: !h.isVetted })}
                          disabled={vetMutation.isPending}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 ${
                            h.isVetted
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {h.isVetted ? 'Unvet' : 'Vet'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: 'blue' | 'green' | 'purple' }) {
  const colorMap = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  const textMap = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    purple: 'text-purple-900',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${textMap[color]}`}>{value}</p>
    </div>
  );
}
