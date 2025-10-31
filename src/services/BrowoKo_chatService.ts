// ============================================================================
// BROWO KOORDINATOR - CHAT SERVICE
// ============================================================================
// Handles API calls to Chat Edge Function
// ============================================================================

import { ApiService } from './base/ApiService';
import { ApiError } from './base/ApiError';

const FUNCTION_NAME = 'BrowoKoordinator-Chat';

// ============================================================================
// TYPES
// ============================================================================

export type ConversationType = 'DM' | 'GROUP';
export type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
export type UserStatus = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
export type FeedbackStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: ConversationMember[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  joined_at: string;
  last_read_at?: string;
  notifications_enabled: boolean;
  user?: {
    id: string;
    full_name: string;
    profile_picture?: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  type: MessageType;
  edited_at?: string;
  deleted_at?: string;
  reply_to_message_id?: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    profile_picture?: string;
  };
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
  };
}

export interface KnowledgePage {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  view_count: number;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: {
    id: string;
    full_name: string;
  };
  updated_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface Feedback {
  id: string;
  title: string;
  description: string;
  category?: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  submitted_by: string;
  assigned_to?: string;
  admin_response?: string;
  created_at: string;
  updated_at: string;
  submitted_by_user?: {
    id: string;
    full_name: string;
    profile_picture?: string;
  };
  assigned_to_user?: {
    id: string;
    full_name: string;
  };
  comments?: FeedbackComment[];
}

export interface FeedbackComment {
  id: string;
  feedback_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    profile_picture?: string;
  };
}

export interface UserPresence {
  user_id: string;
  status: UserStatus;
  last_seen_at: string;
  user?: {
    id: string;
    full_name: string;
    profile_picture?: string;
  };
}

// ============================================================================
// CHAT SERVICE
// ============================================================================

class ChatService extends ApiService {
  constructor() {
    super(FUNCTION_NAME);
  }

  // ==========================================================================
  // CONVERSATIONS
  // ==========================================================================

  async getConversations(): Promise<Conversation[]> {
    const response = await this.get<{ conversations: Conversation[] }>('/conversations');
    return response.conversations;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await this.get<{ conversation: Conversation }>(`/conversations/${id}`);
    return response.conversation;
  }

  async createConversation(data: {
    type: ConversationType;
    name?: string;
    member_ids: string[];
  }): Promise<Conversation> {
    const response = await this.post<{ conversation: Conversation }>('/conversations', data);
    return response.conversation;
  }

  async updateConversation(id: string, data: {
    name?: string;
    avatar_url?: string;
  }): Promise<Conversation> {
    const response = await this.put<{ conversation: Conversation }>(`/conversations/${id}`, data);
    return response.conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    await this.delete(`/conversations/${id}`);
  }

  async addMember(conversationId: string, userId: string): Promise<ConversationMember> {
    const response = await this.post<{ member: ConversationMember }>(
      `/conversations/${conversationId}/members`,
      { user_id: userId }
    );
    return response.member;
  }

  async removeMember(conversationId: string, userId: string): Promise<void> {
    await this.delete(`/conversations/${conversationId}/members/${userId}`);
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.put(`/conversations/${conversationId}/read`, {});
  }

  async getUnreadCount(conversationId: string): Promise<number> {
    const response = await this.get<{ unread_count: number }>(`/conversations/${conversationId}/unread`);
    return response.unread_count;
  }

  // ==========================================================================
  // MESSAGES
  // ==========================================================================

  async getMessages(conversationId: string, options?: {
    limit?: number;
    before?: string;
  }): Promise<Message[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.before) params.append('before', options.before);

