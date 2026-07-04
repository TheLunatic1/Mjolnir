import React, { useState } from 'react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Share2, Plus, Trash2, Globe, Cpu, Radio, ShieldAlert } from 'lucide-react';

export const DistributedPage: React.FC = () => {
  const { clusterMode, setClusterMode } = useStore();
  const [workers, setWorkers] = useState([
    { id: 'worker-us-east-1a', ip: '54.210.89.12', cpus: 16, status: 'idle', rps: 0 },
    { id: 'worker-eu-west-1c', ip: '52.30.114.88', cpus: 16, status: 'idle', rps: 0 },
    { id: 'worker-ap-northeast-1', ip: '13.112.45.19', cpus: 32, status: 'idle', rps: 0 },
  ]);
  const [newWorkerUrl, setNewWorkerUrl] = useState('');

  const addWorker = () => {
    if (!newWorkerUrl) return;
    setWorkers([
      ...workers,
      { id: `worker-cloud-${Date.now().toString().slice(-4)}`, ip: newWorkerUrl, cpus: 8, status: 'idle', rps: 0 },
    ]);
    setNewWorkerUrl('');
  };

  const removeWorker = (id: string) => {
    setWorkers(workers.filter((w) => w.id !== id));
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Banner */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800">
        <div>
          <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block mb-1">Scale-Out Architecture</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Geographic Distributed Cluster Control
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={clusterMode === 'master' ? 'cyan' : 'slate'} size="md" pulse={clusterMode === 'master'}>
            Mode: {clusterMode.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Mode selection prompt */}
      {clusterMode !== 'master' && (
        <div className="glass-card p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Master Cluster Controller Inactive</h3>
              <p className="text-xs text-slate-400">Switch Mjolnir to Master Mode in the top titlebar to orchestrate these cloud nodes synchronously.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setClusterMode('master')}>
            Enable Master Mode
          </Button>
        </div>
      )}

      {/* Add Worker Form */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Share2 className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Connect Remote Mjolnir Worker Daemon</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newWorkerUrl}
            onChange={(e) => setNewWorkerUrl(e.target.value)}
            placeholder="ws://worker-node-ip:4567/ws"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm font-mono text-slate-200"
          />
          <Button variant="primary" size="md" onClick={addWorker} icon={<Plus className="w-4 h-4" />}>
            Attach Worker Node
          </Button>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-['Outfit',sans-serif]">
          Connected Cloud Nodes ({workers.length}) — Total Cores: {workers.reduce((acc, w) => acc + w.cpus, 0)} Cores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {workers.map((w) => (
            <div key={w.id} className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-400" /> {w.id}
                </span>
                <Badge variant="emerald" size="sm" pulse>ONLINE</Badge>
              </div>
              <div className="text-xs font-mono text-slate-400 space-y-1">
                <div className="flex justify-between"><span>Host Address:</span><span className="text-slate-200">{w.ip}</span></div>
                <div className="flex justify-between"><span>Available CPU Cores:</span><span className="text-emerald-400 font-bold">{w.cpus} Cores</span></div>
                <div className="flex justify-between"><span>Current Status:</span><span className="uppercase text-cyan-400">{w.status}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button onClick={() => removeWorker(w.id)} className="text-xs text-rose-400 hover:underline flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Disconnect Node
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
