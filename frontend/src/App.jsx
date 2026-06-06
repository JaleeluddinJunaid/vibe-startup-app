import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

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

  return (
    <div className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,800&family=DM+Sans:wght@400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .page {
          min-height: 100vh;
          background: #14130f;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0);
          background-size: 24px 24px;
          font-family: 'DM Sans', sans-serif;
          color: #f4f1ea;
          padding: 48px 24px 80px;
        }
        .shell { max-width: 880px; margin: 0 auto; }

        .brandrow {
          display: flex; align-items: center; gap: 10px;
          font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          font-size: 13px; color: #ff7a52;
        }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: #ff7a52; box-shadow: 0 0 12px #ff7a52; }

        .hero { margin: 22px 0 44px; }
        .hero h1 {
          font-family: 'Fraunces', serif;
          font-weight: 800;
          font-size: clamp(38px, 6vw, 66px);
          line-height: 1.02;
          letter-spacing: -0.02em;
          max-width: 16ch;
          color: #fbf9f4;
        }
        .hero h1 em { font-style: italic; color: #ff7a52; }
        .hero p {
          margin-top: 18px; max-width: 48ch;
          font-size: 17px; line-height: 1.6; color: #b3 aeA3;
          color: #b3aea3;
        }

        .panel {
          background: #1f1d17;
          border: 1px solid #36322a;
          border-radius: 18px;
          padding: 26px;
          box-shadow: 0 24px 50px -30px rgba(0,0,0,0.8);
        }
        .panel h2 {
          font-family: 'Fraunces', serif; font-weight: 600;
          font-size: 22px; margin-bottom: 4px; color: #fbf9f4;
        }
        .panel .sub { color: #8f897c; font-size: 14px; margin-bottom: 20px; }

        .field { margin-bottom: 14px; }
        .field label {
          display: block; font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: #9b958a; margin-bottom: 6px;
        }
        .field input {
          width: 100%; padding: 13px 15px;
          border: 1px solid #3a362d; border-radius: 11px;
          background: #14130f; font-family: inherit; font-size: 15px;
          color: #f4f1ea; transition: border-color .15s, box-shadow .15s;
        }
        .field input::placeholder { color: #6b665b; }
        .field input:focus {
          outline: none; border-color: #ff7a52;
          box-shadow: 0 0 0 3px rgba(255,122,82,0.2);
        }
        .submit {
          width: 100%; margin-top: 6px; padding: 14px;
          background: #ff7a52; color: #14130f;
          border: none; border-radius: 11px;
          font-family: inherit; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: transform .12s, background .2s;
        }
        .submit:hover { background: #ff9270; transform: translateY(-1px); }
        .submit:disabled { opacity: .6; cursor: default; transform: none; }

        .grid { margin-top: 40px; }
        .gridhead {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 18px; border-bottom: 1px solid #36322a; padding-bottom: 12px;
        }
        .gridhead h3 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 20px; color: #fbf9f4; }
        .count { font-size: 14px; color: #8f897c; }

        .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
        .card {
          background: #1f1d17; border: 1px solid #36322a; border-radius: 15px;
          padding: 20px; animation: rise .4s ease both;
          transition: border-color .15s, transform .15s;
        }
        .card:hover { border-color: #ff7a52; transform: translateY(-2px); }
        .avatar {
          width: 42px; height: 42px; border-radius: 12px;
          background: #ff7a52; color: #14130f;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px;
          margin-bottom: 14px;
        }
        .card .nm { font-weight: 600; font-size: 17px; margin-bottom: 4px; color: #fbf9f4; }
        .card .ds { font-size: 14px; color: #a9a397; line-height: 1.5; }

        .empty, .loading { text-align: center; color: #8f897c; padding: 40px 0; font-size: 15px; }

        @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div className="shell">
        <div className="brandrow"><span className="dot"></span> Designer Finder — Melbourne</div>

        <header className="hero">
          <h1><em>Designer Finder</em> — where Melbourne business meets local talent.</h1>
          <p>
            A curated directory connecting Melbourne's freelance graphic
            designers with small businesses who need great work, close to home.
          </p>
        </header>

        <div className="panel">
          <h2>Join the directory</h2>
          <div className="sub">Add a designer's profile to the network.</div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Designer name</label>
              <input
                placeholder="e.g. Sarah Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Specialty &amp; suburb</label>
              <input
                placeholder="e.g. Logo &amp; branding — Fitzroy"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
                <div className="card" key={item.id ?? item.name}>
                  <div className="avatar">{(item.name || "?").charAt(0).toUpperCase()}</div>
                  <div className="nm">{item.name}</div>
                  <div className="ds">{item.description}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;