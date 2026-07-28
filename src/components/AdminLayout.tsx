import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider';

const NAV = [
  { to:'/admin',           label:'Dashboard', end:true  },
  { to:'/admin/assistant', label:'Your assistant', end:false },
  { to:'/admin/leads',     label:'Requests',  end:false },
  { to:'/admin/quotes',    label:'Quotes',    end:false },
  { to:'/admin/jobs',      label:'Jobs',      end:false },
  { to:'/admin/customers', label:'Customers', end:false },
  { to:'/admin/catalog',   label:'What you sell', end:false },
  { to:'/admin/blog',      label:'Blog',      end:false },
  { to:'/admin/site',      label:'Your website',  end:false },
  { to:'/admin/settings',  label:'Settings',  end:false },
];

export default function AdminLayout() {
  const { admin, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  async function out() { await signOut(); nav('/admin/login', { replace: true }); }

  return (
    <div className="shell">
      <aside className={'side' + (open ? ' open' : '')}>
        <div className="side-head">
          <div>
            <div className="side-name">Santiago's</div>
            <div className="side-sub">Granite &amp; Quartz</div>
          </div>
          <button
            className="side-toggle"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(v => !v)}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            <span>Menu</span>
          </button>
        </div>
        <nav className="side-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} id={'nav-' + n.to.split('/').pop()}
              onClick={() => setOpen(false)}
              className={({ isActive }) => 'side-link' + (isActive ? ' on' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who">{admin?.full_name ?? admin?.email}</div>
          <button className="btn ghost sm block" onClick={out}>Sign out</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
