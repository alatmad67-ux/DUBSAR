import { Suspense } from 'react';
import PageClient from './page-client';

export function generateStaticParams() {
  return [{ type: 'invoice', id: 'default' }];
}

export default function Page() {
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  );
}
