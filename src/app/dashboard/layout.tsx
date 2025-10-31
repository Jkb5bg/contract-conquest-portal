'use client';
import {useState} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  FolderIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Image from "next/image";

const ADMIN_EMAILS = ['jasonlettered@gmail.com', 'jbcloses@gmail.com'];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/opportunities': 'Opportunities',
  '/dashboard/profile': 'Profile',
  '/dashboard/proposals': 'Proposals',
  '/dashboard/marketplace': 'Writer Marketplace',
  '/dashboard/bookings': 'My Bookings',
  '/dashboard/admin': 'Admin Panel',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Opportunities', href: '/dashboard/opportunities', icon: FolderIcon },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingBagIcon },
    { name: 'My Bookings', href: '/dashboard/bookings', icon: CalendarIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
    { name: 'Proposals', href: '/dashboard/proposals', icon: ChartBarIcon },
  ];

  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/dashboard/admin', icon: Cog6ToothIcon });
  }

  const currentPageTitle = PAGE_TITLES[pathname] || 'Portal';

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated - let middleware/page handle redirect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Responsive: Slide-out on mobile, fixed on desktop */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-black/30 backdrop-blur-xl border-r border-white/10 z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center">
            <Image src="/logo.svg" alt="Contract Conquest" className="h-10 w-10 mr-3" />
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Contract Conquest
                </h2>
                <p className="text-xs text-gray-500">Opportunity Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all
                    ${isActive
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="px-4 py-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center px-3 py-2 mb-2 rounded-lg bg-white/5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold">
                  {user?.email.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isAdmin ? 'Administrator' : 'Member'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all group"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive padding */}
      <div className="lg:pl-64">
        {/* Top Bar - CHANGES BASED ON PAGE - Now with mobile menu button */}
        <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>

              {/* Page title */}
              <h1 className="text-xl sm:text-2xl font-bold text-white">{currentPageTitle}</h1>

              {/* Spacer for mobile */}
              <div className="w-10 lg:hidden" />
            </div>
          </div>
        </div>

        {/* Page Content - THIS IS THE ONLY PART THAT CHANGES */}
        <main className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-73px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}