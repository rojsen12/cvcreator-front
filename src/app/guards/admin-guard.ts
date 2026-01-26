import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../api/api.service';

export const adminGuard = () => {
  const apiService = inject(ApiService);
  const router = inject(Router);


  const isLoggedIn = apiService.isLoggedIn();

  if (!isLoggedIn) {
    return router.createUrlTree(['/login']);
  }

  const isAdmin = apiService.isAdmin();

  if (isAdmin) {
    return true;
  }

  return router.createUrlTree(['/main-page']);
};
