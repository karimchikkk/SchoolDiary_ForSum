const BASE_URL = 'http://localhost:5213';

function getToken(): string | null {
    return localStorage.getItem('token');
}

/**
 * Универсальный типизированный метод запроса.
 * Сохранена вся твоя логика логирования и обработки 204 контента.
 */
async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {

    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    // Добавляем JWT
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('REQUEST:', path);
    console.log('TOKEN:', token);

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    console.log('STATUS:', res.status);

    if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('API ERROR:', errorText);
        throw new Error(errorText || `HTTP ${res.status}`);
    }

    // Пустой ответ (204 No Content)
    if (res.status === 204) {
        return null as T;
    }

    const text = await res.text();
    return text ? JSON.parse(text) : (null as T);
}

// --- Интерфейсы ---

export interface LoginPayload {
    accessCode: string;
    fullName: string;
}

export interface LoginResponse {
    token?: string;
    userId?: number;
    id?: number;
    role?: number;
    fullName?: string;
    name?: string;
    classId?: number;    // Добавлено
    className?: string;  // Добавлено
}

export interface Grade {
    id: number;
    userId: number;
    subjectId: number;
    value: number;
    comment?: string;
    isAbsent: boolean;
    date: string;
}

export interface ScheduleItem {
    id: number;
    dayOfWeek: number;
    lessonNumber: number;
    subjectId: number;
    subjectName: string;
    classId: number;
    homeWork?: string;
    teacherComment?: string;
}

export interface Schedule {
    id: number;
    className: string;
    dayOfWeek: number;
    lessonNumber: number;
    subjectName: string;
    teacherName?: string;
    startTime?: string;
    endTime?: string;
}

export interface Subject {
    id: number;
    name: string;
}

export interface ClassItem {
    id: number;
    name: string;
}

export interface User {
    id: number;
    fullName: string;
    role: number;
    classId?: number;
    className?: string;
}

export interface JournalEntry {
    studentId: number;
    studentName: string;
    grades: Grade[];
}

// --- API Методы ---

export const api = {
    auth: {
        login: async (payload: LoginPayload) => {
            const data = await request<LoginResponse>(
                '/api/Users/login',
                {
                    method: 'POST',
                    body: JSON.stringify(payload),
                }
            );

            // СОХРАНЯЕМ JWT
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            // СОХРАНЯЕМ ПОЛЬЗОВАТЕЛЯ (Исправлено: теперь сохраняем classId и className)
            localStorage.setItem(
                'user',
                JSON.stringify({
                    id: data.userId ?? data.id,
                    fullName: data.fullName ?? data.name,
                    role: data.role,
                    classId: data.classId,
                    className: data.className
                })
            );

            return data;
        },
    },

    grades: {
        getByUser: (userId: number) =>
            request<Grade[]>('/api/Grades/user/' + userId),

        add: (payload: {
            userId: number;
            subjectId: number;
            value: number;
            comment?: string;
            isAbsent: boolean;
            date: string;
        }) =>
            request<Grade>('/api/Grades/add', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),

        update: (gradeId: number, payload: {
            userId: number;
            subjectId: number;
            value: number;
            comment?: string;
            isAbsent: boolean;
            date: string;
        }) =>
            request<Grade>('/api/Grades/' + gradeId, {
                method: 'PUT',
                body: JSON.stringify({ ...payload, id: gradeId }),
            }),

        delete: (gradeId: number) =>
            request<void>('/api/Grades/' + gradeId, {
                method: 'DELETE'
            }),
    },

    schedule: {
        getByClass: (classId: number) =>
            request<ScheduleItem[]>('/api/Schedule/class/' + classId),

        upsert: (payload: Partial<ScheduleItem>) =>
            request<ScheduleItem>('/api/Schedule/upsert', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),

        updateHomeWork: (scheduleId: number, homeWork: string, comment?: string) =>
            request<void>(`/api/Schedule/${scheduleId}/homework`, {
                method: 'PATCH',
                body: JSON.stringify({ homeWork, comment }),
            }),
    },

    subjects: {
        all: () => request<Subject[]>('/api/Subjects/all'),

        create: (name: string) =>
            request<Subject>('/api/Subjects/create', {
                method: 'POST',
                body: JSON.stringify({ name }),
            }),

        getById: (id: number) => request<Subject>(`/api/Subjects/${id}`),
    },

    classes: {
        all: () => request<ClassItem[]>('/api/Classes/all'),
        create: (name: string) =>
            request<ClassItem>('/api/Classes/create?name=' + encodeURIComponent(name), {
                method: 'POST',
            }),
    },

    users: {
        students: () => request<User[]>('/api/Users/students'),
        teachers: () => request<User[]>('/api/Users/teachers'),
        register: (params: {
            fullName: string;
            accessCode: string;
            role: number;
            classId?: number;
        }) => {
            const qs = new URLSearchParams({
                fullName: params.fullName,
                accessCode: params.accessCode,
                role: String(params.role),
                ...(params.classId !== undefined ? { classId: String(params.classId) } : {}),
            });
            return request<User>(`/api/Users/register?${qs}`, { method: 'POST' });
        },
    },

    journal: {
        get: (classId: number, subjectId: number) =>
            request<JournalEntry[]>('/api/Journal/class/' + classId + '/subject/' + subjectId),
    },

    teachers: {
        subjects: (teacherId: number) =>
            request<Subject[]>('/api/Teachers/' + teacherId + '/subjects'),

        assign: (teacherId: number, subjectId: number) =>
            request<void>(
                '/api/Teachers/assign?teacherId=' + teacherId + '&subjectId=' + subjectId,
                { method: 'POST' }
            ),
    },

    schedules: {
        getByClass: async (className: string) => {
            return request<Schedule[]>(
                `/api/Schedules/${className}`
            );
        },

        create: async (data: Partial<Schedule>) => {
            return request<Schedule>(
                '/api/Schedules',
                {
                    method: 'POST',
                    body: JSON.stringify(data)
                }
            );
        },

        delete: async (id: number) => {
            return request(
                `/api/Schedules/${id}`,
                {
                    method: 'DELETE'
                }
            );
        }
    },
};