import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil, finalize } from 'rxjs';

import { CourseService } from '../../../../core/services/course.service';
import { Course } from '../../../../core/models/course.model';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DurationPipe],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
})
export class CourseListComponent implements OnInit, OnDestroy {
  private readonly courseService = inject(CourseService);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  courses: Course[] = [];
  isLoading = false;
  loadError: string | null = null;
  deletingId: string | null = null;
  confirmDeleteId: string | null = null;

  ngOnInit(): void {
    this.loadCourses();
    this.watchSearch();
  }

  private loadCourses(): void {
    this.isLoading = true;
    this.loadError = null;

    this.courseService.getAll().pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (courses) => (this.courses = courses),
      error: () => (this.loadError = 'Não foi possível carregar os cursos. Verifique se o servidor está rodando.'),
    });
  }

  private watchSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((term) => {
        const trimmed = (term ?? '').trim();
        this.isLoading = true;
        return trimmed.length >= 2
          ? this.courseService.search(trimmed)
          : this.courseService.getAll();
      }),
      finalize(() => (this.isLoading = false)),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Erro ao buscar cursos.';
        this.isLoading = false;
      },
    });
  }

  requestDelete(id: string): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(id: string): void {
    this.deletingId = id;
    this.confirmDeleteId = null;

    this.courseService.remove(id).pipe(
      finalize(() => (this.deletingId = null))
    ).subscribe({
      next: () => {
        this.courses = this.courses.filter((c) => c.id !== id);
      },
      error: () => {
        this.loadError = 'Erro ao remover o curso.';
      },
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  trackById(_: number, course: Course): string {
    return course.id ?? '';
  }

  getTotalLessons(course: Course): number {
    return course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  }

  getTotalDuration(course: Course): number {
    return course.modules.reduce(
      (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
      0
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
