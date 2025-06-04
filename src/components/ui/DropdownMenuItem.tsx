import React from 'react';

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      role="menuitem"
    >
      {children}
    </button>
  );
};

export { DropdownMenuItem }; 