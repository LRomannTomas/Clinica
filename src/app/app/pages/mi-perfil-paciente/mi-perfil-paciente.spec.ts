import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiPerfilPaciente } from './mi-perfil-paciente';

describe('MiPerfilPaciente', () => {
  let component: MiPerfilPaciente;
  let fixture: ComponentFixture<MiPerfilPaciente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiPerfilPaciente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiPerfilPaciente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
