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
  productosFiltrados: Producto[] = [];
  loading: boolean = true;
  filtroCategoria: string | null = null;

  constructor(
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    this.productoService.obtenerProducto().subscribe({
      next: (data) => {
        this.productos = data;
        this.filtrarProductos();
        this.loading = false;
        console.log('Productos cargados:', this.productos);
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.productos = [];
        this.productosFiltrados = [];
        this.loading = false;
      }
    });
  }

  filtrarProductos(): void {
    if (this.filtroCategoria) {
      this.productosFiltrados = this.productos.filter(
        (producto) => producto.categoria === this.filtroCategoria
      );
    } else {
      this.productosFiltrados = [...this.productos];
    }
  }

  filtrarPorCategoria(categoria: string): void {
    this.filtroCategoria = categoria;
    this.filtrarProductos();
  }

  mostrarTodos(): void {
    this.filtroCategoria = null;
    this.filtrarProductos();
  }

  agregarAlCarrito(producto: Producto): void {
    if (producto.cantidad > 0) {
      this.carritoService.agregarProducto(producto);
      console.log('Producto agregado al carrito:', producto);
    } else {
      alert('No hay stock disponible para este producto.');
    }
  }

  irAlCarrito(): void {
    this.router.navigate(['/carrito']);
  }

  irAlInventario(): void {
    this.router.navigate(['/inventario']);
  }
}