import React, { useState } from 'react';
import styles from './ListItem.module.css';
import { getStudent } from '../auth/studentAuth';

export default function ListItem() {
  const [form, setForm] = useState({ title: '', category: 'Books', condition: 'Good', price: '', dept: '', description: '' });
  const [submitted, setSubmitted] = useState(false);
  const student = getStudent();

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  if (submitted) {
    return (
      <div>
        <div className={styles.pageHeader}><h2>Listing submitted!</h2><p>Your item is now live on the marketplace.</p></div>
        <div className={styles.successBox}>
          <span style={{ fontSize: 32 }}>🎉</span>
          <p style={{ fontWeight: 600, marginTop: 12 }}>"{form.title || 'Your item'}" has been listed.</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            Listed by <span style={{ fontWeight: 700, color: 'var(--text)' }}>{student?.fullName || student?.rollNumber || 'you'}</span>. Students will be able to find and message you about it.
          </p>
          <button className={styles.subBtn} style={{ marginTop: 20 }} onClick={() => { setSubmitted(false); setForm({ title: '', category: 'Books', condition: 'Good', price: '', dept: '', description: '' }); }}>
            List another item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>List an item</h2>
        <p>Sell your used items to fellow students</p>
      </div>

      <div className={styles.formBox}>
        <div className={styles.fg}>
          <label className={styles.flbl}>Item title</label>
          <input className={styles.finput} type="text" placeholder="e.g. Casio fx-991ES Calculator" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        <div className={styles.frow}>
          <div className={styles.fg}>
            <label className={styles.flbl}>Category</label>
            <select className={styles.finput} value={form.category} onChange={e => set('category', e.target.value)}>
              <option>Books</option>
              <option>Laptops</option>
              <option>Calculators</option>
              <option>Other</option>
            </select>
          </div>
          <div className={styles.fg}>
            <label className={styles.flbl}>Condition</label>
            <select className={styles.finput} value={form.condition} onChange={e => set('condition', e.target.value)}>
              <option>Good</option>
              <option>Fair</option>
              <option>Like New</option>
            </select>
          </div>
        </div>

        <div className={styles.frow}>
          <div className={styles.fg}>
            <label className={styles.flbl}>Price (₹)</label>
            <input className={styles.finput} type="number" placeholder="0" value={form.price} onChange={e => set('price', e.target.value)} />
          </div>
          <div className={styles.fg}>
            <label className={styles.flbl}>Department</label>
            <input className={styles.finput} type="text" placeholder="e.g. CSE, ECE" value={form.dept} onChange={e => set('dept', e.target.value)} />
          </div>
        </div>

        <div className={styles.fg}>
          <label className={styles.flbl}>Description</label>
          <textarea className={styles.finput} rows={3} placeholder="Describe condition, year of purchase, any defects…" value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        <div className={styles.fg}>
          <label className={styles.flbl}>Photos</label>
          <div className={styles.upload}>
            <span style={{ fontSize: 20 }}>📷</span>
            <span>Click to upload photos</span>
          </div>
        </div>

        <button className={styles.subBtn} onClick={() => setSubmitted(true)}>Submit listing</button>
      </div>
    </div>
  );
}
