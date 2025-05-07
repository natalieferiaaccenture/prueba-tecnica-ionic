import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, NavController } from '@ionic/angular';
import { BehaviorSubject, Subscription } from 'rxjs';
import { home, trash } from 'ionicons/icons';
import { addIcons } from 'ionicons';

interface Habit {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  durationDays: number;
  completion: { [date: string]: boolean };
}

@Component({
  selector: 'app-habits',
  templateUrl: './habitos.component.html',
  styleUrls: ['./habitos.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HabitsPage implements OnInit, OnDestroy {
  habits$ = new BehaviorSubject<Habit[]>([]);
  newHabitName: string = '';
  newHabitDuration: string = '7';
  editingHabit: Habit | null = null;
  editedHabitName: string = '';
  subscriptions: Subscription[] = [];

  constructor(
    private toastController: ToastController,
    private navCtrl: NavController
  ) {
    addIcons({ home, trash });
  }

  ngOnInit() {
    this.loadHabits();
    this.checkAndRenewHabits();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  goToHome() {
    this.navCtrl.navigateRoot('home');
  }

  loadHabits() {
    const storedHabits = localStorage.getItem('habits');
    this.habits$.next(storedHabits ? JSON.parse(storedHabits) : []);
  }

  saveHabits() {
    localStorage.setItem('habits', JSON.stringify(this.habits$.value));
    this.checkWeeklyCompletion();
    this.checkTotalCompletion();
    this.showSupportMessage();
  }

  async presentToast(
    message: string,
    color: string = 'primary',
    duration: number = 3000
  ) {
    const toast = await this.toastController.create({
      message: message,
      duration: duration,
      color: color,
      position: 'top',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel',
        },
      ],
      cssClass: 'toast-wrapper',
    });
    await toast.present();
  }

  addHabit() {
    if (this.newHabitName.trim() && this.newHabitDuration) {
      const startDate = new Date();
      let endDate: Date | null = null;
      let durationDays = parseInt(this.newHabitDuration, 10);

      switch (this.newHabitDuration) {
        case '5':
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 5);
          break;
        case '7':
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        case '15':
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 15);
          break;
        case '30':
          endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + 1);
          durationDays = 30;
          break;
        case '60':
          endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + 2);
          durationDays = 60;
          break;
      }

      const newHabit: Habit = {
        id: Date.now().toString(),
        name: this.newHabitName.trim(),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
        durationDays: durationDays,
        completion: {},
      };
      this.habits$.next([...this.habits$.value, newHabit]);
      this.newHabitName = '';
      this.newHabitDuration = '7';
      this.saveHabits();
      this.presentToast('Hábito agregado correctamente.');
      this.goToHome();
    } else {
      this.presentToast(
        'Por favor, ingresa un nombre y selecciona una duración para el hábito.',
        'warning'
      );
    }
  }

  toggleCompletion(habitId: string, date: string) {
    const updatedHabits = this.habits$.value.map((habit) => {
      if (habit.id === habitId) {
        return {
          ...habit,
          completion: {
            ...habit.completion,
            [date]: !habit.completion[date],
          },
        };
      }
      return habit;
    });
    this.habits$.next(updatedHabits);
    this.saveHabits();
  }

  getDaysForDuration(startDate: string, durationDays: number): string[] {
    const start = new Date(startDate);
    const days: string[] = [];
    for (let i = 0; i < durationDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  }

  checkWeeklyCompletion() {
    const habits = this.habits$.value;
    let allHabitsCompletedThisWeek = habits.length > 0;
    const completedHabitsThisWeek: string[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    const currentWeekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      currentWeekDates.push(date.toISOString().split('T')[0]);
    }

    for (const habit of habits) {
      let habitCompletedThisWeek = true;
      for (const day of currentWeekDates) {
        if (!habit.completion[day] && new Date(day) <= new Date()) {
          habitCompletedThisWeek = false;
          allHabitsCompletedThisWeek = false;
        }
      }
      if (
        habitCompletedThisWeek &&
        currentWeekDates.some(
          (day) =>
            Object.keys(habit.completion).includes(day) && habit.completion[day]
        )
      ) {
        completedHabitsThisWeek.push(habit.name);
      }
    }

    if (allHabitsCompletedThisWeek && habits.length > 0) {
      this.presentToast(
        `¡Felicidades! ¡Has completado todos tus hábitos de esta semana!`,
        'success'
      );
    } else if (completedHabitsThisWeek.length > 0) {
      const message = `¡Bien hecho! Has completado: ${completedHabitsThisWeek
        .map((name) => `"${name}"`)
        .join(', ')} esta semana. ¡Sigue así!`;
      this.presentToast(message, 'tertiary');
    }
  }

  checkTotalCompletion() {
    const sub = this.habits$.subscribe((habits) => {
      for (const habit of habits) {
        if (habit.endDate) {
          const startDate = new Date(habit.startDate);
          const endDate = new Date(habit.endDate);
          const daysDifference = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          let allCompleted = true;
          for (let i = 0; i < daysDifference; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const formattedDate = date.toISOString().split('T')[0];
            if (!habit.completion[formattedDate]) {
              allCompleted = false;
              break;
            }
          }
          if (daysDifference > 0 && allCompleted) {
            this.presentToast(
              `¡Increíble! Has completado el hábito "${habit.name}" de principio a fin. ¡Felicitaciones!`,
              'warning',
              5000
            );
            return;
          }
        }
      }
    });
    this.subscriptions.push(sub);
  }

  showSupportMessage() {
    const sub = this.habits$.subscribe((habits) => {
      for (const habit of habits) {
        const today = new Date().toISOString().split('T')[0];
        if (
          new Date(today) >= new Date(habit.startDate) &&
          (!habit.endDate || new Date(today) <= new Date(habit.endDate))
        ) {
          const completionRate =
            Object.keys(habit.completion).filter(
              (date) => habit.completion[date]
            ).length /
            Object.keys(habit.completion).filter(
              (date) =>
                new Date(date) <= new Date(today) &&
                new Date(date) >= new Date(habit.startDate)
            ).length;
          if (completionRate > 0.5 && completionRate < 1) {
            this.presentToast(
              `¡Vas por buen camino! Sigue esforzándote para completar tus hábitos.`,
              'info'
            );
            return;
          }
        }
      }
    });
    this.subscriptions.push(sub);
  }

  checkAndRenewHabits() {
    const currentHabits = this.habits$.value;
    const updatedHabits: Habit[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const habit of currentHabits) {
      if (habit.endDate && today > habit.endDate) {
        const newStartDate = new Date();
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newStartDate.getDate() + habit.durationDays);

        const renewedHabit: Habit = {
          id: Date.now().toString(),
          name: habit.name,
          startDate: newStartDate.toISOString().split('T')[0],
          endDate: newEndDate.toISOString().split('T')[0],
          durationDays: habit.durationDays,
          completion: {},
        };
        updatedHabits.push(renewedHabit);
      } else {
        updatedHabits.push(habit);
      }
    }
    this.habits$.next(updatedHabits);
    this.saveHabits();
  }

  getDurationInDays(duration: string): number {
    switch (duration) {
      case '5':
        return 5;
      case '7':
        return 7;
      case '15':
        return 15;
      case '30':
        return 30;
      case '60':
        return 60;
      default:
        return 7;
    }
  }

  startEditHabit(habit: Habit) {
    this.editingHabit = { ...habit };
    this.editedHabitName = habit.name;
  }

  cancelEditHabit() {
    this.editingHabit = null;
  }

  saveEditedHabit() {
    if (this.editingHabit && this.editedHabitName.trim()) {
      const updatedHabits = this.habits$.value.map((habit) => {
        if (habit.id === this.editingHabit!.id) {
          return { ...habit, name: this.editedHabitName.trim() };
        }
        return habit;
      });
      this.habits$.next(updatedHabits);
      this.saveHabits();
      this.editingHabit = null;
      this.presentToast('Hábito editado correctamente.');
      this.goToHome();
    }
  }

  deleteHabit(habitId: string) {
    this.habits$.next(
      this.habits$.value.filter((habit) => habit.id !== habitId)
    );
    this.saveHabits();
    this.presentToast('Hábito eliminado correctamente.');
    this.goToHome();
  }

  trackByHabitId = (index: number, habit: Habit): string => habit.id;

  trackByDay = (index: number, day: string): string => day;
}
