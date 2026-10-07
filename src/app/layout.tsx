
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { CartProvider } from "@/context/cart-context";
import { TenantProvider } from "@/hooks/use-tenant";
import { FirebaseErrorListener } from "@/components/firebase/firebase-error-listener";
import { GlobalErrorCatcher } from "@/components/global-error-catcher";

export const metadata: Metadata = {
  title: 'دوبسار - DUBSAR | منصة التجارة السحابية المتكاملة',
  description: 'دوبسار: أول من دوّن التجارة، واليوم أول من يقودها سحابياً. نظام متكامل لإدارة المخازن، المبيعات، والورش التقنية.',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DUBSAR',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A365D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-almarai antialiased selection:bg-primary/20 overflow-x-hidden bg-background">
        <GlobalErrorCatcher />
        <FirebaseClientProvider>
          <TenantProvider>
            <CartProvider>
              <FirebaseErrorListener />
              {children}
              <Toaster />
            </CartProvider>
          </TenantProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
