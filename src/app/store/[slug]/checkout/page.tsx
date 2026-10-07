import { Suspense } from 'react';
import PageClient from './page-client';

export function generateStaticParams() {
  return [{ slug: 'default' }];
}

export default function Page({ params }: { params: any }) {
  return (
    <Suspense>
      <PageClient params={params} />
    </Suspense>
  );
}
