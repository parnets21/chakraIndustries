import React, { useState } from 'react';

export default function DataTable({ columns, data, onRowClick }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const perPage = 8;

  const filtered = data.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="filters-row">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            placeholder="Search..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-light)' }}>
          {filtered.length} records
        </span>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 32, color: 'var(--text-light)' }}>No records found</td></tr>
            ) : paged.map((row, i) => (
              <tr key={i} onClick={() => onRowClick && onRowClick(row)} style={onRowClick ? { cursor: 'pointer' } : {}}>
                {columns.map(col => (
                  <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 12 }}>
          <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm${p === page ? ' btn-primary' : ' btn-outline'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
