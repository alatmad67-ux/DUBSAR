import { Suspense } from 'react';
import PageClient from './page-client';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export default function Page({ params }: { params: any }) {
  return (
    <Suspense>
      <PageClient params={params} />
    </Suspense>
  );
}
