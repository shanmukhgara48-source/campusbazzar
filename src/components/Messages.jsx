import React, { useState, useRef, useEffect } from 'react';
import styles from './Messages.module.css';
import { getStudent } from '../auth/studentAuth';

const CONVERSATIONS = [
  { id: 1, name: 'Priya R.',  initials: 'PR', avColor: 'green',  item: 'HP Laptop 15s',        price: '₹28,000', dept: 'CSE · 2nd year', time: '2m ago',   unread: true,  preview: 'Is the laptop still available?' },
  { id: 2, name: 'Arjun S.',  initials: 'AS', avColor: 'blue',   item: 'Engg Maths Vol.3',      price: '₹450',    dept: 'ECE · 3rd year', time: '1h ago',   unread: true,  preview: 'Can you do ₹400 for the book?' },
  { id: 3, name: 'Rohit M.',  initials: 'RM', avColor: 'amber',  item: 'Casio fx-991ES',         price: '₹350',    dept: 'Mech · 2nd year',time: '3h ago',   unread: false, preview: "I'll pick it up tomorrow morning" },
  { id: 4, name: 'Sneha K.',  initials: 'SK', avColor: 'purple', item: 'Data Structures Book',   price: '₹220',    dept: 'CSE · 1st year', time: 'Yesterday',unread: false, preview: 'Thanks, I will let you know!' },
];

const INITIAL_MESSAGES = [
  { id: 1, text: 'Hi! Is the HP Laptop still available?',                                                                  out: false, time: '10:24 AM' },
  { id: 2, text: 'Yes it is! What would you like to know?',                                                                out: true,  time: '10:26 AM' },
  { id: 3, text: "What's the battery backup like? Any scratches on the body?",                                             out: false, time: '10:27 AM' },
  { id: 4, text: 'Battery gives ~4 hrs. Minor scuff on the bottom — screen is perfect. Can share more photos!',            out: true,  time: '10:29 AM' },
  { id: 5, text: 'Sounds good! Can I come see it today around 4 PM near the library?',                                     out: false, time: '10:31 AM' },
];

const AUTO_REPLIES = [
  'Sure, 4 PM near the library works!',
  'Let me check and get back to you.',
  'Can we do 5 PM instead?',
  'Sounds great, see you then!',
  'Is the price negotiable?',
];

const AV_COLORS = {
  green:  { bg: '#d4eddf', color: '#0f5c30' },
  blue:   { bg: '#dbeafe', color: '#1d4ed8' },
  amber:  { bg: '#fef3c7', color: '#92400e' },
  purple: { bg: '#ede9fe', color: '#5b21b6' },
};

