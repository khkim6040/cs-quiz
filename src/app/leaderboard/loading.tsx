import { Skeleton } from '@/components/skeleton/Skeleton';

export default function LeaderboardLoading() {
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border-2 border-orange-100 dark:border-gray-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-5 w-24" />
              <div className="ml-auto flex gap-4">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
