import React from 'react';

interface DropdownMenuTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
  onClick?: () => void;
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children, asChild, onClick }) => {
  if (asChild) {
    // When asChild is true, wrap the child in a span and attach the onClick to the span
    // This bypasses issues with cloning and ensures the click is handled
    return <span onClick={onClick} className="cursor-pointer">{children}</span>;
  }

  // Otherwise, render a default trigger (e.g., a button) and attach the onClick prop
  return <button onClick={onClick}>{children}</button>; // Placeholder, replace with your Button component if needed
};

export { DropdownMenuTrigger }; 