// Shared enums — mirror of docs/types-enums.md
export type UserRole = 'CLIENT' | 'HANDYMAN' | 'ADMIN';

export type JobStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type WarrantyStatus = 'ACTIVE' | 'CLAIMED' | 'EXPIRED';
export type ClaimStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PriceEstimate {
  laborCost: number;
  materialCost: number;
  transportCost: number;
  total: number;
  currency: string;
}

export interface Handyman {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
}

export interface Job {
  jobId: string;
  status: JobStatus;
  category: { id: string; name: string };
  description: string | null;
  locationAddress: string;
  locationLat: number;
  locationLng: number;
  quotedPrice: number;
  finalPrice: number | null;
  laborCost: number;
  materialCost: number;
  transportCost: number;
  eta: string | null;
  handyman: Handyman | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole | 'AI';
  content: string;
  isAI: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  basePrice: number;
  estimatedDuration: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}
