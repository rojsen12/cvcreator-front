import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register-component';
import { LoginComponent } from './components/login/login-component';
import { MainPageComponent } from './components/main-page/main-page-component';
import { CreateCvComponent } from './components/create-cv/create-cv-component';
import { EditCvComponent } from './components/edit-cv/edit-cv-component';
import { PreviewCvComponent } from './components/preview-cv/preview-cv-component';
import { MyCvsComponent } from './components/my-cvs/my-cvs-component';
import { authGuard } from './guards/auth.guards';
import { adminGuard } from './guards/admin-guard';
import { CreateTicketComponent } from './components/create-ticket/create-ticket-component';
import { MyTicketsComponent } from './components/my-tickets/my-tickets-component';
import { TicketComponent } from './components/ticket/ticket-component';
import {ChooseMethodComponent} from './components/choose-method/choose-method-component';
import {CreateCvAiComponent} from './components/create-cv-ai/create-cv-ai-component';
import {CvChatComponent} from './components/cv-chat/cv-chat.component';
import {CvPreviewComponent} from './components/cv-preview-component/cv-preview-component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'main-page', component: MainPageComponent, canActivate: [authGuard] },
  { path: 'my-cvs', component: MyCvsComponent, canActivate: [authGuard] },
  { path: 'create-cv', component: CreateCvComponent, canActivate: [authGuard] },
  { path: 'edit-cv', component: EditCvComponent, canActivate: [authGuard] },
  { path: 'edit-cv/:id', component: EditCvComponent, canActivate: [authGuard] },
  { path: 'preview-cv/:id', component: PreviewCvComponent, canActivate: [authGuard] },
  { path: 'create-ticket', component: CreateTicketComponent, canActivate: [authGuard] },
  { path: 'my-tickets', component: MyTicketsComponent, canActivate: [authGuard] },
  { path: 'admin', component: TicketComponent, canActivate: [authGuard, adminGuard] },
  { path: 'choose-method', component: ChooseMethodComponent, canActivate: [authGuard] },
  { path: 'create-cv-ai', component: CreateCvAiComponent, canActivate: [authGuard] },
  { path: 'cv-chat', component: CvChatComponent, canActivate: [authGuard] },
  { path: 'cv-preview', component: CvPreviewComponent, canActivate: [authGuard]},
  { path: '', redirectTo: 'main-page', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
