-- =====================================================================
--  Stock Herramienta Pro · Base de datos en Supabase
--  Cópialo completo en Supabase → SQL Editor → New query → Run.
--  Se puede volver a correr sin perder datos.
-- =====================================================================

-- ----------------------------- Categorías -----------------------------
create table if not exists public.categories (
  id    text primary key,
  slug  text not null unique,
  name  text not null,
  icon  text not null,
  sort  int  not null default 0
);

insert into public.categories (id, slug, name, icon, sort) values
  ('c1', 'generadores',             'Generadores de luz',      'generator', 1),
  ('c2', 'rotomartillos',           'Rotomartillos',           'drill',     2),
  ('c3', 'desbrozadoras',           'Desbrozadoras',           'trimmer',   3),
  ('c4', 'kits-inalambricos',       'Kits inalámbricos',       'battery',   4),
  ('c5', 'hidrolavadoras',          'Hidrolavadoras',          'washer',    5),
  ('c6', 'demoledores-de-concreto', 'Demoledores de concreto', 'hammer',    6),
  ('c7', 'motosierras',             'Motosierras',             'chainsaw',  7)
on conflict (id) do nothing;

-- ------------------------------ Productos -----------------------------
create table if not exists public.products (
  id                  text primary key default gen_random_uuid()::text,
  slug                text not null unique,
  sku                 text not null default '',
  name                text not null,
  brand               text not null,
  highlight           text not null default '',
  category_id         text not null references public.categories (id),
  price               numeric(12, 2) not null check (price >= 0),
  compare_at_price    numeric(12, 2) check (compare_at_price >= 0),
  rating              numeric(2, 1) not null default 5,
  review_count        int  not null default 0,
  stock               int  not null default 0 check (stock >= 0),
  -- Cuando el stock llega a este número (o menos) aparece en "Poco stock"
  low_stock_threshold int  not null default 3,
  badge               text,
  featured            boolean not null default false,
  active              boolean not null default true,
  description         text not null default '',
  includes            text[] not null default '{}',
  specs               jsonb  not null default '[]',
  images              text[] not null default '{}',
  created_at          timestamptz not null default now(),
  -- Calculados automáticamente (para filtrar y ordenar ofertas)
  on_sale      boolean generated always as (compare_at_price is not null and compare_at_price > price) stored,
  discount_pct int generated always as (
    case when compare_at_price is not null and compare_at_price > price
         then round((1 - price / compare_at_price) * 100)::int else 0 end
  ) stored
);

create index if not exists products_category_idx on public.products (category_id);

-- --------------------------- Configuración ----------------------------
-- Una sola fila: qué producto es la "Oferta del día" y cuándo termina.
create table if not exists public.store_settings (
  id              int primary key default 1 check (id = 1),
  deal_product_id text references public.products (id) on delete set null,
  deal_ends_at    timestamptz
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- ------------------------------- Pedidos ------------------------------
create table if not exists public.orders (
  id             bigint generated always as identity primary key,
  customer_name  text not null,
  phone          text not null,
  email          text,
  delivery       text not null check (delivery in ('recoger', 'envio')),
  branch_id      text,
  address        text,
  notes          text,
  status         text not null default 'nuevo'
                 check (status in ('nuevo', 'confirmado', 'entregado', 'cancelado')),
  total          numeric(12, 2) not null,
  created_at     timestamptz not null default now()
);

create table if not exists public.order_items (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references public.orders (id) on delete cascade,
  product_id  text references public.products (id) on delete set null,
  name        text not null,
  brand       text not null,
  price       numeric(12, 2) not null,
  quantity    int not null check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ------------------------------ Permisos ------------------------------
-- El público solo puede LEER categorías, productos activos y la oferta del día.
-- Todo lo demás (crear, editar, pedidos) lo hace el servidor con la llave secreta.
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

drop policy if exists "leer categorias" on public.categories;
create policy "leer categorias" on public.categories for select using (true);

drop policy if exists "leer productos activos" on public.products;
create policy "leer productos activos" on public.products for select using (active);

drop policy if exists "leer configuracion" on public.store_settings;
create policy "leer configuracion" on public.store_settings for select using (true);

-- --------------------- Crear pedido (descuenta stock) ------------------
-- Recibe [{ "product_id": "...", "quantity": 2 }, ...]. Usa los precios de la base
-- (no los del navegador) y falla si algún producto no tiene existencias suficientes.
create or replace function public.create_order(
  p_customer_name text, p_phone text, p_email text, p_delivery text,
  p_branch_id text, p_address text, p_notes text, p_items jsonb
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_order_id bigint;
  v_item     jsonb;
  v_product  public.products;
  v_qty      int;
  v_total    numeric := 0;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  insert into orders (customer_name, phone, email, delivery, branch_id, address, notes, total)
  values (p_customer_name, p_phone, p_email, p_delivery, p_branch_id, p_address, p_notes, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    select * into v_product from products
      where id = v_item ->> 'product_id' and active for update;
    if not found then
      raise exception 'Un producto del carrito ya no está disponible';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Solo quedan % de "%"', v_product.stock, v_product.name;
    end if;

    update products set stock = stock - v_qty where id = v_product.id;
    insert into order_items (order_id, product_id, name, brand, price, quantity)
      values (v_order_id, v_product.id, v_product.name, v_product.brand, v_product.price, v_qty);
    v_total := v_total + v_product.price * v_qty;
  end loop;

  update orders set total = v_total where id = v_order_id;
  return v_order_id;
end $$;

-- Cambiar estado de un pedido. Si se cancela, regresa las piezas al stock;
-- si se reactiva un cancelado, las vuelve a descontar.
create or replace function public.set_order_status(p_order_id bigint, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_old text;
begin
  select status into v_old from orders where id = p_order_id for update;
  if v_old is null then raise exception 'Pedido no encontrado'; end if;
  if v_old = p_status then return; end if;

  if p_status = 'cancelado' then
    update products p set stock = p.stock + oi.quantity
      from order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
  elsif v_old = 'cancelado' then
    update products p set stock = greatest(p.stock - oi.quantity, 0)
      from order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
  end if;

  update orders set status = p_status where id = p_order_id;
end $$;

revoke execute on function public.create_order(text, text, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.set_order_status(bigint, text) from public, anon, authenticated;

-- ------------------------------- Fotos --------------------------------
-- Carpeta pública "productos" donde el panel sube las imágenes.
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;
