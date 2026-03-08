import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Car, Palette, CreditCard, Crown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProOverview } from '@/components/pro/ProOverview';
import { ProKanbanBoard } from '@/components/pro/ProKanbanBoard';
import { ProWhiteLabel } from '@/components/pro/ProWhiteLabel';
import { ProBilling } from '@/components/pro/ProBilling';

type Tab = 'overview' | 'crm' | 'whitelabel' | 'billing';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'crm', label: 'Mon Parc (CRM)', icon: Car },
  { id: 'whitelabel', label: 'Marque Blanche', icon: Palette },
  { id: 'billing', label: 'Facturation Pro', icon: CreditCard },
];

export default function ProDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-8 h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="font-bold text-xl tracking-tight text-white">La Truffe</span>
            </Link>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold text-xs gap-1">
              <Crown className="w-3 h-3" /> PRO
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:inline">Garage Prestige Auto</span>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 min-h-[calc(100vh-4rem)] bg-slate-950 p-4 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto scrollbar-hide border-b border-slate-800 bg-slate-950 px-2 gap-1 w-full">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 md:ml-64">
        {/* Page Title */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'overview' && 'Vue d\'ensemble de votre activité'}
            {activeTab === 'crm' && 'Gérez votre parc automobile en mode Kanban'}
            {activeTab === 'whitelabel' && 'Personnalisez vos rapports à votre image'}
            {activeTab === 'billing' && 'Gérez votre abonnement et vos factures'}
          </p>
        </div>

        {activeTab === 'overview' && <ProOverview />}
        {activeTab === 'crm' && <ProKanbanBoard />}
        {activeTab === 'whitelabel' && <ProWhiteLabel />}
        {activeTab === 'billing' && <ProBilling />}
      </main>
    </div>
  );
}
