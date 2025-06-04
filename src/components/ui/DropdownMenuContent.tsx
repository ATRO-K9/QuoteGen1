import React from 'react';

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
  isOpen?: boolean;
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ children, align = 'start', className, isOpen }) => {
  // Only render if isOpen is true
  if (!isOpen) {
    console.log('DropdownMenuContent: Not rendering, isOpen is false.');
    return null;
  }

  // Add a temporary log to see if it renders when isOpen is true
  console.log('DropdownMenuContent: Rendering because isOpen is true.');

  const alignmentClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 transform -translate-x-1/2' : 'left-0';

  return (
    // Add a temporary background color for visibility testing
    <div className={`absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-red-300 ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClass} ${className}`}>
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {children}
      </div>
    </div>
  );
};

export { DropdownMenuContent }; 