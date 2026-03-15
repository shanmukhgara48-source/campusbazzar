import React from 'react';
import styles from './AdminListings.module.css';
import { LISTINGS } from '../data';

export default function AdminListings() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>All listings</h2>
        <p>Manage every listing on the platform</p>
      </div>
      <div className={styles.tblWrap}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Item</th>
              <th style={{ width: '20%' }}>Seller</th>
              <th style={{ width: '14%' }}>Category</th>
              <th style={{ width: '14%' }}>Price</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '10%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {LISTINGS.map(l => (
              <tr key={l.id}>
                <td><span style={{ fontSize: 14, marginRight: 8 }}>{l.ico}</span>{l.t}</td>
                <td>
                  {l.seller}{' '}
                  <span style={{ color: 'var(--faint)', fontSize: 11 }}>{l.dept}</span>
                </td>
                <td>{l.cat}</td>
                <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{l.price}</td>
                <td><span className={styles.pillActive}>Active</span></td>
                <td>
                  <button className={styles.abtn}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
