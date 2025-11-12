import React from "react";

interface WeekNavigationProps {
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  weekLabel: string;
}

export default function WeekNavigation({
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  weekLabel,
}: WeekNavigationProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onPreviousWeek}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tuần trước
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{weekLabel}</h3>
          <button
            onClick={onCurrentWeek}
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-1"
          >
            Về tuần hiện tại
          </button>
        </div>

        <button
          onClick={onNextWeek}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
        >
          Tuần sau
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
