import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import SchedulePage from './pages/SchedulePage'; // или тот путь, где лежит файл
import { Calendar } from 'lucide-react'; // иконка для красоты

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </StrictMode>
);