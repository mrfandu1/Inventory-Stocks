export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Profile {
  id: string;
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unit_price?: number;
  cost_price?: number;
  reorder_level?: number;
  categories: string[];
  subtypes: string[];
  subtype_quantities?: { [subtype: string]: number }; // New field for individual subtype quantities
  subtype_prices?: { [subtype: string]: number }; // New field for individual subtype prices
  is_multi_category: boolean;
  user_id: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  payment_method?: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  subtype?: string; // Which subtype was sold (for multi-category items)
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  session: any;
}