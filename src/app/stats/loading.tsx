import { Skeleton, SkeletonCard } from '@/components/skeleton/Skeleton';

export default function StatsLoading() {
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 md:h-80 w-full rounded" />
        </div>
      </div>
    </main>
  );
}
