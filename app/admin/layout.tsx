'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Newspaper,
  Image as ImageIcon,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  FileImage,
  Cog,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
        return;
      }

      apiClient.setToken(token);
      const response = await apiClient.request<{ user: any }>('/api/auth/me', { method: 'GET' });
      setUser(response.user);
    } catch (error) {
      localStorage.removeItem('auth-token');
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    }
  };

  const handleLogout = async () => {
    await apiClient.logout();
    toast.success('Uspešno ste se odjavili');
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/igraci', label: 'Igrači', icon: Users },
    { href: '/admin/vesti', label: 'Vesti', icon: Newspaper },
    { href: '/admin/galerija', label: 'Galerija', icon: ImageIcon },
    { href: '/admin/tim', label: 'Tim i Rukovodstvo', icon: Users },
    { href: '/admin/istorijat', label: 'Istorijat', icon: BookOpen },
    { href: '/admin/status-kluba', label: 'Status Kluba', icon: Settings },
    { href: '/admin/slike', label: 'Slike', icon: FileImage },
    { href: '/admin/kontakt', label: 'Kontakt Poruke', icon: Mail },
    { href: '/admin/podesavanja', label: 'Podešavanja', icon: Cog },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header */}
      <div className="md:hidden bg-black border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-0">
        <h1 className="text-lg md:text-xl font-bold font-playfair uppercase">Admin Panel</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          id="admin-sidebar"
          className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-black border-r border-white/10 p-4 md:p-6 overflow-y-auto transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="mb-6 md:mb-8 pb-4 md:pb-6 border-b border-white/10">
            <h2 className="text-xl md:text-2xl font-bold font-playfair uppercase tracking-wider mb-1 md:mb-2">
            KŽK Partizan</h2>
            <p className="text-xs md:text-sm text-gray-400 font-montserrat">Admin Panel</p>
          </div>

          <nav className="space-y-1 md:space-y-2 mb-6 md:mb-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all font-montserrat text-sm md:text-base ${
                    isActive
                      ? 'bg-white text-black font-semibold'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} className="md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 pt-4">
            {user && (
              <div className="mb-3 md:mb-4 px-3 md:px-4 py-2 text-xs md:text-sm">
              <p className="text-gray-400 font-montserrat">Prijavljen kao</p>
              <p className="font-semibold">{user.username || user.email}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center md:justify-start space-x-2 md:space-x-3 px-3 md:px-4 py-2.5 md:py-3 text-red-400 hover:bg-white/10 rounded-lg transition-all font-montserrat text-sm md:text-base">
            <LogOut size={18} className="md:w-5 md:h-5 flex-shrink-0" />
            <span className="truncate">Odjavi Se</span>
          </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full md:w-auto min-w-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
