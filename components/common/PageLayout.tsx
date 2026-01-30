import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import InteractiveBackground from '@/components/InteractiveBackground';

interface PageLayoutProps {
  children: ReactNode;
  showLiveMatches?: boolean;
  showLeagueTable?: boolean;
}

export default function PageLayout({ 
  children, 
  showLiveMatches = false,
  showLeagueTable = false 
}: PageLayoutProps) {
  return (
    <main className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <InteractiveBackground />
      </div>

      <div className="relative z-10">
        <Navbar />
        {children}
        {showLeagueTable && (
          <div className="pt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* LeagueTable will be imported where needed */}
            </div>
          </div>
        )}
        {showLiveMatches && (
          <div className="pt-12">
            {/* LiveMatches will be imported where needed */}
          </div>
        )}
        <Footer />
      </div>
    </main>
  );
}
