import { useState } from 'react';
import { MOTUSBrowseTab } from './MOTUSBrowseTab';
import { MOTUSOverviewTab } from './MOTUSOverviewTab';

export function MOTUSSidebar() {
  const [activeTab, setActiveTab] = useState<'overview' | 'browse'>('overview');

  return (
    <div id="motus-sidebar" className="space-y-4">
      <div id="motus-sidebar-tab-buttons" className="grid grid-cols-2 gap-2">
        <button
          id="motus-sidebar-tab-overview"
          type="button"
          onClick={() => setActiveTab('overview')}
          aria-pressed={activeTab === 'overview'}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          id="motus-sidebar-tab-browse"
          type="button"
          onClick={() => setActiveTab('browse')}
          aria-pressed={activeTab === 'browse'}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'browse'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Browse
        </button>
      </div>

      <div id="motus-sidebar-tab-panel">
        {activeTab === 'overview' ? (
          <MOTUSOverviewTab onBrowseClick={() => setActiveTab('browse')} />
        ) : (
          <MOTUSBrowseTab />
        )}
      </div>
    </div>
  );
}
