/**
 * @file BrowoKo_DocumentsTabContent.tsx
 * @domain BrowoKo - Documents Tab Content
 * @description Reusable documents view for MeineDaten and TeamMemberDetails
 * @version 4.4.1 - Created for Documents Tab Integration
 * @version 4.10.16 - Updated reference from PersonalSettings to MeineDaten
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, Search, Calendar, X } from './icons/BrowoKoIcons';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import EmptyState from './EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { DocumentCard } from './BrowoKo_DocumentCard';
import { DocumentCategoryCards } from './BrowoKo_DocumentCategoryCards';
import { DocumentViewDialog } from './BrowoKo_DocumentViewDialog';
import { useDocumentsScreen } from '../hooks/BrowoKo_useDocumentsScreen';

interface DocumentsTabContentProps {
  userId?: string; // Optional: filter by user ID
  userName?: string; // Optional: display user name in title
  canUpload?: boolean; // Optional: show upload button (for admins)
}

export function DocumentsTabContent({ userId, userName, canUpload = false }: DocumentsTabContentProps) {
  const {
    filteredDocuments,
    recentDocuments,
    categoryCounts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    handleCategoryFilter,
    dateFilterHook,
    clearFilters,
    hasActiveFilters,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete,
    handleDownload,
    handleView,
    openDeleteDialog,
    viewDialogOpen,
    setViewDialogOpen,
    viewDocumentUrl,
    viewDocumentName,
    viewDocumentMimeType,
    closeViewDialog,
    loading,
  } = useDocumentsScreen();

  // Category labels for display
  const categoryLabels: Record<string, string> = {
    VERTRAG: 'Verträge',
    ZERTIFIKAT: 'Zertifikate',
    LOHN: 'Gehaltsabrechnungen',
    AU: 'AU',
    PERSONALDOKUMENTE: 'Personaldokumente',
    BEWERBUNGSUNTERLAGEN: 'Bewerbungsunterlagen',
    SONSTIGES: 'Sonstiges',
  };

  // Loading state
  if (loading && filteredDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Dokumente werden geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          {userName ? `Dokumente von ${userName}` : 'Meine Dokumente'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {userName 
            ? `Alle Dokumente, die ${userName} zugewiesen wurden`
            : 'Deine persönlichen Dokumente - Hochgeladen von Administratoren'
          }
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Dokumente durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[180px] justify-start">
              <Calendar className="w-4 h-4" />
              {dateFilterHook.formatFilterDate(dateFilterHook.filterDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={dateFilterHook.filterDate}
              onSelect={dateFilterHook.setFilterDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Upload Button (only for admins) */}
        {canUpload && (
          <Button className="gap-2">
            <FileText className="w-4 h-4" />
            Dokument hochladen
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Aktive Filter:</span>
          
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Suche: "{searchQuery}"
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => setSearchQuery('')}
              />
            </Badge>
          )}
          
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              Kategorie: {categoryLabels[selectedCategory] || selectedCategory}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => handleCategoryFilter(selectedCategory)}
              />
            </Badge>
          )}
          
          {dateFilterHook.filterDate && (
            <Badge variant="secondary" className="gap-1">
              Datum: {dateFilterHook.formatFilterDate(dateFilterHook.filterDate)}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => dateFilterHook.setFilterDate(undefined)}
              />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-6 text-xs"
          >
            Alle Filter löschen
          </Button>
        </div>
      )}

      {/* Categories */}
      <DocumentCategoryCards 
        categoryCounts={categoryCounts}
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryFilter}
      />

      {/* Documents List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all">Alle Dokumente</TabsTrigger>
          <TabsTrigger value="recent">Zuletzt hinzugefügt</TabsTrigger>
          <TabsTrigger value="important">Wichtig</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 md:mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alle Dokumente ({filteredDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={searchQuery ? 'Keine Dokumente gefunden' : 'Noch keine Dokumente vorhanden'}
                  description={
                    searchQuery
                      ? 'Versuche einen anderen Suchbegriff'
                      : 'Dokumente werden von Administratoren hochgeladen'
                  }
                />
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onView={() => handleView(doc)}
                      onDownload={() => handleDownload(doc)}
                      onDelete={() => openDeleteDialog(doc.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-4 md:mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Zuletzt hinzugefügt ({recentDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {recentDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Keine kürzlich hinzugefügten Dokumente"
                  description="Dokumente der letzten 7 Tage werden hier angezeigt"
                />
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onView={() => handleView(doc)}
                      onDownload={() => handleDownload(doc)}
                      onDelete={() => openDeleteDialog(doc.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="important" className="mt-4 md:mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Wichtige Dokumente</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FileText}
                title="Keine wichtigen Dokumente"
                description="Markierte Dokumente werden hier angezeigt"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Document Dialog */}
      <DocumentViewDialog
        open={viewDialogOpen}
        onOpenChange={closeViewDialog}
        documentUrl={viewDocumentUrl}
        documentName={viewDocumentName}
        mimeType={viewDocumentMimeType}
        onDownload={() => {
          const doc = filteredDocuments.find(d => d.title === viewDocumentName);
          if (doc) handleDownload(doc);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Dokument wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
