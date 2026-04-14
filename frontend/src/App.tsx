import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TopNav } from './components/TopNav';
import { BottomNavMobile } from './components/BottomNavMobile';
import { ToastProvider } from './components/Toast';
import { useStore } from './store';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Client pages
import ClientHomePage from './pages/client/HomePage';
import ClientJobHistoryPage from './pages/client/JobHistoryPage';
import ClientJobDetailPage from './pages/client/JobDetailPage';
import ClientTrackingPage from './pages/client/TrackingPage';
import ClientChatPage from './pages/client/ChatPage';
import ClientPaymentPage from './pages/client/PaymentPage';
import ClientReceiptPage from './pages/client/ReceiptPage';
import ClientWarrantyPage from './pages/client/WarrantyPage';

// Client booking flow
import BookCategoryPage from './pages/client/book/CategoryPage';
import BookLocationPage from './pages/client/book/LocationPage';
import BookEstimatePage from './pages/client/book/EstimatePage';
import BookConfirmedPage from './pages/client/book/ConfirmedPage';

// Handyman pages
import HandymanJobBoardPage from './pages/handyman/JobBoardPage';
import HandymanActiveJobPage from './pages/handyman/ActiveJobPage';

// Admin pages
import AdminDashboardPage from './pages/admin/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RoleRedirect() {
  const { isAuthenticated, user } = useStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'CLIENT') return <Navigate to="/client/home" replace />;
  if (user?.role === 'HANDYMAN') return <Navigate to="/handyman/jobs" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <main className="pt-14 pb-16">
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Client routes */}
            <Route
              path="/client/home"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/book/category"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <BookCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/book/location"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <BookLocationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/book/estimate"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <BookEstimatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/book/confirmed"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <BookConfirmedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/jobs"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientJobHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/jobs/:id"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientJobDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/jobs/:id/track"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientTrackingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/jobs/:id/chat"
              element={
                <ProtectedRoute allowedRoles={['CLIENT', 'HANDYMAN']}>
                  <ClientChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/jobs/:id/payment"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientPaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/jobs/:id/receipt"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientReceiptPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/jobs/:id/warranty"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientWarrantyPage />
                </ProtectedRoute>
              }
            />

            {/* Handyman routes */}
            <Route
              path="/handyman/home"
              element={<Navigate to="/handyman/jobs" replace />}
            />
            <Route
              path="/handyman/jobs"
              element={
                <ProtectedRoute allowedRoles={['HANDYMAN']}>
                  <HandymanJobBoardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/handyman/jobs/:id"
              element={
                <ProtectedRoute allowedRoles={['HANDYMAN']}>
                  <HandymanActiveJobPage />
                </ProtectedRoute>
              }
            />

            {/* Handyman chat — shares the same ChatPage component */}
            <Route
              path="/handyman/jobs/:id/chat"
              element={
                <ProtectedRoute allowedRoles={['HANDYMAN']}>
                  <ClientChatPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ToastProvider />
        <BottomNavMobile />
      </div>
    </QueryClientProvider>
  );
}
