import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-validation-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (shouldShow) {
      <div class="validation-messages" role="alert" aria-live="polite">
        @if (control.hasError('required')) {
          <span class="msg">Este campo é obrigatório.</span>
        }
        @if (control.hasError('minlength')) {
          <span class="msg">
            Mínimo de {{ control.getError('minlength').requiredLength }} caracteres.
          </span>
        }
        @if (control.hasError('maxlength')) {
          <span class="msg">
            Máximo de {{ control.getError('maxlength').requiredLength }} caracteres.
          </span>
        }
        @if (control.hasError('min')) {
          <span class="msg">Valor mínimo: {{ control.getError('min').min }}.</span>
        }
        @if (control.hasError('pattern')) {
          <span class="msg">Formato inválido.</span>
        }
        @if (control.hasError('url')) {
          <span class="msg">URL inválida.</span>
        }
      </div>
    }
  `,
  styles: [`
    .validation-messages {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }
    .msg {
      font-size: 0.75rem;
      color: var(--color-error);
      animation: fadeIn 0.15s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class ValidationMessageComponent {
  @Input({ required: true }) control!: AbstractControl;

  get shouldShow(): boolean {
    return this.control.invalid && (this.control.dirty || this.control.touched);
  }
}
