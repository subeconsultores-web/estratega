import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tenantInterceptor } from './core/auth/interceptors/tenant.interceptor';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { provideToastr } from 'ngx-toastr';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

import {
  LucideAngularModule,
  LayoutDashboard, Users, FileText, Briefcase,
  DollarSign, Clock, Bot, Settings, ChevronLeft,
  ChevronRight, Sparkles, ChevronDown, Menu, PanelLeftClose, PanelLeft, LogOut, FileBadge, CheckSquare, Search, Bell, User, Plus, Eye, Edit2
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard, Users, FileText, Briefcase, DollarSign, Clock, Bot, Settings, ChevronLeft, ChevronRight, Sparkles, ChevronDown, Menu, PanelLeftClose, PanelLeft, LogOut, FileBadge, CheckSquare, Search, Bell, User, Plus, Eye, Edit2
      })
    ),
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([tenantInterceptor])),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
    provideToastr({
      timeOut: 4000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions())
  ]
};
