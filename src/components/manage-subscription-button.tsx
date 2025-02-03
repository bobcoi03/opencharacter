"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handlePortalAccess() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/subscriptions/customer-portal", {
        method: "POST",
      });
      const data = await response.json() as { url: string };
      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to access customer portal:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      className="text-xs text-white font-light rounded-lg p-4 w-48"
      variant="outline"
      onClick={handlePortalAccess}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center gap-1">
          Loading...
        </span>
      ) : (
        "MANAGE SUBSCRIPTION"
      )}
    </Button>
  );
} 