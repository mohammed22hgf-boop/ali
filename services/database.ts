import { AppState, Subject, User, Question, UserRole, QuestionType, ExamAttempt } from '../types';

const DB_KEY = 'examSystemDB';
const DB_VERSION = 3; // Version to force reset outdated DBs

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
  { id: 'admin01', username: 'ali', passwordHash: 'zizo2070', role: UserRole.ADMIN, fullName: 'مدير النظام' },
  { id: 'student01', username: '2024001', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'أحمد محمد علي' },
  { id: 'student02', username: '2024002', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'فاطمة الزهراء محمود' },
  { id: 'student03', username: '2024003', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'خالد عبد الرحمن بكر' },
  { id: 'student04', username: '2024004', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'يوسف طارق حسين' },
  { id: 'student05', username: '2024005', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'محمد عبد الله سعيد' },
  { id: 'student06', username: '2024006', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'علي حسن إبراهيم' },
  { id: 'student07', username: '2024007', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'عمر مصطفى كامل' },
  { id: 'student08', username: '2024008', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'سارة وليد فتحي' },
  { id: 'student09', username: '2024009', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'مريم خالد شوقي' },
  { id: 'student10', username: '2024010', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'عبد الرحمن جمال السيد' },
  { id: 'student11', username: '2024011', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'نور الدين هشام عبد العزيز' },
  { id: 'student12', username: '2024012', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'جنى إسلام صبري' },
  { id: 'student13', username: '2024013', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'حبيبة شريف عادل' },
  { id: 'student14', username: '2024014', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'زياد أيمن رجب' },
  { id: 'student15', username: '2024015', passwordHash: '0000', role: UserRole.STUDENT, fullName: 'روان تامر فؤاد' },
];

