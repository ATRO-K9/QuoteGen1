import React from 'react';
import { Bell, User, Search, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface HeaderProps {
  isMobile: boolean;
}

const Header: React.FC<HeaderProps> = ({ isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-slate-900">
        {location.pathname === '/' ? 'Dashboard' :
         location.pathname.startsWith('/customers') ? 'Customers' :
         location.pathname.startsWith('/projects') ? 'Projects' :
         location.pathname.startsWith('/quotations') ? 'Quotations' :
         location.pathname.startsWith('/settings') ? 'Settings' : 'QuoteGen'}
      </h1>
      
      <div className="flex items-center space-x-4">
        {!isMobile && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="py-1.5 pl-9 pr-4 w-64 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        <button className="p-1.5 rounded-full hover:bg-slate-100 relative">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
          {!isMobile && (
            <span className="text-sm font-medium text-slate-700">Admin User</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          icon={<LogOut size={16} />}
        >
          {!isMobile && 'Logout'}
        </Button>
      </div>
    </header>
  );
};

export default Header;