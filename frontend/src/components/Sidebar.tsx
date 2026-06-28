import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  Server,
  Brain,
  RefreshCw,
  Settings,
  BarChart3,
  Shield,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/incidents', icon: AlertTriangle, label: 'Live Incidents' },
  { to: '/incidents/create', icon: PlusCircle, label: 'Create Incident' },
  { to: '/cluster', icon: Server, label: 'Cluster Health' },
  { to: '/triage', icon: Brain, label: 'AI Triage' },
  { to: '/sync', icon: RefreshCw, label: 'Sync Status' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col shrink-0">
      <div className="p-5 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">ShadowNet</h1>
            <p className="text-xs text-gray-500 font-mono">Edge Command Center</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-800 border border-transparent'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="status-dot-online" />
          <span>All Systems Nominal</span>
        </div>
        <p className="text-xs text-gray-600 mt-1 font-mono">v1.0.0 — Offline Mode</p>
      </div>
    </aside>
  );
}
