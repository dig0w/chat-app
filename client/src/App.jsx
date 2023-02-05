import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Index from './pages/index';
import Chat from './pages/chat';
import Verify from './pages/verify';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="*" element={ <Navigate to="/" /> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;