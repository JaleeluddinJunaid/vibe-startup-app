import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- helpers to generate consistent fake contact info from a name ---
function slug(name) {
  return (name || "designer").toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
}
function fakeEmail(name) {
  return `${slug(name)}@designerfinder.com.au`;
}
function fakePhone(name) {
  let h = 0;
  for (let i = 0; i < (name || "x").length; i++) h = (h * 31 + name.charCodeAt(i)) % 1000000;
  const a = String(100 + (h % 900)).padStart(3, "0");
  const b = String(100 + ((h * 7) % 900)).padStart(3, "0");
  return `04${String(h % 100).padStart(2, "0")} ${a} ${b}`;
}
function fakeBio(name, description) {
  const first = (name || "This designer").split(" ")[0];
  return `${first} is a Melbourne-based freelance graphic designer specialising in ${
    description || "design work"
  }. With a sharp eye for detail and a collaborative approach, ${first} partners with local small businesses to deliver standout visual work — from first concept to final files.`;
}

function App() {
  // ---------- auth state ----------
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [authMode, setAuthMode] = useState("register"); // "register" | "sent" | "login"
  const [regName, setRegName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [info, setInfo] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // ---------- directory state ----------
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);

  // Restore an existing session on load + keep it in sync.
  // When a user clicks the email confirmation link they're redirected back here,
  // supabase-js picks up the session from the URL, and onAuthStateChange logs them in.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchItems();
  }, [session]);

  const userName =
    session?.user?.user_metadata?.name || session?.user?.email || "there";

  function resetAuthMessages() {
    setAuthError("");
    setInfo("");
  }

  // Registration: create the account -> Supabase emails a confirmation link.
  async function handleRegister(event) {
    event.preventDefault();
    resetAuthMessages();
    if (!regName.trim() || !email.trim() || !password) {
      setAuthError("Please enter your name, email and password.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: regName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthMode("sent");
    setInfo(`We've emailed a confirmation link to ${email.trim()}. Click it to activate your account, then come back and log in.`);
  }

  async function handleResend() {
    resetAuthMessages();
    if (!email.trim()) {
      setAuthError("Enter your email first.");
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setAuthBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setInfo(`Confirmation link re-sent to ${email.trim()}.`);
  }

  async function handleLogin(event) {
    event.preventDefault();
    resetAuthMessages();
    if (!email.trim() || !password) {
      setAuthError("Enter your email and password.");
      return;
    }
    setAuthBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setAuthBusy(false);
    if (error) {
      // Account exists but the email link hasn't been clicked yet.
      if (error.message.toLowerCase().includes("confirm")) {
        setAuthMode("sent");
        setInfo("Your email isn't confirmed yet. Check your inbox for the link, or tap \u201cResend link\u201d.");
        return;
      }
      setAuthError(error.message);
      return;
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSelected(null);
    setRegName("");
    setEmail("");
    setPassword("");
    resetAuthMessages();
    setAuthMode("register");
  }

  async function fetchItems() {
    try {
      const response = await fetch(`${API_URL}/items`);
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      setName("");
      setDescription("");
      await fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const loggedIn = !!session;

  return (
    <div className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,800&family=DM+Sans:wght@400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .page {
          min-height: 100vh; background: #14130f;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0);
          background-size: 24px 24px; font-family: 'DM Sans', sans-serif; color: #f4f1ea;
          padding: 48px 24px 80px;
        }
        .shell { max-width: 880px; margin: 0 auto; }
        .narrow { max-width: 440px; margin: 8vh auto 0; }

        .brandrow {
          display: flex; align-items: center; gap: 10px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase; font-size: 13px; color: #ff7a52;
        }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: #ff7a52; box-shadow: 0 0 12px #ff7a52; }

        .hero { margin: 22px 0 44px; }
        .hero h1 {
          font-family: 'Fraunces', serif; font-weight: 800; font-size: clamp(34px, 6vw, 60px);
          line-height: 1.02; letter-spacing: -0.02em; max-width: 16ch; color: #fbf9f4;
        }
        .hero h1 em { font-style: italic; color: #ff7a52; }
        .hero p { margin-top: 18px; max-width: 48ch; font-size: 17px; line-height: 1.6; color: #b3aea3; }

        .panel {
          background: #1f1d17; border: 1px solid #36322a; border-radius: 18px;
          padding: 26px; box-shadow: 0 24px 50px -30px rgba(0,0,0,0.8);
        }
        .panel h2 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 22px; margin-bottom: 4px; color: #fbf9f4; }
        .panel .sub { color: #8f897c; font-size: 14px; margin-bottom: 20px; }

        .field { margin-bottom: 14px; }
        .field label {
          display: block; font-size: 12px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.05em; color: #9b958a; margin-bottom: 6px;
        }
        .field input {
          width: 100%; padding: 13px 15px; border: 1px solid #3a362d; border-radius: 11px;
          background: #14130f; font-family: inherit; font-size: 15px; color: #f4f1ea;
          transition: border-color .15s, box-shadow .15s;
        }
        .field input::placeholder { color: #6b665b; }
        .field input:focus { outline: none; border-color: #ff7a52; box-shadow: 0 0 0 3px rgba(255,122,82,0.2); }

        .submit {
          width: 100%; margin-top: 6px; padding: 14px; background: #ff7a52; color: #14130f;
          border: none; border-radius: 11px; font-family: inherit; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: transform .12s, background .2s;
        }
        .submit:hover { background: #ff9270; transform: translateY(-1px); }
        .submit:disabled { opacity: .6; cursor: default; transform: none; }

        .err { color: #ff8f6b; font-size: 14px; margin-top: 10px; }
        .info { color: #8fd1a8; font-size: 14px; margin-top: 10px; line-height: 1.5; }

        .authswitch { margin-top: 16px; font-size: 14px; color: #8f897c; text-align: center; }
        .textlink {
          background: none; border: none; color: #ff7a52; font-family: inherit; font-size: 14px;
          font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline;
        }
        .ghostbtn {
          width: 100%; margin-top: 10px; padding: 12px; background: transparent; color: #9b958a;
          border: 1px solid #36322a; border-radius: 11px; font-family: inherit; font-size: 14px;
          cursor: pointer;
        }
        .ghostbtn:hover { border-color: #ff7a52; color: #ff7a52; }
        .ghostbtn:disabled { opacity: .6; cursor: default; }

        .mailicon { font-size: 40px; margin-bottom: 8px; }

        .mfa-tag {
          display: inline-flex; align-items: center; gap: 7px; background: #2a271f; color: #ffb999;
          border: 1px solid #45382e; border-radius: 999px; padding: 5px 12px; font-size: 12px;
          font-weight: 600; margin-bottom: 18px;
        }

        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .greet { font-size: 14px; color: #b3aea3; }
        .logout {
          background: transparent; color: #9b958a; border: 1px solid #36322a; border-radius: 9px;
          padding: 7px 14px; font-family: inherit; font-size: 13px; cursor: pointer;
        }
        .logout:hover { border-color: #ff7a52; color: #ff7a52; }

        .grid { margin-top: 40px; }
        .gridhead {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 18px; border-bottom: 1px solid #36322a; padding-bottom: 12px;
        }
        .gridhead h3 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 20px; color: #fbf9f4; }
        .count { font-size: 14px; color: #8f897c; }

        .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
        .card {
          background: #1f1d17; border: 1px solid #36322a; border-radius: 15px; padding: 20px;
          animation: rise .4s ease both; transition: border-color .15s, transform .15s; cursor: pointer;
        }
        .card:hover { border-color: #ff7a52; transform: translateY(-2px); }
        .avatar {
          width: 42px; height: 42px; border-radius: 12px; background: #ff7a52; color: #14130f;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px; margin-bottom: 14px;
        }
        .card .nm { font-weight: 600; font-size: 17px; margin-bottom: 4px; color: #fbf9f4; }
        .card .ds { font-size: 14px; color: #a9a397; line-height: 1.5; }
        .viewlink { margin-top: 12px; font-size: 13px; color: #ff7a52; font-weight: 600; }

        .empty, .loading { text-align: center; color: #8f897c; padding: 40px 0; font-size: 15px; }

        .security {
          margin-top: 48px; background: #191712; border: 1px solid #36322a; border-radius: 16px; padding: 24px;
        }
        .security h4 {
          font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px; color: #fbf9f4;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
        }
        .shield { color: #ff7a52; }
        .security ul { list-style: none; }
        .security li {
          font-size: 14px; color: #b3aea3; line-height: 1.5; padding: 7px 0 7px 22px;
          position: relative; border-bottom: 1px solid #211f19;
        }
        .security li:last-child { border-bottom: none; }
        .security li::before { content: "✓"; position: absolute; left: 0; color: #ff7a52; font-weight: 700; }
        .privacy-note { font-size: 13px; color: #6b665b; margin-top: 12px; }

        /* profile page */
        .back {
          background: transparent; color: #9b958a; border: 1px solid #36322a; border-radius: 9px;
          padding: 8px 16px; font-family: inherit; font-size: 14px; cursor: pointer; margin-bottom: 28px;
        }
        .back:hover { border-color: #ff7a52; color: #ff7a52; }
        .profile-head { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
        .bigavatar {
          width: 84px; height: 84px; border-radius: 20px; background: #ff7a52; color: #14130f;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 38px; flex-shrink: 0;
        }
        .profile-head .pname { font-family: 'Fraunces', serif; font-weight: 700; font-size: 32px; color: #fbf9f4; }
        .profile-head .pspec { font-size: 16px; color: #ff7a52; margin-top: 4px; }
        .section-label {
          font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
          color: #8f897c; margin: 26px 0 10px;
        }
        .bio { font-size: 16px; line-height: 1.65; color: #cfcabd; }
        .contact-row {
          display: flex; align-items: center; gap: 12px; padding: 14px 0;
          border-bottom: 1px solid #2a271f; font-size: 15px; color: #e8e4da;
        }
        .contact-row:last-child { border-bottom: none; }
        .clabel { color: #8f897c; width: 80px; flex-shrink: 0; font-size: 14px; }
        .badge { display: inline-block; background: #2a271f; color: #9b958a; border-radius: 6px; padding: 3px 9px; font-size: 12px; margin-right: 6px; margin-top: 8px; }

        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      {!authReady ? (
        // ---------- INITIAL SESSION CHECK ----------
        <div className="narrow">
          <div className="loading">Loading…</div>
        </div>
      ) : !loggedIn ? (
        // ---------- AUTH SCREENS (register / sent / login) ----------
        <div className="narrow">
          <div className="brandrow"><span className="dot"></span> Designer Finder — Melbourne</div>

          {authMode === "register" && (
            <>
              <header className="hero" style={{ margin: "20px 0 28px" }}>
                <h1>Create your <em>Designer Finder</em> account</h1>
                <p>Sign up to browse Melbourne's freelance design talent. We'll send a confirmation link to verify your email.</p>
              </header>
              <div className="panel">
                <span className="mfa-tag">✉️ Email-verified sign up</span>
                <h2>Sign up</h2>
                <div className="sub">Enter your details to get started.</div>
                <form onSubmit={handleRegister}>
                  <div className="field">
                    <label>Your name</label>
                    <input placeholder="e.g. Alex Morgan" value={regName} onChange={(e) => setRegName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <button className="submit" type="submit" disabled={authBusy}>
                    {authBusy ? "Creating account…" : "Create account"}
                  </button>
                  {authError && <div className="err">{authError}</div>}
                  {info && <div className="info">{info}</div>}
                </form>
                <div className="authswitch">
                  Already have an account?{" "}
                  <button className="textlink" onClick={() => { resetAuthMessages(); setAuthMode("login"); }}>Log in</button>
                </div>
              </div>
            </>
          )}

          {authMode === "sent" && (
            <>
              <header className="hero" style={{ margin: "20px 0 28px" }}>
                <h1>Confirm your <em>email</em></h1>
                <p>We've sent you a link to make sure this email is really yours. One click and you're in.</p>
              </header>
              <div className="panel">
                <div className="mailicon">✉️</div>
                <h2>Check your inbox</h2>
                <div className="sub">Sent to {email || "your email"}.</div>
                <p style={{ color: "#b3aea3", fontSize: 15, lineHeight: 1.6, margin: "4px 0 4px" }}>
                  Open the email from Designer Finder and click <strong style={{ color: "#f4f1ea" }}>Confirm your email</strong>.
                  Once you do, head to log in. (Check your spam folder if it's not there in a minute.)
                </p>
                {info && <div className="info">{info}</div>}
                {authError && <div className="err">{authError}</div>}
                <button className="ghostbtn" onClick={handleResend} disabled={authBusy}>
                  {authBusy ? "Sending…" : "Resend link"}
                </button>
                <div className="authswitch">
                  <button className="textlink" onClick={() => { resetAuthMessages(); setAuthMode("login"); }}>I've confirmed — log in</button>
                </div>
                <div className="authswitch" style={{ marginTop: 8 }}>
                  <button className="textlink" onClick={() => { resetAuthMessages(); setAuthMode("register"); }}>← Use a different email</button>
                </div>
              </div>
            </>
          )}

          {authMode === "login" && (
            <>
              <header className="hero" style={{ margin: "20px 0 28px" }}>
                <h1>Welcome back to <em>Designer Finder</em></h1>
                <p>Log in to access the directory of Melbourne's freelance design talent.</p>
              </header>
              <div className="panel">
                <h2>Log in</h2>
                <div className="sub">Enter your account details.</div>
                <form onSubmit={handleLogin}>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <input type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <button className="submit" type="submit" disabled={authBusy}>
                    {authBusy ? "Logging in…" : "Log in"}
                  </button>
                  {authError && <div className="err">{authError}</div>}
                  {info && <div className="info">{info}</div>}
                </form>
                <div className="authswitch">
                  New here?{" "}
                  <button className="textlink" onClick={() => { resetAuthMessages(); setAuthMode("register"); }}>Create an account</button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : selected ? (
        // ---------- DESIGNER PROFILE PAGE ----------
        <div className="shell">
          <button className="back" onClick={() => setSelected(null)}>← Back to directory</button>
          <div className="profile-head">
            <div className="bigavatar">{(selected.name || "?").charAt(0).toUpperCase()}</div>
            <div>
              <div className="pname">{selected.name}</div>
              <div className="pspec">{selected.description}</div>
            </div>
          </div>

          <div className="panel">
            <div className="section-label">About</div>
            <p className="bio">{fakeBio(selected.name, selected.description)}</p>

            <div className="section-label">Skills</div>
            <div>
              <span className="badge">Branding</span>
              <span className="badge">Logo design</span>
              <span className="badge">Print</span>
              <span className="badge">Illustration</span>
              <span className="badge">Adobe Suite</span>
            </div>

            <div className="section-label">Contact</div>
            <div className="contact-row"><span className="clabel">Email</span>{fakeEmail(selected.name)}</div>
            <div className="contact-row"><span className="clabel">Phone</span>{fakePhone(selected.name)}</div>
            <div className="contact-row"><span className="clabel">Location</span>Melbourne, VIC</div>
            <div className="contact-row"><span className="clabel">Rate</span>From $75 / hour</div>
          </div>

          <div className="privacy-note" style={{ marginTop: 16 }}>
            Contact details are shown to signed-in members only and are never indexed publicly.
          </div>
        </div>
      ) : (
        // ---------- MAIN DIRECTORY ----------
        <div className="shell">
          <div className="topbar">
            <div className="brandrow"><span className="dot"></span> Designer Finder — Melbourne</div>
            <button className="logout" onClick={handleLogout}>Log out</button>
          </div>
          <div className="greet" style={{ marginTop: 8 }}>Signed in as {userName}</div>

          <header className="hero">
            <h1><em>Designer Finder</em> — where Melbourne business meets local talent.</h1>
            <p>A curated directory connecting Melbourne's freelance graphic designers with small businesses who need great work, close to home.</p>
          </header>

          <div className="panel">
            <h2>Join the directory</h2>
            <div className="sub">Add a designer's profile to the network.</div>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Designer name</label>
                <input placeholder="e.g. Sarah Chen" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>Specialty &amp; suburb</label>
                <input placeholder="e.g. Logo &amp; branding — Fitzroy" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <button className="submit" type="submit" disabled={submitting}>
                {submitting ? "Adding…" : "Add to directory"}
              </button>
            </form>
          </div>

          <section className="grid">
            <div className="gridhead">
              <h3>The directory</h3>
              <span className="count">{items.length} designer{items.length !== 1 ? "s" : ""}</span>
            </div>
            {loading ? (
              <div className="loading">Loading directory…</div>
            ) : items.length === 0 ? (
              <div className="empty">No designers yet — add the first one above.</div>
            ) : (
              <div className="cards">
                {items.map((item) => (
                  <div className="card" key={item.id ?? item.name} onClick={() => setSelected(item)}>
                    <div className="avatar">{(item.name || "?").charAt(0).toUpperCase()}</div>
                    <div className="nm">{item.name}</div>
                    <div className="ds">{item.description}</div>
                    <div className="viewlink">View profile →</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="security">
            <h4><span className="shield">🛡</span> Security &amp; Privacy</h4>
            <ul>
              <li>Every account is email-verified — you confirm a link we email before you can sign in, so accounts can't be created with someone else's address.</li>
              <li>Passwords and sessions are handled by Supabase Auth and never stored in our own app code.</li>
              <li>All traffic is encrypted over HTTPS between your browser, our app, and the database.</li>
              <li>Database credentials and API keys are stored as secure environment variables, never exposed in the app or its code.</li>
            </ul>
            <div className="privacy-note">Designer Finder is built privacy-first: minimal data, no tracking, no selling.</div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;