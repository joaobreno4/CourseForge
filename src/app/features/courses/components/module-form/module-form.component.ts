import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ValidationMessageComponent } from '../../../../shared/components/validation-message/validation-message.component';

@Component({
  selector: 'app-module-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ValidationMessageComponent],
  templateUrl: './module-form.component.html',
  styleUrls: ['./module-form.component.scss'],
})
export class ModuleFormComponent implements OnInit {
  @Input({ required: true }) moduleGroup!: FormGroup;
  @Input() moduleIndex = 0;
  @Input() isExpanded = true;
  @Output() removeModule = new EventEmitter<void>();

  private readonly fb = new FormBuilder();

  get title() { return this.moduleGroup.get('title')!; }
  get description() { return this.moduleGroup.get('description')!; }
  get lessons(): FormArray { return this.moduleGroup.get('lessons') as FormArray; }
  get lessonGroups(): FormGroup[] { return this.lessons.controls as FormGroup[]; }

  ngOnInit(): void {}

  addLesson(): void {
    this.lessons.push(this.createLesson());
  }

  removeLesson(index: number): void {
    this.lessons.removeAt(index);
  }

  getLessonControl(group: FormGroup, name: string) {
    return group.get(name)!;
  }

  private createLesson(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      duration: [null, [Validators.required, Validators.min(1)]],
      videoUrl: [''],
    });
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  get lessonCount(): number {
    return this.lessons.length;
  }

  get totalDuration(): number {
    return this.lessonGroups.reduce((acc, g) => acc + (g.get('duration')?.value || 0), 0);
  }
}
