import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASS = 'moo2024';
const OWNER_WA = '6596625208';

const G = {
  bg: '#0f0e0d', surface: '#1a1918', card: '#201e1c', border: '#2e2b28',
  red: '#c0392b', redDim: '#7b241c', cream: '#f0e6d3', muted: '#8a807a',
  green: '#27ae60', amber: '#e67e22', gold: '#c9a84c',
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${G.bg}; color: ${G.cream}; font-family: 'Barlow', sans-serif; }
input, select, textarea {
  width: 100%; padding: 10px 14px; background: ${G.surface}; border: 1px solid ${G.border};
  border-radius: 6px; color: ${G.cream}; font-size: 14px; font-family: 'Barlow', sans-serif;
  outline: none; transition: border-color 0.2s;
}
input:focus, select:focus, textarea:focus { border-color: ${G.red}; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 10px 12px; background: ${G.surface}; color: ${G.muted}; font-family: 'Barlow Condensed', sans-serif; letter-spacing: .08em; text-transform: uppercase; font-size: 11px; }
td { padding: 12px; border-bottom: 1px solid ${G.border}; vertical-align: top; }
.notice-bar { background: #1a1209; border: 1px solid ${G.gold}33; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; }
`;

// ── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  description: string;
  emoji: string;
  price: number;
  unit: string;
  image_url?: string;
  active?: boolean;
  checkAvailability?: boolean;
  isEnquiry?: boolean;
  created_at?: string;
}

interface CartItem extends Product {
  cartKey: string;
  qty: number;
  lineTotal: number;
  sliceWeight?: number;
  pieces?: number;
  totalKg?: number;
  enquiryNote?: string;
}

interface Order {
  id: string;
  name: string;
  wa: string;
  items: CartItem[];
  total: number;
  status: string;
  ts: number;
}

// ── Shared UI Components ───────────────────────────────────────────────────

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'green' | 'gold';

const Btn = ({
  children,
  onClick,
  variant = 'primary' as BtnVariant,
  size = 'md',
  disabled,
  style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}) => {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: size === 'sm' ? '6px 14px' : '11px 22px',
    fontSize: size === 'sm' ? 13 : 14, fontWeight: 600,
    fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.06em',
    borderRadius: 6, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.2s',
  };
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: G.red, color: '#fff' },
    ghost: { background: 'transparent', color: G.cream, border: `1px solid ${G.border}` },
    danger: { background: '#3a1a18', color: G.red, border: `1px solid ${G.redDim}` },
    green: { background: '#1a3a25', color: G.green, border: `1px solid #1d5c35` },
    gold: { background: '#2a1f08', color: G.gold, border: `1px solid ${G.gold}66` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant as BtnVariant], ...style }}>
      {children}
    </button>
  );
};

const Badge = ({ children, color = G.muted }: { children: React.ReactNode; color?: string }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11,
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '.08em',
    textTransform: 'uppercase', background: `${color}22`, color,
  }}>
    {children}
  </span>
);

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000c', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: 28, maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
      {children}
    </div>
  </div>
);

// ── Nav ────────────────────────────────────────────────────────────────────

