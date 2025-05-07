import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home/home.page';
import { HabitsPage } from './habitos/habitos.component';

export const routes: Routes = [
  { path: 'home', component: HomePage },

  {
    path: 'habits',
    loadComponent: () =>
      import('./habitos/habitos.component').then((m) => m.HabitsPage),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
