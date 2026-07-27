import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider';

const NAV = [
  { to:'/admin',           label:'Dashboard', end:true  },
  { to:'/admin/leads',     label:'Requests',  end:false },
  { to:'/admin/quotes',    label:'Quotes',    end:false },
  { to:'/admin/jobs',      label:'Jobs',      end:false },
  { to:'/admin/customers', label:'Customers', end:false },
  { to:'/admin/catalog',   label:'What you sell', end:false },
  { to:'/admin/site',      label:'Your website',  end:false },
  { to:'/admin/settings',  label:'Settings',  end:false },
];

export default function AdminLayout() {
  const { admin, signOut } = useAuth();
  const nav = useNavigate();
  async function out() { await signOut(); nav('/admin/login', { replace: true }); }

  return (
    <div className="shell">
      <aside className="side">
        <div className="side-head">
          <div className="side-name">Santiago's</div>
          <div className="side-sub">Granite &amp; Quartz</div>
        </div>
        <nav className="side-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} id={'nav-' + n.to.split('/').pop()}
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
