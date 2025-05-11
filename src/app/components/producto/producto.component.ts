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
  mostrarModalExito: boolean = false;
  mostrarModalDetalles: boolean = false;
  productoSeleccionado: Producto | null = null;
  searchTerm: string = '';

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
    let filtered = [...this.productos];
    if (this.filtroCategoria) {
      filtered = filtered.filter((producto) => producto.categoria === this.filtroCategoria);
    }
    if (this.searchTerm) {
      filtered = filtered.filter((producto) =>
        producto.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.productosFiltrados = filtered;
  }

  buscarProductos(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
    this.filtrarProductos();
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
      this.mostrarModalExito = true;
    } else {
      alert('No hay stock disponible para este producto.');
    }
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
  }

  mostrarDetalles(producto: Producto): void {
    this.productoSeleccionado = { ...producto };
    this.mostrarModalDetalles = true;
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.productoSeleccionado = null;
  }

  irAlCarrito(): void {
    this.router.navigate(['/carrito']);
  }

  irAlInventario(): void {
    this.router.navigate(['/inventario']);
  }
}