import { Injectable } from '@angular/core';
import {environment} from "../environments/environment";
import {HttpClient, HttpParams} from "@angular/common/http";
import {MessageThreadQuery, CreateThreadRequest, MessageAttachment, MessageThread, CreateMessageRequest, MessageThreadDetail, Message, MessageRecipient, MessageThreadDetailQuery, MessageAttachmentQuery, MessageQuery, MessageRecipientQuery, MessagePriority, ThreadMessage, MessageType, LabGroupBasic, UserBasic} from "./message";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = environment.baseURL + '/api';

  constructor(private http: HttpClient) {
  }

  getThreads(params: { limit?: number, offset?: number, all?: boolean } = {}): Observable<MessageThreadQuery> {
    let httpParams = new HttpParams();
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.offset) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }
    if (params.all) {
      httpParams = httpParams.set('all', 'true');
    }
    return this.http.get<MessageThreadQuery>(`${this.baseUrl}/message_threads/`, {params: httpParams});
  }

  getThread(id: number): Observable<MessageThreadDetail> {
    return this.http.get<MessageThreadDetail>(`${this.baseUrl}/message_threads/${id}/`);
  }

  createThread(data: CreateThreadRequest): Observable<MessageThread> {
    return this.http.post<MessageThread>(`${this.baseUrl}/message_threads/`, data);
  }

  updateThread(id: number, data: Partial<CreateThreadRequest>): Observable<MessageThread> {
    return this.http.patch<MessageThread>(`${this.baseUrl}/message_threads/${id}/`, data);
  }

  deleteThread(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/message_threads/${id}/`);
  }

  addParticipant(threadId: number, userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/message_threads/${threadId}/add_participant/`, {user_id: userId});
  }

  removeParticipant(threadId: number, userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/message_threads/${threadId}/remove_participant/`, {user_id: userId});
  }

  markAllThreadMessagesAsRead(threadId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/message_threads/${threadId}/mark_all_read/`, {});
  }


  getMessages(
    limit?: number,
    offset?: number,
    thread?: number,
    all?: boolean
  ): Observable<MessageQuery> {
    let httpParams = new HttpParams();
    if (limit) {
      httpParams = httpParams.set('limit', limit.toString());
    }
    if (offset) {
      httpParams = httpParams.set('offset', offset.toString());
    }
    if (all) {
      httpParams = httpParams.set('all', 'true');
    }
    if (thread) {
      httpParams = httpParams.set('thread', thread.toString());
    }
    return this.http.get<MessageQuery>(`${this.baseUrl}/messages/`, {params: httpParams});
  }

  getMessage(id: number): Observable<Message> {
    return this.http.get<Message>(`${this.baseUrl}/messages/${id}/`);
  }

  sendMessage(message: CreateMessageRequest, attachments?: File[]): Observable<Message> {
    if (!attachments || attachments.length === 0) {
      return this.http.post<Message>(`${this.baseUrl}/messages/`, message);
    }

    const formData = new FormData();
    Object.keys(message).forEach((key: string) => {
      // @ts-ignore
      if (message[key]) {
        // @ts-ignore
        formData.append(key, message[key].toString());
      }
    });

    attachments.forEach(file => {
      formData.append('attachments', file, file.name);
    });

    return this.http.post<Message>(`${this.baseUrl}/messages/`, formData);
  }

  markMessageAsRead(messageId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/messages/${messageId}/mark_read/`, {});
  }

  markMessageAsUnread(messageId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/messages/${messageId}/mark_unread/`, {});
  }

  getRecipients(
    limit?: number,
    offset?: number,
    all?: boolean,
    message?: number
  ): Observable<MessageRecipientQuery> {
    let httpParams = new HttpParams();
    if (all) {
      httpParams = httpParams.set('all', 'true');
    }
    if (message) {
      httpParams = httpParams.set('message', message.toString());
    }
    if (limit) {
      httpParams = httpParams.set('limit', limit.toString());
    }
    if (offset) {
      httpParams = httpParams.set('offset', offset.toString());
    }
    return this.http.get<MessageRecipientQuery>(`${this.baseUrl}/message_recipients/`, {params: httpParams});
  }

  archiveMessage(recipientId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/message_recipients/${recipientId}/archive/`, {});
  }

  unarchiveMessage(recipientId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/message_recipients/${recipientId}/unarchive/`, {});
  }

  deleteMessage(recipientId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/message_recipients/${recipientId}/delete/`, {});
  }

  restoreMessage(recipientId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/message_recipients/${recipientId}/restore/`, {});
  }

  getAttachments(
    limit?: number,
    offset?: number,
    all?: boolean,
    message?: number
  ): Observable<MessageAttachmentQuery> {
    let httpParams = new HttpParams();
    if (all) {
      httpParams = httpParams.set('all', 'true');
    }
    if (message) {
      httpParams = httpParams.set('message', message.toString());
    }
    if (limit) {
      httpParams = httpParams.set('limit', limit.toString());
    }
    if (offset) {
      httpParams = httpParams.set('offset', offset.toString());
    }
    return this.http.get<MessageAttachmentQuery>(`${this.baseUrl}/message_attachments/`, {params: httpParams});
  }

  getAttachment(id: number): Observable<MessageAttachment> {
    return this.http.get<MessageAttachment>(`${this.baseUrl}/message_attachments/${id}/`);
  }
}
