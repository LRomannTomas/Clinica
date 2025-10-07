import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-uploader.html',
  styleUrls: ['./image-uploader.scss'],
})
export class ImageUploader implements OnDestroy {
  @Input() multiple = false;
  @Output() files = new EventEmitter<File[]>();

  previews: string[] = [];
  archivos: File[] = [];

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.archivos = Array.from(input.files);
    this.files.emit(this.archivos);

    this.previews.forEach(url => URL.revokeObjectURL(url));
    this.previews = this.archivos.map(file => URL.createObjectURL(file));
  }

  eliminarImagen(index: number) {
    this.archivos.splice(index, 1);
    URL.revokeObjectURL(this.previews[index]);
    this.previews.splice(index, 1);
    this.files.emit(this.archivos);
  }

  ngOnDestroy() {
    this.previews.forEach(url => URL.revokeObjectURL(url));
  }
}
