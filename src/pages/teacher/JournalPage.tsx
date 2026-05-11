import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, RefreshCw, AlertCircle, Check, ChevronDown, X } from 'lucide-react';
import { api, Subject, ClassItem, JournalEntry, User, Grade } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

function gradeColor(value: number, isAbsent?: boolean) {
    if (isAbsent) return 'bg-slate-200 text-slate-600 border-slate-300';
    if (value >= 9) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (value >= 6) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (value >= 4) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (value >= 3) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
}

export default function JournalPage() {
    const auth = useAuth();
    const user = auth?.user;

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [journal, setJournal] = useState<JournalEntry[]>([]);
    const [selSubject, setSelSubject] = useState<number | ''>('');
    const [selClass, setSelClass] = useState<number | ''>('');
    const [journalLoading, setJournalLoading] = useState(false);
    const [journalError, setJournalError] = useState('');

    const [addStudentId, setAddStudentId] = useState<number | ''>('');
    const [addValue, setAddValue] = useState<number | 'Н' | ''>('');
    const [addLoading, setAddLoading] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);
    const [addError, setAddError] = useState('');

    useEffect(() => {
        Promise.all([
            api.subjects.all(),
            api.classes.all(),
            api.users.students(),
        ]).then(([s, c, st]) => {
            setSubjects(s);
            setClasses(c);
            setStudents(st);
        }).catch((err) => console.error("Ошибка загрузки:", err));
    }, [user]);

    async function loadJournal() {
        if (!selSubject || !selClass) return;
        setJournalLoading(true);
        setJournalError('');
        try {
            const data = await api.journal.get(Number(selClass), Number(selSubject));
            setJournal(data);
        } catch (err) {
            setJournalError(err instanceof Error ? err.message : 'Ошибка загрузки');
        } finally {
            setJournalLoading(false);
        }
    }

    useEffect(() => {
        loadJournal();
        setAddStudentId('');
    }, [selSubject, selClass]);

    async function handleDeleteGrade(gradeId: number) {
        if (!window.confirm('Удалить эту оценку/отметку?')) return;
        try {
            await api.grades.delete(gradeId);
            loadJournal();
        } catch (err) {
            alert('Ошибка при удалении');
        }
    }

    const handleAddGrade = async (e: React.FormEvent) => {

        e.preventDefault();

        if (!selSubject || !selClass || !addStudentId) {
            setAddError('Заполните все поля');
            return;
        }

        if (addValue === '') {
            setAddError("Выберите оценку или 'Н'");
            return;
        }

        setAddLoading(true);
        setAddError('');
        setAddSuccess(false);

        try {

            const today = new Date().toISOString().split('T')[0];

            // Загружаем свежие данные
            const freshJournal = await api.journal.get(
                Number(selClass),
                Number(selSubject)
            );

            const studentRow = freshJournal.find(
                s => s.studentId === Number(addStudentId)
            );

            // Ищем ВСЕ оценки за сегодня
            const todayGrades = studentRow?.grades.filter(
                g => g.date.split('T')[0] === today
            ) || [];

            const isAbsent = addValue === 'Н';

            const payload = {
                userId: Number(addStudentId),
                subjectId: Number(selSubject),
                value: isAbsent ? 1 : Number(addValue),
                isAbsent,
                date: today
            };

            // ЕСЛИ ЕСТЬ ОЦЕНКА — ОБНОВЛЯЕМ
            if (todayGrades.length > 0) {

                // Берем последнюю
                const latestGrade =
                    todayGrades[todayGrades.length - 1];

                await api.grades.update(
                    latestGrade.id,
                    payload
                );

                // Удаляем остальные дубликаты
                const duplicates = todayGrades.filter(
                    g => g.id !== latestGrade.id
                );

                for (const dup of duplicates) {
                    try {
                        await api.grades.delete(dup.id);
                    } catch { }
                }

            } else {

                // Если оценки нет — создаем
                await api.grades.add(payload);
            }

            await loadJournal();

            setAddSuccess(true);

            setTimeout(() => {
                setAddSuccess(false);
                setAddValue('');
                setAddStudentId('');
            }, 1000);

        } catch (err) {

            console.error(err);

            setAddError(
                err instanceof Error
                    ? err.message
                    : 'Ошибка сохранения'
            );

        } finally {
            setAddLoading(false);
        }
    };

    const allDates = Array.from(
        new Set(journal.flatMap(e => e.grades.map(g => g.date.split('T')[0])))
    ).sort();

    if (!auth) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Журнал</h2>
                <p className="text-slate-500 text-sm mt-0.5">Управление успеваемостью и пропусками</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Класс</label>
                        <select
                            value={selClass}
                            onChange={e => setSelClass(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                        >
                            <option value="">— Выберите класс —</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Предмет</label>
                        <select
                            value={selSubject}
                            onChange={e => setSelSubject(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                        >
                            <option value="">— Выберите предмет —</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <form onSubmit={handleAddGrade}>
                    <div className="grid lg:grid-cols-3 gap-6 mb-4">
                        <div className="lg:col-span-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Ученик</label>
                            <select
                                value={addStudentId}
                                onChange={e => setAddStudentId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                                disabled={!selClass}
                            >
                                <option value="">{selClass ? '— Выберите ученика —' : 'Сначала выберите класс'}</option>
                                {students
                                    .filter(s => Number(s.classId) === Number(selClass))
                                    .map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)
                                }
                            </select>
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">Оценка или пропуск</label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setAddValue(v)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${addValue === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setAddValue('Н')}
                                    className={`px-5 h-10 rounded-xl text-sm font-bold border-2 transition-all ${addValue === 'Н' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-300'}`}
                                >
                                    Н
                                </button>
                            </div>
                        </div>
                    </div>
                    {addError && <div className="text-red-500 text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{addError}</div>}
                    <button
                        type="submit"
                        disabled={addLoading || addSuccess || !selSubject || !selClass}
                        className={`px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${addSuccess ? 'bg-emerald-500 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'} shadow-lg`}
                    >
                        {addLoading ? 'Запись...' : addSuccess ? 'Готово!' : 'Сохранить изменения'}
                    </button>
                </form>
            </div>

            {(selClass && selSubject) && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-semibold text-slate-700">Электронная ведомость</h3>
                        <button onClick={loadJournal} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><RefreshCw className="w-4 h-4" /></button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    <th className="px-6 py-4 font-semibold text-slate-500">Ученик</th>
                                    {allDates.map(d => (
                                        <th key={d} className="px-3 py-4 font-semibold text-slate-500 text-center">
                                            {new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 font-semibold text-slate-500 text-center">Средний балл</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {journal.map(entry => {
                                    const realGrades = entry.grades.filter(g => !g.isAbsent && g.value > 0);
                                    const avg = realGrades.length > 0
                                        ? realGrades.reduce((s, g) => s + g.value, 0) / realGrades.length
                                        : null;

                                    return (
                                        <tr key={entry.studentId} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-700">{entry.studentName}</td>
                                            {allDates.map(d => {
                                                const sameDayGrades = entry.grades.filter(
                                                    x => x.date.split('T')[0] === d
                                                );

                                                const g =
                                                    sameDayGrades.length > 0
                                                        ? sameDayGrades[sameDayGrades.length - 1]
                                                        : null;
                                                return (
                                                    <td key={d} className="px-3 py-4 text-center">
                                                        {g ? (
                                                            <div className="relative inline-block group/grade">
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border shadow-sm ${gradeColor(g.value, g.isAbsent)}`}>
                                                                    {/* Если флаг пропуска ИЛИ значение 0 — рисуем Н */}
                                                                    {g.isAbsent ? 'Н' : g.value}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDeleteGrade(g.id)}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/grade:opacity-100 transition-opacity hover:scale-110 shadow-md"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : <span className="text-slate-200">—</span>}
                                                    </td>
                                                );
                                            })}

                                            <td className="px-6 py-4 text-center">
                                                {avg ? (
                                                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                                                        {avg.toFixed(1)}
                                                    </span>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}