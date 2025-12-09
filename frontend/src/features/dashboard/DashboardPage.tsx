import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, ArrowRight } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../auth/useAuth';
import { useBookingStream } from '../../hooks/useBookingStream';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { isConnected } = useBookingStream();

  return (
    <Layout isConnected={isConnected}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-primary/10 via-white to-secondary/10 rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Manage your room bookings and view real-time availability.
          </p>
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* View Availability */}
          <Link
            to="/availability"
            className="group bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-primary/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">View Availability</h4>
                  <p className="text-sm text-gray-500">
                    Check room availability and book a slot
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* My Bookings */}
          <Link
            to="/my-bookings"
            className="group bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-secondary/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <ClipboardList className="w-7 h-7 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">My Bookings</h4>
                  <p className="text-sm text-gray-500">
                    View and manage your reservations
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🕐</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Working Hours</h4>
            <p className="text-sm text-gray-500">
              Rooms available from 8:00 AM to 6:00 PM daily
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">📡</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Real-time Updates</h4>
            <p className="text-sm text-gray-500">
              Availability updates instantly when bookings change
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🔄</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Flexible Booking</h4>
            <p className="text-sm text-gray-500">
              Reschedule or cancel bookings anytime
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
};
