import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const VIEWS = {
  LANDING: "landing", LOGIN: "login", SIGNUP: "signup",
  DASHBOARD: "dashboard", BOOK: "book", PAYMENT: "payment",
  TRACKING: "tracking", PROFILE: "profile",
};

const riders = [
  { id: 1, name: "Emeka O.", rating: 4.9, trips: 1243, bike: "Motorcycle", eta: "5 min", distance: "0.8km", avatar: "EO", status: "available", price: 1500 },
  { id: 2, name: "Fatima B.", rating: 4.8, trips: 987, bike: "Bicycle", eta: "10 min", distance: "1.5km", avatar: "FB", status: "available", price: 1000 },
  { id: 3, name: "Chukwudi K.", rating: 4.95, trips: 2104, bike: "Motorcycle", eta: "3 min", distance: "0.5km", avatar: "CK", status: "available", price: 2000 },
  { id: 4, name: "Amina S.", rating: 4.7, trips: 654, bike: "Van", eta: "12 min", distance: "2.1km", avatar: "AS", status: "busy", price: 3500 },
];

const packageTypes = [
  { id: "docs", label: "Documents", icon: "📄", desc: "Papers, files, envelopes", basePrice: 500 },
  { id: "small", label: "Small Package", icon: "📦", desc: "Fits in a backpack", basePrice: 1000 },
  { id: "large", label: "Large Package", icon: "🗃️", desc: "Bulky or heavy items", basePrice: 2000 },
  { id: "food", label: "Food & Drinks", icon: "🍱", desc: "Meals, groceries", basePrice: 800 },
];

const trackStages = [
  { id: 0, label: "Order Confirmed", icon: "✓", time: "Confirmed" },
  { id: 1, label: "Rider Assigned", icon: "🏍", time: "Assigned" },
  { id: 2, label: "Package Picked Up", icon: "📦", time: "Picked up" },
  { id: 3, label: "On the Way", icon: "🛣", time: "Now", active: true },
  { id: 4, label: "Delivered", icon: "🏠", time: "" },
];

