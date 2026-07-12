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
      studentQueries: [],
      
      // Gamification & Notifications
      xp: 0,
      level: 1,
      streak: 3,
      notifications: [],
      dailyQuests: [
        { id: 'q1', title: 'Deep Study', description: 'Complete 2 lessons', target: 2, current: 0, rewardXp: 250, completed: false },
        { id: 'q2', title: 'Network Citizen', description: 'Ask Onyx AI a question', target: 1, current: 0, rewardXp: 100, completed: false }
      ],

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setWalletAddress: (address) => set({ walletAddress: address }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
      setActiveCategory: (category) => set({ activeCategory: category }),

      addNotification: (n) => set(s => ({ 
        notifications: [{ ...n, id: Date.now(), timestamp: new Date().toISOString() }, ...s.notifications].slice(0, 20) 
      })),
      
      clearNotifications: () => set({ notifications: [] }),

      enrollInCourse: (courseId, paymentMethod = 'fiat', txHash = null) => {
        const { enrollments, user, courses } = get();
        if (enrollments.some(e => e.course_id === courseId)) return;
        
        const course = courses.find(c => c.id === courseId);
        const newEnr = {
          id: `enr-${Date.now()}`,
          course_id: courseId,
          user_id: user?.id || 'anon',
          status: 'active',
          progress: [],
          payment_method: paymentMethod,
          tx_hash: txHash,
          created_at: new Date().toISOString()
        };

        set({ enrollments: [...enrollments, newEnr] });
        get().addNotification({
          title: 'Access Protocol Initiated',
          description: `You have successfully enrolled in ${course?.title}.`,
          type: 'enrollment',
          icon: 'ShieldCheck'
        });
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

            if (isCompleted) {
              get().addXp(1000, "Course Certification Earned");
              get().addNotification({
                title: 'Certification Verified',
                description: `Completed ${course.title}. SBT Minting Protocol ready.`,
                type: 'success',
                icon: 'Award'
              });
              if (course.badge) get().unlockBadge(course.badge);
            } else {
              get().addXp(150, "Objective Secured");
            }

            return { ...e, progress: newProgress, status: isCompleted ? 'completed' : 'active', completed_at: isCompleted ? new Date().toISOString() : null };
          })
        }));
      },

      addXp: (amount, reason) => {
        set(state => {
          const newXp = state.xp + amount;
          const nextLevelXp = state.level * 1000;
          let newLevel = state.level;
          if (newXp >= nextLevelXp) {
            newLevel += 1;
            get().addNotification({ title: 'Grade Promotion', description: `You have attained Rank ${newLevel} Architect status.`, type: 'level', icon: 'TrendingUp' });
          }
          return { xp: newXp, level: newLevel, notifications: [{ id: Date.now(), title: reason, description: `+${amount} XP Synchronized`, type: 'xp', icon: 'Zap' }, ...state.notifications].slice(0, 20) };
        });
      },

      unlockBadge: (badge) => set(s => ({ unlockedBadges: [...s.unlockedBadges, badge] })),
      addAiMessage: (msg) => set(s => ({ aiChatHistory: [...s.aiChatHistory, { ...msg, id: Date.now() }] })),
      addCourse: (c) => set(s => ({ courses: [...s.courses, c] })),
      approveCourse: (id) => {
        set(s => ({ courses: s.courses.map(c => c.id === id ? { ...c, is_approved: true } : c) }));
        get().addNotification({ title: 'Curriculum Approved', description: `Your course is now live.`, type: 'system', icon: 'Check' });
      },
      addPromoCode: (p) => set(s => ({ promoCodes: [...s.promoCodes, { ...p, id: Date.now(), uses: 0 }] })),
      applyForPartnership: (app) => set(s => ({ partnerApplications: [...s.partnerApplications, { ...app, id: Date.now(), status: 'pending' }] })),
      approvePartner: (id) => set(s => ({
        partnerApplications: s.partnerApplications.map(a => a.id === id ? { ...a, status: 'approved' } : a)
      }))
    }),
    { name: 'axim-academy-full-v1' }
  )
);