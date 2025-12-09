import { type ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, LogOut, User, Wifi, WifiOff, Shield } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';

interface LayoutProps {
  children: ReactNode;
  isConnected?: boolean;
}

export const Layout = ({ children, isConnected }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build nav links based on user role
  const navLinks = useMemo(() => {
    const links = [
      { path: '/availability', label: 'Availability', icon: Calendar },
      { path: '/my-bookings', label: 'My Bookings', icon: ClipboardList },
    ];

    // Add admin dashboard link for admins
    if (user?.role === 'admin') {
      links.push({ path: '/admin/dashboard', label: 'Admin', icon: Shield });
    }

    return links;
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="text-xl font-bold text-neutral">
              <span className="text-primary">Book</span>Space
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path || 
                  (link.path === '/admin/dashboard' && location.pathname.startsWith('/admin'));
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Connection status */}
              {isConnected !== undefined && (
                <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-secondary' : 'text-gray-400'}`}>
                  {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
                </div>
              )}

              {/* User info */}
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">{user?.name}</span>
                {user?.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Admin
                  </span>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-100">
          <div className="flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path ||
                (link.path === '/admin/dashboard' && location.pathname.startsWith('/admin'));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
};
