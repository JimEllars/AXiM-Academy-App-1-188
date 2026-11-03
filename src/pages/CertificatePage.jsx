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

  // A certificate is a credential, so only its holder may open it. RLS already
  // limits which rows reach this browser; this stops a shared /certificate/<id>
  // link from rendering another learner's certificate out of an already-loaded
  // store.
  const ownedByViewer = !enrollment.user_id || !user?.id || enrollment.user_id === user.id;
  if (!ownedByViewer) {
    return <Navigate to="/dashboard" replace />;
  }

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