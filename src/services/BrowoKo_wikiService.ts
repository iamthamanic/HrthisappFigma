/**
 * BrowoKo Wiki Service
 * Version: 4.12.33
 * 
 * Handles all Wiki-related API calls:
 * - CRUD operations for wiki articles
 * - Multi-assignments (departments, locations, specializations)
 * - File attachments
 * - Full-text search
 * - Advanced filtering (RAG types, metrics, time-based)
 * - RAG Access Control (Multi-Select: INTERN_WIKI, WEBSITE_RAG, HOTLINE_RAG)
 * - Metrics tracking (character count, storage size)
 * - Activity tracking (last edited, last viewed)
 */

import { supabase } from '../utils/supabase/client';

// =====================================================================================
// TYPES
// =====================================================================================

export type RAGAccessType = 'INTERN_WIKI' | 'WEBSITE_RAG' | 'HOTLINE_RAG';

export interface WikiArticle {
  id: string;
  article_id?: string; // Unique readable ID (WA-01, WA-02, ...)
  title: string;
  content_html: string;
  content_text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  view_count: number;
  is_published: boolean;
  rag_access_types: RAGAccessType[]; // Array: ['INTERN_WIKI', 'WEBSITE_RAG', etc.]
  last_viewed_at?: string | null;
  rag_access_count: number;
  creator_name?: string;
  creator_email?: string;
  // NEW: Activity tracking
  last_edited_by?: string | null;
  last_edited_at?: string | null;
  last_editor_name?: string | null;
  last_editor_email?: string | null;
  last_viewed_by?: string | null;
  last_viewer_name?: string | null;
  last_viewer_email?: string | null;
  // NEW: Metrics
  character_count?: number;
  storage_size?: number;
  // Assignments
  departments?: Array<{ id: string; name: string }>;
  locations?: Array<{ id: string; name: string }>;
  specializations?: string[];
  attachments?: WikiAttachment[];
  // Search-specific fields (from full-text search)
  rank?: number;
  title_snippet?: string;
  content_snippet?: string;
  // Computed fields for UI
  department_ids?: string[];
  location_ids?: string[];
}

export interface WikiAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface CreateWikiArticleData {
  title: string;
  content_html: string;
  content_text: string;
  rag_access_types?: RAGAccessType[]; // CHANGED: Array (default: ['INTERN_WIKI'])
  department_ids?: string[];
  location_ids?: string[];
  specializations?: string[];
  attachments?: File[];
}

export interface UpdateWikiArticleData {
  title?: string;
  content_html?: string;
  content_text?: string;
  rag_access_types?: RAGAccessType[]; // CHANGED: Array
  department_ids?: string[];
  location_ids?: string[];
  specializations?: string[];
  is_published?: boolean;
}

export interface WikiFilterOptions {
  search?: string;
  department_id?: string;
  location_id?: string;
  specialization?: string;
  // NEW: Advanced filters
  rag_types?: RAGAccessType[];
  min_characters?: number;
  max_characters?: number;
  min_storage?: number; // bytes
  max_storage?: number; // bytes
  edited_after?: string; // ISO timestamp
  viewed_after?: string; // ISO timestamp
  created_after?: string; // ISO timestamp
}

// =====================================================================================
// ARTICLE CRUD
// =====================================================================================

/**
 * Get all wiki articles with full assignments
 */