const CRIMINOLOGY_QUESTIONS: Question[] = [
  // Multiple Choice Questions with correct answers
  { id: 'crim_q1', subjectId: 'subj2', type: QuestionType.MCQ, text: 'في رأي فرويد تسمى حالة التعلق اللاشعوري للبنت بأبيها...', options: ['عقدة الكترا', 'عقدة أوديب', 'عقدة الذنب', 'عقدة النقص'], correctAnswer: '0' },
  { id: 'crim_q2', subjectId: 'subj2', type: QuestionType.MCQ, text: 'وفقا لنظرية لومبروزو من يعاني من ضمور في العضلات يحد من الوظائف النفسية هو...', options: ['المجرم الصرعي', 'المجرم العاطفي', 'المجرم بالصدفة', 'المجرم ذو التقويم الناقص'], correctAnswer: '0' },
  { id: 'crim_q3', subjectId: 'subj2', type: QuestionType.MCQ, text: 'في رأي فرويد يسمى الشق الشهواني من النفس البشرية...', options: ['الأنا الدنيا', 'الأنا العليا', 'الأنا', 'الواقعية'], correctAnswer: '0' },
  { id: 'crim_q4', subjectId: 'subj2', type: QuestionType.MCQ, text: 'وفقا لنظرية لومبروزو يعد المجرم المدمن من طائفة...', options: ['معتادي الإجرام', 'الهستيريين', 'العاطفيين', 'بالصدفة'], correctAnswer: '3' },
  { id: 'crim_q5', subjectId: 'subj2', type: QuestionType.MCQ, text: 'تقوم نظرية لومبروزو على أن...', options: ['الجريمة تنتقل بالوراثة', 'المجرم مسير في ارتكاب الجريمة', 'المجرم لديه خلل في التكوين العضوي', 'كل ما سبق'], correctAnswer: '3' },
  { id: 'crim_q6', subjectId: 'subj2', type: QuestionType.MCQ, text: 'من تنعدم لديه القدرة على التكيف مع المجتمع ويخالف قوانينه يسمى...', options: ['المجرم السيكوباتي', 'المجرم العاطفي', 'المجرم بالصدفة', 'المجرم المعتاد'], correctAnswer: '0' },
  { id: 'crim_q7', subjectId: 'subj2', type: QuestionType.MCQ, text: 'الطائفة التي لا تتبع تقسيم انريكو فيري للمجرمين هي...', options: ['المجرمين بالميلاد', 'المجرمين بالاعتياد', 'المجرمين بالصدفة', 'المجرمين المدمنين'], correctAnswer: '3' },
  { id: 'crim_q8', subjectId: 'subj2', type: QuestionType.MCQ, text: 'النفس العاقلة في رأي فرويد تسمى...', options: ['الذات', 'الضمير', 'الأنا', 'النفس اللوامة'], correctAnswer: '2' },
  { id: 'crim_q9', subjectId: 'subj2', type: QuestionType.MCQ, text: 'من يرتكب جريمة شكلية يعد في رأي لومبروزو...', options: ['مجرم بالصدفة', 'مجرم عاطفي', 'مجرم حكماً', ''], correctAnswer: '2' },
  { id: 'crim_q10', subjectId: 'subj2', type: QuestionType.MCQ, text: 'في رأي لومبروزو المجرم المجنون خلقياً هو...', options: ['العاطفي', 'المدمن', 'السيكوباتي', ''], correctAnswer: '1' },
  { id: 'crim_q11', subjectId: 'subj2', type: QuestionType.MCQ, text: 'يعاب على نظريته الإسراف في الاعتماد على العامل الجنسي لتفسير السلوك الإنساني...', options: ['فرويد', 'سذرلاند', 'تارد', ''], correctAnswer: '0' },
  { id: 'crim_q12', subjectId: 'subj2', type: QuestionType.MCQ, text: 'يتمثل الاختلاف بين لومبروزو وانريكو فيري حول المجرم بالميلاد في...', options: ['حتمية الجريمة', 'الخلل العضوي', 'أثر الوراثة', ''], correctAnswer: '0' },
  { id: 'crim_q13', subjectId: 'subj2', type: QuestionType.MCQ, text: 'الذي يرتكب الجريمة تحت ضغط المؤثرات الخارجية الطارئة دون امتداد إجرامي هو...', options: ['المجرم العاطفي', 'المجرم بالصدفة', 'المجرم حكماً', ''], correctAnswer: '1' },
  { id: 'crim_q14', subjectId: 'subj2', type: QuestionType.MCQ, text: 'تمثل فكرة الارتداد جوهر نظريته في تفسير السلوك الإجرامي...', options: ['دي توليو', 'لومبروزو', 'فرويد', ''], correctAnswer: '1' },
  { id: 'crim_q15', subjectId: 'subj2', type: QuestionType.MCQ, text: 'يتميز المجرم في رأي لومبروزو بصفات نفسية أهمها...', options: ['انعدام الحسن الأخلاقي', 'الشعور بالخجل', 'المبالاة', ''], correctAnswer: '0' },
  { id: 'crim_q16', subjectId: 'subj2', type: QuestionType.MCQ, text: 'عندما يكون عدم التكيف هو المحرك نحو ارتكاب الجريمة فإن من يرتكبها هو...', options: ['المجرم المدمن', 'المجرم السيكوباتي', 'المجرم المعتاد', ''], correctAnswer: '1' },
  { id: 'crim_q17', subjectId: 'subj2', type: QuestionType.MCQ, text: 'تعتمد نظرية ......... على اللاشعور في تفسير سلوك الفرد.', options: ['ميرتون', 'تارد', 'فرويد', ''], correctAnswer: '2' },
  { id: 'crim_q18', subjectId: 'subj2', type: QuestionType.MCQ, text: 'وفقاً لنظرية فرويد فإن تأنيب الضمير يمكن أن تنشأ عنه عقدة...', options: ['النقص', 'الذنب', 'أوديب', ''], correctAnswer: '1' },
  { id: 'crim_q19', subjectId: 'subj2', type: QuestionType.MCQ, text: 'وفقاً لتصنيف لومبروزو للمجرمين فإن المجرم الهستيري يتبع طائفة المجرم...', options: ['المجنون', 'السيكوباتي', 'الصرعي', ''], correctAnswer: '0' },
  { id: 'crim_q20', subjectId: 'subj2', type: QuestionType.MCQ, text: 'في رأي ميرتون النمط الذي يتسم بالاستسلام ورفض قيم المجتمع وعدم طرح قيم بديلة يسمى...', options: ['الشعائرية', 'الابتكارية', 'التوافقية', 'التمردية'], correctAnswer: '0' },
  { id: 'crim_q21', subjectId: 'subj2', type: QuestionType.MCQ, text: 'من النظريات التي تصلح لتفسير سلوك العصابات وجرائمها...', options: ['المخالطة الفارقة', 'التقليد', 'دوركايم', ''], correctAnswer: '0' },
  { id: 'crim_q22', subjectId: 'subj2', type: QuestionType.MCQ, text: 'رفض قيم المجتمع ومعاييره، مع إيجاد قيم بديلة يسمى نمط الاستجابة...', options: ['التمردية', 'التوافقية', 'الابتكارية', ''], correctAnswer: '0' },
  { id: 'crim_q23', subjectId: 'subj2', type: QuestionType.MCQ, text: 'ترتكب الجريمة عن طريق التعلم في رأي...', options: ['سذرلاند', 'فرويد', 'دوركايم', ''], correctAnswer: '0' },
  { id: 'crim_q24', subjectId: 'subj2', type: QuestionType.MCQ, text: 'ترتكب الجريمة عن طريق التقليد في رأي...', options: ['ميرتون', 'تارد', 'دي توليو', ''], correctAnswer: '1' },
  { id: 'crim_q25', subjectId: 'subj2', type: QuestionType.MCQ, text: 'نظرية ميرتون هي إحدى نظريات ......... لتفسير الظاهرة الإجرامية.', options: ['بالكيفية الاجتماعية', 'البناء الاجتماعي', 'التفسير التكاملي', ''], correctAnswer: '1' },
  // True/False Questions with correct answers
  { id: 'crim_q26', subjectId: 'subj2', type: QuestionType.TRUE_FALSE, text: 'يتميز المجرم في رأي لومبروزو بصفات نفسية أهمها المبالاة.', correctAnswer: 'false' },
  { id: 'crim_q27', subjectId: 'subj2', type: QuestionType.TRUE_FALSE, text: 'يعاب على نظرية فرويد الإسراف في الاعتماد على العامل الجنسي لتفسير السلوك الإنساني.', correctAnswer: 'true' },
  { id: 'crim_q28', subjectId: 'subj2', type: QuestionType.TRUE_FALSE, text: 'في رأي لومبروزو الذي يرتكب الجريمة تحت ضغط المؤثرات الخارجية الطارئة دون أن يكون لديه استعداد إجرامي هو المجرم بالصدفة.', correctAnswer: 'true' },
  { id: 'crim_q29', subjectId: 'subj2', type: QuestionType.TRUE_FALSE, text: 'الأنا الدنيا في رأي فرويد هي النفس ذات الشهوة.', correctAnswer: 'true' },
  { id: 'crim_q30', subjectId: 'subj2', type: QuestionType.TRUE_FALSE, text: 'النفس العاقلة في رأي فرويد تشير إلى الضمير.', correctAnswer: 'false' },
  { id: 'crim_q31', subjectId: 'subj2', type: QuestionType.TRUE_FALSE, text: 'وفقا لنظرية فرويد فإن الأنا العليا هي مصدر القوة الرادعة للشهوات الذات.', correctAnswer: 'true' },
];


