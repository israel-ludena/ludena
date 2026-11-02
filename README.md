# Ludeña — Menú digital para restaurantes en Ecuador

Menú por QR/NFC en cada mesa, pedidos desde la mesa y panel para el restaurante, adaptado a Ecuador e integrado con GoHighLevel.

> Nombre de trabajo. La marca definitiva se elegirá tras la búsqueda fonética en el SENADI.

## Estado

Base importada de [QRMeal](https://github.com/baoduong254/qrmeal) (MIT). Ver `NOTICE.md` y `ROADMAP.md`.

Lo que ya trae la base:

- Pedidos por QR por mesa, en tiempo real (Socket.IO)
- Roles: dueño, empleado, comensal
- Gestión de platos, mesas y pedidos; tablero con ventas
- Subida de imágenes

## Estructura

```
client/   Next.js 16 + React 19 (menú del comensal y panel)
server/   Fastify 5 + Prisma 5 + Socket.IO (API)
```

## Correr en local

Requisitos: Node.js 24.11.1 y pnpm 10.26.1.

```bash
pnpm install
cp server/.env.example server/.env   # cambiar los secretos
cp client/.env.example client/.env
cd server
pnpm db:generate     # genera el cliente de Prisma
pnpm db:push         # crea las tablas en server/dev.db
cd ..
pnpm dev             # API en :4008, web en :4007
# en otra terminal, con el API corriendo:
cd server && pnpm seed:demo   # datos de ejemplo: /es/r/demo y /es/r/la-cevicheria
```

Cuentas de ejemplo: `admin@order.com` / `123456` (Restaurante Demo) y `ana@cevicheria.ec` / `123456` (La Cevichería).

## Cómo funciona multi-restaurante

- Cada restaurante se registra en `/es/register` y obtiene su carta pública en `/es/r/{slug}`.
- Todos los datos (platos, mesas, pedidos, clientes, personal) llevan `restaurantId`. El servidor toma el restaurante de la sesión del usuario y nunca de lo que envía el navegador.
- El QR de cada mesa lleva un token único que identifica restaurante y mesa.
- Los avisos en tiempo real (pedidos, pagos) se envían solo al personal del mismo restaurante.

El README original de QRMeal, con todos los scripts, está en `README.qrmeal-original.md`.

## Reglas de trabajo

Ver `CLAUDE.md`.
