import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MOCK_COURSES = [
  {
    id: 'course-1',
    title: 'Hardware Link Installation Protocol',
    category: 'Hardware',
    difficulty: 'Advanced',
    duration: '4.5 Hours',
    instructor_id: 'ptr-1',
    is_approved: true,
    revenue_share: 75,
    price_usd: 299,
    price_crypto: "0.08",
    description: 'Master the deployment of AXiM Core relay hardware.',
    long_description: 'This comprehensive certification covers the physical and logical layers of the AXiM Core network, focusing on relay synchronization and neural-link stability.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    badge: {
      id: 'badge-1',
      name: 'Relay Architect',
      icon: 'Cpu',
      description: 'Master of physical network layer deployment.'
    },
    resources: [
      { id: 'r1', title: 'Relay Schematic v4.2', type: 'pdf', size: '12.4MB' },
      { id: 'r2', title: 'Neural Handshake Logic', type: 'image', size: '2.1MB' }
    ],
    modules: [
      {
        id: 'm1',
        title: 'Physical Layer Integration',
        lessons: [
          { id: 'l1', title: 'Relay Chassis Mounting', type: 'video', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { id: 'l2', title: 'Signal Grounding Theory', type: 'article', content: '<h3>Grounding Protocol</h3><p>Ensure all relays are bonded to the primary chassis ground to prevent neural interference...</p>' }
        ]
      },
      {
        id: 'm2',
        title: 'Network Synchronization',
        lessons: [
          { id: 'l3', title: 'Live: Handshake Calibration', type: 'live', instructor: 'Onyx Prime' },
          { 
            id: 'l4', 
            title: 'Final Knowledge Check', 
            type: 'quiz',
            quizData: [
              {
                question_text: "What is the primary cause of Layer-2 handshake failure?",
                options: { A: "Neural Latency", B: "Chassis Vibration", C: "Incompatible Firmware", D: "Power Surge" },
                correct_answer: "A",
                remediation_hint: "Review the Neural Link Stability guide in the Vault."
              }
            ]
          }
        ]
      }
    ]
  }
];


