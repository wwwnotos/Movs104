import React, { useMemo } from 'react';
import { Compass, Search, Bookmark, UserCircle } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  activeTab: ViewState;
  onTabChange: (tab: ViewState) => void;
  savedCount?: number;
  isVisible?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, isVisible = true }) => {
  const navItems = [
    { id: 'home', icon: Compass, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'saved', icon: Bookmark, label: 'Saved' },
    { id: 'profile', icon: UserCircle, label: 'Profile' },
  ];

  const activeIndex = useMemo(() => 
    navItems.findIndex(item => item.id === activeTab), 
    [activeTab]
  );

  return (
    <div 
      className={`fixed bottom-6 pb-safe left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-40 opacity-0'
      }`}
    >
      <div className="glass-nav pointer-events-auto relative flex items-center p-3 rounded-[32px] shadow-float w-[320px] md:w-[380px]">
        
        {/* Animated Glass Pill Background */}
        <div 
          className="absolute top-3 bottom-3 rounded-[22px] z-0 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/20 dark:border-white/5 bg-gradient-to-b from-white/70 to-white/30 dark:from-white/10 dark:to-white/5"
          style={{
            width: 'calc((100% - 24px) / 4)', // 24px = p-3 * 2 (12px * 2)
            left: '12px', // Matches p-3
            transform: `translateX(calc(100% * ${activeIndex}))`,
            transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
            backdropFilter: 'blur(8px)'
          }}
        />

        {/* Icons Grid */}
        <div className="grid grid-cols-4 w-full relative z-10">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as ViewState)}
                className={`flex flex-col items-center justify-center py-4 transition-all duration-300 group ${
                  isActive 
                  ? 'text-[#007AFF] scale-105' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:scale-95'
                }`}
              >
                <div className="relative">
                  <Icon 
                    size={28} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all duration-300 ${isActive ? 'drop-shadow-sm text-[#007AFF]' : 'opacity-80'}`}
                  />
                  {/* Subtle Glow on active icon */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full -z-10" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Navbar);