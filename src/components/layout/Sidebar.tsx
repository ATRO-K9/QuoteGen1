import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Button from '../ui/Button';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { 
      icon: <LayoutDashboard size={20} />, 
      label: 'Dashboard', 
      path: '/' 
    },
    { 
      icon: <Users size={20} />, 
      label: 'Customers', 
      path: '/customers' 
    },
    { 
      icon: <Briefcase size={20} />, 
      label: 'Projects', 
      path: '/projects' 
    },
    { 
      icon: <FileText size={20} />, 
      label: 'Quotations', 
      path: '/quotations' 
    },
    { 
      icon: <Settings size={20} />, 
      label: 'Settings', 
      path: '/settings' 
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`bg-white border-r border-slate-200 h-screen flex flex-col ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-semibold text-slate-900">QuoteGen</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          icon={isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </Button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <span className="ml-3">{item.label}</span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;