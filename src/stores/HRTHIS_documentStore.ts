/**
 * DOCUMENT STORE
 * ==============
 * Global document state management
 * 
 * REFACTORED: Now uses DocumentService
 * - Removed direct Supabase calls
 * - Uses service layer for all document operations
 * - Better error handling with custom errors
 * - Type-safe with Zod validation
 */

import { create } from 'zustand';
import { Document } from '../types/database';
import { supabase } from '../utils/supabase/client';
import { getServices } from '../services';
import { NotFoundError, ValidationError, ApiError } from '../services/base/ApiError';

interface DocumentState {
  documents: Document[];
  loading: boolean;
  uploading: boolean;
  
  // Actions
  loadDocuments: (userId: string) => Promise<void>;
  loadAllDocuments: () => Promise<void>;
  uploadDocument: (userId: string, file: File, title: string, category: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  downloadDocument: (document: Document, returnUrl?: boolean) => Promise<string | void>;
  assignDocument: (file: File, userId: string, title: string, category: string, assignedBy: string) => Promise<void>;
}

const STORAGE_BUCKET = 'documents';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,
  uploading: false,

  loadDocuments: async (userId) => {
    set({ loading: true });
    try {
      // Use DocumentService to load user documents
      const services = getServices();
      const documents = await services.document.getDocumentsByUserId(userId);

      set({ documents });
    } catch (error) {
      console.error('Load documents error:', error);
      
      if (error instanceof NotFoundError) {
        set({ documents: [] });
      } else {
        throw error;
      }
    } finally {
      set({ loading: false });
    }
  },

  loadAllDocuments: async () => {
    set({ loading: true });
    try {
      // Use DocumentService to load all documents
      const services = getServices();
      const documents = await services.document.getAllDocuments();

      set({ documents });
    } catch (error) {
      console.error('Load all documents error:', error);
      set({ documents: [] });
    } finally {
      set({ loading: false });
    }
  },

  uploadDocument: async (userId, file, title, category) => {
    set({ uploading: true });
    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage (direct call - storage not in service)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      // Use DocumentService to save metadata
      const services = getServices();
      const newDocument = await services.document.uploadDocument({
        user_id: userId,       // Who owns the document
        title,
        category,
        file_url: publicUrl,
        mime_type: file.type,
        file_size: file.size,
      });

      // Update local state
      const { documents } = get();
      set({ documents: [newDocument, ...documents] });
    } catch (error) {
      console.error('Upload document error:', error);
      
      if (error instanceof ValidationError) {
        throw new Error('Ungültige Dokument-Daten');
      }
      
      throw error;
    } finally {
      set({ uploading: false });
    }
  },

  assignDocument: async (file, userId, title, category, assignedBy) => {
    set({ uploading: true });
    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage (direct call - storage not in service)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName);

      // Use DocumentService to save metadata
      const services = getServices();
      const newDocument = await services.document.uploadDocument({
        user_id: userId,         // Who owns the document
        title,
        category,
        file_url: publicUrl,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: assignedBy, // Who uploaded it
      });

      // Update local state
      const { documents } = get();
      set({ documents: [newDocument, ...documents] });
    } catch (error) {
      console.error('Assign document error:', error);
      
      if (error instanceof ValidationError) {
        throw new Error('Ungültige Dokument-Daten');
      }
      
      throw error;
    } finally {
      set({ uploading: false });
    }
  },

  deleteDocument: async (documentId) => {
    set({ loading: true });
    try {
      // Get document info first (direct Supabase - needed for storage cleanup)
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const urlParts = doc.file_url.split('/');
      const fileName = urlParts.slice(-2).join('/'); // userId/filename.ext

      // Delete from storage (direct Supabase - storage not in service)
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName]);

      if (storageError) console.warn('Storage delete warning:', storageError);

      // Use DocumentService to delete metadata
      const services = getServices();
      await services.document.deleteDocument(documentId);

      // Update local state
      const { documents } = get();
      set({ documents: documents.filter(d => d.id !== documentId) });
    } catch (error) {
      console.error('Delete document error:', error);
      
      if (error instanceof NotFoundError) {
        throw new Error('Dokument nicht gefunden');
      }
      
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  downloadDocument: async (document, returnUrl = false) => {
    try {
      // Use DocumentService to get download URL
      const services = getServices();
      const downloadUrl = await services.document.getDocumentUrl(document.id);

      // If returnUrl is true, just return the URL (for preview/view)
      if (returnUrl) {
        return downloadUrl;
      }

      // Otherwise, download the file
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download document error:', error);
      
      if (error instanceof NotFoundError) {
        throw new Error('Dokument nicht gefunden');
      }
      
      throw error;
    }
  },
}));
