import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../common/Sidebar';
import { TopNavbar } from '../common/TopNavbar';

export const UserLayout = ({ title = 'Client Portal', breadcrumbs = [] }) => {
  return (
    <div className="app-shell">
      <Sidebar role="user" />
      <div className="app-main-content">
        <TopNavbar title={title} breadcrumbs={breadcrumbs} />
        <main className="page-content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
