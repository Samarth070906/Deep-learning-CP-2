import { useMemo, useState, useEffect } from 'react'
import axios from 'axios'
import './Dashboard.css'
import {
  EXAMPLES, SOURCES_DB, VERDICTS_DB, HISTORY_ITEMS,
  SAVED_INVESTIGATIONS, SOURCES_PAGE, COLLECTIONS,
  KNOWLEDGE_GRAPH_NODES, DOMAIN_INSIGHTS
} from './data.js'

// ─── Icon Component ───────────────────────────────────────────────────────────
function Icon({ name, size = 16 }) {
  const shape = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" /><path d="M13 3v7h7M8 14h8M8 17h6" /></>,
    folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    network: <><circle cx="12" cy="5" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="m11 7-4 9m6-9 4 9M8 18h8" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5a7 7 0 0 0 0-3l2-1.5-2-3.5-2.5 1a7 7 0 0 0-2.5-1.5L13.5 2h-4L9 5a7 7 0 0 0-2.5 1.5l-2.5-1-2 3.5L4 10.5a7 7 0 0 0 0 3L2 15l2 3.5 2.5-1A7 7 0 0 0 9 19l.5 3h4l.5-3a7 7 0 0 0 2.5-1.5l2.5 1 2-3.5z" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" /><circle cx="19" cy="5" r="2" fill="currentColor" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    back: <><path d="M19 12H5m6 6-6-6 6-6" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />,
    bulb: <><path d="M9 18h6m-5 4h4m-6-7a7 7 0 1 1 8 0c-.9.7-1 1.5-1 3h-6c0-1.5-.1-2.3-1-3z" /><path d="M12 2v1" /></>,
    external: <><path d="M14 3h7v7m0-7-9 9" /><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="10" cy="18" r="2" /></>,
    trash: <><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    panelLeft: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {shape[name]}
    </svg>
  )
}

// ─── Verdict badge colour helper ──────────────────────────────────────────────
function verdictStyle(verdict) {
  if (!verdict) return {}
  const v = verdict.toLowerCase()
  if (v === 'false') return { color: '#c91e2a', bg: '#fff4f4', border: '#f8e4e6' }
  if (v === 'mostly true' || v === 'true') return { color: '#065f46', bg: '#f0fdf4', border: '#bbf7d0' }
  if (v === 'misleading') return { color: '#b45309', bg: '#fffbeb', border: '#fde68a' }
  if (v === 'uncertain') return { color: '#6d28d9', bg: '#faf5ff', border: '#ddd6fe' }
  return { color: '#374151', bg: '#f3f4f6', border: '#e5e7eb' }
}

