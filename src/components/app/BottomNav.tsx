import { useLocation, useNavigate } from 'react-router-dom';
import { Search, BarChart3, PlusCircle, User } from 'lucide-react';

const navItems = [
  { label: 'Chercher', icon: Search, path: '/' },
  { label: 'Rapports', icon: BarChart3, path: '/client-dashboard' },
  { label: 'Vendre', icon: PlusCircle, path: '/sell' },
  { label: 'Compte', icon: User, path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on admin, auth, checkout pages
  const hiddenPaths = ['/admin', '/auth', '/checkout', '/payment-success'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <nav className="glass-panel rounded-full shadow-float px-2 py-2 flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center group transition-colors ${
                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all group-active:scale-90 ${
                isActive ? 'bg-primary/10' : ''
              }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
