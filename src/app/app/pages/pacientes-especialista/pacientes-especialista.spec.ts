import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PacientesEspecialista } from './pacientes-especialista';

describe('PacientesEspecialista', () => {
  let component: PacientesEspecialista;
  let fixture: ComponentFixture<PacientesEspecialista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacientesEspecialista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PacientesEspecialista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