export async function getWikiArticles(filters?: WikiFilterOptions): Promise<WikiArticle[]> {
  try {
    // Add timestamp to prevent caching issues
    const timestamp = Date.now();
    
    let query = supabase
      .from('wiki_articles_with_assignments_browoko')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Full-text search
    if (filters?.search && filters.search.trim()) {
      const { data: searchResults } = await supabase
        .rpc('search_wiki_articles', { search_query: filters.search });
      
      if (searchResults && searchResults.length > 0) {
        const ids = searchResults.map((r: any) => r.id);
        query = query.in('id', ids);
      } else {
        // No results
        return [];
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Client-side filtering for junction tables and advanced filters
    let filteredData = data || [];

    if (filters?.department_id) {
      filteredData = filteredData.filter((article: any) => 
        article.departments?.some((d: any) => d.id === filters.department_id)
      );
    }

    if (filters?.location_id) {
      filteredData = filteredData.filter((article: any) => 
        article.locations?.some((l: any) => l.id === filters.location_id)
      );
    }

    if (filters?.specialization) {
      filteredData = filteredData.filter((article: any) => 
        article.specializations?.includes(filters.specialization)
      );
    }

    // NEW: RAG Types filter (multi-select)
    if (filters?.rag_types && filters.rag_types.length > 0) {
      filteredData = filteredData.filter((article: any) => {
        const articleTypes = article.rag_access_types || [];
        return filters.rag_types!.some(type => articleTypes.includes(type));
      });
    }

    // NEW: Character count filters
    if (filters?.min_characters !== undefined) {
      filteredData = filteredData.filter((article: any) => 
        (article.character_count || 0) >= filters.min_characters!
      );
    }
    if (filters?.max_characters !== undefined) {
      filteredData = filteredData.filter((article: any) => 
        (article.character_count || 0) <= filters.max_characters!
      );
    }

    // NEW: Storage size filters
    if (filters?.min_storage !== undefined) {
      filteredData = filteredData.filter((article: any) => 
        (article.storage_size || 0) >= filters.min_storage!
      );
    }
    if (filters?.max_storage !== undefined) {
      filteredData = filteredData.filter((article: any) => 
        (article.storage_size || 0) <= filters.max_storage!
      );
    }

    // NEW: Time-based filters
    if (filters?.edited_after) {
      const editedAfter = new Date(filters.edited_after);
      filteredData = filteredData.filter((article: any) => 
        article.last_edited_at && new Date(article.last_edited_at) >= editedAfter
      );
    }
    if (filters?.viewed_after) {
      const viewedAfter = new Date(filters.viewed_after);
      filteredData = filteredData.filter((article: any) => 
        article.last_viewed_at && new Date(article.last_viewed_at) >= viewedAfter
      );
    }
    if (filters?.created_after) {
      const createdAfter = new Date(filters.created_after);
      filteredData = filteredData.filter((article: any) => 
        article.created_at && new Date(article.created_at) >= createdAfter
      );
    }

    return filteredData as WikiArticle[];
  } catch (error) {
    console.error('Error fetching wiki articles:', error);
    throw error;
  }
}

/**
 * Get single wiki article by ID
 */
export async function getWikiArticleById(id: string): Promise<WikiArticle | null> {
  try {
    const { data, error } = await supabase
      .from('wiki_articles_with_assignments_browoko')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Get current user for tracking
    const { data: { user } } = await supabase.auth.getUser();

    // Increment view count and track viewer
    const updateData: any = { view_count: (data.view_count || 0) + 1 };
    if (user) {
      updateData.last_viewed_by = user.id;
      updateData.last_viewed_at = new Date().toISOString();
    }

    await supabase
      .from('wiki_articles_browoko')
      .update(updateData)
      .eq('id', id);

    return data as WikiArticle;
  } catch (error) {
    console.error('Error fetching wiki article:', error);
    return null;
  }
}

/**
 * Create new wiki article
 */
export async function createWikiArticle(data: CreateWikiArticleData): Promise<WikiArticle> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('User data not found');

    // 1. Create article
    const { data: article, error: articleError } = await supabase
      .from('wiki_articles_browoko')
      .insert({
        title: data.title,
        content_html: data.content_html,
        content_text: data.content_text,
        created_by: user.id,
        organization_id: userData.organization_id,
        rag_access_types: data.rag_access_types && data.rag_access_types.length > 0 
          ? data.rag_access_types 
          : ['INTERN_WIKI'],
      })
      .select()
      .single();

    if (articleError) throw articleError;

    // 2. Add department assignments
    if (data.department_ids && data.department_ids.length > 0) {
      const deptInserts = data.department_ids.map(dept_id => ({
        article_id: article.id,
        department_id: dept_id,
      }));

      const { error: deptError } = await supabase
        .from('wiki_article_departments_browoko')
        .insert(deptInserts);

      if (deptError) throw deptError;
    }

    // 3. Add location assignments
    if (data.location_ids && data.location_ids.length > 0) {
      const locInserts = data.location_ids.map(loc_id => ({
        article_id: article.id,
        location_id: loc_id,
      }));

      const { error: locError } = await supabase
        .from('wiki_article_locations_browoko')
        .insert(locInserts);

      if (locError) throw locError;
    }

    // 4. Add specialization assignments
    if (data.specializations && data.specializations.length > 0) {
      const specInserts = data.specializations.map(spec => ({
        article_id: article.id,
        specialization: spec,
      }));

      const { error: specError } = await supabase
        .from('wiki_article_specializations_browoko')
        .insert(specInserts);

      if (specError) throw specError;
    }

    // 5. Upload attachments
    if (data.attachments && data.attachments.length > 0) {
      await uploadWikiAttachments(article.id, data.attachments);
    }

    // Fetch and return complete article
    const completeArticle = await getWikiArticleById(article.id);
    if (!completeArticle) throw new Error('Failed to fetch created article');

    return completeArticle;
  } catch (error) {
    console.error('Error creating wiki article:', error);
    throw error;
  }
}

