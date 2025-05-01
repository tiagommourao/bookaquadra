
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PersonalInfoStepProps {
  onNext: () => void;
}

const PersonalInfoStep = ({ onNext }: PersonalInfoStepProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input 
            type="text" 
            id="name" 
            placeholder="Seu nome" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            type="email" 
            id="email" 
            placeholder="seuemail@exemplo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button onClick={onNext}>Próximo</Button>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoStep;
