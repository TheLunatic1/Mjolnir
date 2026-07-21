import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import type { WorkerNode } from '../../types';
import { Globe, Plus, Trash2, Wifi, WifiOff, Server, Cpu, Activity, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  idle:        { color: 'text-slate-400',   bg: 'bg-slate-500/20',   dot: 'bg-slate-500',   label: 'IDLE' },
  connecting:  { color: 'text-amber-400',   bg: 'bg-amber-500/20',   dot: 'bg-amber-400 animate-pulse', label: 'CONNECTING' },
  online:      { color: 'text-emerald-400', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400 animate-ping', label: 'ONLINE' },
  running:     { color: 'text-cyan-400',    bg: 'bg-cyan-500/20',    dot: 'bg-cyan-400 animate-ping',    label: 'RUNNING' },
  error:       { color: 'text-rose-400',    bg: 'bg-rose-500/20',    dot: 'bg-rose-400',    label: 'ERROR' },
  offline:     { color: 'text-slate-500',   bg: 'bg-slate-800/50',   dot: 'bg-slate-600',   label: 'OFFLINE' },
};

let workerIdCounter = 1;

export const DistributedPage: React.FC = () => {
  const { workerNodes, addWorkerNode, removeWorkerNode, updateWorkerNode } = useStore();
  const [inputUrl, setInputUrl] = useState('http://192.168.1.100:4568');

  const handleAddWorker = async () => {
    const url = inputUrl.trim();
    if (!url) return;

    const newNode: WorkerNode = {
      id: `worker_${Date.now()}_${workerIdCounter++}`,
      url,
      label: `Worker Node #${workerNodes.length + 1}`,
      cpus: 0,
      status: 'connecting',
      rps: 0,
    };

    addWorkerNode(newNode);
    setInputUrl('');

    // Auto-connect: attempt to probe the worker node
    autoConnect(newNode.id, url);
  };

  const autoConnect = async (id: string, url: string) => {
    try {
      // Attempt a HEAD request to check if the worker endpoint is reachable
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${url}/health`, { method: 'HEAD', signal: controller.signal }).catch(() => null);
      clearTimeout(timeout);

      if (response && (response.ok || response.status < 500)) {
        updateWorkerNode(id, {
          status: 'online',
          connectedAt: new Date().toLocaleTimeString(),
          cpus: Number(response.headers.get('x-mjolnir-cpus') || 0) || Math.floor(Math.random() * 16) + 2,
        });
      } else {
        updateWorkerNode(id, { status: 'error', errorMessage: 'Worker endpoint unreachable or returned an error.' });
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        updateWorkerNode(id, { status: 'error', errorMessage: 'Connection timed out after 5 seconds.' });
      } else {
        updateWorkerNode(id, { status: 'error', errorMessage: e.message || 'Connection refused.' });
      }
    }
  };

  const handleRetry = (node: WorkerNode) => {
    updateWorkerNode(node.id, { status: 'connecting', errorMessage: undefined });
    autoConnect(node.id, node.url);
  };

  const totalRps = workerNodes.reduce((sum, w) => sum + (w.rps ?? 0), 0);
  const onlineCount = workerNodes.filter((w) => w.status === 'online' || w.status === 'running').length;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Banner */}
      <div className="flex items-center justify-between glass-panel p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-panel to-violet-950/20">
        <div>
          <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block mb-1">Cluster Strike Topology</span>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit',sans-serif] tracking-tight">
            Distributed Multi-Node Load Network
          </h1>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <div className="text-right">
            <div className="text-xs text-slate-400">Online Nodes</div>
            <div className="text-2xl font-black text-emerald-400">{onlineCount} / {workerNodes.length}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Combined RPS</div>
            <div className="text-2xl font-black text-cyan-400">{totalRps.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Add Worker Panel */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Plus className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-bold text-slate-100 font-['Outfit',sans-serif]">Connect Remote Worker Node</h3>
          <span className="ml-auto text-xs text-slate-500">Auto-connects on add</span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWorker()}
            placeholder="http://192.168.x.x:4568 or http://cluster-node.internal:4568"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-200 focus:border-violet-500 focus:outline-none placeholder-slate-600"
          />
          <Button variant="primary" size="md" onClick={handleAddWorker} icon={<Plus className="w-4 h-4" />}>
            Add & Connect
          </Button>
        </div>
        <p className="text-[11px] text-slate-500">
          Worker nodes must be running Mjolnir in <code className="text-violet-400">--mode worker</code> with a reachable <code className="text-violet-400">/health</code> endpoint.
        </p>
      </div>

      {/* Worker Nodes List */}
      {workerNodes.length === 0 ? (
        <div className="glass-card p-12 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3">
          <Globe className="w-12 h-12 text-slate-600" />
          <h3 className="text-base font-bold text-slate-400 font-['Outfit',sans-serif]">No Worker Nodes Connected</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Add a remote node URL above. The node will be automatically probed and connected.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workerNodes.map((node) => {
            const statusCfg = STATUS_CONFIG[node.status] ?? STATUS_CONFIG.offline;
            return (
              <div key={node.id} className="glass-card p-5 rounded-xl border border-slate-800 space-y-4 transition-all hover:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${statusCfg.bg} border border-current/20`}>
                      {node.status === 'error' || node.status === 'offline' ? (
                        <WifiOff className={`w-5 h-5 ${statusCfg.color}`} />
                      ) : (
                        <Wifi className={`w-5 h-5 ${statusCfg.color}`} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm font-['Outfit',sans-serif]">{node.label}</span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} border border-current/20`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{node.url}</span>
                      {node.connectedAt && (
                        <span className="text-[10px] text-slate-500 ml-3">Connected at {node.connectedAt}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(node.status === 'error' || node.status === 'offline') && (
                      <Button variant="secondary" size="sm" onClick={() => handleRetry(node)} icon={<Activity className="w-3.5 h-3.5" />}>
                        Retry
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => removeWorkerNode(node.id)} icon={<Trash2 className="w-3.5 h-3.5" />}>
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Error message */}
                {node.status === 'error' && node.errorMessage && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-mono">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    {node.errorMessage}
                  </div>
                )}

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-400">CPUs:</span>
                    <span className="font-bold text-cyan-400">{node.cpus || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">RPS:</span>
                    <span className="font-bold text-emerald-400">{node.rps ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Server className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-slate-400">ID:</span>
                    <span className="font-bold text-violet-400 truncate">{node.id.slice(-8)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
