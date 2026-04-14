import { NavLink } from 'react-router-dom';
import { useStore } from '../store';

const clientTabs = [
  { to: '/client/home', label: 'Home', icon: '🏠' },
  { to: '/client/jobs', label: 'My Jobs', icon: '📋' },
  { to: '/client/chat', label: 'Chat', icon: '💬' },
  { to: '/client/profile', label: 'Profile', icon: '👤' },
];

export function BottomNavMobile() {
  const { user } = useStore();
  if (user?.role !== 'CLIENT') return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex sm:hidden"
      aria-label="Mobile navigation"
    >
      {clientTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-xs gap-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`
          }
        >
          <span aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
