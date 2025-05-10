import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // Para usar router-outlet
import { CommonModule } from '@angular/common'; // Para importar módulos comunes

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet], // Importa RouterOutlet para el enrutador
  template: "<router-outlet></router-outlet>", // Usamos template inline
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'mi-proyecto';
}
