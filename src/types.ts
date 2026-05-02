export interface LocalizedString {
  en: string;
  ar: string;
}

export interface ProductVariant {
  id: string;
  name: LocalizedString;
  price: number;
  stock: number;
  attributes: { [key: string]: string }; // e.g., { Size: 'L', Color: 'Red' }
}

export interface Tag {
  id: string;
  title: LocalizedString;
  icon: string;
  bannerImage: string;
  isPublic: boolean;
  isPromoted: boolean;
  discountType: 'product' | 'delivery' | 'none';
  discountValue: number;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  discount?: number; // Percentage discount
  categories: string[]; // Array of category IDs
  tags: string[]; // Array of tag IDs
  image: string;
  stock: number;
  storeId?: string; // ID of the store that added this product
  status: 'draft' | 'review' | 'published' | 'rejected';
  adminMessage?: string;
  hasVariants: boolean;
  variants?: ProductVariant[];
  rating?: number;
  deliveryTime?: number; // in minutes
  locals: {
    name: LocalizedString;
    description: LocalizedString;
  };
  createdAt?: any;
}

export interface Category {
  id: string;
  parentId: string | null;
  isFeatured: boolean;
  icon: string;
  slug: string;
  bannerImageUrl: string;
  title: string;
  description: string;
  locals: {
    title: LocalizedString;
    description: LocalizedString;
  };
  createdAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface AddressDetails {
  regionId?: string;
  streetName?: string;
  buildingNumber?: string;
  floorNumber?: string;
  apartmentNumber?: string;
  additionalInstructions?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface Order {
  id: string;
  userId: string | null;
  guestContact?: {
    name: string;
    phone: string;
  };
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'shipped' | 'delivered';
  deliveryStatus?: 'pending' | 'assigned' | 'picked_up' | 'delivered';
  paymentMethod: 'online' | 'cod';
  driverId?: string; // ID of the assigned driver
  storeId?: string; // ID of the store (if applicable)
  paymentId?: string;
  createdAt: any;
  customerInfo: {
    name: string;
    email: string;
    address: string;
    addressMode?: 'normal' | 'map';
    addressDetails?: AddressDetails;
    destinationCoords?: {
      lat: number;
      lng: number;
    };
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'customer' | 'store' | 'driver'; // Keep for legacy compatibility
  roles: ('admin' | 'customer' | 'store' | 'driver')[];
  address?: string;
  addressMode?: 'normal' | 'map';
  addressDetails?: AddressDetails;
  defaultLocation?: { lat: number, lng: number };
  isVerified?: boolean;
  isBanned?: boolean;
  language?: 'en' | 'ar';
  createdAt?: any;
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  location: string;
  logoUrl?: string;
  bannerUrl?: string;
  isVerified: boolean;
  status: 'online' | 'offline';
  isDefault?: boolean;
  adminMessage?: string;
  locals: {
    name: LocalizedString;
    description: LocalizedString;
  };
  createdAt: any;
}

export interface Driver {
  id: string;
  userId: string;
  vehicleInfo: string;
  isVerified: boolean;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: any;
  };
  locals?: {
    name: LocalizedString;
  };
  createdAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: LocalizedString;
  body: LocalizedString;
  type: 'order_update' | 'promotion' | 'system';
  read: boolean;
  createdAt: any;
  metadata?: {
    orderId?: string;
    productId?: string;
  };
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: any;
}

export interface Region {
  id: string;
  name: string;
  type: 'geozone' | 'rectangle';
  coordinates: { lat: number; lng: number }[]; // For geozone (polygon) or rectangle (bounds)
  createdAt: any;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  priceMatrix: {
    [sourceRegionId: string]: {
      [destinationRegionId: string]: number;
    };
  };
  isDefault: boolean;
  isPublished: boolean;
  categories: string[]; // Array of category IDs
  requiresCoords?: boolean;
  createdAt: any;
}

export interface AppSettings {
  paymentMethods: {
    online: { enabled: boolean; preTransaction: boolean };
    cod: { enabled: boolean; preTransaction: boolean };
  };
  whatsappOrders?: {
    enabled: boolean;
    phoneNumber: string; // The admin's WhatsApp number to redirect to
  };
  features?: {
    marketplace: boolean;
    drivers: boolean;
    guestCheckout?: boolean;
  };
  restrictDeliveryToRegions: boolean;
  supportedAddressModes: ('normal' | 'map')[];
  appName?: LocalizedString;
  appDescription?: LocalizedString;
  logoUrl?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    whatsapp?: string;
    snapchat?: string;
    tiktok?: string;
  };
  currency?: {
    code: string; // e.g., 'AED', 'USD'
    symbol: LocalizedString; // e.g., { en: 'AED', ar: 'د.إ' }
  };
}
