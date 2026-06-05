import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/courses';

  getAll(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  search(name: string): Observable<Course[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Course[]>(`${this.apiUrl}/search`, { params });
  }

  getById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  create(course: Omit<Course, 'id'>): Observable<Course> {
    const payload: Course = {
      ...course,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.http.post<Course>(this.apiUrl, payload);
  }

  update(id: string, course: Partial<Course>): Observable<Course> {
    const payload = { ...course, updatedAt: new Date().toISOString() };
    return this.http.put<Course>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
