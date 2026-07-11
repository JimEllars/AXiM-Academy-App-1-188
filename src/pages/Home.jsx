import React from 'react';
import HeroCatalog from '../components/discovery/HeroCatalog';
import CourseGrid from '../components/discovery/CourseGrid';

export default function Home() {
  return (
    <main>
      <HeroCatalog />
      <CourseGrid />
    </main>
  );
}