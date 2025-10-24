/**
 * DOCUMENT SERVICE
 * ================
 * Handles all document operations with full audit logging
 * 
 * Replaces direct Supabase calls in stores for:
 * - Document CRUD
 * - File upload/download
 * - Category filtering
 * - Document access control
 * - Audit logging for compliance
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ApiService } from './base/ApiService';
import { NotFoundError, ValidationError, ApiError } from './base/ApiError';
import type { Document } from '../types/database';
import { DocumentAuditService } from './HRTHIS_documentAuditService';

export interface CreateDocumentData {
  title: string;
  category: string;
  file_url: string;
  user_id?: string;        // Who the document belongs to
  mime_type?: string;      // Changed from file_type
  file_size?: number;
  organization_id?: string;
  uploaded_by?: string;    // Who uploaded the document
  // Note: file_name doesn't exist in DB - filename is in file_url
}

export interface UpdateDocumentData {
  title?: string;
  description?: string;
  category?: string;
}

export interface DocumentFilters {
  category?: string;
  organization_id?: string;
  search?: string;
  uploaded_by?: string;
}

/**
 * DOCUMENT SERVICE
 * ================
 * Manages documents, uploads, and downloads with audit logging
 */
export class DocumentService extends ApiService {
  private auditService: DocumentAuditService;

  constructor(supabase: SupabaseClient) {
    super(supabase);
    this.auditService = new DocumentAuditService(supabase);
  }
  /**
   * Get all documents with optional filters
   */
  async getAllDocuments(filters?: DocumentFilters): Promise<Document[]> {
    this.logRequest('getAllDocuments', 'DocumentService', { filters });

    try {
      let query = this.supabase
        .from('documents')
        .select(`
          *,
          uploader:uploaded_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('uploaded_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.organization_id) {
          query = query.eq('organization_id', filters.organization_id);
        }
        if (filters.uploaded_by) {
          query = query.eq('uploaded_by', filters.uploaded_by);
        }
        if (filters.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%`
          );
        }
      }

      const { data: documents, error } = await query;

      if (error) {
        this.handleError(error, 'DocumentService.getAllDocuments');
      }

