export interface User {
  id: string;
  email: string;
}

export type PayloadStyle = 'snapshot' | 'thin';
export type DestinationType = 'webhook_endpoint' | 'amazon_eventbridge' | 'azure_event_grid';
export type EventType =
  | 'payment.success'
  | 'payment.failed'
  | 'customer.created'
  | 'customer.deleted'
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'user.created'
  | 'user.deleted'
  | 'balance.available';

export interface Webhook {
  _id: string;
  name: string;
  url: string;
  destinationType: DestinationType;
  payloadStyle: PayloadStyle;
  events: EventType[];
  lastStatus: 'pending' | 'success' | 'failure';
  lastTriggeredAt: string | null;
  createdAt: string;
}

export type WebSocketMessage =
  | {
      type: 'WEBHOOK_STATUS';
      webhookId: string;
      status: 'sending' | 'success' | 'failure';
      message: string;
    }
  | {
      type: 'EVENT_TREE_UPDATE';
      tree: Record<string, any>;
      updatedBy: string;
      updatedAt: string;
    }
  | {
      type: 'DESTINATION_UPDATE';
      destinations: import('./destinations').Destination[];
      updatedBy: string;
      updatedAt: string;
    };

    