/**
 * Update wiki article
 */
export async function updateWikiArticle(
  id: string,
  data: UpdateWikiArticleData
): Promise<WikiArticle> {
  try {
    // Get current user for tracking
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Update main article
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content_html !== undefined) updateData.content_html = data.content_html;
    if (data.content_text !== undefined) updateData.content_text = data.content_text;
    if (data.is_published !== undefined) updateData.is_published = data.is_published;
    if (data.rag_access_types !== undefined) {
      updateData.rag_access_types = data.rag_access_types.length > 0 
        ? data.rag_access_types 
        : ['INTERN_WIKI'];
    }

    // Track last edited by (if content changed)
    if (user && (data.title !== undefined || data.content_html !== undefined || data.content_text !== undefined)) {
      updateData.last_edited_by = user.id;
      // last_edited_at is set automatically by trigger
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('wiki_articles_browoko')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // 2. Update department assignments
    if (data.department_ids !== undefined) {
      // Delete existing
      await supabase
        .from('wiki_article_departments_browoko')
        .delete()
        .eq('article_id', id);

      // Insert new
      if (data.department_ids.length > 0) {
        const deptInserts = data.department_ids.map(dept_id => ({
          article_id: id,
          department_id: dept_id,
        }));

        await supabase
          .from('wiki_article_departments_browoko')
          .insert(deptInserts);
      }
    }

    // 3. Update location assignments
    if (data.location_ids !== undefined) {
      await supabase
        .from('wiki_article_locations_browoko')
        .delete()
        .eq('article_id', id);

      if (data.location_ids.length > 0) {
        const locInserts = data.location_ids.map(loc_id => ({
          article_id: id,
          location_id: loc_id,
        }));

        await supabase
          .from('wiki_article_locations_browoko')
          .insert(locInserts);
      }
    }

    // 4. Update specialization assignments
    if (data.specializations !== undefined) {
      await supabase
        .from('wiki_article_specializations_browoko')
        .delete()
        .eq('article_id', id);

      if (data.specializations.length > 0) {
        const specInserts = data.specializations.map(spec => ({
          article_id: id,
          specialization: spec,
        }));

        await supabase
          .from('wiki_article_specializations_browoko')
          .insert(specInserts);
      }
    }

    // Fetch and return updated article
    const updatedArticle = await getWikiArticleById(id);
    if (!updatedArticle) throw new Error('Failed to fetch updated article');

    return updatedArticle;
  } catch (error) {
    console.error('Error updating wiki article:', error);
    throw error;
  }
}

/**
 * Delete wiki article
 */
