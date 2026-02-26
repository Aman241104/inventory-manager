# Inventory Management System – Project Plan

## 1. Project Overview

Build a web-based Inventory Management System for a fruit trading business.

The system must allow:
- Tracking of purchases (Buy Section)
- Tracking of sales (Sell Section)
- Product management
- Real-time stock validation
- Summary dashboard

The core business rule:
Purchased Quantity must match Sold Quantity.
If Sold > Purchased → show Extra Sold.
If Sold < Purchased → show Remaining Stock.

No gross profit, net profit, or margin calculation required.

---

## 2. Tech Stack

Frontend:
- Next.js (App Router)
- Tailwind CSS
- Minimal animations (optional)
- Chart library (Recharts or Chart.js)

Backend:
- Next.js API routes or Server Actions
- MongoDB (Mongoose ORM)

Authentication:
- Basic login system (JWT or session-based)

Deployment:
- Vercel (Frontend + API)
- MongoDB Atlas

---

## 3. Core Modules

### 3.1 Dashboard

Display:
- Total Purchase Today
- Total Sales Today
- Total Current Stock (Fruit-wise)
- Mismatch Alerts
    - Extra Sold Items
    - Remaining Stock Items
- Simple charts:
    - Daily Sales
    - Daily Purchase

---

### 3.2 Product Section

Purpose:
Manage master list of products (fruits).

Fields:
- Product Name
- Unit Type (Box, Kg, Lot)
- Status (Active/Inactive)

Features:
- Add Product
- Edit Product
- Delete (Soft Delete)
- View All Products

---

### 3.3 Vendor Section

Fields:
- Vendor Name
- Contact Info
- Status

---

### 3.4 Customer Section

Fields:
- Customer Name
- Contact Info
- Status

---

### 3.5 Buy Section (Purchase Entry)

Fields:
- Product (dropdown)
- Vendor (dropdown)
- Quantity
- Rate
- Date
- Notes (optional)

Logic:
- Multiple vendors for same product allowed.
- Total purchase quantity for product = sum of all purchase entries.
- Vendors must be clubbed when calculating stock.

---

### 3.6 Sell Section (Sales Entry)

Fields:
- Product (dropdown)
- Customer (dropdown)
- Quantity
- Rate
- Date
- Notes

Before saving:
System must validate:

Available Stock = Total Purchase - Total Sale

IF New Sale Qty > Available Stock:
    Allow save but mark as "Extra Sold"

---

## 4. Core Inventory Logic

For each Product:

total_purchase_qty = sum(all purchase entries)
total_sale_qty = sum(all sale entries)

IF total_sale_qty == total_purchase_qty:
    status = "OK"

IF total_sale_qty < total_purchase_qty:
    remaining_qty = total_purchase_qty - total_sale_qty

IF total_sale_qty > total_purchase_qty:
    extra_sold_qty = total_sale_qty - total_purchase_qty

---

## 5. Display Format (Important)

For each product:

### Case 1 – Sale == Purchase

FRUIT: Kiwi

PURCHASE:
6 qty purchased (DDF)

SALE:
Customer A → 6 qty @825

STATUS:
OK

---

### Case 2 – Sale Less

FRUIT: Kiwi

PURCHASE:
6 qty purchased (DDF)

SALE:
Customer A → 5 qty @825

REMAINING:
1 qty

---

### Case 3 – Sale More

FRUIT: Kiwi

PURCHASE:
6 qty purchased (DDF)

EXTRA SOLD:
1 qty

SALE:
Customer Z → 7 qty @835

---

## 6. Database Schema (MongoDB)

### Product
- _id
- name
- unitType
- isActive
- createdAt

### Vendor
- _id
- name
- contact
- isActive

### Customer
- _id
- name
- contact
- isActive

### Purchase
- _id
- productId
- vendorId
- quantity
- rate
- date
- notes

### Sale
- _id
- productId
- customerId
- quantity
- rate
- date
- notes

---

## 7. API Endpoints

POST /api/products
GET /api/products

POST /api/vendors
GET /api/vendors

POST /api/customers
GET /api/customers

POST /api/purchase
GET /api/purchase

POST /api/sale
GET /api/sale

GET /api/dashboard-summary

---

## 8. Non-Functional Requirements

- Clean UI (no heavy animations)
- Fast load time
- Mobile responsive
- Basic error handling
- Input validation
- Soft delete instead of permanent delete
- Basic role: Admin only (Phase 1)

---

## 9. Phase 2 (Optional Future)

- Role-based access
- Edit history log
- Stock locking
- Export to Excel
- Print reports
- Audit tracking

---

## 10. Final Goal

System must:

- Accurately track product stock.
- Automatically detect mismatch between purchase and sale.
- Provide clear visual display of remaining or extra sold quantity.
- Be simple and reliable for daily business use.