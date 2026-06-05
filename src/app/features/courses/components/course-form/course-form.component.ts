import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { CourseService } from '../../../../core/services/course.service';
import { COURSE_CATEGORIES, Course } from '../../../../core/models/course.model';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message.component';
import { ModuleFormComponent } from '../module-form/module-form.component';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ValidationMessageComponent, ModuleFormComponent],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
})
export class CourseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly categories = COURSE_CATEGORIES;

  form!: FormGroup;
  isEditMode = false;
  courseId: string | null = null;
  isSubmitting = false;
  submitError: string | null = null;

  get name() { return this.form.get('name')!; }
  get description() { return this.form.get('description')!; }
  get category() { return this.form.get('category')!; }
  get thumbnailUrl() { return this.form.get('thumbnailUrl')!; }
  get modules(): FormArray { return this.form.get('modules') as FormArray; }
  get moduleGroups(): FormGroup[] { return this.modules.controls as FormGroup[]; }

  ngOnInit(): void {
    this.buildForm();

    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) {
      this.isEditMode = true;
      this.loadCourse(this.courseId);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      category: ['', Validators.required],
      thumbnailUrl: [''],
      modules: this.fb.array([]),
    });
  }

  private loadCourse(id: string): void {
    this.courseService.getById(id).subscribe({
      next: (course) => this.patchForm(course),
      error: () => {
        this.submitError = 'Erro ao carregar curso para edição.';
      },
    });
  }

  private patchForm(course: Course): void {
    this.form.patchValue({
      name: course.name,
      description: course.description,
      category: course.category,
      thumbnailUrl: course.thumbnailUrl ?? '',
    });

    course.modules.forEach((mod) => {
      const moduleGroup = this.createModuleGroup();
      moduleGroup.patchValue({ title: mod.title, description: mod.description ?? '' });

      const lessonsArray = moduleGroup.get('lessons') as FormArray;
      mod.lessons.forEach((lesson) => {
        const lessonGroup = this.createLessonGroup();
        lessonGroup.patchValue(lesson);
        lessonsArray.push(lessonGroup);
      });

      this.modules.push(moduleGroup);
    });
  }

  addModule(): void {
    this.modules.push(this.createModuleGroup());
  }

  removeModule(index: number): void {
    this.modules.removeAt(index);
  }

  private createModuleGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      lessons: this.fb.array([]),
    });
  }

  private createLessonGroup(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      duration: [null, [Validators.required, Validators.min(1)]],
      videoUrl: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;
    const payload = this.form.getRawValue() as Course;

    const request$ = this.isEditMode && this.courseId
      ? this.courseService.update(this.courseId, payload)
      : this.courseService.create(payload);

    request$.pipe(finalize(() => (this.isSubmitting = false))).subscribe({
      next: () => this.router.navigate(['/courses']),
      error: () => {
        this.submitError = 'Erro ao salvar o curso. Verifique os dados e tente novamente.';
      },
    });
  }
}
