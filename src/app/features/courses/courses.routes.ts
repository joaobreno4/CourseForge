import { Routes } from '@angular/router';

export const COURSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/course-list/course-list.component').then(
        (m) => m.CourseListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/course-form/course-form.component').then(
        (m) => m.CourseFormComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/course-detail/course-detail.component').then(
        (m) => m.CourseDetailComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./components/course-form/course-form.component').then(
        (m) => m.CourseFormComponent
      ),
  },
];
