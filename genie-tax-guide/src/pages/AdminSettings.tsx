import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // TODO: Add logic to fetch current key value if needed, maybe on load?

  const handleSaveKey = async () => {
    if (!apiKey) {
      toast({ title: "Error", description: "API Key cannot be empty.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add ADMIN authentication header here if implemented on backend
        },
        body: JSON.stringify({ key: 'geminiApiKey', value: apiKey }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save API key');
      }

      toast({
        title: "Success",
        description: "Gemini API Key saved successfully.",
      });
      // Optionally clear the input or fetch the new value

    } catch (error: any) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error Saving Key",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
            <CardDescription>
              Configure application settings. Currently only supports setting the Gemini API Key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <Input
                id="gemini-api-key"
                type="password" // Use password type to obscure the key
                placeholder="Enter your Google AI Gemini API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your key from Google AI Studio. Key will be stored securely.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveKey} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save API Key'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 