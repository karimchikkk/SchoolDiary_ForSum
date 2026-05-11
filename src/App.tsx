import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import GradesPage from './pages/student/GradesPage';
import JournalPage from './pages/teacher/JournalPage';
import AdminPage from './pages/admin/AdminPage';
import Layout from './components/Layout';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { BookOpen, Calendar, LayoutDashboard } from 'lucide-react';
import SchedulePage from './pages/student/SchedulePage';

enum UserRole {
    Student = 0,
    Teacher = 1,
    Admin = 2,
}



function AppContent() {
    const { user } = useAuth();

    if (!user) return <LoginPage />;

    switch (user.role) {
        case UserRole.Student:
            return (
                <Layout
                    tabs={[
                        { id: 'grades', label: 'Оценки', icon: <BookOpen className="w-4 h-4" /> },
                        { id: 'schedule', label: 'Расписание', icon: <Calendar className="w-4 h-4" /> }
                    ]}
                >
                    <Routes>
                        <Route path="/grades" element={<GradesPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        {/* Редирект по умолчанию на оценки */}
                        <Route path="*" element={<Navigate to="/grades" replace />} />
                    </Routes>
                </Layout>
            );

        case UserRole.Teacher:
            return (
                <Layout
                    tabs={[
                        { id: 'journal', label: 'Журнал', icon: <BookOpen className="w-4 h-4" /> },
                        { id: 'schedule', label: 'Расписание', icon: <Calendar className="w-4 h-4" /> }
                    ]}
                >
                    <Routes>
                        <Route path="/journal" element={<JournalPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="*" element={<Navigate to="/journal" replace />} />
                    </Routes>
                </Layout>
            );

        case UserRole.Admin:
            return (
                <Layout
                    tabs={[
                        { id: 'admin', label: 'Панель управления', icon: <LayoutDashboard className="w-4 h-4" /> },
                        { id: 'schedule', label: 'Расписание', icon: <Calendar className="w-4 h-4" /> }
                    ]}
                >
                    <Routes>
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/schedule" element={<SchedulePage />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </Layout>
            );

        default:
            return <LoginPage />;
    }
}

export default function App() {
    return (
        <BrowserRouter> {/* Обертка должна быть САМОЙ ПЕРВОЙ */}
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}