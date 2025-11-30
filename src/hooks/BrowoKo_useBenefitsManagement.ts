import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

export interface Benefit {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * BENEFITS MANAGEMENT HOOK
 * ========================
 * Domain: BrowoKo (Benefits)
 * 
 * Manages company benefits (CRUD operations)
 */
export function useBenefitsManagement(organizationId: string | null) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [formData, setFormData] = useState<Partial<Benefit>>({
    title: '',
    description: '',
    icon: '🎁',
    color: 'blue',
    available: true,
  });

  // Load all benefits
  const loadBenefits = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('benefits')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBenefits(data || []);
    } catch (error: any) {
      console.error('Error loading benefits:', error);
      toast.error('Fehler beim Laden der Benefits');
    } finally {
      setLoading(false);
    }
  };

  // Create new benefit
  const createBenefit = async (benefit: Omit<Benefit, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('benefits')
        .insert({
          ...benefit,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      setBenefits((prev) => [data, ...prev]);
      toast.success('Benefit erfolgreich erstellt');
    } catch (error: any) {
      console.error('Error creating benefit:', error);
      toast.error('Fehler beim Erstellen des Benefits');
      throw error;
    }
  };

  // Update benefit
  const updateBenefit = async (benefitId: string, updates: Partial<Benefit>) => {
    try {
      const { data, error } = await supabase
        .from('benefits')
        .update(updates)
        .eq('id', benefitId)
        .select()
        .single();

      if (error) throw error;

      setBenefits((prev) =>
        prev.map((b) => (b.id === benefitId ? data : b))
      );
      toast.success('Benefit erfolgreich aktualisiert');
    } catch (error: any) {
      console.error('Error updating benefit:', error);
      toast.error('Fehler beim Aktualisieren des Benefits');
      throw error;
    }
  };

  // Delete benefit
  const deleteBenefit = async (benefitId: string) => {
    try {
      const { error } = await supabase
        .from('benefits')
        .delete()
        .eq('id', benefitId);

      if (error) throw error;

      setBenefits((prev) => prev.filter((b) => b.id !== benefitId));
      toast.success('Benefit erfolgreich gelöscht');
    } catch (error: any) {
      console.error('Error deleting benefit:', error);
      toast.error('Fehler beim Löschen des Benefits');
      throw error;
    }
  };
  
  // Dialog handlers
  const handleOpenDialog = (benefit?: Benefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setFormData(benefit);
    } else {
      setEditingBenefit(null);
      setFormData({
        title: '',
        description: '',
        icon: '🎁',
        color: 'blue',
        available: true,
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBenefit(null);
    setFormData({
      title: '',
      description: '',
      icon: '🎁',
      color: 'blue',
      available: true,
    });
  };
  
  const handleSubmit = async () => {
    try {
      if (editingBenefit) {
        await updateBenefit(editingBenefit.id, formData);
      } else {
        await createBenefit(formData as Omit<Benefit, 'id' | 'organization_id' | 'created_at' | 'updated_at'>);
      }
      handleCloseDialog();
      await loadBenefits();
    } catch (error) {
      // Error already toasted in create/update functions
    }
  };
  
  const handleDelete = async (benefitId: string) => {
    if (!confirm('Möchtest du dieses Benefit wirklich löschen?')) return;
    await deleteBenefit(benefitId);
  };

  // Load benefits on mount
  useEffect(() => {
    loadBenefits();
  }, [organizationId]);

  return {
    benefits,
    loading,
    loadBenefits,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    isDialogOpen,
    setIsDialogOpen,
    editingBenefit,
    setEditingBenefit,
    formData,
    setFormData,
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
    handleDelete,
  };
}