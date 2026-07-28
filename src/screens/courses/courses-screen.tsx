import React, { useState, useEffect } from 'react';
import ExploreCourses, { ExploreCourseItem } from '@/screens/courses/explore-courses';
import CourseDetails, { CourseData } from '@/screens/courses/course-details';
import { coursesData } from '@/screens/home/home-screen';
import { api } from '@/services/api';
import { buildCourseDataFromDb } from '@/utils/syllabus-parser';

export default function CoursesScreen() {
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [coursesList, setCoursesList] = useState<ExploreCourseItem[]>([]);
  const [dbCoursesMap, setDbCoursesMap] = useState<Record<string, any>>({});

  useEffect(() => {
    api.getAllCourses().then((res: any) => {
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : [];
      const map: Record<string, any> = {};
      const formatted = list.map((c: any) => {
        map[c.title] = c;
        map[String(c.id)] = c;
        return {
          id: String(c.id),
          title: c.title,
          duration: c.duration ?? '',
          students: String(c.studentsCount ?? c.enrollmentCount ?? 0),
          rating: '4.9',
          price: c.price != null ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹0',
          key: c.title,
        };
      });
      setDbCoursesMap(map);
      setCoursesList(formatted);
    }).catch(() => {});
  }, []);

  const handleSelectCourse = (key: string) => {
    const rawDbCourse = dbCoursesMap[key];
    if (rawDbCourse) {
      const courseObj = buildCourseDataFromDb(rawDbCourse, coursesData);
      setSelectedCourse(courseObj);
    } else if (coursesData[key]) {
      setSelectedCourse(coursesData[key]);
    }
  };

  if (selectedCourse) {
    return <CourseDetails course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <ExploreCourses
      coursesList={coursesList}
      onBack={() => {}}
      onSelectCourse={handleSelectCourse}
    />
  );
}
