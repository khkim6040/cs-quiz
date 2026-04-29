interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 ${className}`}>
      <SkeletonText className="w-1/3 mb-3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}
