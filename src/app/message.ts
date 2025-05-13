export interface UserBasic {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface LabGroupBasic {
  id: number;
  name: string;
}

export interface MessageAttachment {
  id: number;
  file: string;
  file_name: string;
  file_size: number;
  content_type: string;
  created_at: string;
  download_url?: string;
}

export interface MessageRecipient {
  id: number;
  user: UserBasic;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  is_deleted: boolean;
}

export type MessageType = 'user_message' | 'system_notification' | 'alert' | 'announcement';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Message {
  id: number;
  sender: UserBasic;
  sender_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
  message_type: MessageType;
  priority: MessagePriority;
  expires_at: string | null;
  recipients: MessageRecipient[];
  attachments: MessageAttachment[];
  is_read: boolean;
  project?: number;
  protocol?: number;
  session?: number;
  instrument?: number;
  instrument_job?: number;
  stored_reagent?: number;
}

export interface ThreadMessage {
  id: number;
  sender: UserBasic;
  content: string;
  created_at: string;
  message_type: MessageType;
  priority: MessagePriority;
  attachment_count: number;
  is_read: boolean;
}

export interface MessageThread {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  participants: UserBasic[];
  participant_ids?: number[]; // For creation only
  is_system_thread: boolean;
  lab_group: LabGroupBasic | null;
  lab_group_id?: number; // For creation only
  latest_message: ThreadMessage | null;
  unread_count: number;
  creator: UserBasic;
}

export interface MessageThreadDetail extends MessageThread {
  messages: ThreadMessage[];
}

export interface CreateMessageRequest {
  thread: number;
  sender_id?: number;
  content: string;
  message_type?: MessageType;
  priority?: MessagePriority;
  expires_at?: string | null;
  project?: number;
  protocol?: number;
  session?: number;
  instrument?: number;
  instrument_job?: number;
  stored_reagent?: number;
}

export interface CreateThreadRequest {
  title?: string;
  participant_ids?: number[];
  is_system_thread?: boolean;
  lab_group_id?: number;
}

export interface MessageQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: Message[];
}

export interface MessageThreadQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: MessageThread[];
}

export interface MessageThreadDetailQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: MessageThreadDetail[];
}

export interface MessageAttachmentQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: MessageAttachment[];
}

export interface MessageRecipientQuery {
  count: number;
  next: string | null;
  previous: string | null;
  results: MessageRecipient[];
}
