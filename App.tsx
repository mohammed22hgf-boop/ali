
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { User, UserRole, Subject, Question, ExamAttempt, AppState, QuestionType } from './types';
import { initializeDB, getDB, saveDB } from './services/database';
import generatePDFFromElement from './utils/pdfGenerator';

// --- Assets & Icons ---
const Logo = () => (
    <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {/* Fix: Corrected SVG attribute casing to strokeLinecap/strokeLinejoin for TSX compatibility. */}
        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l-9 5 9 5 9-5-9-5z" /></svg>
        <div>
            <h1 className="text-xl font-bold text-white">كلية الحقوق بقنا</h1>
            <p className="text-sm text-gray-300">الفرقة الأولى (انتساب عام)</p>
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
    login: (username: string, passwordHash: string) => boolean;
    logout: () => void;
}>({
    state: initializeDB(),
    setState: () => {},
    currentUser: null,
    login: () => false,
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

    const login = (username: string, passwordHash: string): boolean => {
        const trimmedUsername = username.trim();

        // Try to find an existing user first by username or full name
        const user = state.users.find(u => 
            (u.username.toLowerCase() === trimmedUsername.toLowerCase() || u.fullName.toLowerCase() === trimmedUsername.toLowerCase()) 
            && u.passwordHash === passwordHash
        );
        
        if (user) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }

        // Auto-registration for new students
        if (passwordHash === '0000' && trimmedUsername.length > 5) { // Basic validation
            const existingUserByName = state.users.find(u => u.fullName.toLowerCase() === trimmedUsername.toLowerCase());
            
            if (existingUserByName) {
                // User with this name exists, but password was wrong. Don't create a new account.
                return false; 
            }

            // Create a new student user
            const maxNumericId = state.users
                .filter(u => u.role === UserRole.STUDENT && !isNaN(parseInt(u.username)))
                .reduce((max, u) => Math.max(max, parseInt(u.username)), 2024000);

            const newUser: User = {
                id: `student_${Date.now()}`,
                username: String(maxNumericId + 1), // Assign a new unique numeric ID
                passwordHash: '0000',
                role: UserRole.STUDENT,
                fullName: trimmedUsername,
            };

            // Add the new user to state and log them in
            setState(prevState => ({
                ...prevState,
                users: [...prevState.users, newUser]
            }));
            
            setCurrentUser(newUser);
            sessionStorage.setItem('currentUser', JSON.stringify(newUser));
            
            return true;
        }

        return false;
    };


    const logout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
    };
    
    return (
        <AppContext.Provider value={{ state, setState, currentUser, login, logout }}>
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
    const { login } = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(username, password);
        if (!success) {
            setError('الاسم أو كلمة المرور غير صحيحة.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-[#0B1D3A]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
                <div className="flex flex-col items-center space-y-4">
                    {/* Fix: Corrected SVG attribute casing to strokeLinecap/strokeLinejoin for TSX compatibility. */}
                    <svg className="w-16 h-16 mx-auto text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l-9 5 9 5 9-5-9-5z" /></svg>
                    <h2 className="text-lg text-gray-500">الفرقة الأولى (انتساب عام)</h2>
                    <Badge className="bg-yellow-400 text-yellow-900">غير رسمي</Badge>
                </div>

                <form className="space-y-6 text-right" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">الاسم الثلاثي الكامل</label>
                        <input 
                            id="username" 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            required 
                            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent" 
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block mb-2 text-sm font-medium text-gray-700">كلمة المرور</label>
                        <input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent" 
                        />
                    </div>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    <button type="submit" className="w-full py-3 text-lg font-bold text-gray-900 transition-colors duration-300 rounded-md shadow-lg brand-gold hover:bg-yellow-500">
                        تسجيل الدخول
                    </button>
                </form>
                <p className="text-xs text-center text-gray-500">
                    أدخل اسمك الثلاثي الكامل. إذا كنت مستخدمًا جديدًا، سيتم إنشاء حساب لك تلقائيًا بكلمة المرور <span className="font-bold">0000</span>.
                </p>
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
                  <Badge className="hidden sm:block bg-yellow-400 text-yellow-900">غير رسمي</Badge>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-white">أهلاً، {currentUser?.fullName}</span>
                    <button onClick={logout} className="px-3 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700">
                        تسجيل الخروج
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
                {currentView === 'pre-exam' && selectedSubject && <PreExamScreen subject={selectedSubject} onBegin={beginExam} />}
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
            <h2 className="mb-6 text-3xl font-bold text-brand-navy">المواد الدراسية المتاحة</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {state.subjects.map(subject => {
                    const hasAttempted = (state.examAttempts || []).some(a => a.userId === currentUser!.id && a.subjectId === subject.id);
                    const examSettings = state.examSettings[subject.id] || { isOpen: false, allowRetakes: false };
                    const { isOpen, allowRetakes } = examSettings;

                    const canTakeExam = isOpen && (!hasAttempted || allowRetakes);
                    let buttonText = 'ابدأ الامتحان';
                    if (!isOpen) {
                        buttonText = 'الامتحان مغلق';
                    } else if (hasAttempted && !allowRetakes) {
                        buttonText = 'تم أداء الامتحان';
                    } else if (hasAttempted && allowRetakes) {
                        buttonText = 'إعادة الامتحان';
                    }
                    
                    return (
                    <div key={subject.id} className="p-6 bg-white rounded-lg shadow-md">
                        <h3 className="mb-4 text-xl font-bold text-brand-navy">{subject.name}</h3>
                        <button 
                            onClick={() => onStartExam(subject)}
                            disabled={!canTakeExam}
                            className="w-full px-4 py-2 font-bold text-white transition rounded-md brand-gold hover:bg-yellow-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
                           {buttonText}
                        </button>
                    </div>
                )})}
            </div>
        </div>
    );
};

const PreExamScreen: React.FC<{ subject: Subject; onBegin: () => void }> = ({ subject, onBegin }) => {
    const { state } = useContext(AppContext);
    const settings = state.examSettings[subject.id];
    const questionCount = settings?.questionCount || 60;
    const durationMinutes = settings?.durationMinutes || 60;

    return (
        <div className="max-w-3xl p-8 mx-auto bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-center text-brand-navy">تعليمات امتحان: {subject.name}</h2>
            <div className="p-6 my-6 space-y-4 text-center bg-yellow-50 border-r-4 border-brand-gold">
                <h3 className="text-lg font-bold text-brand-navy">إلى روح أمي الغالية</h3>
                <p className="text-gray-700">
                    هذه المذكرة إهداء لروحك الطاهرة.
                    أرجو أن يستفيد منها الجميع، وأتمنى ممن يقرؤها أن يدعو لها بالرحمة والمغفرة،
                    وأن يجعلها الله من أهل الفردوس الأعلى.
                </p>
            </div>
            <div className="space-y-3 text-gray-800">
                <p>• هذا الموقع <span className="font-bold text-red-600">غير رسمي</span> وهو لأغراض التدريب فقط.</p>
                <p>• مدة الامتحان <span className="font-bold">{durationMinutes} دقيقة</span>.</p>
                <p>• يتكون الامتحان من <span className="font-bold">{questionCount} سؤال</span>.</p>
                <p>• بمجرد الضغط على زر "ابدأ الامتحان"، سيبدأ المؤقت <span className="font-bold">فورًا</span> ولا يمكن إيقافه.</p>
                <p>• سيتم تسليم الامتحان تلقائيًا عند انتهاء الوقت.</p>
            </div>
            <div className="mt-8 text-center">
                <button onClick={onBegin} className="px-12 py-3 text-lg font-bold text-white transition-transform transform rounded-md shadow-xl brand-gold hover:bg-yellow-500 hover:scale-105">
                    ابدأ الامتحان
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
        
        // Ensure the total number of questions doesn't exceed the setting
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

    const handleNext = () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(currentQIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(currentQIndex - 1);
        }
    };

    return (
        <div className="max-w-4xl p-8 mx-auto bg-white rounded-lg shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b">
                <h2 className="text-xl font-bold text-brand-navy">{subject.name}</h2>
                <div className="px-4 py-2 font-bold text-white rounded-md brand-navy">
                    الوقت المتبقي: {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
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
                <button onClick={handlePrev} disabled={currentQIndex === 0} className="px-6 py-2 bg-gray-200 rounded-md disabled:opacity-50">السابق</button>
                {currentQIndex === questions.length - 1 ? (
                    <button onClick={submitExam} className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">تسليم الامتحان</button>
                ) : (
                    <button onClick={handleNext} className="px-6 py-2 text-white rounded-md brand-gold hover:bg-yellow-500">التالي</button>
                )}
            </div>
        </div>
    );
};

const getGradeDetails = (score: number, totalQuestions: number): { grade: string, color: string } => {
    if (totalQuestions === 0) return { grade: 'N/A', color: 'text-gray-500' };
    const percentage = (score / totalQuestions) * 100;
    if (percentage < 50) return { grade: 'ساقط', color: 'text-red-500' };
    if (percentage < 65) return { grade: 'مقبول', color: 'text-orange-500' };
    if (percentage < 80) return { grade: 'جيد', color: 'text-blue-500' };
    if (percentage < 90) return { grade: 'جيد جداً', color: 'text-green-500' };
    return { grade: 'امتياز', color: 'text-purple-500' };
};

const IncorrectAnswersReview: React.FC<{ attempt: ExamAttempt }> = ({ attempt }) => {
    const { state } = useContext(AppContext);

    const incorrectAnswers = useMemo(() => {
        return Object.keys(attempt.answers)
            .map(qId => {
                const question = state.questions.find(q => q.id === qId);
                if (!question) return null;
                const userAnswer = attempt.answers[qId];
                if (userAnswer !== question.correctAnswer) {
                    return { question, userAnswer };
                }
                return null;
            })
            .filter(item => item !== null) as { question: Question, userAnswer: string }[];
    }, [attempt, state.questions]);

    if (incorrectAnswers.length === 0) {
        return (
            <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-center text-green-600">رائع! لا توجد إجابات خاطئة.</h3>
            </div>
        );
    }

    return (
        <div className="p-6 mt-8 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-2xl font-bold text-center text-brand-navy">مراجعة الإجابات الخاطئة</h3>
            <div className="space-y-6">
                {incorrectAnswers.map(({ question, userAnswer }, index) => {
                    let userAnswerText: string | undefined = userAnswer;
                    let correctAnswerText: string | undefined = question.correctAnswer;
                    if (question.type === QuestionType.MCQ && question.options) {
                        userAnswerText = question.options[parseInt(userAnswer)] || "لم تجب";
                        correctAnswerText = question.options[parseInt(question.correctAnswer)];
                    } else if (question.type === QuestionType.TRUE_FALSE) {
                        userAnswerText = userAnswer === 'true' ? 'صح' : 'خطأ';
                        correctAnswerText = question.correctAnswer === 'true' ? 'صح' : 'خطأ';
                    }
                    
                    return (
                        <div key={question.id} className="p-4 border-b">
                            <p className="font-bold text-gray-800">({index + 1}) {question.text}</p>
                            <p className="mt-2 text-red-600"><span className="font-semibold">إجابتك:</span> {userAnswerText}</p>
                            <p className="mt-1 text-green-600"><span className="font-semibold">الإجابة الصحيحة:</span> {correctAnswerText}</p>
                            {question.explanation && <p className="mt-2 text-sm text-gray-500 bg-gray-100 p-2 rounded"><span className="font-semibold">توضيح:</span> {question.explanation}</p>}
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
    const [showIncorrect, setShowIncorrect] = useState(false);
    
    const subject = state.subjects.find(s => s.id === attempt.subjectId)!;
    
    const finalScore = attempt.totalQuestions > 0 ? ((attempt.score / attempt.totalQuestions) * 20).toFixed(2) : "0.00";
    const gradeDetails = getGradeDetails(attempt.score, attempt.totalQuestions);

    const handleDownloadPDF = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const filename = `certificate_${currentUser!.username}_${subject.id}.pdf`;
            await generatePDFFromElement("pdf-content", filename);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div className="max-w-4xl p-2 mx-auto sm:p-8">
            {/* This is the printable/downloadable area */}
            <div id="pdf-content" className="p-8 bg-white shadow-lg border-8 border-double border-brand-gold">
                {/* Header */}
                <header className="flex items-start justify-between pb-4 border-b-2 border-gray-200">
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-brand-navy">كلية الحقوق بقنا</h2>
                        <p className="text-sm">الفرقة الأولى (انتساب عام)</p>
                        <p className="text-xs font-bold text-brand-gold mt-2 px-2 py-0.5 inline-block border border-brand-gold rounded-full">غير رسمي</p>
                    </div>
                    <div className="text-left">
                        {/* Fix: Corrected SVG attribute casing to strokeLinecap/strokeLinejoin for TSX compatibility. */}
                        <svg className="w-20 h-20 mx-auto text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l-9 5 9 5 9-5-9-5z" /></svg>
                        <p className="mt-1 text-xs text-center text-gray-500">شعار افتراضي</p>
                    </div>
                </header>

                <h1 className="my-8 text-3xl font-bold text-center text-brand-navy">إفادة بنتيجة اختبار إلكتروني</h1>
                
                <p className="text-lg text-center text-gray-700">
                    يشهد نظام الامتحانات التجريبي بكلية الحقوق - قنا بأن الطالب/ة:
                </p>
                <p className="py-4 my-4 text-3xl font-bold text-center text-white rounded-md brand-navy">
                    {currentUser!.fullName}
                </p>
                
                <p className="text-lg text-center text-gray-700">
                    قد أتم اختبار مادة:
                </p>
                <p className="my-4 text-2xl font-bold text-center text-brand-navy">
                    {subject.name}
                </p>
                
                <p className="text-lg text-center text-gray-700">
                    بتاريخ {new Date(attempt.startTime).toLocaleDateString('ar-EG')}، وكانت نتيجته على النحو التالي:
                </p>

                {/* Results Summary */}
                <section className="grid grid-cols-1 gap-4 p-6 my-8 text-center bg-gray-50 border-t-4 border-b-4 md:grid-cols-3 border-brand-gold">
                    <div>
                        <p className="text-sm text-gray-600">الدرجة النهائية (من 20)</p>
                        <p className="text-4xl font-bold text-brand-navy">{finalScore}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-sm text-gray-600">التقدير العام</p>
                        <p className={`text-4xl font-extrabold ${gradeDetails.color}`}>{gradeDetails.grade}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">الإجابات الصحيحة</p>
                        <p className="text-4xl font-bold text-brand-navy">{attempt.score} / {attempt.totalQuestions}</p>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-8 pt-16 mt-16 text-center">
                    <div>
                        <p className="pb-8 border-b-2 border-gray-300">ختم شؤون الطلاب</p>
                        <p className="mt-2 text-sm text-gray-500">(نظام تجريبي)</p>
                    </div>
                    <div>
                        <p className="pb-8 border-b-2 border-gray-300">عميد الكلية</p>
                        <p className="mt-2 text-sm text-gray-500">(نظام تجريبي)</p>
                    </div>
                </div>

                <footer className="pt-8 mt-10 text-center border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        هذا العمل خالص لوجه الله واهداء لروحك الطاهرة.
                    </p>
                </footer>
            </div>

            {/* Action buttons (outside the printable area) */}
            <div className="flex flex-col items-center justify-center gap-4 mt-8 md:flex-row md:justify-between">
                <button onClick={onBack} className="w-full px-6 py-2 bg-gray-300 rounded-md md:w-auto hover:bg-gray-400">
                    العودة إلى لوحة التحكم
                </button>
                <div className="flex flex-col w-full gap-4 md:w-auto md:flex-row">
                    <button onClick={() => setShowIncorrect(!showIncorrect)} className="w-full px-6 py-2 text-white bg-orange-500 rounded-md md:w-auto hover:bg-orange-600">
                        {showIncorrect ? 'إخفاء مراجعة الأخطاء' : 'عرض الإجابات الخاطئة'}
                    </button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="w-full px-6 py-2 text-white bg-blue-600 rounded-md md:w-auto hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-wait">
                        {isDownloading ? 'جاري التحميل...' : 'طباعة الشهادة (PDF)'}
                    </button>
                </div>
            </div>
            
            {showIncorrect && <IncorrectAnswersReview attempt={attempt} />}
        </div>
    );
};


// --- Admin View Components ---

const QuestionForm: React.FC<{
    question: Question;
    setQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
    onSave: () => void;
    onCancel: () => void;
    subjects: Subject[];
}> = ({ question, setQuestion, onSave, onCancel, subjects }) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuestion(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleOptionChange = (index: number, value: string) => {
        setQuestion(prev => {
            if (!prev || !prev.options) return prev;
            const newOptions = [...prev.options];
            newOptions[index] = value;
            return { ...prev, options: newOptions };
        });
    };
    
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as QuestionType;
        setQuestion(prev => {
            if (!prev) return null;
            const newQuestion = { ...prev, type: newType };
            if (newType === QuestionType.TRUE_FALSE) {
                newQuestion.options = [];
                newQuestion.correctAnswer = 'true';
            } else {
                newQuestion.options = ['', '', '', ''];
                newQuestion.correctAnswer = '0';
            }
            return newQuestion;
        });
    };

    return (
        <div className="p-6 mb-8 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="mb-4 text-lg font-semibold text-brand-navy">
                {question.id.startsWith('q_new') ? 'إضافة سؤال جديد' : 'تعديل سؤال'}
            </h4>
            <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">المادة</label>
                        <select name="subjectId" value={question.subjectId} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-brand-gold focus:border-brand-gold">
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نوع السؤال</label>
                        <select name="type" value={question.type} onChange={handleTypeChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-brand-gold focus:border-brand-gold">
                            <option value={QuestionType.MCQ}>اختيار من متعدد</option>
                            <option value={QuestionType.TRUE_FALSE}>صح أو خطأ</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">نص السؤال</label>
                    <textarea name="text" value={question.text} onChange={handleChange} required rows={3} className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-brand-gold focus:border-brand-gold" />
                </div>
                
                {question.type === QuestionType.MCQ && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">الخيارات</label>
                        <div className="grid grid-cols-1 gap-2 mt-1 md:grid-cols-2">
                            {question.options?.map((opt, i) => (
                                <input key={i} type="text" value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} placeholder={`الخيار ${i + 1}`} required className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-gold focus:border-brand-gold" />
                            ))}
                        </div>
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">الإجابة الصحيحة</label>
                    {question.type === QuestionType.MCQ ? (
                        <select name="correctAnswer" value={question.correctAnswer} onChange={handleChange} className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-brand-gold focus:border-brand-gold">
                            {question.options?.map((opt, i) => <option key={i} value={String(i)}>الخيار {i + 1}{opt ? ` (${opt})` : ''}</option>)}
                        </select>
                    ) : (
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2"><input type="radio" name="correctAnswer" value="true" checked={question.correctAnswer === 'true'} onChange={handleChange} className="w-4 h-4 text-brand-gold focus:ring-brand-gold"/> صح</label>
                            <label className="flex items-center gap-2"><input type="radio" name="correctAnswer" value="false" checked={question.correctAnswer === 'false'} onChange={handleChange} className="w-4 h-4 text-brand-gold focus:ring-brand-gold"/> خطأ</label>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">التفسير (اختياري)</label>
                    <textarea name="explanation" value={question.explanation} onChange={handleChange} rows={2} className="w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-brand-gold focus:border-brand-gold" />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
                    <button type="submit" className="px-4 py-2 text-white rounded-md brand-gold hover:bg-yellow-500">حفظ السؤال</button>
                </div>
            </form>
        </div>
    );
};

const QuestionBankManagement: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(state.subjects[0]?.id || '');
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isNew, setIsNew] = useState(false);

    const filteredQuestions = state.questions.filter(q => q.subjectId === selectedSubjectId);

    const handleEdit = (question: Question) => {
        setEditingQuestion({ ...question });
        setIsNew(false);
    };

    const handleAddNew = () => {
        setEditingQuestion({
            id: `q_new_${Date.now()}`,
            subjectId: selectedSubjectId,
            type: QuestionType.MCQ,
            text: '',
            options: ['', '', '', ''],
            correctAnswer: '0',
            explanation: '',
        });
        setIsNew(true);
    };

    const handleSave = () => {
        if (!editingQuestion) return;

        if (isNew) {
            setState(prev => ({
                ...prev,
                questions: [...prev.questions, { ...editingQuestion, id: `q_${Date.now()}` }]
            }));
        } else {
            setState(prev => ({
                ...prev,
                questions: prev.questions.map(q => q.id === editingQuestion.id ? editingQuestion : q)
            }));
        }
        setEditingQuestion(null);
    };
    
    const handleDelete = (questionId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
            setState(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== questionId)
            }));
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (file.type === "application/json") {
                    const newQuestions: Omit<Question, 'id' | 'subjectId'>[] = JSON.parse(content);
                    
                    if (Array.isArray(newQuestions) && newQuestions.every(q => {
                        if (!q.text || !q.type || q.correctAnswer === undefined) return false;
                        if (q.type === QuestionType.MCQ && (!q.options || !Array.isArray(q.options) || q.options.length !== 4)) return false;
                        return true;
                    })) {
                        const subjectName = state.subjects.find(s => s.id === selectedSubjectId)?.name || 'المادة المحددة';
                        const questionsWithIds: Question[] = newQuestions.map(q => ({
                            ...(q as any), // Cast to any to avoid type issues with partial question
                            id: `q_uploaded_${Date.now()}_${Math.random()}`,
                            subjectId: selectedSubjectId,
                        }));

                        setState(prev => ({...prev, questions: [...prev.questions, ...questionsWithIds]}));
                        alert(`تمت إضافة ${newQuestions.length} سؤال بنجاح إلى مادة "${subjectName}".`);
                    } else {
                        throw new Error("ملف JSON غير صالح. تأكد من أنه يحتوي على مصفوفة من الأسئلة، وكل سؤال يحتوي على الحقول المطلوبة (text, type, correctAnswer). لأسئلة الاختيار من متعدد (mcq)، يجب أن يحتوي على حقل 'options' وبه 4 خيارات.");
                    }
                } else {
                    alert("نوع الملف غير مدعوم. يرجى رفع ملف JSON.");
                }
            } catch (error) {
                console.error("Error parsing file:", error);
                alert(`حدث خطأ أثناء معالجة الملف. يرجى التأكد من أن الملف بالصيغة الصحيحة. الخطأ: ${error instanceof Error ? error.message : String(error)}`);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input to allow re-uploading the same file
    };


    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-6 text-xl font-bold text-brand-navy">إدارة بنك الأسئلة</h3>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <label htmlFor="subject-filter" className="font-medium">اختر المادة:</label>
                    <select id="subject-filter" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-brand-gold focus:border-brand-gold">
                        {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleAddNew} className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">إضافة سؤال جديد</button>
                    <label className="px-4 py-2 text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700">
                        <span>رفع ملف (JSON)</span>
                        <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            {editingQuestion && (
                <QuestionForm 
                    question={editingQuestion} 
                    setQuestion={setEditingQuestion} 
                    onSave={handleSave} 
                    onCancel={() => setEditingQuestion(null)}
                    subjects={state.subjects}
                />
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-right whitespace-nowrap">
                    <thead className="text-white bg-brand-navy">
                        <tr>
                            <th className="p-3">نص السؤال</th>
                            <th className="p-3">النوع</th>
                            <th className="p-3">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                            <tr key={q.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-gray-900 max-w-md truncate" title={q.text}>{q.text}</td>
                                <td className="p-3 text-gray-900">{q.type === QuestionType.MCQ ? 'اختياري' : 'صح/خطأ'}</td>
                                <td className="p-3 space-x-2 rtl:space-x-reverse">
                                    <button onClick={() => handleEdit(q)} className="px-2 py-1 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600">تعديل</button>
                                    <button onClick={() => handleDelete(q.id)} className="px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">حذف</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-gray-500">لا توجد أسئلة لهذه المادة. قم بإضافة سؤال جديد.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('monitor');

    const renderContent = () => {
        switch (activeTab) {
            case 'students': return <StudentManagement />;
            case 'questions': return <QuestionBankManagement />;
            case 'exams': return <ExamManagement />;
            case 'monitor':
            default:
                return <LiveMonitor />;
        }
    };
    
    return (
        <>
            <Header />
            <div className="container p-4 mx-auto md:p-8">
                <div className="flex mb-6 overflow-x-auto border-b border-gray-300">
                    {['monitor', 'students', 'questions', 'exams'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-shrink-0 px-4 py-2 text-lg font-semibold -mb-px border-b-2 ${activeTab === tab ? 'border-brand-gold text-brand-navy' : 'border-transparent text-gray-500 hover:text-brand-navy'}`}>
                            { {monitor: 'مراقبة النظام', students: 'إدارة الطلاب', questions: 'بنك الأسئلة', exams: 'إدارة الامتحانات'}[tab] }
                        </button>
                    ))}
                </div>
                <div>{renderContent()}</div>
            </div>
        </>
    );
};

const LiveMonitor: React.FC = () => {
    const { state } = useContext(AppContext);
    // This is a simulation. In a real app, this would come from websockets.
    const onlineStudents = state.users.filter(u => u.role === UserRole.STUDENT).slice(0, 5); // Increased for more data
    const studentsInExam = (state.examAttempts || []).filter(a => a.status === 'in-progress'); // This will always be empty in our sim

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="mb-4 text-xl font-bold text-brand-navy">طلاب متصلون حاليًا ({onlineStudents.length})</h3>
                <ul className="space-y-2">
                    {onlineStudents.map(u => <li key={u.id} className="p-2 text-gray-900 bg-gray-50 rounded">{u.fullName} ({u.username})</li>)}
                </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="mb-4 text-xl font-bold text-brand-navy">طلاب يؤدون الامتحان الآن ({studentsInExam.length})</h3>
                 <p className="text-gray-500">لا يوجد طلاب يؤدون الامتحان حاليًا (محاكاة).</p>
            </div>
        </div>
    );
}

const StudentManagement: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    
    const resetPassword = (userId: string) => {
        setState(prev => ({...prev, users: prev.users.map(u => u.id === userId ? {...u, passwordHash: '0000'} : u)}));
        alert('تمت إعادة تعيين كلمة المرور إلى 0000');
    };

    const deleteStudent = (userId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
            setState(prev => ({...prev, users: prev.users.filter(u => u.id !== userId)}));
        }
    };
    
    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-xl font-bold text-brand-navy">إدارة حسابات الطلاب</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-right whitespace-nowrap">
                    <thead className="text-white bg-brand-navy">
                        <tr>
                            <th className="p-3">الاسم الكامل</th>
                            <th className="p-3">اسم المستخدم</th>
                            <th className="p-3">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.users.filter(u => u.role === UserRole.STUDENT).map(user => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-gray-900">{user.fullName}</td>
                                <td className="p-3 text-gray-900">{user.username}</td>
                                <td className="p-3 space-x-2 rtl:space-x-reverse">
                                    <button onClick={() => resetPassword(user.id)} className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">إعادة كلمة السر</button>
                                    <button onClick={() => deleteStudent(user.id)} className="px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ExamManagement: React.FC = () => {
    const { state, setState } = useContext(AppContext);
    const [viewingResultsSubjectId, setViewingResultsSubjectId] = useState<string | null>(null);

    const subjectForResults = useMemo(() => 
        state.subjects.find(s => s.id === viewingResultsSubjectId),
        [state.subjects, viewingResultsSubjectId]
    );

    const attemptsForSubject = useMemo(() => {
        if (!viewingResultsSubjectId) return [];
        
        const attempts = state.examAttempts || [];
        const users = state.users || [];

        return attempts
            .filter(a => a.subjectId === viewingResultsSubjectId)
            .map(attempt => {
                const user = users.find(u => u.id === attempt.userId);
                return { ...attempt, user };
            })
            .sort((a, b) => b.score - a.score);
    }, [viewingResultsSubjectId, state.examAttempts, state.users]);

    const handleExamSettingsChange = (
        subjectId: string, 
        key: 'isOpen' | 'section' | 'questionCount' | 'durationMinutes' | 'allowRetakes', 
        value: any
    ) => {
        setState(prev => {
            const newSettings = { ...prev.examSettings };
            const currentSettings = newSettings[subjectId] || { 
                isOpen: true, 
                questionCount: 60, 
                durationMinutes: 60, 
                allowRetakes: false 
            };
            newSettings[subjectId] = { ...currentSettings, [key]: value };
            return { ...prev, examSettings: newSettings };
        });
    };
    
    const resetStudentAttempt = (subjectId: string) => {
        const username = prompt("أدخل اسم المستخدم للطالب لتصفير محاولته:");
        if (!username) return;

        const user = state.users.find(u => u.username === username);
        if (!user) {
            alert("لم يتم العثور على الطالب.");
            return;
        }

        setState(prev => ({
            ...prev,
            examAttempts: (prev.examAttempts || []).filter(a => !(a.userId === user.id && a.subjectId === subjectId))
        }));
        alert(`تم تصفير محاولة الطالب ${username} في هذه المادة.`);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-4 text-xl font-bold text-brand-navy">إدارة الامتحانات</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-right whitespace-nowrap">
                    <thead className="text-white bg-brand-navy">
                        <tr>
                            <th className="p-3">المادة</th>
                            <th className="p-3">الإعدادات</th>
                            <th className="p-3">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.subjects.map(subject => {
                            const settings = state.examSettings[subject.id] || { isOpen: true, questionCount: 60, durationMinutes: 60, allowRetakes: false };
                            const subjectSections = [...new Set(state.questions.filter(q => q.subjectId === subject.id && q.section).map(q => q.section!))];
                            const hasSections = subjectSections.length > 0;

                            return (
                                <tr key={subject.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 text-gray-900 align-top">{subject.name}</td>
                                    <td className="p-3 text-gray-900 align-top">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">الأسئلة:</label>
                                                <select
                                                    value={settings.questionCount}
                                                    onChange={(e) => handleExamSettingsChange(subject.id, 'questionCount', parseInt(e.target.value))}
                                                    className="w-full p-1 text-sm border border-gray-300 rounded-md"
                                                >
                                                    {[30, 40, 60, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-600">الزمن (دقيقة):</label>
                                                <select
                                                    value={settings.durationMinutes}
                                                    onChange={(e) => handleExamSettingsChange(subject.id, 'durationMinutes', parseInt(e.target.value))}
                                                    className="w-full p-1 text-sm border border-gray-300 rounded-md"
                                                >
                                                    {[30, 40, 60, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </div>
                                            {hasSections && (
                                                <div className="col-span-2">
                                                    <label className="text-xs font-medium text-gray-600">القسم:</label>
                                                    <select
                                                        value={settings.section || 'all'}
                                                        onChange={(e) => handleExamSettingsChange(subject.id, 'section', e.target.value)}
                                                        className="w-full p-1 text-sm border border-gray-300 rounded-md"
                                                    >
                                                        <option value="all">الجميع</option>
                                                        {subjectSections.map(section => (
                                                          <option key={section} value={section}>{section.replace(/^[أ-ب]\.\s*/, '')}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <div className="flex items-center col-span-2 mt-1">
                                                <input
                                                    type="checkbox"
                                                    id={`retake-${subject.id}`}
                                                    checked={settings.allowRetakes}
                                                    onChange={() => handleExamSettingsChange(subject.id, 'allowRetakes', !settings.allowRetakes)}
                                                    className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
                                                />
                                                <label htmlFor={`retake-${subject.id}`} className="mr-2 text-sm text-gray-700">السماح بإعادة المحاولة</label>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 space-y-2 align-top">
                                        <button onClick={() => handleExamSettingsChange(subject.id, 'isOpen', !settings.isOpen)} className={`w-full px-2 py-1 text-sm text-white rounded ${settings.isOpen ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                            {settings.isOpen ? 'إغلاق الامتحان' : 'فتح الامتحان'}
                                        </button>
                                        <button onClick={() => resetStudentAttempt(subject.id)} className="w-full px-2 py-1 text-sm text-white bg-indigo-500 rounded hover:bg-indigo-600">
                                            تصفير محاولة
                                        </button>
                                        <button onClick={() => setViewingResultsSubjectId(subject.id)} className="w-full px-2 py-1 text-sm text-white bg-gray-500 rounded hover:bg-gray-600">
                                            عرض النتائج
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {viewingResultsSubjectId && subjectForResults && (
                <div className="pt-8 mt-8 border-t">
                     <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-brand-navy">نتائج امتحان: {subjectForResults.name}</h4>
                        <button onClick={() => setViewingResultsSubjectId(null)} className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300">إغلاق</button>
                    </div>
                    {attemptsForSubject.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right whitespace-nowrap">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 font-semibold text-gray-600">اسم الطالب</th>
                                        <th className="p-3 font-semibold text-gray-600">اسم المستخدم</th>
                                        <th className="p-3 font-semibold text-gray-600">الدرجة (من 20)</th>
                                        <th className="p-3 font-semibold text-gray-600">التقدير العام</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attemptsForSubject.map(attempt => {
                                        const finalScore = attempt.totalQuestions > 0 ? ((attempt.score / attempt.totalQuestions) * 20).toFixed(2) : "0.00";
                                        const gradeDetails = getGradeDetails(attempt.score, attempt.totalQuestions);
                                        return (
                                            <tr key={attempt.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3 text-gray-900">{attempt.user?.fullName || 'N/A'}</td>
                                                <td className="p-3 text-gray-900">{attempt.user?.username || 'N/A'}</td>
                                                <td className="p-3 text-gray-900">{finalScore}</td>
                                                <td className={`p-3 font-bold ${gradeDetails.color}`}>{gradeDetails.grade}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">لم يقم أي طالب بأداء هذا الامتحان بعد.</p>
                    )}
                </div>
            )}
        </div>
    );
};


export default App;