export async function deleteWikiArticle(id: string): Promise<void> {
  try {
    // Delete attachments from storage
    const { data: attachments } = await supabase
      .from('wiki_article_attachments_browoko')
      .select('file_url')
      .eq('article_id', id);

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        const path = att.file_url.split('/').pop();
        if (path) {
          await supabase.storage
            .from('wiki-attachments-browoko')
            .remove([path]);
        }
      }
    }

    // Delete article (cascades to junction tables)
    const { error } = await supabase
      .from('wiki_articles_browoko')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting wiki article:', error);
    throw error;
  }
}

// =====================================================================================
// FILE ATTACHMENTS
// =====================================================================================

/**
 * Sanitize filename for storage
 * Removes special characters, umlauts, and spaces
 */
function sanitizeFilename(filename: string): string {
  // Replace umlauts
  const umlautMap: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue',
    'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
    'ß': 'ss'
  };
  
  let sanitized = filename;
  Object.entries(umlautMap).forEach(([umlaut, replacement]) => {
    sanitized = sanitized.replace(new RegExp(umlaut, 'g'), replacement);
  });
  
  // Remove or replace special characters
  sanitized = sanitized
    .replace(/[(),]/g, '') // Remove parentheses and commas
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove any other special chars
  
  return sanitized;
}

/**
 * Upload attachments for wiki article
 */
export async function uploadWikiAttachments(
  articleId: string,
  files: File[]
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    for (const file of files) {
      // Sanitize filename
      const originalName = file.name;
      const fileExt = originalName.split('.').pop() || '';
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const sanitizedName = sanitizeFilename(nameWithoutExt);
      const sanitizedFullName = `${sanitizedName}.${fileExt}`;
      
      // Storage path with sanitized filename
      const fileName = `${articleId}/${Date.now()}_${sanitizedFullName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wiki-attachments-browoko')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wiki-attachments-browoko')
        .getPublicUrl(fileName);

      // Save to database with original filename for display
      await supabase
        .from('wiki_article_attachments_browoko')
        .insert({
          article_id: articleId,
          file_name: originalName, // Keep original name for display
          file_url: publicUrl,
          file_type: fileExt || 'unknown',
          file_size: file.size,
          uploaded_by: user.id,
        });
    }
  } catch (error) {
    console.error('Error uploading wiki attachments:', error);
    throw error;
  }
}

/**
 * Delete attachment
 */
export async function deleteWikiAttachment(attachmentId: string): Promise<void> {
  try {
    const { data: attachment } = await supabase
      .from('wiki_article_attachments_browoko')
      .select('file_url')
      .eq('id', attachmentId)
      .single();

    if (attachment) {
      const path = attachment.file_url.split('/').pop();
      if (path) {
        await supabase.storage
          .from('wiki-attachments-browoko')
          .remove([path]);
      }
    }

    await supabase
      .from('wiki_article_attachments_browoko')
      .delete()
      .eq('id', attachmentId);
  } catch (error) {
    console.error('Error deleting wiki attachment:', error);
    throw error;
  }
}

// =====================================================================================
// HELPER FUNCTIONS
// =====================================================================================

/**
 * Format storage size in bytes to human-readable format
 */
export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1048576) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1073741824) {
    return `${(bytes / 1048576).toFixed(1)} MB`;
  } else {
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  }
}

/**
 * Format character count with K/M suffix
 */
export function formatCharacterCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}

/**
 * Get all unique specializations from master table
 * Falls back to wiki article specializations if master table doesn't exist yet
 */
export async function getSpecializations(): Promise<string[]> {
  try {
    // Try loading from master specializations table first
    const { data: masterData, error: masterError } = await supabase
      .from('specializations')
      .select('name')
      .order('name');

    // If master table exists, use it
    if (!masterError && masterData) {
      return masterData.map(d => d.name);
    }

    // Fallback: Load from wiki article specializations (old method)
    console.log('⚠️ Specializations master table not found, falling back to wiki articles');
    const { data, error } = await supabase
      .from('wiki_article_specializations_browoko')
      .select('specialization')
      .order('specialization');

    if (error) throw error;

    const unique = [...new Set(data?.map(d => d.specialization) || [])];
    return unique;
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return [];
  }
}
