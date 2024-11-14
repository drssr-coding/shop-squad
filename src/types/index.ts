// ... existing imports and interfaces ...

export interface Notification {
  id: string;
  type: 'invite' | 'payment_request' | 'payment_received' | 'squad_closed' | 'squad_reopened' | 'squad_completed' | 'reopen_request';
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  userId: string;
  partyId?: string;
  requesterId?: string;
  requesterName?: string;
}