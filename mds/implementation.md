# Implementation Plan – Inventory Management System

This document outlines the detailed step-by-step implementation plan for the Inventory Management System, incorporating modern best practices for Next.js, MongoDB, and stock management.

---

## 1. Project Initialization & Infrastructure (COMPLETED)

- [x] Initialize Next.js 15+ (App Router, TypeScript).
- [x] Configure Tailwind CSS v3.
- [x] Set up MongoDB connection logic with Mongoose (`src/lib/mongodb.ts`).
- [x] Install core dependencies: `mongoose`, `recharts`, `lucide-react`, `clsx`, `tailwind-merge`.

---

## 2. Database Modeling (Phase 1)

Define Mongoose schemas in `src/models/` with appropriate validation and indexes.

### 2.1 Schema Definitions
- **Product**: Name (indexed), unitType, isActive, createdAt.
- **Vendor/Customer**: Name, contact, isActive.
- **Purchase**: productId (ref), vendorIds (ref array), vendorNames (array), lotName, quantity, rate, date, notes.
- **Sale**: productId (ref), customerId (ref), quantity, rate, date, notes.

**Best Practice**: Use `timestamps: true` for all schemas to track creation and updates.

---

## 3. Core API & Server Actions

We will use a hybrid approach: **Server Actions** for form submissions (Add/Edit) and **API Routes** for complex data fetching (Dashboard/Reports) if needed.

### 3.1 Services Layer
Create `src/services/` to encapsulate business logic:
- `productService.ts`: CRUD operations for products.
- `stockService.ts`: Logic to calculate real-time stock using MongoDB aggregations.
- `transactionService.ts`: Handling Buy/Sell entries with validation.

### 3.2 Inventory Logic Implementation
The "Stock Validation" must be performed server-side before any Sale is saved.
```typescript
// Logic Flow for Sale Entry
1. Get Total Purchase for Product X
2. Get Total Sale for Product X (excluding current entry if editing)
3. Available = Total Purchase - Total Sale
4. If Sale Qty > Available -> Tag as "Extra Sold"
```

---

## 4. UI Development (Component-Driven)

### 4.1 Layout & Navigation
- Create a sidebar/navigation for: Dashboard, Products, Vendors, Customers, Buy, Sell.
- Use a shared `Layout` component in `src/app/layout.tsx`.

### 4.2 Shared Components (`src/components/ui/`)
- `DataTable`: For displaying lists with search/filter.
- `StatCard`: For dashboard metrics.
- `FormInput` / `Select`: Reusable form elements.
- `Modal`: For quick entries.

### 4.3 Feature Modules
- **Dashboard**: Use `Recharts` for "Daily Sales" and "Daily Purchase" bar charts.
- **Forms**: Use `react-hook-form` and `zod` for robust client/server validation.

---

## 5. Feature Implementation Roadmap

### Step 1: Master Data Management
- Implement Product, Vendor, and Customer CRUDs.
- Add "Active/Inactive" toggle (Soft Delete logic).

### Step 2: Buy Module
- Form to select Product, Vendor, and enter details.
- List view of all purchases with filtering by date/product.

### Step 3: Sell Module & Validation
- Form to select Product, Customer.
- **Real-time check**: Fetch and display "Available Stock" when a product is selected.
- Logic to handle "Extra Sold" marking.

### Step 4: Dashboard & Summary
- Aggregated stats using MongoDB `$group` and `$sum`.
- Fruit-wise stock summary table with status labels (OK, Remaining, Extra Sold).

---

## 6. Testing & Validation

### 6.1 Unit Testing
- Test the stock calculation logic with various edge cases (Zero stock, Multiple vendors, Over-selling).

### 6.2 Integration Testing
- Verify that saving a "Buy" entry correctly reflects in the "Available Stock" in the "Sell" form.

---

## 7. Deployment Plan

- **Database**: MongoDB Atlas.
- **Hosting**: Vercel.
- **Environment Variables**: `MONGODB_URI` must be set in Vercel project settings.

---

## 8. Technical Conventions

- **Naming**: PascalCase for Components, camelCase for functions/variables.
- **Icons**: Use `lucide-react`.
- **Styling**: Tailwind CSS utility classes. Avoid inline styles.
- **Types**: Define interfaces in `src/types/` for all models and API responses.