function Nav({ page, setPage, roundOpen }: { page: string; setPage: (p: string) => void; roundOpen: boolean }) {
  return (
    <nav style={{ background: G.surface, borderBottom: `2px solid ${G.red}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setPage('Shop')}>
          <span style={{ fontSize: 24 }}>🐄</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 18, lineHeight: 1, color: G.cream }}>MOO GROUP BUY</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, color: G.gold, letterSpacing: '.12em' }}>MORNINGTON BUTCHERY · SG</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge color={roundOpen ? G.green : G.red}>{roundOpen ? '● OPEN' : '● CLOSED'}</Badge>
          <div style={{ display: 'flex', gap: 4, marginLeft: 10 }}>
            {['Shop', 'Order'].map(n => (
              <button key={n} onClick={() => setPage(n)} style={{ background: page === n ? G.red : 'transparent', color: page === n ? '#fff' : G.muted, padding: '5px 12px', fontSize: 12, borderRadius: 5, border: 'none', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.06em' }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage('Admin')} style={{ background: 'transparent', color: G.bg, padding: '5px 12px', fontSize: 12, borderRadius: 5, border: 'none', userSelect: 'none', cursor: 'pointer' }}>⚙️</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Shop Page ──────────────────────────────────────────────────────────────

function ShopPage({ products, setPage, cart, setCart }: { products: Product[]; setPage: (p: string) => void; cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>> }) {
  const [configuring, setConfiguring] = useState<Product | null>(null);
  const [sliceWeight, setSliceWeight] = useState('250');
  const [pieces, setPieces] = useState('2');
  const [enquiryNote, setEnquiryNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (name: string) => {
    setToast(name);
    setTimeout(() => setToast(null), 2500);
  };

  const isKg = (p: Product) => p.unit === 'kg';
  const isEnquiry = (p: Product) => p.unit === 'enquiry';
  const isSteak = (p: Product) => {
    const steakNames = ['ribeye', 'striploin', 'hanger'];
    return steakNames.some(s => p.name.toLowerCase().includes(s));
  };
  const openModal = (p: Product) => { setSliceWeight('250'); setPieces('2'); setEnquiryNote(''); setConfiguring(p); };

  const confirmAdd = () => {
    const p = configuring;
    if (!p) return;
    if (isEnquiry(p)) {
      if (!enquiryNote.trim()) return alert('Please describe what you\'re looking for.');
      setCart(c => [...c, { ...p, cartKey: `${p.id}_${Date.now()}`, enquiryNote: enquiryNote.trim(), lineTotal: 0, qty: 1 }]);
      showToast(p.name);
      setConfiguring(null);
      return;
    }
    const sw = parseInt(sliceWeight) || 0;
    const pc = parseInt(pieces) || 0;
    if (sw <= 0 || pc <= 0) return alert('Please enter a valid slice weight and number of pieces.');
    const price = p.price;
    const totalKg = parseFloat((sw * pc / 1000).toFixed(4));
    const lineTotal = parseFloat((totalKg * price).toFixed(2));
    setCart(c => [...c, { ...p, cartKey: `${p.id}_${Date.now()}`, sliceWeight: sw, pieces: pc, totalKg, lineTotal, qty: 1 }]);
    showToast(p.name);
    setConfiguring(null);
  };

  const addPackToCart = (p: Product) => {
    const price = p.price;
    setCart(c => {
      const ex = c.find(x => x.id === p.id && !x.sliceWeight);
      if (ex) return c.map(x => (x.id === p.id && !x.sliceWeight) ? { ...x, qty: x.qty + 1, lineTotal: parseFloat(((x.qty + 1) * price).toFixed(2)) } : x);
      return [...c, { ...p, cartKey: p.id, qty: 1, lineTotal: price }];
    });
    showToast(p.name);
  };

  const sw = parseInt(sliceWeight) || 0;
  const pc = parseInt(pieces) || 0;
  const estKg = sw > 0 && pc > 0 ? (sw * pc / 1000).toFixed(3) : null;
  const estCost = configuring && estKg ? (parseFloat(estKg) * configuring.price).toFixed(2) : null;
  const cartCount = cart.length;
  const fmtPrice = (v: number) => v % 1 === 0 ? `${v}` : v.toFixed(2);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: G.card, border: `1px solid ${G.green}66`, borderRadius: 10,
          padding: '14px 20px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 32px #000a', minWidth: 280, maxWidth: 360,
        }}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: G.cream }}>{toast}</div>
            <div style={{ fontSize: 11, color: G.green, marginTop: 2 }}>Added to cart ✓</div>
          </div>
          <Btn onClick={() => setPage('Order')} variant='green' size='sm'>View Cart</Btn>
        </div>
      )}

      {configuring && (
        <Modal onClose={() => setConfiguring(null)}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{configuring.emoji}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{configuring.name}</h2>
            {!isEnquiry(configuring) && (
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.red, fontSize: 16 }}>
                S${fmtPrice(configuring.price)}/{configuring.unit}
                <span style={{ fontSize: 11, color: G.muted, marginLeft: 8 }}>(slab price)</span>
              </div>
            )}
          </div>
          {configuring.checkAvailability && (
            <div style={{ background: '#2a1f08', border: `1px solid ${G.gold}44`, borderRadius: 6, padding: 10, marginBottom: 14, fontSize: 12, color: G.gold }}>
              ⚠️ Please check with me on WhatsApp first to confirm availability before placing this item in your order.
            </div>
          )}
          {isEnquiry(configuring) ? (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: G.muted, letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>What are you looking for?</label>
              <textarea rows={4} value={enquiryNote} onChange={e => setEnquiryNote(e.target.value)} placeholder='e.g. Wagyu ribeye, Tomahawk, Lamb chops…' style={{ resize: 'vertical' }} />
              <div style={{ fontSize: 11, color: G.muted, marginTop: 6 }}>I'll get back to you via WhatsApp to discuss availability and pricing.</div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, color: G.muted, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Customise your cut</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Slice Weight</label>
                  <input type='number' value={sliceWeight} onChange={e => setSliceWeight(e.target.value)} placeholder='250' min='50' />
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>grams per piece</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: G.muted, letterSpacing: '.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>No. of Pieces</label>
                  <input type='number' value={pieces} onChange={e => setPieces(e.target.value)} placeholder='2' min='1' />
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 4 }}>how many slices</div>
                </div>
              </div>
              {estKg && (
                <div style={{ background: G.surface, borderRadius: 6, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: G.muted }}>Total weight</span><span>{estKg} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                    <span style={{ color: G.muted }}>Estimated cost</span>
                    <span style={{ color: G.red }}>S${estCost}</span>
                  </div>
                  <div style={{ fontSize: 11, color: G.muted, marginTop: 6 }}>Final price based on actual weight at pickup.</div>
                </div>
              )}
            </>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={confirmAdd} style={{ flex: 1 }}>Add to Order ✓</Btn>
            <Btn onClick={() => setConfiguring(null)} variant='ghost'>Cancel</Btn>
          </div>
        </Modal>
      )}

      <div className='notice-bar'>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.gold, fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>ℹ️ Important — Please Read</div>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: G.cream }}>
          All beef is sourced directly from <strong style={{ color: G.gold }}>Mornington Butchery &amp; Pantry</strong>. I am simply collating orders on behalf of our group — I do not process, prepare, or handle the meat. Final prices are based on actual weight at collection.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.red, letterSpacing: '.14em', textTransform: 'uppercase', fontSize: 12, marginBottom: 4 }}>Current Round · Slab Prices</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,5vw,42px)', fontWeight: 900 }}>Available Cuts</h1>
        </div>
        {cartCount > 0 && <Btn onClick={() => setPage('Order')}>🛒 View Cart ({cartCount})</Btn>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px #0006'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
            {p.image_url
              ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', objectPosition: 'center' }} />
              : <div style={{ background: isEnquiry(p) ? 'linear-gradient(135deg, #1a1a2e, #0f0f1a)' : 'linear-gradient(135deg, #2a1a18, #1a1210)', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>{p.emoji}</div>
            }
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</h3>
              </div>
              <p style={{ fontSize: 12, color: G.muted, lineHeight: 1.5, marginBottom: 12 }}>{p.description}</p>
              {p.checkAvailability && (
                <div style={{ fontSize: 11, color: G.gold, marginBottom: 8 }}>⚠️ Check WhatsApp for availability</div>
              )}
              {!isEnquiry(p) && p.price > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700 }}>
                    S${fmtPrice(p.price)}<span style={{ fontSize: 12, color: G.muted }}>/{p.unit}</span>
                  </div>
                </div>
              )}
              <Btn
                onClick={() => isEnquiry(p) ? openModal(p) : (isKg(p) || isSteak(p) ? openModal(p) : addPackToCart(p))}
                variant={isEnquiry(p) ? 'gold' : 'primary'}
                style={{ width: '100%' }}>
                {isEnquiry(p) ? '✉️ Submit Enquiry' : (isKg(p) || isSteak(p) ? 'Add to Cart' : 'Add to Order')}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Order Page ─────────────────────────────────────────────────────────────

function OrderPage({ roundOpen, cart, setCart }: { roundOpen: boolean; cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>> }) {
  const [name, setName] = useState('');
  const [wa, setWa] = useState('');
  const [submitted, setSubmitted] = useState<Order | null>(null);

  const removeItem = (cartKey: string) => setCart(c => c.filter(x => x.cartKey !== cartKey));

  const updatePackQty = (cartKey: string, delta: number) => {
    setCart(c => c.map(x => x.cartKey === cartKey
      ? { ...x, qty: Math.max(1, x.qty + delta), lineTotal: parseFloat((Math.max(1, x.qty + delta) * x.unitPrice).toFixed(2)) }
      : x));
  };

  const total = parseFloat(cart.reduce((a: number, b: CartItem) => a + b.lineTotal, 0).toFixed(2));

  const submit = async () => {
    if (!name.trim() || !wa.trim() || cart.length === 0) return alert('Please fill in your name, WhatsApp number, and add at least one item.');
    const order: Order = { id: 'o' + Date.now(), name: name.trim(), wa: wa.trim(), items: cart, total, status: 'Pending', ts: Date.now() };
    await supabase.from('moo_orders').insert([order]);
    setSubmitted(order);
    setCart([]);
  };

  const formatItem = (i: CartItem) => {
    if (i.isEnquiry) return `${i.name} — Enquiry: ${i.enquiryNote}`;
    return i.sliceWeight
      ? `${i.name} — ${i.pieces} piece(s) @ ${i.sliceWeight}g each (${i.totalKg?.toFixed(3)}kg) = S$${i.lineTotal.toFixed(2)}`
      : `${i.name} x${i.qty} = S$${i.lineTotal.toFixed(2)}`;
  };

  const waMsg = submitted
    ? encodeURIComponent(`Hi! Confirming my Moo Group Buy order:\n\n${submitted.items.map(formatItem).join('\n')}\n\nTotal: S$${submitted.total.toFixed(2)}\nName: ${submitted.name}`)
    : '';

  if (!roundOpen) return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 12 }}>Round Closed</h2>
      <p style={{ color: G.muted }}>The current ordering round is closed. Check back soon!</p>
    </div>
  );

  if (submitted) return (
    <div style={{ maxWidth: 560, margin: '60px auto', padding: 20 }}>
      <div style={{ background: G.card, border: `1px solid ${G.green}44`, borderRadius: 10, padding: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 8 }}>Order Received!</h2>
        <p style={{ color: G.muted, marginBottom: 6, fontSize: 13 }}>Tap below to confirm your order via WhatsApp.</p>
        <div style={{ background: '#1a1209', border: `1px solid ${G.gold}44`, borderRadius: 8, padding: 14, marginBottom: 6, fontSize: 13, color: G.cream, lineHeight: 1.6 }}>
          💳 <strong style={{ color: G.gold }}>Payment</strong> — All payments are to be settled directly via WhatsApp with me at <strong>+65 9662 5208</strong> before collection.
        </div>
        <p style={{ color: G.gold, marginBottom: 20, fontSize: 12 }}>📲 Pickup / collection arrangements will be made via WhatsApp at <strong>+65 9662 5208</strong>.</p>
        <div style={{ background: G.surface, borderRadius: 6, padding: 16, marginBottom: 20 }}>
          {submitted.items.map((i, idx) => (
            <div key={idx} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${G.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>{i.emoji} {i.name}</span>
                <span style={{ color: G.red, fontWeight: 700 }}>{i.isEnquiry ? 'TBD' : `S$${i.lineTotal.toFixed(2)}`}</span>
              </div>
              {i.isEnquiry
                ? <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>Enquiry: {i.enquiryNote}</div>
                : i.sliceWeight
                  ? <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>{i.pieces} pcs × {i.sliceWeight}g = {i.totalKg?.toFixed(3)}kg</div>
                  : <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>Qty: {i.qty}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
            <span>Total</span><span style={{ color: G.red }}>S${submitted.total.toFixed(2)}</span>
          </div>
        </div>
        <a href={`https://wa.me/${OWNER_WA}?text=${waMsg}`} target='_blank' rel='noreferrer' style={{ display: 'block', textDecoration: 'none' }}>
          <Btn style={{ width: '100%', background: '#25D366', fontSize: 15 }}>💬 Confirm on WhatsApp (+65 9662 5208)</Btn>
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.red, letterSpacing: '.14em', textTransform: 'uppercase', fontSize: 12, marginBottom: 4 }}>Your Order</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, marginBottom: 24 }}>Review &amp; Submit</h1>
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: '.1em', textTransform: 'uppercase', color: G.muted, marginBottom: 14 }}>Your Details</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <input placeholder='Full Name' value={name} onChange={e => setName(e.target.value)} />
          <input placeholder='Your WhatsApp Number (e.g. 91234567)' value={wa} onChange={e => setWa(e.target.value)} />
        </div>
        <div style={{ fontSize: 12, color: G.muted, marginTop: 10 }}>
          📲 After submitting, you'll be prompted to confirm your order via WhatsApp to <strong style={{ color: G.gold }}>+65 9662 5208</strong>. Pickup details will be arranged there.
        </div>
      </div>
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: '.1em', textTransform: 'uppercase', color: G.muted, marginBottom: 14 }}>Order Items</h3>
        {cart.length === 0
          ? <p style={{ color: G.muted, fontSize: 14 }}>No items yet. Go to Shop to add cuts.</p>
          : cart.map((item: CartItem) => (
            <div key={item.cartKey} style={{ padding: '12px 0', borderBottom: `1px solid ${G.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.emoji} {item.name}</div>
                  {item.isEnquiry ? (
                    <div style={{ fontSize: 12, color: G.muted }}>Enquiry: {item.enquiryNote}</div>
                  ) : item.sliceWeight ? (
                    <div style={{ fontSize: 13, color: G.muted }}>{item.pieces} pcs × {item.sliceWeight}g = {item.totalKg?.toFixed(3)}kg</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <button onClick={() => updatePackQty(item.cartKey, -1)} style={{ width: 26, height: 26, borderRadius: 4, background: G.surface, color: G.cream, fontSize: 16, border: `1px solid ${G.border}`, cursor: 'pointer' }}>−</button>
                      <span style={{ fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => updatePackQty(item.cartKey, 1)} style={{ width: 26, height: 26, borderRadius: 4, background: G.surface, color: G.cream, fontSize: 16, border: `1px solid ${G.border}`, cursor: 'pointer' }}>+</button>
                      <span style={{ fontSize: 12, color: G.muted }}>× S${item.price}/pack</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12 }}>
                  <span style={{ fontWeight: 700, color: G.red }}>{item.isEnquiry ? 'TBD' : `S$${item.lineTotal.toFixed(2)}`}</span>
                  <button onClick={() => removeItem(item.cartKey)} style={{ background: 'transparent', color: G.muted, fontSize: 18, padding: '0 4px', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
              </div>
            </div>
          ))}
        {cart.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontWeight: 700, fontSize: 16 }}>
            <span>Total</span><span style={{ color: G.red }}>S${total.toFixed(2)}</span>
          </div>
        )}
      </div>
      <Btn onClick={submit} disabled={cart.length === 0} style={{ width: '100%', fontSize: 15 }}>Submit Order →</Btn>
    </div>
  );
}

// ── Admin Page ─────────────────────────────────────────────────────────────

function AdminPage({ products, setProducts, roundOpen, setRoundOpen }: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  roundOpen: boolean;
  setRoundOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [editProd, setEditProd] = useState<Product | null>(null);

  useEffect(() => {
    if (authed) {
      loadOrders();
      const interval = setInterval(loadOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [authed]);

  const loadOrders = async () => {
    const { data } = await supabase.from('moo_orders').select('*');
    setOrders((data as Order[]) || []);
  };

  const saveOrders = async (o: Order[]) => {
    setOrders(o);
    await supabase.from('moo_orders').upsert(o);
  };

  const updateStatus = (id: string, status: string) => saveOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  const deleteOrder = (id: string) => saveOrders(orders.filter(o => o.id !== id));

  const saveProd = async (p: Product) => {
    const toSave = { ...p };
    const { error } = await supabase.from('products').upsert(toSave).select();
    if (error) { console.error('Failed to save product', error); return; }
    const { data: all, error: allErr } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!allErr && all) setProducts(all as Product[]);
    setEditProd(null);
  };

  const deleteProd = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Failed to delete product', error);
    const { data: all, error: allErr } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!allErr && all) setProducts(all as Product[]);
  };

  const toggleRound = async () => {
    const n = !roundOpen;
    setRoundOpen(n);
    await supabase.from('settings').upsert({ key: 'roundOpen', value: JSON.stringify(n) });
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'WhatsApp', 'Items', 'Total', 'Status', 'Date'],
      ...orders.map(o => [
        o.name, o.wa,
        o.items.map((i: CartItem) => i.isEnquiry ? `${i.name}: ${i.enquiryNote}` : i.sliceWeight ? `${i.name} ${i.pieces}pc×${i.sliceWeight}g` : `${i.name} x${i.qty}`).join('; '),
        `S$${o.total.toFixed(2)}`, o.status, new Date(o.ts).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'orders.csv';
    a.click();
  };

  const statusColor = (s: string) => ({ Pending: G.amber, Paid: G.green, Collected: G.muted, Filled: G.green } as Record<string, string>)[s] || G.muted;
  const tabStyle = (t: string): React.CSSProperties => ({
    background: tab === t ? G.red : 'transparent', color: tab === t ? '#fff' : G.muted,
    padding: '8px 16px', fontSize: 13, borderRadius: 5,
    fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.06em',
    border: 'none', cursor: 'pointer', textTransform: 'capitalize',
  });

  const ProdForm = ({ p, onSave, onCancel }: { p: Product | null; onSave: (f: Product) => void; onCancel: () => void }) => {
    const [f, setF] = useState<Product>(p || { id: '', name: '', description: '', emoji: '🥩', unitPrice: 0, unit: 'kg', image_url: '', active: true });
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <input placeholder='Product Name' value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input placeholder='Description' value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
        <input placeholder='Emoji' value={f.emoji} onChange={e => setF({ ...f, emoji: e.target.value })} />
        <input placeholder='Image URL (public)' value={f.image_url || ''} onChange={e => setF({ ...f, image_url: e.target.value })} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input placeholder='Price (slab/unit)' type='number' value={f.price} onChange={e => setF({ ...f, unitPrice: parseFloat(e.target.value) || 0 })} />
          <select value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })}>
            <option value='kg'>per kg</option>
            <option value='pack'>per pack</option>
            <option value='enquiry'>enquiry</option>
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type='checkbox' checked={!!f.active} onChange={e => setF({ ...f, active: e.target.checked })} style={{ width: 'auto' }} />
          Active (Show on website)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type='checkbox' checked={!!f.checkAvailability} onChange={e => setF({ ...f, checkAvailability: e.target.checked })} style={{ width: 'auto' }} />
          Show 'Check WhatsApp for availability' warning
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => onSave(f)} style={{ flex: 1 }}>Save</Btn>
          <Btn onClick={onCancel} variant='ghost'>Cancel</Btn>
        </div>
      </div>
    );
  };

  if (!authed) return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, marginBottom: 20, textAlign: 'center' }}>Admin</h2>
      <input type='password' placeholder='Password' value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && (pass === ADMIN_PASS ? setAuthed(true) : alert('Wrong password'))} style={{ marginBottom: 12 }} />
      <Btn onClick={() => pass === ADMIN_PASS ? setAuthed(true) : alert('Wrong password')} style={{ width: '100%' }}>Login</Btn>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900 }}>Admin Panel</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Badge color={roundOpen ? G.green : G.red}>{roundOpen ? 'Round Open' : 'Round Closed'}</Badge>
          <Btn onClick={toggleRound} variant={roundOpen ? 'danger' : 'green'} size='sm'>{roundOpen ? 'Close Round' : 'Open Round'}</Btn>
          <Btn onClick={loadOrders} variant='ghost' size='sm'>↻ Refresh</Btn>
          <Btn onClick={exportCSV} variant='ghost' size='sm'>↓ CSV</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: G.surface, padding: 6, borderRadius: 8, width: 'fit-content' }}>
        {['orders', 'products'].map(t => <button key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
      </div>

      {tab === 'orders' && (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Name</th><th>WhatsApp</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.length === 0
                ? <tr><td colSpan={7} style={{ color: G.muted, textAlign: 'center', padding: 30 }}>No orders yet.</td></tr>
                : orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td style={{ color: G.muted }}>{o.wa}</td>
                    <td style={{ fontSize: 12 }}>{o.items.map((i: CartItem, idx: number) => <div key={idx}>{i.emoji} {i.name}{i.isEnquiry ? ` · ${i.enquiryNote}` : i.sliceWeight ? ` · ${i.pieces}pc×${i.sliceWeight}g` : ` ×${i.qty}`}</div>)}</td>
                    <td style={{ fontWeight: 700, color: G.red }}>S${o.total.toFixed(2)}</td>
                    <td><Badge color={statusColor(o.status)}>{o.status}</Badge></td>
                    <td style={{ color: G.muted, fontSize: 12 }}>{new Date(o.ts).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {['Pending', 'Paid', 'Collected'].filter(s => s !== o.status).map(s => (
                          <Btn key={s} onClick={() => updateStatus(o.id, s)} variant='ghost' size='sm'>{s}</Btn>
                        ))}
                        <Btn onClick={() => deleteOrder(o.id)} variant='danger' size='sm'>✕</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: '.1em', textTransform: 'uppercase', color: G.muted }}>Products</h3>
            <Btn size='sm' onClick={() => setEditProd({ id: '', name: '', description: '', emoji: '🥩', unitPrice: 0, unit: 'kg', image_url: '', active: true })}>+ Add Product</Btn>
          </div>
          {editProd && !editProd.id && (
            <div style={{ background: G.card, border: `1px solid ${G.red}44`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <h4 style={{ marginBottom: 14, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.08em', textTransform: 'uppercase', color: G.muted, fontSize: 12 }}>New Product</h4>
              <ProdForm p={editProd} onSave={saveProd} onCancel={() => setEditProd(null)} />
            </div>
          )}
          {products.map(p => (
            <div key={p.id} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, padding: 16, marginBottom: 10 }}>
              {editProd?.id === p.id
                ? <ProdForm p={editProd} onSave={saveProd} onCancel={() => setEditProd(null)} />
                : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <span style={{ fontSize: 26 }}>{p.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: G.muted }}>{p.unit === 'enquiry' ? 'Enquiry' : `S$${p.price}/${p.unit}`}</div>
                      </div>
                      <Badge color={p.active ? G.green : G.red}>{p.active ? 'Active' : 'Hidden'}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn size='sm' variant='ghost' onClick={() => setEditProd(p)}>Edit</Btn>
                      <Btn size='sm' variant='danger' onClick={() => deleteProd(p.id)}>Delete</Btn>
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState('Shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [roundOpen, setRoundOpen] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: pData, error: pError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        const { data: rData, error: rError } = await supabase.from('settings').select('value').eq('key', 'roundOpen');
        if (!pError && pData) setProducts((pData as Product[]).filter(p => p.active !== false));
        if (!rError && rData && rData[0]) setRoundOpen(JSON.parse(rData[0].value));
      } catch (err) {
        console.error('Error loading data:', err);
      }
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return (
    <div style={{ background: G.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.muted, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.1em' }}>
      Loading…
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: G.bg }}>
        <Nav page={page} setPage={setPage} roundOpen={roundOpen} />
        {page === 'Shop' && <ShopPage products={products} setPage={setPage} cart={cart} setCart={setCart} />}
        {page === 'Order' && <OrderPage roundOpen={roundOpen} cart={cart} setCart={setCart} />}
        {page === 'Admin' && <AdminPage products={products} setProducts={setProducts} roundOpen={roundOpen} setRoundOpen={setRoundOpen} />}
        <footer style={{ textAlign: 'center', padding: '40px 20px 24px', color: G.muted, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: '.12em' }}>
          MOO GROUP BUY · MORNINGTON BUTCHERY &amp; PANTRY · SINGAPORE ·{' '}
          <a href={`https://wa.me/${OWNER_WA}`} target='_blank' rel='noreferrer' style={{ color: G.gold, textDecoration: 'none' }}>+65 9662 5208</a>
        </footer>
      </div>
    </>
  );
}
