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
  productoForm: Producto = new Producto(0, '', 0, '', 0, '', 'Playeras'); // Categoría por defecto
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Lista de categorías disponibles
  categorias: string[] = [
    'Playeras',
    'Shorts',
    'Balones',
    'Uniformes',
    'Zapatillas',
    'Accesorios',
    'Sin categoría'
  ];

  constructor(private productoService: ProductoService, private router: Router) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.productoService.obtenerProducto().subscribe({
      next: (data) => {
        this.productos = data;
        this.errorMessage = null;
        this.successMessage = null;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.productos = [];
        this.errorMessage = 'Error al cargar los productos. Por favor, intenta de nuevo.';
      }
    });
  }

  crearProducto(): void {
    console.log('productoForm antes de crear:', this.productoForm);
    if (
      this.productoForm.nombre &&
      this.productoForm.precio > 0 &&
      this.productoForm.cantidad >= 0 &&
      this.productoForm.categoria && // Aseguramos que categoria no sea undefined ni vacío
      this.productoForm.categoria !== ''
    ) {
      const productoToAdd = new Producto(
        0,
        this.productoForm.nombre,
        this.productoForm.precio,
        this.productoForm.imagen || '/assets/default.jpg',
        this.productoForm.cantidad,
        this.productoForm.descripcion,
        this.productoForm.categoria
      );
      this.productoService.agregarProducto(productoToAdd).subscribe({
        next: () => {
          this.loadProductos();
          this.resetForm();
          this.errorMessage = null;
          this.successMessage = 'Producto creado exitosamente.';
        },
        error: (err) => {
          console.error('Error al crear producto:', err);
          this.errorMessage = 'Error al crear el producto. Por favor, verifica los datos e intenta de nuevo.';
        }
      });
    } else {
      this.errorMessage = 'Datos inválidos para crear producto. Asegúrate de que el nombre no esté vacío, el precio sea mayor a 0, la cantidad sea válida y se haya seleccionado una categoría.';
    }
  }

  editarProducto(producto: Producto): void {
    this.productoForm = { ...producto };
    this.isEditing = true;
    this.selectedProducto = producto;
  }

  actualizarProducto(): void {
    console.log('productoForm antes de actualizar:', this.productoForm);
    if (
      this.productoForm.nombre &&
      this.productoForm.precio > 0 &&
      this.productoForm.categoria &&
      this.productoForm.categoria !== ''
    ) {
      const productoExistente = this.productos.find(p => p.id === this.productoForm.id);
      if (!productoExistente) {
        this.errorMessage = 'El producto que intentas actualizar no existe. Por favor, recarga la página e intenta de nuevo.';
        return;
      }

      this.productoService.actualizarProducto(this.productoForm).subscribe({
        next: () => {
          this.loadProductos();
          this.resetForm();
          this.errorMessage = null;
          this.successMessage = 'Producto actualizado exitosamente.';
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
          this.errorMessage = 'Error al actualizar el producto. Por favor, intenta de nuevo.';
        }
      });
    } else {
      this.errorMessage = 'Datos inválidos para actualizar producto. Asegúrate de que el nombre no esté vacío, el precio sea mayor a 0 y se haya seleccionado una categoría.';
    }
  }

  eliminarProducto(id: number): void {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.productoService.eliminarProducto(id).subscribe({
        next: () => {
          this.loadProductos();
          this.errorMessage = null;
          this.successMessage = 'Producto eliminado exitosamente.';
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
          this.errorMessage = 'Error al eliminar el producto. Por favor, intenta de nuevo.';
        }
      });
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
      xml += `    <categoria>${producto.categoria || 'Sin categoría'}</categoria>\n`;
      xml += `  </producto>\n`;
    });
    xml += '</productos>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  resetForm(): void {
    this.productoForm = new Producto(0, '', 0, '', 0, '', 'Playeras'); // Aseguramos que siempre haya una categoría por defecto
    this.selectedProducto = null;
    this.isEditing = false;
    this.errorMessage = null;
    this.successMessage = null;
  }

  irAlCatalogo(): void {
    this.router.navigate(['/']);
  }
}