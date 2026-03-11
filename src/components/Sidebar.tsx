"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User2,
  CalendarClock,
  Settings,
  ArrowLeft,
  Users,
  Package,
  ChevronDown,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Factory,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getTokenData } from "@/utils/tokenHelper";

type SidebarProps = {
  collapsed: boolean;
};

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [view, setView] = useState<"main" | "settings">("main");
  const [userRoleOpen, setUserRoleOpen] = useState(false);
  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await getTokenData(true); // Force refresh on mount
      setTokenData(data);
    };
    
    fetchUserData();

    if (pathname.startsWith("/settings")) {
      setView("settings");
      if (pathname === "/settings/staff" || pathname === "/settings/role") {
        setUserRoleOpen(true);
      }
      if (pathname === "/settings/customization-type" || pathname === "/settings/inquiry-category" || 
          pathname === "/settings/model-suggestion" || pathname === "/settings/client-type" || 
          pathname === "/settings/source-from" || pathname === "/settings/color") {
        setMasterDataOpen(true);
      }
    }
    
    setTimeout(() => setIsInitialized(true), 50);
  }, [pathname]);

  useEffect(() => {
    if (!isInitialized) return;
    
    if (pathname.startsWith("/settings")) {
      setView("settings");
    } else {
      setView("main");
    }
  }, [pathname, isInitialized]);

  const isActive = (path: string) => pathname === path;

  if (!tokenData) return null;

  return (
    <aside
      className={`flex h-screen shrink-0 ${collapsed ? "w-16" : "w-64"
        } transition-all duration-300`}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-r-2xl bg-white shadow-xl border-r border-gray-200">

        <div className="flex h-16 items-center border-b border-gray-200 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md">
              M
            </div>

            {!collapsed && (
              <div>
                <div className="text-gray-900 font-bold text-sm">
                  MOZU CRM
                </div>
                <div className="text-xs text-gray-500">
                  Business Dashboard
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            className={`flex h-full ${isInitialized ? 'transition-transform duration-300' : ''} ${view === "settings" ? "-translate-x-full" : "translate-x-0"
              }`}
          >

            <div className="w-full shrink-0 px-3 py-4 space-y-1">

              {tokenData.canAccessDashboard && (
                <Link
                  href="/"
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive("/")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive("/") ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}>
                    <Home className="h-4 w-4" />
                  </div>
                  {!collapsed && "Dashboard"}
                </Link>
              )}

              {tokenData.canAccessAccountMaster && (
                <Link
                  href="/account-master"
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive("/account-master")
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive("/account-master") ? "bg-green-600 text-white" : "bg-green-100 text-green-600"}`}>
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  {!collapsed && "Account Master"}
                </Link>
              )}

              {tokenData.canAccessLeads && (
                <Link
                  href="/leads"
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive("/leads")
                    ? "bg-purple-50 text-purple-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive("/leads") ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-600"}`}>
                    <User2 className="h-4 w-4" />
                  </div>
                  {!collapsed && "Leads"}
                </Link>
              )}

              {tokenData.canAccessProduction && (
                <Link
                  href="/production"
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${(isActive("/production") || isActive("/add-production"))
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(isActive("/production") || isActive("/add-production")) ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"}`}>
                    <Factory className="h-4 w-4" />
                  </div>
                  {!collapsed && "Production"}
                </Link>
              )}

              {tokenData.canAccessReports && (
                <Link
                  href="/reports"
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isActive("/reports")
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive("/reports") ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-600"}`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  {!collapsed && "Reports"}
                </Link>
              )}

              {tokenData.canAccessSettings && (
                <button
                  onClick={() => setView("settings")}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${pathname.startsWith("/settings")
                    ? "bg-orange-50 text-orange-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${pathname.startsWith("/settings") ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-600"}`}>
                    <Settings className="h-4 w-4" />
                  </div>
                  {!collapsed && "Settings"}
                </button>
              )}
            </div>

            <div className="w-full shrink-0 px-3 py-4 space-y-1">

              <button
                onClick={() => setView("main")}
                className="flex items-center gap-2 text-gray-700 px-3 py-2 mb-3 hover:bg-gray-100 rounded-lg transition font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                {!collapsed && "Back"}
              </button>

              <div>
                <button
                  onClick={() => {
                    setUserRoleOpen(!userRoleOpen);
                    setMasterDataOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition ${(pathname === "/settings/staff" || pathname === "/settings/role")
                    ? "bg-cyan-50 text-cyan-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(pathname === "/settings/staff" || pathname === "/settings/role") ? "bg-cyan-600 text-white" : "bg-cyan-100 text-cyan-600"}`}>
                      <Users className="h-4 w-4" />
                    </div>
                    {!collapsed && "User & Role"}
                  </div>
                  {!collapsed && (
                    userRoleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {userRoleOpen && !collapsed && (
                  <div className="ml-11 mt-1 space-y-1">
                    <Link
                      href="/settings/staff"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/staff")
                        ? "bg-cyan-50 text-cyan-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      User
                    </Link>
                    <Link
                      href="/settings/role"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/role")
                        ? "bg-cyan-50 text-cyan-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      Role
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => {
                    setMasterDataOpen(!masterDataOpen);
                    setUserRoleOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition ${(
                    pathname === "/settings/customization-type" || 
                    pathname === "/settings/inquiry-category" || 
                    pathname === "/settings/model-suggestion" || 
                    pathname === "/settings/client-type" || 
                    pathname === "/settings/source-from" ||
                    pathname === "/settings/color"
                  )
                    ? "bg-purple-50 text-purple-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(
                      pathname === "/settings/customization-type" || 
                      pathname === "/settings/inquiry-category" || 
                      pathname === "/settings/model-suggestion" || 
                      pathname === "/settings/client-type" || 
                      pathname === "/settings/source-from" ||
                      pathname === "/settings/color"
                    ) ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-600"}`}>
                      <Package className="h-4 w-4" />
                    </div>
                    {!collapsed && "Master Data"}
                  </div>
                  {!collapsed && (
                    masterDataOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {masterDataOpen && !collapsed && (
                  <div className="ml-11 mt-1 space-y-1">
                    <Link
                      href="/settings/customization-type"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/customization-type")
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      Customization Type
                    </Link>
                    <Link
                      href="/settings/inquiry-category"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/inquiry-category")
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      Inquiry Category
                    </Link>
                    <Link
                      href="/settings/model-suggestion"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/model-suggestion")
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      Model Suggestion
                    </Link>
                    <Link
                      href="/settings/color"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/color")
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      Color
                    </Link>
                    <Link
                      href="/settings/client-type"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/client-type")
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      Client Type
                    </Link>
                    <Link
                      href="/settings/source-from"
                      className={`block rounded-lg px-3 py-2 text-sm transition ${isActive("/settings/source-from")
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                      Source From
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-auto border-t border-gray-200 px-3 py-3 bg-gray-50">
          <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm">
              {tokenData.fullName?.charAt(0).toUpperCase()}
            </div>

            {!collapsed && (
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {tokenData.fullName}
                </div>
                <div className="text-xs text-gray-500">
                  {tokenData.roleName}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
}
