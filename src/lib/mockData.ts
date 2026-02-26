export const MOCK_PRODUCTS = [
  { _id: 'p1', name: 'Kiwi', unitType: 'Box', isActive: true, createdAt: new Date() },
  { _id: 'p2', name: 'Mango (Alphonso)', unitType: 'Box', isActive: true, createdAt: new Date() },
  { _id: 'p3', name: 'Grapes', unitType: 'Kg', isActive: true, createdAt: new Date() },
  { _id: 'p4', name: 'Apple (Royal Gala)', unitType: 'Box', isActive: true, createdAt: new Date() },
];

export const MOCK_VENDORS = [
  { _id: 'v1', name: 'DDF Fresh Fruits', contact: '+91 9876543210', isActive: true },
  { _id: 'v2', name: 'Global Importers', contact: 'imports@global.com', isActive: true },
];

export const MOCK_CUSTOMERS = [
  { _id: 'c1', name: 'Retailer A', contact: '9988776655', isActive: true },
  { _id: 'c2', name: 'Market Wholesale', contact: '011-223344', isActive: true },
];

export const MOCK_PURCHASES = [
  { 
    _id: 'buy1', 
    productId: MOCK_PRODUCTS[0], 
    vendorId: MOCK_VENDORS[0], 
    quantity: 10, 
    rate: 800, 
    date: new Date(), 
    notes: 'Premium quality' 
  },
  { 
    _id: 'buy2', 
    productId: MOCK_PRODUCTS[1], 
    vendorId: MOCK_VENDORS[1], 
    quantity: 20, 
    rate: 1200, 
    date: new Date(Date.now() - 86400000), 
    notes: 'Bulk order' 
  },
];

export const MOCK_SALES = [
  { 
    _id: 'sell1', 
    productId: MOCK_PRODUCTS[0], 
    customerId: MOCK_CUSTOMERS[0], 
    quantity: 4, 
    rate: 950, 
    date: new Date(), 
    isExtraSold: false 
  },
  { 
    _id: 'sell2', 
    productId: MOCK_PRODUCTS[1], 
    customerId: MOCK_CUSTOMERS[1], 
    quantity: 25, 
    rate: 1500, 
    date: new Date(), 
    isExtraSold: true 
  },
];
