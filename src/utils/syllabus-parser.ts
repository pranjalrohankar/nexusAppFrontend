export interface SyllabusModule {
  id?: string;
  title: string;
  topics: string[];
}

/**
 * Parses raw syllabus input (JSON string, object array, or plain text) into a structured array of SyllabusModules.
 */
export function parseSyllabus(input: any): SyllabusModule[] {
  if (!input) return [];

  // Case 1: Already an array of SyllabusModule or legacy syllabus items
  if (Array.isArray(input)) {
    return input.map((item: any, idx: number): SyllabusModule => {
      if (typeof item === 'string') {
        return { title: `Module ${idx + 1}`, topics: [item] };
      }
      const title = item.title || item.moduleTitle || item.name || `Module ${item.moduleNumber || idx + 1}`;
      const topics = Array.isArray(item.topics)
        ? item.topics
        : Array.isArray(item.subTopics)
        ? item.subTopics
        : typeof item.description === 'string'
        ? [item.description]
        : typeof item.lessons === 'string'
        ? [`${item.lessons} lessons (${item.weeks || '1'} weeks)`]
        : [];
      return { title: String(title), topics: topics.map((t: any) => String(t)) };
    });
  }

  // Case 2: JSON String (handles single/double encoded or partial JSON)
  if (typeof input === 'string') {
    let trimmed = input.trim();

    // Handle double-encoded JSON strings e.g. "\"[{...}]\""
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        trimmed = JSON.parse(trimmed);
      } catch (e) {}
    }

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        let parsed = JSON.parse(trimmed);
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (e) {}
        }
        if (Array.isArray(parsed)) {
          return parseSyllabus(parsed);
        }
        if (parsed && Array.isArray(parsed.modules)) {
          return parseSyllabus(parsed.modules);
        }
      } catch (e) {
        // Attempt regex repair for truncated JSON array of objects
        try {
          const matchObjects = trimmed.match(/\{[^{}]*"title"\s*:\s*"[^"]*"[^{}]*\}/g);
          if (matchObjects && matchObjects.length > 0) {
            const repaired: SyllabusModule[] = [];
            matchObjects.forEach((objStr) => {
              try {
                const item = JSON.parse(objStr);
                if (item && item.title) {
                  repaired.push({
                    title: item.title,
                    topics: Array.isArray(item.topics) ? item.topics : [],
                  });
                }
              } catch (err) {}
            });
            if (repaired.length > 0) return repaired;
          }
        } catch (repairErr) {}
      }
    }

    // Case 3: Plain text with newlines or comma separated
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const modulesArr: SyllabusModule[] = [];
    let curr: SyllabusModule | null = null;

    lines.forEach((line) => {
      const isHeader =
        /^module\s*\d+/i.test(line) ||
        /^section\s*\d+/i.test(line) ||
        /^unit\s*\d+/i.test(line) ||
        /^part\s*\d+/i.test(line) ||
        /^chapter\s*\d+/i.test(line) ||
        (line.endsWith(':') && !/^\d+[\.\)]/.test(line)) ||
        (!curr && !/^\d+[\.\)]/.test(line) && !line.startsWith('•') && !line.startsWith('-') && !line.includes(','));

      if (isHeader) {
        if (curr) {
          modulesArr.push(curr);
        }
        const cleanTitle = line.replace(/[:]$/, '').replace(/^[\*\#\-]\s*/, '');
        curr = {
          title: cleanTitle || `Module ${modulesArr.length + 1}`,
          topics: [],
        };
      } else {
        const cleanTopic = line.replace(/^\d+[\.\)]\s*/, '').replace(/^[•\-\*]\s*/, '');
        if (!curr) {
          curr = {
            title: `Module 1: Core Concepts`,
            topics: [],
          };
        }
        if (cleanTopic && curr) {
          if (cleanTopic.includes(',') && !cleanTopic.startsWith('http')) {
            cleanTopic.split(',').map(s => s.trim()).filter(Boolean).forEach(t => curr!.topics.push(t));
          } else {
            curr.topics.push(cleanTopic);
          }
        }
      }
    });

    if (curr) {
      modulesArr.push(curr);
    }

    // Fallback: If single line with commas or no topics extracted
    if (modulesArr.length === 1 && modulesArr[0].topics.length === 0) {
      const singleTitle = modulesArr[0].title;
      if (singleTitle.includes(',')) {
        const parts = singleTitle.split(',').map((s) => s.trim()).filter(Boolean);
        return [
          {
            title: 'Module 1: Core Curriculum & Topics',
            topics: parts,
          },
        ];
      }
    }

    if (modulesArr.length === 0 && trimmed.length > 0) {
      const parts = trimmed.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
      return [
        {
          title: 'Module 1: Course Syllabus & Topics',
          topics: parts,
        },
      ];
    }

    return modulesArr;
  }

  return [];
}

