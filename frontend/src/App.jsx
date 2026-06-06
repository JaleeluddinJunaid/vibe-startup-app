import { useState, useEffect } from "react";

// The address where your Python backend is running
const API_URL = "http://localhost:8000";

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Load all items when the page first opens
  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const response = await fetch(`${API_URL}/items`);
    const data = await response.json();
    setItems(data);
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stops the page from reloading
    await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setName("");        // clear the form
    setDescription("");
    fetchItems();       // refresh the list
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Vibe Startup — Items</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Item</button>
      </form>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>: {item.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;