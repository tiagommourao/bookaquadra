
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mail, MapPin } from 'lucide-react';
import { UserData } from '../AdminUserDetails';

interface UserContactInfoProps {
  userData: UserData;
  isEditMode: boolean;
}

export function UserContactInfo({ userData, isEditMode }: UserContactInfoProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold flex items-center gap-1">
        <Mail className="h-4 w-4" /> Informações de Contato
      </h4>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">E-mail</Label>
          {isEditMode ? (
            <Input defaultValue={userData.email} />
          ) : (
            <div className="text-sm">{userData.email}</div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Telefone</Label>
          {isEditMode ? (
            <Input defaultValue={userData.phone} />
          ) : (
            <div className="text-sm">{userData.phone || 'Não informado'}</div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Localização</Label>
          {isEditMode ? (
            <div className="grid grid-cols-2 gap-2">
              <Input defaultValue={userData.city} placeholder="Cidade" />
              <Input defaultValue={userData.neighborhood} placeholder="Bairro" />
            </div>
          ) : (
            <div className="text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> 
              {userData.city && userData.neighborhood ? `${userData.city}/${userData.neighborhood}` : 'Não informado'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
