# Inventory Management System – Project Plan (Revised)

## 1. Project Overview

Build a web-based Inventory Management System for a fruit trading business, focused on **Batch (Lot) Tracking** and **T-Ledger Printing**.

The system must allow:
- Tracking of purchases (Incoming Batches)
- Tracking of sales (Outgoing per Batch)
- Product, Vendor, and Customer management
- Real-time stock validation per batch
- **Custom T-Ledger PDF Printing** (as per `LEDGERS.pdf`)

The core business rule:
Purchased Quantity per Lot must match Sold Quantity.
- Balance > 0 -> Remaining Stock (Units in Hand)
- Balance < 0 -> Shortage (Extra Sold)

---

## 2. Tech Stack

Frontend:
- Next.js (App Router)
- Tailwind CSS
- Lucide React (Icons)

Backend:
- Next.js Server Actions
- MongoDB (Mongoose ORM)

---

## 3. Core Modules & Features

### 3.1 Unified Transaction Center
- **Buy Mode**: Record incoming fruit batches. Auto-merge same-day batches for the same lot name.
- **Sell Mode**: Link sales to specific batches. Real-time "Stock Pulse" visual.
- **Quick-Add**: Add Products, Vendors, or Customers on-the-go within the transaction form.

### 3.2 Dashboard (The Pulse)
- Summary cards for Active Batches, Units in Hand, and Shortages.
- Inventory Ledger table showing sales progress and batch age.

### 3.3 Detailed Ledger & Printing
- **Drill-down**: Expand any batch to see full sale history.
- **T-Ledger Printing**: Export batches in a side-by-side Purchase/Sale format matching the physical ledger book style.
- **Filters**: Filter by Date Range, Product, or Vendor before printing.

---

## 4. Custom Ledger Layout (Ref: LEDGERS.pdf)

For each Batch/Lot printed:

| Left Side (PURCHASE) | Right Side (SALE) |
| :--- | :--- |
| **ITEM NAME** (e.g. APPLE) | Individual Sale Entries |
| Lot Number / Batch Name | Sale 1 Qty |
| Qty Purchased | Sale 2 Qty |
| Vendor Name | ... |
| Purchase Rate | |
| | |
| **BALANCE DAY END** | **TOTAL SOLD** |

---

## 5. Non-Functional Requirements

- **Print Fidelity**: Print view must be optimized for A4 paper, hiding UI elements like buttons and sidebars.
- **Data Integrity**: Soft-delete logic for all records to maintain history.
- **Speed**: Optimized MongoDB aggregations for real-time balance calculation.

---

## 6. Implementation Roadmap

1.  **Phase 1**: Core CRUD & Database Setup (Completed)
2.  **Phase 2**: Lot Logic & Stock Pulse (Completed)
3.  **Phase 3**: Unified Transaction Hub & Quick-Add (Completed)
4.  **Phase 4**: **T-Ledger Print Optimization** (Next Step)
    -   Create dedicated CSS `@media print` styles.
    -   Design the T-Ledger layout component.
    -   Implement "Print All" and "Print Selected" features.
