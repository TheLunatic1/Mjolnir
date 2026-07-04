import React from 'react';
import { useStore } from './store';
import { useMetricsStream } from './hooks/useMetricsStream';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { BuilderPage } from './components/builder/BuilderPage';
import { EditorPage } from './components/editor/EditorPage';
import { HostMonitoringPage } from './components/monitoring/HostMonitoringPage';
import { DistributedPage } from './components/distributed/DistributedPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ReportsPage } from './components/reports/ReportsPage';

export const App: React.FC = () => {
  const { activeTab } = useStore();

  // Initialize background telemetry and event streams
  useMetricsStream();

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden text-slate-100 font-sans">
      {/* Left Navigation Panel */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TitleBar />

        <main className="flex-1 overflow-hidden relative bg-[#0a0f1d]/50">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'builder' && <BuilderPage />}
          {activeTab === 'editor' && <EditorPage />}
          {activeTab === 'monitoring' && <HostMonitoringPage />}
          {activeTab === 'distributed' && <DistributedPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'reports' && <ReportsPage />}
        </main>

        <StatusBar />
      </div>
    </div>
  );
};
