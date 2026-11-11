/**
 * Authoritative shared domain models and contracts across the Smag ecosystem
 * (smag, smag_business, smag_admin, and Cloud Functions).
 */

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "preparing"
  | "on_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "Cash on Delivery"
  | "Paystack";

export type MenuItemCustomization = {
  label: string;
  value: string;
  extraCost: number;
};

export type OrderItem = {
  menuItemId: string;
  name: string;
  basePrice?: number;
  price: number;
  imageUrl: string;
  quantity: number;
  customizations?: MenuItemCustomization[];
};

export type Order = {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount?: number;
  total: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod: PaymentMethod | string;
  paymentReference?: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
  assignedDriverUid?: string | null;
  driverName?: string;
  driverVehicle?: string;
  driverAvatarUrl?: string;
  driverLat?: number;
  driverLng?: number;
  restaurantLat?: number;
  restaurantLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type BusinessRole =
  | "driver"
  | "kitchen_staff"
  | "kitchen_owner"
  | "concierge"
  | "manager"
  | "unknown";

export type BusinessPermission =
  | "business_access"
  | "business_driver"
  | "business_orders"
  | "business_menu"
  | "business_support"
  | "business_team";

export type AdminRank = 0 | 1 | 2; // 2 = Owner/Admin, 1 = Sub-Admin, 0 = Operational
