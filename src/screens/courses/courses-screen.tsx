import React, { useState, useEffect } from 'react';
import ExploreCourses, { ExploreCourseItem } from '@/screens/courses/explore-courses';
import CourseDetails, { CourseData } from '@/screens/courses/course-details';
import { coursesData } from '@/screens/home/home-screen';
import { api } from '@/services/api';

export default function CoursesScreen() {
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [coursesList, setCoursesList] = useState<ExploreCourseItem[]>([]);

  useEffect(() => {
    api.getActiveCourses().then((res: any) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setCoursesList(list.map((c: any) => ({
        id: String(c.id),
        title: c.title,
        duration: c.duration ?? '',
        students: '0',
        rating: '—',
        price: c.price != null ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹0',
        key: c.title,
      })));
    }).catch(() => {});
  }, []);

  if (selectedCourse) {
    return <CourseDetails course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <ExploreCourses
      coursesList={coursesList}
      onBack={() => {}}
      onSelectCourse={(key) => setSelectedCourse(coursesData[key] ?? null)}
    />
  );
}
