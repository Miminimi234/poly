'use client';

import { useState } from 'react';

export default function AdminControls() {
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [syncStats, setSyncStats] = useState<any>(null);
  
  const runCron = async (endpoint: string, name: string) => {
    setRunning(endpoint);
    setMessage('');
    try {
      const response = await fetch(`/api/cron/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || process.env.CRON_SECRET || ''}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const details = endpoint === 'sync-markets'
          ? `Added ${data.sync?.added || 0}, Updated ${data.sync?.updated || 0}`
          : endpoint === 'run-agents' 
          ? `Made ${data.predictions || 0} predictions` 
          : endpoint === 'resolve-markets'
          ? `Resolved ${data.resolved || 0} markets`
          : `Bankrupted ${data.bankrupted || 0} agents`;
        setMessage(`✓ ${name.toUpperCase()} COMPLETED: ${details}`);
        
        // Store sync stats if available
        if (data.sync) {
          setSyncStats(data.sync);
        }
      } else {
        setMessage(`✗ ${name.toUpperCase()} FAILED: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setMessage(`✗ ERROR: ${error.message}`);
    } finally {
      setRunning(null);
      setTimeout(() => setMessage(''), 8000);
    }
  };
  
  return (
    <div className="border-4 border-black bg-yellow-50 p-4 mb-6"
         style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="text-black font-bold mb-3 text-base">
        ▶ ADMIN_CONTROLS
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => runCron('sync-markets', 'Market Sync')}
          disabled={running === 'sync-markets'}
          className="w-full border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          {running === 'sync-markets' ? '⟲ SYNCING...' : '▣ SYNC_MARKETS'}
        </button>
        
        <button
          onClick={() => runCron('run-agents', 'Agent Analysis')}
          disabled={running === 'run-agents'}
          className="w-full border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          {running === 'run-agents' ? '⟲ RUNNING...' : '◎ RUN_AGENT_ANALYSIS'}
        </button>
        
        <button
          onClick={() => runCron('resolve-markets', 'Market Resolution')}
          disabled={running === 'resolve-markets'}
          className="w-full border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          {running === 'resolve-markets' ? '⟲ RUNNING...' : '◆ RESOLVE_MARKETS'}
        </button>
        
        <button
          onClick={() => runCron('check-bankruptcies', 'Bankruptcy Check')}
          disabled={running === 'check-bankruptcies'}
          className="w-full border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          {running === 'check-bankruptcies' ? '⟲ RUNNING...' : '✕ CHECK_BANKRUPTCIES'}
        </button>
      </div>
      
      {message && (
        <div className={`text-xs p-3 border-2 border-black mt-3 ${
          message.includes('✓') ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {message}
        </div>
      )}
      
      {/* Sync Stats Display */}
      {syncStats && (
        <div className="mt-3 p-3 border-2 border-black bg-white text-xs">
          <div className="font-bold mb-2">LAST SYNC RESULTS:</div>
          <div className="space-y-1">
            <div>✓ ADDED: {syncStats.added}</div>
            <div>⟲ UPDATED: {syncStats.updated}</div>
            <div>⊳ SKIPPED: {syncStats.skipped}</div>
            {syncStats.errors > 0 && <div className="text-red-600">✗ ERRORS: {syncStats.errors}</div>}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-700 mt-3 leading-relaxed">
        <div className="mb-1">▶ MARKETS SYNC EVERY 12H</div>
        <div className="mb-1">▶ AGENTS ANALYZE EVERY 6H</div>
        <div className="mb-1">▶ MARKETS RESOLVE EVERY 4H</div>
        <div>▶ BANKRUPTCIES CHECK EVERY 1H</div>
      </div>
    </div>
  );
}

