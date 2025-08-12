import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { BrowseErrandsComponent } from './components/browse-errands/browse-errands.component';
// import { PrivacyPolicyComponent } from './components/legal/privacy-policy/privacy-policy.component';
// import { TermsOfServiceComponent } from './components/legal/terms-of-service/terms-of-service.component';
// import { CookiePolicyComponent } from './components/legal/cookie-policy/cookie-policy.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'DoForYou - Home' },
  { path: 'about', component: AboutComponent, title: 'About Us - DoForYou' },
  { path: 'contact', component: ContactComponent, title: 'Contact - DoForYou' },
  {
    path: 'browse-errands',
    component: BrowseErrandsComponent,
    title: 'Browse Errands - DoForYou'
  },

  // {
  //   path: 'privacy-policy',
  //   component: PrivacyPolicyComponent,
  //   title: 'Privacy Policy - DoForYou'
  // },
  // {
  //   path: 'terms-of-service',
  //   component: TermsOfServiceComponent,
  //   title: 'Terms of Service - DoForYou'
  // },
  // {
  //   path: 'cookie-policy',
  //   component: CookiePolicyComponent,
  //   title: 'Cookie Policy - DoForYou'
  // },
  { path: '**', redirectTo: '' }
];
