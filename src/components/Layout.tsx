'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({
  children,
  label,
}: {
  children: React.ReactNode;
  label: any;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#ffffff]">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: isSidebarOpen ? '256px' : '80px' }}
      >
        <main className="animate-in fade-in duration-300">
          <div className=" p-4 border border-gray-200 shadow-lg  w-full">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{label}</h1>
              </div>
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
