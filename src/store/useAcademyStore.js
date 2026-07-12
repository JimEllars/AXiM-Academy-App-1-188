import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MOCK_COURSES = [
  {
    id: 'course-1',
    title: 'Hardware Link Installation Protocol',
    category: 'Hardware',
    difficulty: 'Advanced',
    duration: '4.5 Hours',
    instructor_id: 'inst-1',
    badge: {
      id: 'badge-hw-1',
      name: 'Hardware Architect',
      icon: 'Cpu',
      color: '#10b981',
      description: 'Awarded for mastering AXiM Core relay deployment.'
    },
    description: 'Master the deployment of AXiM Core relay hardware.',
    long_description: 'This comprehensive certification covers the physical and logical layers of the AXiM Core network.',
    price_usd: 299.00,
    price_crypto: "0.08",
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    resources: [
      { id: 'res-1', title: 'Relay Schematic v4.2', type: 'pdf', size: '2.4MB' },
      { id: 'res-2', title: 'Network Topology Map', type: 'image', size: '1.1MB' }
    ],
    modules: [
      {
        id: 'mod-1',
        title: 'System Architecture',
        lessons: [
          { 
            id: 'les-1', 
            title: 'Edge Network Overview', 
            type: 'video', 
            duration: '12m',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
          },
          { 
            id: 'les-live', 
            title: 'Q&A: Hardware Debugging', 
            type: 'live', 
            startTime: new Date(Date.now() + 3600000).toISOString(),
            instructor: 'Onyx AI / Senior Architect'
          },
          { 
            id: 'les-2', 
            title: 'Hardware Requirements', 
            type: 'article', 
            content: '<h3>Node Specifications</h3><p>To run an AXiM Core relay, you need a minimum of 8GB RAM...</p>' 
          }
        ]
      }
    ]
  }
];

const INITIAL_QUESTS = [
  { id: 'q1', title: 'Neural Uplink', description: 'Complete 1 lesson today', target: 1, current: 0, rewardXp: 150, type: 'lesson' },
  { id: 'q2', title: 'AI Dialogue', description: 'Query Onyx AI 3 times', target: 3, current: 0, rewardXp: 100, type: 'ai' },
  { id: 'q3', title: 'Mastery', description: 'Score 100% on a quiz', target: 1, current: 0, rewardXp: 300, type: 'quiz' }
];

export const useAcademyStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: 'student',
      walletAddress: null,
      courses: MOCK_COURSES,
      enrollments: [],
      unlockedBadges: [],
      aiChatHistory: [],
      searchQuery: '',
      activeCategory: 'All',
      
      // Gamification State
      xp: 0,
      level: 1,
      streak: 0,
      lastActivityDate: null,
      dailyQuests: INITIAL_QUESTS,
      notifications: [],

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setWalletAddress: (address) => set({ walletAddress: address }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      
      addNotification: (notif) => set((state) => ({
        notifications: [{ ...notif, id: Date.now() }, ...state.notifications].slice(0, 5)
      })),

      addAiMessage: (message) => {
        set((state) => ({ 
          aiChatHistory: [...state.aiChatHistory, { ...message, id: Date.now() }] 
        }));
        get().updateQuestProgress('ai', 1);
      },

      updateQuestProgress: (type, amount) => {
        set((state) => {
          let xpGained = 0;
          const newQuests = state.dailyQuests.map(q => {
            if (q.type === type && q.current < q.target) {
              const newCurrent = q.current + amount;
              if (newCurrent >= q.target) {
                xpGained += q.rewardXp;
                return { ...q, current: q.target, completed: true };
              }
              return { ...q, current: newCurrent };
            }
            return q;
          });

          if (xpGained > 0) {
            get().addXp(xpGained, `Quest Complete: +${xpGained} XP`);
          }
          return { dailyQuests: newQuests };
        });
      },

      addXp: (amount, reason) => {
        set((state) => {
          const newXp = state.xp + amount;
          const nextLevelXp = state.level * 1000;
          let newLevel = state.level;
          
          if (newXp >= nextLevelXp) {
            newLevel += 1;
            get().addNotification({ title: 'Level Up!', description: `You reached Level ${newLevel}`, type: 'level' });
          }

          if (reason) {
            get().addNotification({ title: 'XP Gained', description: reason, type: 'xp' });
          }

          return { xp: newXp, level: newLevel };
        });
      },

      updateStreak: () => {
        const today = new Date().toDateString();
        const { lastActivityDate, streak } = get();
        
        if (lastActivityDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActivityDate === yesterday.toDateString()) {
          set({ streak: streak + 1, lastActivityDate: today });
          get().addXp(50 * (streak + 1), `Streak Day ${streak + 1}: Bonus XP!`);
        } else {
          set({ streak: 1, lastActivityDate: today });
          get().addXp(50, 'New Streak Started!');
        }
      },

      enrollInCourse: (courseId) => {
        const { enrollments } = get();
        if (enrollments.some(e => e.course_id === courseId)) return;
        const newEnrollment = {
          id: `enr-${Date.now()}`,
          course_id: courseId,
          status: 'active',
          progress: [],
          quizScores: {},
          created_at: new Date().toISOString()
        };
        set({ enrollments: [...enrollments, newEnrollment] });
        get().addXp(200, 'Course Enrollment: +200 XP');
      },

      updateProgress: (enrollmentId, lessonId, score = null) => {
        set((state) => {
          const newEnrollments = state.enrollments.map(enr => {
            if (enr.id === enrollmentId) {
              const alreadyCompleted = enr.progress.some(p => p.lesson_id === lessonId);
              if (alreadyCompleted) return enr;

              const newProgress = [...enr.progress, { lesson_id: lessonId, is_completed: true }];
              const quizScores = { ...enr.quizScores };
              if (score !== null) {
                quizScores[lessonId] = score;
                if (score === 100) get().updateQuestProgress('quiz', 1);
              }

              get().updateQuestProgress('lesson', 1);
              get().addXp(100, 'Lesson Complete: +100 XP');
              get().updateStreak();

              const course = state.courses.find(c => c.id === enr.course_id);
              const totalLessons = course?.modules.flatMap(m => m.lessons).length || 0;
              const isComplete = newProgress.length >= totalLessons && totalLessons > 0;

              if (isComplete && course.badge) {
                const badgeExists = state.unlockedBadges.some(b => b.id === course.badge.id);
                if (!badgeExists) {
                  setTimeout(() => {
                    set(s => ({ 
                      unlockedBadges: [...s.unlockedBadges, { ...course.badge, unlocked_at: new Date().toISOString() }] 
                    }));
                    get().addXp(1000, 'Certification Earned: +1000 XP');
                  }, 500);
                }
              }

              return {
                ...enr,
                progress: newProgress,
                quizScores,
                status: isComplete ? 'completed' : enr.status,
                completed_at: isComplete ? new Date().toISOString() : enr.completed_at
              };
            }
            return enr;
          });
          return { enrollments: newEnrollments };
        });
      }
    }),
    { name: 'axim-academy-v12' }
  )
);