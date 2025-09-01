import React, { useState } from 'react';
import Header from './components/Header';
import FitBoardPage from './pages/FitBoardPage';
import EnhancerPage from './pages/EnhancerPage';

export type Page = 'fitboard' | 'enhancer';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('fitboard');

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-grow p-4 container mx-auto h-[calc(100vh-81px)]">
        {activePage === 'fitboard' && <FitBoardPage />}
        {activePage === 'enhancer' && <EnhancerPage />}
      </main>
    </div>
  );
};

export default App;