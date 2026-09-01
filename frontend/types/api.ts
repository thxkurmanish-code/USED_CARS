export interface HealthResponse {
  status: "ok";
  service: string;
}

export interface User {
  id: string;
  email: string;
  role: "customer" | "admin";
  is_active: boolean;
  is_email_verified: boolean;
}

export interface CarImage {
  id: string;
  storage_key: string;
  original_filename: string;
  content_type: string;
  byte_size: number;
  sort_order: number;
  is_primary: boolean;
}

export interface ListingSummary {
  id: string;
  owner_id?: string;
  brand: string;

  model: string;
  variant?: string | null;
  manufacturing_year: number;
  price: string | number;
  kilometers_driven: number;
  fuel_type: string;
  transmission: string;
  body_type: string;
  city: string;
  state: string;
  seller_type: string;
  status: "draft" | "pending_review" | "approved" | "active" | "rejected" | "suspended" | "sold" | "expired";
  is_featured: boolean;
  is_verified: boolean;
  created_at: string;
  images: CarImage[];
}

export interface ListingDetail extends ListingSummary {
  registration_year?: number | null;
  color?: string | null;
  owner_count: number;
  description: string;
  features: string[];
  rejection_reason?: string | null;
  updated_at: string;
}

export interface ListingPage {
  items: ListingSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface Enquiry {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  status: string;
  created_at: string;
  responded_at?: string | null;
}

export interface TestDriveResponse {
  id: string;
  listing_id: string;
  customer_id: string;
  preferred_date: string;
  preferred_time: string;
  contact_phone: string;
  message?: string | null;
  status: "pending" | "approved" | "rejected" | "rescheduled" | "completed" | "cancelled";
  admin_notes?: string | null;
  rescheduled_date?: string | null;
  rescheduled_time?: string | null;
  created_at: string;
  listing?: ListingSummary | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationResponse {
  id: string;
  listing_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  listing?: ListingSummary | null;
  last_message?: ChatMessage | null;
  unread_count?: number;
}

export interface BusinessContact {
  business_name: string;
  phone_number: string;
  whatsapp_number: string;
  email: string;
  address: string;
  city: string;
  state: string;
  business_hours: string;
  google_maps_link?: string | null;
}