function Avatar({ initials, avColor, size = 40 }) {
  const c = AV_COLORS[avColor] || AV_COLORS.green;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c.bg, color: c.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size <= 30 ? 9 : 13, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function DoubleCheck() {
  return (
    <svg width="13" height="9" viewBox="0 0 14 9" fill="none" style={{ marginLeft: 3 }}>
      <path d="M1 4.5l3 3 5-6" stroke="#2d7a52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 4.5l3 3 5-6" stroke="#2d7a52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Messages() {
  const [activeId, setActiveId] = useState(1);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [offers, setOffers] = useState([]);
  const [offerPrice, setOfferPrice] = useState('');
  const [showOfferBox, setShowOfferBox] = useState(false);
  const [showMeetupBox, setShowMeetupBox] = useState(false);
  const [meetup, setMeetup] = useState(null);
  const [meetTime, setMeetTime] = useState('');
  const [meetPlace, setMeetPlace] = useState('');
  const [status, setStatus] = useState('open'); // open | sold
  const [showRatingBox, setShowRatingBox] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittedReview, setSubmittedReview] = useState(null);
  const bottomRef = useRef(null);
  const me = getStudent();

  const activeConv = CONVERSATIONS.find(c => c.id === activeId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const addSystemMessage = (text) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, out: false, time: now, system: true }]);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), text, out: true, time: now }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, out: false, time: replyTime }]);
    }, 1500);
  };

  const handleSendOffer = () => {
    const v = offerPrice.trim();
    if (!v) return;
    const numeric = Number(v);
    const priceLabel = Number.isNaN(numeric) ? v : `₹${numeric.toLocaleString('en-IN')}`;
    const offer = { id: Date.now(), price: priceLabel, status: 'pending' };
    setOffers(prev => [...prev, offer]);
    addSystemMessage(`You sent an offer of ${priceLabel}.`);
    setOfferPrice('');
    setShowOfferBox(false);
  };

  const updateOfferStatus = (id, action) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status: action } : o));
    const offer = offers.find(o => o.id === id);
    if (!offer) return;
    if (action === 'accepted') {
      addSystemMessage(`You accepted the offer of ${offer.price}.`);
    } else if (action === 'rejected') {
      addSystemMessage(`You rejected the offer of ${offer.price}.`);
    } else if (action === 'counter') {
      addSystemMessage(`You sent a counteroffer on ${offer.price}.`);
    }
  };

  const handleCreateMeetup = () => {
    if (!meetTime.trim() || !meetPlace.trim()) return;
    const m = { time: meetTime.trim(), place: meetPlace.trim(), confirmed: false };
    setMeetup(m);
    addSystemMessage(`Proposed meet-up: ${m.time} at ${m.place}.`);
    setShowMeetupBox(false);
  };

  const handleConfirmMeetup = () => {
    if (!meetup) return;
    const updated = { ...meetup, confirmed: true };
    setMeetup(updated);
    addSystemMessage(`Meet-up confirmed for ${updated.time} at ${updated.place}.`);
  };

  const handleMarkSold = () => {
    if (status === 'sold') return;
    // lightweight confirmation
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Mark this item as sold and close the conversation?');
    if (!ok) return;
    setStatus('sold');
    addSystemMessage('Item marked as sold. You can now leave a rating and short review.');
    setShowRatingBox(true);
  };

  const handleSubmitReview = () => {
    if (!rating) return;
    const data = { rating, review: review.trim(), by: me?.fullName || me?.rollNumber || 'You' };
    setSubmittedReview(data);
    setShowRatingBox(false);
    addSystemMessage(`${data.by} rated this transaction ${rating}/5: "${data.review || 'No written review'}".`);
  };

  return (
    <div className={styles.wrap}>

      {/* Conversation list */}
      <div className={styles.convPanel}>
        <div className={styles.cpHeader}>
          <div className={styles.cpTitle}>Messages</div>
          <div className={styles.cpSearch}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="#b0b0b0" strokeWidth="1.4" />
              <path d="M9 9l3 3" stroke="#b0b0b0" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Search conversations…" />
          </div>
        </div>
        <div className={styles.cpList}>
          {CONVERSATIONS.map(c => (
            <div
              key={c.id}
              className={`${styles.convItem} ${activeId === c.id ? styles.convActive : ''}`}
              onClick={() => setActiveId(c.id)}
            >
              <Avatar initials={c.initials} avColor={c.avColor} size={44} />
              <div className={styles.convBody}>
                <div className={styles.convRow}>
                  <span className={styles.convName}>{c.name}</span>
                  <span className={styles.convTime}>{c.time}</span>
                </div>
                <div className={styles.convItemLabel}>{c.item} · {c.price}</div>
                <div className={styles.convPreview}>{c.preview}</div>
              </div>
              {c.unread && <div className={styles.unreadDot} />}
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className={styles.chat}>

        {/* Header */}
        <div className={styles.chatHeader}>
          <Avatar initials={activeConv.initials} avColor={activeConv.avColor} size={42} />
          <div className={styles.chInfo}>
            <div className={styles.chName}>
              {activeConv.name}
              <span className={styles.chVerified}>✓ Verified</span>
            </div>
            <div className={styles.chSub}>
              <span className={styles.chItemTag}>{activeConv.item} · {activeConv.price}</span>
              <span>{activeConv.dept}</span>
            </div>
          </div>
          <div className={styles.chActions}>
            <button className={styles.chBtn}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="1.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 5h4M4 7.5h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              View listing
            </button>
            <button
              className={styles.chBtn}
              type="button"
              onClick={() => setShowOfferBox(v => !v)}
            >
              🤝 Make offer
            </button>
            <button
              className={styles.chBtn}
              type="button"
              onClick={() => setShowMeetupBox(v => !v)}
            >
              📍 Meet-up
            </button>
            <button
              className={styles.chBtnIcon}
              type="button"
              title="Mark as sold"
              onClick={handleMarkSold}
            >
              ✓
            </button>
            <button className={styles.chBtnIcon}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="8" r="1.3" fill="#888" />
                <circle cx="8" cy="8" r="1.3" fill="#888" />
                <circle cx="12" cy="8" r="1.3" fill="#888" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          <div className={styles.dayDivider}>
            <div className={styles.dayLine} />
            <span className={styles.dayLabel}>Today</span>
            <div className={styles.dayLine} />
          </div>

          {messages.map(m => (
            <div key={m.id} className={`${styles.msgGroup} ${m.out ? styles.out : styles.in}`}>
              <div className={styles.msgRow}>
                {!m.out && (
                  <Avatar initials={activeConv.initials} avColor={activeConv.avColor} size={30} />
                )}
                <div className={`${styles.bubble} ${m.out ? styles.bubbleOut : styles.bubbleIn} ${m.system ? styles.bubbleSystem : ''}`}>
                  {m.text}
                </div>
              </div>
              <div className={`${styles.msgMeta} ${m.out ? styles.msgMetaOut : styles.msgMetaIn}`}>
                <span className={styles.msgTime}>{m.time}</span>
                {m.out && <DoubleCheck />}
              </div>
            </div>
          ))}

          {offers.length > 0 && (
            <div className={styles.systemPanel}>
              <div className={styles.systemPanelTitle}>Negotiation</div>
              {offers.map(o => (
                <div key={o.id} className={styles.systemRow}>
                  <div className={styles.systemLabel}>Offer {o.price}</div>
                  <div className={styles.systemStatus}>{o.status}</div>
                  <div className={styles.systemActions}>
                    <button type="button" onClick={() => updateOfferStatus(o.id, 'accepted')}>Accept</button>
                    <button type="button" onClick={() => updateOfferStatus(o.id, 'rejected')}>Reject</button>
                    <button type="button" onClick={() => updateOfferStatus(o.id, 'counter')}>Counter</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meetup && (
            <div className={styles.systemPanel}>
              <div className={styles.systemPanelTitle}>Meet-up</div>
              <div className={styles.systemRow}>
                <div className={styles.systemLabel}>{meetup.time} · {meetup.place}</div>
                <div className={styles.systemStatus}>{meetup.confirmed ? 'Confirmed' : 'Pending'}</div>
                {!meetup.confirmed && (
                  <div className={styles.systemActions}>
                    <button type="button" onClick={handleConfirmMeetup}>Confirm</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {submittedReview && (
            <div className={styles.systemPanel}>
              <div className={styles.systemPanelTitle}>Your review</div>
              <div className={styles.systemRow}>
                <div className={styles.systemLabel}>
                  {'★'.repeat(submittedReview.rating)}{' '}
                  <span className={styles.reviewRatingText}>{submittedReview.rating}/5</span>
                </div>
                <div className={styles.reviewBy}>— {submittedReview.by}</div>
                {submittedReview.review && (
                  <div className={styles.reviewText}>"{submittedReview.review}"</div>
                )}
              </div>
            </div>
          )}

          {typing && (
            <div className={`${styles.msgGroup} ${styles.in}`}>
              <div className={styles.msgRow}>
                <Avatar initials={activeConv.initials} avColor={activeConv.avColor} size={30} />
                <div className={styles.typingBubble}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.inputWrap}>
          {(showOfferBox || showMeetupBox || showRatingBox) && (
            <div className={styles.transactionBar}>
              {showOfferBox && (
                <div className={styles.txSection}>
                  <div className={styles.txLabel}>Send an offer</div>
                  <input
                    type="number"
                    placeholder="Amount in ₹"
                    value={offerPrice}
                    onChange={e => setOfferPrice(e.target.value)}
                  />
                  <button type="button" onClick={handleSendOffer}>Send</button>
                </div>
              )}
              {showMeetupBox && (
                <div className={styles.txSection}>
                  <div className={styles.txLabel}>Propose meet-up</div>
                  <input
                    type="text"
                    placeholder="When? e.g. Today 4 PM"
                    value={meetTime}
                    onChange={e => setMeetTime(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Where? e.g. Main library steps"
                    value={meetPlace}
                    onChange={e => setMeetPlace(e.target.value)}
                  />
                  <button type="button" onClick={handleCreateMeetup}>Send</button>
                </div>
              )}
              {showRatingBox && (
                <div className={styles.txSection}>
                  <div className={styles.txLabel}>Rate this transaction</div>
                  <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`${styles.starBtn} ${rating >= v ? styles.starOn : ''}`}
                        onClick={() => setRating(v)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Short review (optional)…"
                    value={review}
                    onChange={e => setReview(e.target.value)}
                  />
                  <button type="button" onClick={handleSubmitReview}>Submit</button>
                </div>
              )}
            </div>
          )}
          <div className={styles.inputRow}>
            <button className={styles.iconBtn} title="Attach file">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 7.5l-5.5 5.5a3.5 3.5 0 01-5-5l6-6a2 2 0 013 3L5.5 11a1 1 0 01-1.4-1.4L10 3.5"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className={styles.iconBtn} title="Emoji">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5.5 9.5s.8 1.5 2.5 1.5 2.5-1.5 2.5-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="5.5" cy="6.5" r=".8" fill="currentColor" />
                <circle cx="10.5" cy="6.5" r=".8" fill="currentColor" />
              </svg>
            </button>
            <button className={styles.sendBtn} onClick={sendMessage}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="#fff" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
