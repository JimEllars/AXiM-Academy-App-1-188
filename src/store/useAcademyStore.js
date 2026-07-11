import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MOCK_COURSES = [
  {
    id: 'course-1',
    title: 'Hardware Link Installation Protocol',
    category: 'Hardware',
    difficulty: 'Advanced',
    duration: '4.5 Hours',
    description: 'Master the deployment of AXiM Core relay hardware. Learn vector database integration and edge serverless deployment.',
    long_description: 'This comprehensive certification covers the physical and logical layers of the AXiM Core network. You will learn to configure Raspberry Pi 5 clusters as edge nodes, implement pgvector for real-time RAG (Retrieval-Augmented Generation), and secure your nodes using Arbitrum-based identity proofs.',
    price_usd: 299.00,
    price_crypto: "0.08",
    visibility: 'public',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    contractAddress: "0x123...abc",
    modules: [
      {
        id: 'mod-1',
        title: 'System Architecture',
        lessons: [
          { id: 'les-1', title: 'Edge Network Overview', type: 'video', duration: '12m' },
          { id: 'les-2', title: 'Hardware Requirements', type: 'article', content: '<h3>Node Specifications</h3><p>To run an AXiM Core relay, you need a minimum of 8GB RAM and a high-speed NVMe storage device...</p>' },
          { id: 'les-3', title: 'Knowledge Check', type: 'interactive_quiz' }
        ]
      },
      {
        id: 'mod-2',
        title: 'Deployment & Scaling',
        lessons: [
          { id: 'les-4', title: 'Provisioning Scripts', type: 'video', duration: '25m' },
          { id: 'les-5', title: 'Scaling with Docker', type: 'article', content: '<h3>Containerization</h3><p>Deploying multiple instances using Docker Swarm or K8s...</p>' }
        ]
      }
    ]
  },
  {
    id: 'course-2',
    title: 'Decentralized Finance Fundamentals',
    category: 'Finance',
    difficulty: 'Beginner',
    duration: '2 Hours',
    description: 'Understand the Green Machine ledger, Arbitrum One integrations, and Soulbound Token architectures.',
    long_description: 'A deep dive into the economic engine of the AXiM ecosystem. Learn how liquidity flows through the Green Machine protocol and how to leverage SBTs for permissionless access control.',
    price_usd: 149.00,
    price_crypto: "0.04",
    visibility: 'public',
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    contractAddress: "0x456...def",
    modules: [
      {
        id: 'mod-3',
        title: 'Economic Models',
        lessons: [
          { id: 'les-6', title: 'Introduction to Green Machine', type: 'video', duration: '15m' }
        ]
      }
    ]
  },
  {
    id: 'course-3',
    title: 'Onyx AI Development',
    category: 'AI',
    difficulty: 'Intermediate',
    duration: '6 Hours',
    description: 'Build autonomous agents using Onyx AI. Master prompt engineering for industrial automation.',
    long_description: 'Learn to interface with the Onyx LLM gateway. This course covers state-machine logic, function calling for hardware control, and ethical guardrails for autonomous systems.',
    price_usd: 399.00,
    price_crypto: "0.12",
    visibility: 'public',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    contractAddress: "0x789...ghi",
    modules: []
  }
];

export const useAcademyStore = create(
  persist(
    (set, get) => ({
      user: null,
      walletAddress: null,
      isConnected: false,
      courses: MOCK_COURSES,
      enrollments: [],
      searchQuery: '',
      activeCategory: 'All',
      
      setUser: (user) => set({ user }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveCategory: (cat) => set({ activeCategory: cat }),
      
      setWalletAddress: (address) => set({ 
        walletAddress: address,
        isConnected: !!address 
      }),

      disconnectWallet: () => set({ 
        walletAddress: null, 
        isConnected: false 
      }),

      enrollInCourse: (courseId, paymentMethod = 'fiat', txHash = null) => {
        const { enrollments, walletAddress } = get();
        if (enrollments.some(e => e.course_id === courseId)) return;

        const newEnrollment = {
          id: `enr-${Date.now()}`,
          course_id: courseId,
          status: 'active',
          progress: [],
          payment_method: paymentMethod,
          tx_hash: txHash,
          sbt_mint_status: walletAddress ? 'pending' : 'not_applicable',
          created_at: new Date().toISOString()
        };

        set({ enrollments: [...enrollments, newEnrollment] });
      },

      updateProgress: (enrollmentId, lessonId, score = null) => {
        set((state) => ({
          enrollments: state.enrollments.map(enr => {
            if (enr.id === enrollmentId) {
              const alreadyCompleted = enr.progress.some(p => p.lesson_id === lessonId);
              if (alreadyCompleted) return enr;

              const newProgress = [...enr.progress, { lesson_id: lessonId, is_completed: true, score }];
              
              // Find total lessons for this course
              const course = state.courses.find(c => c.id === enr.course_id);
              const totalLessons = course?.modules.flatMap(m => m.lessons).length || 0;
              const isComplete = newProgress.length >= totalLessons && totalLessons > 0;

              return {
                ...enr,
                progress: newProgress,
                status: isComplete ? 'completed' : enr.status,
                completed_at: isComplete ? new Date().toISOString() : enr.completed_at
              };
            }
            return enr;
          })
        }));
      }
    }),
    {
      name: 'axim-academy-storage-v2',
    }
  )
);