
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  Clock,
  UsersRound,
  ClipboardList,
  Settings,
  CreditCard,
  PieChart,
  PanelLeft,
  LogOut,
  Calendar,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Navigation items for sidebar
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Quadras & Áreas', path: '/admin/quadras', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Horários', path: '/admin/horarios', icon: <CalendarRange className="h-5 w-5" /> },
    { name: 'Reservas', path: '/admin/reservas', icon: <Clock className="h-5 w-5" /> },
    { name: 'Pagamentos', path: '/admin/pagamentos', icon: <CreditCard className="h-5 w-5" /> },
    { name: 'Usuários', path: '/admin/usuarios', icon: <UsersRound className="h-5 w-5" /> },
    { name: 'Personalização', path: '/admin/personalizacao', icon: <Settings className="h-5 w-5" /> },
    { name: 'Integrações', path: '/admin/integracoes', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Relatórios', path: '/admin/relatorios', icon: <PieChart className="h-5 w-5" /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r shadow-sm transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo and brand section */}
          <div className="p-4 flex items-center justify-between border-b">
            {!sidebarCollapsed && (
              <Link to="/admin" className="text-lg font-semibold text-primary">
                BookaQuadra
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-full p-1.5"
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto pt-5 pb-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        isActive ? "bg-accent text-primary" : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Bottom section - Logout */}
          <div className="p-4 border-t">
            <Button
              variant="ghost" 
              onClick={handleLogout}
              className={cn(
                "flex items-center w-full",
                "text-gray-700 hover:bg-gray-100"
              )}
            >
              <LogOut className="h-5 w-5 mr-3" />
              {!sidebarCollapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center px-6">
          <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
