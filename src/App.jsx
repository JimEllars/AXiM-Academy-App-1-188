import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThirdwebProvider } from '@thirdweb-dev/react';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Learn from './pages/Learn';
import CertificatePage from './pages/CertificatePage';
import VerificationPage from './pages/VerificationPage';
import CourseDetails from './pages/CourseDetails';
import Navbar from './components/layout/Navbar';
import '@questlabs/react-sdk/dist/style.css';
import './index.css';

export default function App() {
  return (
    <ThirdwebProvider 
      activeChain="arbitrum" 
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || "00000000000000000000000000000000"}
    >
      <BrowserRouter>
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-emerald-500/30">
          <Routes>
            <Route path="/verify/:hash?" element={<VerificationPage />} />
            <Route path="/certificate/:enrollmentId" element={<CertificatePage />} />
            <Route path="/*" element={
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/course/:id" element={<CourseDetails />} />
                  <Route path="/dashboard" element={<StudentDashboard />} />
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route path="/learn/:courseId" element={<Learn />} />
                </Routes>
              </>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </ThirdwebProvider>
  );
}