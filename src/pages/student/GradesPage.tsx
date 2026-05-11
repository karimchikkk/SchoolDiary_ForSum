import { useEffect, useState, useMemo } from 'react';
import {
    TrendingUp,
    BookOpen,
    AlertCircle,
    RefreshCw,
    Star,
    MinusCircle,
    LayoutGrid,
    Calendar,
    Zap,
    Search,
    Filter,
    ChevronRight,
    Download,
    Award,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    X,
    Info,
    CheckCircle2
} from 'lucide-react';

import { api, Grade } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// =========================================
// TYPES & INTERFACES
// =========================================

interface SubjectGroup {
    subjectId: number;
    subject: string;
    grades: Grade[];
    average: number;
    trend: 'up' | 'down' | 'stable';
    lastUpdate: string | null;
}

interface PageStats {
    totalGrades: number;
    bestSubject: string;
    worstSubject: string;
    median: number;
}

// =========================================
// UTILS & COLOR LOGIC (10-POINT SYSTEM)
// =========================================
const gradeUtils = {
    getColor: (value: number): string => {
        const v = Number(value);
        if (v >= 9) return 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500/20';
        if (v >= 7) return 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500/20';
        if (v >= 5) return 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500/20';
        if (v >= 3) return 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500/20';
        return 'bg-red-100 text-red-700 border-red-200 ring-red-500/20';
    },

    getAvgTextColor: (avg: number): string => {
        if (avg === 0) return 'text-slate-400';
        if (avg >= 8.5) return 'text-emerald-600';
        if (avg >= 6.5) return 'text-blue-600';
        if (avg >= 4.5) return 'text-amber-600';
        return 'text-red-600';
    },

    getAvgGradient: (avg: number): string => {
        if (avg === 0) return 'from-slate-400 to-slate-500';
        if (avg >= 8.5) return 'from-emerald-500 to-green-600 shadow-emerald-200';
        if (avg >= 6.5) return 'from-blue-500 to-indigo-600 shadow-blue-200';
        if (avg >= 4.5) return 'from-amber-500 to-orange-500 shadow-amber-200';
        return 'from-red-500 to-red-600 shadow-red-200';
    },

    calculateTrend: (grades: Grade[]): 'up' | 'down' | 'stable' => {
        if (grades.length < 2) return 'stable';
        const recent = Number(grades[0].value);
        const previous = Number(grades[1].value);
        if (recent > previous) return 'up';
        if (recent < previous) return 'down';
        return 'stable';
    }
};

// =========================================
// SUB-COMPONENTS
// =========================================

