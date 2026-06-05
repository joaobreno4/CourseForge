import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'courses', pathMatch: 'full' },
  {
    path: 'courses',
    loadChildren: () =>
      import('./features/courses/courses.routes').then((m) => m.COURSES_ROUTES),
  },
  { path: '**', redirectTo: 'courses' },
];
