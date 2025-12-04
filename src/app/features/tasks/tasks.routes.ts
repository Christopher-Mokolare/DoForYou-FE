import { Routes } from '@angular/router';
import { BrowseErrandsComponent } from './browse-errands/browse-errands.component';
import { PostErrandComponent } from './post-errand/post-errand.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';
import { MyActiveTasksComponent } from './my-active-tasks/my-active-tasks.component';
import { MyPostedTasksComponent } from './my-posted-tasks/my-posted-tasks.component';
import { TaskTrackingComponent } from './task-tracking/task-tracking.component';
import { authGuard } from '../../guards/auth.guard';
import { ProfileCompletionGuard } from '../../guards/profile-completion.guard';

export const TASKS_ROUTES: Routes = [
  { path: 'browse', component: BrowseErrandsComponent },
  { path: 'post', component: PostErrandComponent, canActivate: [authGuard, ProfileCompletionGuard] },
  { path: 'tracking', component: TaskTrackingComponent, canActivate: [authGuard] },
  { path: 'my-active', component: MyActiveTasksComponent, canActivate: [authGuard] },
  { path: 'my-posted', component: MyPostedTasksComponent, canActivate: [authGuard] },
  { path: ':id/detail', component: TaskDetailComponent, canActivate: [authGuard] },
  { path: ':id', component: TaskDetailsComponent },
  { path: '', redirectTo: 'browse', pathMatch: 'full' }
];