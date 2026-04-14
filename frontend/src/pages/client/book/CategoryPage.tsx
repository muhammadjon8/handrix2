import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { categoriesService } from '../../../services/categories';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { Category } from '../../../types';

const CATEGORY_EMOJIS: Record<string, string> = {
  plumbing: '🚿',
  electrical: '⚡',
  carpentry: '🪚',
  painting: '🖌️',
  cleaning: '🧹',
  hvac: '❄️',
  roofing: '🏠',
  landscaping: '🌿',
  appliance: '🔌',
  locksmith: '🔑',
};

function categoryEmoji(name: string, iconUrl: string): string {
  if (iconUrl) return '';
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '🔧';
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function BookCategoryPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategories,
  });

  function handleSelect(cat: Category) {
    navigate('/client/book/location', {
      state: { categoryId: cat.id, categoryName: cat.name },
    });
  }

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Failed to load categories.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  const categories = data?.categories ?? [];

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 1 of 4</p>
        <h1 className="text-2xl font-bold text-gray-900">What do you need?</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a service category to get started</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 ${i === 0 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No categories available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categories.map((cat) => {
            const emoji = categoryEmoji(cat.name, cat.iconUrl);
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat)}
                className="group relative bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-blue-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-150 active:scale-95"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  {cat.iconUrl ? (
                    <img src={cat.iconUrl} alt="" className="w-6 h-6" />
                  ) : (
                    <span className="text-2xl" aria-hidden="true">{emoji}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                {cat.basePrice > 0 && (
                  <span className="text-xs text-gray-400">From {fmt(cat.basePrice)}</span>
                )}
                {cat.estimatedDuration > 0 && (
                  <span className="text-xs text-gray-400">{cat.estimatedDuration} min est.</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
