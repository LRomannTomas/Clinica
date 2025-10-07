import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../compartido/components/navbar/navbar';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar],
  templateUrl: './bienvenida.html',
  styleUrls: ['./bienvenida.scss']
})
export class Bienvenida {}