export default function App() {
  const [view, setView] = useState(VIEWS.LANDING);
  const [user, setUser] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedRider, setSelectedRider] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [riderPos, setRiderPos] = useState({ x: 30, y: 35 });
  const [eta, setEta] = useState(12);
  const [trackProgress, setTrackProgress] = useState(40);
  const trackRef = useRef(null);

  useEffect(() => {
    if (view === VIEWS.TRACKING) {
      trackRef.current = setInterval(() => {
        setRiderPos(p => ({ x: Math.min(p.x + 0.9, 68), y: Math.min(p.y + 0.6, 74) }));
        setTrackProgress(p => Math.min(p + 0.5, 98));
        setEta(p => Math.max(p - 0.1, 1));
      }, 1200);
    }
    return () => clearInterval(trackRef.current);
  }, [view]);

  const userFrom = (u) => ({
    name: u.user_metadata?.name || u.email.split("@")[0],
    email: u.email,
    phone: u.user_metadata?.phone || "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setUser(userFrom(data.session.user));
        setView(v => (v === VIEWS.LANDING ? VIEWS.DASHBOARD : v));
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSignup = async () => {
    if (!authForm.name || !authForm.email || !authForm.password || !authForm.phone) {
      setAuthError("Please fill in all fields"); return;
    }
    if (authForm.password.length < 6) {
      setAuthError("Password must be at least 6 characters"); return;
    }
    setLoading(true); setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email: authForm.email.trim(),
      password: authForm.password,
      options: { data: { name: authForm.name.trim(), phone: authForm.phone.trim() } },
    });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    if (data.session) {
      setUser(userFrom(data.user)); setView(VIEWS.DASHBOARD);
    } else {
      setAuthError("Account created. Check your email to confirm, then log in.");
    }
  };

  const handleLogin = async () => {
    if (!authForm.email || !authForm.password) {
      setAuthError("Please enter your email and password"); return;
    }
    setLoading(true); setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authForm.email.trim(),
      password: authForm.password,
    });
    setLoading(false);
    if (error) { setAuthError(error.message); return; }
    setUser(userFrom(data.user)); setView(VIEWS.DASHBOARD);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setView(VIEWS.LANDING);
    setCurrentOrder(null); setSelectedRider(null);
    setSelectedPackage(null); setPickup(""); setDropoff("");
    setAuthForm({ name: "", email: "", phone: "", password: "" });
  };

  const handlePayment = () => {
    const amount = (selectedRider?.price || 1500) + (selectedPackage?.basePrice || 500);
    if (window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: "YOUR_PAYSTACK_PUBLIC_KEY",
        email: user?.email,
        amount: amount * 100,
        currency: "NGN",
        ref: `SN-${Date.now()}`,
        callback: (res) => completeOrder(amount, res.reference),
        onClose: () => {},
      });
      handler.openIframe();
    } else {
      setTimeout(() => completeOrder(amount, `SN-REF-${Date.now()}`), 800);
    }
  };

  const completeOrder = async (amount, ref) => {
    const id = `SN${Math.floor(Math.random() * 90000) + 10000}`;
    setCurrentOrder({
      id,
      rider: selectedRider, package: selectedPackage,
      pickup, dropoff, amount, ref,
      time: new Date().toLocaleTimeString(),
    });
    supabase.from("orders").insert({
      id, rider_name: selectedRider?.name, package_label: selectedPackage?.label,
      pickup, dropoff, amount, paystack_ref: ref,
    }).then(({ error }) => { if (error) console.error("Order save failed:", error.message); });
    setRiderPos({ x: 30, y: 35 });
    setEta(12); setTrackProgress(40);
    setView(VIEWS.TRACKING);
  };

  const totalAmount = (selectedRider?.price || 0) + (selectedPackage?.basePrice || 0);

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── LANDING ── */}
      {view === VIEWS.LANDING && (
        <div className="fade-in">
          <div style={s.landingBg} />
          <nav style={s.landingNav}>
            <div>
              <div style={s.logoRow}>
                <span style={s.logoEmoji}>🚀</span>
                <span style={s.logoText}>Swift<span style={s.gold}>Naija</span></span>
              </div>
              <div style={s.logoSub}>A sub-company by Daniel Effanga Group</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={s.btnOutline} onClick={() => { setAuthError(""); setView(VIEWS.LOGIN); }}>Log In</button>
              <button style={s.btnGold} onClick={() => { setAuthError(""); setView(VIEWS.SIGNUP); }}>Sign Up</button>
            </div>
          </nav>

          <div style={s.hero}>
            <div style={s.heroBadge}>🇳🇬 Lagos · Abuja · Port Harcourt · Kano</div>
            <h1 style={s.heroTitle}>Nigeria's Fastest<br /><span style={s.gold}>Delivery Platform</span></h1>
            <p style={s.heroSub}>Connect with verified local riders. Book in seconds, track in real-time, and pay securely with Paystack.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button style={s.btnGoldLg} className="btn-pop" onClick={() => { setAuthError(""); setView(VIEWS.SIGNUP); }}>
                Get Started Free →
              </button>
              <button style={s.btnOutlineLg} onClick={() => { setAuthError(""); setView(VIEWS.LOGIN); }}>
                I have an account
              </button>
            </div>
          </div>

          <div style={s.statsRow}>
            {[["5,000+", "Verified Riders"], ["₦2M+", "Delivered Daily"], ["98%", "On-time Rate"], ["4.9★", "Avg Rating"]].map(([v, l]) => (
              <div key={l} style={s.statCard}>
                <div style={s.statVal}>{v}</div>
                <div style={s.statLbl}>{l}</div>
              </div>
            ))}
          </div>

          <div style={s.featRow}>
            {[
              ["📍", "Real-Time Tracking", "Watch your package move live on the map with live ETA updates"],
              ["💳", "Secure Payments", "Pay safely with Paystack — cards, bank transfer, USSD"],
              ["🏍", "Verified Riders", "Every rider is background-checked and rated by customers"],
              ["⚡", "Instant Booking", "Book a rider in under 60 seconds, anytime, anywhere"],
            ].map(([icon, title, desc]) => (
              <div key={title} style={s.featCard} className="card-hover">
                <div style={s.featIcon}>{icon}</div>
                <div style={s.featTitle}>{title}</div>
                <div style={s.featDesc}>{desc}</div>
              </div>
            ))}
          </div>

          <div style={s.footer}>
            <div style={s.footerLogo}>🚀 SwiftNaija</div>
            <div style={s.footerSub}>A sub-company by Daniel Effanga Group</div>
            <div style={s.footerLinks}>© 2026 Daniel Effanga Group · All rights reserved</div>
          </div>
        </div>
      )}

      {/* ── SIGN UP ── */}
      {view === VIEWS.SIGNUP && (
        <div style={s.authPage} className="fade-in">
          <div style={s.authCard}>
            <div style={s.authLogoRow}>
              <span style={s.logoEmoji}>🚀</span>
              <div>
                <div style={s.logoText}>Swift<span style={s.gold}>Naija</span></div>
                <div style={s.logoSub}>A sub-company by Daniel Effanga Group</div>
              </div>
            </div>
            <h2 style={s.authTitle}>Create Your Account</h2>
            <p style={s.authSub}>Join thousands of Nigerians using SwiftNaija</p>

            {authError && <div style={s.errorBox}>⚠️ {authError}</div>}

            {[
              ["Full Name", "text", "e.g. Emeka Okafor", "name"],
              ["Email Address", "email", "you@email.com", "email"],
              ["Phone Number", "tel", "080XXXXXXXX", "phone"],
              ["Password", "password", "Min. 6 characters", "password"],
            ].map(([label, type, placeholder, key]) => (
              <div key={key} style={s.inputGroup}>
                <label style={s.label}>{label}</label>
                <input style={s.input} type={type} placeholder={placeholder}
                  value={authForm[key]} onChange={e => setAuthForm({ ...authForm, [key]: e.target.value })} />
              </div>
            ))}

            <button style={{ ...s.btnGoldFull, opacity: loading ? 0.7 : 1 }}
              onClick={handleSignup} disabled={loading} className="btn-pop">
              {loading ? "Creating account..." : "Create Account →"}
            </button>
            <p style={s.authSwitch}>
              Already have an account?{" "}
              <button style={s.linkBtn} onClick={() => { setAuthError(""); setView(VIEWS.LOGIN); }}>Log in</button>
            </p>
            <button style={s.backLink} onClick={() => setView(VIEWS.LANDING)}>← Back to home</button>
          </div>
        </div>
      )}

      {/* ── LOGIN ── */}
      {view === VIEWS.LOGIN && (
        <div style={s.authPage} className="fade-in">
          <div style={s.authCard}>
            <div style={s.authLogoRow}>
              <span style={s.logoEmoji}>🚀</span>
              <div>
                <div style={s.logoText}>Swift<span style={s.gold}>Naija</span></div>
                <div style={s.logoSub}>A sub-company by Daniel Effanga Group</div>
              </div>
            </div>
            <h2 style={s.authTitle}>Welcome Back</h2>
            <p style={s.authSub}>Log in to your SwiftNaija account</p>

            {authError && <div style={s.errorBox}>⚠️ {authError}</div>}

            {[
              ["Email Address", "email", "you@email.com", "email"],
              ["Password", "password", "Your password", "password"],
            ].map(([label, type, placeholder, key]) => (
              <div key={key} style={s.inputGroup}>
                <label style={s.label}>{label}</label>
                <input style={s.input} type={type} placeholder={placeholder}
                  value={authForm[key]} onChange={e => setAuthForm({ ...authForm, [key]: e.target.value })} />
              </div>
            ))}

            <button style={{ ...s.btnGoldFull, opacity: loading ? 0.7 : 1 }}
              onClick={handleLogin} disabled={loading} className="btn-pop">
              {loading ? "Logging in..." : "Log In →"}
            </button>
            <p style={s.authSwitch}>
              Don't have an account?{" "}
              <button style={s.linkBtn} onClick={() => { setAuthError(""); setView(VIEWS.SIGNUP); }}>Sign up free</button>
            </p>
            <button style={s.backLink} onClick={() => setView(VIEWS.LANDING)}>← Back to home</button>
          </div>
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {view === VIEWS.DASHBOARD && user && (
        <div className="fade-in">
          <nav style={s.nav}>
            <div>
              <div style={s.logoRow}>
                <span style={{ fontSize: 20 }}>🚀</span>
                <span style={{ ...s.logoText, fontSize: 18 }}>Swift<span style={s.gold}>Naija</span></span>
              </div>
              <div style={{ ...s.logoSub, fontSize: 10 }}>Daniel Effanga Group</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {currentOrder && (
                <button style={s.liveBadge} onClick={() => setView(VIEWS.TRACKING)}>● LIVE</button>
              )}
              <button style={s.navIconBtn} onClick={() => setView(VIEWS.PROFILE)}>👤</button>
            </div>
          </nav>

          <div style={s.main}>
            <div style={s.welcomeCard}>
              <div>
                <div style={s.welcomeHi}>Good day, {user.name.split(" ")[0]}! 👋</div>
                <div style={s.welcomeSub}>Where are you sending today?</div>
              </div>
              <span style={{ fontSize: 40 }}>🚀</span>
            </div>

            <button style={s.bookBigBtn} className="btn-pop"
              onClick={() => { setView(VIEWS.BOOK); setBookingStep(1); }}>
              + Book a Delivery
            </button>

            {currentOrder && (
              <div style={s.activeOrderCard} onClick={() => setView(VIEWS.TRACKING)} className="card-hover">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={s.liveTag}>● LIVE ORDER</span>
                  <span style={{ color: "#D4A017", fontWeight: 700 }}>#{currentOrder.id}</span>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{currentOrder.rider?.name} is on the way</div>
                <div style={{ color: "#9CA3AF", fontSize: 13 }}>ETA ~{Math.ceil(eta)} min · Tap to track live →</div>
              </div>
            )}

            <div style={s.sectionHdr}>
              <span style={s.sectionTitle}>Available Riders Near You</span>
            </div>

            {riders.filter(r => r.status === "available").map(r => (
              <div key={r.id} style={s.riderRow} className="card-hover"
                onClick={() => { setSelectedRider(r); setView(VIEWS.BOOK); setBookingStep(3); }}>
                <div style={{ ...s.avatar, background: avatarColor(r.id) }}>{r.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.riderName}>{r.name}</div>
                  <div style={s.riderMeta}>{r.bike} · {r.distance} · ★ {r.rating}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={s.etaTag}>{r.eta}</div>
                  <div style={s.priceTag}>₦{r.price.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BOOK ── */}
      {view === VIEWS.BOOK && (
        <div className="fade-in">
          <nav style={s.nav}>
            <button style={s.backBtn} onClick={() => setView(VIEWS.DASHBOARD)}>← Back</button>
            <div style={s.navTitle}>Book Delivery</div>
            <div />
          </nav>
          <div style={s.main}>
            <div style={s.stepRow}>
              {["Address", "Package", "Rider"].map((label, i) => (
                <div key={label} style={s.stepItem}>
                  <div style={{ ...s.stepDot, ...(bookingStep > i + 1 ? s.stepDone : bookingStep === i + 1 ? s.stepActive : {}) }}>
                    {bookingStep > i + 1 ? "✓" : i + 1}
                  </div>
                  <span style={{ ...s.stepLabel, ...(bookingStep === i + 1 ? { color: "#D4A017" } : {}) }}>{label}</span>
                  {i < 2 && <div style={{ ...s.stepLine, ...(bookingStep > i + 1 ? { background: "#D4A017" } : {}) }} />}
                </div>
              ))}
            </div>

            {bookingStep === 1 && (
              <div className="fade-in">
                <div style={s.inputGroup}>
                  <label style={s.label}>📍 Pickup Address</label>
                  <input style={s.input} placeholder="Where should the rider pick up?" value={pickup}
                    onChange={e => setPickup(e.target.value)} />
                </div>
                <div style={s.quickAddrs}>
                  {["Victoria Island, Lagos", "Lekki Phase 1", "Ikeja GRA", "Surulere", "Wuse 2, Abuja", "Garki, Abuja"].map(a => (
                    <button key={a} style={s.quickChip} onClick={() => setPickup(a)}>{a}</button>
                  ))}
                </div>
                <div style={{ ...s.inputGroup, marginTop: 20 }}>
                  <label style={s.label}>🏁 Drop-off Address</label>
                  <input style={s.input} placeholder="Where should it be delivered?" value={dropoff}
                    onChange={e => setDropoff(e.target.value)} />
                </div>
                <button style={{ ...s.btnGoldFull, opacity: (!pickup || !dropoff) ? 0.5 : 1, marginTop: 24 }}
                  disabled={!pickup || !dropoff} onClick={() => setBookingStep(2)} className="btn-pop">
                  Continue →
                </button>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="fade-in">
                <p style={{ color: "#9CA3AF", marginBottom: 16 }}>What are you sending?</p>
                <div style={s.pkgGrid}>
                  {packageTypes.map(pkg => (
                    <button key={pkg.id}
                      style={{ ...s.pkgCard, ...(selectedPackage?.id === pkg.id ? s.pkgActive : {}) }}
                      onClick={() => setSelectedPackage(pkg)} className="card-hover">
                      <div style={{ fontSize: 30, marginBottom: 8 }}>{pkg.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{pkg.label}</div>
                      <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 8 }}>{pkg.desc}</div>
                      <div style={{ color: "#D4A017", fontWeight: 700, fontSize: 13 }}>+₦{pkg.basePrice.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button style={{ ...s.btnOutlineFull, flex: 1 }} onClick={() => setBookingStep(1)}>← Back</button>
                  <button style={{ ...s.btnGoldFull, flex: 2, opacity: !selectedPackage ? 0.5 : 1 }}
                    disabled={!selectedPackage} onClick={() => setBookingStep(3)} className="btn-pop">
                    Find Riders →
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="fade-in">
                <p style={{ color: "#9CA3AF", marginBottom: 16 }}>Choose your rider</p>
                {riders.map(r => (
                  <div key={r.id}
                    style={{ ...s.riderRowFull, ...(selectedRider?.id === r.id ? s.riderSelected : {}), ...(r.status === "busy" ? { opacity: 0.4 } : {}) }}
                    onClick={() => r.status === "available" && setSelectedRider(r)}
                    className={r.status === "available" ? "card-hover" : ""}>
                    <div style={{ ...s.avatar, background: avatarColor(r.id) }}>{r.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.riderName}>
                        {r.name} {r.status === "busy" && <span style={{ color: "#EF4444", fontSize: 11 }}>Busy</span>}
                      </div>
                      <div style={s.riderMeta}>{r.bike} · {r.trips.toLocaleString()} trips · ★ {r.rating}</div>
                      <div style={{ color: "#D4A017", fontSize: 12, marginTop: 2 }}>{r.distance} · ETA {r.eta}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#F3F4F6", fontWeight: 800, fontSize: 15 }}>₦{r.price.toLocaleString()}</div>
                      {selectedRider?.id === r.id && <div style={s.checkCircle}>✓</div>}
                    </div>
                  </div>
                ))}

                {selectedRider && selectedPackage && (
                  <div style={s.summaryBox}>
                    <div style={s.sumRow}><span>Rider fee</span><span>₦{selectedRider.price.toLocaleString()}</span></div>
                    <div style={s.sumRow}><span>Package handling</span><span>₦{selectedPackage.basePrice.toLocaleString()}</span></div>
                    <div style={{ ...s.sumRow, fontWeight: 800, color: "#D4A017", fontSize: 17, marginTop: 8, borderTop: "1px solid #1E293B", paddingTop: 12 }}>
                      <span>Total</span><span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button style={{ ...s.btnOutlineFull, flex: 1 }} onClick={() => setBookingStep(2)}>← Back</button>
                  <button style={{ ...s.btnGoldFull, flex: 2, opacity: !selectedRider ? 0.5 : 1 }}
                    disabled={!selectedRider} onClick={() => setView(VIEWS.PAYMENT)} className="btn-pop">
                    Pay ₦{totalAmount.toLocaleString()} →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAYMENT ── */}
      {view === VIEWS.PAYMENT && (
        <div className="fade-in">
          <nav style={s.nav}>
            <button style={s.backBtn} onClick={() => setView(VIEWS.BOOK)}>← Back</button>
            <div style={s.navTitle}>Secure Payment</div>
            <div />
          </nav>
          <div style={s.main}>
            <div style={s.payCard}>
              <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>💳</div>
              <h2 style={{ textAlign: "center", fontWeight: 800, marginBottom: 24, fontSize: 20 }}>Order Summary</h2>

              <div style={s.summaryBox}>
                <div style={s.sumRow}>
                  <span style={{ color: "#9CA3AF" }}>Pickup</span>
                  <span style={{ color: "#D4A017", fontSize: 13, textAlign: "right", maxWidth: 200 }}>{pickup}</span>
                </div>
                <div style={s.sumRow}>
                  <span style={{ color: "#9CA3AF" }}>Drop-off</span>
                  <span style={{ color: "#D4A017", fontSize: 13, textAlign: "right", maxWidth: 200 }}>{dropoff}</span>
                </div>
                <div style={s.sumRow}><span style={{ color: "#9CA3AF" }}>Rider</span><span>{selectedRider?.name}</span></div>
                <div style={s.sumRow}><span style={{ color: "#9CA3AF" }}>Package</span><span>{selectedPackage?.label}</span></div>
                <div style={s.sumRow}><span style={{ color: "#9CA3AF" }}>Rider fee</span><span>₦{selectedRider?.price.toLocaleString()}</span></div>
                <div style={s.sumRow}><span style={{ color: "#9CA3AF" }}>Handling</span><span>₦{selectedPackage?.basePrice.toLocaleString()}</span></div>
                <div style={{ ...s.sumRow, fontWeight: 900, color: "#D4A017", fontSize: 20, borderTop: "1px solid #1E293B", paddingTop: 14, marginTop: 8 }}>
                  <span>Total</span><span>₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div style={s.paystackBadge}>🔒 Secured by Paystack</div>
              <div style={s.payMethods}>Cards · Bank Transfer · USSD · Mobile Money</div>

              <button style={s.paystackBtn} onClick={handlePayment} className="btn-pop">
                Pay ₦{totalAmount.toLocaleString()} with Paystack →
              </button>

              <div style={{ textAlign: "center", color: "#6B7280", fontSize: 12, marginTop: 12 }}>
                SwiftNaija · A sub-company by Daniel Effanga Group
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TRACKING ── */}
      {view === VIEWS.TRACKING && (
        <div className="fade-in">
          <nav style={s.nav}>
            <button style={s.backBtn} onClick={() => setView(VIEWS.DASHBOARD)}>← Home</button>
            <div style={s.navTitle}>Live Tracking</div>
            <div style={{ color: "#22C55E", fontSize: 13, fontWeight: 700 }}>● LIVE</div>
          </nav>
          <div style={s.main}>
            {currentOrder && (
              <div style={s.orderIdBar}>
                Order <span style={{ color: "#D4A017" }}>#{currentOrder.id}</span>
                {" "}· Paid <span style={{ color: "#22C55E" }}>₦{currentOrder.amount?.toLocaleString()}</span>
              </div>
            )}

            {/* Live Map */}
            <div style={s.mapBox}>
              <div style={s.mapGrid} />
              <svg style={s.mapSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="100" y2="50" stroke="#1E3A5F" strokeWidth="2" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#1E3A5F" strokeWidth="2" />
                <line x1="0" y1="30" x2="100" y2="70" stroke="#162D44" strokeWidth="1.5" />
                <line x1="20" y1="0" x2="80" y2="100" stroke="#162D44" strokeWidth="1" />
                <polyline points={`${riderPos.x},${riderPos.y} 72,78`} stroke="#D4A017" strokeWidth="2.5" strokeDasharray="4,3" fill="none" />
              </svg>
              <div style={{ ...s.mapRider, left: `${riderPos.x}%`, top: `${riderPos.y}%` }} className="rider-pulse">🏍</div>
              <div style={s.mapDest}>📍</div>
              <div style={s.mapHome}>🏠</div>
              <div style={s.mapEtaChip}>ETA ~{Math.ceil(eta)} min</div>
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 8, background: "#1E293B", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${trackProgress}%`, background: "linear-gradient(90deg,#D4A017,#F59E0B)", borderRadius: 4, transition: "width 1s ease" }} />
              </div>
              <span style={{ color: "#D4A017", fontWeight: 700, fontSize: 13 }}>{Math.round(trackProgress)}%</span>
            </div>

            {/* Timeline */}
            <div style={{ marginBottom: 24 }}>
              {trackStages.map((stage, i) => {
                const done = i < 3;
                const active = !!stage.active;
                return (
                  <div key={stage.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative", paddingBottom: 16 }}>
                    <div style={{ ...s.tlDot, ...(done ? s.tlDone : active ? s.tlActive : s.tlPending) }}>
                      {done ? "✓" : stage.icon}
                    </div>
                    <div style={{ flex: 1, paddingTop: 5 }}>
                      <div style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? "#D4A017" : done ? "#6B7280" : "#9CA3AF" }}>
                        {stage.label} {active && <span style={{ fontSize: 11, color: "#22C55E" }}>● Live</span>}
                      </div>
                      {stage.time && <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>{stage.time}</div>}
                    </div>
                    {i < trackStages.length - 1 && (
                      <div style={{ position: "absolute", left: 15, top: 32, width: 2, height: "calc(100% - 16px)", background: done ? "#D4A017" : "#1E293B", transform: "translateX(-50%)" }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rider card */}
            <div style={s.riderInfoCard}>
              <div style={{ ...s.avatar, background: avatarColor(currentOrder?.rider?.id || 3), width: 52, height: 52, fontSize: 17 }}>
                {currentOrder?.rider?.avatar || "CK"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.riderName}>{currentOrder?.rider?.name || "Chukwudi K."}</div>
                <div style={s.riderMeta}>★ {currentOrder?.rider?.rating || "4.95"} · {(currentOrder?.rider?.trips || 2104).toLocaleString()} trips</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={s.iconBtn}>📞</button>
                <button style={s.iconBtn}>💬</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROFILE ── */}
      {view === VIEWS.PROFILE && user && (
        <div className="fade-in">
          <nav style={s.nav}>
            <button style={s.backBtn} onClick={() => setView(VIEWS.DASHBOARD)}>← Back</button>
            <div style={s.navTitle}>My Profile</div>
            <div />
          </nav>
          <div style={s.main}>
            <div style={s.profileCard}>
              <div style={s.profileAvatar}>{user.name[0]}</div>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{user.name}</div>
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>{user.email}</div>
              <div style={{ color: "#9CA3AF", fontSize: 14 }}>{user.phone}</div>
            </div>

            <div style={{ marginTop: 24 }}>
              {[
                ["📦", "My Orders", () => currentOrder && setView(VIEWS.TRACKING)],
                ["💳", "Payment Methods", () => {}],
                ["🔔", "Notifications", () => {}],
                ["❓", "Help & Support", () => {}],
                ["🚪", "Log Out", handleLogout],
              ].map(([icon, label, fn]) => (
                <button key={label} style={s.menuItem} onClick={fn} className="card-hover">
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "#4B5563", fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>

            <div style={{ textAlign: "center", color: "#4B5563", fontSize: 12, marginTop: 32 }}>
              🚀 SwiftNaija · A sub-company by Daniel Effanga Group
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function avatarColor(id) {
  const c = ["#B45309", "#7C3AED", "#0369A1", "#065F46", "#9D174D"];
  return c[(id || 0) % c.length];
}

const s = {
  root: { minHeight: "100vh", background: "#0B0F1A", fontFamily: "'Sora','DM Sans',sans-serif", color: "#F3F4F6" },
  landingBg: { position: "fixed", inset: 0, background: "radial-gradient(ellipse at 20% 50%,#1a2744 0%,#0B0F1A 60%)", zIndex: 0 },
  landingNav: { position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #1E293B" },
  logoRow: { display: "flex", alignItems: "center", gap: 8 },
  logoEmoji: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: 900, color: "#F3F4F6", letterSpacing: "-0.5px" },
  logoSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  gold: { color: "#D4A017" },
  hero: { position: "relative", zIndex: 1, textAlign: "center", padding: "56px 24px 40px", maxWidth: 600, margin: "0 auto" },
  heroBadge: { display: "inline-block", background: "#1E293B", border: "1px solid #D4A01740", color: "#D4A017", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, marginBottom: 20 },
  heroTitle: { fontSize: "clamp(1.8rem,7vw,3.2rem)", fontWeight: 900, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-1px" },
  heroSub: { color: "#9CA3AF", fontSize: 15, lineHeight: 1.7, marginBottom: 32 },
  statsRow: { position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, padding: "0 20px 36px", maxWidth: 680, margin: "0 auto" },
  statCard: { background: "#111827", border: "1px solid #1E293B", borderRadius: 12, padding: "14px 8px", textAlign: "center" },
  statVal: { fontSize: 18, fontWeight: 800, color: "#D4A017", marginBottom: 4 },
  statLbl: { fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  featRow: { position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, padding: "0 20px 40px", maxWidth: 680, margin: "0 auto" },
  featCard: { background: "#111827", border: "1px solid #1E293B", borderRadius: 14, padding: 18, transition: "all 0.2s", cursor: "pointer" },
  featIcon: { fontSize: 26, marginBottom: 10 },
  featTitle: { fontWeight: 700, fontSize: 14, marginBottom: 6 },
  featDesc: { color: "#6B7280", fontSize: 12, lineHeight: 1.5 },
  footer: { position: "relative", zIndex: 1, textAlign: "center", padding: "32px 24px", borderTop: "1px solid #1E293B" },
  footerLogo: { fontSize: 18, fontWeight: 800, marginBottom: 6 },
  footerSub: { color: "#D4A017", fontSize: 13, marginBottom: 8 },
  footerLinks: { color: "#4B5563", fontSize: 12 },

  // Buttons
  btnGold: { background: "#D4A017", color: "#0B0F1A", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 800, cursor: "pointer" },
  btnOutline: { background: "transparent", color: "#F3F4F6", border: "1px solid #374151", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnGoldLg: { background: "#D4A017", color: "#0B0F1A", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 800, cursor: "pointer" },
  btnOutlineLg: { background: "transparent", color: "#F3F4F6", border: "1px solid #374151", borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 600, cursor: "pointer" },
  btnGoldFull: { width: "100%", background: "#D4A017", color: "#0B0F1A", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  btnOutlineFull: { background: "transparent", color: "#F3F4F6", border: "1px solid #374151", borderRadius: 12, padding: "16px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  // Auth
  authPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0B0F1A" },
  authCard: { width: "100%", maxWidth: 420, background: "#111827", border: "1px solid #1E293B", borderRadius: 20, padding: "32px 28px" },
  authLogoRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24, justifyContent: "center" },
  authTitle: { fontSize: 22, fontWeight: 800, margin: "0 0 6px", textAlign: "center" },
  authSub: { color: "#9CA3AF", fontSize: 14, marginBottom: 24, textAlign: "center" },
  errorBox: { background: "#7F1D1D", border: "1px solid #EF4444", borderRadius: 10, padding: "12px 16px", color: "#FCA5A5", fontSize: 14, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { width: "100%", background: "#1F2937", border: "1px solid #374151", borderRadius: 10, padding: "14px 16px", color: "#F3F4F6", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  authSwitch: { textAlign: "center", color: "#9CA3AF", fontSize: 14, margin: "16px 0 8px" },
  linkBtn: { background: "none", border: "none", color: "#D4A017", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: 14 },
  backLink: { display: "block", width: "100%", background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 14, textAlign: "center", marginTop: 8, fontFamily: "inherit" },

  // Nav
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #1E293B", background: "#0B0F1Aee", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 },
  navTitle: { fontWeight: 800, fontSize: 17 },
  navIconBtn: { background: "#1F2937", border: "none", width: 38, height: 38, borderRadius: "50%", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  liveBadge: { background: "#22C55E20", color: "#22C55E", border: "1px solid #22C55E40", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  backBtn: { background: "none", border: "1px solid #1E293B", color: "#9CA3AF", cursor: "pointer", borderRadius: 8, padding: "8px 14px", fontFamily: "inherit", fontSize: 14 },

  // Main
  main: { maxWidth: 640, margin: "0 auto", padding: "24px 20px 80px" },
  welcomeCard: { background: "linear-gradient(135deg,#1a2744,#111827)", border: "1px solid #1E3A5F", borderRadius: 16, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  welcomeHi: { fontSize: 18, fontWeight: 800, marginBottom: 4 },
  welcomeSub: { color: "#9CA3AF", fontSize: 14 },
  bookBigBtn: { width: "100%", background: "#D4A017", color: "#0B0F1A", border: "none", borderRadius: 14, padding: "18px", fontSize: 17, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 },
  activeOrderCard: { background: "#111827", border: "1px solid #D4A01740", borderRadius: 14, padding: 16, marginBottom: 24, cursor: "pointer" },
  liveTag: { color: "#22C55E", fontSize: 12, fontWeight: 700 },
  sectionHdr: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 700 },

  // Rider row
  riderRow: { display: "flex", alignItems: "center", gap: 14, background: "#111827", border: "1px solid #1E293B", borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" },
  riderRowFull: { display: "flex", alignItems: "center", gap: 14, background: "#111827", border: "1px solid #1E293B", borderRadius: 14, padding: "14px 16px", marginBottom: 10, cursor: "pointer", transition: "all 0.2s" },
  riderSelected: { border: "2px solid #D4A017", background: "#D4A01710" },
  riderName: { fontWeight: 700, fontSize: 15, marginBottom: 2 },
  riderMeta: { color: "#6B7280", fontSize: 12 },
  etaTag: { background: "#D4A01720", color: "#D4A017", border: "1px solid #D4A01740", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 700, marginBottom: 4, textAlign: "center" },
  priceTag: { color: "#9CA3AF", fontSize: 12 },
  checkCircle: { width: 26, height: 26, borderRadius: "50%", background: "#D4A017", color: "#0B0F1A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, marginTop: 4, marginLeft: "auto" },

  // Avatar
  avatar: { width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0 },

  // Steps
  stepRow: { display: "flex", alignItems: "center", marginBottom: 28, gap: 0 },
  stepItem: { display: "flex", alignItems: "center", gap: 6, flex: 1, position: "relative" },
  stepDot: { width: 30, height: 30, borderRadius: "50%", background: "#1E293B", border: "2px solid #374151", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#6B7280", flexShrink: 0, zIndex: 1 },
  stepActive: { background: "#D4A01720", border: "2px solid #D4A017", color: "#D4A017" },
  stepDone: { background: "#D4A017", border: "2px solid #D4A017", color: "#0B0F1A" },
  stepLabel: { fontSize: 11, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" },
  stepLine: { position: "absolute", left: 36, right: -8, height: 2, background: "#1E293B", top: "50%", transform: "translateY(-50%)" },

  // Package
  pkgGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  pkgCard: { background: "#111827", border: "1px solid #1E293B", borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  pkgActive: { border: "2px solid #D4A017", background: "#D4A01710" },

  // Quick chips
  quickAddrs: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 },
  quickChip: { background: "none", border: "1px solid #1E293B", color: "#6B7280", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" },

  // Summary
  summaryBox: { background: "#0B0F1A", border: "1px solid #1E293B", borderRadius: 12, padding: 16, marginTop: 16 },
  sumRow: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #1E293B", fontSize: 14 },

  // Payment
  payCard: { background: "#111827", border: "1px solid #1E293B", borderRadius: 20, padding: "28px 24px" },
  paystackBadge: { textAlign: "center", color: "#22C55E", fontWeight: 700, fontSize: 14, margin: "20px 0 6px" },
  payMethods: { textAlign: "center", color: "#6B7280", fontSize: 12, marginBottom: 20 },
  paystackBtn: { width: "100%", background: "#00C3F7", color: "#0B0F1A", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },

  // Map
  mapBox: { position: "relative", background: "#0A1628", border: "1px solid #1E293B", borderRadius: 16, height: 240, marginBottom: 16, overflow: "hidden" },
  mapGrid: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(#0D2137 1px,transparent 1px),linear-gradient(90deg,#0D2137 1px,transparent 1px)", backgroundSize: "22px 22px" },
  mapSvg: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  mapRider: { position: "absolute", fontSize: 22, transform: "translate(-50%,-50%)", zIndex: 10, transition: "left 1.2s ease,top 1.2s ease" },
  mapDest: { position: "absolute", right: "28%", bottom: "22%", fontSize: 22 },
  mapHome: { position: "absolute", right: "15%", bottom: "12%", fontSize: 20 },
  mapEtaChip: { position: "absolute", top: 10, right: 10, background: "#0B0F1Acc", border: "1px solid #D4A017", color: "#D4A017", borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 700, backdropFilter: "blur(4px)" },

  // Timeline dots
  tlDot: { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, zIndex: 1 },
  tlDone: { background: "#D4A017", color: "#0B0F1A" },
  tlActive: { background: "#D4A01720", border: "2px solid #D4A017", color: "#D4A017" },
  tlPending: { background: "#1E293B", border: "1px solid #374151", color: "#4B5563" },

  // Order ID
  orderIdBar: { background: "#111827", border: "1px solid #1E293B", borderRadius: 10, padding: "10px 16px", fontSize: 14, marginBottom: 16, textAlign: "center" },

  // Rider info card
  riderInfoCard: { display: "flex", alignItems: "center", gap: 14, background: "#111827", border: "1px solid #1E293B", borderRadius: 14, padding: 16, marginTop: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: "50%", background: "#1E293B", border: "none", cursor: "pointer", fontSize: 18 },

  // Profile
  profileCard: { background: "#111827", border: "1px solid #1E293B", borderRadius: 20, padding: "32px 24px", textAlign: "center", marginBottom: 24 },
  profileAvatar: { width: 80, height: 80, borderRadius: "50%", background: "#D4A017", color: "#0B0F1A", fontSize: 32, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  menuItem: { display: "flex", alignItems: "center", gap: 16, width: "100%", background: "#111827", border: "1px solid #1E293B", borderRadius: 12, padding: "16px 20px", marginBottom: 10, cursor: "pointer", fontFamily: "inherit", color: "#F3F4F6", fontSize: 15, transition: "all 0.2s" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; background: #0B0F1A; }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .btn-pop { transition: transform 0.15s, box-shadow 0.15s; }
  .btn-pop:hover { transform: translateY(-2px); box-shadow: 0 8px 24px #D4A01730; }
  .btn-pop:active { transform: translateY(0); }
  .card-hover { transition: all 0.2s; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 4px 20px #00000040; border-color: #D4A01740 !important; }
  .rider-pulse { animation: rFloat 2s ease-in-out infinite; }
  @keyframes rFloat { 0%,100% { filter: drop-shadow(0 0 6px #D4A017); } 50% { filter: drop-shadow(0 0 14px #D4A017); } }
  input:focus { outline: none; border-color: #D4A017 !important; box-shadow: 0 0 0 3px #D4A01720; }
  @media (max-width: 480px) {
    .statsRow { grid-template-columns: repeat(2,1fr) !important; }
    .featRow { grid-template-columns: 1fr !important; }
  }
`;
    
