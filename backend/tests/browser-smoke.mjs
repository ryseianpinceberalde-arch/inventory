// Optional UI smoke test against an isolated Chrome DevTools session.
// Usage: node backend/tests/browser-smoke.mjs http://127.0.0.1:5173 http://127.0.0.1:9333
// All API calls are intercepted with in-memory fixtures; no user/database data is changed.
import assert from "node:assert/strict";
const origin = process.argv[2];
const debug = process.argv[3];
if (!origin || !debug) throw new Error("Pass the frontend origin and an isolated Chrome debugging origin.");
const target = await (await fetch(`${debug}/json/new?about:blank`, { method: "PUT" })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const failures = [];
const requests = [];
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
}
const permissions = ["dashboard.view", "products.view", "products.create", "products.update", "products.archive", "products.restore", "products.view_cost", "categories.view", "suppliers.view", "inventory.view", "inventory.stock_in", "inventory.stock_out", "inventory.adjustment_create", "inventory.adjustment_approve", "inventory.movement_view", "pos.access", "sales.create", "sales.hold", "sales.resume", "sales.view_all", "payments.process", "payments.view", "notifications.view", "notifications.manage", "roles.view", "roles.create", "roles.update", "roles.delete", "roles.assign_permissions", "reports.daily", "reports.export"];
const user = { id: "user-test", fullName: "Review User", email: "review@example.invalid", role: { id: "role-test", name: "ADMIN" }, permissions };
const products = Array.from({ length: 125 }, (_, i) => ({ id: `product-${i}`, name: `Review product ${i + 1}`, sku: `SKU-${i}`, barcode: `48000000${i}`, currentStock: i + 1, reorderLevel: 10, unit: "pcs", status: "ACTIVE", costPrice: "10", sellingPrice: "20", category: { name: "Review category" } }));
let failProducts = false;
socket.addEventListener("message", async (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const call = pending.get(message.id); pending.delete(message.id);
    if (message.error) call?.reject(new Error(message.error.message)); else call?.resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") failures.push(message.params.exceptionDetails.text + ": " + message.params.exceptionDetails.exception?.description);
  if (message.method !== "Fetch.requestPaused") return;
  const { requestId, request } = message.params;
  const url = new URL(request.url);
  requests.push(url.pathname + url.search);
  let data = [], meta = {}, status = 200;
  if (url.pathname.endsWith("/auth/refresh")) data = { accessToken: "browser-test-token", user };
  else if (url.pathname.endsWith("/auth/me")) data = user;
  else if (url.pathname.endsWith("/products")) {
    if (failProducts) status = 500;
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const rows = products.filter((row) => row.name.toLowerCase().includes(search));
    const page = Number(url.searchParams.get("page") ?? 1), limit = Number(url.searchParams.get("limit") ?? 20);
    data = rows.slice((page - 1) * limit, page * limit); meta = { total: rows.length, totalPages: Math.ceil(rows.length / limit), page, limit };
  } else if (url.pathname.endsWith("/dashboard")) data = { summary: { todaySales: 0, totalProducts: 125, lowStockProducts: 10 }, charts: { dailySales: [], salesByCategory: [] }, tables: { recentTransactions: [], bestSellingProducts: [], lowStockProducts: [] } };
  else if (url.pathname.endsWith("/roles")) data = [{ id: "role-test", name: "ADMIN", isSystem: true, rolePermissions: [], _count: { users: 1 } }];
  else if (url.pathname.endsWith("/permissions/grouped")) data = {};
  else if (url.pathname.endsWith("/suppliers")) data = [{ id: "supplier-test", name: "Review supplier", status: "ACTIVE" }];
  else if (url.pathname.endsWith("/reports/daily-sales")) data = { report: "daily-sales", title: "Daily Sales", period: "2026-10-05", summary: [], columns: [{ key: "invoice", label: "Invoice" }], rows: [], sections: [] };
  await send("Fetch.fulfillRequest", { requestId, responseCode: status, responseHeaders: [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: origin }, { name: "Access-Control-Allow-Credentials", value: "true" }, { name: "Access-Control-Allow-Headers", value: "authorization,content-type,x-retried" }, { name: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" }], body: Buffer.from(JSON.stringify({ success: status === 200, data, meta, message: status === 200 ? "OK" : "Test failure" })).toString("base64") });
});
await send("Runtime.enable");
await send("Page.enable");
await send("Fetch.enable", { patterns: [{ urlPattern: "*://*/api/*", requestStage: "Request" }] });
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 100)); }
  throw new Error(`Timed out waiting for ${expression}`);
}
async function navigate(path) {
  await send("Page.navigate", { url: origin + path });
  await waitFor('Boolean(document.querySelector("#main-content"))');
  await new Promise((resolve) => setTimeout(resolve, 400));
}
try {
  for (const width of [390, 768, 1440]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const path of ["/dashboard", "/products", "/inventory/stock-in", "/pos", "/reports/daily-sales", "/roles", "/notifications"]) {
      await navigate(path);
      const dimensions = await evaluate('({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })');
      assert.ok(dimensions.scroll <= dimensions.width + 1, `${path} overflows at ${width}px: ${JSON.stringify(dimensions)}`);
    }
  }
  await navigate("/products");
  await waitFor('document.body.innerText.includes("125 records")');
  await evaluate('[...document.querySelectorAll("button")].find(b => b.getAttribute("aria-label") === "Next page").click()');
  await waitFor('document.body.innerText.includes("Showing 11-20 of 125")');
  assert.ok(requests.some((url) => url.includes("page=2") && url.includes("limit=10")));
  await navigate("/roles");
  await evaluate('[...document.querySelectorAll("button")].find(b => b.textContent === "New").click()');
  await waitFor(`document.querySelector('input[placeholder="Role name"]')?.value === ""`);
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await evaluate(`document.querySelector('button[aria-label="Open navigation"]').click()`);
  await waitFor(`document.querySelector('button[aria-label="Open navigation"]').getAttribute("aria-expanded") === "true"`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await waitFor(`document.querySelector('button[aria-label="Open navigation"]').getAttribute("aria-expanded") === "false"`);
  failProducts = true;
  await navigate("/products");
  await waitFor('document.body.innerText.includes("Unable to load this information")');
  assert.deepEqual(failures, []);
  console.log("PASS: 21 responsive page checks, server pagination, New role, drawer Escape, API error recovery; no uncaught browser errors.");
} catch (error) { console.error("BROWSER ERRORS", failures); console.error("PAGE", await evaluate("document.body.innerText")); throw error; } finally {
  await send("Page.close").catch(() => {});
  socket.close();
}
