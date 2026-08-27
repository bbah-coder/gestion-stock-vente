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

create index idx_products_updated_at
on products(updated_at);

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


create trigger update_stock_movements_updated_at
before update on stock_movements
for each row
execute function update_updated_at_column();

create trigger update_profiles_updated_at
before update on profiles
for each row
execute function update_updated_at_column();

create trigger update_shops_updated_at
before update on shops
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
    created_at timestamptz default now(),
    updated_at timestamptz default now()
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

create index idx_stock_movements_updated_at
on products(updated_at);

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

/**********POLICY DELETE****************/
create policy "stock_movements_delete_policy"
on stock_movements
for delete
to authenticated
using (
    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )
);

/**************Les ventes**************************/
-- Entête vente
create table sales (
    id uuid primary key default gen_random_uuid(),
    shop_id uuid not null references shops(id),
    sale_number text,
    total_brut numeric(12,2) default 0,
    total_remise numeric(12,2) default 0,
    total_net numeric(12,2) default 0,
    total_items integer default 0,
    client_phone text,
    payment_method text,
    user_name text,
    user_role text,
    items jsonb,
    payment jsonb
    status text default 'paid',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table sales
add column items jsonb;

alter table sales
add column payment jsonb;

ALTER TABLE sales
ADD CONSTRAINT fk_sales_shop
FOREIGN KEY (shop_id)
REFERENCES shops(id)
ON DELETE CASCADE;

-- Détail vente
create table sale_items (
    id uuid primary key default gen_random_uuid(),
    sale_id uuid not null references sales(id) on delete cascade,
    product_id uuid references products(id),
    product_name text not null,
    barcode text,
    quantity integer not null,
    unit_price numeric(12,2),
    wholesale_price numeric(12,2),
    applied_price numeric(12,2),
    discount numeric(12,2) default 0,
    total numeric(12,2) default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
ALTER TABLE sale_items
ADD COLUMN shop_id UUID;
--sales
ALTER TABLE sale_items
ADD CONSTRAINT fk_sale_items_sale
FOREIGN KEY (sale_id)
REFERENCES sales(id)
ON DELETE CASCADE;
--products
ALTER TABLE sale_items
ADD CONSTRAINT fk_sale_items_product
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE RESTRICT;
--Shop
ALTER TABLE sale_items
ADD CONSTRAINT fk_sale_items_shop
FOREIGN KEY (shop_id)
REFERENCES shops(id)
ON DELETE CASCADE;

--customer_credits
ALTER TABLE customer_credits
ADD CONSTRAINT fk_customer_credits_sale
FOREIGN KEY (sale_id)
REFERENCES sales(id)
ON DELETE CASCADE;


--les indexes

create index idx_sales_shop
on sales(shop_id);

create index idx_sales_date
on sales(created_at);

create index idx_sale_items_sale
on sale_items(sale_id);

create index idx_sale_items_product
on sale_items(product_id);

CREATE INDEX idx_sale_items_shop_id
ON sale_items(shop_id);


--Trigger
create trigger trg_sales_updated_at
before update on sales
for each row
execute function update_updated_at_column();

--Activer RLS
alter table sales
enable row level security;

alter table sale_items
enable row level security;

*******Policy SELECT**********
create policy "sales_select_by_shop"
on sales
for select
using (

    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )

);
**********Policy INSERT**********
create policy "sales_insert_by_shop"
on sales
for insert
with check (

    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )

);
**********Policy UPDATE**********
create policy "sales_update_by_shop"
on sales
for update
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
***********Policy DELETE*********
create policy "sales_delete_by_shop"
on sales
for delete
using (

    shop_id = (
        select shop_id
        from profiles
        where id = auth.uid()
    )

);
**********Policy sale_items SELECT************
create policy "sale_items_select_by_shop"
on sale_items
for select
using (
    exists (
        select 1
        from sales s
        where s.id = sale_items.sale_id
        and s.shop_id = (
            select shop_id
            from profiles
            where id = auth.uid()
        )

    )

);
************Policy INSERT****************
create policy "sale_items_insert_by_shop"
on sale_items
for insert
with check (

    exists (

        select 1
        from sales s
        where s.id = sale_items.sale_id
        and s.shop_id = (
            select shop_id
            from profiles
            where id = auth.uid()
        )

    )

);
*******Policy UPDATE**********
create policy "sale_items_update_by_shop"
on sale_items
for update
using (

    exists (

        select 1
        from sales s
        where s.id = sale_items.sale_id
        and s.shop_id = (
            select shop_id
            from profiles
            where id = auth.uid()
        )

    )

);

*********Policy DELETE*************
create policy "sale_items_delete_by_shop"
on sale_items
for delete
using (

    exists (

        select 1
        from sales s
        where s.id = sale_items.sale_id
        and s.shop_id = (
            select shop_id
            from profiles
            where id = auth.uid()
        )

    )

);