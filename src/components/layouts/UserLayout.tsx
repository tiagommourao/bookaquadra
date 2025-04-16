
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, User, Clock, Trophy } from 'lucide-react';

interface UserLayoutProps {
  children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Navigation items for bottom bar
  const navItems = [
    { name: 'Início', path: '/', icon: <Home className="h-6 w-6" /> },
    { name: 'Reservar', path: '/reservar', icon: <Calendar className="h-6 w-6" /> },
    { name: 'Minhas Reservas', path: '/minhas-reservas', icon: <Clock className="h-6 w-6" /> },
    { name: 'Social', path: '/social', icon: <Trophy className="h-6 w-6" /> },
    { name: 'Conta', path: '/conta', icon: <User className="h-6 w-6" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main content area */}
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      {/* Bottom navigation - mobile first */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
        <nav className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 ${
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
