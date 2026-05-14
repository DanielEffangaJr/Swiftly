import { useState, useEffect, useRef } from "react";

const VIEWS = { HOME: "home", BOOK: "book", TRACK: "track", RIDERS: "riders", CONFIRM: "confirm" };

const riders = [
  { id: 1, name: "Marcus O.", rating: 4.9, trips: 1243, bike: "Motorcycle", eta: "8 min", distance: "1.2km", avatar: "MO", status: "available", location: { x: 38, y: 44 } },
  { id: 2, name: "Aisha B.", rating: 4.8, trips: 987, bike: "Bicycle", eta: "12 min", distance: "2.1km", avatar: "AB", status: "available", location: { x: 55, y: 62 } },
  { id: 3, name: "Tunde K.", rating: 4.95, trips: 2104, bike: "Motorcycle", eta: "5 min", distance: "0.8km", avatar: "TK", status: "available", location: { x: 48, y: 35 } },
  { id: 4, name: "Zara M.", rating: 4.7, trips: 654, bike: "Bicycle", eta: "15 min", distance: "2.8km", avatar: "ZM", status: "busy", location: { x: 70, y: 55 } },
];

const packageTypes = [
  { id: "docs", label: "Documents", icon: "📄", desc: "Papers, files, envelopes" },
  { id: "small", label: "Small Pack", icon: "📦", desc: "Fits in a backpack" },
  { id: "large", label: "Large Pack", icon: "🗃️", desc: "Bulky or heavy items" },
  { id: "food", label: "Food & Drinks", icon: "🍱", desc: "Meals, groceries" },
];

const trackStages = [
  { id: 0, label: "Order Confirmed", icon: "✓", done: true },
  { id: 1, label: "Rider Assigned", icon: "🏍", done: true },
  { id: 2, label: "Picked Up", icon: "📦", done: true },
  { id: 3, label: "On the Way", icon: "🛣", done: false, active: true },
  { id: 4, label: "Delivered", icon: "🏠", done: false },
];

