import Swal from 'sweetalert2';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AlertService {

  success(message: string) {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false
    });
  }

  error(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      timer: 2500,
      timerProgressBar: true,
      showConfirmButton: false
    });
  }

  warning(message: string) {
    Swal.fire({
      icon: 'warning',
      title: 'Warning',
      text: message,
      timer: 2500,
      timerProgressBar: true,
      showConfirmButton: false
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
    }).then(result => result.isConfirmed);
  }
}
