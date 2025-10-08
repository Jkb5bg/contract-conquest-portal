'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  FolderIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Opportunities', href: '/opportunities', icon: FolderIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-black/20 backdrop-blur-lg border-r border-white/10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-white/10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Contract Conquest
            </h2>
            <p className="text-xs text-gray-500 mt-1">Opportunity Portal</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all
                    ${isActive 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center px-3 py-2">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.client_id}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-2 w-full flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:bg-white/5 hover:text-white transition-all"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-white">
              {navigation.find(n => n.href === pathname)?.name || 'Portal'}
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-purple-500"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
