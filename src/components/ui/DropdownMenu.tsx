import React, { useState } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    console.log('DropdownMenu: Toggling isOpen from', isOpen, 'to', !isOpen);
    setIsOpen(!isOpen);
  };

  // Basic implementation - passes isOpen state and toggle function to children
  return <div className="relative">
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, { onClick: toggleOpen });
        } else if (child.type === DropdownMenuContent) {
          return React.cloneElement(child as React.ReactElement<any>, { isOpen });
        }
      }
      return child;
    })}
  </div>;
};

// Import placeholder components so they can be referenced by type
import { DropdownMenuTrigger } from './DropdownMenuTrigger';
import { DropdownMenuContent } from './DropdownMenuContent';

export { DropdownMenu }; 