// ============================================================================
// TabBar — Overview | Browse tabs (DFT-041: only 2 tabs)
// ============================================================================

import type { SidebarTab } from '../../types';

interface TabBarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  showBrowseTab?: boolean;
}

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'browse', label: 'Browse' },
];

export function TabBar({
  activeTab,
  onTabChange,
  showBrowseTab = true,
}: TabBarProps) {
  const tabs = showBrowseTab ? TABS : TABS.filter(tab => tab.id !== 'browse');

  return (
    <div id="sidebar-tab-bar" role="tablist" className="flex border-b border-gray-200">
      {tabs.map(tab => (
        <button
          id={`right-sidebar-tab-${tab.id}`}
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2.5 text-sm text-center transition-colors duration-150 ${
            activeTab === tab.id
              ? 'font-semibold text-gray-900 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
