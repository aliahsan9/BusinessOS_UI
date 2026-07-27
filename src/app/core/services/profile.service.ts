import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  AccountProfileDto,
  ChangePasswordRequest,
  UpdateAccountProfileRequest,
} from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService extends BaseApiService {
  getMyProfile(): Observable<AccountProfileDto> {
    return this.get<AccountProfileDto>(API_ENDPOINTS.account.me);
  }

  updateMyProfile(request: UpdateAccountProfileRequest): Observable<AccountProfileDto> {
    return this.put<AccountProfileDto>(API_ENDPOINTS.account.me, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.post<void>(API_ENDPOINTS.account.changePassword, request);
  }
}
