import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { BrowseErrandsComponent } from './components/browse-errands/browse-errands.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  {
    path: 'browse-errands',
    component: BrowseErrandsComponent,
    title: 'Browse Errands - DoForYou',
  },
  { path: '**', redirectTo: '' },
];
