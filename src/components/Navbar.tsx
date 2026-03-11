"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { api } from "@/utils/axiosInstance";
import { baseUrl } from "../../config";
import { clearUserCache } from "@/utils/tokenHelper";

function titleFromPath(pathname: string, leadName?: string) {
  if (pathname === "/") return "Dashboard";

  // Handle lead-details with dynamic name
  if (pathname.includes("/lead-details/") && leadName) {
    return `Lead Details > ${leadName}`;
  }

  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .split("-")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ")
    )
    .join(" > ");
}

export default function Navbar() {
  const router = useRouter();
  const [leadName, setLeadName] = useState<string>();

  useEffect(() => {
    if (router.pathname.includes("/lead-details/") && router.query.id) {
      api.get(`${baseUrl.LEAD}/${router.query.id}`)
        .then(res => {
          const companyName = res.data.data?.accountMaster?.companyName;
          if (companyName) setLeadName(companyName);
        })
        .catch(() => {});
    }
  }, [router.pathname, router.query.id]);

  const title = titleFromPath(router.pathname, leadName);

  const handleLogout = () => {
    clearUserCache();
    localStorage.removeItem("token");
    localStorage.removeItem("crm:rememberEmail");
    localStorage.clear();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between rounded-2xl bg-white px-5 shadow-sm border border-gray-200">
      
      {/* Title */}
      <h1 className="text-lg font-semibold text-gray-900">
        {title}
      </h1>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 transition"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  );
}
