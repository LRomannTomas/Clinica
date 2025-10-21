import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaClinicaEspecialista } from './historia-clinica-especialista';

describe('HistoriaClinicaEspecialista', () => {
  let component: HistoriaClinicaEspecialista;
  let fixture: ComponentFixture<HistoriaClinicaEspecialista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaClinicaEspecialista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriaClinicaEspecialista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
