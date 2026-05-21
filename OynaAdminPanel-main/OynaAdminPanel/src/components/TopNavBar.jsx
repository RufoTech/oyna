import React from 'react';

const TopNavBar = ({ isOpen }) => {
  return (
    <header
      className={`fixed top-0 right-0 ${isOpen ? 'left-64' : 'left-20'} h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 z-40 border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none transition-all duration-300`}
    >
      <div className="flex items-center gap-4 flex-1">
      </div>

      <div className="flex items-center gap-4">
      </div>
    </header>
  );
};

export default TopNavBar;
