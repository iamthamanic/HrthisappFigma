/**
 * =====================================================
 * Browo Koordinator Announcement Service
 * =====================================================
 * 
 * Manages dashboard announcements with rich content
 * - Create, update, delete announcements
 * - Push to live / Remove from live
 * - Fetch live announcement
 * - Rich content support (text, links, images, videos, benefits)
 */

import { ApiService } from './base/ApiService';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AnnouncementContentBlock {
  type: 'richtext' | 'text' | 'link' | 'image' | 'video' | 'benefit' | 'pdf';
  // Rich text (new format)
  html?: string;
  // Legacy formats
  content?: string;
  url?: string;
  text?: string;
  alt?: string;
  videoId?: string;
  benefitId?: string;
  // PDF
  filename?: string;
}

export interface AnnouncementContent {
  blocks: AnnouncementContentBlock[];
}

export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  content: AnnouncementContent;
  is_live: boolean;
  pushed_live_at: string | null;
  removed_from_live_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
  live_history: any[];
  // Joined data
  created_by_name?: string;
  created_by_email?: string;
  updated_by_name?: string;
  updated_by_email?: string;
  created_by_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  updated_by_profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateAnnouncementData {
  title: string;
  content: AnnouncementContent;
  push_live?: boolean; // If true, immediately push to live
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: AnnouncementContent;
}

export class AnnouncementService extends ApiService {
  constructor(client: SupabaseClient) {
    super(client);
  }

  /**
   * Get all announcements for current organization
   */
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await this.supabase
      .from('dashboard_announcements')
      .select(`
        *,
        created_by_profile:users!dashboard_announcements_created_by_fkey(
          first_name,
          last_name,
          email
        ),
        updated_by_profile:users!dashboard_announcements_updated_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      throw this.handleError(error, 'Failed to fetch announcements');
    }

    return (data || []).map((item: any) => ({
      ...item,
      created_by_name: item.created_by_profile 
        ? `${item.created_by_profile.first_name} ${item.created_by_profile.last_name}`.trim()
        : 'Unbekannt',
      created_by_email: item.created_by_profile?.email || '',
      updated_by_name: item.updated_by_profile 
        ? `${item.updated_by_profile.first_name} ${item.updated_by_profile.last_name}`.trim()
        : null,
      updated_by_email: item.updated_by_profile?.email || null,
    }));
  }

  /**
   * Get current live announcement
   */
  async getLiveAnnouncement(): Promise<Announcement | null> {
    const { data, error } = await this.supabase
      .from('dashboard_announcements')
      .select(`
        *,
        created_by_profile:users!dashboard_announcements_created_by_fkey(
          first_name,
          last_name,
          email
        ),
        updated_by_profile:users!dashboard_announcements_updated_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('is_live', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching live announcement:', error);
      throw this.handleError(error, 'Failed to fetch live announcement');
    }

    if (!data) return null;

    return {
      ...data,
      created_by_name: data.created_by_profile 
        ? `${data.created_by_profile.first_name} ${data.created_by_profile.last_name}`.trim()
        : 'Unbekannt',
      created_by_email: data.created_by_profile?.email || '',
      updated_by_name: data.updated_by_profile 
        ? `${data.updated_by_profile.first_name} ${data.updated_by_profile.last_name}`.trim()
        : null,
      updated_by_email: data.updated_by_profile?.email || null,
    };
  }

  /**
   * Get single announcement by ID
   */
  async getById(id: string): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('dashboard_announcements')
      .select(`
        *,
        created_by_profile:users!dashboard_announcements_created_by_fkey(
          first_name,
          last_name,
          email
        ),
        updated_by_profile:users!dashboard_announcements_updated_by_fkey(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching announcement:', error);
      throw this.handleError(error, 'Failed to fetch announcement');
    }

    return {
      ...data,
      created_by_name: data.created_by_profile 
        ? `${data.created_by_profile.first_name} ${data.created_by_profile.last_name}`.trim()
        : 'Unbekannt',
      created_by_email: data.created_by_profile?.email || '',
      updated_by_name: data.updated_by_profile 
        ? `${data.updated_by_profile.first_name} ${data.updated_by_profile.last_name}`.trim()
        : null,
      updated_by_email: data.updated_by_profile?.email || null,
    };
  }

  /**
   * Create new announcement
   */
  async create(
    announcementData: CreateAnnouncementData,
    userId: string,
    organizationId: string
  ): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('dashboard_announcements')
      .insert({
        title: announcementData.title,
        content: announcementData.content,
        is_live: announcementData.push_live || false,
        created_by: userId,
        updated_by: userId,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      throw this.handleError(error, 'Failed to create announcement');
    }

    return data;
  }

  /**
   * Update announcement
   */
  async update(
    id: string,
    updates: UpdateAnnouncementData,
    userId: string
  ): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('dashboard_announcements')
      .update({
        ...updates,
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      throw this.handleError(error, 'Failed to update announcement');
    }

    return data;
  }

  /**
   * Push announcement to live
   * (automatically removes other live announcements)
   */
  async pushToLive(id: string, userId: string): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('dashboard_announcements')
      .update({
        is_live: true,
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error pushing announcement to live:', error);
      throw this.handleError(error, 'Failed to push announcement to live');
    }

    return data;
  }

  /**
   * Remove announcement from live
   */
  async removeFromLive(id: string, userId: string): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('dashboard_announcements')
      .update({
        is_live: false,
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error removing announcement from live:', error);
      throw this.handleError(error, 'Failed to remove announcement from live');
    }

    return data;
  }

  /**
   * Delete announcement
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('dashboard_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      throw this.handleError(error, 'Failed to delete announcement');
    }
  }
}
