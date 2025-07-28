import { HttpInterceptorFn } from '@angular/common/http';
import {inject} from "@angular/core";
import {AccountsService} from "./accounts/accounts.service";
import {WebService} from "./web.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accountService = inject(AccountsService)
  const webService = inject(WebService)
  const isLoginRequest = req.url.includes("/login") || req.url.includes("/token-auth")
  if (!isLoginRequest && req.url.startsWith(webService.baseURL)) {
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
  if (req.url.startsWith("https://") && req.url.includes(".local")) {
    req = req.clone({
      url: req.url.replace("https://", "http://")
    });
  }

  return next(req);
};
