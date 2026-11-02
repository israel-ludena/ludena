// Carga datos de ejemplo en dos restaurantes ficticios usando el API (el servidor debe estar corriendo).
// Uso: node scripts/seed-demo.mjs [http://localhost:4008]
// - "Restaurante Demo" (cuenta inicial de server/.env): platos de sierra y 4 mesas
// - "La Cevichería" (ana@cevicheria.ec / 123456): mariscos y 3 mesas
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = process.argv[2] || `http://localhost:${process.env.PORT || 4008}`;
const here = path.dirname(fileURLToPath(import.meta.url));

const call = async (method, url, { token, body, form } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(API + url, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
};

const login = async (email, password) =>
  (await call("POST", "/auth/login", { body: { email, password } })).data.accessToken;

// Imagen simple (SVG) con el nombre del plato, para no depender de fotos externas
const uploadPlaceholder = async (token, name, color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="${color}"/><text x="150" y="160" font-size="26" font-family="sans-serif" fill="white" text-anchor="middle">${name}</text></svg>`;
  const form = new FormData();
  form.append("file", new Blob([svg], { type: "image/svg+xml" }), `${name.replace(/\W+/g, "-")}.svg`);
  return (await call("POST", "/media/upload", { token, form })).data;
};

const seedRestaurant = async (token, dishes, tables) => {
  const existing = (await call("GET", "/dishes", { token })).data;
  if (existing.length) return console.log("  ya tiene platos, se omite");
  for (const [name, price, description, color] of dishes) {
    const image = await uploadPlaceholder(token, name, color);
    await call("POST", "/dishes", { token, body: { name, price, description, image, status: "Available" } });
  }
  for (const [number, capacity] of tables) {
    await call("POST", "/tables", { token, body: { number, capacity, status: "Available" } });
  }
  console.log(`  ${dishes.length} platos y ${tables.length} mesas`);
};

console.log("Restaurante Demo");
const demoToken = await login(process.env.INITIAL_EMAIL_OWNER, process.env.INITIAL_PASSWORD_OWNER);
await seedRestaurant(
  demoToken,
  [
    ["Hornado", 8.5, "Cerdo horneado con mote, llapingachos y agrio.", "#b45309"],
    ["Locro de papa", 4.25, "Con queso, aguacate y maíz tostado.", "#ca8a04"],
    ["Fritada", 7.75, "Con maduro, mote y curtido.", "#9a3412"],
    ["Humita", 1.8, "De choclo tierno, al vapor.", "#65a30d"],
    ["Morocho", 1.5, "Bebida caliente de maíz con canela.", "#a16207"],
  ],
  [
    [1, 4],
    [2, 4],
    [3, 2],
    [4, 6],
  ]
);

console.log("La Cevichería");
try {
  await call("POST", "/restaurants/register", {
    body: {
      restaurantName: "La Cevichería",
      slug: "la-cevicheria",
      ownerName: "Ana Vera",
      email: "ana@cevicheria.ec",
      password: "123456",
      address: "Malecón 2000, Guayaquil",
    },
  });
} catch (e) {
  if (!String(e).includes("422")) throw e; // ya existía
}
const cevToken = await login("ana@cevicheria.ec", "123456");
await seedRestaurant(
  cevToken,
  [
    ["Ceviche de camarón", 9.75, "Con chifles, canguil y limón.", "#0e7490"],
    ["Encebollado", 5.5, "Albacora, yuca y cebolla curtida.", "#0369a1"],
    ["Arroz con concha", 10.5, "Conchas prietas, arroz amarillo y patacones.", "#155e75"],
  ],
  [
    [1, 2],
    [2, 4],
    [3, 4],
  ]
);
console.log(`Listo. Cartas públicas: /es/r/demo y /es/r/la-cevicheria`);
void here;
