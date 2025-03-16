import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  productos: Producto[] = [];
  selectedProducto: Producto | null = null;
  productoForm: Producto = new Producto(0, '', 0, '', 0);
  isEditing = false;

  constructor(private productoService: ProductoService, private router: Router) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.productoService.obtenerProducto().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.productos = [];
      }
    });
  }

  crearProducto(): void {
    if (this.productoForm.nombre && this.productoForm.precio > 0 && this.productoForm.cantidad >= 0) {
      const newId = this.productos.length ? Math.max(...this.productos.map(p => p.id)) + 1 : 1;
      const productoToAdd = new Producto(
        newId,
        this.productoForm.nombre,
        this.productoForm.precio,
        this.productoForm.imagen || '/assets/default.jpg',
        this.productoForm.cantidad
      );
      this.productoService.agregarProducto(productoToAdd);
      this.loadProductos(); // Refrescar la lista después de agregar
      this.resetForm();
      console.log('Producto creado:', productoToAdd);
    } else {
      console.error('Datos inválidos para crear producto');
    }
  }

  editarProducto(producto: Producto): void {
    this.productoForm = { ...producto };
    this.isEditing = true;
    this.selectedProducto = producto;
  }

  actualizarProducto(): void {
    if (this.productoForm.nombre && this.productoForm.precio > 0) {
      this.productoService.actualizarProducto(this.productoForm);
      this.loadProductos();
      this.resetForm();
    }
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.productoService.eliminarProducto(id);
      this.loadProductos();
    }
  }

  consultarProducto(producto: Producto): void {
    this.selectedProducto = { ...producto };
    this.isEditing = false;
  }

  generarXML(): void {
    
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<productos>\n';
      this.productos.forEach(producto => {
        xml += `  <producto>\n`;
        xml += `    <id>${producto.id}</id>\n`;
        xml += `    <nombre>${producto.nombre}</nombre>\n`;
        xml += `    <precio>${producto.precio}</precio>\n`;
        xml += `    <imagen>${producto.imagen}</imagen>\n`;
        xml += `    <cantidad>${producto.cantidad}</cantidad>\n`;
        xml += `  </producto>\n`;
      });
      xml += '</productos>';
    
      // Crear un Blob con el contenido XML
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
    
      // Crear un enlace y disparar la descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productos.xml';
      document.body.appendChild(a);
      a.click();
    
      // Limpiar el objeto URL después de la descarga
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    

  }

  resetForm(): void {
    this.productoForm = new Producto(0, '', 0, '', 0);
    this.selectedProducto = null;
    this.isEditing = false;
  }

  irAlCatalogo(): void {
    this.router.navigate(['/']);
  }
}