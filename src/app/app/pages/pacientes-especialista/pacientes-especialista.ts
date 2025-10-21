import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../core/servicios/auth';
import { Turnos } from '../../core/servicios/turnos';
import { ToastService } from '../../core/servicios/toast';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import { Loading } from '../../compartido/components/loading/loading';

@Component({
  selector: 'app-pacientes-especialista',
  standalone: true,
  templateUrl: './pacientes-especialista.html',
  styleUrls: ['./pacientes-especialista.scss'],
  imports: [CommonModule, FormsModule, HeaderPropio, Loading],
})
export class PacientesEspecialista implements OnInit {
  especialistaId!: string;
  pacientes: any[] = [];
  filtro = '';
  seleccion: any = null;
  historiaClinica: any[] = [];
  loading = false;

  constructor(private auth: Auth, private turnosSrv: Turnos, private toast: ToastService) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (!user) return;
    this.especialistaId = user.id;
    await this.cargarPacientes();
  }

  async cargarPacientes() {
    this.loading = true;
    try {
      const data = await this.turnosSrv.getPacientesAtendidosPorEspecialista(this.especialistaId);
      this.pacientes = data;
    } catch (err) {
      console.error(err);
      this.toast.show('Error al cargar los pacientes.', 'error');
    } finally {
      this.loading = false;
    }
  }

  get filtrados() {
    const texto = this.filtro.toLowerCase().trim();
    return this.pacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(texto) ||
        p.apellido.toLowerCase().includes(texto) ||
        p.email?.toLowerCase().includes(texto)
    );
  }

  async verHistoria(paciente: any) {
    this.seleccion = paciente;
    this.loading = true;
    try {
      this.historiaClinica = await this.turnosSrv.getHistoriaPorPaciente(paciente.id);
      if (!this.historiaClinica.length) {
        this.toast.show('Este paciente no tiene historia clínica registrada.', 'info');
      }
    } catch (err) {
      console.error(err);
      this.toast.show('Error al obtener la historia clínica.', 'error');
    } finally {
      this.loading = false;
    }
  }

  cerrarDetalle() {
    this.seleccion = null;
    this.historiaClinica = [];
  }
}
