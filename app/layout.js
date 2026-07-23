import './globals.css';
import RootErrorBoundary from '@/components/RootErrorBoundary';
import SmoothScroll from '@/components/SmoothScroll';

export const metadata = {
  title: 'Mr. Cleaner Mobile Detailing | Premium Car Care in Texas',
  description: 'Pro mobile detailing services in Texas. Book your car wash, interior detail, or ceramic coating in 60 seconds with Maya, our AI assistant.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <SmoothScroll>
          <RootErrorBoundary>
            {children}
          </RootErrorBoundary>
        </SmoothScroll>
      </body>
    </html>
  );
}
