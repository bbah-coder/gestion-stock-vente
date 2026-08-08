select
    name,
    category,
    stock,
    shop_id
from products;

alter table products
add column sold integer default 0;

alter table products
add column entries integer default 0;

alter table products
add column broken integer default 0;

alter table products
add column expired integer default 0;

alter table products
add column lost integer default 0;

alter table products
add column stolen integer default 0;

alter table products
add column don integer default 0;