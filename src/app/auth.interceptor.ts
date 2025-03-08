import { HttpInterceptorFn } from '@angular/common/http';
import {inject} from "@angular/core";
import {AccountsService} from "./accounts/accounts.service";
import {WebService} from "./web.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accountService = inject(AccountsService)
  const webService = inject(WebService)
  const isLoginRequest = req.url.includes("/login") || req.url.includes("/token-auth")
  if (accountService.loggedIn && !isLoginRequest) {
    req = req.clone({
      withCredentials: true,
    })
  }
  req = req.clone({
    setHeaders: {"X-Cupcake-Instance-Id": webService.cupcakeInstanceID}
  })
  if (accountService.token && !isLoginRequest) {
    req = req.clone({
      setHeaders: { Authorization: `Token ${accountService.token}` }
    });
  }

  return next(req);
};
