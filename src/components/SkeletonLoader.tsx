import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Hero Card Skeleton */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800/60 p-6 h-64 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-6 w-36 bg-slate-800 rounded-xl" />
            <div className="h-4 w-24 bg-slate-800/80 rounded-lg" />
          </div>
          <div className="h-12 w-12 bg-slate-800 rounded-2xl" />
        </div>

        <div className="space-y-2">
          <div className="h-16 w-32 bg-slate-800 rounded-2xl" />
          <div className="h-4 w-44 bg-slate-800/80 rounded-lg" />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50">
          <div className="h-10 bg-slate-800/60 rounded-xl" />
          <div className="h-10 bg-slate-800/60 rounded-xl" />
          <div className="h-10 bg-slate-800/60 rounded-xl" />
        </div>
      </div>

      {/* Hourly Skeleton */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800/60 p-5 space-y-4">
        <div className="h-5 w-32 bg-slate-800 rounded-lg" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[76px] h-24 bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* 7-Day Skeleton */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800/60 p-5 space-y-3">
        <div className="h-5 w-28 bg-slate-800 rounded-lg mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-800/50 rounded-xl" />
        ))}
      </div>
    </div>
  );
};
