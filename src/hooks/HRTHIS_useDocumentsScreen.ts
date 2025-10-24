/**
 * @file HRTHIS_useDocumentsScreen.ts
 * @domain HRTHIS - Documents Screen
 * @description Custom hook for documents screen logic
 * @created Phase 3D - Hooks Migration
 * @updated v4.4.3 - Added view dialog for in-app document viewing
 */

import { useState, useEffect, useMemo } from 'react';
import { useDocumentStore } from '../stores/HRTHIS_documentStore';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { useDateFilter } from './useDateFilter';
import { toast } from 'sonner@2.0.3';

/**
 * Custom Hook for DocumentsScreen
 * Manages document loading, filtering, uploading, and deletion
 * 
 * @version 4.0.2 - Added category filter (click on cards) + date filter
 */
export function useDocumentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Date filter hook
  const dateFilterHook = useDateFilter();

  const { 
    documents, 
    loading, 
    uploading, 
    loadDocuments, 
    uploadDocument, 
    deleteDocument, 
    downloadDocument 
  } = useDocumentStore();
  
  const { user } = useAuthStore();

  // Load documents on mount
  useEffect(() => {
    if (user?.id) {
      loadDocuments(user.id);
    }
  }, [user?.id, loadDocuments]);

  // Category configuration (7 categories)
  const categoryConfig = {
    VERTRAG: { label: 'Verträge' },
    ZERTIFIKAT: { label: 'Zertifikate' },
    LOHN: { label: 'Gehaltsabrechnungen' },
    AU: { label: 'AU' },
    PERSONALDOKUMENTE: { label: 'Personaldokumente' },
    BEWERBUNGSUNTERLAGEN: { label: 'Bewerbungsunterlagen' },
    SONSTIGES: { label: 'Sonstiges' },
  };

  // Filter documents (search + category + date)
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // 1. Text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => {
        const titleMatch = doc.title.toLowerCase().includes(query);
        const categoryLabel = categoryConfig[doc.category as keyof typeof categoryConfig]?.label || '';
        const categoryMatch = categoryLabel.toLowerCase().includes(query);
        return titleMatch || categoryMatch;
      });
    }

    // 2. Category filter (from clicking cards)
    if (selectedCategory) {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // 3. Date filter (using reusable hook)
    filtered = dateFilterHook.filterByDate(filtered, 'uploaded_at');

    return filtered;
  }, [documents, searchQuery, selectedCategory, dateFilterHook.filterDate]);

  // Count by category (7 categories)
  const categoryCounts = useMemo(() => ({
    VERTRAG: documents.filter(d => d.category === 'VERTRAG').length,
    ZERTIFIKAT: documents.filter(d => d.category === 'ZERTIFIKAT').length,
    LOHN: documents.filter(d => d.category === 'LOHN').length,
    AU: documents.filter(d => d.category === 'AU').length,
    PERSONALDOKUMENTE: documents.filter(d => d.category === 'PERSONALDOKUMENTE').length,
    BEWERBUNGSUNTERLAGEN: documents.filter(d => d.category === 'BEWERBUNGSUNTERLAGEN').length,
    SONSTIGES: documents.filter(d => d.category === 'SONSTIGES').length,
  }), [documents]);

  // Recently added (last 7 days)
  const recentDocuments = useMemo(() => 
    documents.filter(doc => {
      const uploadDate = new Date(doc.uploaded_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return uploadDate >= sevenDaysAgo;
    }),
    [documents]
  );

  // Handle file upload
  const handleUpload = async (
    file: File, 
    title: string, 
    category: 'LOHN' | 'VERTRAG' | 'SONSTIGES'
  ) => {
    if (!user?.id) {
      toast.error('Benutzer nicht gefunden');
      return;
    }

    try {
      await uploadDocument(user.id, file, title, category);
      toast.success('Dokument erfolgreich hochgeladen! ✅');
      setUploadDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Hochladen');
      throw error;
    }
  };

  // Handle file delete
  const handleDelete = async () => {
    if (!selectedDocument) return;

    try {
      await deleteDocument(selectedDocument);
      toast.success('Dokument erfolgreich gelöscht! 🗑️');
      setDeleteDialogOpen(false);
      setSelectedDocument(null);
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen');
    }
  };

  // State for view dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDocumentUrl, setViewDocumentUrl] = useState<string | null>(null);
  const [viewDocumentName, setViewDocumentName] = useState('');
  const [viewDocumentMimeType, setViewDocumentMimeType] = useState<string | undefined>(undefined);

  // Handle view (open document in dialog)
  const handleView = async (doc: any) => {
    try {
      // Get signed URL from store
      const url = await downloadDocument(doc, true); // true = return URL instead of download
      if (url) {
        setViewDocumentUrl(url);
        setViewDocumentName(doc.title || doc.file_name || 'Dokument');
        setViewDocumentMimeType(doc.mime_type);
        setViewDialogOpen(true);
      }
    } catch (error: any) {
      console.error('View document error:', error);
      toast.error(error.message || 'Fehler beim Öffnen des Dokuments');
    }
  };

  // Close view dialog
  const closeViewDialog = () => {
    setViewDialogOpen(false);
    setViewDocumentUrl(null);
    setViewDocumentName('');
    setViewDocumentMimeType(undefined);
  };

  // Handle download
  const handleDownload = async (doc: any) => {
    try {
      await downloadDocument(doc);
      toast.success('Download gestartet! 📥');
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Download');
    }
  };

  // Open delete dialog
  const openDeleteDialog = (documentId: string) => {
    setSelectedDocument(documentId);
    setDeleteDialogOpen(true);
  };

  // Handle category filter (click on category card)
  const handleCategoryFilter = (category: string) => {
    // Toggle: if same category clicked, clear filter
    setSelectedCategory(prev => prev === category ? null : category);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    dateFilterHook.setFilterDate(undefined);
  };

  // Check if any filter is active
  const hasActiveFilters = searchQuery || selectedCategory || dateFilterHook.filterDate;

  return {
    // Data
    documents,
    filteredDocuments,
    recentDocuments,
    categoryCounts,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Category Filter (v4.0.2)
    selectedCategory,
    setSelectedCategory,
    handleCategoryFilter,
    
    // Date Filter (v4.0.2)
    dateFilterHook,
    
    // Filter helpers (v4.0.2)
    clearFilters,
    hasActiveFilters,
    
    // Dialogs
    uploadDialogOpen,
    setUploadDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedDocument,
    
    // Actions
    handleUpload,
    handleDelete,
    handleView,
    handleDownload,
    openDeleteDialog,
    
    // View Dialog
    viewDialogOpen,
    setViewDialogOpen,
    viewDocumentUrl,
    viewDocumentName,
    viewDocumentMimeType,
    closeViewDialog,
    
    // Loading states
    loading,
    uploading,
  };
}
