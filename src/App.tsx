import { useState } from 'react';
import { RulesPage } from './components/RulesPage';
import { TestPage } from './components/TestPage';
import { ModelsShowcasePage } from './components/ModelsShowcasePage';
import { ModelsPage } from './components/ModelsPage';

type Tab = 'test' | 'models-showcase' | 'models' | 'rules';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('test');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 OpenRouter Test UI</h1>
        <p className="app-subtitle">Test OpenRouter Gateway API with custom rules and prompts</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
        >
          🚀 Test Prompt
        </button>
        <button
          className={`tab-button ${activeTab === 'models-showcase' ? 'active' : ''}`}
          onClick={() => setActiveTab('models-showcase')}
        >
          🎬 Models Showcase
        </button>
        <button
          className={`tab-button ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          🤖 Models
        </button>
        <button
          className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          📝 Rules Template
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'test' && <TestPage />}
        {activeTab === 'models-showcase' && <ModelsShowcasePage />}
        {activeTab === 'models' && <ModelsPage />}
        {activeTab === 'rules' && <RulesPage />}
      </main>

      <footer className="app-footer">
        <p>
          OpenRouter Gateway Test Client • 
          <a href="https://usageflows.info" target="_blank" rel="noopener noreferrer">
            API Documentation
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