const StatCard = ({ title, value, icon: Icon, gradient, subValue }: any) => (
    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
            <Icon className="w-7 h-7" />
        </div>
        <div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">{title}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
                {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
            </div>
        </div>
    </div>
);

const SubjectModal = ({ group, onClose }: { group: SubjectGroup, onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 bg-gradient-to-r ${gradeUtils.getAvgGradient(group.average)} text-white flex justify-between items-start`}>
                <div>
                    <h4 className="text-3xl font-black mb-1">{group.subject}</h4>
                    <p className="opacity-80 font-medium">Полная история успеваемости</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                    {group.grades.map((grade, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border-2 ${gradeUtils.getColor(grade.value)}`}>
                                    {grade.value}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700">Оценка за занятие</p>
                                    <p className="text-xs text-slate-400 font-medium">{new Date(grade.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-white border rounded-full text-[10px] font-black text-slate-400 uppercase tracking-tighter">Verified</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-center">
                <button onClick={onClose} className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all active:scale-95">
                    Закрыть отчет
                </button>
            </div>
        </div>
    </div>
);

// =========================================
// MAIN PAGE COMPONENT
// =========================================

export default function GradesPage() {
    const { user } = useAuth();

    // State
    const [groups, setGroups] = useState<SubjectGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'high' | 'low'>('all');
    const [selectedGroup, setSelectedGroup] = useState<SubjectGroup | null>(null);
    const [currentClassName, setClassName] = useState('');


    // =========================================
    // DATA LOADING LOGIC
    // =========================================

    const loadData = async () => {
        // Проверяем userId или id для гибкости
        const currentId = user?.userId || (user as any)?.id;
        if (!currentId) return;

        setLoading(true);
        setError('');

        try {
            // 1. Загружаем всё параллельно: предметы, оценки и твою таблицу классов
            const [subjectsData, gradesData, classesData] = await Promise.all([
                api.subjects.all().catch(() => []),
                api.grades.getByUser(currentId).catch(() => []),
                api.classes.all().catch(() => [])
            ]);

            // 2. Ищем название твоего класса в таблице по classId из профиля
            if (Array.isArray(classesData)) {
                const userClassId = Number(user?.classId);
                const myClass = classesData.find((c: any) => c.id === userClassId);
                if (myClass) {
                    setClassName(myClass.name); // Установит "10Б", если в БД под id 8 лежит именно оно
                }
            }

            const groupsMap = new Map<string, SubjectGroup>();

            // 1. Инициализация из списка предметов
            if (Array.isArray(subjectsData)) {
                subjectsData.forEach((sub: any) => {
                    if (!sub.name) return;
                    groupsMap.set(sub.name, {
                        subjectId: sub.id,
                        subject: sub.name,
                        grades: [],
                        average: 0,
                        trend: 'stable',
                        lastUpdate: null
                    });
                });
            }

            // 2. Обработка полученных оценок
            if (Array.isArray(gradesData)) {
                gradesData.forEach((g: any, index: number) => {
                    const subjectName = g.subjectName || g.SubjectName || g.subject?.name || 'Неизвестный предмет';

                    if (!groupsMap.has(subjectName)) {
                        groupsMap.set(subjectName, {
                            subjectId: index + 5000,
                            subject: String(subjectName),
                            grades: [],
                            average: 0,
                            trend: 'stable',
                            lastUpdate: null
                        });
                    }
                    groupsMap.get(subjectName)!.grades.push(g);
                });
            }

            // 3. Расчет аналитики
            const processed = Array.from(groupsMap.values())
                .filter(group => group.subject && group.subject.trim() !== '' && group.subject !== 'undefined')
                .map(group => {
                    const sortedGrades = [...group.grades].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );

                    const validGrades = sortedGrades.filter(g => !isNaN(Number(g.value)));

                    const avg = validGrades.length > 0
                        ? validGrades.reduce((sum, g) => sum + Number(g.value), 0) / validGrades.length
                        : 0;

                    return {
                        ...group,
                        grades: sortedGrades,
                        average: Number(avg.toFixed(2)),
                        trend: gradeUtils.calculateTrend(validGrades),
                        lastUpdate: sortedGrades.length > 0 ? sortedGrades[0].date : null
                    };
                });

            setGroups(processed.sort((a, b) => a.subject.localeCompare(b.subject)));
        } catch (err) {
            console.error('System Load Error:', err);
            setError('Системная ошибка при получении данных ведомости');
        } finally {
            setTimeout(() => setLoading(false), 600);
        }
    };


    useEffect(() => {
        loadData();
    }, [user]);

    // =========================================
    // COMPUTED ANALYTICS
    // =========================================

    const filteredGroups = useMemo(() => {
        return groups.filter(g => {
            const matchesSearch = g.subject.toLowerCase().includes(searchQuery.toLowerCase());
            if (filterType === 'high') return matchesSearch && g.average >= 8;
            if (filterType === 'low') return matchesSearch && g.average > 0 && g.average < 5;
            return matchesSearch;
        });
    }, [groups, searchQuery, filterType]);

    const stats: PageStats = useMemo(() => {
        const withGrades = groups.filter(g => g.grades.length > 0);
        if (withGrades.length === 0) return { totalGrades: 0, bestSubject: '—', worstSubject: '—', median: 0 };

        const sortedByAvg = [...withGrades].sort((a, b) => b.average - a.average);
        const allValues = withGrades.flatMap(g => g.grades.map(gr => Number(gr.value))).sort((a, b) => a - b);

        return {
            totalGrades: withGrades.reduce((s, g) => s + g.grades.length, 0),
            bestSubject: sortedByAvg[0].subject,
            worstSubject: sortedByAvg[sortedByAvg.length - 1].subject,
            median: allValues[Math.floor(allValues.length / 2)] || 0
        };
    }, [groups]);

    const overallAvg = useMemo(() => {
        const items = groups.filter(g => g.grades.length > 0);
        return items.length > 0 ? items.reduce((s, g) => s + g.average, 0) / items.length : 0;
    }, [groups]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-8">
                <div className="relative">
                    <div className="w-24 h-24 border-[6px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    <Zap className="absolute inset-0 m-auto w-10 h-10 text-blue-600 animate-pulse" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Загрузка системы</h2>
                    <p className="text-slate-400 font-bold text-sm">Синхронизация данных с сервером успеваемости...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 font-sans text-slate-900 bg-slate-50/30">

            {/* TOP ACTION BAR */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center shadow-2xl rotate-3">
                        <Award className="w-10 h-10 text-yellow-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tighter text-slate-800">Учебный Профиль</h1>
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                        <p className="text-slate-400 font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {user?.fullName || 'Авторизованный пользователь'}
                            {user?.className && ` • ${user.className}`}
                            {` • Семестр 2026`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <Download className="w-4 h-4" /> Отчет PDF
                    </button>
                    <button onClick={loadData} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all group">
                        <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-1000" />
                    </button>
                </div>
            </header>

            {/* DASHBOARD STATS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Средний GPA"
                    value={overallAvg.toFixed(2)}
                    icon={Star}
                    gradient={gradeUtils.getAvgGradient(overallAvg)}
                    subValue="/ 10.0"
                />
                <StatCard
                    title="Активные курсы"
                    value={groups.length}
                    icon={BookOpen}
                    gradient="from-blue-500 to-indigo-600"
                />
                <StatCard
                    title="Всего оценок"
                    value={stats.totalGrades}
                    icon={TrendingUp}
                    gradient="from-violet-500 to-purple-600"
                    subValue={`мед. ${stats.median}`}
                />
                <StatCard
                    title="Топ предмет"
                    value={stats.bestSubject.split(' ')[0]}
                    icon={Award}
                    gradient="from-emerald-500 to-teal-600"
                />
            </section>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Поиск по дисциплинам..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-600"
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl w-full md:w-auto">
                    {(['all', 'high', 'low'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterType === type ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {type === 'all' ? 'Все' : type === 'high' ? 'Топ' : 'Риск'}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                        <Search className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest">Ничего не найдено</p>
                </div>
            ) : (
                <main className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {filteredGroups.map(group => {
                        const hasGrades = group.grades.length > 0;
                        const isAtRisk = hasGrades && group.average < 5;

                        return (
                            <article
                                key={group.subjectId}
                                onClick={() => hasGrades && setSelectedGroup(group)}
                                className={`group bg-white rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col cursor-pointer overflow-hidden
                                ${isAtRisk ? 'border-red-100 bg-red-50/10' : 'border-white hover:border-blue-200 shadow-sm hover:shadow-2xl hover:shadow-blue-100/50'}`}
                            >
                                <div className="p-8 pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors`}>
                                            <LayoutGrid className={`w-6 h-6 ${isAtRisk ? 'text-red-400' : 'text-blue-500'}`} />
                                        </div>
                                        {hasGrades && (
                                            <div className="text-right">
                                                <div className={`text-4xl font-black leading-none ${gradeUtils.getAvgTextColor(group.average)}`}>
                                                    {group.average.toFixed(1)}
                                                </div>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    {group.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                                                    {group.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Avg Score</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                        {group.subject}
                                    </h3>

                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${hasGrades ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-600'}`}>
                                            {hasGrades ? <CheckCircle2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                                            {hasGrades ? `${group.grades.length} Оценок` : 'Нет данных'}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-8 py-6 flex-grow">
                                    {hasGrades ? (
                                        <div className="space-y-6">
                                            <div className="flex flex-wrap gap-2.5">
                                                {group.grades.slice(0, 8).map((grade, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-lg shadow-sm transition-all hover:scale-110 hover:-rotate-6 ${gradeUtils.getColor(grade.value)}`}
                                                    >
                                                        {grade.value}
                                                    </div>
                                                ))}
                                                {group.grades.length > 8 && (
                                                    <div className="w-11 h-11 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                                                        +{group.grades.length - 8}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${gradeUtils.getAvgGradient(group.average)}`}
                                                    style={{ width: `${Math.min(group.average * 10, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-50 rounded-[2rem] opacity-40">
                                            <MinusCircle className="w-12 h-12 text-slate-300 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ожидание данных</p>
                                        </div>
                                    )}
                                </div>

                                {hasGrades && (
                                    <div className="mt-auto px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between group-hover:bg-blue-50/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Обновлено: {group.lastUpdate ? new Date(group.lastUpdate).toLocaleDateString() : '—'}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </main>
            )}

            {selectedGroup && (
                <SubjectModal
                    group={selectedGroup}
                    onClose={() => setSelectedGroup(null)}
                />
            )}

            {error && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-red-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl animate-bounce">
                    <AlertCircle className="w-6 h-6" />
                    <p className="font-black uppercase text-xs tracking-widest">{error}</p>
                </div>
            )}

            <footer className="pt-10 pb-20 text-center">
                <p className="text-slate-300 font-bold text-[10px] uppercase tracking-[0.3em]">
                    University Grade Analysis System © 2026 • Build 4.0.1
                </p>
            </footer>
        </div>
    );
}