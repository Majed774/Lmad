const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const axios     = require("axios");
const cors      = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// ─── CONFIG ───────────────────────────────────────────────────
const LOYVERSE_TOKEN  = "c7b5edba41014915bd32e0143ce1dd0c";
const LOYVERSE_BASE   = "https://api.loyverse.com/v1.0";
const LMAD_STORE_ID   = "d41322ee-6567-4d1b-8668-d341be71cba9";
const PAYMENT_CASH_ID = "f11bc21d-fd43-443b-9adf-2a9a5d2d81dc";
const CAFE_WHATSAPP   = "96898631511";

const loyverseHeaders = {
  Authorization: `Bearer ${LOYVERSE_TOKEN}`,
  "Content-Type": "application/json",
};

function generateOrderNumber() {
  return "WEB-" + Date.now().toString(36).toUpperCase();
}

// ─── MAIN API FUNCTION ────────────────────────────────────────
exports.api = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const path = req.path.replace(/^\/api/, "");

    try {
      // GET /menu/categories
      if (req.method === "GET" && path === "/menu/categories") {
        const r = await axios.get(`${LOYVERSE_BASE}/categories`, {
          headers: loyverseHeaders,
          params: { limit: 250 },
        });
        const cats = (r.data.categories || []).filter(c => !c.deleted_at);
        return res.json({ ok: true, data: cats });
      }

      // GET /menu/items
      if (req.method === "GET" && path === "/menu/items") {
        let allItems = [], cursor;
        do {
          const params = { limit: 250 };
          if (cursor) params.cursor = cursor;
          const r = await axios.get(`${LOYVERSE_BASE}/items`, {
            headers: loyverseHeaders, params,
          });
          allItems = [...allItems, ...(r.data.items || [])];
          cursor = r.data.cursor;
        } while (cursor);

        // Filter: available at Lmad store, not deleted, has category
        const filtered = allItems.filter(item => {
          if (item.deleted_at) return false;
          if (!item.category_id) return false;
          return item.variants.some(v =>
            v.stores.some(s => s.store_id === LMAD_STORE_ID && s.available_for_sale)
          );
        });
        return res.json({ ok: true, data: filtered });
      }

      // POST /orders/create
      if (req.method === "POST" && path === "/orders/create") {
        const { items, customerName, customerPhone, notes, orderType, tableNum, carDesc } = req.body;

        if (!items?.length || !customerName || !customerPhone) {
          return res.status(400).json({ ok: false, error: "Missing required fields" });
        }

        const orderNumber  = generateOrderNumber();
        const totalAmount  = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const orderNote    = orderType === "table"
          ? `طاولة ${tableNum} | ${customerName} | ${customerPhone}${notes ? " | " + notes : ""}`
          : `استلام بالسيارة: ${carDesc} | ${customerName} | ${customerPhone}${notes ? " | " + notes : ""}`;

        // 1. Save to Firestore
        const orderRef = await db.collection("orders").add({
          orderNumber,
          customerName,
          customerPhone,
          notes: orderNote,
          orderType,
          tableNum: tableNum || null,
          carDesc: carDesc || null,
          status: "new",
          printed: "no",
          totalAmount: parseFloat(totalAmount.toFixed(3)),
          items,
          loyverseReceiptId: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Create receipt in Loyverse (non-blocking)
        let loyverseReceiptNumber = orderNumber;
        try {
          const loyverseRes = await axios.post(`${LOYVERSE_BASE}/receipts`, {
            store_id: LMAD_STORE_ID,
            source: "Lmad Online Order",
            order: orderNumber,
            note: orderNote,
            line_items: items.map(i => ({
              variant_id: i.variantId,
              quantity: i.quantity,
              price: i.price,
            })),
            payments: [{ payment_type_id: PAYMENT_CASH_ID, money_amount: totalAmount }],
          }, { headers: loyverseHeaders });

          loyverseReceiptNumber = loyverseRes.data.receipt_number || orderNumber;

          // Update Firestore with Loyverse receipt ID
          await orderRef.update({ loyverseReceiptId: loyverseReceiptNumber });
        } catch (loyErr) {
          console.error("Loyverse receipt failed:", loyErr.message);
          // Continue — order is saved in Firestore
        }

        return res.json({
          ok: true,
          data: {
            orderId: orderRef.id,
            orderNumber,
            receiptNumber: loyverseReceiptNumber,
            totalAmount,
          },
        });
      }

      // GET /orders — for printer app (all orders)
      if (req.method === "GET" && path === "/orders") {
        const snap = await db.collection("orders")
          .orderBy("createdAt", "desc")
          .limit(100)
          .get();
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.json({ ok: true, data: orders });
      }

      // GET /orders/pending — unprinted orders
      if (req.method === "GET" && path === "/orders/pending") {
        const snap = await db.collection("orders")
          .where("printed", "==", "no")
          .orderBy("createdAt", "desc")
          .get();
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.json({ ok: true, data: orders });
      }

      // POST /orders/:id/printed
      if (req.method === "POST" && path.match(/^\/orders\/[^/]+\/printed$/)) {
        const orderId = path.split("/")[2];
        await db.collection("orders").doc(orderId).update({
          printed: "yes",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.json({ ok: true });
      }

      // POST /orders/:id/status
      if (req.method === "POST" && path.match(/^\/orders\/[^/]+\/status$/)) {
        const orderId = path.split("/")[2];
        const { status } = req.body;
        const validStatuses = ["new", "preparing", "ready", "completed", "cancelled"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ ok: false, error: "Invalid status" });
        }
        await db.collection("orders").doc(orderId).update({
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.json({ ok: true });
      }

      return res.status(404).json({ ok: false, error: "Not found" });

    } catch (err) {
      console.error("API error:", err.message);
      return res.status(500).json({ ok: false, error: err.message });
    }
  });
});
