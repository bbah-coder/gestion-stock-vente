/* TABLE CATGORIE*/
create table categories (
    id uuid primary key default gen_random_uuid(),
    shop_id uuid not null,
    name text not null,
    description text,
    created_at timestamp with time zone default now()
);

alter table categories
add constraint categories_shop_id_fkey
foreign key (shop_id)
references shops(id)
on delete cascade;

/*INDEX*/
create index idx_categories_shop_id
on categories(shop_id);

/*Politiques RLS*/

alter table categories enable row level security;

/*POLICY*/
create policy "Users can view categories"
on categories
for select
using (true);

create policy "Users can insert categories"
on categories
for insert
with check (true);

/* TABLE PRODUIT*/
create OR REPLACE table products (
    id uuid primary key default gen_random_uuid(),
    shop_id uuid,
    name text not null,
    price numeric(15,2) default 0,
    wholesale_price numeric(15,2) default 0,
    wholesale_min_qty integer default 0,
    stock integer default 0,
    barcode text,
    image_url text,
    category text,
    sold integer default 0,
    entries integer default 0,
    broken integer default 0,
    expired integer default 0,
    lost integer default 0,
    stolen integer default 0,
    don integer default 0,
    is_archived boolean default false,
    archived_at timestamptz,
    last_sale_at timestamptz,
    promo_percent numeric(5,2) default 0,
    created_by text,
    created_role text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table products add constraint products_shop_id_fkey
  foreign key (shop_id)
  references shops(id)
  on delete cascade;

/*INDEX*/
create index idx_products_shop_id
on products(shop_id);

create index idx_products_barcode
on products(barcode);

create index idx_products_category
on products(category);

/*Politiques RLS*/

alter table products enable row level security;

/**********POLICY******************************/
drop policy if exists "products_select_policy"
on products;
/* Afficher les policy */
select
    policyname,
    cmd
from pg_policies
where tablename = 'products';

/* Un uilisateur ne voit que les produits de son magasin*/
create policy "products_select_policy"
on products
for select
to authenticated
using (
    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )
);

/* Un utilisateur ne peut créer un produit que pour son magasin*/
/*****************INSERTION********************************/
create policy "products_insert_policy"
on products
for insert
to authenticated
with check (
    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )
);

/****MODIFICATION****************************/
create policy "products_update_policy"
on products
for update
to authenticated
using (
    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )
)
with check (
    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )
);

/*****Suppression****************************/

create policy "products_delete_policy"
on products
for delete
to authenticated
using (
    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )
);

/*TRIGGER automatique pour updated_at*/
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger update_products_updated_at
before update on products
for each row
execute function update_updated_at_column();

/**********TABLE MOUVEMENT de stock********************/
create table stock_movements (
    id uuid primary key default gen_random_uuid(),
    shop_id uuid not null references shops(id),
    product_name text not null,
    product_barcode text,
    type text not null,
    reason text not null,
    quantity integer not null,
    comment text,
    username text,
    role text,
    movement_date timestamptz,
    created_at timestamptz default now()
);
alter table stock_movements
add constraint fk_stock_movements_shop
foreign key (shop_id)
references shops(id)
on delete cascade;

/*********INDEX**********************/
create index idx_stock_movements_shop
on stock_movements(shop_id);

create index idx_stock_movements_product
on stock_movements(product_barcode);

create index idx_stock_movements_date
on stock_movements(created_at desc);

alter table stock_movements
enable row level security;

/**********POLICY SELECT****************/
create policy "Users can read stock movements"
on stock_movements
for select
using (
    shop_id in (
        select shop_id
        from profiles
        where id = auth.uid()
    )
);
/**********POLICY INSERT****************/
create policy "Users can insert stock movements"
on stock_movements
for insert
with check (
    shop_id in (
        select shop_id
        from profiles
        where id = auth.uid()
    )
);