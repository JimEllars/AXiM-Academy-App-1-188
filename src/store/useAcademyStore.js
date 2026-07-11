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
      
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setWalletAddress: (address) => set({ walletAddress: address }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveCategory: (category) => set({ activeCategory: category }),
      
      addAiMessage: (message) => set((state) => ({ 
        aiChatHistory: [...state.aiChatHistory, { ...message, id: Date.now() }] 
      })),

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
      },

      updateProgress: (enrollmentId, lessonId, score = null) => {
        set((state) => {
          const newEnrollments = state.enrollments.map(enr => {
            if (enr.id === enrollmentId) {
              const alreadyCompleted = enr.progress.some(p => p.lesson_id === lessonId);
              const newProgress = alreadyCompleted ? enr.progress : [...enr.progress, { lesson_id: lessonId, is_completed: true }];
              
              const quizScores = { ...enr.quizScores };
              if (score !== null) quizScores[lessonId] = score;

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
    { name: 'axim-academy-v10' }
  )
);