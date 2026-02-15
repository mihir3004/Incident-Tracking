import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    AlertTriangle,
    Users,
    LogOut,
    History,
    ShieldAlert
} from 'lucide-react';
import { clsx } from 'clsx';
import NotificationDropdown from './NotificationDropdown';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
        { name: 'Report Incident', path: '/report', icon: AlertTriangle, roles: ['USER'] },
        { name: 'Incidents', path: '/incidents', icon: ShieldAlert, roles: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
        { name: 'User Management', path: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
        { name: 'Audit Logs', path: '/logs', icon: History, roles: ['SUPER_ADMIN'] },
    ];

    const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

    return (
        <div className="flex h-screen bg-[#0a0a0c] text-white">
            <aside className="w-64 glass border-r border-white/10 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                        <ShieldAlert className="text-[#a855f7]" />
                        SIRS
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {filteredNav.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                location.pathname === item.path
                                    ? "bg-primary/20 text-primary border border-primary/30"
                                    : "hover:bg-white/5 text-gray-400 hover:text-white"
                            )}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                            <span className="text-primary font-bold">{user?.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-auto flex flex-col">
                <header className="h-16 flex items-center justify-between px-8 glass border-b border-white/10 sticky top-0 z-10">
                    <h2 className="text-xl font-semibold">
                        {navItems.find(n => n.path === location.pathname)?.name || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <NotificationDropdown />
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
