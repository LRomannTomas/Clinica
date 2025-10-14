import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosAdmin } from './turnos-admin';

describe('TurnosAdmin', () => {
  let component: TurnosAdmin;
  let fixture: ComponentFixture<TurnosAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
