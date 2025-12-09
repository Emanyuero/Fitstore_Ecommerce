import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth-guard';
import { Auth } from '../services/auth/auth';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authMock: any;
  let routerMock: any;

  beforeEach(() => {
    // Mock Auth service
    authMock = {
      isLoggedIn: jasmine.createSpy('isLoggedIn'),
      getRole: jasmine.createSpy('getRole')
    };

    // Mock Router
    routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Auth, useValue: authMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should deny access if not logged in', () => {
    authMock.isLoggedIn.and.returnValue(false);
    const result = guard.canActivate({ data: {} } as any);
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should allow access if logged in and no roles specified', () => {
    authMock.isLoggedIn.and.returnValue(true);
    const result = guard.canActivate({ data: {} } as any);
    expect(result).toBeTrue();
  });

  it('should deny access if role does not match', () => {
    authMock.isLoggedIn.and.returnValue(true);
    authMock.getRole.and.returnValue('customer');
    const result = guard.canActivate({ data: { roles: ['owner'] } } as any);
    expect(result).toBeFalse();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should allow access if role matches', () => {
    authMock.isLoggedIn.and.returnValue(true);
    authMock.getRole.and.returnValue('owner');
    const result = guard.canActivate({ data: { roles: ['owner'] } } as any);
    expect(result).toBeTrue();
  });
});
