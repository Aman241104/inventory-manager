# T-Ledger Implementation Plan

This document details the plan to implement the specific printing style found in `LEDGERS.pdf`.

## 1. UI Strategy: The "Ledger Card" Component

We will create a specialized React component `LedgerCard` designed specifically for the side-by-side view.

### 1.1 Layout Structure (Grid/Flex)
- **Top Row**: Header with `Product Name` (Left) and `Lot Number` (Right).
- **Middle Row (The "T")**:
    - **Left Column (40% width)**: Purchase Details.
        - Large font for "Original Quantity".
        - Vendor Name & Rate.
        - Space for "Remarks" (Manual input or Notes).
    - **Vertical Divider**: A 2px solid black line.
    - **Right Column (60% width)**: Sales List.
        - Individual quantities listed in a vertical stack.
        - If space permits, the Customer Name in smaller text.
- **Bottom Row**: Footer with "Balance Day End".

## 2. Printing Optimizations

### 2.1 CSS `@media print`
- **Global Reset**:
    - Hide `Sidebar`, `Filter Card`, and all `Buttons`.
    - Set `body` background to pure white.
    - Remove all shadows and rounded corners (better for ink).
- **Pagination**:
    - Use `break-inside: avoid` on the `LedgerCard` to ensure a batch is never split across two pages.
    - Add a `page-break-after: always` toggle for printing individual batches.

### 2.2 Typography
- Use a high-contrast serif or clean sans-serif font (Inter is fine, but maybe increase weight for print).
- Ensure "Balance" is in a large, bold font.

## 3. Interaction Design

### 3.1 "Print Mode" Toggle
- On the `Detailed Report` page, add a "Switch to Ledger View" toggle.
- This view will replace the interactive table with a sequence of `LedgerCard` components.
- The user can then click the "Print PDF" button which triggers `window.print()`.

### 3.2 Selective Printing
- Add checkboxes to each batch row in the table.
- Allow users to "Print Selected" to generate a PDF for only the batches they currently need to reconcile.

## 4. Technical Checklist

- [ ] Create `src/components/details/LedgerCard.tsx`.
- [ ] Add `balance` logic to the data structure (Purchased - sum(Sales)).
- [ ] Implement `@media print` overrides in `src/app/globals.css`.
- [ ] Update `src/app/details/page.tsx` to support the Ledger view.
- [ ] Add "Print Selection" state to the report viewer.

## 5. Visual Reference (Mockup)

```text
+-------------------------------------------------------+
| PRODUCT: MANGO (KESAR)             LOT: BATCH-01      |
+--------------------------+----------------------------+
| PURCHASE                 | SALES                      |
|                          |                            |
| 100 BOXES                | 10                         |
| NASHIK FARMS             | 5                          |
| @ 500 RS                 | 20                         |
|                          | 15                         |
| Remarks: _______________ |                            |
|                          |                            |
+--------------------------+----------------------------+
| BALANCE DAY END: 50      | TOTAL SOLD: 50             |
+--------------------------+----------------------------+
```
