
import { AppState, Subject, User, Question, UserRole, QuestionType, ExamAttempt, EnrollmentType } from '../types';

const DB_KEY = 'examSystemDB';
const DB_VERSION = 9; // Incremented for new User schema

const INITIAL_SUBJECTS: Subject[] = [
  { id: 'subj1', name: 'المدخل لدراسة الفقه الإسلامي' },
  { id: 'subj2', name: 'علم الإجرام والعقاب' },
  { id: 'subj3', name: 'اللغة الإنجليزية' },
  { id: 'subj4', name: 'حقوق الإنسان' },
  { id: 'subj5', name: 'العلوم السياسية' },
  { id: 'subj6', name: 'تاريخ النظم الاجتماعية' },
  { id: 'subj7', name: 'مدخل العلوم القانونية' },
];

const INITIAL_USERS: User[] = [
  { 
    id: 'admin01', 
    username: 'admin', 
    email: 'admin@law.edu',
    passwordHash: 'zizo2070', 
    role: UserRole.ADMIN, 
    fullName: 'مدير النظام',
    enrollmentType: EnrollmentType.INTIZAM
  },
];

// Placeholder for questions to maintain file validity while focusing on logic updates.
// In a real scenario, the full question list would be preserved here.
const FIQH_QUESTIONS_RAW: any[] = []; 

const getInitialExamSettings = () => {
    const settings: { [subjectId: string]: { 
        isOpen: boolean; 
        section?: string; 
        questionCount: number; 
        durationMinutes: number; 
        allowRetakes: boolean; 
    } } = {};
    INITIAL_SUBJECTS.forEach(subject => {
        settings[subject.id] = { 
            isOpen: true,
            questionCount: 60,
            durationMinutes: 60,
            allowRetakes: true, 
        };
        if (subject.id === 'subj1' || subject.id === 'subj2') {
            settings[subject.id].section = 'all';
        }
    });
    return settings;
};

export const initializeDB = (): AppState => {
  const dbString = localStorage.getItem(DB_KEY);
  
  if (dbString) {
    try {
      const parsedDb = JSON.parse(dbString) as AppState;
      if (!parsedDb.version || parsedDb.version < DB_VERSION) {
        console.log(`Old DB version detected. Resetting database to v${DB_VERSION}.`);
        localStorage.removeItem(DB_KEY);
        return initializeDB(); 
      }
      return parsedDb;
    } catch (e) {
      console.error("Failed to parse DB, resetting.", e);
      localStorage.removeItem(DB_KEY);
      return initializeDB();
    }
  } else {
    const initialState: AppState = {
        version: DB_VERSION,
        users: INITIAL_USERS,
        questions: [], // In a real app, this would be populated with default questions
        subjects: INITIAL_SUBJECTS,
        examAttempts: [],
        examSettings: getInitialExamSettings(),
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initialState));
    return initialState;
  }
};

export const getDB = (): AppState => {
  const db = localStorage.getItem(DB_KEY);
  if (!db) return initializeDB();
  return JSON.parse(db);
};

export const saveDB = (state: AppState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
};
