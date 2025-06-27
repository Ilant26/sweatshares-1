import React from 'react';
import { ResponseItem } from './response-item';
import type { ResponseItemProps } from './response-item';

export interface ResponseListProps {
  responses: ResponseItemProps['response'][];
  onSelectResponse?: (responseId: string) => void;
}

export function ResponseList({ responses, onSelectResponse }: ResponseListProps) {
  if (!responses.length) {
    return <div className="p-6 text-center text-muted-foreground">No responses yet.</div>;
  }
  return (
    <div className="space-y-4">
      {responses.map((response) => (
        <ResponseItem key={response.id} response={response} onSelect={onSelectResponse} />
      ))}
    </div>
  );
} 