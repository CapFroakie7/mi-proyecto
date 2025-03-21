import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { ProductoService } from '../../services/producto.service';
import { Router } from '@angular/router';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {
  carrito: Producto[] = [];
  productosInventario: Producto[] = [];

  constructor(
    private carritoService: CarritoService,
    private productoService: ProductoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carrito = this.carritoService.obtenerCarrito();
    this.cargarInventario();
  }

  cargarInventario(): void {
    this.productoService.obtenerProducto().subscribe({
      next: (productos) => {
        this.productosInventario = productos;
      },
      error: (err) => {
        console.error('Error cargando inventario:', err);
        this.productosInventario = [];
      }
    });
  }

  descargarCarrito(): void {
    this.carritoService.descargaXML();
  }

  aumentarCantidad(index: number): void {
    const producto = this.carrito[index];
    this.productoService.obtenerProducto().subscribe({
      next: (productos) => {
        const inventarioProducto = productos.find(p => p.id === producto.id);
        if (inventarioProducto && inventarioProducto.cantidad > 0) {
          producto.cantidad += 1;
          this.productoService.disminuirCantidad(producto.id);
          this.carritoService.actualizarCarrito(this.carrito);
          this.cargarInventario();
          console.log('Cantidad aumentada en carrito:', this.carrito);
        }
      },
      error: (err) => console.error('Error al verificar inventario:', err)
    });
  }

  disminuirCantidad(index: number): void {
    const producto = this.carrito[index];
    if (producto.cantidad > 1) {
      producto.cantidad -= 1;
      this.productoService.aumentarCantidad(producto.id, 1);
      this.carritoService.actualizarCarrito(this.carrito);
      this.cargarInventario();
      console.log('Cantidad disminuida en carrito:', this.carrito);
    }
  }

  eliminarProducto(id: number): void {
    this.carritoService.eliminarProducto(id);
    this.carrito = this.carritoService.obtenerCarrito();
    this.cargarInventario();
  }

  isProductInStock(id: number): boolean {
    const producto = this.productosInventario.find(p => p.id === id);
    return producto ? producto.cantidad > 0 : false;
  }

  irAlCatalogo(): void {
    this.router.navigate(['/']);
  }
}