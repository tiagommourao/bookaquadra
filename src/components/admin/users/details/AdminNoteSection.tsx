
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PanelRight } from 'lucide-react';

interface AdminNoteSectionProps {
  adminNote: string;
  isAdminNoteVisible: boolean;
  onAdminNoteChange: (note: string) => void;
  onAdminNoteVisibilityChange: (visible: boolean) => void;
}

export const AdminNoteSection = ({
  adminNote,
  isAdminNoteVisible,
  onAdminNoteChange,
  onAdminNoteVisibilityChange,
}: AdminNoteSectionProps) => {
  return (
    <div className="pt-4 border-t">
      <h4 className="text-md font-semibold mb-3 flex items-center gap-1">
        <PanelRight className="h-4 w-4" /> Observação Administrativa
      </h4>
      
      <div className="space-y-2">
        {isAdminNoteVisible ? (
          <>
            <Textarea
              placeholder="Adicione uma observação sobre este usuário (visível apenas para administradores)..."
              value={adminNote}
              onChange={(e) => onAdminNoteChange(e.target.value)}
            />
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onAdminNoteVisibilityChange(false)}>
                Salvar Observação
              </Button>
            </div>
          </>
        ) : (
          <div 
            className="text-sm p-3 bg-muted/50 rounded-md min-h-[80px] cursor-pointer hover:bg-muted"
            onClick={() => onAdminNoteVisibilityChange(true)}
          >
            {adminNote ? adminNote : "Clique para adicionar uma observação sobre este usuário..."}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Esta observação é visível apenas para administradores.
        </div>
      </div>
    </div>
  );
};
