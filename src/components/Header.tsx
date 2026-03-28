'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { useRouter } from 'next/router';
import { Bell, CheckCircle, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { io } from 'socket.io-client';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathName = usePathname()
  const isLoginPage = pathName === "/login";

  const getLabel = () => {
    if (pathName === "/") return "Dashboard"
    if (pathName === "/leads") return "Leads"
    if (pathName === "/leads/list") return "Leads List"
    if (pathName === "/leads/kanban") return "Leads Kanban"
    if (pathName === "/setup") return "Setup"
    if (pathName === "/tasks") return "Tasks"
    return ""
  }

  // Request notification permission with user interaction
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          console.log('Notification permission granted');
          // Show a test notification to confirm it's working
          new Notification('Notifications Enabled', {
            body: 'You will now receive notifications for new tasks and leads.',
            icon: '/favicon.ico'
          });
        } else if (permission === 'denied') {
          console.log('Notification permission denied');
          // You can show a toast or tooltip here to inform the user
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  // Check notification permission status on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

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

  const fetchNotifications = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await axios.get(`${baseUrl.getBaseUrl}/notification/my-notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    let socket: any;

    axios.get(baseUrl.currentStaff, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const currentUserId = res.data?.data?._id;
        if (!currentUserId) return;
        
        const socketUrl = (process.env.NEXT_PUBLIC_IMAGE_URL || '').replace(/\/v1\/api\/?$/, '');
        socket = io(socketUrl || 'http://localhost:5000');
        
        socket.on('connect', () => {
          socket.emit('joinRoom', currentUserId);
        });

        socket.on('new_task_assigned', (notif: Notification) => {
          setNotifications(prev => [notif, ...prev]);

          // Check if browser notifications are supported and permission is granted
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              const browserNotif = new window.Notification(notif.title, {
                body: notif.message,
                icon: '/notification-icon.png', // Add your notification icon
                badge: '/badge-icon.png' // Add your badge icon for mobile
              });

              browserNotif.onclick = async () => {
                window.focus();
                try {
                  if (!notif.isRead) {
                    await axios.put(`${baseUrl.getBaseUrl}/notification/mark-read/${notif._id}`, {}, {
                      headers: { Authorization: `Bearer ${getAuthToken()}` }
                    });
                  }
                  router.push(notif.type === 'task' ? '/tasks' : '/leads/list');
                } catch (e) {
                  console.error(e);
                }
                browserNotif.close();
              };
            } else if (Notification.permission === 'default') {
              // Permission not yet asked, we can show a prompt in the notification dropdown
              // But we don't auto-request as browsers require user interaction
              console.log('Notification permission not yet granted');
            }
          }
        });
      })
      .catch(err => console.error('Failed to get user for socket', err));

    return () => {
      if (socket) socket.disconnect();
    };
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsReadSingle = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    try {
      const token = getAuthToken();
      await axios.put(`${baseUrl.getBaseUrl}/notification/mark-read/${notifId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllAsRead = async () => {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    try {
      const token = getAuthToken();
      await axios.put(`${baseUrl.getBaseUrl}/notification/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    try {
      const token = getAuthToken();
      if (!notif.isRead) {
        await axios.put(`${baseUrl.getBaseUrl}/notification/mark-read/${notif._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      }

      setShowNotifications(false);

      if (notif.type === 'task') {
        router.push(`/tasks`);
      } else if (notif.type === 'lead') {
        router.push(`/leads/list`);
      }
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;
  const totalCount = notifications.length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-white border-b border-gray-200 px-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {getLabel() || "Default Title"}
        </h1>
      </div>
      <div className="flex items-center gap-6">

        {/* Alerts / Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 max-w-[20px] max-h-[20px] overflow-hidden right-1 flex h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                  {/* Counter badge on the right side of the header */}
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {totalCount}
                  </span>
                </div>
                <div className="flex gap-2">
                  {/* Permission status indicator and request button */}
                  {notificationPermission !== 'granted' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer bg-blue-50 px-2 py-1 rounded"
                    >
                      {notificationPermission === 'denied' ? 'Enable Notifications' : 'Allow Notifications'}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Permission denied message */}
              {notificationPermission === 'denied' && (
                <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                  <p className="text-xs text-yellow-800">
                    Notifications are blocked. Please enable them in your browser settings to receive real-time updates.
                  </p>
                </div>
              )}
              
              <div className="max-h-[70vh] overflow-y-auto">
                {unreadNotifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">No new notifications</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {unreadNotifications.map(notif => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors bg-blue-50/30 group relative"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 pr-6">
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-800 line-clamp-2 pr-6">
                          {notif.message}
                        </p>
                        
                        <button 
                          onClick={(e) => markAsReadSingle(e, notif._id)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 bg-white shadow-sm rounded-full p-1 transition-all"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full width Mark all as read button at the bottom */}
              {unreadCount > 0 && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={markAllAsRead}
                    disabled={markingAllRead}
                    className="w-full px-4 py-3 text-sm bg-[#0a2352] text-white font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCheck className="w-4 h-4" />
                    {markingAllRead ? 'Marking all as read...' : `Mark all as read`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}