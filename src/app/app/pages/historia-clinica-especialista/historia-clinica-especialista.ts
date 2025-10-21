import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import { Loading } from '../../compartido/components/loading/loading';
import { Turnos } from '../../core/servicios/turnos';
import { Auth } from '../../core/servicios/auth';
import { ToastService } from '../../core/servicios/toast';

@Component({
  selector: 'app-historia-clinica-especialista',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderPropio, Loading],
  templateUrl: './historia-clinica-especialista.html',
  styleUrls: ['./historia-clinica-especialista.scss'],
})
export class HistoriaClinicaEspecialista implements OnInit {
  loading = false;
  especialistaId!: string;
  pacientes: any[] = [];
  historiasSeleccionadas: any[] = [];
  pacienteSeleccionado: any = null;

  mostrarModal = false;

  constructor(
    private turnosSrv: Turnos,
    private auth: Auth,
    private toast: ToastService
  ) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (!user) return;
    this.especialistaId = user.id;
    await this.cargarPacientesAtendidos();
  }

  async cargarPacientesAtendidos() {
    this.loading = true;
    try {
      this.pacientes = await this.turnosSrv.getPacientesAtendidosConHistoria(this.especialistaId);
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al cargar pacientes atendidos.', 'error');
    } finally {
      this.loading = false;
    }
  }

  async verHistoria(paciente: any) {
    this.loading = true;
    try {
      const historias = await this.turnosSrv.getHistoriaPorPaciente(paciente.id);
      this.historiasSeleccionadas = historias.filter(
        (h) => h.especialista_id === this.especialistaId
      );
      this.pacienteSeleccionado = paciente;
      this.mostrarModal = true;
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al cargar la historia clínica.', 'error');
    } finally {
      this.loading = false;
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.historiasSeleccionadas = [];
    this.pacienteSeleccionado = null;
  }
}
