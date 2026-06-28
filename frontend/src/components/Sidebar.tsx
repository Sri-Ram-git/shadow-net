import { NavLink } from 'react-router-dom';

const sections = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', label: 'Command' },
      { to: '/incidents', label: 'Incidents' },
      { to: '/incidents/create', label: 'Report' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { to: '/cluster', label: 'Cluster' },
      { to: '/triage', label: 'AI Triage' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/sync', label: 'Sync' },
      { to: '/statistics', label: 'Analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="w-56 bg-surface-50 border-r border-border flex flex-col shrink-0">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-light tracking-[-0.01em] text-ink">ShadowNet</span>
          <span className="text-[10px] font-mono text-ink-500 border border-border px-1.5 py-0.5 tracking-[0.04em]">v1</span>
        </div>
      </div>
      <nav className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-2 mb-2 text-[10px] font-mono text-ink-500 uppercase tracking-[0.12em]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/incidents'}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 text-sm transition-colors duration-150 ${
                        isActive
                          ? 'text-ink bg-surface-200'
                          : 'text-ink-400 hover:text-ink hover:bg-surface-100'
                      }`
                    }
                  >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="status-dot-online" />
          <span className="text-[11px] font-mono text-ink-500">All nominal</span>
        </div>
        <p className="text-[10px] font-mono text-ink-500 mt-1">Offline mode</p>
      </div>
    </aside>
  );
}
