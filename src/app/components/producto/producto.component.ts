import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../services/producto.service';
import { CarritoService } from '../../services/carrito.service';
import { Router } from '@angular/router';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './producto.component.html',
  styleUrls: ['./producto.component.css']
})
export class ProductoComponent implements OnInit {
  productos: Producto[] = [];
  loading: boolean = true;

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.productoService.obtenerProducto().subscribe({
      next: (data) => {
        this.productos = data;
        this.loading = false;
        console.log('Productos cargados:', this.productos);
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.productos = [];
        this.loading = false;
      }
    });
  }

  agregarAlCarrito(producto: Producto): void {
    if (producto.cantidad > 0) {
      this.carritoService.agregarProducto(producto);
      this.cargarProductos(); // Refrescar productos para reflejar la disminución de cantidad
      console.log('Producto agregado al carrito:', producto);
    }
  }

  irAlCarrito(): void {
    this.router.navigate(['/carrito']);
  }

  irAlInventario(): void {
    this.router.navigate(['/inventario']);
  }
}