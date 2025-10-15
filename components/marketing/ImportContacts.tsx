
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ImportContacts = () => {
  const { toast } = useToast();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Import Contacts</h3>
            <p className="text-muted-foreground mb-4">
              This feature is coming soon! You will be able to import contacts from CSV files or enter them manually.
            </p>
            <Button
              onClick={() => {
                toast({
                  title: "Feature in development",
                  description: "The contact import feature is currently being implemented."
                });
              }}
            >
              Check back soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportContacts;