export default function App() {
  const [view, setView] = useState(VIEWS.HOME);
  const [step, setStep] = useState(1);
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropAddr, setDropAddr] = useState("");
  const [riderDot, setRiderDot] = useState({ x: 48, y: 35 });
  const [progress, setProgress] = useState(62);
  const [eta, setEta] = useState(7);
  const [pulseMap, setPulseMap] = useState(false);
  const animRef = useRef(null);

  useEffect(() => {
    if (view === VIEWS.TRACK) {
      animRef.current = setInterval(() => {
        setRiderDot(p => ({ x: p.x + (Math.random() - 0.4) * 1.2, y: p.y + (Math.random() - 0.3) * 1.2 }));
        setProgress(p => Math.min(p + 0.4, 98));
        setEta(p => Math.max(p - 0.05, 1));
        setPulseMap(true);
        setTimeout(() => setPulseMap(false), 400);
      }, 1200);
    }
    return () => clearInterval(animRef.current);
  }, [view]);

  const goBook = () => { setView(VIEWS.BOOK); setStep(1); };
  const goTrack = () => setView(VIEWS.TRACK);
  const goHome = () => { setView(VIEWS.HOME); setSelectedRider(null); setSelectedPackage(null); setPickupAddr(""); setDropAddr(""); };

  const confirmBooking = () => {
    if (!selectedRider) setSelectedRider(riders[2]);
    setView(VIEWS.CONFIRM);
    setTimeout(() => setView(VIEWS.TRACK), 2200);
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* Top Nav */}
      <nav style={styles.nav}>
        <button onClick={goHome} style={styles.logo}>
          <span style={styles.logoIcon}>⚡</span>
          <span style={styles.logoText}>swiftly</span>
        </button>
        <div style={styles.navLinks}>
          <button onClick={goHome} style={{ ...styles.navBtn, ...(view === VIEWS.HOME ? styles.navBtnActive : {}) }}>Home</button>
          <button onClick={goBook} style={{ ...styles.navBtn, ...(view === VIEWS.BOOK ? styles.navBtnActive : {}) }}>Book</button>
          <button onClick={goTrack} style={{ ...styles.navBtn, ...(view === VIEWS.TRACK ? styles.navBtnActive : {}) }}>Track</button>
        </div>
      </nav>

      <main style={styles.main}>

        {/* ── HOME ── */}
        {view === VIEWS.HOME && (
          <div className="fade-in" style={styles.homeWrap}>
            <div style={styles.heroBadge}>🛵 Lagos · Abuja · Port Harcourt</div>
            <h1 style={styles.heroTitle}>
              Deliver anything.<br /><span style={styles.heroAccent}>Anywhere. Now.</span>
            </h1>
            <p style={styles.heroSub}>Connect with trusted local riders for same-day delivery. Track every move, every mile.</p>
            <div style={styles.heroActions}>
              <button onClick={goBook} style={styles.btnPrimary} className="btn-hover">
                Book a Rider →
              </button>
              <button onClick={goTrack} style={styles.btnSecondary} className="btn-hover">
                Track Order
              </button>
            </div>

            {/* Stats row */}
            <div style={styles.statsRow}>
              {[["2,400+", "Verified Riders"], ["98%", "On-time Rate"], ["4.9★", "Avg Rating"], ["< 30min", "Avg Delivery"]].map(([val, lbl]) => (
                <div key={lbl} style={styles.statCard}>
                  <div style={styles.statVal}>{val}</div>
                  <div style={styles.statLbl}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Rider cards preview */}
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>Available Riders Nearby</span>
              <button onClick={goBook} style={styles.seeAll}>View All →</button>
            </div>
            <div style={styles.riderScroll}>
              {riders.filter(r => r.status === "available").map(r => (
                <div key={r.id} style={styles.riderPreviewCard} className="card-hover" onClick={() => { setSelectedRider(r); goBook(); setStep(3); }}>
                  <div style={{ ...styles.avatar, background: avatarColor(r.id) }}>{r.avatar}</div>
                  <div style={styles.riderPreviewInfo}>
                    <div style={styles.riderName}>{r.name}</div>
                    <div style={styles.riderMeta}>{r.bike} · {r.eta} away</div>
                    <div style={styles.riderRating}>{"★".repeat(5)} <span style={styles.ratingNum}>{r.rating}</span></div>
                  </div>
                  <div style={styles.etaBadge}>{r.eta}</div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div style={styles.sectionHeader}><span style={styles.sectionTitle}>How It Works</span></div>
            <div style={styles.howRow}>
              {[["1", "📍", "Set pickup & drop-off"], ["2", "🏍", "Choose your rider"], ["3", "📦", "Track in real-time"]].map(([n, icon, txt]) => (
                <div key={n} style={styles.howCard}>
                  <div style={styles.howNum}>{n}</div>
                  <div style={styles.howIcon}>{icon}</div>
                  <div style={styles.howTxt}>{txt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOOK ── */}
        {view === VIEWS.BOOK && (
          <div className="fade-in" style={styles.bookWrap}>
            <div style={styles.bookHeader}>
              <button onClick={goHome} style={styles.backBtn}>← Back</button>
              <h2 style={styles.bookTitle}>Book a Delivery</h2>
            </div>

            {/* Progress steps */}
            <div style={styles.stepRow}>
              {["Addresses", "Package", "Rider"].map((s, i) => (
                <div key={s} style={styles.stepItem}>
                  <div style={{ ...styles.stepDot, ...(step > i + 1 ? styles.stepDone : step === i + 1 ? styles.stepActive : {}) }}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span style={{ ...styles.stepLabel, ...(step === i + 1 ? { color: "#f5a623" } : {}) }}>{s}</span>
                  {i < 2 && <div style={{ ...styles.stepLine, ...(step > i + 1 ? { background: "#f5a623" } : {}) }} />}
                </div>
              ))}
            </div>

            {/* Step 1: Addresses */}
            {step === 1 && (
              <div style={styles.stepContent} className="fade-in">
                <div style={styles.inputGroup}>
                  <label style={styles.label}>📍 Pickup Address</label>
                  <input style={styles.input} placeholder="Enter pickup location..." value={pickupAddr} onChange={e => setPickupAddr(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>🏁 Drop-off Address</label>
                  <input style={styles.input} placeholder="Enter destination..." value={dropAddr} onChange={e => setDropAddr(e.target.value)} />
                </div>
                <div style={styles.quickAddrs}>
                  {["Victoria Island, Lagos", "Lekki Phase 1", "Ikeja GRA", "Surulere"].map(addr => (
                    <button key={addr} style={styles.quickAddr} onClick={() => setDropAddr(addr)}>{addr}</button>
                  ))}
                </div>
                <button style={{ ...styles.btnPrimary, width: "100%", marginTop: 24 }}
                  onClick={() => setStep(2)}
                  disabled={!pickupAddr || !dropAddr}
                  className="btn-hover">
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2: Package type */}
            {step === 2 && (
              <div style={styles.stepContent} className="fade-in">
                <p style={styles.stepSubtitle}>What are you sending?</p>
                <div style={styles.packageGrid}>
                  {packageTypes.map(pkg => (
                    <button key={pkg.id}
                      style={{ ...styles.packageCard, ...(selectedPackage?.id === pkg.id ? styles.packageCardActive : {}) }}
                      onClick={() => setSelectedPackage(pkg)}
                      className="card-hover">
                      <div style={styles.packageIcon}>{pkg.icon}</div>
                      <div style={styles.packageLabel}>{pkg.label}</div>
                      <div style={styles.packageDesc}>{pkg.desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                  <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={() => setStep(1)}>← Back</button>
                  <button style={{ ...styles.btnPrimary, flex: 2 }} onClick={() => setStep(3)} disabled={!selectedPackage} className="btn-hover">Find Riders →</button>
                </div>
              </div>
            )}

            {/* Step 3: Choose rider */}
            {step === 3 && (
              <div style={styles.stepContent} className="fade-in">
                <p style={styles.stepSubtitle}>Select your rider</p>
                <div style={styles.riderList}>
                  {riders.map(r => (
                    <div key={r.id}
                      style={{ ...styles.riderCard, ...(selectedRider?.id === r.id ? styles.riderCardActive : {}), ...(r.status === "busy" ? styles.riderBusy : {}) }}
                      onClick={() => r.status === "available" && setSelectedRider(r)}
                      className={r.status === "available" ? "card-hover" : ""}>
                      <div style={{ ...styles.avatar, background: avatarColor(r.id) }}>{r.avatar}</div>
                      <div style={styles.riderInfo}>
                        <div style={styles.riderNameBig}>{r.name}
                          {r.status === "busy" && <span style={styles.busyTag}> Busy</span>}
                        </div>
                        <div style={styles.riderSubInfo}>{r.bike} · {r.trips.toLocaleString()} trips · ★ {r.rating}</div>
                        <div style={styles.riderDist}>{r.distance} away · ETA {r.eta}</div>
                      </div>
                      {selectedRider?.id === r.id && <div style={styles.checkMark}>✓</div>}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={() => setStep(2)}>← Back</button>
                  <button style={{ ...styles.btnPrimary, flex: 2 }} onClick={confirmBooking} disabled={!selectedRider} className="btn-hover">Confirm Booking →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIRM ── */}
        {view === VIEWS.CONFIRM && (
          <div className="fade-in" style={styles.confirmWrap}>
            <div style={styles.confirmIcon} className="pop-in">✅</div>
            <h2 style={styles.confirmTitle}>Booking Confirmed!</h2>
            <p style={styles.confirmSub}>Your rider is on the way. Redirecting to tracking…</p>
            <div style={styles.confirmSpinner}><div className="spinner" /></div>
          </div>
        )}

        {/* ── TRACK ── */}
        {view === VIEWS.TRACK && (
          <div className="fade-in" style={styles.trackWrap}>
            <div style={styles.bookHeader}>
              <button onClick={goHome} style={styles.backBtn}>← Home</button>
              <h2 style={styles.bookTitle}>Live Tracking</h2>
            </div>

            {/* Map mockup */}
            <div style={{ ...styles.mapBox, ...(pulseMap ? styles.mapPulse : {}) }}>
              <div style={styles.mapGrid} />
              {/* Roads */}
              <svg style={styles.mapSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="1.5" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeWidth="1.5" />
                <line x1="0" y1="30" x2="100" y2="70" stroke="#1e293b" strokeWidth="1" />
                <line x1="20" y1="0" x2="80" y2="100" stroke="#1e293b" strokeWidth="0.8" />
                {/* Route line */}
                <polyline points={`${riderDot.x},${riderDot.y} 72,78`} stroke="#f5a623" strokeWidth="2" strokeDasharray="3,2" fill="none" />
              </svg>
              {/* Rider marker */}
              <div style={{ ...styles.mapRider, left: `${riderDot.x}%`, top: `${riderDot.y}%` }} className="rider-pulse">🏍</div>
              {/* Destination */}
              <div style={styles.mapDest}>📍</div>
              {/* You */}
              <div style={styles.mapYou}>🏠</div>
              {/* ETA overlay */}
              <div style={styles.mapEta}>ETA: ~{Math.ceil(eta)} min</div>
            </div>

            {/* Progress bar */}
            <div style={styles.progressWrap}>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
              <span style={styles.progressPct}>{Math.round(progress)}%</span>
            </div>

            {/* Timeline */}
            <div style={styles.timeline}>
              {trackStages.map((stage, i) => (
                <div key={stage.id} style={styles.timelineItem}>
                  <div style={{ ...styles.timelineDot, ...(stage.done ? styles.timelineDone : stage.active ? styles.timelineActive : styles.timelinePending) }}>
                    {stage.done ? "✓" : stage.icon}
                  </div>
                  <div style={{ ...styles.timelineLabel, ...(stage.active ? { color: "#f5a623", fontWeight: 700 } : stage.done ? { color: "#94a3b8" } : {}) }}>
                    {stage.label}
                    {stage.active && <span style={styles.activePing}> ● Live</span>}
                  </div>
                  {i < trackStages.length - 1 && <div style={{ ...styles.timelineConnector, ...(stage.done ? { background: "#f5a623" } : {}) }} />}
                </div>
              ))}
            </div>

            {/* Rider info */}
            <div style={styles.riderInfoCard}>
              <div style={{ ...styles.avatar, background: avatarColor(3), width: 52, height: 52, fontSize: 18 }}>TK</div>
              <div style={styles.riderDetails}>
                <div style={styles.riderNameBig}>Tunde K.</div>
                <div style={styles.riderSubInfo}>Motorcycle · ★ 4.95 · 2,104 trips</div>
              </div>
              <div style={styles.riderActions}>
                <button style={styles.iconBtn} title="Call">📞</button>
                <button style={styles.iconBtn} title="Message">💬</button>
              </div>
            </div>

            <button onClick={goHome} style={{ ...styles.btnSecondary, width: "100%", marginTop: 16 }}>← Back to Home</button>
          </div>
        )}
      </main>
    </div>
  );
}

function avatarColor(id) {
  const colors = ["#e85d04", "#7209b7", "#0077b6", "#2dc653"];
  return colors[id % colors.length];
}

const styles = {
  root: { minHeight: "100vh", background: "#0a0f1e", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e2e8f0" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #1e293b", background: "#0a0f1eee", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  logo: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 22, fontWeight: 800, color: "#f5a623", letterSpacing: "-0.5px" },
  navLinks: { display: "flex", gap: 4 },
  navBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "8px 16px", borderRadius: 8, fontFamily: "inherit", fontSize: 15, fontWeight: 500, transition: "all 0.2s" },
  navBtnActive: { color: "#f5a623", background: "#f5a62318" },
  main: { maxWidth: 680, margin: "0 auto", padding: "32px 20px 80px" },

  // Home
  homeWrap: {},
  heroBadge: { display: "inline-block", background: "#f5a62318", color: "#f5a623", border: "1px solid #f5a62330", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, marginBottom: 24, letterSpacing: 0.3 },
  heroTitle: { fontSize: "clamp(2rem, 6vw, 3.2rem)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-1px" },
  heroAccent: { color: "#f5a623" },
  heroSub: { color: "#94a3b8", fontSize: 17, maxWidth: 480, lineHeight: 1.6, marginBottom: 32 },
  heroActions: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 40 },
  statCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 12px", textAlign: "center" },
  statVal: { fontSize: 20, fontWeight: 800, color: "#f5a623", marginBottom: 4 },
  statLbl: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },

  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: "#e2e8f0" },
  seeAll: { background: "none", border: "none", color: "#f5a623", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 },

  riderScroll: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 },
  riderPreviewCard: { display: "flex", alignItems: "center", gap: 16, background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s" },
  avatar: { width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0 },
  riderPreviewInfo: { flex: 1 },
  riderName: { fontWeight: 700, fontSize: 15, marginBottom: 2 },
  riderMeta: { color: "#64748b", fontSize: 13 },
  riderRating: { color: "#f5a623", fontSize: 12, marginTop: 2 },
  ratingNum: { color: "#94a3b8" },
  etaBadge: { background: "#f5a62318", color: "#f5a623", border: "1px solid #f5a62330", borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 700 },

  howRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 40 },
  howCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 20, textAlign: "center" },
  howNum: { width: 28, height: 28, borderRadius: "50%", background: "#f5a623", color: "#0a0f1e", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
  howIcon: { fontSize: 24, marginBottom: 8 },
  howTxt: { color: "#94a3b8", fontSize: 13, lineHeight: 1.4 },

  // Buttons
  btnPrimary: { background: "#f5a623", color: "#0a0f1e", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", transition: "all 0.2s", letterSpacing: 0.2 },
  btnSecondary: { background: "transparent", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },

  // Book
  bookWrap: {},
  bookHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28 },
  backBtn: { background: "none", border: "1px solid #1e293b", color: "#94a3b8", cursor: "pointer", borderRadius: 8, padding: "8px 14px", fontFamily: "inherit", fontSize: 14 },
  bookTitle: { fontSize: 22, fontWeight: 800, margin: 0 },

  stepRow: { display: "flex", alignItems: "center", marginBottom: 32, gap: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: 8, flex: 1, position: "relative" },
  stepDot: { width: 32, height: 32, borderRadius: "50%", background: "#1e293b", border: "2px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#64748b", flexShrink: 0, zIndex: 1 },
  stepActive: { background: "#f5a62318", border: "2px solid #f5a623", color: "#f5a623" },
  stepDone: { background: "#f5a623", border: "2px solid #f5a623", color: "#0a0f1e" },
  stepLabel: { fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" },
  stepLine: { position: "absolute", left: 40, right: -8, height: 2, background: "#1e293b", top: "50%", transform: "translateY(-50%)" },
  stepContent: {},
  stepSubtitle: { color: "#94a3b8", marginBottom: 20, fontSize: 15 },

  inputGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px", color: "#e2e8f0", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border 0.2s" },
  quickAddrs: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 },
  quickAddr: { background: "none", border: "1px solid #1e293b", color: "#64748b", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },

  packageGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  packageCard: { background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 20, textAlign: "center", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  packageCardActive: { border: "2px solid #f5a623", background: "#f5a62310" },
  packageIcon: { fontSize: 32, marginBottom: 8 },
  packageLabel: { fontWeight: 700, fontSize: 15, color: "#e2e8f0", marginBottom: 4 },
  packageDesc: { color: "#64748b", fontSize: 12 },

  riderList: { display: "flex", flexDirection: "column", gap: 10 },
  riderCard: { display: "flex", alignItems: "center", gap: 14, background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s" },
  riderCardActive: { border: "2px solid #f5a623", background: "#f5a62308" },
  riderBusy: { opacity: 0.4, cursor: "not-allowed" },
  riderInfo: { flex: 1 },
  riderNameBig: { fontWeight: 700, fontSize: 15, marginBottom: 2 },
  riderSubInfo: { color: "#64748b", fontSize: 13 },
  riderDist: { color: "#f5a623", fontSize: 12, marginTop: 2, fontWeight: 600 },
  busyTag: { color: "#ef4444", fontWeight: 500, fontSize: 12 },
  checkMark: { width: 28, height: 28, borderRadius: "50%", background: "#f5a623", color: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 },
  riderDetails: { flex: 1 },
  riderActions: { display: "flex", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: "50%", background: "#1e293b", border: "none", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" },

  // Confirm
  confirmWrap: { textAlign: "center", padding: "80px 20px" },
  confirmIcon: { fontSize: 72, marginBottom: 24 },
  confirmTitle: { fontSize: 28, fontWeight: 900, marginBottom: 12 },
  confirmSub: { color: "#94a3b8", fontSize: 16 },
  confirmSpinner: { marginTop: 32 },

  // Track
  trackWrap: {},
  mapBox: { position: "relative", background: "#0f1f35", border: "1px solid #1e293b", borderRadius: 16, height: 260, marginBottom: 16, overflow: "hidden", transition: "box-shadow 0.3s" },
  mapPulse: { boxShadow: "0 0 0 3px #f5a62344" },
  mapGrid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(#1a2a3a 1px, transparent 1px), linear-gradient(90deg, #1a2a3a 1px, transparent 1px)", backgroundSize: "20px 20px" },
  mapSvg: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  mapRider: { position: "absolute", fontSize: 22, transform: "translate(-50%, -50%)", zIndex: 10, transition: "left 1s ease, top 1s ease" },
  mapDest: { position: "absolute", right: "28%", bottom: "22%", fontSize: 22 },
  mapYou: { position: "absolute", right: "15%", bottom: "12%", fontSize: 20 },
  mapEta: { position: "absolute", top: 12, right: 12, background: "#0a0f1ecc", border: "1px solid #f5a623", color: "#f5a623", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 700, backdropFilter: "blur(4px)" },

  progressWrap: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  progressBar: { flex: 1, height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #f5a623, #ff6b00)", borderRadius: 4, transition: "width 1s ease" },
  progressPct: { color: "#f5a623", fontWeight: 700, fontSize: 14, width: 36 },

  timeline: { display: "flex", flexDirection: "column", gap: 0, marginBottom: 24, position: "relative" },
  timelineItem: { display: "flex", alignItems: "flex-start", gap: 14, position: "relative", paddingBottom: 16 },
  timelineDot: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0, zIndex: 1 },
  timelineDone: { background: "#f5a623", color: "#0a0f1e" },
  timelineActive: { background: "#f5a62320", border: "2px solid #f5a623", color: "#f5a623" },
  timelinePending: { background: "#1e293b", border: "1px solid #334155", color: "#475569" },
  timelineLabel: { paddingTop: 6, fontSize: 14, fontWeight: 500, color: "#94a3b8" },
  timelineConnector: { position: "absolute", left: 15, top: 32, width: 2, height: "calc(100% - 16px)", background: "#1e293b", transform: "translateX(-50%)" },
  activePing: { color: "#f5a623", fontSize: 11, fontWeight: 700 },

  riderInfoCard: { display: "flex", alignItems: "center", gap: 16, background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 16 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  .fade-in { animation: fadeIn 0.35s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .pop-in { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  @keyframes popIn { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .btn-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px #f5a62330; }
  .btn-hover:active { transform: translateY(0); }
  .card-hover:hover { transform: translateY(-2px); border-color: #f5a62350 !important; box-shadow: 0 4px 16px #0006; }
  .rider-pulse { animation: riderFloat 2s ease-in-out infinite; }
  @keyframes riderFloat { 0%,100% { filter: drop-shadow(0 0 6px #f5a623); } 50% { filter: drop-shadow(0 0 12px #f5a623); } }
  .spinner { width: 36px; height: 36px; border: 3px solid #1e293b; border-top-color: #f5a623; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
  input:focus { border-color: #f5a623 !important; }
  @media (max-width: 480px) {
    .statsRow { grid-template-columns: repeat(2, 1fr) !important; }
    .howRow { grid-template-columns: 1fr !important; }
  }
`;
