import React from 'react';
import styles from './AdminUsers.module.css';
import { ADMIN_USERS } from '../data';

export default function AdminUsers() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Users</h2>
        <p>All verified student accounts</p>
      </div>
      <div className={styles.tblWrap}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Name</th>
              <th style={{ width: '18%' }}>Roll no.</th>
              <th style={{ width: '12%' }}>Dept</th>
              <th style={{ width: '12%' }}>Listings</th>
              <th style={{ width: '12%' }}>Trades</th>
              <th style={{ width: '14%' }}>Status</th>
              <th style={{ width: '10%' }}></th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_USERS.map((u, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{u.n}</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{u.r}</td>
                <td>{u.d}</td>
                <td>{u.l}</td>
                <td>{u.t}</td>
                <td>
                  <span className={`${styles.pill} ${u.s === 'Active' ? styles.pActive : styles.pFlag}`}>
                    {u.s}
                  </span>
                </td>
                <td><button className={styles.abtn}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