const INITIAL_QUESTIONS: Question[] = [
  // Sample Questions for "مدخل العلوم القانونية"
  { id: 'q1_s7', subjectId: 'subj7', type: QuestionType.MCQ, text: 'ما هو المصدر الرئيسي للقانون في النظام المصري؟', options: ['التشريع', 'العرف', 'الفقه', 'القضاء'], correctAnswer: '0', explanation: 'التشريع هو المصدر الرسمي الأصلي للقانون في مصر.' },
  { id: 'q2_s7', subjectId: 'subj7', type: QuestionType.MCQ, text: 'ينقسم القانون إلى قسمين رئيسيين هما:', options: ['قانون عام وقانون خاص', 'قانون دولي وقانون داخلي', 'قانون مدني وقانون جنائي', 'قانون دستوري وقانون إداري'], correctAnswer: '0' },
  { id: 'q3_s7', subjectId: 'subj7', type: QuestionType.TRUE_FALSE, text: 'القاعدة القانونية قاعدة سلوك اجتماعي عامة ومجردة وملزمة.', correctAnswer: 'true', explanation: 'هذا هو التعريف الدقيق للخصائص الأساسية للقاعدة القانونية.' },
  // ... adding more questions for each subject to reach 30+
  ...Array.from({ length: 30 }, (_, i) => ({ id: `q${i+4}_s7`, subjectId: 'subj7', type: i % 5 === 0 ? QuestionType.TRUE_FALSE : QuestionType.MCQ, text: `نص سؤال تجريبي رقم ${i+4} لمادة مدخل العلوم القانونية؟`, options: ['خيار أ', 'خيار ب', 'خيار ج', 'خيار د'], correctAnswer: `${i%4}`, explanation: `تفسير إجابة السؤال رقم ${i+4}` })),
  ...Array.from({ length: 35 }, (_, i) => ({ id: `q${i+1}_s1`, subjectId: 'subj1', type: i % 6 === 0 ? QuestionType.TRUE_FALSE : QuestionType.MCQ, text: `نص سؤال تجريبي رقم ${i+1} لمادة الفقه الإسلامي؟`, options: ['أ', 'ب', 'ج', 'د'], correctAnswer: `${i%4}` })),
  ...CRIMINOLOGY_QUESTIONS,
  ...Array.from({ length: 30 }, (_, i) => ({ id: `q${i+1}_s3`, subjectId: 'subj3', type: QuestionType.MCQ, text: `Sample question ${i+1} for English subject?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: `${i%4}` })),
  ...Array.from({ length: 30 }, (_, i) => ({ id: `q${i+1}_s4`, subjectId: 'subj4', type: i % 5 === 0 ? QuestionType.TRUE_FALSE : QuestionType.MCQ, text: `نص سؤال تجريبي رقم ${i+1} لمادة حقوق الإنسان؟`, options: ['أ', 'ب', 'ج', 'د'], correctAnswer: `${i%4}` })),
  ...Array.from({ length: 30 }, (_, i) => ({ id: `q${i+1}_s5`, subjectId: 'subj5', type: QuestionType.MCQ, text: `نص سؤال تجريبي رقم ${i+1} لمادة العلوم السياسية؟`, options: ['أ', 'ب', 'ج', 'د'], correctAnswer: `${i%4}` })),
  ...Array.from({ length: 30 }, (_, i) => ({ id: `q${i+1}_s6`, subjectId: 'subj6', type: QuestionType.TRUE_FALSE, text: `نص سؤال تجريبي رقم ${i+1} لمادة تاريخ النظم؟`, correctAnswer: i % 2 === 0 ? 'true' : 'false' })),
];

const getInitialExamSettings = () => {
    const settings: { [subjectId: string]: { isOpen: boolean } } = {};
    INITIAL_SUBJECTS.forEach(subject => {
        settings[subject.id] = { isOpen: true };
    });
    return settings;
};

const createInitialState = (): AppState => ({
    version: DB_VERSION,
    users: INITIAL_USERS,
    questions: INITIAL_QUESTIONS,
    subjects: INITIAL_SUBJECTS,
    examAttempts: [],
    examSettings: getInitialExamSettings(),
});


export const initializeDB = (): AppState => {
  const dbString = localStorage.getItem(DB_KEY);
  
  if (dbString) {
    try {
      const parsedDb = JSON.parse(dbString) as AppState;
      // If version is missing or outdated, reset the DB
      if (!parsedDb.version || parsedDb.version < DB_VERSION) {
        console.log(`Old DB version detected. Resetting database to v${DB_VERSION}.`);
        const initialState = createInitialState();
        localStorage.setItem(DB_KEY, JSON.stringify(initialState));
        return initialState;
      }
      return parsedDb;
    } catch (e) {
      console.error("Failed to parse DB, resetting.", e);
      // If parsing fails, it might be corrupt, so reset.
      const initialState = createInitialState();
      localStorage.setItem(DB_KEY, JSON.stringify(initialState));
      return initialState;
    }
  } else {
    // If no DB exists, create a new one.
    const initialState = createInitialState();
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