    const response = await this.get<{ messages: Message[] }>(
      `/conversations/${conversationId}/messages?${params.toString()}`
    );
    return response.messages;
  }

  async sendMessage(conversationId: string, data: {
    content: string;
    type?: MessageType;
    reply_to_message_id?: string;
  }): Promise<Message> {
    const response = await this.post<{ message: Message }>(
      `/conversations/${conversationId}/messages`,
      data
    );
    return response.message;
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await this.put<{ message: Message }>(`/messages/${messageId}`, { content });
    return response.message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.delete(`/messages/${messageId}`);
  }

  async addReaction(messageId: string, emoji: string): Promise<MessageReaction> {
    const response = await this.post<{ reaction: MessageReaction }>(
      `/messages/${messageId}/reactions`,
      { emoji }
    );
    return response.reaction;
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await this.delete(`/messages/${messageId}/reactions?emoji=${emoji}`);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.post(`/messages/${messageId}/read`, {});
  }

  // ==========================================================================
  // FILE ATTACHMENTS
  // ==========================================================================

  async addAttachment(messageId: string, data: {
    file_url: string;
    file_name: string;
    file_type: string;
    file_size?: number;
  }): Promise<MessageAttachment> {
    const response = await this.post<{ attachment: MessageAttachment }>(
      `/messages/${messageId}/attachments`,
      data
    );
    return response.attachment;
  }

  async getAttachments(messageId: string): Promise<MessageAttachment[]> {
    const response = await this.get<{ attachments: MessageAttachment[] }>(
      `/messages/${messageId}/attachments`
    );
    return response.attachments;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.delete(`/attachments/${attachmentId}`);
  }

  // ==========================================================================
  // TYPING & PRESENCE
  // ==========================================================================

  async setTypingStatus(conversationId: string, isTyping: boolean): Promise<void> {
    await this.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping });
  }

  async getOnlineUsers(): Promise<UserPresence[]> {
    const response = await this.get<{ users: UserPresence[] }>('/users/online');
    return response.users;
  }

  async updatePresence(status: UserStatus = 'ONLINE'): Promise<void> {
    await this.post('/presence', { status });
  }

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  async searchMessages(query: string, conversationId?: string): Promise<Message[]> {
    const params = new URLSearchParams({ q: query });
    if (conversationId) params.append('conversation_id', conversationId);

    const response = await this.get<{ messages: Message[] }>(
      `/search/messages?${params.toString()}`
    );
    return response.messages;
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    const response = await this.get<{ conversations: Conversation[] }>(
      `/search/conversations?q=${query}`
    );
    return response.conversations;
  }

  // ==========================================================================
  // KNOWLEDGE WIKI
  // ==========================================================================

  async getKnowledgePages(category?: string): Promise<KnowledgePage[]> {
    const params = category ? `?category=${category}` : '';
    const response = await this.get<{ pages: KnowledgePage[] }>(`/knowledge${params}`);
    return response.pages;
  }

  async getKnowledgePage(id: string): Promise<KnowledgePage> {
    const response = await this.get<{ page: KnowledgePage }>(`/knowledge/${id}`);
    return response.page;
  }

  async createKnowledgePage(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }): Promise<KnowledgePage> {
    const response = await this.post<{ page: KnowledgePage }>('/knowledge', data);
    return response.page;
  }

  async updateKnowledgePage(id: string, data: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
  }): Promise<KnowledgePage> {
    const response = await this.put<{ page: KnowledgePage }>(`/knowledge/${id}`, data);
    return response.page;
  }

  async deleteKnowledgePage(id: string): Promise<void> {
    await this.delete(`/knowledge/${id}`);
  }

  async searchKnowledge(query: string): Promise<KnowledgePage[]> {
    const response = await this.get<{ pages: KnowledgePage[] }>(`/knowledge/search?q=${query}`);
    return response.pages;
  }

  // ==========================================================================
  // FEEDBACK SYSTEM
  // ==========================================================================

  async getFeedback(filters?: {
    status?: FeedbackStatus;
    priority?: FeedbackPriority;
  }): Promise<Feedback[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await this.get<{ feedback: Feedback[] }>(
      `/feedback?${params.toString()}`
    );
    return response.feedback;
  }

  async getFeedbackById(id: string): Promise<Feedback> {
    const response = await this.get<{ feedback: Feedback }>(`/feedback/${id}`);
    return response.feedback;
  }

  async submitFeedback(data: {
    title: string;
    description: string;
    category?: string;
    priority?: FeedbackPriority;
  }): Promise<Feedback> {
    const response = await this.post<{ feedback: Feedback }>('/feedback', data);
    return response.feedback;
  }

  async updateFeedback(id: string, data: {
    status?: FeedbackStatus;
    priority?: FeedbackPriority;
    assigned_to?: string;
    admin_response?: string;
  }): Promise<Feedback> {
    const response = await this.put<{ feedback: Feedback }>(`/feedback/${id}`, data);
    return response.feedback;
  }

  async deleteFeedback(id: string): Promise<void> {
    await this.delete(`/feedback/${id}`);
  }

  async addFeedbackComment(feedbackId: string, content: string): Promise<FeedbackComment> {
    const response = await this.post<{ comment: FeedbackComment }>(
      `/feedback/${feedbackId}/comments`,
      { content }
    );
    return response.comment;
  }
}

// Export singleton instance
export const chatService = new ChatService();
