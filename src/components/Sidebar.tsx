import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Compass, 
  Film, 
  MessageCircle, 
  Heart, 
  PlusSquare, 
  User, 
  Menu,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  user: any;
  profile: any;
  onOpenCreate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, profile, onOpenCreate }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/explore', icon: Search },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Reels', path: '/projects', icon: Film },
    { name: 'Messages', path: '/messages', icon: MessageCircle },
    { name: 'Notifications', path: '/notifications', icon: Heart },
    { name: 'Create', path: '#', icon: PlusSquare, onClick: onOpenCreate },
    { name: 'Profile', path: '/profile', icon: User, isProfile: true },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-20 xl:w-64 border-r border-neutral-200 bg-white flex flex-col py-8 px-3 z-50">
      <div className="px-3 mb-10">
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-indigo-600">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <LayoutDashboard size={20} />
          </div>
          <span className="hidden xl:block tracking-tight">CampusHub</span>
        </Link>
      </div>

      <nav className="flex-grow space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const content = (
            <div className={cn(
              "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group",
              isActive ? "font-bold" : "hover:bg-neutral-100"
            )}>
              {item.isProfile ? (
                <img 
                  src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
                  alt="Profile" 
                  className={cn(
                    "w-6 h-6 rounded-full border border-neutral-200",
                    isActive && "ring-2 ring-black ring-offset-2"
                  )}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icon size={26} className={cn("transition-transform group-hover:scale-110", isActive && "fill-current")} />
              )}
              <span className="hidden xl:block text-base">{item.name}</span>
            </div>
          );

          if (item.onClick) {
            return (
              <button 
                key={item.name} 
                onClick={item.onClick}
                className="w-full text-left outline-none"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.name} to={item.path}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-100 transition-all group">
          <Menu size={26} className="group-hover:scale-110" />
          <span className="hidden xl:block text-base">More</span>
        </button>
      </div>
    </div>
  );
};
