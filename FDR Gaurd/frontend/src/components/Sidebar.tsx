import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PlusCircle, LogOut,
  Shield, ChevronLeft, ChevronRight, User, Building2
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-nav-item ${isActive ? 'active' : ''}`;

  const collegeLinks = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/fdr', icon: <FileText size={20} />, label: 'My FDR Records' },
    { to: '/fdr/new', icon: <PlusCircle size={20} />, label: 'New FDR' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Admin Dashboard' },
    { to: '/admin/fdr', icon: <FileText size={20} />, label: 'All FDR Records' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  const links = isAdmin ? adminLinks : collegeLinks;

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Shield size={28} className="logo-icon" />
          {!collapsed && (
            <div className="logo-text">
              <span className="logo-title">FDR Guard</span>
              <span className="logo-subtitle">AICTE Portal</span>
            </div>
          )}
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role indicator */}
      {!collapsed && (
        <div className="sidebar-role">
          <Building2 size={14} />
          <span>{isAdmin ? 'Administrator' : user?.institution_name || 'College User'}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {links.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={navClass} end={to === '/dashboard' || to === '/admin'}>
            <span className="nav-icon">{icon}</span>
            {!collapsed && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user">
            <div className="user-avatar">{user?.full_name?.[0] || 'U'}</div>
            <div className="user-info">
              <p className="user-name">{user?.full_name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
