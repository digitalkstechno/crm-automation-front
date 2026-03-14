'use client';

import { useEffect, useState } from 'react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setCurrentTime(time);
      setCurrentDate(date);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-white border-b border-gray-200 px-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-950 to-sky-950 text-sm font-bold text-white shadow-md transition-transform hover:scale-105">
          IC
        </div>
        <div className="text-sm font-medium text-gray-700">
          <span className="text-sky-950">{currentTime}</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-gray-600">{currentDate}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs font-bold text-gray-800 uppercase tracking-wide">ADMIN</div>
          <div className="text-xs text-gray-500">Admin</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-md transition-transform hover:scale-110 cursor-pointer">
          <svg
            className="h-6 w-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}
