interface Props {
  fullscreen?: boolean;
}

export function LoadingSpinner({ fullscreen }: Props) {
  const spinner = (
    <div
      role="status"
      aria-label="Loading"
      className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"
    />
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center py-8">{spinner}</div>;
}
