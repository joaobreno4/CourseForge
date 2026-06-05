import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CourseService } from '../../../../core/services/course.service';
import { Course, Module } from '../../../../core/models/course.model';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DurationPipe],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
})
export class CourseDetailComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  course: Course | null = null;
  isLoading = true;
  loadError: string | null = null;
  expandedModules = new Set<number>();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/courses']);
      return;
    }
    this.loadCourse(id);
  }

  private loadCourse(id: string): void {
    this.courseService.getById(id).subscribe({
      next: (course) => {
        this.course = course;
        this.isLoading = false;
        // Expand first module by default
        if (course.modules.length > 0) this.expandedModules.add(0);
      },
      error: () => {
        this.loadError = 'Curso não encontrado.';
        this.isLoading = false;
      },
    });
  }

  toggleModule(index: number): void {
    if (this.expandedModules.has(index)) {
      this.expandedModules.delete(index);
    } else {
      this.expandedModules.add(index);
    }
  }

  isModuleExpanded(index: number): boolean {
    return this.expandedModules.has(index);
  }

  expandAll(): void {
    this.course?.modules.forEach((_, i) => this.expandedModules.add(i));
  }

  collapseAll(): void {
    this.expandedModules.clear();
  }

  get totalModules(): number {
    return this.course?.modules.length ?? 0;
  }

  get totalLessons(): number {
    return this.course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  }

  get totalDuration(): number {
    return (
      this.course?.modules.reduce(
        (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration || 0), 0),
        0
      ) ?? 0
    );
  }

  getModuleDuration(module: Module): number {
    return module.lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
  }
}
