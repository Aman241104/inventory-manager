# Fruit Inventory Management System - Status Report

## Fixed Bugs & Improvements

### 1. Data Consistency & Calculations
- **[FIXED]** `totalAmount` now correctly updates when a transaction's quantity or rate is edited.
- **[FIXED]** Standardized all date parsing to UTC Midnight for `YYYY-MM-DD` strings. This prevents transactions from shifting days due to timezone differences and ensures correct daily auto-clubbing.
- **[FIXED]** Batch Merging and Appending now use a proper **Weighted Average Rate** formula, ensuring your inventory valuation remains accurate.
- **[FIXED]** `remainingQty` desync in bulk transactions is resolved.

### 2. Concurrency & Reliability
- **[FIXED]** Implemented atomic `findOneAndUpdate` operations for stock decrements in `addSale` and `bulkAddTransactions`. This prevents race conditions where multiple simultaneous sales could result in incorrect stock levels.
- **[FIXED]** Dashboard now uses `force-dynamic` to ensure you always see the most up-to-date data without manual page refreshes.

### 3. UI & Experience
- **[NEW]** **Dynamic "In" and "Out" Columns**: Both the Root page and Detailed Report now show each individual appended transaction and sale in its own column for maximum transparency.
- **[NEW]** **Trash Bin**: You can now view and restore deleted lots, sales, products, vendors, and customers.
- **[NEW]** **Incoming History**: Tooltips on the dashboard and history sections in the ledger provide a full audit trail of how a batch was built (Original vs. Append vs. Merge).
- **[IMPROVED]** Dashboard table responsiveness: Large lots with many sales now scroll horizontally instead of breaking the layout.

## Current Status
- **Database**: Cleaned and verified.
- **Simulation**: A full-day operation simulation (Purchase -> Sale -> Auto-club -> Merge) passed with 100% data integrity.
- **Precision**: 0.0001 unit precision threshold implemented for status checks.
