import React from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  side = 'top',
  className = '',
  children,
}) => {
  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  };

  return (
    <span className="group relative inline-flex items-center">
      {children}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-30 w-max max-w-xs whitespace-nowrap rounded-md bg-gray-800 dark:bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white dark:text-gray-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none ${sideClasses[side]} ${className}`}
        role="tooltip"
      >
        {content}
        <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-900 rotate-45"
            style={side === 'top' ? { bottom: '-4px' } : { top: '-4px' }}
        ></div>
      </div>
    </span>
  );
};

export default Tooltip;