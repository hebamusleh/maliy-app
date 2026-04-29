"use client";

/**
 * Skeleton Loading Components
 * Display placeholder UI while content is loading
 */

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg h-32 animate-pulse ${className}`}
    />
  );
}

export function SkeletonText({ className = "", count = 1 }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded h-4 animate-pulse ${
            i === count - 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonLine({
  className = "",
  width = "w-full",
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded h-3 animate-pulse ${width} ${className}`}
    />
  );
}

export function SkeletonCircle({
  className = "",
  size = "w-12 h-12",
}: {
  className?: string;
  size?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-pulse ${size} ${className}`}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="p-4 border border-gray-200 rounded-lg space-y-3">
      <div className="flex items-center justify-between mb-4">
        <SkeletonCircle size="w-10 h-10" />
        <SkeletonLine width="w-1/3" />
      </div>
      <SkeletonText count={2} />
      <div className="flex gap-2 pt-2">
        <SkeletonLine width="w-1/3" />
        <SkeletonLine width="w-1/3" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg">
            <SkeletonText count={1} />
            <div className="mt-4 h-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <SkeletonText count={4} className="mb-4" />
      </div>
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
      <SkeletonText count={1} />
      <SkeletonLine width="w-full" />
      <div className="grid grid-cols-2 gap-4">
        <SkeletonLine />
        <SkeletonLine />
      </div>
      <SkeletonLine width="w-1/3" />
    </div>
  );
}
