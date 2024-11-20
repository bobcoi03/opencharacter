"use client"

import { useState } from 'react';

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
}

const ExpandableDescription = ({ description, maxLength = 500 }: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = description.length > maxLength;

  const displayText = isExpanded ? description : 
    shouldTruncate ? `${description.slice(0, maxLength)}...` : description;

  return (
    <div className="mt-3 text-black dark:text-white text-sm">
      <p>{displayText}</p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default ExpandableDescription;