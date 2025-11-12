import { Routes } from '@angular/router';
import { BrowseErrandsComponent } from './browse-errands/browse-errands.component';
import { PostErrandComponent } from './post-errand/post-errand.component';
import { TaskDetailsComponent } from './task-details/task-details.component';
import { TaskTrackingComponent } from './task-tracking/task-tracking.component';
import { authGuard } from '../../guards/auth.guard';
import { ProfileCompletionGuard } from '../../guards/profile-completion.guard';

export const TASKS_ROUTES: Routes = [
  { path: 'browse', component: BrowseErrandsComponent },
  { path: 'post', component: PostErrandComponent, canActivate: [authGuard, ProfileCompletionGuard] },
  { path: 'tracking', component: TaskTrackingComponent, canActivate: [authGuard] },
  { path: ':id', component: TaskDetailsComponent },
  { path: '', redirectTo: 'browse', pathMatch: 'full' }
];