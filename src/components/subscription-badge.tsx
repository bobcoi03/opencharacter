'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SubscriptionBadgeProps {
  isPro: boolean;
}

export function SubscriptionBadge({ isPro }: SubscriptionBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1 bg-blue-900 text-primary rounded-full text-sm">
        {isPro ? "Pro" : "Free"}
      </div>
      {!isPro && (
        <Button
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          onClick={() => window.location.href = '/plans'}
        >
          Upgrade
        </Button>
      )}
    </div>
  );
} 