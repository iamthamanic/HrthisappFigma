/**
 * Step 3: Persönliche Daten
 * Adresse, Bank, Notfallkontakt, Kleidung, Sprachen
 */

import { useState } from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { MapPin, Plus, Trash2, Globe } from '../../icons/BrowoKoIcons';

interface Step3Props {
  formData: any;
  onUpdate: (updates: any) => void;
}

export default function Step3_PersoenlicheDaten({ formData, onUpdate }: Step3Props) {
  return (
    <div className="space-y-6">
      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street">Straße & Hausnummer *</Label>
            <Input
              id="street"
              value={formData.street || ''}
              onChange={(e) => onUpdate({ street: e.target.value })}
              placeholder="Musterstraße 123"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code">PLZ *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ''}
                onChange={(e) => onUpdate({ postal_code: e.target.value })}
                placeholder="12345"
                required
              />
            </div>
            <div>
              <Label htmlFor="city">Stadt *</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => onUpdate({ city: e.target.value })}
                placeholder="Berlin"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Land *</Label>
              <Input
                id="country"
                value={formData.country || ''}
                onChange={(e) => onUpdate({ country: e.target.value })}
                placeholder="Deutschland"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">Bundesland *</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => onUpdate({ state: e.target.value })}
                placeholder="Berlin"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bankverbindung */}
      <Card>
        <CardHeader>
          <CardTitle>Bankverbindung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="iban">IBAN *</Label>
            <Input
              id="iban"
              value={formData.iban || ''}
              onChange={(e) => onUpdate({ iban: e.target.value })}
              placeholder="DE89 3704 0044 0532 0130 00"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bic">BIC *</Label>
              <Input
                id="bic"
                value={formData.bic || ''}
                onChange={(e) => onUpdate({ bic: e.target.value })}
                placeholder="COBADEFFXXX"
                required
              />
            </div>
            <div>
              <Label htmlFor="bank_name">Bank *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name || ''}
                onChange={(e) => onUpdate({ bank_name: e.target.value })}
                placeholder="Commerzbank"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="account_holder">Kontoinhaber *</Label>
            <Input
              id="account_holder"
              value={formData.account_holder || ''}
              onChange={(e) => onUpdate({ account_holder: e.target.value })}
              placeholder="Max Mustermann"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Konfektionsgrößen */}
      <Card>
        <CardHeader>
          <CardTitle>Konfektionsgrößen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="shirt_size">Hemd *</Label>
              <Select
                value={formData.shirt_size || ''}
                onValueChange={(value) => onUpdate({ shirt_size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                  <SelectItem value="XXXL">XXXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pants_size">Hose *</Label>
              <Input
                id="pants_size"
                value={formData.pants_size || ''}
                onChange={(e) => onUpdate({ pants_size: e.target.value })}
                placeholder="32/34"
                required
              />
            </div>
            <div>
              <Label htmlFor="shoe_size">Schuh *</Label>
              <Input
                id="shoe_size"
                type="number"
                step="0.5"
                value={formData.shoe_size || ''}
                onChange={(e) => onUpdate({ shoe_size: e.target.value })}
                placeholder="42"
                required
              />
            </div>
            <div>
              <Label htmlFor="jacket_size">Jacke *</Label>
              <Select
                value={formData.jacket_size || ''}
                onValueChange={(value) => onUpdate({ jacket_size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                  <SelectItem value="XXL">XXL</SelectItem>
                  <SelectItem value="XXXL">XXXL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notfallkontakte */}
      <Card>
        <CardHeader>
          <CardTitle>Notfallkontakte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.emergency_contacts || []).map((contact: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Label>Kontakt {index + 1}</Label>
                {formData.emergency_contacts.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = formData.emergency_contacts.filter((_: any, i: number) => i !== index);
                      onUpdate({ emergency_contacts: updated });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Name *"
                  value={contact.name || ''}
                  onChange={(e) => {
                    const updated = [...formData.emergency_contacts];
                    updated[index] = { ...updated[index], name: e.target.value };
                    onUpdate({ emergency_contacts: updated });
                  }}
                  required
                />
                <Input
                  placeholder="Beziehung *"
                  value={contact.relationship || ''}
                  onChange={(e) => {
                    const updated = [...formData.emergency_contacts];
                    updated[index] = { ...updated[index], relationship: e.target.value };
                    onUpdate({ emergency_contacts: updated });
                  }}
                  required
                />
                <Input
                  type="tel"
                  placeholder="Telefon *"
                  value={contact.phone || ''}
                  onChange={(e) => {
                    const updated = [...formData.emergency_contacts];
                    updated[index] = { ...updated[index], phone: e.target.value };
                    onUpdate({ emergency_contacts: updated });
                  }}
                  required
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const updated = [...(formData.emergency_contacts || []), { name: '', relationship: '', phone: '' }];
              onUpdate({ emergency_contacts: updated });
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Notfallkontakt hinzufügen
          </Button>
          {(!formData.emergency_contacts || formData.emergency_contacts.length === 0) && (
            <p className="text-sm text-red-500">* Mindestens ein Notfallkontakt erforderlich</p>
          )}
        </CardContent>
      </Card>

      {/* Sprachkenntnisse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Sprachkenntnisse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(formData.language_skills || []).map((skill: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Label>Sprache {index + 1}</Label>
                {formData.language_skills.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = formData.language_skills.filter((_: any, i: number) => i !== index);
                      onUpdate({ language_skills: updated });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Sprache *"
                  value={skill.language || ''}
                  onChange={(e) => {
                    const updated = [...formData.language_skills];
                    updated[index] = { ...updated[index], language: e.target.value };
                    onUpdate({ language_skills: updated });
                  }}
                  required
                />
                <Select
                  value={skill.proficiency || ''}
                  onValueChange={(value) => {
                    const updated = [...formData.language_skills];
                    updated[index] = { ...updated[index], proficiency: value };
                    onUpdate({ language_skills: updated });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Niveau *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Anfänger</SelectItem>
                    <SelectItem value="A2">A2 - Grundkenntnisse</SelectItem>
                    <SelectItem value="B1">B1 - Fortgeschritten</SelectItem>
                    <SelectItem value="B2">B2 - Selbstständig</SelectItem>
                    <SelectItem value="C1">C1 - Fachkundig</SelectItem>
                    <SelectItem value="C2">C2 - Muttersprachlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const updated = [...(formData.language_skills || []), { language: '', proficiency: '' }];
              onUpdate({ language_skills: updated });
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Sprache hinzufügen
          </Button>
          {(!formData.language_skills || formData.language_skills.length === 0) && (
            <p className="text-sm text-red-500">* Mindestens eine Sprache erforderlich</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
