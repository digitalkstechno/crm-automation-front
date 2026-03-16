import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathName = usePathname()
  const getLabel = () => {
    if (pathName === "/") return "Dashboard"
    if (pathName === "/leads") return "Leads"
    if (pathName === "/setup") return "Setup"
    if (pathName === "/kanban") return "Kanban Leads"
    return "Default Title"
  }

  return (
    <div className={poppins.className}>
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
            <div className="p-4 border border-gray-200 shadow-lg w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {getLabel() || "Default Title"}
                  </h1>
                </div>
              </div>
            </div>
            <div className="p-6">
              <Component {...pageProps} />
            </div>
          </main>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}