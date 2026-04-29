import React from 'react';

export function CardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="skeleton" style={{ paddingTop: '140%', position: 'relative' }}>
        <div className="absolute inset-0 bg-navy-700" />
      </div>
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton h-2 w-1/2 rounded" />
        <div className="skeleton h-7 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="skeleton h-3 w-1/2 rounded mb-3" />
      <div className="skeleton h-8 w-1/3 rounded" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card p-4 flex items-center gap-4 animate-pulse">
          <div className="skeleton w-12 h-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-2/3 rounded" />
            <div className="skeleton h-2 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
