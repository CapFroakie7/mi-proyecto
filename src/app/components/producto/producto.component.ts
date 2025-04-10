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
  productosFiltrados: Producto[] = []; // Lista de productos filtrados
  loading: boolean = true;
  filtroCategoria: string | null = null; // Categoría seleccionada para el filtro (null significa "mostrar todo")

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
        this.filtrarProductos(); // Filtramos los productos al cargarlos
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

  // Método para filtrar los productos según la categoría seleccionada
  filtrarProductos(): void {
    if (this.filtroCategoria) {
      this.productosFiltrados = this.productos.filter(
        (producto) => producto.categoria === this.filtroCategoria
      );
    } else {
      this.productosFiltrados = [...this.productos]; // Mostrar todos los productos
    }
  }

  // Método para manejar el clic en un botón de filtro
  filtrarPorCategoria(categoria: string): void {
    this.filtroCategoria = categoria;
    this.filtrarProductos();
  }

  // Método para restablecer el filtro y mostrar todos los productos
  mostrarTodos(): void {
    this.filtroCategoria = null;
    this.filtrarProductos();
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