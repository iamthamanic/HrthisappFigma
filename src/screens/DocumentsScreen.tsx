import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileText, Search, Calendar, X } from '../components/icons/HRTHISIcons';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import EmptyState from '../components/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { DocumentCard } from '../components/HRTHIS_DocumentCard';
import { DocumentCategoryCards } from '../components/HRTHIS_DocumentCategoryCards';
import { DocumentViewDialog } from '../components/HRTHIS_DocumentViewDialog';
import { useDocumentsScreen } from '../hooks/HRTHIS_useDocumentsScreen';

export default function DocumentsScreen() {
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
    handleView,
    handleDownload,
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Dokumente werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dokumente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Deine persönlichen Dokumente - Hochgeladen von Administratoren
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
        <TabsList>
          <TabsTrigger value="all">Alle Dokumente</TabsTrigger>
          <TabsTrigger value="recent">Zuletzt hinzugefügt</TabsTrigger>
          <TabsTrigger value="important">Wichtig</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
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

        <TabsContent value="recent" className="mt-6">
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

        <TabsContent value="important" className="mt-6">
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
