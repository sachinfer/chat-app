import React, { useEffect, useState } from 'react';

const USER_BEHAVIOR_KEY = 'user_behavior_log';

function getBehaviorLog() {
  try {
    return JSON.parse(localStorage.getItem(USER_BEHAVIOR_KEY)) || [];
  } catch {
    return [];
  }
}

function setBehaviorLog(log) {
  localStorage.setItem(USER_BEHAVIOR_KEY, JSON.stringify(log));
}

function getActionTypes(log) {
  return Array.from(new Set(log.map((entry) => entry.type)));
}

function exportLog(log, type) {
  if (type === 'csv') {
    const header = 'Type,Details,Timestamp\n';
    const rows = log.map(e => `"${e.type}","${e.details || ''}","${new Date(e.timestamp).toLocaleString()}"`).join('\n');
    return header + rows;
  } else {
    return JSON.stringify(log, null, 2);
  }
}

function countByType(log) {
  return log.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {});
}

function UserBehavior({ onBack }) {
  const [log, setLogState] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('desc');
  const [exportType, setExportType] = useState('csv');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    setLogState(getBehaviorLog());
  }, []);

  const actionTypes = getActionTypes(log);
  let filtered = log;
  if (filter) filtered = filtered.filter(e => e.type === filter);
  if (search) filtered = filtered.filter(e => (e.details || '').toLowerCase().includes(search.toLowerCase()));
  filtered = [...filtered].sort((a, b) => sort === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  const summary = countByType(log);

  const handleClear = () => {
    setBehaviorLog([]);
    setLogState([]);
  };

  const handleExport = () => {
    const data = exportLog(filtered, exportType);
    const blob = new Blob([data], { type: exportType === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_behavior.${exportType}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple bar chart (text-based)
  const chartMax = Math.max(...Object.values(summary), 1);

  return (
    <div style={{ maxWidth: 700, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <h2>User Behavior Tracking</h2>
      <button onClick={onBack} style={{ marginBottom: 16, padding: '6px 16px', borderRadius: 6, background: '#3498db', color: '#fff', border: 'none' }}>Back to Dashboard</button>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
          <option value=''>All Types</option>
          {actionTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <input placeholder='Search details...' value={search} onChange={e => setSearch(e.target.value)} style={{ padding: 6, borderRadius: 6, flex: 1 }} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
          <option value='desc'>Newest First</option>
          <option value='asc'>Oldest First</option>
        </select>
        <button onClick={handleClear} style={{ padding: '6px 12px', borderRadius: 6, background: '#e74c3c', color: '#fff', border: 'none' }}>Clear Log</button>
        <button onClick={() => setShowExport(x => !x)} style={{ padding: '6px 12px', borderRadius: 6, background: '#2ecc40', color: '#fff', border: 'none' }}>Export</button>
      </div>
      {showExport && (
        <div style={{ marginBottom: 12 }}>
          <select value={exportType} onChange={e => setExportType(e.target.value)} style={{ padding: 6, borderRadius: 6 }}>
            <option value='csv'>CSV</option>
            <option value='json'>JSON</option>
          </select>
          <button onClick={handleExport} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, background: '#2980b9', color: '#fff', border: 'none' }}>Download</button>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <h4>Summary</h4>
        <ul style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: 0, listStyle: 'none' }}>
          {Object.entries(summary).map(([type, count]) => (
            <li key={type} style={{ background: '#f4f4f4', borderRadius: 6, padding: '4px 12px' }}>{type}: <b>{count}</b></li>
          ))}
        </ul>
        <div style={{ marginTop: 8 }}>
          <h5 style={{ margin: '8px 0 4px 0' }}>Actions Chart</h5>
          {Object.entries(summary).map(([type, count]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 120 }}>{type}</span>
              <div style={{ background: '#3498db', height: 16, width: `${(count / chartMax) * 200}px`, borderRadius: 4 }}></div>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#f4f4f4', borderRadius: 6, padding: 12, minHeight: 60, maxHeight: 300, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <span>No user actions tracked yet.</span>
        ) : (
          <ul>
            {filtered.map((entry, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>
                <b>{entry.type}</b> at {new Date(entry.timestamp).toLocaleString()} {entry.details && `- ${entry.details}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UserBehavior; 