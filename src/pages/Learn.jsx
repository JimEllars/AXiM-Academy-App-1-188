import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAcademyStore } from '../store/useAcademyStore';
import InteractiveClassroom from '../components/consumption/InteractiveClassroom';

export default function Learn() {
  const { courseId } = useParams();
  const { courses, enrollments, updateProgress } = useAcademyStore();
  
  const course = courses.find(c => c.id === courseId);
  const enrollment = enrollments.find(e => e.course_id === courseId);
  
  if (!course || !enrollment) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <InteractiveClassroom 
      course={course} 
      enrollment={enrollment} 
      onProgress={(lessonId) => updateProgress(enrollment.id, lessonId)}
    />
  );
}