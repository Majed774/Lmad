import { useState } from "react";

const TOKEN = "53bcda6d188c431994cd7a8f718d638c";
const BASE = "https://api.loyverse.com/v1.0";

const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

const MENU = {
  Drinks: [
    { name: "Latte", price: 1.4 },
    { name: "Spanish", price: 1.4 },
    { name: "Caramel", price: 1.5 },
    { name: "Vanilla", price: 1.5 },
    { name: "Pistachio", price: 1.6 },
    { name: "Saffron", price: 1.5 },
    { name: "Rose", price: 1.5 },
    { name: "Americano", price: 1.3 },
    { name: "Chocolate", price: 1.5 },
    { name: "Mocha", price: 1.5 },
    { name: "Matcha", price: 1.8 },
    { name: "V 60", price: null, variants: [{ name: "Small", price: 1.6 }, { name: "Large", price: 1.8 }] },
    { name: "Soda", price: 0.5 },
    { name: "Cappuccino", price: 1.3 },
    { name: "Flat White", price: 1.4 },
    { name: "Cortado", price: 1.3 },
    { name: "Espresso", price: 1.1 },
    { name: "Cold Brew", price: 1.7 },
    { name: "Summer Limu Drink", price: 1.5 },
    { name: "Ice Tea", price: 1.5 },
    { name: "Karkidih", price: 1.1 },
    { name: "Creamy Espresso", price: 1.8 },
    { name: "Limu Bro", price: 1.8 },
  ],
  Mojito: [
    { name: "Strawberry Mojito", price: 0.9 },
    { name: "Passion Mojito", price: 0.9 },
    { name: "Blueberry Mojito", price: 0.9 },
    { name: "Peach Mojito", price: 0.9 },
    { name: "Water", price: 0.1 },
  ],
  Sweets: [
    { name: "Cookies", price: 0.6 },
    { name: "Chocolate Cake", price: 1.5 },
    { name: "Tiramisu", price: 1.6 },
    { name: "San Sebastian", price: 1.9 },
    { name: "Ice Cream", price: 1.2 },
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ success: 0, fail: 0 });

  const log = (msg, type = "info") => {
    setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const createCategory = async (name) => {
    const res = await fetch(`${BASE}/categories`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.id) {
      log(`📁 Category created: ${name}`, "success");
      return data.id;
    } else {
      log(`⚠️ Category error: ${JSON.stringify(data)}`, "warn");
      return null;
    }
  };

  const getStoreIds = async () => {
    const res = await fetch(`${BASE}/stores`, { headers });
    const data = await res.json();
    const stores = data.stores || [];
    if (stores.length === 0) {
      log("❌ No stores found!", "error");
      return [];
    }
    log(`🏪 ${stores.length} store(s): ${stores.map(s => s.name).join(", ")}`, "info");
    return stores.map(s => s.id);
  };

  const createItem = async (item, categoryId, storeIds) => {
    const storeEntry = (price) => storeIds.map((id) => ({
      store_id: id,
      price,
      available_for_sale: true,
    }));

    let body;
    if (item.variants) {
      body = {
        item_name: item.name,
        category_id: categoryId,
        option1_name: "Size",
        variants: item.variants.map((v) => ({
          sku: `${item.name.replace(/ /g, "-").toUpperCase()}-${v.name.toUpperCase()}`,
          cost: 0,
          option1_value: v.name,
          stores: storeEntry(v.price),
        })),
      };
    } else {
      body = {
        item_name: item.name,
        category_id: categoryId,
        variants: [{
          sku: item.name.replace(/ /g, "-").toUpperCase(),
          cost: 0,
          stores: storeEntry(item.price),
        }],
      };
    }

    const res = await fetch(`${BASE}/items`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.id) {
      setStats((s) => ({ ...s, success: s.success + 1 }));
      log(`✅ ${item.name} ${item.variants ? `(${item.variants.map(v => `${v.name}: ${v.price}`).join(", ")})` : `— ${item.price} RO`}`, "success");
    } else {
      setStats((s) => ({ ...s, fail: s.fail + 1 }));
      log(`❌ ${item.name}: ${data.message || JSON.stringify(data)}`, "error");
    }
  };

  const startUpload = async () => {
    setRunning(true);
    setLogs([]);
    setStats({ success: 0, fail: 0 });
    setDone(false);

    log("🚀 Starting upload to Loyverse...", "info");

    const storeIds = await getStoreIds();
    await sleep(300);
    if (storeIds.length === 0) { setRunning(false); return; }

    for (const [categoryName, items] of Object.entries(MENU)) {
      log(`\n── ${categoryName} ──`, "section");
      const catId = await createCategory(categoryName);
      await sleep(400);
      if (!catId) continue;

      for (const item of items) {
        await createItem(item, catId, storeIds);
        await sleep(350);
      }
    }

    log("\n🎉 Upload complete!", "done");
    setDone(true);
    setRunning(false);
  };

  const totalItems = Object.values(MENU).flat().length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111",
      color: "#f5f5f5",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "24px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#f5a623", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
          Lmad Café — لمد كافيه
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Loyverse Menu Uploader</h1>
        <p style={{ color: "#888", margin: "6px 0 0", fontSize: 14 }}>
          {totalItems} items across 3 categories
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {Object.entries(MENU).map(([cat, items]) => (
          <div key={cat} style={{
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            padding: "12px 18px",
            minWidth: 120,
          }}>
            <div style={{ color: "#f5a623", fontSize: 12, marginBottom: 4 }}>{cat}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{items.length}</div>
            <div style={{ color: "#555", fontSize: 11 }}>items</div>
          </div>
        ))}
      </div>

      {/* Action */}
      {!running && !done && (
        <button
          onClick={startUpload}
          style={{
            background: "#f5a623",
            color: "#111",
            border: "none",
            borderRadius: 10,
            padding: "14px 32px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          ⬆️ Upload Menu to Loyverse
        </button>
      )}

      {running && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 20, color: "#f5a623"
        }}>
          <div style={{
            width: 18, height: 18, border: "2px solid #f5a623",
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
          <span style={{ fontWeight: 600 }}>Uploading...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Stats */}
      {(running || done) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#1a2e1a", border: "1px solid #2a4a2a", borderRadius: 8, padding: "8px 16px" }}>
            <span style={{ color: "#4caf50", fontWeight: 700 }}>{stats.success}</span>
            <span style={{ color: "#555", fontSize: 12, marginLeft: 6 }}>uploaded</span>
          </div>
          {stats.fail > 0 && (
            <div style={{ background: "#2e1a1a", border: "1px solid #4a2a2a", borderRadius: 8, padding: "8px 16px" }}>
              <span style={{ color: "#f44336", fontWeight: 700 }}>{stats.fail}</span>
              <span style={{ color: "#555", fontSize: 12, marginLeft: 6 }}>failed</span>
            </div>
          )}
        </div>
      )}

      {/* Done */}
      {done && (
        <div style={{
          background: "#1a2e1a", border: "1px solid #4caf50",
          borderRadius: 10, padding: "14px 20px", marginBottom: 20,
          color: "#4caf50", fontWeight: 600
        }}>
          ✅ Done! {stats.success}/{totalItems} items uploaded successfully.
        </div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div style={{
          background: "#0d0d0d", border: "1px solid #222",
          borderRadius: 10, padding: 16, maxHeight: 380, overflowY: "auto",
          fontFamily: "monospace", fontSize: 13,
        }}>
          {logs.map((l, i) => (
            <div key={i} style={{
              color: l.type === "success" ? "#4caf50"
                : l.type === "error" ? "#f44336"
                : l.type === "warn" ? "#ff9800"
                : l.type === "section" ? "#f5a623"
                : l.type === "done" ? "#4caf50"
                : "#888",
              padding: "2px 0",
              fontWeight: l.type === "section" || l.type === "done" ? 700 : 400,
            }}>
              {l.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
