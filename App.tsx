
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { User, UserRole, Subject, Question, ExamAttempt, AppState, QuestionType, EnrollmentType } from './types';
import { initializeDB, getDB, saveDB } from './services/database';
import generatePDFFromElement from './utils/pdfGenerator';

// --- Assets & Icons ---
const Logo = () => (
    <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l-9 5 9 5 9-5-9-5z" /></svg>
        <div>
            <h1 className="text-xl font-bold text-white">كلية الحقوق بقنا</h1>
            <p className="text-sm text-gray-300">نظام الامتحانات الإلكتروني</p>
        </div>
    </div>
);

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-3 py-1 text-sm font-bold rounded-full ${className}`}>
        {children}
    </span>
);


// --- App State Context ---
const AppContext = createContext<{
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    currentUser: User | null;
    login: (email: string, passwordHash: string) => boolean;
    register: (user: User) => boolean;
    logout: () => void;
}>({
    state: initializeDB(),
    setState: () => {},
    currentUser: null,
    login: () => false,
    register: () => false,
    logout: () => {},
});

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(initializeDB);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const storedUser = sessionStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        saveDB(state);
    }, [state]);

    const login = (email: string, passwordHash: string): boolean => {
        const trimmedEmail = email.trim();
        const user = state.users.find(u => 
            (u.email.toLowerCase() === trimmedEmail.toLowerCase() || u.username === trimmedEmail)
            && u.passwordHash === passwordHash
        );
        
        if (user) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    };

    const register = (newUser: User): boolean => {
        const existingUser = state.users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
        if (existingUser) return false;

        setState(prevState => ({
            ...prevState,
            users: [...prevState.users, newUser]
        }));
        
        setCurrentUser(newUser);
        sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        return true;
    };

    const logout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
    };
    
    return (
        <AppContext.Provider value={{ state, setState, currentUser, login, register, logout }}>
            {children}
        </AppContext.Provider>
    );
};

// --- Main App ---
const App: React.FC = () => {
    return (
        <AppProvider>
            <Main />
        </AppProvider>
    );
}

const Main: React.FC = () => {
    const { currentUser } = useContext(AppContext);
    
    return (
        <div className="min-h-screen bg-gray-100">
            {currentUser ? (
                currentUser.role === UserRole.ADMIN ? <AdminView /> : <StudentView />
            ) : (
                <LoginScreen />
            )}
        </div>
    );
};

// --- Login Screen ---
const LoginScreen: React.FC = () => {
    const { login, register, state } = useContext(AppContext);
    const [isLoginMode, setIsLoginMode] = useState(true);
    
    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    
    // Register State
    const [fullName, setFullName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [enrollmentType, setEnrollmentType] = useState<EnrollmentType>(EnrollmentType.INTISAB);

    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(loginEmail, loginPassword);
        if (!success) {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (regPassword !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }

        if (regPassword.length < 4) {
            setError('يجب أن تتكون كلمة المرور من 4 أحرف على الأقل.');
            return;
        }

        // Generate ID
        const maxNumericId = state.users
            .filter(u => u.role === UserRole.STUDENT && !isNaN(parseInt(u.username)))
            .reduce((max, u) => Math.max(max, parseInt(u.username)), 2024000);
        
        const newUser: User = {
            id: `student_${Date.now()}`,
            username: String(maxNumericId + 1),
            email: regEmail,
            passwordHash: regPassword,
            fullName: fullName,
            role: UserRole.STUDENT,
            enrollmentType: enrollmentType
        };

        const success = register(newUser);
        if (!success) {
            setError('هذا البريد الإلكتروني مسجل بالفعل.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-[#0B1D3A]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
                <div className="flex flex-col items-center space-y-4">
                    <svg className="w-16 h-16 mx-auto text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l-9 5 9 5 9-5-9-5z" /></svg>
                    <h2 className="text-lg font-bold text-gray-700">نظام الامتحانات الإلكتروني</h2>
                    <div className="flex p-1 bg-gray-200 rounded-lg">
                        <button onClick={() => setIsLoginMode(true)} className={`px-4 py-2 text-sm font-bold rounded-md ${isLoginMode ? 'bg-white shadow text-brand-navy' : 'text-gray-500'}`}>تسجيل الدخول</button>
                        <button onClick={() => setIsLoginMode(false)} className={`px-4 py-2 text-sm font-bold rounded-md ${!isLoginMode ? 'bg-white shadow text-brand-navy' : 'text-gray-500'}`}>إنشاء حساب جديد</button>
                    </div>
                </div>

                {isLoginMode ? (
                    <form className="space-y-6 text-right" onSubmit={handleLogin}>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                            <input 
                                type="text" 
                                value={loginEmail} 
                                onChange={e => setLoginEmail(e.target.value)} 
                                required 
                                placeholder="البريد الإلكتروني أو اسم المستخدم"
                                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-gold focus:outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">كلمة المرور</label>
                            <input 
                                type="password" 
                                value={loginPassword} 
                                onChange={e => setLoginPassword(e.target.value)} 
                                required 
                                className="w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-brand-gold focus:outline-none" 
                            />
                        </div>
                        {error && <p className="text-sm text-center text-red-500">{error}</p>}
                        <button type="submit" className="w-full py-3 font-bold text-gray-900 bg-yellow-400 rounded-md hover:bg-yellow-500">
                            دخول
                        </button>
                    </form>
                ) : (
                    <form className="space-y-4 text-right" onSubmit={handleRegister}>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">الاسم الثلاثي الكامل</label>
                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-gold focus:outline-none" />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-gold focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">كلمة المرور</label>
                                <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-gold focus:outline-none" />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-gold focus:outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">نوع القيد</label>
                            <select value={enrollmentType} onChange={e => setEnrollmentType(e.target.value as EnrollmentType)} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-gold focus:outline-none">
                                <option value={EnrollmentType.INTISAB}>انتساب عام</option>
                                <option value={EnrollmentType.INTIZAM}>انتظام</option>
                            </select>
                        </div>
                        {error && <p className="text-sm text-center text-red-500">{error}</p>}
                        <button type="submit" className="w-full py-3 font-bold text-gray-900 bg-yellow-400 rounded-md hover:bg-yellow-500">
                            تسجيل حساب جديد
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};


// --- Header ---
const Header: React.FC = () => {
    const { currentUser, logout } = useContext(AppContext);
    return (
        <header className="sticky top-0 z-50 shadow-lg brand-navy">
            <div className="container flex items-center justify-between p-4 mx-auto">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <Logo />
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="text-left text-white">
                        <p className="text-sm font-bold">{currentUser?.fullName}</p>
                        <p className="text-xs text-gray-300">{currentUser?.enrollmentType === EnrollmentType.INTIZAM ? 'انتظام' : 'انتساب'}</p>
                    </div>
                    <button onClick={logout} className="px-3 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">
                        خروج
                    </button>
                </div>
            </div>
        </header>
    );
};


// --- Student View ---
const StudentView: React.FC = () => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'pre-exam' | 'exam' | 'results'>('dashboard');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);

    const startExam = (subject: Subject) => {
        setSelectedSubject(subject);
        setCurrentView('pre-exam');
    };

    const beginExam = () => {
        if (!selectedSubject) return;
        setCurrentView('exam');
    };

    const finishExam = (attempt: ExamAttempt) => {
        setCurrentAttempt(attempt);
        setCurrentView('results');
    };

    const backToDashboard = () => {
        setSelectedSubject(null);
        setCurrentAttempt(null);
        setCurrentView('dashboard');
    };
    
    return (
        <>
            <Header />
            <main className="container p-4 mx-auto md:p-8">
                {currentView === 'dashboard' && <StudentDashboard onStartExam={startExam} />}
                {currentView === 'pre-exam' && selectedSubject && <PreExamScreen subject={selectedSubject} onBegin={beginExam} onCancel={backToDashboard} />}
                {currentView === 'exam' && selectedSubject && <ExamScreen subject={selectedSubject} onFinish={finishExam} />}
                {currentView === 'results' && currentAttempt && <ResultsScreen attempt={currentAttempt} onBack={backToDashboard} />}
            </main>
        </>
    );
};

const StudentDashboard: React.FC<{onStartExam: (subject: Subject) => void}> = ({ onStartExam }) => {
    const { state, currentUser } = useContext(AppContext);
    
    return (
        <div>
            <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-brand-navy">لوحة التحكم</h2>
                <p className="text-gray-600">أهلاً بك، {currentUser?.fullName}. يمكنك أداء الامتحان مرتين فقط لكل مادة.</p>
            </div>

            <h2 className="mb-6 text-2xl font-bold text-brand-navy">المواد الدراسية</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {state.subjects.map(subject => {
                    const userAttempts = (state.examAttempts || []).filter(a => a.userId === currentUser!.id && a.subjectId === subject.id);
                    const attemptCount = userAttempts.length;
                    const examSettings = state.examSettings[subject.id] || { isOpen: false };
                    const { isOpen } = examSettings;

                    // Logic: Allow if attempts < 2 and exam is open
                    const canTakeExam = isOpen && attemptCount < 2;
                    
                    let buttonText = 'ابدأ الامتحان (المحاولة 1)';
                    let buttonClass = 'brand-gold hover:bg-yellow-500 text-gray-900';

                    if (!isOpen) {
                        buttonText = 'الامتحان مغلق';
                        buttonClass = 'bg-gray-400 text-white cursor-not-allowed';
                    } else if (attemptCount === 1) {
                        buttonText = 'إعادة الامتحان (فرصة أخيرة)';
                        buttonClass = 'bg-orange-500 hover:bg-orange-600 text-white';
                    } else if (attemptCount >= 2) {
                        buttonText = 'تم استنفاذ المحاولات';
                        buttonClass = 'bg-red-500 text-white cursor-not-allowed';
                    }
                    
                    const lastScore = attemptCount > 0 ? userAttempts[userAttempts.length - 1].score : null;
                    const totalQs = attemptCount > 0 ? userAttempts[userAttempts.length - 1].totalQuestions : 1;

                    return (
                    <div key={subject.id} className="relative p-6 transition duration-300 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-brand-navy">{subject.name}</h3>
                            <span className="px-2 py-1 text-xs font-bold text-gray-600 bg-gray-100 rounded-full">{attemptCount} / 2 محاولات</span>
                        </div>
                        
                        {lastScore !== null && (
                            <div className="mb-4 text-sm text-gray-600">
                                آخر درجة: <span className="font-bold text-brand-navy">{((lastScore / totalQs) * 20).toFixed(1)} من 20</span>
                            </div>
                        )}

                        <button 
                            onClick={() => onStartExam(subject)}
                            disabled={!canTakeExam}
                            className={`w-full px-4 py-3 font-bold transition rounded-md shadow-sm ${buttonClass}`}>
                           {buttonText}
                        </button>
                    </div>
                )})}
            </div>
        </div>
    );
};

const PreExamScreen: React.FC<{ subject: Subject; onBegin: () => void; onCancel: () => void }> = ({ subject, onBegin, onCancel }) => {
    const { state } = useContext(AppContext);
    const settings = state.examSettings[subject.id];
    const questionCount = settings?.questionCount || 60;
    const durationMinutes = settings?.durationMinutes || 60;

    return (
        <div className="max-w-3xl p-8 mx-auto bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-center text-brand-navy">تعليمات امتحان: {subject.name}</h2>
            <div className="p-6 my-6 space-y-4 text-center bg-yellow-50 border-r-4 border-brand-gold">
                <h3 className="text-lg font-bold text-brand-navy">تنبيه هام</h3>
                <p className="text-gray-700">
                    لديك فرصتان فقط لدخول هذا الامتحان. تأكد من استعدادك قبل البدء.
                </p>
            </div>
            <div className="space-y-3 text-gray-800">
                <p>• مدة الامتحان <span className="font-bold">{durationMinutes} دقيقة</span>.</p>
                <p>• يتكون الامتحان من <span className="font-bold">{questionCount} سؤال</span>.</p>
                <p>• بمجرد الضغط على زر "ابدأ الامتحان"، سيبدأ المؤقت <span className="font-bold">فورًا</span>.</p>
            </div>
            <div className="flex gap-4 mt-8 text-center">
                <button onClick={onCancel} className="flex-1 px-6 py-3 text-lg font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    إلغاء والعودة
                </button>
                <button onClick={onBegin} className="flex-1 px-6 py-3 text-lg font-bold text-gray-900 rounded-md shadow-xl brand-gold hover:bg-yellow-500">
                    ابدأ الامتحان الآن
                </button>
            </div>
        </div>
    );
};

const ExamScreen: React.FC<{ subject: Subject; onFinish: (attempt: ExamAttempt) => void }> = ({ subject, onFinish }) => {
    const { state, setState, currentUser } = useContext(AppContext);
    const settings = state.examSettings[subject.id];
    const questionCount = settings?.questionCount || 60;
    const durationMinutes = settings?.durationMinutes || 60;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

    const shuffleArray = <T,>(array: T[]): T[] => {
        return [...array].sort(() => Math.random() - 0.5);
    };

    useEffect(() => {
        const sectionSetting = state.examSettings[subject.id]?.section;
        let allSubjectQuestions = state.questions.filter(q => q.subjectId === subject.id);

        if (sectionSetting && sectionSetting !== 'all') {
            allSubjectQuestions = allSubjectQuestions.filter(q => q.section === sectionSetting);
        }

        const mcqCount = Math.round(questionCount * 0.8);
        const tfCount = questionCount - mcqCount;

        const mcq = shuffleArray(allSubjectQuestions.filter(q => q.type === QuestionType.MCQ)).slice(0, mcqCount);
        const tf = shuffleArray(allSubjectQuestions.filter(q => q.type === QuestionType.TRUE_FALSE)).slice(0, tfCount);
        
        const finalQuestions = shuffleArray([...mcq, ...tf]);
        setQuestions(finalQuestions.slice(0, questionCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subject.id, questionCount]);

    const submitExam = useCallback(() => {
        let score = 0;
        const finalAnswers = { ...answers };
        questions.forEach(q => {
            if (finalAnswers[q.id] === q.correctAnswer) {
                score++;
            }
        });
        
        const newAttempt: ExamAttempt = {
            id: `attempt_${Date.now()}`,
            userId: currentUser!.id,
            subjectId: subject.id,
            startTime: Date.now() - (durationMinutes * 60 - timeLeft) * 1000,
            endTime: Date.now(),
            answers: finalAnswers,
            score,
            totalQuestions: questions.length,
            status: 'completed'
        };

        setState(prevState => ({
            ...prevState,
            examAttempts: [...(prevState.examAttempts || []), newAttempt]
        }));
        onFinish(newAttempt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answers, currentUser, onFinish, questions, setState, subject.id, timeLeft, durationMinutes]);


    useEffect(() => {
        if (questions.length === 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    submitExam();
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [questions, submitExam]);

    if (questions.length === 0) {
        return <div className="text-center">جارٍ تحضير الامتحان...</div>;
    }
    
    const currentQuestion = questions[currentQIndex];
    
    const handleAnswer = (answer: string) => {
        setAnswers(prev => ({...prev, [currentQuestion.id]: answer}));
    };

    return (
        <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b">
                <h2 className="text-xl font-bold text-brand-navy">{subject.name}</h2>
                <div className="px-4 py-2 font-bold text-white rounded-md brand-navy">
                    {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
                </div>
            </div>
            
            <div className="mb-6">
                <p className="mb-2 font-bold">السؤال {currentQIndex + 1} من {questions.length}</p>
                <p className="text-lg text-gray-800">{currentQuestion.text}</p>
            </div>
            
            <div className="space-y-4">
                {currentQuestion.type === QuestionType.MCQ && currentQuestion.options?.map((option, index) => (
                    <label key={index} className={`flex items-center p-4 border rounded-lg cursor-pointer ${answers[currentQuestion.id] === String(index) ? 'bg-yellow-100 border-brand-gold' : 'border-gray-200'}`}>
                        <input type="radio" name={`q_${currentQuestion.id}`} value={index} checked={answers[currentQuestion.id] === String(index)} onChange={() => handleAnswer(String(index))} className="w-5 h-5 ml-4 text-brand-gold focus:ring-brand-gold"/>
                        <span className="text-brand-navy">{option}</span>
                    </label>
                ))}
                 {currentQuestion.type === QuestionType.TRUE_FALSE && (
                    <>
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${answers[currentQuestion.id] === 'true' ? 'bg-yellow-100 border-brand-gold' : 'border-gray-200'}`}>
                            <input type="radio" name={`q_${currentQuestion.id}`} value="true" checked={answers[currentQuestion.id] === 'true'} onChange={() => handleAnswer('true')} className="w-5 h-5 ml-4 text-brand-gold focus:ring-brand-gold" />
                            <span className="text-brand-navy">صح</span>
                        </label>
                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${answers[currentQuestion.id] === 'false' ? 'bg-yellow-100 border-brand-gold' : 'border-gray-200'}`}>
                            <input type="radio" name={`q_${currentQuestion.id}`} value="false" checked={answers[currentQuestion.id] === 'false'} onChange={() => handleAnswer('false')} className="w-5 h-5 ml-4 text-brand-gold focus:ring-brand-gold" />
                            <span className="text-brand-navy">خطأ</span>
                        </label>
                    </>
                 )}
            </div>

            <div className="flex justify-between mt-8">
                <button onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))} disabled={currentQIndex === 0} className="px-6 py-2 bg-gray-200 rounded-md disabled:opacity-50">السابق</button>
                {currentQIndex === questions.length - 1 ? (
                    <button onClick={submitExam} className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">تسليم الامتحان</button>
                ) : (
                    <button onClick={() => setCurrentQIndex(Math.min(questions.length - 1, currentQIndex + 1))} className="px-6 py-2 text-white rounded-md brand-gold hover:bg-yellow-500">التالي</button>
                )}
            </div>
        </div>
    );
};

const getGradeDetails = (score: number, totalQuestions: number): { grade: string, color: string } => {
    if (totalQuestions === 0) return { grade: 'N/A', color: 'text-gray-500' };
    const percentage = (score / totalQuestions) * 100;
    if (percentage < 50) return { grade: 'راسب', color: 'text-red-500' };
    if (percentage < 65) return { grade: 'مقبول', color: 'text-orange-500' };
    if (percentage < 80) return { grade: 'جيد', color: 'text-blue-500' };
    if (percentage < 90) return { grade: 'جيد جداً', color: 'text-green-500' };
    return { grade: 'امتياز', color: 'text-purple-500' };
};

const FullExamReview: React.FC<{ attempt: ExamAttempt }> = ({ attempt }) => {
    const { state } = useContext(AppContext);

    // To reconstruct the exact questions the user saw, we iterate the keys of the answers object.
    // This assumes every question shown was answered or initialized in the answers object.
    const reviewedQuestions = useMemo(() => {
        return Object.keys(attempt.answers).map(qId => {
            const question = state.questions.find(q => q.id === qId);
            if (!question) return null;
            const userAnswer = attempt.answers[qId];
            const isCorrect = userAnswer === question.correctAnswer;
            return { question, userAnswer, isCorrect };
        }).filter(x => x !== null) as { question: Question, userAnswer: string, isCorrect: boolean }[];
    }, [attempt, state.questions]);

    return (
        <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-2xl font-bold text-center text-brand-navy">مراجعة الإجابات (الصحيحة والخاطئة)</h3>
            <div className="space-y-6">
                {reviewedQuestions.map(({ question, userAnswer, isCorrect }, index) => {
                    let userAnswerText = userAnswer;
                    let correctAnswerText = question.correctAnswer;
                    
                    if (question.type === QuestionType.MCQ && question.options) {
                        userAnswerText = question.options[parseInt(userAnswer)] || "لم تجب";
                        correctAnswerText = question.options[parseInt(question.correctAnswer)];
                    } else if (question.type === QuestionType.TRUE_FALSE) {
                        userAnswerText = userAnswer === 'true' ? 'صح' : 'خطأ';
                        correctAnswerText = question.correctAnswer === 'true' ? 'صح' : 'خطأ';
                    }

                    return (
                        <div key={question.id} className={`p-4 border-r-4 rounded-lg shadow-sm ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-bold text-gray-800">({index + 1}) {question.text}</p>
                                    <div className="mt-2 text-sm">
                                        <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                            إجابتك: {userAnswerText}
                                        </span>
                                        {!isCorrect && (
                                            <span className="mr-4 font-bold text-green-700">
                                                 الإجابة الصحيحة: {correctAnswerText}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isCorrect ? (
                                    <span className="text-2xl text-green-500">✓</span>
                                ) : (
                                    <span className="text-2xl text-red-500">✗</span>
                                )}
                            </div>
                            {question.explanation && <p className="p-2 mt-2 text-sm text-gray-600 bg-white rounded border border-gray-100">توضيح: {question.explanation}</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const ResultsScreen: React.FC<{ attempt: ExamAttempt; onBack: () => void }> = ({ attempt, onBack }) => {
    const { state, currentUser } = useContext(AppContext);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showReview, setShowReview] = useState(false);
    
    const subject = state.subjects.find(s => s.id === attempt.subjectId)!;
    
    const finalScore = attempt.totalQuestions > 0 ? ((attempt.score / attempt.totalQuestions) * 20).toFixed(2) : "0.00";
    const gradeDetails = getGradeDetails(attempt.score, attempt.totalQuestions);

    const handleDownloadPDF = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            await generatePDFFromElement("pdf-content", `Result_${currentUser!.username}.pdf`);
        } catch (error) {
            alert("Error generating PDF");
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div className="max-w-4xl p-2 mx-auto sm:p-8">
            {/* Printable Certificate Area */}
            <div id="pdf-content" className="relative p-8 bg-white shadow-lg border-8 border-double border-brand-gold">
                <header className="flex items-center justify-between pb-6 border-b-2 border-gray-200">
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-brand-navy">كلية الحقوق بقنا</h2>
                        <p className="text-lg text-gray-600">الفرقة الأولى ({currentUser?.enrollmentType === EnrollmentType.INTIZAM ? 'انتظام' : 'انتساب'})</p>
                    </div>
                    <div className="opacity-80">
                        <svg className="w-24 h-24 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l-9 5 9 5 9-5-9-5z" /></svg>
                    </div>
                </header>

                <div className="py-10 text-center">
                    <h1 className="mb-2 text-3xl font-bold text-brand-navy">شهادة إتمام اختبار</h1>
                    <p className="text-gray-500">تم استخراج هذه الوثيقة إلكترونيًا</p>
                </div>
                
                <div className="space-y-6 text-center">
                    <p className="text-xl text-gray-800">تشهد إدارة النظام بأن الطالب/ة</p>
                    <p className="inline-block px-8 py-2 text-3xl font-bold text-white rounded-lg bg-brand-navy shadow-md">
                        {currentUser!.fullName}
                    </p>
                    <p className="text-xl text-gray-800">قد أتم اختبار مادة <span className="font-bold text-brand-gold">{subject.name}</span></p>
                    <p className="text-gray-600">بتاريخ: {new Date(attempt.endTime).toLocaleString('ar-EG')}</p>
                </div>

                <section className="grid grid-cols-3 gap-4 p-6 my-10 border rounded-lg bg-gray-50 border-brand-gold">
                    <div className="text-center">
                        <p className="text-gray-500">الدرجة</p>
                        <p className="text-3xl font-bold text-brand-navy">{finalScore} / 20</p>
                    </div>
                    <div className="text-center border-r border-l border-gray-300">
                        <p className="text-gray-500">التقدير</p>
                        <p className={`text-3xl font-extrabold ${gradeDetails.color}`}>{gradeDetails.grade}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500">نسبة النجاح</p>
                        <p className="text-3xl font-bold text-brand-navy">{Math.round((attempt.score / attempt.totalQuestions) * 100)}%</p>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-16 mt-16 text-center">
                    <div className="pt-8 border-t border-gray-300">
                        <p className="font-bold text-gray-700">يعتمد، عميد الكلية</p>
                    </div>
                    <div className="pt-8 border-t border-gray-300">
                        <p className="font-bold text-gray-700">شؤون الطلاب</p>
                    </div>
                </div>

                <footer className="pt-6 mt-12 text-center border-t border-gray-200">
                    <p className="text-lg font-bold text-brand-navy">عمل خيري مجاناً وحسنة جارية على روح أمي</p>
                    <p className="mt-2 text-xs text-gray-400">System ID: {attempt.id}</p>
                </footer>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 mt-8 md:flex-row md:justify-between no-print">
                <button onClick={onBack} className="px-6 py-3 font-bold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    العودة للقائمة
                </button>
                <div className="flex flex-col gap-4 md:flex-row">
                    <button onClick={() => setShowReview(!showReview)} className="px-6 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                        {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات والأسئلة'}
                    </button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="px-6 py-3 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">
                        {isDownloading ? 'جاري التحميل...' : 'تحميل الشهادة PDF'}
                    </button>
                </div>
            </div>
            
            {showReview && <FullExamReview attempt={attempt} />}
        </div>
    );
};

