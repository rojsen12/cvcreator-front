export interface Ticket {
  id: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
  responses: TicketResponse[];
  attachments?: string[];
}

export interface TicketResponse {
  id: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: 'user' | 'admin';
  createdAt: Date;
}

export type TicketCategory = 'technical' | 'billing' | 'account' | 'feature' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

