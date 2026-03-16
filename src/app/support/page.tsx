'use client';

import { StudioLayout } from '@/components/studio-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy, Mail, MessageSquare, Phone, Youtube } from 'lucide-react';

export default function SupportPage() {
  return (
    <StudioLayout>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <LifeBuoy className="text-primary" />
            Customer Support
          </CardTitle>
          <CardDescription>
            We are available for technical help and account support.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
            <div className="p-6 bg-muted/50 rounded-lg space-y-4">
                 <div className="flex flex-col items-center">
                    <Mail className="h-6 w-6 text-muted-foreground mb-1"/>
                    <p className="font-semibold">Support Email</p>
                    <a href="mailto:kuntalavideo@gmail.com" className="text-primary">kuntalavideo@gmail.com</a>
                </div>
                 <div className="flex flex-col items-center">
                    <MessageSquare className="h-6 w-6 text-muted-foreground mb-1"/>
                    <p className="font-semibold">WhatsApp</p>
                    <p>9874491234</p>
                </div>
                 <div className="flex flex-col items-center">
                    <Phone className="h-6 w-6 text-muted-foreground mb-1"/>
                    <p className="font-semibold">Any other problem connect</p>
                    <p>9874491234</p>
                </div>
                <div className="flex flex-col items-center">
                    <Youtube className="h-6 w-6 text-muted-foreground mb-1"/>
                    <p className="font-semibold">YouTube Channel</p>
                    <a href="https://www.youtube.com/channel/UC_ywRusZvXRyoGlf4hSEJPA" target="_blank" rel="noopener noreferrer" className="text-primary">Visit our Channel</a>
                </div>
            </div>
            <Card className="p-4 bg-background">
                <p className="font-semibold">Available:</p>
                <p className="text-muted-foreground">9 AM to 4 PM</p>
                <p className="text-muted-foreground">Without Holiday</p>
            </Card>
        </CardContent>
      </Card>
    </StudioLayout>
  );
}
