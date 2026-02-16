import { useNavigate } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showNotifications?: boolean;
}

export function AppHeader({ title, showBack = false, showNotifications = true }: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="px-6 pt-6 pb-4 flex justify-between items-center z-10 relative">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          <Search className="w-4 h-4" />
        </div>
        <h1 className="font-display font-bold text-xl tracking-tight text-slate-900">
          {title || 'LaTruffe'}
        </h1>
      </div>
      {showNotifications && (
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-soft text-slate-600 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>
      )}
    </header>
  );
}
