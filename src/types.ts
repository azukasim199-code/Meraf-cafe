export type UserRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CafeTable {
  id: string;
  tableNumber: string;
  token: string;
  isActive: boolean;
  qrCodeUrl?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAm: string;
  displayOrder: number;
  isHidden: boolean;
  createdAt: string;
}

export interface ProductVariation {
  id: string;
  productId: string;
  nameEn: string;
  nameAm: string;
  priceEtb: number;
}

export interface AddOn {
  id: string;
  nameEn: string;
  nameAm: string;
  priceEtb: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAm: string;
  priceEtb: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  prepTimeMins: number;
  variations?: ProductVariation[];
  addOnIds?: string[];
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'ONLINE_CHAPA' | 'ONLINE_TELEBIRR';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type OrderStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItemAddOn {
  id: string;
  addOnId: string;
  nameEn: string;
  nameAm: string;
  priceEtb: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productNameEn: string;
  productNameAm: string;
  variationNameEn?: string;
  variationNameAm?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addOns: OrderItemAddOn[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  tableNumber: string;
  trackingToken: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  transactionRef: string;
  amount: number;
  currency: string;
  status: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  roleTarget: 'ALL' | 'STAFF' | 'ADMIN';
  titleEn: string;
  titleAm: string;
  messageEn: string;
  messageAm: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface CafeSettings {
  cafeName: string;
  logoUrl: string;
  phone: string;
  address: string;
  openingHoursEn: string;
  openingHoursAm: string;
  currency: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  isClosed: boolean;
  closedReasonEn: string;
  closedReasonAm: string;
  chapaSecretKey?: string;
  chapaWebhookSecret?: string;
  telebirrMerchantCode?: string;
}

export interface CartItem {
  id: string; // unique cart entry id
  product: Product;
  selectedVariation?: ProductVariation;
  selectedAddOns: AddOn[];
  quantity: number;
  specialInstructions?: string;
  calculatedPrice: number;
}

export type Language = 'en' | 'am';
