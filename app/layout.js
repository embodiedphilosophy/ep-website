import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Embodied Philosophy — An online school for the contemplative life',
  description: 'Yoga philosophy, meditation, and the world’s contemplative traditions, for thinking practitioners.',
  metadataBase: new URL('https://www.embodiedphilosophy.com'),
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#FAF5EB' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
