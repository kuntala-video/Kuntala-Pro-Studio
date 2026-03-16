'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudioLayout } from "@/components/studio-layout";
import { CreditCard } from "lucide-react";

export default function SubscribePage() {
  return (
    <StudioLayout>
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto bg-muted/50 p-4 rounded-full w-fit mb-4">
                    <CreditCard className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle className="text-3xl font-headline">Subscriptions</CardTitle>
                <CardDescription>
                    Automatic payments are currently disabled.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground text-center">
                    Please contact an administrator for plan upgrades and payment processing.
                </p>
            </CardContent>
        </Card>
    </StudioLayout>
  );
}
