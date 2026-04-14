import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { authService } from '../services/auth';

export function TopNav() {
  const { user, clearAuth } = useStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    navigate('/login');
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
      <Link to="/" className="font-bold text-lg text-blue-600 tracking-tight">Handrix</Link>
      <div className="relative">
        <button
          aria-label="Open user menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md p-1"
        >
          <span className="hidden sm:block">{user?.name}</span>
          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
