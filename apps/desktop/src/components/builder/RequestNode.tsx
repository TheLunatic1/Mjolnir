import React, { useState } from 'react';
import type { RequestSpec, ProtocolType } from '../../types';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Trash2, Edit3, ChevronDown, ChevronUp, Key, ShieldCheck, Plus } from 'lucide-react';

interface RequestNodeProps {
  request: RequestSpec;
  index: number;
  onUpdate: (updated: RequestSpec) => void;
  onDelete: () => void;
}

export const RequestNode: React.FC<RequestNodeProps> = ({
  request,
  index,
  onUpdate,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(index === 0);
  const [activeSubTab, setActiveSubTab] = useState<'headers' | 'body' | 'auth' | 'extractors' | 'assertions'>('headers');

  const handleMethodChange = (method: any) => {
    onUpdate({ ...request, method });
  };

  const handleProtocolChange = (protocol: any) => {
    onUpdate({ ...request, protocol });
  };

  const addHeader = () => {
    onUpdate({
      ...request,
      headers: [...request.headers, { key: '', value: '', enabled: true }],
    });
  };

  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    const next = [...request.headers];
    next[i] = { ...next[i], [field]: val };
    onUpdate({ ...request, headers: next });
  };

  const removeHeader = (i: number) => {
    onUpdate({ ...request, headers: request.headers.filter((_, idx) => idx !== i) });
  };

  const addExtractor = () => {
    const exts = request.extractors || [];
    onUpdate({
      ...request,
      extractors: [...exts, { name: 'token', type: 'jsonpath', expression: '$.data.token' }],
    });
  };

  const addAssertion = () => {
    const ass = request.assertions || [];
    onUpdate({
      ...request,
      assertions: [...ass, { type: 'status', expression: 'status', expected: '200' }],
    });
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    POST: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    DELETE: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    PATCH: 'bg-violet-500/20 text-violet-400 border-violet-500/40',
  };

  return (
    <div className="glass-card rounded-xl border border-slate-800 transition-all overflow-hidden">
      {/* Node Header Banner */}
      <div className="p-4 flex items-center justify-between bg-slate-900/50 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
            #{index + 1}
          </span>

          <select
            value={request.protocol}
            onChange={(e) => handleProtocolChange(e.target.value as ProtocolType)}
            className="bg-slate-900 border border-slate-700 text-cyan-400 font-mono text-xs font-bold rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
          >
            <option value="http1">HTTP/1.1</option>
            <option value="http2">HTTP/2</option>
            <option value="http3">HTTP/3 (QUIC)</option>
            <option value="websocket">WebSocket</option>
            <option value="grpc">gRPC</option>
            <option value="graphql">GraphQL</option>
            <option value="tcp">Raw TCP</option>
            <option value="udp">Raw UDP</option>
            <option value="mqtt">MQTT IoT</option>
          </select>

          <select
            value={request.method}
            onChange={(e) => handleMethodChange(e.target.value)}
            className={`text-xs font-mono font-extrabold rounded px-2.5 py-1 border focus:outline-none ${methodColors[request.method] || 'bg-slate-800 text-white'}`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          <input
            type="text"
            value={request.name}
            onChange={(e) => onUpdate({ ...request, name: e.target.value })}
            placeholder="Step Name..."
            className="bg-transparent text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:border-b border-primary-500 px-1 py-0.5 w-60"
          />
        </div>

        <div className="flex items-center gap-2">
          {request.extractors && request.extractors.length > 0 && (
            <Badge variant="violet" size="sm"><Key className="w-3 h-3" /> {request.extractors.length} Vars</Badge>
          )}
          {request.assertions && request.assertions.length > 0 && (
            <Badge variant="emerald" size="sm"><ShieldCheck className="w-3 h-3" /> {request.assertions.length} Asserts</Badge>
          )}

          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* URL Input Row */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 font-mono uppercase">Target URL:</span>
        <input
          type="text"
          value={request.url}
          onChange={(e) => onUpdate({ ...request, url: e.target.value })}
          placeholder="https://api.enterprise.com/v1/resource?id={{faker.uuid}}"
          className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
        />
      </div>

      {/* Expanded Detail Tabs */}
      {expanded && (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {(['headers', 'body', 'auth', 'extractors', 'assertions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeSubTab === tab
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sub-tab: Headers */}
          {activeSubTab === 'headers' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-400">HTTP Headers ({request.headers.length})</span>
                <Button variant="secondary" size="sm" onClick={addHeader} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Header
                </Button>
              </div>
              {request.headers.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                    placeholder="Header Key (e.g. Authorization)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. Bearer {{faker.uuid}})"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button onClick={() => removeHeader(idx)} className="p-1.5 text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab: Body */}
          {activeSubTab === 'body' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Payload Format:</span>
                <select
                  value={request.bodyType}
                  onChange={(e) => onUpdate({ ...request, bodyType: e.target.value as any })}
                  className="bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400 rounded px-2.5 py-1"
                >
                  <option value="none">None (Empty)</option>
                  <option value="json">JSON Payload</option>
                  <option value="graphql">GraphQL Query</option>
                  <option value="form-data">Multipart Form-Data</option>
                  <option value="raw">Raw Text / Binary</option>
                </select>
              </div>
              {request.bodyType !== 'none' && (
                <textarea
                  value={request.body || ''}
                  onChange={(e) => onUpdate({ ...request, body: e.target.value })}
                  rows={6}
                  placeholder='{"userId": "{{faker.uuid}}", "timestamp": "{{faker.timestamp}}"}'
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>
          )}

          {/* Sub-tab: Auth */}
          {activeSubTab === 'auth' && (
            <div className="space-y-3 max-w-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Authentication Type:</span>
                <select
                  value={request.auth.type}
                  onChange={(e) => onUpdate({ ...request, auth: { ...request.auth, type: e.target.value as any } })}
                  className="bg-slate-900 border border-slate-700 text-xs text-cyan-400 rounded px-2.5 py-1"
                >
                  <option value="none">No Authentication</option>
                  <option value="bearer">Bearer Token (JWT)</option>
                  <option value="basic">Basic Auth (User/Pass)</option>
                  <option value="api_key">API Key Header</option>
                </select>
              </div>
              {request.auth.type === 'bearer' && (
                <input
                  type="text"
                  value={request.auth.token || ''}
                  onChange={(e) => onUpdate({ ...request, auth: { ...request.auth, token: e.target.value } })}
                  placeholder="Enter Bearer Token..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200"
                />
              )}
            </div>
          )}

          {/* Sub-tab: Extractors */}
          {activeSubTab === 'extractors' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-400">Token Extractors (JSONPath / Regex)</span>
                <Button variant="secondary" size="sm" onClick={addExtractor} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Extractor
                </Button>
              </div>
              {(request.extractors || []).map((ext, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ext.name}
                    placeholder="Variable Name"
                    className="w-32 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-violet-400"
                  />
                  <input
                    type="text"
                    value={ext.expression}
                    placeholder="JSONPath (e.g. $.data.token)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab: Assertions */}
          {activeSubTab === 'assertions' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-400">Response Assertions</span>
                <Button variant="secondary" size="sm" onClick={addAssertion} icon={<Plus className="w-3.5 h-3.5" />}>
                  Add Assertion
                </Button>
              </div>
              {(request.assertions || []).map((ass, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Check</span>
                  <input
                    type="text"
                    value={ass.expression}
                    className="w-32 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-cyan-400"
                  />
                  <span className="text-slate-400">equals</span>
                  <input
                    type="text"
                    value={ass.expected}
                    className="w-32 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-emerald-400"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
