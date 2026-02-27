# Database Documentation – Inventory Management System

This document outlines the MongoDB architecture, schema relationships, and the core inventory calculation logic.

---

## 1. Schema Architecture

We use a relational-style approach within MongoDB to maintain data integrity for transactional records.

### 1.1 Core Collections

#### **Products** (`products`)
Stores the master list of fruits.
- `name`: String (Required, Indexed)
- `unitType`: String (Box, Kg, Lot)
- `isActive`: Boolean (Default: true)
- *Index*: `{ name: 1 }` for fast searching.

#### **Vendors / Customers** (`vendors`, `customers`)
Master lists for entities.
- `name`: String
- `contact`: String
- `isActive`: Boolean

#### **Purchases** (`purchases`)
Transactional records of incoming stock.
- `productId`: ObjectId (Ref: Product)
- `vendorIds`: Array of ObjectId (Ref: Vendor)
- `vendorNames`: Array of String
- `lotName`: String
- `quantity`: Number
- `rate`: Number
- `date`: Date
- *Logic*: Direct addition to stock. Batches on the same day for the same product are clubbed.

#### **Sales** (`sales`)
Transactional records of outgoing stock.
- `productId`: ObjectId (Ref: Product)
- `customerId`: ObjectId (Ref: Customer)
- `quantity`: Number
- `rate`: Number
- `date`: Date
- `isExtraSold`: Boolean (Computed during save)

---

## 2. Core Inventory Logic (Aggregation)

The system calculates stock status in real-time using MongoDB Aggregation Pipelines or the `stockService`.

### 2.1 The Stock Formula
`Available Stock = Σ(Purchases.quantity) - Σ(Sales.quantity)`

### 2.2 Status Categories
1. **OK**: `Σ(Sales) == Σ(Purchases)`
2. **Remaining**: `Σ(Sales) < Σ(Purchases)` (Calculation: `Purchases - Sales`)
3. **Extra Sold**: `Σ(Sales) > Σ(Purchases)` (Calculation: `Sales - Purchases`)

---

## 3. Data Integrity Strategy

### 3.1 Pre-Sale Validation
Before a `Sale` record is created, the system performs a `lookup` on the `Purchases` and `Sales` collections for that specific `productId` to determine the `isExtraSold` flag. This ensures the "Mismatch Alerts" on the dashboard are always accurate.

### 3.2 Soft Deletes
Entities (Products, Vendors, Customers) are never permanently removed if they have associated transactions. Instead, `isActive: false` is used to hide them from selection menus while preserving historical reporting.

---

## 4. Performance Optimization

- **Indexing**: Compound indexes on `productId` and `date` in transactional collections to speed up dashboard charts and stock lookups.
- **Caching**: Next.js `revalidatePath` is used after every mutation to clear the data cache and ensure the UI reflects the latest database state.
