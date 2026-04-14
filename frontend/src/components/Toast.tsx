import { useStore } from '../store';

const colours = {
  info: 'bg-gray-900 text-white',
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
};

export function ToastProvider() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-20 inset-x-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`max-w-sm w-full flex items-center justify-between px-4 py-3 rounded-xl shadow-lg pointer-events-auto text-sm ${colours[t.type]}`}
        >
          <span>{t.message}</span>
          <button
            aria-label="Dismiss"
            onClick={() => removeToast(t.id)}
            className="ml-3 opacity-70 hover:opacity-100 focus:outline-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
