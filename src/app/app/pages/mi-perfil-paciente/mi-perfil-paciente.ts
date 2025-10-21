import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/servicios/auth';
import { Turnos } from '../../core/servicios/turnos';
import { ToastService } from '../../core/servicios/toast';
import { Loading } from '../../compartido/components/loading/loading';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-mi-perfil-paciente',
  standalone: true,
  templateUrl: './mi-perfil-paciente.html',
  styleUrls: ['./mi-perfil-paciente.scss'],
  imports: [CommonModule, Loading, HeaderPropio],
})
export class MiPerfilPaciente implements OnInit {
  paciente: any = null;
  historiaClinica: any[] = [];
  loading = false;

  constructor(private auth: Auth, private turnosSrv: Turnos, private toast: ToastService) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (!user) return;

    this.paciente = user;
    await this.cargarHistoriaClinica();
  }

  async cargarHistoriaClinica() {
    this.loading = true;
    try {
      this.historiaClinica = await this.turnosSrv.getHistoriaPorPaciente(this.paciente.id);
    } catch (err: any) {
      console.error(err);
      this.toast.show('Error al cargar la historia clínica.', 'error');
    } finally {
      this.loading = false;
    }
  }

  async descargarPDF() {
    try {
      if (!this.historiaClinica.length) {
        this.toast.show('No hay datos para descargar.', 'info');
        return;
      }

      const doc = new jsPDF();
      const logo = '/assets/images/logo-clinica.png'; // 🔸 agregá tu logo aquí
      const fecha = new Date().toLocaleDateString('es-AR');

      // Logo (si existe)
      try {
        const img = await fetch(logo);
        const blob = await img.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = () => {
            doc.addImage(reader.result as string, 'PNG', 15, 10, 25, 25);
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch {
        console.warn('Logo no encontrado, se omitirá en el PDF');
      }

      // Encabezado
      doc.setFontSize(16);
      doc.text('Historia Clínica del Paciente', 105, 20, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`Emitido el ${fecha}`, 200 - 20, 28, { align: 'right' });
      doc.text(
        `${this.paciente.user_metadata?.nombre ?? ''} ${this.paciente.user_metadata?.apellido ?? ''}`,
        105,
        35,
        { align: 'center' }
      );
      doc.line(15, 40, 195, 40);

      // Tabla
      const filas = this.historiaClinica.flatMap((h) => {
        const extras = (h.extras || []).map((e: any) => `${e.clave}: ${e.valor}`).join(', ');
        return [
          [
            h.turnos?.fecha || '',
            h.turnos?.especialidad || '',
            `${h.altura_cm} cm`,
            `${h.peso_kg} kg`,
            `${h.temperatura_c} °C`,
            h.presion,
            extras || '-',
          ],
        ];
      });

      autoTable(doc, {
        startY: 45,
        head: [['Fecha', 'Especialidad', 'Altura', 'Peso', 'Temp.', 'Presión', 'Extras']],
        body: filas,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 123, 177] },
      });

      doc.save(`HistoriaClinica_${this.paciente.user_metadata?.apellido || 'paciente'}.pdf`);
    } catch (err) {
      console.error(err);
      this.toast.show('Error al generar el PDF.', 'error');
    }
  }
}
