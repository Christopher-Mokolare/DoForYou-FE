import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { BrowseErrandsComponent } from './components/browse-errands/browse-errands.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { PostErrandComponent } from './components/post-errand/post-errand.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'browse-errands', component: BrowseErrandsComponent },
  { path: 'post-errand', component: PostErrandComponent, canActivate: [authGuard] },
  { path: 'contact', component: ContactComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];