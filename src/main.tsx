import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Gatekeeper } from './components/Gatekeeper'
import { hasApiKey } from './api/keyStore'

function Root() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(hasApiKey());
  }, []);

  if (!unlocked) {
    return <Gatekeeper onUnlock={() => setUnlocked(true)} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
