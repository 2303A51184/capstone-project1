import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { TopNavbar } from '../common/TopNavbar';

export const AdminLayout = ({ title = 'Enterprise Fraud Governance', breadcrumbs = [] }) => {
  return (
    <div className="app-shell app-shell-admin">
      <Sidebar role="admin" />
      <div className="app-main-content">
        <TopNavbar title={title} breadcrumbs={breadcrumbs} />
        <main className="page-content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