const QuestionForm: React.FC<{
    question: Question;
    setQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
    onSave: () => void;
    onCancel: () => void;
    subjects: Subject[];
}> = ({ question, setQuestion, onSave, onCancel, subjects }) => {
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setQuestion(prev => prev ? { ...prev, [name]: value } : null);
    };
    
    const handleOptionChange = (index: number, value: string) => {
        if (!question.options) return;
        const newOptions = [...question.options];
        newOptions[index] = value;
        setQuestion(prev => prev ? { ...prev, options: newOptions } : null);
    };

    return (
        <div className="p-6 mb-8 border border-gray-200 rounded-lg bg-gray-50">
             <h4 className="mb-4 text-lg font-semibold text-brand-navy">تعديل / إضافة سؤال</h4>
             <div className="space-y-4">
                 <div>
                    <label className="block mb-1 text-sm font-medium">المادة</label>
                    <select name="subjectId" value={question.subjectId} onChange={handleChange} className="w-full p-2 border rounded">
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block mb-1 text-sm font-medium">نص السؤال</label>
                    <textarea name="text" value={question.text} onChange={handleChange} className="w-full p-2 border rounded" rows={3} />
                 </div>
                 
                 <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <label className="block mb-1 text-sm font-medium">نوع السؤال: </label>
                    <select name="type" value={question.type} onChange={handleChange} className="p-2 border rounded">
                        <option value={QuestionType.MCQ}>اختيار من متعدد</option>
                        <option value={QuestionType.TRUE_FALSE}>صح / خطأ</option>
                    </select>
                 </div>

                 {question.type === QuestionType.MCQ && (
                     <div className="space-y-2">
                         <label className="block mb-1 text-sm font-medium">الخيارات (حدد الإجابة الصحيحة)</label>
                         {question.options?.map((opt, idx) => (
                             <div key={idx} className="flex items-center gap-2">
                                 <input 
                                    type="radio" 
                                    name="correctAnswer" 
                                    checked={question.correctAnswer === String(idx)} 
                                    onChange={() => setQuestion(prev => prev ? {...prev, correctAnswer: String(idx)} : null)}
                                 />
                                 <input 
                                    type="text" 
                                    value={opt} 
                                    onChange={e => handleOptionChange(idx, e.target.value)} 
                                    className="flex-1 p-2 border rounded"
                                    placeholder={`الخيار ${idx + 1}`}
                                 />
                             </div>
                         ))}
                     </div>
                 )}

                 {question.type === QuestionType.TRUE_FALSE && (
                     <div className="flex gap-4">
                         <label className="flex items-center gap-2">
                             <input 
                                type="radio" 
                                name="correctAnswer" 
                                value="true"
                                checked={question.correctAnswer === 'true'} 
                                onChange={handleChange}
                             />
                             <span>صح</span>
                         </label>
                         <label className="flex items-center gap-2">
                             <input 
                                type="radio" 
                                name="correctAnswer" 
                                value="false"
                                checked={question.correctAnswer === 'false'} 
                                onChange={handleChange}
                             />
                             <span>خطأ</span>
                         </label>
                     </div>
                 )}

                 <div>
                    <label className="block mb-1 text-sm font-medium">توضيح الإجابة (اختياري)</label>
                    <textarea name="explanation" value={question.explanation || ''} onChange={handleChange} className="w-full p-2 border rounded" />
                 </div>

                 <div className="flex justify-end gap-2 pt-4 border-t">
                     <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-300 rounded hover:bg-gray-400">إلغاء</button>
                     <button onClick={onSave} className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700">حفظ السؤال</button>
                 </div>
             </div>
        </div>
    );
};