/**
 * Serializes SyllabusModule array into a clean JSON string for saving in DB.
 */
export function serializeSyllabus(modules: SyllabusModule[]): string {
  if (!Array.isArray(modules)) return '[]';
  const cleaned = modules
    .filter((m: SyllabusModule) => m && (m.title.trim().length > 0 || (m.topics && m.topics.some((t: string) => t && t.trim().length > 0))))
    .map((m: SyllabusModule) => ({
      title: m.title.trim(),
      topics: (m.topics || []).map((t: string) => t.trim()).filter(Boolean),
    }));
  return JSON.stringify(cleaned);
}

/**
 * Maps a dynamic Course entity from the Database API into a full CourseData object for UI rendering.
 */
export function buildCourseDataFromDb(dbCourse: any, fallbackMap?: Record<string, any>): any {
  if (!dbCourse) return null;

  // If already structured CourseData
  if (dbCourse.teacher && Array.isArray(dbCourse.skills)) {
    return dbCourse;
  }

  const fallback = (fallbackMap && fallbackMap[dbCourse.title]) || {};

  let skills: string[] = fallback.skills || [
    'Live Interactive Classes',
    'Recorded Video Access',
    'Real-world Projects',
    'Lifetime Access',
    'Certificate of Completion',
    'Job Placement Support',
  ];

  if (dbCourse.whatYouWillLearn) {
    const parsedSkills = String(dbCourse.whatYouWillLearn)
      .split(/\r?\n/)
      .map((s: string) => s.replace(/^[\*\#\-•\d\.]+\s*/, '').trim())
      .filter(Boolean);
    if (parsedSkills.length > 0) {
      skills = parsedSkills;
    }
  }

  const instructorName = dbCourse.instructor || fallback.teacher?.name || 'Nexus Faculty';

  return {
    title: dbCourse.title || fallback.title || 'Course Details',
    subtitle: dbCourse.description || fallback.subtitle || 'Master modern skills with live industry guidance',
    rating: fallback.rating || '4.9',
    students: `${dbCourse.studentsCount || dbCourse.enrollmentCount || 0} students`,
    duration: dbCourse.duration || fallback.duration || '12 weeks',
    classesCount: dbCourse.totalSessions ? String(dbCourse.totalSessions) : fallback.classesCount || '40',
    level: fallback.level || 'All Levels',
    skills,
    teacher: {
      name: instructorName,
      role: fallback.teacher?.role || 'Senior Instructor',
      bio: fallback.teacher?.bio || `${instructorName} is an experienced industry expert leading this course module.`,
      avatar: fallback.teacher?.avatar || instructorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      emoji: fallback.teacher?.emoji || '👨‍💻',
      experience: fallback.teacher?.experience || '10+ years in IT & Industry',
      expertise: fallback.teacher?.expertise || ['Software Engineering', 'Full Stack'],
      studentsCount: fallback.teacher?.studentsCount || '10,000+',
    },
    syllabus: fallback.syllabus || [],
    syllabusTopics: dbCourse.syllabusTopics || fallback.syllabusTopics || '',
    coveredTopics: dbCourse.coveredTopics || fallback.coveredTopics || '',
    id: dbCourse.id || fallback.id || null,
  };
}
