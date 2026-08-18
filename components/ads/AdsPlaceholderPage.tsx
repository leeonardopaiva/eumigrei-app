import type React from 'react';
import { Card } from '@/components/ui';

export function AdsPlaceholderPage({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl"><Card><Card.Title>{title}</Card.Title><Card.Description className="mt-2">{description}</Card.Description>{children}</Card></div>;
}