const AdminView: React.FC = () => {
    const { state } = useContext(AppContext);
    const [tab, setTab] = useState('monitor');

    return (
        <>
            <Header />
            <div className="container p-4 mx-auto">
                <div className="flex mb-6 space-x-4 border-b rtl:space-x-reverse">
                    <button onClick={() => setTab('monitor')} className={`pb-2 px-4 text-lg transition ${tab==='monitor' ? 'border-b-4 border-brand-gold font-bold text-brand-navy' : 'text-gray-500'}`}>المراقبة والنتائج</button>
                    {/* Add Question Management logic here if needed */}
                </div>

                {tab === 'monitor' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="p-6 bg-white rounded-lg shadow border-r-4 border-brand-navy">
                                <h3 className="text-gray-500">الطلاب المسجلين</h3>
                                <p className="text-4xl font-bold text-brand-navy">{state.users.filter(u => u.role === UserRole.STUDENT).length}</p>
                            </div>
                             <div className="p-6 bg-white rounded-lg shadow border-r-4 border-brand-gold">
                                <h3 className="text-gray-500">الامتحانات المكتملة</h3>
                                <p className="text-4xl font-bold text-brand-navy">{state.examAttempts.length}</p>
                            </div>
                        </div>

                        <div className="overflow-hidden bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b">
                                <h3 className="font-bold text-brand-navy">سجل الامتحانات ودرجات الطلاب</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-4 text-sm font-bold text-gray-600">الطالب</th>
                                            <th className="p-4 text-sm font-bold text-gray-600">نوع القيد</th>
                                            <th className="p-4 text-sm font-bold text-gray-600">المادة</th>
                                            <th className="p-4 text-sm font-bold text-gray-600">الدرجة (20)</th>
                                            <th className="p-4 text-sm font-bold text-gray-600">وقت الدخول</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {state.examAttempts.slice().reverse().map(a => {
                                            const u = state.users.find(u => u.id === a.userId);
                                            const s = state.subjects.find(s => s.id === a.subjectId);
                                            return (
                                                <tr key={a.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-4 font-bold text-brand-navy">{u?.fullName}</td>
                                                    <td className="p-4 text-sm text-gray-600">{u?.enrollmentType === EnrollmentType.INTIZAM ? 'انتظام' : 'انتساب'}</td>
                                                    <td className="p-4">{s?.name}</td>
                                                    <td className="p-4 font-bold">{((a.score / a.totalQuestions) * 20).toFixed(1)}</td>
                                                    <td className="p-4 text-sm text-gray-500">{new Date(a.startTime).toLocaleString('ar-EG')}</td>
                                                </tr>
                                            );
                                        })}
                                        {state.examAttempts.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500">لا توجد امتحانات مسجلة حتى الآن</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default App;
