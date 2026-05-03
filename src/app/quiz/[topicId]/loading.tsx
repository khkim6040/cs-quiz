import { Skeleton, SkeletonText } from '@/components/skeleton/Skeleton';

export default function QuizLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <SkeletonText className="w-3/4 mb-4 h-6" />
          <SkeletonText className="w-full mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  );
}
