import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, User as UserIcon, Calendar, Filter, GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';

interface ScheduleItem {
    id: number;
    subjectName: string;
    teacherName: string;
    startTime: string;
    endTime: string;
    lessonNumber: number;
    dayOfWeek: number;
    classId: string;
}
export default function SchedulePage() {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState<string>("1");
    const [className, setClassName] = useState<string>('');

    const dayNames: Record<number, string> = {
        1: "Понедельник", 2: "Вторник", 3: "Среда",
        4: "Четверг", 5: "Пятница", 6: "Суббота", 7: "Воскресенье"
    };

    // Мемоизируем текущий день, чтобы не вычислять при каждом рендере
    const currentDay = useMemo(() => {
        const day = new Date().getDay();
        return day === 0 ? 7 : day;
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchSchedule = async () => {
            setLoading(true);
            try {
                // 1. Используем твой api вместо кривого fetch
                const classesData = await api.classes.all().catch(() => []);

                if (Array.isArray(classesData) && user?.classId) {
                    const myClass = classesData.find((c: any) => c.id === Number(user.classId));
                    if (myClass) setClassName(myClass.name);
                }

                // 2. Дальше твой существующий код загрузки расписания
                let url = "";
                if (user.role === 1) {
                    const name = encodeURIComponent(user.fullName || "");
                    url = `http://localhost:5213/api/schedules/by-teacher/${name}`;
                } else if (user.role === 2) {
                    url = `http://localhost:5213/api/schedules/by-class/${selectedClassId}`;
                } else {
                    // Используем ID из токена (8)
                    const classId = user.classId || "1";
                    url = `http://localhost:5213/api/schedules/by-class/${classId}`;
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
                const data = await res.json();

                setSchedule(data.sort((a: ScheduleItem, b: ScheduleItem) => a.lessonNumber - b.lessonNumber));
            } catch (err) {
                console.error("[SchedulePage] Ошибка:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [user?.role, user?.fullName, user?.classId, selectedClassId]);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                <div className="text-slate-400 font-medium animate-pulse">Загрузка расписания...</div>
            </div>
        );
    }

    const days = [1, 2, 3, 4, 5, 6];

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 pb-20">
            {/* ШАПКА */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Calendar className="text-blue-600 w-8 h-8" />
                        Расписание
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {user?.role === 1 ? `Ваши занятия: ${user.fullName}` : `Просмотр учебного плана`}
                    </p>
                </div>

                {user?.role === 2 && (
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <Filter className="w-4 h-4 text-slate-400 ml-2" />
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 cursor-pointer pr-8"
                        >
                        </select>
                    </div>
                )}

                {user?.role !== 2 && user && (
                    <div className="flex gap-2">
                        <span className="...">
                            <GraduationCap className="w-4 h-4" />
                            {user.role === 1 ? "Преподаватель" : `Класс ${className || "Загрузка..."}`}
                        </span>
                    </div>
                )}
            </div>

            {schedule.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg font-medium">Занятий не найдено</p>
                </div>
            ) : (
                <div className="grid gap-10">
                    {days.map(dayNum => {
                        const dayLessons = schedule.filter(s => s.dayOfWeek === dayNum);
                        if (dayLessons.length === 0) return null;

                        const isToday = dayNum === currentDay;

                        return (
                            <div key={dayNum} className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <h2 className={`text-xl font-black uppercase tracking-wider ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                                            {dayNames[dayNum] || "День недели"}
                                        </h2>
                                        {isToday && (
                                            <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">Сегодня</span>
                                        )}
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">{dayLessons.length} ур.</span>
                                </div>

                                <div className="grid gap-3">
                                    {dayLessons.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex items-center justify-between hover:shadow-md ${isToday ? 'border-blue-100 ring-1 ring-blue-50' : 'border-slate-100'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {item.lessonNumber}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 leading-tight">{item.subjectName}</h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <UserIcon className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs text-slate-500">
                                                            {user?.role === 1 ? `Класс ID: ${item.classId}` : (item.teacherName || '—')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg text-xs ${isToday ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'}`}>
                                                <Clock className="w-3.5 h-3.5" />
                                                {item.startTime.slice(0, 5)} — {item.endTime.slice(0, 5)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}