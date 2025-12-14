import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryFilter',
  standalone: true
})
export class CategoryFilterPipe implements PipeTransform {
  transform(items: any[], category: string): any[] {
    if (!items || !category) return items; // return all if no category selected
    return items.filter(item => item.category === category);
  }
}
