import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PartnerApplication from './pages/PartnerApplication';
import PartnerOnboarding from './pages/PartnerOnboarding';
import Learn from './pages/Learn';
import CertificatePage from './pages/CertificatePage';
import VerificationPage from './pages/VerificationPage';
import CourseDetails from './pages/CourseDetails';
import Settings from './pages/Settings';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import GlobalSearch from './components/discovery/GlobalSearch';
import ExperienceToast from './components/gamification/ExperienceToast';
import '@questlabs/react-sdk/dist/style.css';
import './index.css';
import { thirdwebTheme } from './theme/sdkTheme';

export default function App() {
  return (
    <ThirdwebProvider 
      activeChain="arbitrum" 
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || "00000000000000000000000000000000"}
      theme={thirdwebTheme}
    >
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30 flex flex-col">
          <GlobalSearch />
          <ExperienceToast />
          
          <Routes>
            <Route path="/verify/:hash?" element={<VerificationPage />} />
            <Route path="/certificate/:enrollmentId" element={<CertificatePage />} />
            
            <Route path="/*" element={
              <>
                <Navbar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/course/:id" element={<CourseDetails />} />
                    <Route path="/dashboard" element={<StudentDashboard />} />
                    <Route path="/teacher" element={<TeacherDashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/partner-apply" element={<PartnerApplication />} />
                    <Route path="/partner-onboarding" element={<PartnerOnboarding />} />
                    <Route path="/learn/:courseId" element={<Learn />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </div>
                <Footer />
              </>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </ThirdwebProvider>
  );
}