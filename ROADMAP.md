# Hoja de ruta

Cada punto se hace en su propia rama y Pull Request.

## Fase 0 — Base (hecho)

- [x] Auditoría de repositorios: QRMeal (MIT) elegido; OrderWorder descartado (sin licencia); TastyIgniter descartado (PHP, un restaurante por instalación)
- [x] Importación de QRMeal con aviso de licencia
- [x] Protocolo de trabajo (`CLAUDE.md`)

## Fase 1 — Adaptar a Ecuador

- [x] Español (Ecuador) como idioma principal (`client/messages/es.json`) y textos del servidor en español
- [x] Zona horaria `America/Guayaquil`, moneda USD, formato de precios `es-EC`
- [ ] Datos iniciales de ejemplo con un restaurante ecuatoriano ficticio

## Fase 2 — Multi-restaurante (SaaS)

- [ ] Modelo `Restaurant` y `restaurantId` en platos, mesas, pedidos y cuentas
- [ ] URL por local: `/r/{slug}/mesa/{n}`
- [ ] Registro de nuevo restaurante y aislamiento de datos
- [ ] Migrar de SQLite a PostgreSQL (Supabase u otro)

## Fase 3 — Facturación electrónica SRI

- [ ] Datos fiscales del restaurante: RUC, razón social, establecimiento, punto de emisión, obligado a contabilidad
- [ ] Datos del comprador al cobrar: consumidor final o cédula/RUC + correo
- [ ] Generar XML de factura, firmar con .p12, enviar y autorizar en el SRI (ambiente de pruebas)
- [ ] RIDE en PDF y envío por correo/WhatsApp
- [ ] Cola de reintentos y estado de cada comprobante

## Fase 4 — GoHighLevel

- [ ] Webhook saliente configurable por restaurante (pedido, reserva, reseña, factura)
- [ ] Mapeo a contacto GHL: nombre, teléfono, correo, etiquetas por local y por plato
- [ ] Consentimiento de marketing del comensal
- [ ] Más adelante: app del Marketplace de GHL con OAuth y API v2

## Fase 5 — Diferenciales

- [ ] 3D/AR por plato con `model-viewer` (GLB + USDZ)
- [ ] Generador de QR por mesa con logo e impresión; programación de NFC
- [ ] Pagos con Payphone
- [ ] Reservas, caja con arqueo, gastos
- [ ] Asistente con IA
