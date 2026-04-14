interface Props {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, loading }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{body}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
