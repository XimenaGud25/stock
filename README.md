# Stock Herramienta Pro — Tienda + Panel (Next.js + Supabase)

## Pantallas

**Tienda**

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio (hero, beneficios, categorías, destacados, mayoreo) |
| `/catalogo` | Catálogo con filtros, orden, búsqueda y paginación |
| `/producto/[slug]` | Detalle: galería, descripción, qué incluye, carrito |
| `/ofertas` | Ofertas: contador, oferta del día y productos con % de descuento |
| `/sucursales` | Sucursales con mapa, horario y contacto |
| `/checkout` | Datos del cliente y entrega → guarda el pedido y abre WhatsApp |

**Panel de administrador** (`/admin`, requiere iniciar sesión)

| Ruta | Para qué sirve |
| --- | --- |
| `/admin` | Resumen: productos, piezas en stock, pedidos nuevos y alertas de poco stock |
| `/admin/productos` | Lista con búsqueda y filtros (poco stock, agotados, ocultos); cambiar stock al momento |
| `/admin/productos/nuevo` y `/admin/productos/[id]` | Crear/editar: categoría, precio, stock, fotos, especificaciones, visible/oculto |
| `/admin/pedidos` | Pedidos por estado; al cancelar uno, las piezas regresan al stock |
| `/admin/ofertas` | Oferta del día y precios de oferta (con atajos de -10/-15/-20 %) |

Stack: **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Storage + Auth)**.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin Supabase configurado, la tienda funciona con los datos de ejemplo de `src/lib/data/` y el panel muestra las instrucciones de configuración.

## Conectar Supabase (una sola vez)

1. Crea una cuenta y un proyecto en [supabase.com](https://supabase.com) (plan gratis). Región recomendada: la más cercana a México (p. ej. `us-east`).
2. **SQL Editor → New query**: pega todo `supabase/schema.sql` y dale **Run**. Crea las tablas, permisos, las funciones de pedidos y la carpeta de fotos.
3. **Project Settings → API**: copia `.env.example` como `.env.local` y llena:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → llave `anon` / `public`
   - `SUPABASE_SERVICE_ROLE_KEY` → llave `service_role` (**secreta**: nunca la compartas)
   - `ADMIN_EMAILS` → correo(s) del administrador, separados por coma
4. **Authentication → Users → Add user**: crea el usuario con ese mismo correo y una contraseña. (Recomendado: en **Authentication → Sign In / Providers** desactiva "Allow new users to sign up".)
5. Reinicia `npm run dev`, entra a http://localhost:3000/admin e inicia sesión.
6. En el Resumen aparece **"Importar los 29 productos"**: carga el catálogo de ejemplo para empezar a ajustar precios, stock y fotos.

## Cómo funciona

- `src/lib/api.ts` es el único lugar donde la tienda pide datos (Supabase si está configurado, si no, datos de ejemplo).
- `src/lib/admin-data.ts` y `src/app/admin/actions.ts` son las lecturas y cambios del panel. Todos comprueban que haya sesión de administrador.
- Los pedidos se crean con la función `create_order` de la base: usa los precios guardados (no los del navegador), descuenta stock y falla si no alcanzan las piezas.
- Las fotos se suben a Supabase Storage (carpeta `productos`). La primera foto es la principal.
- Al guardar cualquier cambio en el panel, la tienda se actualiza al momento.

## Estructura

```
src/
├─ app/
│  ├─ (tienda)/              ← Páginas de la tienda (con header, footer y carrito)
│  │  └─ checkout/           ← Formulario de pedido + acción que lo guarda
│  ├─ admin/
│  │  ├─ login/              ← Inicio de sesión
│  │  ├─ (panel)/            ← Resumen, productos, pedidos, ofertas
│  │  └─ actions.ts          ← Guardar producto, subir fotos, stock, pedidos, ofertas
│  └─ layout.tsx             ← Fuentes y <html>
├─ components/
│  ├─ admin/                 ← Formularios y tablas del panel
│  └─ …                      ← Componentes de la tienda
├─ lib/
│  ├─ api.ts                 ← Datos de la tienda
│  ├─ admin-data.ts          ← Datos del panel
│  ├─ auth.ts                ← Quién es administrador
│  ├─ db.ts                  ← Conversión filas ↔ tipos
│  ├─ supabase/              ← Clientes de Supabase
│  └─ data/                  ← Datos de ejemplo
supabase/schema.sql          ← Base de datos completa
```

## Pendientes

- Las **sucursales** (direcciones, teléfonos, WhatsApp, horarios) siguen en `src/lib/data/branches.ts` y son de ejemplo. El WhatsApp de cada sucursal es a donde llegan los pedidos.
- Precios, SKUs y especificaciones del catálogo de ejemplo son aproximados: ajústalos desde el panel.
- Formulario de mayoreo ("Cotizar lote").
