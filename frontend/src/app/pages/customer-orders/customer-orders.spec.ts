import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerOrders } from './customer-orders';

describe('CustomerOrders', () => {
  let component: CustomerOrders;
  let fixture: ComponentFixture<CustomerOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerOrders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