// ─── History Page ─────────────────────────────────────────────────────────────
function HistoryPage({ history, onSelect }) {
  const [search, setSearch] = useState('')
  const [filterVerdict, setFilterVerdict] = useState('All')
  const filtered = useMemo(() => history.filter(h => {
    const matchSearch = h.claim.toLowerCase().includes(search.toLowerCase()) || h.domain.toLowerCase().includes(search.toLowerCase())
    const matchVerdict = filterVerdict === 'All' || h.verdict === filterVerdict
    return matchSearch && matchVerdict
  }), [history, search, filterVerdict])

  const verdicts = ['All', 'False', 'Misleading', 'Mostly True', 'Uncertain']

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Recent Investigations</h2>
          <p className="page-subtitle">Browse all past verifications and click to re-open any result.</p>
        </div>
        <button className="btn-action"><Icon name="download" size={14} />Export</button>
      </div>

      <div className="filter-bar">
        <label className="search-input-wrap">
          <Icon name="search" size={14} />
          <input placeholder="Search history…" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <div className="verdict-filter-group">
          {verdicts.map(v => {
            const s = verdictStyle(v)
            return (
              <button
                key={v}
                className={`verdict-filter-chip ${filterVerdict === v ? 'active' : ''}`}
                style={filterVerdict === v && v !== 'All' ? { background: s.bg, color: s.color, borderColor: s.border } : {}}
                onClick={() => setFilterVerdict(v)}
              >{v}</button>
            )
          })}
        </div>
      </div>

      <div className="history-list">
        {filtered.length === 0 && <div className="empty-page-msg">No results match your filters.</div>}
        {filtered.map(item => {
          const s = verdictStyle(item.verdict)
          return (
            <button key={item.id} className="history-row-card" onClick={() => onSelect(item.claim)}>
              <div className="history-row-main">
                <span className="history-verdict-pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{item.verdict}</span>
                <span className="history-claim-text">{item.claim}</span>
              </div>
              <div className="history-row-meta">
                <span className="history-domain-pill">{item.domain}</span>
                <span className="history-conf">Confidence: <b>{item.confidence}%</b></span>
                <span className="history-time">{item.date} · {item.time}</span>
                <span className="history-open-icon"><Icon name="arrow" size={13} /></span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Saved Investigations Page ────────────────────────────────────────────────
function SavedPage({ onSelect }) {
  const [items, setItems] = useState([])
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Saved Investigations</h2>
          <p className="page-subtitle">Claims you bookmarked for later review.</p>
        </div>
      </div>
      {items.length === 0 && <div className="empty-page-msg">No saved investigations yet. Bookmark a result to see it here.</div>}
      <div className="saved-grid">
        {items.map(item => {
          const s = verdictStyle(item.verdict)
          return (
            <div key={item.id} className="saved-card">
              <div className="saved-card-top">
                <span className="saved-verdict" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{item.verdict}</span>
                <button className="saved-remove-btn" aria-label="Remove" onClick={() => remove(item.id)}><Icon name="trash" size={13} /></button>
              </div>
              <p className="saved-claim">{item.claim}</p>
              <div className="saved-tags">{item.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}</div>
              <div className="saved-footer">
                <small>{item.date}</small>
                <button className="saved-open-btn" onClick={() => onSelect(item.claim)}>Open <Icon name="arrow" size={12} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sources Page ─────────────────────────────────────────────────────────────
function SourcesPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('credibility')
  const filtered = useMemo(() => {
    let list = [].filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase())
    )
    if (sortBy === 'credibility') list = [...list].sort((a, b) => b.credibility - a.credibility)
    if (sortBy === 'articles') list = [...list].sort((a, b) => b.articles - a.articles)
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [search, sortBy])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Trusted Sources</h2>
          <p className="page-subtitle">All indexed sources used in verifications, ranked by credibility.</p>
        </div>
      </div>
      <div className="filter-bar">
        <label className="search-input-wrap">
          <Icon name="search" size={14} />
          <input placeholder="Search sources…" value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <label className="sort-select-wrap">
          <Icon name="sliders" size={13} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="credibility">Credibility</option>
            <option value="articles">Article Count</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <div className="sources-grid">
        {filtered.map(src => (
          <div key={src.name} className="source-card">
            <div className="source-card-top">
              <div className="src-logo" style={{ '--source-color': src.color }}>{src.initials}</div>
              <div>
                <div className="src-name">{src.name} {src.verified && <span className="verified-badge">✓ Verified</span>}</div>
                <a href={`https://${src.url}`} target="_blank" rel="noreferrer" className="src-url">{src.url} <Icon name="external" size={9} /></a>
              </div>
            </div>
            <div className="src-stats">
              <div className="src-stat">
                <span>Credibility</span>
                <div className="src-bar-wrap"><div className="src-bar" style={{ width: `${src.credibility}%`, background: src.color }} /><b>{src.credibility}%</b></div>
              </div>
              <div className="src-stat">
                <span>Type</span><b>{src.type}</b>
              </div>
              <div className="src-stat">
                <span>Articles</span><b>{src.articles.toLocaleString()}+</b>
              </div>
              <div className="src-stat">
                <span>Last Updated</span><b>{src.lastUpdated}</b>
              </div>
              <div className="src-stat">
                <span>Region</span><b>{src.country}</b>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Collections Page ─────────────────────────────────────────────────────────
function CollectionsPage({ onSelect }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Collections</h2>
          <p className="page-subtitle">Themed groups of related verifications for organised research.</p>
        </div>
        <button className="btn-action"><Icon name="folder" size={14} />New Collection</button>
      </div>
      <div className="collections-grid">
        {[].map(col => (
          <div key={col.id} className="collection-card" style={{ '--col-color': col.color }}>
            <div className="col-icon">{col.icon}</div>
            <div className="col-body">
              <h3>{col.name}</h3>
              <p>{col.description}</p>
            </div>
            <div className="col-footer">
              <span>{col.count} investigations</span>
              <button onClick={() => onSelect(col.name + ' investigation')}>View <Icon name="arrow" size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Source Explorer Page ─────────────────────────────────────────────────────
function SourceExplorerPage() {
  const [selected, setSelected] = useState(SOURCES_PAGE[0] || null)
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Source Explorer</h2>
          <p className="page-subtitle">Deep-dive into each trusted source's profile, coverage, and credibility metrics.</p>
        </div>
      </div>
      {[].length === 0 ? <div className="empty-page-msg">No sources indexed.</div> : (
      <div className="explorer-layout">
        <div className="explorer-list">
          {[].map(src => (
            <button key={src.name} className={`explorer-item ${selected?.name === src.name ? 'active' : ''}`} onClick={() => setSelected(src)}>
              <div className="src-logo-sm" style={{ '--source-color': src.color }}>{src.initials}</div>
              <div>
                <div className="explorer-name">{src.name}</div>
                <div className="explorer-type">{src.type}</div>
              </div>
              <div className="explorer-cred" style={{ color: src.color }}>{src.credibility}%</div>
            </button>
          ))}
        </div>
        <div className="explorer-detail panel">
          <div className="exd-header">
            <div className="src-logo-lg" style={{ '--source-color': selected.color }}>{selected.initials}</div>
            <div>
              <h3>{selected.name} {selected.verified && <span className="verified-badge">✓ Verified</span>}</h3>
              <a href={`https://${selected.url}`} target="_blank" rel="noreferrer" className="src-url">{selected.url} <Icon name="external" size={11} /></a>
            </div>
          </div>
          <div className="exd-stats-grid">
            {[['Credibility Score', `${selected.credibility}%`], ['Source Type', selected.type], ['Articles Indexed', `${selected.articles.toLocaleString()}+`], ['Region', selected.country], ['Last Updated', selected.lastUpdated]].map(([k, v]) => (
              <div key={k} className="exd-stat">
                <span>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
          <div className="exd-credibility-bar">
            <span>Credibility</span>
            <div className="exd-bar-track">
              <div className="exd-bar-fill" style={{ width: `${selected.credibility}%`, background: selected.color }} />
            </div>
            <b>{selected.credibility}%</b>
          </div>
          <p className="exd-description">
            {selected.name} is a {selected.type.toLowerCase()} based in {selected.country}. It is indexed with {selected.articles.toLocaleString()}+ articles
            and carries a credibility score of {selected.credibility}% as determined by our verification model.
            {selected.verified ? ' This source is verified by TrustAgent.' : ' This source is not yet independently verified.'}
          </p>
        </div>
      </div>
      )}
    </div>
  )
}

// ─── Knowledge Graph Page ─────────────────────────────────────────────────────
function KnowledgeGraphPage() {
  const [selected, setSelected] = useState(null)
  const connections = [
    ['product', 'seller'], ['product', 'fakespot'], ['product', 'camel'], ['product', 'apple'],
    ['seller', 'bbb'], ['fakespot', 'camel']
  ]
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Knowledge Graph</h2>
          <p className="page-subtitle">Visualise how claims, sources, and topics are interconnected.</p>
        </div>
      </div>
      <div className="graph-layout">
        <div className="graph-canvas panel">
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {connections.map(([a, b]) => {
              const na = KNOWLEDGE_GRAPH_NODES.find(n => n.id === a)
              const nb = KNOWLEDGE_GRAPH_NODES.find(n => n.id === b)
              if (!na || !nb) return null;
              return <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="#c5cee0" strokeWidth="0.7" />
            })}
            {[].map(node => (
              <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(node)}>
                <circle cx={node.x} cy={node.y} r={node.size / 2} fill={node.color} fillOpacity="0.15" stroke={node.color} strokeWidth="0.8" />
                <text x={node.x} y={node.y + 0.7} textAnchor="middle" dominantBaseline="middle" fontSize="4" fontWeight="600" fill={node.color}>{node.label.split(' ').map(w => w[0]).join('')}</text>
                <text x={node.x} y={node.y + node.size / 2 + 3.5} textAnchor="middle" fontSize="3.2" fill="#4b5563">{node.label}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="graph-sidebar panel">
          <h3>Graph Legend</h3>
          <div className="graph-legend">
            {KNOWLEDGE_GRAPH_NODES.map(node => (
              <button key={node.id} className={`graph-legend-item ${selected?.id === node.id ? 'active' : ''}`} onClick={() => setSelected(node)}>
                <span className="graph-dot" style={{ background: node.color }} />
                {node.label}
              </button>
            ))}
          </div>
          {selected && (
            <div className="graph-detail-box">
              <h4 style={{ color: selected.color }}>{selected.label}</h4>
              <p>This node represents <strong>{selected.label}</strong> in the knowledge graph. It is connected to {connections.filter(c => c.includes(selected.id)).length} other concept(s).</p>
            </div>
          )}
          {!selected && <p className="graph-hint">Click a node to see its connections.</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Domain Insights Page ─────────────────────────────────────────────────────
function DomainInsightsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Domain Insights</h2>
          <p className="page-subtitle">Breakdown of misinformation across content categories.</p>
        </div>
      </div>
      <div className="insights-grid">
        {[].map(d => (
          <div key={d.domain} className="insight-card">
            <div className="insight-top">
              <span className="insight-domain">{d.domain}</span>
              <span className="insight-total">{d.total} claims</span>
            </div>
            <div className="insight-bars">
              {[['False', d.falseRate, '#ef4444'], ['Misleading', d.misleadingRate, '#f59e0b'], ['True / Mostly True', d.trueRate, '#10b981']].map(([label, pct, color]) => (
                <div key={label} className="insight-bar-row">
                  <span className="insight-bar-label">{label}</span>
                  <div className="insight-bar-track">
                    <div className="insight-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="insight-bar-pct">{pct}%</span>
                </div>
              ))}
            </div>
            <div className="insight-footer">Top claim type: <b>{d.topClaim}</b></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function SettingsPage() {
  const [name, setName] = useState('Rushikesh')
  const [email, setEmail] = useState('rushikesh@example.com')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = () => {
    if (darkMode) document.body.classList.add('dim-mode')
    else document.body.classList.remove('dim-mode')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage your profile and app preferences.</p>
        </div>
      </div>
      <div className="settings-layout">
        <div className="settings-card panel">
          <h3 className="settings-section-title"><Icon name="user" size={15} /> Profile</h3>
          <div className="settings-form">
            <div className="settings-field">
              <label>Display Name</label>
              <input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Role</label>
              <input value="Researcher" readOnly />
            </div>
          </div>
        </div>

        <div className="settings-card panel">
          <h3 className="settings-section-title"><Icon name="settings" size={15} /> Preferences</h3>
          <div className="settings-form">
            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">Email Notifications</div>
                <div className="settings-toggle-desc">Receive updates when verifications complete</div>
              </div>
              <button className={`toggle-btn ${notifications ? 'on' : ''}`} onClick={() => setNotifications(!notifications)}>
                <span className="toggle-thumb" />
              </button>
            </div>
            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-label">Dark Mode</div>
                <div className="settings-toggle-desc">Reduce screen brightness with a dimmed theme</div>
              </div>
              <button className={`toggle-btn ${darkMode ? 'on' : ''}`} onClick={() => setDarkMode(!darkMode)}>
                <span className="toggle-thumb" />
              </button>
            </div>
          </div>
        </div>

        <div className="settings-save-row">
          <button className="settings-save-btn" onClick={save}>
            {saved ? <><Icon name="check" size={14} /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Verification Page (unchanged logic, enhanced) ───────────────────────
function VerificationPage({ initClaim, onHistoryAdd }) {
  const [claim, setClaim] = useState(initClaim || 'AirPods Pro 2 for $29 are genuine Apple')
  const [mode, setMode] = useState('Text')
  const [tab, setTab] = useState('Evidence')
  const [filter, setFilter] = useState('All Sources')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('Relevance')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')
  const [currentResult, setCurrentResult] = useState(null)

  // URL mode state
  const [urlInput, setUrlInput] = useState('https://amazon.com/dp/B0BDHW48M2/airpods-pro-deal')
  const [urlStatus, setUrlStatus] = useState(null)
  const [urlLoading, setUrlLoading] = useState(false)

  // Article mode state
  const [articleTitle, setArticleTitle] = useState('Marketplace Flash Deal: Apple AirPods Pro 2 Liquidation')
  const [articleBody, setArticleBody] = useState('Special warehouse clearance: Brand new sealed Apple AirPods Pro 2 with MagSafe Case for $29.99 with free delivery. 100% authentic original Apple stock guaranteed.')
  const [articleDoc, setArticleDoc] = useState(null)

  // Image mode state
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80')
  const [imageFileName, setImageFileName] = useState('airpods_pro_superdeal_screenshot.png')
  const [imageOcrClaim, setImageOcrClaim] = useState('AirPods Pro 2 for $29 are genuine Apple')

  // If there's an initClaim, we want to run verify automatically
  useEffect(() => {
    if (initClaim) {
      setClaim(initClaim);
      // Wait for state to settle, then verify
      setTimeout(() => verify(), 100);
    }
  }, [initClaim])



  const getSources = (claimText) => {
    const key = claimText.toLowerCase().replace(/\.$/, '').trim()
    return SOURCES_DB[key] || SOURCES_DB['default']
  }

  const verify = async () => {
    if (!claim.trim() || busy) return
    setBusy(true)
    setMessage('')
    setCurrentResult(null)
    
    try {
      const res = await axios.post('http://localhost:8000/verify', {
        agent_response: claim,
        context: {
          unit: "",
          visually_verifiable: false,
          source_reliability: 0.8,
          action_risk: 0.5
        }
      })
      
      const isBlock = res.data.decision === 'BLOCK';
      const isReview = res.data.decision === 'HUMAN_REVIEW';
      
      const claimData = res.data.claims && res.data.claims[0] ? res.data.claims[0] : null;
      let evidence = claimData?.evidence_retrieved?.text || 'No exact match found in database.';
      if (evidence.length > 250) evidence = evidence.substring(0, 250) + '...';

      const textScore = claimData?.modality_scores?.text?.score || 0;
      const tLabel = claimData?.modality_scores?.text?.label || 'UNKNOWN';
      const consistScore = claimData?.consistency_score || 0;
      const numDev = claimData?.numeric_deviation !== -1 ? claimData?.numeric_deviation : 'N/A';

      const mappedResult = {
        verdict: isBlock ? 'False' : isReview ? 'Misleading' : 'Mostly True',
        confidence: Math.round(res.data.trust_score),
        color: isBlock ? '#c91e2a' : isReview ? '#b45309' : '#065f46',
        bg: isBlock ? 'linear-gradient(135deg,#fff4f4,#fffafa)' : isReview ? 'linear-gradient(135deg,#fffbeb,#fefce8)' : 'linear-gradient(135deg,#f0fdf4,#f8fafc)',
        border: isBlock ? '#f8e4e6' : isReview ? '#fde68a' : '#bbf7d0',
        symbolColor: isBlock ? '#f14f57' : isReview ? '#d97706' : '#10b981',
        barColor: isBlock ? '#ef4444' : isReview ? '#f59e0b' : '#10b981',
        summary: res.data.explanation,
        type: 'Live Verification',
        domain: 'General Analysis',
        topics: ['API Scan'],
        sourcesCount: 1,
        analysisTime: 'API Response',
        reasoning: [
          `Text Analysis: Classified as ${tLabel} (Confidence: ${Math.round(textScore * 100)}%)`,
          `Numeric deviation from ground truth calculated at: ${numDev === 'N/A' ? 'None Detected' : numDev + '%'}`,
          `Final blended pipeline consistency score is ${Math.round(consistScore * 100)}%`
        ],
        takeaway: res.data.decision,
        analysis: 'Processed by TrustAgent backend pipeline.',
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=1200&q=85',
        imageAlt: 'Verification result',
        quote: `"${evidence}"`,
        quoteSource: '— Retrieved Evidence (Qdrant / Web)',
        supporting: isBlock ? 0 : 1, contradicting: isBlock ? 1 : 0, lowCred: 0
      }
      
      setCurrentResult(mappedResult)
      onHistoryAdd && onHistoryAdd({ claim, verdict: mappedResult.verdict, confidence: mappedResult.confidence, domain: mappedResult.domain })
      setMessage('E-commerce audit complete. Verification report is ready below.')
    } catch (err) {
      console.error(err);
      setMessage('Verification failed. Backend might be unreachable.');
    } finally {
      setBusy(false)
    }
  }

  const sources = getSources(claim)
  const verdict = currentResult

  const visibleSources = useMemo(() => {
    const result = sources.filter((src) => {
      const stanceMatch = filter === 'All Sources'
        || (filter === 'Supporting' && src.stance === 'Supports')
        || (filter === 'Contradicting' && src.stance === 'Contradicts')
        || (filter === 'Low Credibility' && src.credibility < 85)
      return stanceMatch && `${src.name} ${src.url} ${src.excerpt}`.toLowerCase().includes(search.toLowerCase())
    })
    return sort === 'Credibility' ? [...result].sort((a, b) => b.credibility - a.credibility) : result
  }, [sources, filter, search, sort])

  return (
    <div className="dashboard-layout">
      <section className="primary-column">
        {/* Composer */}
        <section className="composer panel">
          <div className="eyebrow"><span>E-Commerce Trust Audit</span></div>
          <h1>Verify any product deal or seller</h1>
          <p className="intro">Detect counterfeits, review fraud, artificial flash discounts, and hidden return fees with cross-platform evidence.</p>
          <div className="input-modes" role="tablist" aria-label="Verification type">
            {['Text', 'URL', 'Article', 'Image'].map((label) => (
              <button key={label} role="tab" aria-selected={mode === label}
                className={mode === label ? 'mode active' : 'mode'}
                onClick={() => setMode(label)}>
                <Icon name={label === 'URL' ? 'link' : label === 'Image' ? 'image' : label === 'Article' ? 'file' : 'spark'} size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Mode 1: Text */}
          {mode === 'Text' && (
            <>
              <div className="claim-box">
                <textarea
                  value={claim}
                  maxLength={500}
                  aria-label="Claim to verify"
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Type or paste any statement, rumor, or claim to verify..."
                />
                <div className="claim-controls">
                  <span>{claim.length} / 500</span>
                  <button onClick={verify} disabled={busy || !claim.trim()} aria-label="Verify claim">
                    {busy ? <i className="spinner" /> : <Icon name="arrow" size={19} />}
                  </button>
                </div>
              </div>
              <div className="examples">
                <span>Try an example:</span>
                {EXAMPLES.map((item) => (
                  <button key={item} onClick={() => { setClaim(`${item}.`); setMessage(''); setCurrentResult(null) }}>{item}</button>
                ))}
              </div>
            </>
          )}

          {/* Mode 2: URL */}
          {mode === 'URL' && (
            <div className="mode-panel url-panel">
              <div className="url-input-container">
                <div className="url-input-field">
                  <Icon name="link" size={18} />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Paste URL to fact-check (e.g. news article, tweet, blog post)..."
                  />
                  <button
                    className="btn-fetch-url"
                    disabled={urlLoading || !urlInput.trim()}
                    onClick={() => {
                      setUrlLoading(true)
                      setTimeout(() => {
                        setUrlLoading(false)
                        let extracted = 'AirPods Pro 2 for $29 are genuine Apple'
                        if (urlInput.toLowerCase().includes('sony') || urlInput.toLowerCase().includes('headphone')) extracted = 'Sony WH-1000XM5 70% off flash deal is real'
                        else if (urlInput.toLowerCase().includes('silk') || urlInput.toLowerCase().includes('sheet')) extracted = '100% Mulberry Silk sheet set for $18.99'
                        else if (urlInput.toLowerCase().includes('review') || urlInput.toLowerCase().includes('earbud')) extracted = 'Earbuds with 15k 5-star reviews have no fake reviews'
                        else if (urlInput.toLowerCase().includes('return') || urlInput.toLowerCase().includes('seller')) extracted = 'Seller offers free 30-day returns with no fees'
                        setClaim(extracted)
                        let domainName = 'marketplace.com'
                        try {
                          domainName = new URL(urlInput.startsWith('http') ? urlInput : `https://${urlInput}`).hostname
                        } catch (e) {
                          domainName = 'e-commerce'
                        }
                        setUrlStatus({
                          domain: domainName,
                          headline: `Listing Scanned: "${extracted}"`,
                          time: 'Scanned 0.8s ago'
                        })
                        setMessage('Product listing parsed from URL. Ready to audit.')
                      }, 500)
                    }}
                  >
                    {urlLoading ? <i className="spinner" /> : <><Icon name="spark" size={14} /> Scan & Audit</>}
                  </button>
                </div>

                {urlStatus && (
                  <div className="url-preview-banner">
                    <span className="url-preview-badge"><Icon name="globe" size={14} /> {urlStatus.domain}</span>
                    <div className="url-preview-text">
                      <strong>{urlStatus.headline}</strong>
                      <small>{urlStatus.time} · Ready for cross-platform seller & counterfeit audit</small>
                    </div>
                  </div>
                )}

                <div className="claim-box" style={{ marginTop: 12 }}>
                  <textarea
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    placeholder="Product claim or listing promise to audit..."
                  />
                  <div className="claim-controls">
                    <span>{claim.length} / 500</span>
                    <button onClick={verify} disabled={busy || !claim.trim()} aria-label="Verify URL claim">
                      {busy ? <i className="spinner" /> : <Icon name="arrow" size={19} />}
                    </button>
                  </div>
                </div>

                <div className="examples">
                  <span>Sample listings to audit:</span>
                  <button onClick={() => {
                    setUrlInput('https://amazon.com/dp/B0BDHW48M2/airpods-pro-deal')
                    setClaim('AirPods Pro 2 for $29 are genuine Apple')
                    setUrlStatus({ domain: 'amazon.com', headline: 'AirPods Pro 2 for $29 Marketplace Deal', time: 'Indexed' })
                  }}>AirPods $29 Deal</button>
                  <button onClick={() => {
                    setUrlInput('https://bestbuy.com/site/sony-wh-1000xm5-70off/6505727.p')
                    setClaim('Sony WH-1000XM5 70% off flash deal is real')
                    setUrlStatus({ domain: 'bestbuy.com', headline: 'Sony WH-1000XM5 Flash Discount Claim', time: 'Indexed' })
                  }}>Sony 70% Flash Sale</button>
                  <button onClick={() => {
                    setUrlInput('https://shopify-deals.store/products/100-mulberry-silk-bedding')
                    setClaim('100% Mulberry Silk sheet set for $18.99')
                    setUrlStatus({ domain: 'shopify-deals.store', headline: '100% Mulberry Silk Sheet Set $18.99', time: 'Indexed' })
                  }}>Mulberry Silk Sheet Deal</button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Article */}
          {mode === 'Article' && (
            <div className="mode-panel article-panel">
              <div className="article-fields">
                <input
                  className="article-title-input"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Listing Headline / Product Title (optional)"
                />

                {/* Document Upload Box */}
                <div className="doc-upload-zone" onClick={() => document.getElementById('article-doc-input')?.click()}>
                  <input
                    id="article-doc-input"
                    type="file"
                    accept=".txt,.pdf,.docx,.md,.json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setArticleDoc({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' })
                      setArticleTitle(file.name.replace(/\.[^/.]+$/, ''))
                      const reader = new FileReader()
                      reader.onload = (evt) => {
                        const text = evt.target?.result
                        if (typeof text === 'string') {
                          const clean = text.slice(0, 1000)
                          setArticleBody(clean)
                          setClaim(clean.split('.')[0] + '.')
                        }
                      }
                      reader.readAsText(file)
                      setMessage(`Uploaded "${file.name}". Ready to verify.`)
                    }}
                  />
                  <div className="doc-upload-inner">
                    <Icon name="upload" size={24} />
                    <div>
                      <strong>Click to upload product spec or drag & drop</strong>
                      <small>Supports .txt, .pdf, .docx, .md files (up to 25MB)</small>
                    </div>
                  </div>
                </div>

                {articleDoc && (
                  <div className="file-status-pill">
                    <Icon name="file" size={15} />
                    <span><b>{articleDoc.name}</b> ({articleDoc.size})</span>
                    <button onClick={(e) => { e.stopPropagation(); setArticleDoc(null); }} title="Remove file">
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                )}

                <div className="claim-box" style={{ marginTop: 12 }}>
                  <textarea
                    style={{ minHeight: 90 }}
                    value={articleBody}
                    onChange={(e) => {
                      setArticleBody(e.target.value)
                      setClaim(e.target.value.split('.')[0] + '.')
                    }}
                    placeholder="Paste or edit the product description or seller terms here..."
                  />
                  <div className="claim-controls">
                    <span>{articleBody.length} characters</span>
                    <button onClick={verify} disabled={busy || !articleBody.trim()} aria-label="Verify article">
                      {busy ? <i className="spinner" /> : <Icon name="arrow" size={19} />}
                    </button>
                  </div>
                </div>

                <div className="examples">
                  <span>Load sample product descriptions:</span>
                  <button onClick={() => {
                    setArticleTitle('AirPods Pro 2 Liquidation Clearance')
                    const body = 'Brand new Apple AirPods Pro 2 with MagSafe Case for $29.99. 100% original Apple hardware direct from warehouse liquidation inventory with valid serial numbers.'
                    setArticleBody(body)
                    setClaim('AirPods Pro 2 for $29 are genuine Apple')
                    setArticleDoc({ name: 'airpods_deal_description.txt', size: '1.2 KB' })
                  }}>AirPods Clearance Post</button>
                  <button onClick={() => {
                    setArticleTitle('Marketplace Return Guarantee & Shipping Disclosure')
                    const body = 'Promotional banner states "Risk-Free 30-Day Money Back Returns". Nested section 8.4 mandates tracked international shipping paid by buyer plus 25% restocking deduction.'
                    setArticleBody(body)
                    setClaim('Seller offers free 30-day returns with no fees')
                    setArticleDoc({ name: 'seller_return_policy.txt', size: '2.4 KB' })
                  }}>Seller Return Terms</button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 4: Image */}
          {mode === 'Image' && (
            <div className="mode-panel image-panel">
              <div className="image-upload-wrapper">
                <input
                  id="image-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = URL.createObjectURL(file)
                    setImageFile(file)
                    setImagePreview(url)
                    setImageFileName(file.name)
                    const detected = 'AirPods Pro 2 for $29 are genuine Apple'
                    setImageOcrClaim(detected)
                    setClaim(detected)
                    setMessage(`Image "${file.name}" uploaded. Claim extracted below.`)
                  }}
                />

                <div
                  className="image-dropzone"
                  onClick={() => document.getElementById('image-file-input')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setImageFile(file)
                      setImagePreview(url)
                      setImageFileName(file.name)
                      const detected = 'AirPods Pro 2 for $29 are genuine Apple'
                      setImageOcrClaim(detected)
                      setClaim(detected)
                      setMessage(`Image "${file.name}" uploaded. Claim extracted below.`)
                    }
                  }}
                >
                  {imagePreview ? (
                    <div className="image-preview-box">
                      <img src={imagePreview} alt="Uploaded claim preview" />
                      <div className="image-preview-overlay">
                        <span className="image-name-tag"><Icon name="image" size={14} /> {imageFileName}</span>
                        <button
                          type="button"
                          className="btn-replace-img"
                          onClick={(e) => {
                            e.stopPropagation()
                            document.getElementById('image-file-input')?.click()
                          }}
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="image-dropzone-prompt">
                      <div className="dropzone-icon"><Icon name="upload" size={28} /></div>
                      <strong>Drop product photo or deal screenshot here</strong>
                      <small>Upload screenshots, product tags, price tags, or receipts (.jpg, .png, .webp)</small>
                    </div>
                  )}
                </div>

                {imagePreview && (
                  <div className="ocr-extraction-card">
                    <div className="ocr-header">
                      <span className="ocr-badge"><Icon name="spark" size={14} /> Visual Claim Extracted (OCR)</span>
                      <small>Verify or edit before checking</small>
                    </div>
                    <div className="claim-box" style={{ marginTop: 8 }}>
                      <textarea
                        value={claim}
                        onChange={(e) => setClaim(e.target.value)}
                        placeholder="Visual claim extracted from image..."
                      />
                      <div className="claim-controls">
                        <span>{claim.length} / 500</span>
                        <button onClick={verify} disabled={busy || !claim.trim()} aria-label="Verify image claim">
                          {busy ? <i className="spinner" /> : <Icon name="arrow" size={19} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="examples">
                  <span>Sample product screenshots:</span>
                  <button onClick={() => {
                    setImagePreview('https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=700&q=80')
                    setImageFileName('airpods_pro_superdeal_screenshot.png')
                    const detected = 'AirPods Pro 2 for $29 are genuine Apple'
                    setImageOcrClaim(detected)
                    setClaim(detected)
                    setMessage('Product deal screenshot loaded. Extracted claim below.')
                  }}>🎧 AirPods $29 Deal Screenshot</button>
                  <button onClick={() => {
                    setImagePreview('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80')
                    setImageFileName('sony_headphones_flash_banner.png')
                    const detected = 'Sony WH-1000XM5 70% off flash deal is real'
                    setImageOcrClaim(detected)
                    setClaim(detected)
                    setMessage('Promotional banner loaded. Extracted claim below.')
                  }}>🏷️ Sony 70% Off Banner</button>
                  <button onClick={() => {
                    setImagePreview('https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=700&q=80')
                    setImageFileName('silk_sheets_material_tag.png')
                    const detected = '100% Mulberry Silk sheet set for $18.99'
                    setImageOcrClaim(detected)
                    setClaim(detected)
                    setMessage('Fabric tag image loaded. Extracted claim below.')
                  }}>📦 Silk Bedding Spec Tag</button>
                </div>
              </div>
            </div>
          )}

          {message && <div className="notice-line"><Icon name="check" size={14} />{message}</div>}
        </section>

        {/* Verification Result */}
        {verdict && (
          <section className="result-panel panel">
            <div className="result-heading">
              <div className="result-title">
                <Icon name="settings" />
                <h2>Verification Result</h2>
                <span className="category-pill"><Icon name="shield" size={12} /> {verdict.domain}</span>
              </div>
              <div className="result-tools">
                <time>Oct 1, 2026 · 02:34 PM</time>
                <button onClick={() => setMessage('Share link copied to clipboard.')}><Icon name="external" size={14} />Share</button>
                <button className={saved ? 'saved' : ''} aria-label="Save investigation"
                  onClick={() => { setSaved(!saved); setMessage(saved ? 'Removed from saved investigations.' : 'Saved to your investigations.') }}>
                  <Icon name="bookmark" size={14} />
                </button>
              </div>
            </div>

            <div className="verdict-grid">
              <div className="verdict-card" style={{ background: verdict.bg, borderColor: verdict.border }}>
                <div className="verdict-top">
                  <span className="verdict-symbol" style={{ color: 'white', background: verdict.symbolColor, borderColor: verdict.symbolBorder, boxShadow: `0 0 0 5px ${verdict.symbolGlow}` }}>
                    {verdict.verdict === 'False' || verdict.verdict === 'Misleading' ? <Icon name="close" size={30} /> : verdict.verdict === 'Mostly True' ? <Icon name="check" size={30} /> : <span style={{ fontSize: 22 }}>?</span>}
                  </span>
                  <div><small>VERDICT</small><strong style={{ color: verdict.color }}>{verdict.verdict}</strong></div>
                </div>
                <p>{verdict.summary}</p>
                <div className="confidence-row">
                  <span>Confidence <b>{verdict.confidence}%</b></span>
                  <i><span style={{ width: `${verdict.confidence}%`, background: verdict.barColor }} /></i>
                </div>
              </div>
              <div className="feature-image">
                <img src={verdict.image} alt={verdict.imageAlt} />
                <div className="image-quote">
                  <p>{verdict.quote}</p>
                  <span>{verdict.quoteSource}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Evidence / Analysis Panel */}
        {verdict && (
          <section className="evidence-panel panel">
            <div className="evidence-tabs" role="tablist" aria-label="Verification details">
              {[`Evidence (${verdict.sourcesCount})`, 'Analysis', 'Sources', 'Timeline'].map((label) => {
                const name = label.split(' (')[0]
                return <button key={name} role="tab" aria-selected={tab === name}
                  className={tab === name ? 'active' : ''} onClick={() => setTab(name)}>{label}</button>
              })}
            </div>

            {(tab === 'Evidence' || tab === 'Sources') ? (
              <>
                <div className="evidence-filters">
                  <div className="filter-group">
                    {[
                      ['All Sources', `${verdict.sourcesCount}`],
                      ['Supporting', `${verdict.supporting}`],
                      ['Contradicting', `${verdict.contradicting}`],
                      ['Low Credibility', `${verdict.lowCred}`]
                    ].map(([label, count]) => (
                      <button key={label}
                        className={filter === label ? 'filter-chip active' : 'filter-chip'}
                        onClick={() => setFilter(label)}>
                        <i className={`dot ${label.split(' ')[0].toLowerCase()}`} />
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                  <label className="source-search">
                    <Icon name="search" size={14} />
                    <input placeholder="Search sources..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </label>
                  <label className="sort-select">
                    <Icon name="sliders" size={13} />
                    <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort evidence">
                      <option>Relevance</option>
                      <option>Credibility</option>
                    </select>
                  </label>
                </div>

                <div className="source-list">
                  {visibleSources.map((source) => (
                    <article key={source.name} className={`source-row ${source.stance === 'Supports' ? 'supporting' : ''}`}>
                      <div className="source-logo" style={{ '--source-color': source.color }}>{source.initials}</div>
                      <div className="source-description">
                        <strong>{source.name}</strong>
                        <a href={`https://${source.url}`} target="_blank" rel="noreferrer">
                          https://www.{source.url} <Icon name="external" size={10} />
                        </a>
                        <span className={source.stance === 'Supports' ? 'stance supports' : 'stance'}>
                          <Icon name={source.stance === 'Supports' ? 'check' : 'close'} size={10} />{source.stance}
                        </span>
                        <p>"{source.excerpt}"</p>
                      </div>
                      <div className="source-metrics">
                        {[['Relevance', source.relevance], ['Credibility', source.credibility]].map(([label, value]) => (
                          <div key={label}>
                            <span>{label}</span><b>{value}%</b>
                            <i><span style={{ width: `${value}%` }} /></i>
                          </div>
                        ))}
                      </div>
                      <div className="source-meta">
                        <span>{source.kind}</span>
                        <small>Updated: {source.date}</small>
                        <a href={`https://${source.url}`} target="_blank" rel="noreferrer">
                          Read Source <Icon name="external" size={11} />
                        </a>
                      </div>
                    </article>
                  ))}
                  {!visibleSources.length && <div className="empty-results">No sources match this search.</div>}
                </div>
              </>
            ) : (
              <div className="detail-view">
                {tab === 'Analysis' ? (
                  <>
                    <h3>How we reached this verdict</h3>
                    <p>{verdict.analysis}</p>
                    <div className="analysis-stats">
                      <span><b>{verdict.sourcesCount}</b> sources analyzed</span>
                      <span><b>{verdict.contradicting}</b> contradicting</span>
                      <span><b>{verdict.supporting}</b> supporting</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Verification timeline</h3>
                    {['Claim submitted', `${verdict.sourcesCount} sources analyzed`, 'Verdict confidence calculated', 'Result published'].map((item) => (
                      <p className="timeline-entry" key={item}><i />{item}<time>Oct 1, 2026 · 2:34 PM</time></p>
                    ))}
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* Empty state if no result yet */}
        {!verdict && !busy && (
          <section className="panel empty-verification-state">
            <div className="empty-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <h3>Awaiting verification</h3>
            <p>Submit a claim above to see the full analysis, evidence, and verdict.</p>
          </section>
        )}
        {busy && (
          <section className="panel empty-verification-state">
            <div className="analyzing-spinner"><i className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
            <h3>Analyzing…</h3>
            <p>Searching trusted sources and computing the trust score.</p>
          </section>
        )}
      </section>

      {/* Right Column */}
      <aside className="insight-column">
        {verdict && (
          <>
            <section className="context-panel panel">
              <h2><Icon name="file" />Claim Context</h2>
              <dl>
                <div><dt>Type</dt><dd>{verdict.type}</dd></div>
                <div><dt>Domain</dt><dd>{verdict.domain}</dd></div>
                <div className="topics">
                  <dt>Related Topics</dt>
                  <dd>{verdict.topics.map(t => <span key={t}>{t}</span>)}</dd>
                </div>
                <div><dt>Sources Analyzed</dt><dd>{verdict.sourcesCount}</dd></div>
                <div><dt>Analysis Time</dt><dd>{verdict.analysisTime}</dd></div>
              </dl>
            </section>

            <section className="reasoning-panel panel">
              <h2><Icon name="bulb" />Why this verdict?</h2>
              <ol>
                {verdict.reasoning.map((reason, i) => (
                  <li key={i}><i>{i + 1}</i><p>{reason}</p></li>
                ))}
              </ol>
              <button className="analysis-button" onClick={() => setTab('Analysis')}>
                View detailed analysis <Icon name="arrow" />
              </button>
            </section>

            <section className="relationship-panel panel">
              <h2><Icon name="link" />Source Relationship</h2>
              <div className="relationship-map">
                <svg viewBox="0 0 280 170" aria-hidden="true">
                  <path d="M140 85 196 26M140 85 215 58M140 85 220 88M140 85 205 133M140 85 73 53M140 85 73 119" />
                </svg>
                <div className="claim-node"><Icon name="file" size={17} /><span>Product</span></div>
                <div className="node node-applereg"><i />Apple Registry<small>(Counterfeit)</small></div>
                <div className="node node-fakespot"><i />FakeSpot<small>(Flagged)</small></div>
                <div className="node node-camel"><i />CamelCamelCamel<small>(Price Floor)</small></div>
                <div className="node node-bbb"><i />BBB Bureau<small>(Complaints)</small></div>
                <div className="node node-trustpilot"><i />Trustpilot<small>(1.3★ Rating)</small></div>
                <div className="node node-dealblog"><i />Deal Blog<small>(Affiliate)</small></div>
              </div>
              <div className="relationship-legend">
                <span><i className="green" />Supporting ({verdict.supporting})</span>
                <span><i className="red" />Contradicting ({verdict.contradicting})</span>
                <span><i className="blue" />Related ({verdict.lowCred})</span>
              </div>
            </section>

            <section className="takeaway-panel">
              <span><Icon name="bookmark" size={19} /></span>
              <div>
                <h2>Key Takeaway</h2>
                <p>{verdict.takeaway}</p>
              </div>
            </section>
          </>
        )}

        {!verdict && (
          <section className="context-panel panel">
            <h2><Icon name="file" />Product Trust Context</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>Seller telemetry, counterfeit risks, and price history will appear here after you run an audit.</p>
          </section>
        )}
      </aside>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [nav, setNav] = useState('New Verification')
  const [globalSearch, setGlobalSearch] = useState('')
  const [pendingClaim, setPendingClaim] = useState(null)
  const [history, setHistory] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8000/history');
      const mapped = res.data.map(h => {
        const isBlock = h.decision === 'BLOCK';
        const isReview = h.decision === 'HUMAN_REVIEW';
        const dateObj = h.created_at ? new Date(h.created_at) : new Date();
        return {
          id: h.id,
          claim: h.claim,
          verdict: isBlock ? 'False' : isReview ? 'Misleading' : 'Mostly True',
          confidence: Math.round(h.trust_score),
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          domain: 'General Analysis'
        };
      });
      setHistory(mapped);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const addHistory = () => {
    fetchHistory();
  }

  const openClaim = (claim) => {
    setPendingClaim(claim)
    setNav('New Verification')
  }

  const handleGlobalSearch = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      setPendingClaim(globalSearch.trim())
      setGlobalSearch('')
      setNav('New Verification')
    }
  }

  const navigation = [
    ['New Verification', 'search'],
    ['History', 'clock'],
    ['Saved Investigations', 'bookmark'],
    ['Sources', 'file'],
    ['Collections', 'folder'],
  ]
  const researchNav = [
    ['Source Explorer', 'file'],
    ['Knowledge Graph', 'network'],
    ['Domain Insights', 'globe'],
  ]

  const renderPage = () => {
    switch (nav) {
      case 'New Verification': return <VerificationPage key={pendingClaim} initClaim={pendingClaim} onHistoryAdd={addHistory} />
      case 'History': return <HistoryPage history={history} onSelect={openClaim} />
      case 'Saved Investigations': return <SavedPage onSelect={openClaim} />
      case 'Sources': return <SourcesPage />
      case 'Collections': return <CollectionsPage onSelect={openClaim} />
      case 'Source Explorer': return <SourceExplorerPage />
      case 'Knowledge Graph': return <KnowledgeGraphPage />
      case 'Domain Insights': return <DomainInsightsPage />
      case 'Settings': return <SettingsPage />
      default: return <VerificationPage key={pendingClaim} initClaim={pendingClaim} onHistoryAdd={addHistory} />
    }
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <button
            className="brand"
            onClick={() => setSidebarOpen(prev => !prev)}
            title="Click to toggle sidebar"
          >
            <div className="brand-logo-wrap">
              <img
                src="/trustagent-dashboard-icon.png"
                alt="TrustAgent Icon"
                className="brand-logo-img"
              />
              <span className="brand-live-dot" />
            </div>
            <div className="brand-info">
              <strong>TrustAgent</strong>
              <small className="brand-tagline">E-Commerce Security</small>
            </div>
          </button>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navigation.map(([label, icon]) => (
            <button key={label} className={`side-link ${nav === label ? 'selected' : ''}`}
              onClick={() => setNav(label)}>
              <Icon name={icon} /><span>{label}</span>
            </button>
          ))}
          <div className="nav-label">Research</div>
          {researchNav.map(([label, icon]) => (
            <button key={label} className={`side-link ${nav === label ? 'selected' : ''}`}
              onClick={() => setNav(label)}>
              <Icon name={icon} /><span>{label}</span>
            </button>
          ))}
          <div className="nav-label account-label">Account</div>
          <button className={`side-link ${nav === 'Settings' ? 'selected' : ''}`} onClick={() => setNav('Settings')}>
            <Icon name="settings" /><span>Settings</span>
          </button>
        </nav>
        {/* Profile at bottom of sidebar */}
        <div className="sidebar-profile">
          <div className="profile-avatar">R</div>
          <div>
            <div className="profile-name">Rushikesh</div>
            <div className="profile-role">Commerce Analyst</div>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button sidebar-open-trigger"
              onClick={() => setSidebarOpen(prev => !prev)}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              aria-label="Toggle sidebar"
            >
              <Icon name={sidebarOpen ? "panelLeft" : "menu"} size={18} />
            </button>
            {!sidebarOpen && (
              <button
                type="button"
                className="topbar-brand-chip"
                onClick={() => setSidebarOpen(true)}
                title="Expand sidebar"
              >
                <img src="/trustagent-dashboard-icon.png" alt="TrustAgent" className="topbar-brand-img" />
                <span className="topbar-brand-title">TrustAgent</span>
              </button>
            )}
            <label className="global-search">
              <Icon name="search" />
              <input
                aria-label="Search products and sellers"
                placeholder="Paste a product link, seller name, or deal claim to verify..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
              />
              <kbd>↵ Enter</kbd>
            </label>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Toggle theme"
              onClick={() => document.body.classList.toggle('dim-mode')}>
              <Icon name="moon" />
            </button>
            <button className="icon-button notification" aria-label="Notifications"
              onClick={() => {}}>
              <Icon name="bell" />
            </button>
            <button className="profile-button" onClick={() => setNav('Settings')}>
              <i>R</i><span>Rushikesh</span><small>⌄</small>
            </button>
          </div>
        </header>

        <div className="main-scroll">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default Dashboard