import { SyllabusModule } from '../../../utils/syllabus-parser';

export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  duration: string;
  studentsCount: number;
  maxCapacity: number;
  startDate: string;
  endDate: string;
  classTimings: string;
  classDays: string;
  price: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  description?: string;
  syllabusTopics?: string;
  whatYouWillLearn?: string;
  googleMeetLink?: string;
  totalSessions?: number;
}

export interface Teacher {
  id: string;
  name: string;
}

export interface CourseFormData {
  title: string;
  category: string;
  instructor: string;
  description: string;
  duration: string;
  totalSessions: string;
  startDate: string;
  endDate: string;
  classTime: string;
  classDays: string[];
  capacity: string;
  price: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  syllabusTopics: string;
  syllabusModules: SyllabusModule[];
  syllabusMode: 'builder' | 'text';
  whatYouWillLearn: string;
  googleMeetLink: string;
}

export const DEFAULT_FORM_DATA: CourseFormData = {
  title: '',
  category: '',
  instructor: '',
  description: '',
  duration: '',
  totalSessions: '',
  startDate: '',
  endDate: '',
  classTime: '',
  classDays: [],
  capacity: '50',
  price: '',
  status: 'Upcoming',
  syllabusTopics: '',
  syllabusModules: [
    {
      title: 'Module 1 - Networking Protocols & Packet Analysis',
      topics: [
        'OSI model and TCP/IP protocol suite structures',
        'IP addressing layouts, subnetting CIDR, and network translation (NAT)',
      ],
    },
  ],
  syllabusMode: 'builder',
  whatYouWillLearn: '',
  googleMeetLink: '',
};
