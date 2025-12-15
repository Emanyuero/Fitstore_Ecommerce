import Swal, {
  SweetAlertOptions,
  SweetAlertPosition,
  SweetAlertCustomClass
} from 'sweetalert2';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlertService {

  /** Centralized base configuration for all alerts */
  private readonly baseConfig: SweetAlertOptions = {
    timerProgressBar: true,
    showConfirmButton: false,
    position: 'top-end' as SweetAlertPosition,
    backdrop: false,
    toast: true, 
    iconColor: '#fff',
    background: '#1E40AF',
    color: '#fff',
    showClass: {
      popup: 'animate__animated animate__fadeInDown animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutUp animate__faster'
    },
    customClass: {
      popup: 'rounded-xl shadow-lg',
      title: 'text-sm font-semibold',
      htmlContainer: 'text-sm',
    } as SweetAlertCustomClass,
  };

  success(message: string) {
    Swal.fire({
      ...this.baseConfig,
      icon: 'success',
      title: message, 
      timer: 2000,
      iconColor: '#10B981', 
      background: '#047857',
    });
  }

  error(message: string) {
    Swal.fire({
      ...this.baseConfig,
      icon: 'error',
      title: message,
      timer: 2500,
      iconColor: '#F87171',
      background: '#B91C1C',
    });
  }

  warning(message: string) {
    Swal.fire({
      ...this.baseConfig,
      icon: 'warning',
      title: message,
      timer: 2500,
      iconColor: '#FBBF24',
      background: '#B45309', 
    });
  }

  confirm(message: string): Promise<boolean> {
    return Swal.fire({
      icon: 'question',
      title: 'Are you sure?',
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-xl shadow-lg',
        confirmButton:
          'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-2 transition-colors duration-200',
        cancelButton:
          'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200',
      } as SweetAlertCustomClass,
    }).then(result => result.isConfirmed);
  }
}
