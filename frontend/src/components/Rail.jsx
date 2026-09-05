import { NavLink } from 'react-router-dom'

export default function Rail({ sections, connected }) {
  return (
    <nav className="rail">
      <div className="rail-brand">
        <span className="rail-brand-mark">SC</span>
        <div className="rail-brand-text">
          <span className="rail-brand-name">SettleCheck</span>
          <span className="rail-brand-sub">Reconciliation Console</span>
        </div>
      </div>

      <div className="rail-status">
        <span className={`status-dot ${connected === true ? 'online' : connected === false ? 'offline' : ''}`} />
        <span>{connected === null ? 'Checking connection…' : connected ? 'Connected' : 'API unreachable'}</span>
      </div>

      <ul className="rail-nav">
        {sections.map((s, i) => (
          <li key={s.path}>
            <NavLink
              to={s.path}
              end={s.path === '/'}
              className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}
            >
              <span className="rail-num">{String(i + 1).padStart(2, '0')}</span>
              {s.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="rail-footer">
        <span>Track 04 — AI Finance Controller</span>
      </div>
    </nav>
  );
}
