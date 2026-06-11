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

async function createCategory(name) {
  const res = await fetch(`${BASE}/categories`, {
    method: "POST", headers,
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (data.id) {
    console.log(`✅ Category: ${name} (${data.id})`);
    return data.id;
  } else {
    console.error(`❌ Category error [${name}]: ${JSON.stringify(data)}`);
    return null;
  }
}

async function createItem(item, categoryId) {
  let variants;
  if (item.variants) {
    variants = item.variants.map((v) => ({
      sku: `${item.name.replace(/ /g, "-").toUpperCase()}-${v.name.toUpperCase()}`,
      price: v.price, cost: 0,
      option1_name: "Size", option1_value: v.name,
    }));
  } else {
    variants = [{ sku: item.name.replace(/ /g, "-").toUpperCase(), price: item.price, cost: 0 }];
  }

  const res = await fetch(`${BASE}/items`, {
    method: "POST", headers,
    body: JSON.stringify({ item_name: item.name, category_id: categoryId, variants }),
  });
  const data = await res.json();
  if (data.id) {
    console.log(`  ✅ ${item.name}${item.variants ? ` (${item.variants.length} sizes)` : ` — ${item.price} RO`}`);
    return true;
  } else {
    console.error(`  ❌ ${item.name}: ${data.message || JSON.stringify(data)}`);
    return false;
  }
}

let success = 0, fail = 0;
console.log("🚀 Starting upload to Loyverse...\n");

for (const [catName, items] of Object.entries(MENU)) {
  console.log(`\n── ${catName} ──`);
  const catId = await createCategory(catName);
  await sleep(400);
  if (!catId) continue;
  for (const item of items) {
    const ok = await createItem(item, catId);
    ok ? success++ : fail++;
    await sleep(350);
  }
}

console.log(`\n🎉 Done! ${success} uploaded, ${fail} failed.`);
if (fail > 0) process.exit(1);
