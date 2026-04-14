interface Props {
  laborCost: number;
  materialCost: number;
  transportCost: number;
  total: number;
  currency?: string;
  finalPrice?: number | null;
}

function fmt(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

export function PriceBreakdown({ laborCost, materialCost, transportCost, total, currency = 'USD', finalPrice }: Props) {
  const showDiff = finalPrice != null && Math.abs(finalPrice - total) > 0.01;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">Price Breakdown</h3>
      <div className="space-y-2 text-sm">
        {[
          { label: 'Labor', value: laborCost },
          { label: 'Materials', value: materialCost },
          { label: 'Transport', value: transportCost },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-gray-600">
            <span>{row.label}</span>
            <span>{fmt(row.value, currency)}</span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
          <span>{showDiff ? 'Quoted Total' : 'Total'}</span>
          <span>{fmt(total, currency)}</span>
        </div>
        {showDiff && (
          <>
            <div className="flex justify-between font-bold text-blue-600">
              <span>Final Price</span>
              <span>{fmt(finalPrice!, currency)}</span>
            </div>
            <p className="text-xs text-gray-500 bg-yellow-50 rounded-lg p-2">
              The final price differs from the initial estimate due to actual materials or time used.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
