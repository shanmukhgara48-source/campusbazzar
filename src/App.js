import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Browse from './components/Browse';
import Messages from './components/Messages';
import ListItem from './components/ListItem';
import SellerDash from './components/SellerDash';
import Saved from './components/Saved';
import AdminOverview from './components/AdminOverview';
import AdminListings from './components/AdminListings';
import AdminUsers from './components/AdminUsers';
import AdminFlagged from './components/AdminFlagged';
import Notifications from './components/Notifications';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import { MarketplaceProvider } from './MarketplaceContext';
import { DEFAULT_PAGE } from './data';
import StudentLogin from './components/StudentLogin';
import { getStudent, logoutStudent } from './auth/studentAuth';

export default function App() {
  const [role, setRole] = useState('buyer');
  const [page, setPage] = useState('browse');
  const [student, setStudent] = useState(() => getStudent());
  const [welcome, setWelcome] = useState('');

  const handleRoleChange = (r) => {
    setRole(r);
    setPage(DEFAULT_PAGE[r]);
  };

  const handlePageChange = (p) => {
    if (p === 'mylist') { setPage('sdash'); return; }
    setPage(p);
  };

  const renderPage = () => {
    switch (page) {
      case 'browse':       return <Browse />;
      case 'messages':     return <Messages />;
      case 'saved':        return <Saved />;
      case 'sdash':        return <SellerDash />;
      case 'list':         return <ListItem />;
      case 'aoverview':    return <AdminOverview onPageChange={handlePageChange} />;
      case 'alist':        return <AdminListings />;
      case 'ausers':       return <AdminUsers />;
      case 'aflag':        return <AdminFlagged />;
      case 'notifications':return <Notifications />;
      case 'product':      return <ProductDetail onMessageSeller={() => setPage('messages')} onOpenSeller={() => {}} />;
      case 'cart':         return <Cart />;
      default:             return <Browse />;
    }
  };

  const isMessages = page === 'messages';

  if (!student) {
    return (
      <StudentLogin
        onSuccess={(s) => {
          setStudent(s);
          setWelcome(`Welcome, ${s.fullName || s.rollNumber || 'student'}!`);
          setRole('buyer');
          setPage(DEFAULT_PAGE.buyer);
        }}
      />
    );
  }

  return (
    <MarketplaceProvider>
      <div className="app">
        <Sidebar role={role} page={page} onRoleChange={handleRoleChange} onPageChange={handlePageChange} />
        <div className="main">
          <Topbar
            role={role}
            student={student}
            onLogout={() => {
              logoutStudent();
              setStudent(null);
              setWelcome('');
            }}
            onPageChange={handlePageChange}
          />
          <div className="scroll">
            <div className={isMessages ? 'page page--messages' : 'page'}>
              {welcome ? (
                <div className="welcome" role="status">
                  <span>{welcome}</span>
                  <button type="button" className="welcome__close" onClick={() => setWelcome('')}>Dismiss</button>
                </div>
              ) : null}
              {renderPage()}
            </div>
          </div>
        </div>
      </div>
    </MarketplaceProvider>
  );
}
