'use client';

import React from "react"
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  RefreshCw,
  ChevronDown,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Menu,
  CheckSquare,
} from 'lucide-react';
import { useRouter } from "next/navigation";
import axios from "axios";
import { baseUrl, clearAuthToken, getAuthToken } from "@/config";
import Swal from 'sweetalert2';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  children?: MenuItem[];
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [canViewLead, setCanViewLead] = useState(false);
  const [canViewTask, setCanViewTask] = useState(false);
  const [canViewStaff, setCanViewStaff] = useState(false);
  const [canViewRole, setCanViewRole] = useState(false);
  const [canViewLeadStatus, setCanViewLeadStatus] = useState(false);
  const [canViewLeadSource, setCanViewLeadSource] = useState(false);
  const [canViewLeadLabel, setCanViewLeadLabel] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    axios
      .get(baseUrl.currentStaff, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions)
          ? role.permissions[0]
          : role.permissions || {};
        const leadPerms = rawPerms.lead || {};
        const taskPerms = rawPerms.task || {};
        const staffPerms = rawPerms.staff || {};
        const rolePerms = rawPerms.role || {};
        const leadStatusPerms = rawPerms.leadStatus || {};
        const leadSourcePerms = rawPerms.leadSource || {};
        const leadLabelPerms = rawPerms.leadLabel || {};

        setCanViewLead(!!(leadPerms.readOwn || leadPerms.readAll));
        setCanViewTask(!!(taskPerms.readOwn || taskPerms.readAll));
        setCanViewStaff(!!staffPerms.readAll);
        setCanViewRole(!!rolePerms.readAll);
        setCanViewLeadStatus(!!leadStatusPerms.readAll);
        setCanViewLeadSource(!!leadSourcePerms.readAll);
        setCanViewLeadLabel(!!leadLabelPerms.readAll);
      })
      .catch(() => {
        setCanViewLead(false);
        setCanViewTask(false);
        setCanViewStaff(false);
        setCanViewRole(false);
        setCanViewLeadStatus(false);
        setCanViewLeadSource(false);
        setCanViewLeadLabel(false);
      });
  }, []);

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  ];

  if (canViewLead) {
    menuItems.push({ icon: UserPlus, label: "Lead", path: "/leads" });
  }

  if (canViewTask) {
    menuItems.push({ icon: CheckSquare, label: "Tasks", path: "/tasks" });
  }

  const hasAnySetupPerm = canViewStaff || canViewRole || canViewLeadStatus || canViewLeadSource || canViewLeadLabel;

  // if (hasAnySetupPerm) {
    menuItems.push({
      icon: Settings,
      label: "Setup",
      path: "/setup",
    });
  // }

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      background: '#fff',
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Logging out...',
          text: 'Please wait',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Perform logout
        clearAuthToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("auth");
        }
        
        // Show success message
        Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          router.replace("/login");
        });
      }
    });
  };

  const handleNavigation = (path?: string) => {
    if (path) {
      router.push(path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen text-white shadow-sidebar transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-20'
        }`}
        style={{ background: '#ffffff', borderRight: '1px solid #f0ece4' }}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${isOpen ? 'justify-between' : 'justify-center'}`}>
            {isOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm" style={{ background: 'linear-gradient(135deg, #C5A059, #a8843a)', color: '#fff' }}>
                    LF
                  </div>
                  <span className="text-base font-semibold tracking-wide" style={{ color: '#C5A059' }}>LeadFlow</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100"
                  aria-label="Toggle sidebar"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </button>
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = !!item.children;
                const expanded = expandedItems.has(item.label);
                const isItemActive = isActive(item.path);

                return (
                  <li key={item.label}>
                    {hasChildren ? (
                      <div>
                        <button
                          onClick={() => toggleExpand(item.label)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                            expanded ? 'bg-amber-50 text-gray-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: expanded ? '#C5A059' : '#9ca3af' }} />
                          {isOpen && (
                            <>
                              <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </button>

                        {isOpen && expanded && (
                          <ul className="mt-1 ml-4 space-y-0.5 border-l pl-3" style={{ borderColor: 'rgba(197,160,89,0.3)' }}>
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = isActive(child.path);
                              return (
                                <li key={child.label}>
                                  <button
                                    onClick={() => handleNavigation(child.path)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                                      isChildActive ? 'text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                    }`}
                                    style={isChildActive ? { background: 'rgba(197,160,89,0.12)', borderLeft: '2px solid #C5A059' } : {}}
                                  >
                                    <ChildIcon className="h-4 w-4 flex-shrink-0" style={{ color: isChildActive ? '#C5A059' : '#9ca3af' }} />
                                    <span>{child.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          isItemActive ? 'text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                        style={isItemActive ? { background: 'rgba(197,160,89,0.12)', borderLeft: '2px solid #C5A059' } : {}}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: isItemActive ? '#C5A059' : '#9ca3af' }} />
                        {isOpen && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}