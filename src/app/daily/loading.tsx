import { Skeleton, SkeletonText } from '@/components/skeleton/Skeleton';

export default function DailyLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full mb-6" />
        <Skeleton className="h-8 w-28 rounded-full mb-4" />
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <SkeletonText className="w-3/4 mb-4 h-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
