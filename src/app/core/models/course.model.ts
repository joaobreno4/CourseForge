export interface Lesson {
  id?: string;
  title: string;
  description: string;
  duration: number;
  videoUrl?: string;
  order?: number;
}

export interface Module {
  id?: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  order?: number;
}

export interface Course {
  id?: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  modules: Module[];
  createdAt?: string;
  updatedAt?: string;
}

export type CourseCategory =
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'devops'
  | 'design'
  | 'data'
  | 'other';

export const COURSE_CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: 'frontend', label: 'Front-end' },
  { value: 'backend', label: 'Back-end' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'devops', label: 'DevOps' },
  { value: 'design', label: 'Design' },
  { value: 'data', label: 'Data & IA' },
  { value: 'other', label: 'Outros' },
];
