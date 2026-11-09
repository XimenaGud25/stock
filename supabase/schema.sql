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
  status         text not null default 'nuevo',
  total          numeric(12, 2) not null,
  created_at     timestamptz not null default now()
);

-- Columnas agregadas después (se pueden volver a correr sin problema)
alter table public.orders add column if not exists channel        text not null default 'en_linea';
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists tracking_token uuid not null default gen_random_uuid();
create unique index if not exists orders_tracking_token_idx on public.orders (tracking_token);
create index if not exists orders_created_idx on public.orders (created_at);

-- Estados: nuevo → confirmado → preparando → listo (para recoger / en camino) → entregado, o cancelado
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('nuevo', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'));
alter table public.orders drop constraint if exists orders_channel_check;
alter table public.orders add constraint orders_channel_check check (channel in ('en_linea', 'tienda'));
-- Forma de pago. En la tienda web el cliente elige 'en_linea' (tarjeta en la página) o
-- 'en_sucursal' (solo si recoge); al cobrar en sucursal se cambia por la forma real
-- ('efectivo' o 'tarjeta'). 'transferencia' queda para pedidos viejos y ventas de mostrador.
alter table public.orders drop constraint if exists orders_payment_check;
alter table public.orders add constraint orders_payment_check
  check (payment_method is null or payment_method in ('efectivo', 'tarjeta', 'transferencia', 'en_sucursal', 'en_linea'));
-- Referencia del cobro en línea (ej. "PRUEBA-8K2J4Q · Visa •••• 4242")
alter table public.orders add column if not exists payment_ref text;

-- Estado del pago: pendiente → por_confirmar (el cliente avisó que ya pagó) → pagado
alter table public.orders add column if not exists payment_status text not null default 'pendiente';
alter table public.orders add column if not exists paid_at        timestamptz;
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pendiente', 'por_confirmar', 'pagado'));
-- Pedidos que ya existían: los entregados y las ventas de mostrador se dan por pagados
update public.orders set payment_status = 'pagado', paid_at = coalesce(paid_at, created_at)
where payment_status <> 'pagado' and (status = 'entregado' or channel = 'tienda');

-- Historial de cada pedido: lo que ve el cliente en su página de seguimiento
create table if not exists public.order_events (
  id         bigint generated always as identity primary key,
  order_id   bigint not null references public.orders (id) on delete cascade,
  status     text not null,
  note       text,
  -- 'tienda' = lo hizo el personal, 'cliente' = lo hizo el cliente
  actor      text not null default 'tienda',
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);
-- 'estado' = cambio de estado del pedido · 'pago' = movimiento del pago
alter table public.order_events add column if not exists kind text not null default 'estado';
-- Hora exacta de cada renglón (aunque varios se guarden en la misma operación)
alter table public.order_events alter column created_at set default clock_timestamp();

-- Pedidos que ya existían: se les crea su primer renglón de historial
insert into public.order_events (order_id, status, created_at)
select o.id, o.status, o.created_at from public.orders o
where not exists (select 1 from public.order_events e where e.order_id = o.id);

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

-- Correos que se le mandan al cliente (recibido, pago confirmado, preparando, enviado…).
-- status: 'enviado' = salió de verdad · 'simulado' = modo de prueba (sin RESEND_API_KEY) · 'error'
create table if not exists public.order_emails (
  id         bigint generated always as identity primary key,
  order_id   bigint not null references public.orders (id) on delete cascade,
  to_email   text not null,
  subject    text not null,
  html       text not null,
  status     text not null check (status in ('enviado', 'simulado', 'error')),
  error      text,
  created_at timestamptz not null default now()
);
create index if not exists order_emails_order_idx on public.order_emails (order_id, created_at);

-- ------------------------------ Permisos ------------------------------
-- El público solo puede LEER categorías, productos activos y la oferta del día.
-- Todo lo demás (crear, editar, pedidos) lo hace el servidor con la llave secreta.
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.order_events   enable row level security;
alter table public.order_emails   enable row level security;

drop policy if exists "leer categorias" on public.categories;
create policy "leer categorias" on public.categories for select using (true);

drop policy if exists "leer productos activos" on public.products;
create policy "leer productos activos" on public.products for select using (active);

drop policy if exists "leer configuracion" on public.store_settings;
create policy "leer configuracion" on public.store_settings for select using (true);

-- --------------------- Crear pedido (descuenta stock) ------------------
-- Recibe [{ "product_id": "...", "quantity": 2 }, ...]. Usa los precios de la base
-- (no los del navegador) y falla si algún producto no tiene existencias suficientes.
-- p_channel = 'en_linea' (pedido de la tienda web: p_payment = 'en_linea' o 'en_sucursal')
-- o 'tienda' (venta en mostrador: queda entregada y pagada en el momento).
-- Pago 'en_linea': el cobro ya pasó en la página; queda "por confirmar" hasta que la tienda lo confirme.
drop function if exists public.create_order(text, text, text, text, text, text, text, jsonb);
drop function if exists public.create_order(text, text, text, text, text, text, text, jsonb, text, text);
create or replace function public.create_order(
  p_customer_name text, p_phone text, p_email text, p_delivery text,
  p_branch_id text, p_address text, p_notes text, p_items jsonb,
  p_channel text default 'en_linea', p_payment text default null, p_payment_ref text default null
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_order_id bigint;
  v_item     jsonb;
  v_product  public.products;
  v_qty      int;
  v_total    numeric := 0;
  v_status   text := case when p_channel = 'tienda' then 'entregado' else 'nuevo' end;
  v_paid     boolean := p_channel = 'tienda';
  v_pay_st   text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;
  if p_channel = 'en_linea' then
    if coalesce(p_payment, '') not in ('en_linea', 'en_sucursal') then
      raise exception 'Elige una forma de pago';
    end if;
    if p_payment = 'en_sucursal' and p_delivery = 'envio' then
      raise exception 'Para envío a domicilio el pago es en línea';
    end if;
  end if;
  v_pay_st := case when v_paid then 'pagado' when p_payment = 'en_linea' then 'por_confirmar' else 'pendiente' end;

  insert into orders (customer_name, phone, email, delivery, branch_id, address, notes, total, status, channel,
                      payment_method, payment_status, paid_at, payment_ref)
  values (p_customer_name, p_phone, p_email, p_delivery, p_branch_id, p_address, p_notes, 0, v_status, p_channel,
          p_payment, v_pay_st, case when v_paid then now() end, p_payment_ref)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida';
    end if;
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
  insert into order_events (order_id, status, note)
    values (v_order_id, v_status, case when p_channel = 'tienda' then 'Venta en mostrador' end);
  if p_payment = 'en_linea' and not v_paid then
    insert into order_events (order_id, status, note, actor, kind)
      values (v_order_id, v_status, 'Pago en línea recibido' || coalesce(' · ' || p_payment_ref, ''), 'cliente', 'pago');
  end if;
  return v_order_id;
end $$;

-- Cambiar estado de un pedido (y dejarlo en el historial con una nota opcional).
-- Si se cancela, regresa las piezas al stock; si se reactiva un cancelado, las vuelve a descontar.
-- Con el mismo estado y una nota, solo agrega la nota al historial (ej. número de guía).
drop function if exists public.set_order_status(bigint, text);
create or replace function public.set_order_status(
  p_order_id bigint, p_status text, p_note text default null, p_actor text default 'tienda'
) returns void
language plpgsql security definer set search_path = public as $$
declare v_old text; v_order orders;
begin
  select * into v_order from orders where id = p_order_id for update;
  v_old := v_order.status;
  if v_old is null then raise exception 'Pedido no encontrado'; end if;
  if v_old = p_status and coalesce(trim(p_note), '') = '' then return; end if;

  -- Regla de pago (pedidos en línea): lo pagado en línea o por transferencia no se prepara
  -- hasta confirmar el pago; y nada se entrega sin pago registrado.
  if v_old <> p_status and v_order.channel = 'en_linea' and v_order.payment_status <> 'pagado' then
    if p_status = 'entregado' then
      raise exception 'Registra el pago antes de marcar el pedido como entregado';
    end if;
    if p_status in ('preparando', 'listo') and v_order.payment_method in ('transferencia', 'en_linea') then
      raise exception 'Confirma el pago antes de preparar este pedido';
    end if;
  end if;

  if v_old <> p_status then
    if p_status = 'cancelado' then
      update products p set stock = p.stock + oi.quantity
        from order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
    elsif v_old = 'cancelado' then
      update products p set stock = greatest(p.stock - oi.quantity, 0)
        from order_items oi where oi.order_id = p_order_id and oi.product_id = p.id;
    end if;
    update orders set status = p_status where id = p_order_id;
  end if;

  insert into order_events (order_id, status, note, actor)
    values (p_order_id, p_status, nullif(trim(p_note), ''), p_actor);
end $$;

-- El cliente cancela desde su página de seguimiento. Solo se permite antes de que
-- la tienda empiece a preparar el pedido.
create or replace function public.customer_cancel_order(p_token uuid, p_reason text)
returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_status text; v_payment text;
begin
  select id, status, payment_status into v_id, v_status, v_payment from orders where tracking_token = p_token for update;
  if v_id is null then raise exception 'Pedido no encontrado'; end if;
  if v_status = 'cancelado' then return v_id; end if;
  if v_payment = 'pagado' then
    raise exception 'Tu pago ya fue registrado. Escríbenos por WhatsApp para cancelar y reembolsarte.';
  end if;
  if v_status not in ('nuevo', 'confirmado') then
    raise exception 'Tu pedido ya se está preparando. Escríbenos por WhatsApp para cancelarlo.';
  end if;
  perform set_order_status(v_id, 'cancelado',
    'Cancelado por el cliente' || coalesce(': ' || nullif(trim(p_reason), ''), ''), 'cliente');
  return v_id;
end $$;

-- Registrar el pago (lo usa el panel). p_status: 'pendiente', 'por_confirmar' o 'pagado'.
-- p_method opcional: la forma real con la que se cobró.
create or replace function public.set_payment(
  p_order_id bigint, p_status text, p_method text default null, p_actor text default 'tienda'
) returns void
language plpgsql security definer set search_path = public as $$
declare v_order orders; v_method text; v_note text;
begin
  select * into v_order from orders where id = p_order_id for update;
  if v_order.id is null then raise exception 'Pedido no encontrado'; end if;
  if p_status not in ('pendiente', 'por_confirmar', 'pagado') then raise exception 'Estado de pago inválido'; end if;
  if v_order.status = 'cancelado' and p_status <> 'pendiente' then
    raise exception 'El pedido está cancelado';
  end if;
  if v_order.payment_status = p_status and coalesce(p_method, v_order.payment_method) is not distinct from v_order.payment_method then
    return;
  end if;

  v_method := coalesce(p_method, v_order.payment_method);
  update orders set payment_status = p_status, payment_method = v_method,
                    paid_at = case when p_status = 'pagado' then now() end
  where id = p_order_id;

  v_note := case p_status
    when 'pagado' then 'Pago recibido · ' || case v_method
        when 'transferencia' then 'Transferencia' when 'efectivo' then 'Efectivo'
        when 'tarjeta' then 'Tarjeta' when 'en_linea' then 'Pago en línea' else 'En sucursal' end
    when 'por_confirmar' then 'El cliente avisó que ya pagó'
    else 'Pago marcado como pendiente' end;
  insert into order_events (order_id, status, note, actor, kind)
    values (p_order_id, v_order.status, v_note, p_actor, 'pago');
end $$;

-- El cliente avisa desde su seguimiento que ya hizo la transferencia.
create or replace function public.customer_report_payment(p_token uuid)
returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_status text; v_payment text;
begin
  select id, status, payment_status into v_id, v_status, v_payment from orders where tracking_token = p_token for update;
  if v_id is null then raise exception 'Pedido no encontrado'; end if;
  if v_status = 'cancelado' then raise exception 'Este pedido está cancelado'; end if;
  if v_payment = 'pendiente' then
    perform set_payment(v_id, 'por_confirmar', null, 'cliente');
  end if;
  return v_id;
end $$;

revoke execute on function public.set_payment(bigint, text, text, text) from public, anon, authenticated;
revoke execute on function public.customer_report_payment(uuid) from public, anon, authenticated;
revoke execute on function public.create_order(text, text, text, text, text, text, text, jsonb, text, text, text) from public, anon, authenticated;
revoke execute on function public.set_order_status(bigint, text, text, text) from public, anon, authenticated;
revoke execute on function public.customer_cancel_order(uuid, text) from public, anon, authenticated;

-- ------------------------------- Fotos --------------------------------
-- Carpeta pública "productos" donde el panel sube las imágenes.
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;
