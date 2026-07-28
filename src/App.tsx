import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import BlogIndex from './pages/BlogIndex';
import BlogPost from './pages/BlogPost';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Assistant from './pages/admin/Assistant';
import Leads from './pages/admin/Leads';
import Quotes from './pages/admin/Quotes';
import QuoteBuilder from './pages/admin/QuoteBuilder';
import Jobs from './pages/admin/Jobs';
import Customers from './pages/admin/Customers';
import Catalog from './pages/admin/Catalog';
import Blog from './pages/admin/Blog';
import BlogEditor from './pages/admin/BlogEditor';
import SiteEditor from './pages/admin/SiteEditor';
import Settings from './pages/admin/Settings';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<BlogIndex />} />
      <Route path="/blog/:slug" element={<BlogPost />} />

      {/* specific before dynamic, always */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="leads" element={<Leads />} />
        <Route path="quotes/new" element={<QuoteBuilder />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="customers" element={<Customers />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="blog/new" element={<BlogEditor />} />
        <Route path="blog/:id" element={<BlogEditor />} />
        <Route path="blog" element={<Blog />} />
        <Route path="site" element={<SiteEditor />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
