import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaClinicaAdmin } from './historia-clinica-admin';

describe('HistoriaClinicaAdmin', () => {
  let component: HistoriaClinicaAdmin;
  let fixture: ComponentFixture<HistoriaClinicaAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaClinicaAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriaClinicaAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
