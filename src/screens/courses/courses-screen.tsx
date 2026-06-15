import React, { useState } from 'react';
import ExploreCourses from '@/screens/courses/explore-courses';
import CourseDetails, { CourseData } from '@/screens/courses/course-details';
import { exploreCoursesList, coursesData } from '@/screens/home/home-screen';

export default function CoursesScreen() {
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);

  if (selectedCourse) {
    return (
      <CourseDetails
        course={selectedCourse}
        onBack={() => setSelectedCourse(null)}
      />
    );
  }

  return (
    <ExploreCourses
      coursesList={exploreCoursesList}
      onBack={() => {}} // Tab bar manages navigation, but if you want back action here you can handle it
      onSelectCourse={(key) => setSelectedCourse(coursesData[key])}
    />
  );
}
