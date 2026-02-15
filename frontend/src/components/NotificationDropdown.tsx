
import React, { useEffect, useState, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markAsRead, deleteNotification, type Notification } from '../services/notification.service';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        enabled: !!user,
        refetchInterval: 60000,
    });

    const readMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    useEffect(() => {
        if (!user) return;

        const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

        socket.on('connect', () => {
            console.log('Connected to socket for notifications');
        });

        socket.on('newIncident', (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success(`New Ticket: ${data.title}`, {
                icon: '🎫',
                style: { borderRadius: '10px', background: '#18181b', color: '#fff', border: '1px solid #27272a' },
            });
        });

        socket.on(`incidentUpdate:${user.id}`, (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            if (data.type === 'ASSIGNMENT') {
                toast(`You have been assigned: ${data.title}`, {
                    icon: '👤',
                    style: { borderRadius: '10px', background: '#18181b', color: '#fff', border: '1px solid #3b82f6' },
                });
            } else if (data.type === 'BULK_ASSIGNMENT') {
                toast(`You have been assigned ${data.count} incidents`, {
                    icon: '📚',
                    style: { borderRadius: '10px', background: '#18181b', color: '#fff', border: '1px solid #3b82f6' },
                });
            } else {
                toast(`Incident Updated: ${data.title || 'View details'}`, {
                    icon: '🔔',
                    style: { borderRadius: '10px', background: '#18181b', color: '#fff', border: '1px solid #27272a' },
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user, queryClient]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        readMutation.mutate(id);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteMutation.mutate(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-white/5 text-gray-400 relative transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0c] animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-black rounded-xl shadow-2xl border border-zinc-800 overflow-hidden z-50">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        <span className="text-xs text-zinc-400 bg-zinc-900 px-2 py-1 rounded-full">{unreadCount} unread</span>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={clsx(
                                            "p-4 hover:bg-zinc-900 transition-colors group relative border-b border-zinc-800 last:border-0",
                                            !notification.read ? "bg-zinc-900/50" : ""
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className={clsx(
                                                "w-2 h-2 mt-2 rounded-full shrink-0",
                                                notification.type === 'SUCCESS' ? "bg-green-500" :
                                                    notification.type === 'WARNING' ? "bg-yellow-500" :
                                                        notification.type === 'ERROR' ? "bg-red-500" : "bg-blue-500"
                                            )} />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={clsx("text-sm font-medium", !notification.read ? "text-white" : "text-gray-300")}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 shrink-0 ml-2">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0a0c]/80 backdrop-blur-sm p-1 rounded-lg border border-white/5">
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => handleMarkRead(notification._id, e)}
                                                    className="p-1.5 hover:bg-white/10 rounded-md text-primary"
                                                    title="Mark as read"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(notification._id, e)}
                                                className="p-1.5 hover:bg-white/10 rounded-md text-red-400"
                                                title="Delete"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
