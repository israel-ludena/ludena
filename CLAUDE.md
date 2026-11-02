# Protocolo de trabajo — proyecto Ludeña (menú digital para Ecuador)

Este archivo define cómo trabaja Claude en este repositorio. Las reglas de "no tocar sin permiso" son obligatorias.

## Contexto

- Producto: menú digital por QR/NFC por mesa, pedidos desde la mesa, panel del restaurante, 3D/AR, adaptado a Ecuador (SRI, Payphone, WhatsApp) e integrado con GoHighLevel (GHL).
- Base: fork de QRMeal (MIT, © 2025 BaoGiaDuong), commit `6c2c0cff95633f8b28734484148a5eb2c4a94350`. Ver `NOTICE.md`.
- Stack: monorepo pnpm + turbo. `client/` Next.js 16 + React 19; `server/` Fastify 5 + Prisma 5 (SQLite por ahora) + Socket.IO.
- Dueño del producto: Israel Ludeña. Idioma de trabajo: español.

## Forma de trabajo

1. Auditar primero, luego reestructurar, luego automatizar.
2. Un cambio = una rama + un Pull Request. Nunca commits directos a `main` salvo la importación inicial.
3. Cada PR explica qué cambió, cómo se probó y qué queda pendiente.
4. Commits con Conventional Commits (`feat:`, `fix:`, `chore:`…), ya configurado con commitlint.

## NO hacer sin permiso explícito del dueño (en el chat)

- Hacer push a `main`, hacer merge de PRs o borrar ramas.
- Activar o modificar workflows de despliegue (`.github/workflows-desactivados/`), o agregar secretos.
- Cambiar el esquema de base de datos de forma destructiva (borrar columnas/tablas, migraciones que pierden datos).
- Conectar servicios reales: Supabase, Vercel, Payphone, SRI (ambiente de producción), GHL, dominios.
- Usar o pedir credenciales reales (firma electrónica .p12, tokens de GHL, llaves de Payphone). Solo valores de prueba.
- Emitir comprobantes en el ambiente de **producción** del SRI. Solo ambiente de pruebas.
- Agregar dependencias con licencia GPL/AGPL o sin licencia.
- Copiar código, textos, diseño o modelos 3D de Menuly u otro producto comercial.
- Borrar el aviso de licencia MIT de QRMeal.

## Siempre

- Mantener `LICENSE` y `NOTICE.md`.
- Nunca subir `.env`, bases de datos ni archivos de clientes.
- Textos de la interfaz en español (Ecuador) como idioma principal.
- Zona horaria por defecto: `America/Guayaquil`. Moneda: USD.
- Datos personales de comensales: mínimo necesario, con consentimiento para marketing (LOPDP).
