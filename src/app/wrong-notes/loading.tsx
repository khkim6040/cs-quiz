import { Skeleton, SkeletonCard } from '@/components/skeleton/Skeleton';

export default function WrongNotesLoading() {
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
        <div className="grid grid-cols-2 gap-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex gap-2 mb-2">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
