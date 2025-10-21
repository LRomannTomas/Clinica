import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loading } from '../../compartido/components/loading/loading';
import { Turnos } from '../../core/servicios/turnos';
import { Auth } from '../../core/servicios/auth';
import { ToastService } from '../../core/servicios/toast';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historia-clinica-paciente',
  standalone: true,
  imports: [CommonModule, Loading, HeaderPropio],
  templateUrl: './historia-clinica-paciente.html',
  styleUrls: ['./historia-clinica-paciente.scss'],
})
export class HistoriaClinicaPaciente implements OnInit {
  historias: any[] = [];
  loading = false;

  constructor(private turnosSrv: Turnos, private auth: Auth, private toast: ToastService) {}

  async ngOnInit() {
    const user = await this.auth.getUser();
    if (!user) return;

    this.loading = true;
    try {
      this.historias = await this.turnosSrv.getHistoriaPorPaciente(user.id);
    } catch (err) {
      console.error(err);
      this.toast.show('Error al cargar la historia clínica.', 'error');
    } finally {
      this.loading = false;
    }
  }

  async generarPDF() {
  if (!this.historias || this.historias.length === 0) {
    this.toast?.show?.('No hay historias clínicas para descargar.', 'info');
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const contentWidth = 140; 
  const marginX = (pageWidth - contentWidth) / 2; 
  const centerX = pageWidth / 2;

  const fechaEmision = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const logo = await this.cargarImagen?.('assets/images/logo-clinica.png');
  if (logo) doc.addImage(logo, 'PNG', centerX - 15, 10, 30, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CLÍNICA ONLINE', centerX, 50, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('Informe de Historia Clínica', centerX, 60, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Emitido el ${fechaEmision}`, centerX, 68, { align: 'center' });

  doc.setDrawColor(42, 157, 143);
  doc.line(marginX, 72, marginX + contentWidth, 72);

  let startY = 85;

  for (let i = 0; i < this.historias.length; i++) {
    const h = this.historias[i];

    const especialidad = String(h?.turnos?.especialidad ?? 'Sin especialidad');
    const fechaTurno = h?.turnos?.fecha
      ? new Date(h.turnos.fecha).toLocaleDateString('es-AR')
      : 'Sin fecha';

    const altura = `${h?.altura_cm ?? '-'} cm`;
    const peso = `${h?.peso_kg ?? '-'} kg`;
    const temp = `${h?.temperatura_c ?? '-'} °C`;
    const presion = String(h?.presion ?? '-');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(42, 157, 143);
    doc.text(especialidad, centerX, startY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha del turno: ${fechaTurno}`, centerX, startY + 7, { align: 'center' });

    const body: any[] = [
      ['Altura', altura],
      ['Peso',  peso],
      ['Temperatura', temp],
      ['Presión', presion],
    ];

    if (Array.isArray(h?.extras) && h.extras.length > 0) {
      body.push([
        { content: 'Datos adicionales', colSpan: 2, styles: {
          fillColor: [233, 245, 244], 
          textColor: 0,
          fontStyle: 'bold',
          halign: 'center'
        }}
      ]);
      for (const e of h.extras) {
        body.push([String(e?.clave ?? '—'), String(e?.valor ?? '—')]);
      }
    }

    autoTable(doc, {
      head: [['Indicador', 'Valor']],
      body,
      startY: startY + 12,
      theme: 'grid',
      tableWidth: contentWidth,    
      margin: { left: marginX },      
      styles: { halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [42, 157, 143], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: contentWidth / 2 },
        1: { cellWidth: contentWidth / 2 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || (startY + 40);

    doc.setDrawColor(210);
    doc.line(marginX + 5, finalY + 6, marginX + contentWidth - 5, finalY + 6);

    startY = finalY + 16;

    if (startY > pageHeight - 30 && i < this.historias.length - 1) {
      doc.addPage();
      startY = 30;
    }
  }

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Documento generado automáticamente por Clínica Online', centerX, pageHeight - 10, {
    align: 'center',
  });

  doc.save(`historia_clinica_${new Date().getTime()}.pdf`);
}


private cargarImagen(ruta: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = ruta;
    img.onload = () => resolve(img.src);
    img.onerror = () => resolve(undefined);
  });
}
}
