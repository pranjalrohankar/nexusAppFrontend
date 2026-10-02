export interface SyllabusItem {
  moduleNumber: string;
  title: string;
  lessons: string;
  weeks: string;
}

export interface TeacherData {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  emoji: string;
  experience: string;
  expertise: string[];
  studentsCount?: string;
}

export interface CourseData {
  id?: number | string;
  batchId?: number | string;
  title: string;
  subtitle: string;
  rating: string;
  students: string;
  duration: string;
  classesCount: string;
  level: string;
  skills: string[];
  teacher: TeacherData;
  syllabus?: SyllabusItem[] | any;
  syllabusTopics?: string;
  coveredTopics?: string | string[];
}

export const coursesData: Record<string, CourseData> = {
  'Full Stack Web Development': {
    title: 'Full Stack Web Development',
    subtitle: 'Master modern web development from scratch',
    rating: '4.9',
    students: '2,500+ students',
    duration: '12 weeks',
    classesCount: '45',
    level: 'Beginner',
    skills: [
      'Live Interactive Classes',
      'Recorded Video Access',
      'Real-world Projects',
      'Lifetime Access',
      'Certificate of Completion',
      'Job Placement Support',
    ],
    teacher: {
      name: 'Rajesh Kumar',
      role: 'Senior Full Stack Developer',
      bio: 'Rajesh is a full-stack engineer with 10+ years of experience teaching web technologies and building robust scalable backends.',
      avatar: 'RK',
      emoji: '👨‍💻',
      experience: '10+ years in Full Stack Development',
      expertise: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
      studentsCount: '15,000+',
    },
    syllabus: [
      { moduleNumber: '5', title: 'MongoDB & Database Design', lessons: '5', weeks: '2' },
      { moduleNumber: '4', title: 'Node.js & Express', lessons: '10', weeks: '2' },
      { moduleNumber: '2', title: 'JavaScript & ES6+', lessons: '10', weeks: '3' },
      { moduleNumber: '3', title: 'React.js & State Management', lessons: '12', weeks: '3' },
    ],
  },
  'Data Science & Machine Learning': {
    title: 'Data Science & Machine Learning',
    subtitle: 'Learn Python, SQL, Tableau, Pandas, Scikit-Learn & Deep Learning',
    rating: '4.9',
    students: '1,800+ students',
    duration: '16 weeks',
    classesCount: '60',
    level: 'Intermediate',
    skills: [
      'Python & SQL Foundations',
      'Data Analysis & Visualization',
      'Supervised & Unsupervised ML',
      'Neural Networks & Deep Learning',
      'Industry Capstone Projects',
      '1-on-1 Mentorship Sessions',
    ],
    teacher: {
      name: 'Priya Sharma',
      role: 'Data Science Lead & AI Researcher',
      bio: 'Priya is a researcher and practitioner in AI with 8+ years of industry experience at top tech giants.',
      avatar: 'PS',
      emoji: '👩‍💻',
      experience: '8+ years in Data Science & Machine Learning',
      expertise: ['Python', 'SQL', 'TensorFlow', 'Pandas', 'Scikit-Learn'],
      studentsCount: '12,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Python Programming Foundations', lessons: '12', weeks: '3' },
      { moduleNumber: '2', title: 'Data Cleaning & SQL Databases', lessons: '10', weeks: '3' },
      { moduleNumber: '3', title: 'Exploratory Data Analysis & Math', lessons: '10', weeks: '3' },
      { moduleNumber: '4', title: 'Machine Learning Algorithms', lessons: '16', weeks: '4' },
      { moduleNumber: '5', title: 'Deep Learning & Projects', lessons: '12', weeks: '3' },
    ],
  },
  'Java Full Stack': {
    title: 'Java Full Stack Development',
    subtitle: 'Spring Boot, Hibernate, React, and Microservices architecture',
    rating: '4.9',
    students: '2,200+ students',
    duration: '14 weeks',
    classesCount: '52',
    level: 'Intermediate',
    skills: [
      'Core & Advanced Java',
      'Spring Framework & Spring Boot',
      'Hibernate & Database Systems',
      'Microservices & REST APIs',
      'React Frontend Integration',
      'Docker & AWS Deployment',
    ],
    teacher: {
      name: 'Amit Patel',
      role: 'Enterprise Solutions Architect',
      bio: 'Amit has over 12 years of architecting scalable enterprise solutions using Java and cloud technologies.',
      avatar: 'AP',
      emoji: '👨‍💻',
      experience: '12+ years in Enterprise Java Systems',
      expertise: ['Java', 'Spring Boot', 'Hibernate', 'REST APIs', 'AWS'],
      studentsCount: '10,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Core Java & OOPs', lessons: '12', weeks: '3' },
      { moduleNumber: '2', title: 'JDBC Database Connectivity', lessons: '8', weeks: '2' },
      { moduleNumber: '3', title: 'Servlets & JSP Web Architecture', lessons: '10', weeks: '2' },
      { moduleNumber: '4', title: 'Hibernate ORM Framework', lessons: '10', weeks: '2' },
      { moduleNumber: '5', title: 'Spring Framework Core', lessons: '12', weeks: '3' },
      { moduleNumber: '6', title: 'Spring Boot & Microservices', lessons: '14', weeks: '3' },
      { moduleNumber: '7', title: 'Responsive Web Design (HTML5, CSS3, Bootstrap)', lessons: '10', weeks: '2' },
    ],
    syllabusTopics: JSON.stringify([
      {
        title: 'Module 1 – Core Java & Object Oriented Programming',
        topics: [
          "OOP's Features (Encapsulation, Inheritance, Polymorphism, Abstraction)",
          'Inner Class & Anonymous Classes',
          'Reflection API & Runtime Metadata',
          'Wrapper Classes & Autoboxing',
          'Exception Handling (Try-Catch, Custom Exceptions)',
          'Multithreading in Java & Synchronization',
          'I/O Programming & File Handling',
          'GUI Programming Fundamentals',
          'Collection Framework (List, Set, Map, Mini Project)',
        ],
      },
      {
        title: 'Module 2 – Advanced Java & Database Connectivity (JDBC)',
        topics: [
          'Need of JDBC & Database Drivers',
          'JDBC Driver Types & Architecture',
          'JDBC Transaction Management & Savepoints',
          'Advance JDBC & Batch Processing',
          'What is Stored Procedure?',
          'JDBC using Stored Procedures',
          'Data Access Object (DAO) Design Pattern',
          'JDBC Application using Swing & DAO Pattern',
        ],
      },
      {
        title: 'Module 3 – Web Components: Servlets & JSP',
        topics: [
          'Overview of HTML, CSS, XML & JEE Architecture',
          'Servlet Basics & Lifecycle',
          'Servlet API & Request/Response Flow',
          'Session Tracking in Java (Cookies, HttpSession, URL Rewriting)',
          'Session Tracking Mechanism & State Preservation',
          'ServletFilter API & Interceptors',
          'Introduction to JSP & Syntax',
          'JSP Tag & Directives',
          'JSP Implicit Objects & Expression Language (EL)',
          'JSP Specification & Concept of MVC (Mini Project)',
        ],
      },
      {
        title: 'Module 4 – Java Frameworks: Hibernate ORM',
        topics: [
          'Introduction to ORM & Limitations of JDBC',
          'What is ORM? & What is Hibernate?',
          'Hibernate Architecture & SessionFactory',
          'Hibernate Example & Setup',
          'CRUD Operations Using Hibernate API',
          'Hibernate Entity Mapping with Annotations',
          'Hibernate Generator Classes & Identifier Strategies',
          'Hibernate Mapping & Relationships (One-to-One, One-to-Many, Many-to-Many)',
          'Component Mapping & Value Types',
          'Inheritance Mapping Strategies',
          'Collection Mapping',
          'HQL (Hibernate Query Language) & Criteria API',
          'Caching in Hibernate (First Level & Second Level Cache)',
        ],
      },
      {
        title: 'Module 5 – Spring Framework & Core Architecture',
        topics: [
          'Introduction to Spring Framework Features & Ecosystem',
          'What is Spring? & Spring Features',
          'Spring Modules Architecture',
          'Dependency Injection (DI) & Inversion of Control (IoC)',
          'IoC Container (BeanFactory & ApplicationContext)',
          'What is Bean? & Bean Lifecycle',
          'Spring Core Annotations (@Component, @Autowired, @Qualifier)',
          'Spring DAO & Database Access Integration',
          'Spring Web MVC Architecture',
          'Spring Aspect Oriented Programming (AOP)',
        ],
      },
      {
        title: 'Module 6 – Spring Boot & Microservices Architecture',
        topics: [
          'Introduction to Spring Boot & Auto-Configuration',
          'Dependency Management using POM.xml & Starters',
          'CommandLineRunner & ApplicationRunner',
          'Introduction to ORM with JPA & Spring Data',
          'Spring MVC with Spring Boot',
          'Building RESTful Web Services with Spring MVC',
          'Spring Boot Security & JWT Authentication',
          'Microservices Architecture & Communication (Mini Project)',
        ],
      },
      {
        title: 'Module 7 – Responsive Web Design (HTML5, CSS3, Bootstrap)',
        topics: [
          'HTML Basics: Structure, Elements, and Attributes',
          'Various Input Fields, Forms & Validations in HTML',
          'Tables, Frames, Lists, & Layout Structures',
          'Fonts, Colors, Images & Media Elements',
          'HTML Forms & Controls',
          'Styling with CSS, Selectors and Style Definitions',
          'Properties of CSS & Linking HTML & CSS',
          'Limitations of Normal Selectors & Types of Selectors',
          'CSS Properties, Pseudo-elements & CSS Animations',
          'Introduction to Bootstrap Grid System & Components',
          'What is Bootstrap Components & Glyphicons Component',
          'Dropdown Menu Component, Button Groups & Button Toolbar',
          'Navigation Pills & Tabs Components',
        ],
      },
    ]),
  },
  'Node js for AI': {
    title: 'Node js for AI & Web Integration',
    subtitle: 'Learn to build and scale backend AI agents, LLM integrations and APIs',
    rating: '4.8',
    students: '1,500+ students',
    duration: '8 weeks',
    classesCount: '30',
    level: 'Advanced',
    skills: [
      'Node.js Core & Event Loop',
      'API Development with Express',
      'Vector Databases & LangChain',
      'Integrating OpenAI & Gemini APIs',
      'Real-time Streaming WebSockets',
      'Optimizing Node.js Performance',
    ],
    teacher: {
      name: 'Sanjay Mehta',
      role: 'Principal Systems Backend Engineer',
      bio: 'Sanjay is an open-source contributor and backend specialist focused on high-performance Node.js engines.',
      avatar: 'SM',
      emoji: '👨‍💻',
      experience: '9+ years in Node.js & Streaming Backends',
      expertise: ['Node.js', 'Express', 'Gemini APIs', 'Pinecone', 'WebSockets'],
      studentsCount: '8,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Node.js Internals & Events', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'Express.js Rest API Design', lessons: '10', weeks: '2' },
      { moduleNumber: '3', title: 'Integrations with OpenAI & Gemini APIs', lessons: '12', weeks: '2' },
      { moduleNumber: '4', title: 'Vector DBs & Semantic Caching', lessons: '8', weeks: '2' },
    ],
  },
  'React Native Bootcamp': {
    title: 'React Native Bootcamp',
    subtitle: 'Build high-performance native iOS and Android apps with JavaScript',
    rating: '4.9',
    students: '3,000+ students',
    duration: '10 weeks',
    classesCount: '40',
    level: 'Beginner',
    skills: [
      'React Native Core Components',
      'Expo SDK & Workflow CLI',
      'State Management (Redux/Zustand)',
      'Native Device APIs & Sensors',
      'App Store & Play Store Publishing',
      'Performance Optimization & Styling',
    ],
    teacher: {
      name: 'Vikram Rao',
      role: 'Lead Mobile Architect',
      bio: 'Vikram has built and shipped over 15 React Native applications to production for clients worldwide.',
      avatar: 'VR',
      emoji: '📱',
      experience: '7+ years in Mobile App Development',
      expertise: ['React Native', 'TypeScript', 'Expo', 'Zustand', 'App Store'],
      studentsCount: '18,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'React Native Core Architecture', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'Navigation & File Router', lessons: '10', weeks: '2' },
      { moduleNumber: '3', title: 'State Management & Storage', lessons: '8', weeks: '2' },
      { moduleNumber: '4', title: 'Device Features & Permissions', lessons: '10', weeks: '2' },
      { moduleNumber: '5', title: 'Store Deployment & Releases', lessons: '4', weeks: '2' },
    ],
  },
  'Python for AI': {
    title: 'Python for AI & Scripting',
    subtitle: 'Foundations of Python programming for analytics and intelligence engines',
    rating: '4.8',
    students: '4,000+ students',
    duration: '8 weeks',
    classesCount: '32',
    level: 'Beginner',
    skills: [
      'Python Syntax & Data Structures',
      'Object Oriented Programming',
      'Numpy & Pandas for Data Manipulation',
      'Scraping & Automation Scripts',
      'Machine Learning Libraries Foundations',
      'API Development with FastAPI',
    ],
    teacher: {
      name: 'Neha Gupta',
      role: 'AI Practitioner & Systems Lead',
      bio: 'Neha holds a Masters in Computer Science and specializes in creating Pythonic educational courses for machine learning.',
      avatar: 'NG',
      emoji: '👩‍🏫',
      experience: '6+ years in Python Analytics & Teaching',
      expertise: ['Python', 'FastAPI', 'Pandas', 'NumPy', 'Matplotlib'],
      studentsCount: '20,000+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Python Syntax & Data Structures', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'Numpy, Pandas & Matplotlib', lessons: '8', weeks: '2' },
      { moduleNumber: '3', title: 'Intro to Machine Learning Libs', lessons: '8', weeks: '2' },
      { moduleNumber: '4', title: 'FastAPI REST Deployments', lessons: '8', weeks: '2' },
    ],
  },
  'UI/UX Design Mastery': {
    title: 'UI/UX Design Mastery',
    subtitle: 'Master Figma, design systems, wireframing and user research',
    rating: '4.8',
    students: '1,900+ students',
    duration: '12 weeks',
    classesCount: '36',
    level: 'Beginner',
    skills: [
      'User Research & Persona Building',
      'Information Architecture & Wireframes',
      'Advanced Figma Techniques',
      'Creating Scalable Design Systems',
      'Interactive Prototyping & Testing',
      'UI Design Patterns & Typography',
    ],
    teacher: {
      name: 'Karan Malhotra',
      role: 'Product Designer',
      bio: 'Karan is a lead designer who has shaped products for multiple high-growth startups over the last 7 years.',
      avatar: 'KM',
      emoji: '🎨',
      experience: '7+ years in UX Research & Product UI',
      expertise: ['Figma', 'User Research', 'Wireframes', 'Design Systems'],
      studentsCount: '9,500+',
    },
    syllabus: [
      { moduleNumber: '1', title: 'Design Principles & Typography', lessons: '8', weeks: '2' },
      { moduleNumber: '2', title: 'User Research & Wireframing', lessons: '10', weeks: '3' },
      { moduleNumber: '3', title: 'Interface Design with Figma', lessons: '12', weeks: '3' },
      { moduleNumber: '4', title: 'Design Systems & Interactive Prototypes', lessons: '8', weeks: '4' },
    ],
  },
};
