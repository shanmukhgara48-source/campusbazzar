import React from 'react';
import styles from './Notifications.module.css';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'offer', title: 'New offer received', body: 'Priya R. offered ₹26,500 for HP Laptop 15s.', time: '2m ago' },
  { id: 2, type: 'chat', title: 'New message', body: 'Arjun S. sent you a new message about Engg Maths Vol.3.', time: '15m ago' },
  { id: 3, type: 'status', title: 'Offer accepted', body: 'Your ₹400 offer for Engg Mathematics Vol. 3 was accepted.', time: '1h ago' },
  { id: 4, type: 'meetup', title: 'Meet-up confirmed', body: 'Meet-up today at 4:00 PM near the main library.', time: 'Today' },
  { id: 5, type: 'status', title: 'Item marked as sold', body: 'Casio fx-991ES has been marked as sold.', time: 'Yesterday' },
];

function Pill({ type }) {
  const labelMap = {
    chat: 'Message',
    offer: 'Offer',
    status: 'Status',
    meetup: 'Meet-up',
  };

  return (
    <span className={`${styles.pill} ${styles[`pill_${type}`] || ''}`}>
      {labelMap[type] || 'Update'}
    </span>
  );
}

export default function Notifications() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h2>Notifications</h2>
        <p>Stay on top of new messages, offers, and meet-ups</p>
      </div>

      <div className={styles.list}>
        {MOCK_NOTIFICATIONS.map(n => (
          <div key={n.id} className={styles.item}>
            <div className={styles.iconCol}>
              <div className={styles.iconCircle}>
                {n.type === 'chat' && '💬'}
                {n.type === 'offer' && '🤝'}
                {n.type === 'status' && '✅'}
                {n.type === 'meetup' && '📍'}
              </div>
            </div>
            <div className={styles.body}>
              <div className={styles.row}>
                <div className={styles.title}>{n.title}</div>
                <div className={styles.time}>{n.time}</div>
              </div>
              <div className={styles.text}>{n.body}</div>
              <div className={styles.metaRow}>
                <Pill type={n.type} />
                <button className={styles.linkBtn}>View details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