      this.logResponse('DocumentService.getAllDocuments', { count: documents?.length || 0 });
      return (documents || []) as Document[];
    } catch (error: any) {
      this.handleError(error, 'DocumentService.getAllDocuments');
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId: string): Promise<Document> {
    this.logRequest('getDocumentById', 'DocumentService', { documentId });

    if (!documentId) {
      throw new ValidationError(
        'Document ID ist erforderlich',
        'DocumentService.getDocumentById',
        { documentId: 'Document ID ist erforderlich' }
      );
    }

    try {
      const { data: document, error } = await this.supabase
        .from('documents')
        .select(`
          *,
          uploader:uploaded_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', documentId)
        .single();

      if (error) {
        throw new NotFoundError('Dokument', 'DocumentService.getDocumentById', error);
      }

      if (!document) {
        throw new NotFoundError('Dokument', 'DocumentService.getDocumentById');
      }

      this.logResponse('DocumentService.getDocumentById', { title: document.title });
      return document as Document;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'DocumentService.getDocumentById');
    }
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(category: string): Promise<Document[]> {
    this.logRequest('getDocumentsByCategory', 'DocumentService', { category });

    if (!category) {
      throw new ValidationError(
        'Category ist erforderlich',
        'DocumentService.getDocumentsByCategory',
        { category: 'Category ist erforderlich' }
      );
    }

    return await this.getAllDocuments({ category });
  }

  /**
   * Get documents by user ID (uploaded by user)
   * Used for audit logging and tracking
   */
  async getDocumentsByUserId(userId: string): Promise<Document[]> {
    this.logRequest('getDocumentsByUserId', 'DocumentService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'DocumentService.getDocumentsByUserId',
        { userId: 'User ID ist erforderlich' }
      );
    }

    return await this.getAllDocuments({ uploaded_by: userId });
  }

  /**
   * Upload document (create document record)
   */
  async uploadDocument(data: CreateDocumentData): Promise<Document> {
    this.logRequest('uploadDocument', 'DocumentService', data);

    // Validate input
    const errors: Record<string, string> = {};

    if (!data.title) errors.title = 'Titel ist erforderlich';
    if (!data.category) errors.category = 'Kategorie ist erforderlich';
    if (!data.file_url) errors.file_url = 'Datei URL ist erforderlich';

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(
        'Ungültige Eingabedaten',
        'DocumentService.uploadDocument',
        errors
      );
    }

    try {
      // Build insert object with only columns that exist in DB
      const insertData: any = {
        title: data.title,
        category: data.category,
        file_url: data.file_url,
      };

      // Optional fields that exist in DB
      if (data.user_id) {
        insertData.user_id = data.user_id;
      }
      if (data.mime_type) {
        insertData.mime_type = data.mime_type;
      }
      if (data.file_size) {
        insertData.file_size = data.file_size;
      }
      if (data.organization_id) {
        insertData.organization_id = data.organization_id;
      }
      if (data.uploaded_by) {
        insertData.uploaded_by = data.uploaded_by;
      }

      const { data: document, error } = await this.supabase
        .from('documents')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'DocumentService.uploadDocument');
      }

      if (!document) {
        throw new ApiError(
          'Dokument konnte nicht erstellt werden',
          'CREATION_FAILED',
          'DocumentService.uploadDocument'
        );
      }

      this.logResponse('DocumentService.uploadDocument', { id: document.id });
      return document as Document;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof ApiError) {
        throw error;
      }
      this.handleError(error, 'DocumentService.uploadDocument');
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: string, updates: UpdateDocumentData): Promise<Document> {
    this.logRequest('updateDocument', 'DocumentService', { documentId, updates });

    if (!documentId) {
      throw new ValidationError(
        'Document ID ist erforderlich',
        'DocumentService.updateDocument',
        { documentId: 'Document ID ist erforderlich' }
      );
    }

    try {
      const { data: document, error } = await this.supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'DocumentService.updateDocument');
      }

      if (!document) {
        throw new NotFoundError('Dokument', 'DocumentService.updateDocument');
      }

      this.logResponse('DocumentService.updateDocument', { id: document.id });
      return document as Document;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'DocumentService.updateDocument');
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    this.logRequest('deleteDocument', 'DocumentService', { documentId });

    if (!documentId) {
      throw new ValidationError(
        'Document ID ist erforderlich',
        'DocumentService.deleteDocument',
        { documentId: 'Document ID ist erforderlich' }
      );
    }

    try {
      // Get document to get file URL
      const document = await this.getDocumentById(documentId);

      // Delete from storage if file_url exists
      if (document.file_url) {
        // Extract file path from URL
        const urlParts = document.file_url.split('/');
        const bucketName = urlParts[urlParts.length - 2];
        const fileName = urlParts[urlParts.length - 1];

        if (bucketName && fileName) {
          try {
            await this.supabase.storage.from(bucketName).remove([fileName]);
          } catch (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
          }
        }
      }

      // Delete from database
      const { error } = await this.supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        this.handleError(error, 'DocumentService.deleteDocument');
      }

      this.logResponse('DocumentService.deleteDocument', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, 'DocumentService.deleteDocument');
    }
  }

  /**
   * Get document download URL (signed URL for private files)
   */
  async getDocumentUrl(documentId: string, expiresIn: number = 3600): Promise<string> {
    this.logRequest('getDocumentUrl', 'DocumentService', { documentId, expiresIn });

    if (!documentId) {
      throw new ValidationError(
        'Document ID ist erforderlich',
        'DocumentService.getDocumentUrl',
        { documentId: 'Document ID ist erforderlich' }
      );
    }

    try {
      const document = await this.getDocumentById(documentId);

      if (!document.file_url) {
        throw new ApiError(
          'Dokument hat keine Datei URL',
          'NO_FILE_URL',
          'DocumentService.getDocumentUrl'
        );
      }

      // If file is already a public URL, return it
      if (document.file_url.startsWith('http')) {
        return document.file_url;
      }

      // Extract bucket and path from file_url
      const urlParts = document.file_url.split('/');
      const bucketName = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];

      if (!bucketName || !fileName) {
        throw new ApiError(
          'Ungültige Datei URL',
          'INVALID_FILE_URL',
          'DocumentService.getDocumentUrl'
        );
      }

      // Create signed URL
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        this.handleError(error, 'DocumentService.getDocumentUrl');
      }

      if (!data?.signedUrl) {
        throw new ApiError(
          'Signed URL konnte nicht erstellt werden',
          'SIGNED_URL_FAILED',
          'DocumentService.getDocumentUrl'
        );
      }

      this.logResponse('DocumentService.getDocumentUrl', 'Erfolg');
      return data.signedUrl;
    } catch (error: any) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof ApiError
      ) {
        throw error;
      }
      this.handleError(error, 'DocumentService.getDocumentUrl');
    }
  }

  /**
   * Download document (get file as blob)
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    this.logRequest('downloadDocument', 'DocumentService', { documentId });

    if (!documentId) {
      throw new ValidationError(
        'Document ID ist erforderlich',
        'DocumentService.downloadDocument',
        { documentId: 'Document ID ist erforderlich' }
      );
    }

    try {
      const document = await this.getDocumentById(documentId);

      if (!document.file_url) {
        throw new ApiError(
          'Dokument hat keine Datei URL',
          'NO_FILE_URL',
          'DocumentService.downloadDocument'
        );
      }

      // Extract bucket and path from file_url
      const urlParts = document.file_url.split('/');
      const bucketName = urlParts[urlParts.length - 2];
      const fileName = urlParts[urlParts.length - 1];

      if (!bucketName || !fileName) {
        throw new ApiError(
          'Ungültige Datei URL',
          'INVALID_FILE_URL',
          'DocumentService.downloadDocument'
        );
      }

      // Download file
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .download(fileName);

      if (error) {
        this.handleError(error, 'DocumentService.downloadDocument');
      }

      if (!data) {
        throw new ApiError(
          'Datei konnte nicht heruntergeladen werden',
          'DOWNLOAD_FAILED',
          'DocumentService.downloadDocument'
        );
      }

      this.logResponse('DocumentService.downloadDocument', 'Erfolg');
      return data;
    } catch (error: any) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof ApiError
      ) {
        throw error;
      }
      this.handleError(error, 'DocumentService.downloadDocument');
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string): Promise<Document[]> {
    this.logRequest('searchDocuments', 'DocumentService', { query });

    if (!query || query.trim().length < 2) {
      throw new ValidationError(
        'Suchbegriff muss mindestens 2 Zeichen lang sein',
        'DocumentService.searchDocuments',
        { query: 'Suchbegriff zu kurz' }
      );
    }

    return await this.getAllDocuments({ search: query.trim() });
  }

  /**
   * Get document categories (unique categories from all documents)
   */
  async getDocumentCategories(): Promise<string[]> {
    this.logRequest('getDocumentCategories', 'DocumentService');

    try {
      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('category');

      if (error) {
        this.handleError(error, 'DocumentService.getDocumentCategories');
      }

      // Get unique categories
      const categories = [
        ...new Set((documents || []).map((doc) => doc.category).filter(Boolean)),
      ];

      this.logResponse('DocumentService.getDocumentCategories', { count: categories.length });
      return categories as string[];
    } catch (error: any) {
      this.handleError(error, 'DocumentService.getDocumentCategories');
    }
  }

  /**
   * Get document stats
   */
  async getDocumentStats(organizationId?: string): Promise<{
    total: number;
    by_category: Record<string, number>;
    total_size_mb: number;
  }> {
    this.logRequest('getDocumentStats', 'DocumentService', { organizationId });

    try {
      let query = this.supabase.from('documents').select('*');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: documents, error } = await query;

      if (error) {
        this.handleError(error, 'DocumentService.getDocumentStats');
      }

      const docs = documents || [];
      const total = docs.length;
      const byCategory: Record<string, number> = {};
      let totalSizeBytes = 0;

      docs.forEach((doc) => {
        // Count by category
        if (doc.category) {
          byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
        }

        // Sum file sizes
        if (doc.file_size) {
          totalSizeBytes += doc.file_size;
        }
      });

      const totalSizeMb = totalSizeBytes / (1024 * 1024);

      const stats = {
        total,
        by_category: byCategory,
        total_size_mb: Math.round(totalSizeMb * 100) / 100,
      };

      this.logResponse('DocumentService.getDocumentStats', stats);
      return stats;
    } catch (error: any) {
      this.handleError(error, 'DocumentService.getDocumentStats');
    }
  }
}
