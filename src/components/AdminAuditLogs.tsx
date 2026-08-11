import React, { useEffect, useState } from 'react';
import { AuditLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, RefreshCw, Clock } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = () => {
    setIsLoading(true);
    fetch('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="bg-[#121215] p-5 rounded-2xl border border-zinc-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-luxury font-bold text-white text-lg">System Audit Logs</h3>
            <p className="text-zinc-400 text-xs">
              Immutable record of staff and owner management actions for accountability.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-[#121215] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="divide-y divide-zinc-800/80 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-900/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-semibold text-white">{log.userEmail}</span>
                  </div>
                  <p className="text-zinc-300 text-xs">{log.details}</p>
                </div>

                <span className="text-zinc-400 text-[11px] font-mono shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400/80" />
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
