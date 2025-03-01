"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface ExpandableDescriptionProps {
  description: string;
}

export function ExpandableDescription({ description }: ExpandableDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="space-y-1">
      <div className={`text-neutral-400 prose prose-sm prose-neutral dark:prose-invert max-w-none text-xs ${expanded ? '' : 'line-clamp-3'}`}>
        <ReactMarkdown>{description}</ReactMarkdown>
      </div>
      {description.length > 150 && (
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs p-0 h-auto text-neutral-500 hover:text-neutral-300"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
} 