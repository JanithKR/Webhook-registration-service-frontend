export interface User {
  id: string;
  email: string;
}

export interface Webhook {
  _id: string;
  name: string;
  url: string;
  lastStatus: 'pending' | 'success' | 'failure';
  lastTriggeredAt: string | null;
  createdAt: string;
}

export interface WebSocketMessage {
  type: 'WEBHOOK_STATUS';
  webhookId: string;
  status: 'sending' | 'success' | 'failure';
  message: string;
}