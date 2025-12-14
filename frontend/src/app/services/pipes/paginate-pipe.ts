import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginate',
  standalone: true
})
export class PaginatePipe implements PipeTransform {
  transform(items: any[], currentPage: number, limit: number): any[] {
    if (!items || items.length === 0) return [];
    const start = (currentPage - 1) * limit;
    return items.slice(start, start + limit);
  }
}
