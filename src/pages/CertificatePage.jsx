import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAcademyStore } from '../store/useAcademyStore';
import CertificateViewer from '../components/consumption/CertificateViewer';

export default function CertificatePage() {
  const { enrollmentId } = useParams();
  const { user, walletAddress, enrollments, courses } = useAcademyStore();

  const enrollment = enrollments.find(e => e.id === enrollmentId);
  const course = enrollment ? courses.find(c => c.id === enrollment.course_id) : null;

  if (!enrollment || !course) {
    return <Navigate to="/dashboard" replace />;
  }

  // Ensure the user owns this enrollment
  // Note: In real app, we check enrollment.user_id === user.id
  
  return (
    <div className="bg-gray-950 min-h-screen">
      <CertificateViewer 
        enrollment={enrollment} 
        course={course} 
        user={user || { email: 'Web3 Candidate' }} 
      />
    </div>
  );
}