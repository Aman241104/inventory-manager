# Design System – Inventory Management System

This document defines the visual language and user experience strategy for the Inventory Management System. The goal is to create a **Modern, Professional, and Trustworthy** B2B interface that feels "fresh" like the fruit it manages.

---

## 1. Design Philosophy

- **Data-First**: Information density should be high but organized. Users need to see stock status at a glance.
- **Fresh & Organic**: Use a professional base (slate/white) with vibrant, fruit-inspired accents (emerald, orange, rose).
- **Clarity of Status**: Use distinct visual markers for "OK", "Remaining", and "Extra Sold" to ensure zero ambiguity.
- **Glassmorphism Lite**: Use subtle card borders and backdrops to create depth without clutter.

---

## 2. Color Palette

### 2.1 Base Colors (Professional)
- **Background**: `#F8FAFC` (Slate 50) - Very light gray for a clean look.
- **Sidebar/Nav**: `#0F172A` (Slate 900) - Deep professional navy.
- **Card Background**: `#FFFFFF` (White).
- **Text Primary**: `#1E293B` (Slate 800).
- **Text Secondary**: `#64748B` (Slate 500).

### 2.2 Status & Accent Colors (Fruit Inspired)
- **OK / In Stock**: `#10B981` (Emerald 500) - Represents freshness/growth.
- **Extra Sold / Alert**: `#F43F5E` (Rose 500) - High contrast alert.
- **Remaining Stock**: `#F59E0B` (Amber 500) - Warning/Attention.
- **Primary Action**: `#6366F1` (Indigo 500) - Standard professional interactive color.

---

## 3. Typography

- **Font Family**: `Inter` (Sans-serif) for high readability in tables.
- **Heading 1**: 24px, Bold, Slate 800.
- **Body Text**: 14px, Regular, Slate 600.
- **Data/Table Text**: 13px, Medium, Slate 700.

---

## 4. Components & UI Patterns

### 4.1 Cards (Stat Cards)
- **Style**: White background, subtle shadow (`shadow-sm`), 12px border radius.
- **Border**: 1px solid Slate 200.
- **Visuals**: Icon on the left with a colored background circle (20% opacity of the status color).

### 4.2 Data Tables
- **Header**: Slate 50 background, uppercase text, 12px size.
- **Rows**: Hover effect (`hover:bg-slate-50`), zebra striping is optional.
- **Badges**: Rounded-full, low-opacity background with high-opacity text.
    - *OK*: Green background, green text.
    - *Extra Sold*: Red background, red text.

### 4.3 Forms
- **Inputs**: 8px border radius, Slate 200 border, blue focus ring.
- **Buttons**: Semi-bold text, 8px radius, primary color `#6366F1`.

---

## 5. Layout Structure

### 5.1 Sidebar Navigation
- **Fixed Sidebar**: Left side, 260px width.
- **Items**: Icon + Label. Active state uses a white highlight or a left-side indigo border.

### 5.2 Header
- **Breadcrumbs**: To show current location (e.g., Inventory > Sell Section).
- **User Profile**: Minimalist avatar on the right.

### 5.3 Responsive Behavior
- **Mobile**: Sidebar becomes a hamburger menu. Cards stack vertically.
- **Tables**: Horizontal scroll enabled for small screens.

---

## 6. Iconography

- **Library**: `Lucide React`.
- **Stroke Width**: 2px.
- **Size**: 18px for sidebar, 20px for stat cards.

---

## 7. Interaction Details

- **Loading States**: Subtle skeleton screens instead of spinners where possible.
- **Success Feedback**: Toast notifications (top-right) for successful entries.
- **Transitions**: 200ms ease-in-out for hover effects and page transitions.
