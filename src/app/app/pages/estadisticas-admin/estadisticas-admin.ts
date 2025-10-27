import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { HeaderPropio } from '../../compartido/components/header/headerPropio';
import { Loading } from '../../compartido/components/loading/loading';
import { supabase } from '../../core/supabase/supabase.client';

Chart.register(...registerables);

@Component({
  selector: 'app-estadisticas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderPropio, Loading],
  templateUrl: './estadisticas-admin.html',
  styleUrls: ['./estadisticas-admin.scss'],
})
export class EstadisticasAdmin implements OnInit, AfterViewInit {
  @ViewChild('chartEspecialidad') chartEspRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDias') chartDiasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartMedicos') chartMedicosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartrealizados') chartrealizadosRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartLogs', { static: false }) chartLogsRef?: ElementRef<HTMLCanvasElement>;


  loading = true;
  sinDatosEspecialidad = false;
  sinDatosDias = false;
  sinDatosMedicos = true;
  sinDatosrealizados = true;

  chartEsp?: Chart;
  chartDias?: Chart;
  chartMedicos?: Chart;
  chartrealizados?: Chart;

  logs: any[] = [];
  chartLogs?: Chart;
  labelsLogs: string[] = [];
  valuesLogs: number[] = [];
  sinDatosLogs = false;

  private labelsEsp: string[] = [];
  private valuesEsp: number[] = [];

  private labelsDias: string[] = [];
  private valuesDias: number[] = [];

  private labelsMedicos: string[] = [];
  private valuesMedicos: number[] = [];

  private labelsrealizados: string[] = [];
  private valuesrealizados: number[] = [];

  constructor(private cdr: ChangeDetectorRef) {}


  async ngOnInit() {
    await this.cargarDatos();
  }

  ngAfterViewInit() {
  const slides = document.querySelector('.slides') as HTMLElement;
  if (slides) {
    const totalSlides = slides.children.length;
    slides.style.width = `${totalSlides * 100}%`;
  }

  setTimeout(async () => {
    this.inicializarGraficosSiListos();
    this.actualizarGraficoActual();

    await this.cargarLogIngresos();
  }, 600);
}


  actualizarGraficoActual() {
    switch (this.indexActual) {
      case 0:
        if (!this.sinDatosEspecialidad) this.crearGraficoEspecialidad();
        break;
      case 1:
        if (!this.sinDatosDias) this.crearGraficoDias();
        break;
      case 2:
        if (!this.sinDatosMedicos) this.cargarTurnosPorMedicoUltimos30Dias(true);
        break;
      case 3:
        if (!this.sinDatosrealizados) this.cargarTurnosrealizadosPorMedico(true);
        break;
      case 4:
        if (!this.sinDatosLogs) this.cargarLogIngresos();
        break;

    }
  }

  private async cargarDatos() {
    try {
      const { data, error } = await supabase
        .from('turnos')
        .select('especialidad, fecha, especialista_id, estado');
      if (error) throw error;

      const conteoEsp: Record<string, number> = {};
      data.forEach((t) => {
        if (t.especialidad)
          conteoEsp[t.especialidad] = (conteoEsp[t.especialidad] || 0) + 1;
      });
      this.labelsEsp = Object.keys(conteoEsp);
      this.valuesEsp = Object.values(conteoEsp);
      this.sinDatosEspecialidad = this.labelsEsp.length === 0;

      const conteoDias: Record<string, number> = {};
      data.forEach((t) => {
        if (t.fecha) {
          const f = new Date(t.fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
          });
          conteoDias[f] = (conteoDias[f] || 0) + 1;
        }
      });
      this.labelsDias = Object.keys(conteoDias);
      this.valuesDias = Object.values(conteoDias);
      this.sinDatosDias = this.labelsDias.length === 0;

      await this.cargarTurnosPorMedicoUltimos30Dias(false);
      await this.cargarTurnosrealizadosPorMedico(false);
      await this.cargarLogIngresos();
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private inicializarGraficosSiListos() {
    if (
      !this.chartEspRef ||
      !this.chartDiasRef ||
      !this.chartMedicosRef ||
      !this.chartrealizadosRef
    ) {
      setTimeout(() => this.inicializarGraficosSiListos(), 300);
      return;
    }

    if (!this.sinDatosEspecialidad) this.crearGraficoEspecialidad();
    if (!this.sinDatosDias) this.crearGraficoDias();
    if (!this.sinDatosMedicos) this.cargarTurnosPorMedicoUltimos30Dias(true);
    if (!this.sinDatosrealizados) this.cargarTurnosrealizadosPorMedico(true);
  }

  private async cargarTurnosPorMedicoUltimos30Dias(graficar = false) {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 30);

    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('especialista_id, fecha')
      .gte('fecha', hace30.toISOString())
      .lte('fecha', hoy.toISOString());

    if (error || !turnos) return;

    if (turnos.length === 0) {
      this.sinDatosMedicos = true;
      return;
    }

    const idsEspecialistas = [...new Set(turnos.map((t) => t.especialista_id))];
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .in('id', idsEspecialistas);

    const mapaNombres = new Map(
      usuarios?.map((u) => [u.id, `${u.nombre} ${u.apellido}`])
    );

    const conteo: Record<string, number> = {};
    turnos.forEach((t) => {
      const nombre = mapaNombres.get(t.especialista_id) || 'Desconocido';
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    this.labelsMedicos = Object.keys(conteo);
    this.valuesMedicos = Object.values(conteo);
    this.sinDatosMedicos = this.labelsMedicos.length === 0;

    if (graficar && this.chartMedicosRef) {
      if (this.chartMedicos) this.chartMedicos.destroy();
      this.chartMedicos = new Chart(this.chartMedicosRef.nativeElement, {
        type: 'bar',
        data: {
          labels: this.labelsMedicos,
          datasets: [
            {
              label: 'Turnos solicitados (últimos 30 días)',
              data: this.valuesMedicos,
              backgroundColor: '#457b9d',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }
  }

  private async cargarTurnosrealizadosPorMedico(graficar = false) {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 30);

    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('especialista_id, estado, fecha')
      .gte('fecha', hace30.toISOString())
      .lte('fecha', hoy.toISOString())
      .eq('estado', 'realizado');

    if (error || !turnos) return;

    if (turnos.length === 0) {
      this.sinDatosrealizados = true;
      return;
    }

    const idsEspecialistas = [...new Set(turnos.map((t) => t.especialista_id))];
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido')
      .in('id', idsEspecialistas);

    const mapaNombres = new Map(
      usuarios?.map((u) => [u.id, `${u.nombre} ${u.apellido}`])
    );

    const conteo: Record<string, number> = {};
    turnos.forEach((t) => {
      const nombre = mapaNombres.get(t.especialista_id) || 'Desconocido';
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    this.labelsrealizados = Object.keys(conteo);
    this.valuesrealizados = Object.values(conteo);
    this.sinDatosrealizados = this.labelsrealizados.length === 0;

    if (graficar && this.chartrealizadosRef) {
      if (this.chartrealizados) this.chartrealizados.destroy();
      this.chartrealizados = new Chart(this.chartrealizadosRef.nativeElement, {
        type: 'bar',
        data: {
          labels: this.labelsrealizados,
          datasets: [
            {
              label: 'Turnos realizados (últimos 30 días)',
              data: this.valuesrealizados,
              backgroundColor: '#2a9d8f',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }
  }

  private crearGraficoEspecialidad() {
    if (!this.chartEspRef) return;
    if (this.chartEsp) this.chartEsp.destroy(); 
    this.chartEsp = new Chart(this.chartEspRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.labelsEsp,
        datasets: [
          {
            data: this.valuesEsp,
            backgroundColor: [
              '#2a9d8f',
              '#264653',
              '#e9c46a',
              '#f4a261',
              '#e76f51',
            ],
          },
        ],
      },
      options: { plugins: { legend: { position: 'bottom' } } },
    });
  }

  private crearGraficoDias() {
    if (!this.chartDiasRef) return;
    if (this.chartDias) this.chartDias.destroy();
    this.chartDias = new Chart(this.chartDiasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.labelsDias,
        datasets: [
          { data: this.valuesDias, backgroundColor: '#2a9d8f', borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }

  private async cargarLogIngresos() {
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);

  const { data: logs, error } = await supabase
    .from('log_ingresos')
    .select('usuario_id, email, fecha')
    .gte('fecha', desde.toISOString())
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error al obtener logs:', error);
    return;
  }

  if (!logs || logs.length === 0) {
    this.logs = [];
    this.sinDatosLogs = true;
    return;
  }

  const idsUsuarios = [...new Set(logs.map((l) => l.usuario_id))];
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, apellido')
    .in('id', idsUsuarios);

  const mapaUsuarios = new Map(
    usuarios?.map((u) => [u.id, `${u.nombre} ${u.apellido}`])
  );

  this.logs = logs.map((l) => ({
    ...l,
    nombreCompleto: mapaUsuarios.get(l.usuario_id) || 'Desconocido',
  }));

  const conteo: Record<string, number> = {};
  this.logs.forEach((l) => {
    const n = l.nombreCompleto;
    conteo[n] = (conteo[n] || 0) + 1;
  });

  this.labelsLogs = Object.keys(conteo);
  this.valuesLogs = Object.values(conteo);
  this.sinDatosLogs = this.labelsLogs.length === 0;

  console.log('✅ Generando gráfico de LOGS', this.labelsLogs, this.valuesLogs);

  if (this.chartLogsRef?.nativeElement) {
    if (this.chartLogs) this.chartLogs.destroy();
    this.chartLogs = new Chart(this.chartLogsRef.nativeElement, {
      type: 'bar',
      data: {
        labels: this.labelsLogs,
        datasets: [
          {
            label: 'Ingresos al sistema (últimos 30 días)',
            data: this.valuesLogs,
            backgroundColor: '#1d3557',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } else {
    console.warn('⚠️ Canvas de LOGS no encontrado todavía');
  }
}


async descargarPDF() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const contentWidth = 160;
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
  doc.text('Informe de Estadísticas Administrativas', centerX, 60, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Emitido el ${fechaEmision}`, centerX, 68, { align: 'center' });

  doc.setDrawColor(42, 157, 143);
  doc.line(marginX, 72, marginX + contentWidth, 72);

  let y = 85;

  const agregarGrafico = (titulo: string, canvasRef: any, labels: string[], values: number[]) => {
    if (!canvasRef) return;

    const img = canvasRef.nativeElement.toDataURL('image/png');
    const alto = 85;

    if (y + alto + 30 > pageHeight) {
      doc.addPage();
      y = 40;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(42, 157, 143);
    doc.setFontSize(13);
    doc.text(titulo, centerX, y, { align: 'center' });

    doc.addImage(img, 'PNG', marginX, y + 5, contentWidth, alto);
    y += alto + 15;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(10);
    for (let i = 0; i < labels.length; i++) {
      const linea = `${labels[i]}: ${values[i]}`;
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 30;
      }
      doc.text(linea, marginX + 10, y);
      y += 5;
    }

    doc.setDrawColor(210);
    doc.line(marginX + 5, y + 4, marginX + contentWidth - 5, y + 4);
    y += 14;
  };

  agregarGrafico('Turnos por Especialidad', this.chartEspRef, this.labelsEsp, this.valuesEsp);
  agregarGrafico('Turnos por Día', this.chartDiasRef, this.labelsDias, this.valuesDias);
  agregarGrafico('Turnos Solicitados (últimos 30 días)', this.chartMedicosRef, this.labelsMedicos, this.valuesMedicos);
  agregarGrafico('Turnos Realizados (últimos 30 días)', this.chartrealizadosRef, this.labelsrealizados, this.valuesrealizados);
  agregarGrafico('Ingresos al sistema (últimos 30 días)', this.chartLogsRef, this.labelsLogs, this.valuesLogs);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Documento generado automáticamente por Clínica Online', centerX, pageHeight - 10, {
    align: 'center',
  });

  doc.save(`estadisticas_completas_${new Date().getTime()}.pdf`);
}

private cargarImagen(ruta: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = ruta;
    img.onload = () => resolve(img.src);
    img.onerror = () => resolve(undefined);
  });
}


descargarExcel() {
  const wb = XLSX.utils.book_new();

  const data1 = this.labelsEsp.map((l, i) => ({
    Especialidad: l,
    'Cantidad de Turnos': this.valuesEsp[i],
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data1), 'Por Especialidad');

  const data2 = this.labelsDias.map((l, i) => ({
    Día: l,
    'Cantidad de Turnos': this.valuesDias[i],
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data2), 'Por Día');

  const data3 = this.labelsMedicos.map((l, i) => ({
    Médico: l,
    'Turnos Solicitados': this.valuesMedicos[i],
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data3), 'Solicitados');

  const data4 = this.labelsrealizados.map((l, i) => ({
    Médico: l,
    'Turnos Realizados': this.valuesrealizados[i],
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data4), 'Realizados');

  const data5 = this.logs.map((l) => ({
    Usuario: l.nombreCompleto,
    Email: l.email,
    Fecha: new Date(l.fecha).toLocaleString('es-AR'),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data5), 'Log de ingresos');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `estadisticas_completas_${Date.now()}.xlsx`);
}

indexActual = 0;
totalSlides = 5;

get transformStyle() {
  return `translateX(-${this.indexActual * 100}%)`;
}

siguiente() {
  if (this.indexActual < this.totalSlides - 1) {
    this.indexActual++;
    this.actualizarGraficoActual();
  }
}

anterior() {
  if (this.indexActual > 0) {
    this.indexActual--;
    this.actualizarGraficoActual();
  }
}

}
