import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { fetchAndActivate, getValue } from 'firebase/remote-config';
import { FirebaseConfig } from '../firebase.component';

interface Task {
  id: number;
  name: string;
  category: string;
  date: Date;
  completed: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  public showEditCategoryModal: boolean = false;

  openEditCategoryModal(): void {
    this.showEditCategoryModal = true;
  }

  closeEditCategoryModal(): void {
    this.showEditCategoryModal = false;
  }

  private readonly localStorageKey = 'taskListApp';
  private readonly categoriesLocalStorageKey = 'taskCategoriesApp';
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();
  private categoriesSubject = new BehaviorSubject<string[]>([]);
  public categories$ = this.categoriesSubject.asObservable();
  public selectedCategory: string = 'Todos';
  public filteredTasks$;
  public username: string = this.getUsername();
  public newTask: Task = {
    id: 0,
    name: '',
    category: '',
    date: new Date(),
    completed: false,
  };
  public newCategoryName: string = '';
  public showAddTaskModal: boolean = false;
  public showAddCategoryModal: boolean = false;
  private nextTaskId: number = this.getNextId();
  private destroy$ = new Subject<void>();

  public firebasemassage: any = 'hola';
  public botonhabitos: any = 'false';
  constructor(public firebaseRemoteConfig: FirebaseConfig) {
    this.filteredTasks$ = combineLatest([
      this.tasks$,
      this.categories$,
      this.selectedCategory$,
    ]).pipe(
      map(([tasks, categories, selectedCategory]) => {
        if (selectedCategory === 'Todos') {
          return tasks;
        }
        return tasks.filter((task) => task.category === selectedCategory);
      }),
      takeUntil(this.destroy$)
    );
    this.firebasemassage = getValue(
      firebaseRemoteConfig.getRemoteConfig(),
      'welcome_message'
    );
    this.botonhabitos = getValue(
      firebaseRemoteConfig.getRemoteConfig(),
      'botonhabitos'
    ).asString();
  }

  private selectedCategorySubject = new BehaviorSubject<string>('Todos');
  public selectedCategory$ = this.selectedCategorySubject.asObservable();

  ngOnInit(): void {
    this.loadTasksFromLocalStorage();
    this.loadCategoriesFromLocalStorage();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getUsername(): string {
    return localStorage.getItem('username') || 'Usuario';
  }

  private saveTasksToLocalStorage(): void {
    localStorage.setItem(
      this.localStorageKey,
      JSON.stringify(this.tasksSubject.value)
    );
  }

  private loadTasksFromLocalStorage(): void {
    const storedTasks = localStorage.getItem(this.localStorageKey);
    if (storedTasks) {
      this.tasksSubject.next(
        JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          date: new Date(task.date),
        }))
      );
      this.nextTaskId = this.getNextId();
    }
  }

  private saveCategoriesToLocalStorage(): void {
    localStorage.setItem(
      this.categoriesLocalStorageKey,
      JSON.stringify(this.categoriesSubject.value)
    );
  }

  private loadCategoriesFromLocalStorage(): void {
    const storedCategories = localStorage.getItem(
      this.categoriesLocalStorageKey
    );
    if (storedCategories) {
      this.categoriesSubject.next(JSON.parse(storedCategories));
    } else {
      this.categoriesSubject.next([
        'Personal',
        'Trabajo',
        'Salud',
        'Estudios',
        'Hogar',
        'Finanzas',
        'Ocio',
      ]);
      this.saveCategoriesToLocalStorage();
    }
  }

  private getNextId(): number {
    const currentTasks = this.tasksSubject.value;
    if (currentTasks.length === 0) {
      return 1;
    }
    return Math.max(...currentTasks.map((task) => task.id)) + 1;
  }

  toggleComplete(taskToUpdate: Task): void {
    const updatedTasks = this.tasksSubject.value.map((task) =>
      task.id === taskToUpdate.id
        ? { ...task, completed: !task.completed }
        : task
    );
    this.tasksSubject.next(updatedTasks);
    this.saveTasksToLocalStorage();
  }

  deleteCompletedTasks(): void {
    const incompleteTasks = this.tasksSubject.value.filter(
      (task) => !task.completed
    );
    this.tasksSubject.next(incompleteTasks);
    this.saveTasksToLocalStorage();
  }

  openAddTaskModal(): void {
    this.newTask = {
      id: 0,
      name: '',
      category: '',
      date: new Date(),
      completed: false,
    };
    this.showAddTaskModal = true;
  }

  closeAddTaskModal(): void {
    this.showAddTaskModal = false;
  }

  addTask(): void {
    if (this.newTask.name && this.newTask.category && this.newTask.date) {
      const newTaskWithId = { ...this.newTask, id: this.nextTaskId++ };
      this.tasksSubject.next([...this.tasksSubject.value, newTaskWithId]);
      this.saveTasksToLocalStorage();
      this.closeAddTaskModal();
      this.newTask = {
        id: 0,
        name: '',
        category: '',
        date: new Date(),
        completed: false,
      };
    } else {
      alert('Por favor, complete todos los campos de la tarea.');
    }
  }

  openAddCategoryModal(): void {
    this.newCategoryName = '';
    this.showAddCategoryModal = true;
  }

  closeAddCategoryModal(): void {
    this.showAddCategoryModal = false;
  }

  addCategory(): void {
    if (
      this.newCategoryName &&
      !this.categoriesSubject.value.includes(this.newCategoryName)
    ) {
      this.categoriesSubject.next([
        ...this.categoriesSubject.value,
        this.newCategoryName,
      ]);
      this.saveCategoriesToLocalStorage();
      this.newCategoryName = '';
      this.closeAddCategoryModal();
    } else if (this.categoriesSubject.value.includes(this.newCategoryName)) {
      alert('Esta categoría ya existe.');
    } else {
      alert('Por favor, ingrese el nombre de la categoría.');
    }
  }

  deleteCategory(categoryToDelete: string): void {
    if (
      confirm(
        `¿Seguro que quieres eliminar la categoría "${categoryToDelete}"? Las tareas asociadas a esta categoría se mantendrán sin categoría.`
      )
    ) {
      const updatedCategories = this.categoriesSubject.value.filter(
        (cat) => cat !== categoryToDelete
      );
      this.categoriesSubject.next(updatedCategories);
      this.saveCategoriesToLocalStorage();

      const updatedTasks = this.tasksSubject.value.map((task) =>
        task.category === categoryToDelete ? { ...task, category: '' } : task
      );
      this.tasksSubject.next(updatedTasks);
      this.saveTasksToLocalStorage();
    }
  }

  selectCategory(category: string): void {
    this.selectedCategorySubject.next(category);
  }

  getIndicatorColor(category: string): string {
    switch (category) {
      case 'Personal':
        return '#f44336';
      case 'Trabajo':
        return '#ff9800';
      case 'Salud':
        return '#4caf50';
      case 'Estudios':
        return '#9c27b0';
      case 'Hogar':
        return '#03a9f4';
      case 'Finanzas':
        return '#fdd835';
      case 'Ocio':
        return '#e040fb';
      default:
        return '#2196f3';
    }
  }
}
