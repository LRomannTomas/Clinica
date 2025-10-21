import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loading } from '../../compartido/components/loading/loading';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import { Turnos } from '../../core/servicios/turnos';
import { ToastService } from '../../core/servicios/toast';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-historia-clinica-admin',
  standalone: true,
  imports: [CommonModule, Loading, HeaderPropio,FormsModule],
  templateUrl: './historia-clinica-admin.html',
  styleUrls: ['./historia-clinica-admin.scss'],
})
export class HistoriaClinicaAdmin implements OnInit {
  historias: any[] = [];
  filtrado: any[] = [];
  filtro = '';
  loading = false;
  private filtroTimer: any = null;

  constructor(private turnosSrv: Turnos, private toast: ToastService) {}

  async ngOnInit() {
    await this.cargarHistorias();
  }

  async cargarHistorias() {
    this.loading = true;
    try {
      this.historias = await this.turnosSrv.getTodasLasHistorias();
      this.filtrado = [...this.historias];
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al cargar historias clínicas.', 'error');
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltroConDebounce() {
    clearTimeout(this.filtroTimer);
    this.filtroTimer = setTimeout(() => this.aplicarFiltro(), 500);
  }

  aplicarFiltro() {
    const q = this.filtro.toLowerCase().trim();
    if (!q) {
      this.filtrado = [...this.historias];
      return;
    }

    this.filtrado = this.historias.filter((h) => {
      const datosFijos = [
        h.paciente?.nombre,
        h.paciente?.apellido,
        h.turnos?.especialidad,
        h.turnos?.fecha,
        h.altura_cm,
        h.peso_kg,
        h.temperatura_c,
        h.presion,
      ];

      const extras = Array.isArray(h.extras)
        ? h.extras.flatMap((e: any) => [e.clave, e.valor])
        : [];

      return [...datosFijos, ...extras]
        .filter(Boolean)
        .some((val: any) => val.toString().toLowerCase().includes(q));
    });
  }
}