// Simulated Supabase background network request
const backgroundSync = async (endpoint, payload) => {
  try {
    console.log(`[BACKGROUND SYNC] ${endpoint}`, payload);
    // Suppress await fetch or similar
    await new Promise(r => setTimeout(r, 500));
  } catch (error) {
    console.error(`[BACKGROUND SYNC ERROR] ${endpoint}`, error);
  }
};

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
      isSearchOpen: false,
      activeCategory: 'All',
      
      // Partner & Admin State
      partners: [{ id: 'ptr-1', user_id: 'usr-admin', name: 'Onyx Prime', revenue_share: 75 }],
      partnerApplications: [],
      earnings: [],
      promoCodes: [{ id: 'p1', code: 'AXIM2024', discount: 15, uses: 12, max: 100 }],
      studentQueries: [
        { id: 'q-1', student: 'Alpha_7', course: 'Hardware Link', text: 'How do I stabilize the relay chassis?', timestamp: new Date().toISOString(), status: 'pending' }
      ],
      
      // Gamification & Notifications
      xp: 0,
      level: 1,
      streak: 3,
      notifications: [],
      dailyQuests: [
        { id: 'q1', title: 'Deep Study', description: 'Complete 2 lessons', target: 2, current: 0, rewardXp: 250, completed: false },
        { id: 'q2', title: 'Network Citizen', description: 'Ask Onyx AI a question', target: 1, current: 0, rewardXp: 100, completed: false }
      ],

      // Auth Actions
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setWalletAddress: (address) => set({ walletAddress: address }),
      
      // UI Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
      setActiveCategory: (category) => set({ activeCategory: category }),

      // Notification Logic
      addNotification: (n) => set(s => ({ 
        notifications: [{ ...n, id: Date.now(), timestamp: new Date().toISOString() }, ...s.notifications].slice(0, 20) 
      })),
      clearNotifications: () => set({ notifications: [] }),

      // Course Management
      addCourse: (courseData) => set(state => ({
        courses: state.courses.some(c => c.id === courseData.id)
          ? state.courses.map(c => c.id === courseData.id ? courseData : c)
          : [...state.courses, courseData]
      })),

      approveCourse: (id) => {
        set(s => ({ courses: s.courses.map(c => c.id === id ? { ...c, is_approved: true } : c) }));
        const course = get().courses.find(c => c.id === id);
        get().addNotification({ 
          title: 'Curriculum Authorized', 
          description: `${course.title} is now live on the AXiM Array.`, 
          type: 'success', 
          icon: 'ShieldCheck' 
        });
      },

      // Enrollment & Progress
      enrollInCourse: (courseId, paymentMethod = 'fiat', txHash = null) => {
        const { enrollments, user, courses, walletAddress } = get();
        if (enrollments.some(e => e.course_id === courseId)) return;
        
        const course = courses.find(c => c.id === courseId);
        const newEnr = {
          id: `enr-${Date.now()}`,
          course_id: courseId,
          user_id: user?.id || walletAddress || 'anon',
          status: 'active',
          progress: [],
          payment_method: paymentMethod,
          tx_hash: txHash,
          created_at: new Date().toISOString()
        };

        set({ enrollments: [...enrollments, newEnr] });
        backgroundSync('/api/enrollments', newEnr);
        
        // Reward Enrollment XP
        get().addXp(500, "New Curriculum Linked");
        
        get().addNotification({
          title: 'Access Protocol Initiated',
          description: `Successfully linked to ${course?.title}. Operation start.`,
          type: 'enrollment',
          icon: 'Activity'
        });

        // Track Earnings for Admin/Teacher
        const earningsRecord = {
          id: `earn-${Date.now()}`,
          course_id: courseId,
          partner_id: course.instructor_id,
          amount: course.price_usd * 0.75,
          platform_amount: course.price_usd * 0.25,
          timestamp: new Date().toISOString()
        };
        set(state => ({ earnings: [...state.earnings, earningsRecord] }));
      },

      updateProgress: (enrollmentId, lessonId) => {
        set(state => ({
          enrollments: state.enrollments.map(e => {
            if (e.id !== enrollmentId) return e;
            const alreadyCompleted = e.progress.some(p => p.lesson_id === lessonId);
            if (alreadyCompleted) return e;
            
            const newProgress = [...e.progress, { lesson_id: lessonId, is_completed: true, completed_at: new Date().toISOString() }];
            const course = state.courses.find(c => c.id === e.course_id);
            const totalLessons = course.modules.flatMap(m => m.lessons).length;
            const isCompleted = newProgress.length === totalLessons;

            // Update Daily Quests
            const updatedQuests = state.dailyQuests.map(q => {
              if (q.id === 'q1' && !q.completed) {
                const newCurrent = q.current + 1;
                const completed = newCurrent >= q.target;
                if (completed) get().addXp(q.rewardXp, "Daily Quest Secured");
                return { ...q, current: newCurrent, completed };
              }
              return q;
            });

            if (isCompleted) {
              get().addXp(1000, "Curriculum Mastery Attained");
              get().addNotification({
                title: 'Certification Verified',
                description: `Operator has successfully mastered ${course.title}.`,
                type: 'success',
                icon: 'Award'
              });
              if (course.badge) get().unlockBadge(course.badge);
            } else {
              get().addXp(150, "Technical Objective Secured");
            }

            const updatedEnr = {
              ...e, 
              progress: newProgress, 
              status: isCompleted ? 'completed' : 'active', 
              completed_at: isCompleted ? new Date().toISOString() : null,
              dailyQuests: updatedQuests
            };
            get().clearQuizDraft(lessonId);
            backgroundSync('/api/progress', { enrollmentId, lessonId, newProgress });
            return updatedEnr;
          })
        }));
      },


      // Quiz Caching
      saveQuizDraft: (lessonId, draft) => {
        try {
          sessionStorage.setItem(`quiz_draft_${lessonId}`, JSON.stringify(draft));
        } catch (err) {
          console.error("Failed to save quiz draft", err);
        }
      },
      getQuizDraft: (lessonId) => {
        try {
          const draft = sessionStorage.getItem(`quiz_draft_${lessonId}`);
          return draft ? JSON.parse(draft) : null;
        } catch (err) {
          console.error("Failed to get quiz draft", err);
          return null;
        }
      },
      clearQuizDraft: (lessonId) => {
        try {
          sessionStorage.removeItem(`quiz_draft_${lessonId}`);
        } catch (err) {
          console.error("Failed to clear quiz draft", err);
        }
      },

      addXp: (amount, reason) => {
        set(state => {
          const newXp = state.xp + amount;
          const nextLevelXp = state.level * 1000;
          let newLevel = state.level;
          if (newXp >= nextLevelXp) {
            newLevel += 1;
            get().addNotification({ 
              title: 'Grade Promotion', 
              description: `You have attained Rank ${newLevel} Architect status.`, 
              type: 'level', 
              icon: 'TrendingUp' 
            });
          }
          return { 
            xp: newXp, 
            level: newLevel, 
            notifications: [{ 
              id: Date.now(), 
              title: reason, 
              description: `+${amount} XP Synchronized`, 
              type: 'xp', 
              icon: 'Zap' 
            }, ...state.notifications].slice(0, 20) 
          };
        });
      },

      // Partner Management
      applyForPartnership: (app) => set(s => ({ 
        partnerApplications: [...s.partnerApplications, { ...app, id: Date.now(), status: 'pending' }] 
      })),

      approvePartner: (id) => {
        const app = get().partnerApplications.find(a => a.id === id);
        if (!app) return;

        const newPartner = {
          id: `ptr-${Date.now()}`,
          user_id: app.user_id,
          name: app.name,
          revenue_share: parseInt(app.revenue_expectation) || 70
        };

        set(s => ({
          partners: [...s.partners, newPartner],
          partnerApplications: s.partnerApplications.map(a => a.id === id ? { ...a, status: 'approved' } : a)
        }));

        get().addNotification({
          title: 'Architect Protocol Active',
          description: `${app.name} has been authorized as a Curriculum Architect.`,
          type: 'success',
          icon: 'Users'
        });
      },

      // Analytics
      getPartnerStats: (partnerId) => {
        const { enrollments, courses, earnings } = get();
        const pCourses = courses.filter(c => c.instructor_id === partnerId);
        const ids = pCourses.map(c => c.id);
        const pEnrs = enrollments.filter(e => ids.includes(e.course_id));
        const partnerEarnings = earnings.filter(e => e.partner_id === partnerId);
        
        return {
          totalStudents: pEnrs.length,
          completionRate: pEnrs.length > 0 ? (pEnrs.filter(e => e.status === 'completed').length / pEnrs.length) * 100 : 0,
          grossRevenue: partnerEarnings.reduce((a, c) => a + c.amount, 0)
        };
      },

      // Comms
      addAiMessage: (msg) => {
        set(s => ({ aiChatHistory: [...s.aiChatHistory, { ...msg, id: Date.now() }] }));
        
        // Update Daily Quest for AI Interaction
        set(state => ({
          dailyQuests: state.dailyQuests.map(q => {
            if (q.id === 'q2' && !q.completed) {
              const newCurrent = q.current + 1;
              const completed = newCurrent >= q.target;
              if (completed) get().addXp(q.rewardXp, "AI Consultation Rewards Secured");
              return { ...q, current: newCurrent, completed };
            }
            return q;
          })
        }));
      },
      
      resolveQuery: (id) => set(s => ({ 
        studentQueries: s.studentQueries.map(q => q.id === id ? { ...q, status: 'answered' } : q) 
      })),

      addPromoCode: (p) => set(s => ({ 
        promoCodes: [...s.promoCodes, { ...p, id: Date.now(), uses: 0 }] 
      }))
    }),
    { name: 'axim-academy-vFinal-1.0' }
  )
);