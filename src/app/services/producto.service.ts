import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private productos: Producto[] = [];
  private apiUrl = 'http://localhost:3000/productos';

  constructor(private http: HttpClient) {
    // Cargar productos al iniciar el servicio
    this.cargarProductosIniciales();
  }

  // Cargar productos desde el backend al iniciar
  private cargarProductosIniciales(): void {
    this.obtenerProducto().subscribe({
      next: (productos) => {
        this.productos = productos;
      },
      error: (err) => {
        console.error('Error al cargar productos iniciales:', err);
        this.productos = [];
      }
    });
  }

  obtenerProducto(): Observable<Producto[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      delay(1000),
      map((data) => {
        if (data.error) {
          console.error('Error del servidor:', data.error);
          return [];
        }
        return data.productos.producto.map((prod: any) => {
          return new Producto(
            +prod.id[0],
            prod.nombre[0],
            +prod.precio[0],
            prod.imagen[0],
            +prod.cantidad[0]
          );
        });
      }),
      catchError((err) => {
        console.error('Error fetching products:', err);
        return of([]);
      })
    );
  }

  agregarProducto(producto: Producto): void {
    // Agregar el producto a la lista local
    this.productos.push(producto);
    // Persistir la lista completa en el backend
    this.generarProductosXML();
  }

  actualizarProducto(updatedProducto: Producto): void {
    const index = this.productos.findIndex(p => p.id === updatedProducto.id);
    if (index !== -1) {
      this.productos[index] = updatedProducto;
      this.generarProductosXML();
    }
  }

  eliminarProducto(id: number): void {
    this.productos = this.productos.filter(p => p.id !== id);
    this.generarProductosXML();
  }

  generarProductosXML(): void {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<productos>\n`;
    this.productos.forEach(producto => {
      xml += `  <producto>\n`;
      xml += `    <id>${producto.id}</id>\n`;
      xml += `    <nombre>${producto.nombre}</nombre>\n`;
      xml += `    <precio>${producto.precio}</precio>\n`;
      xml += `    <imagen>${producto.imagen}</imagen>\n`;
      xml += `    <cantidad>${producto.cantidad}</cantidad>\n`;
      xml += `  </producto>\n`;
    });
    xml += `</productos>`;

    this.http.post(this.apiUrl, { xmlContent: xml }).subscribe({
      next: () => console.log('Archivo XML actualizado correctamente'),
      error: (err) => console.error('Error al actualizar el archivo XML:', err)
    });
  }

  disminuirCantidad(id: number): void {
    const producto = this.productos.find(p => p.id === id);
    if (producto && producto.cantidad > 0) {
      producto.cantidad -= 1;
      this.generarProductosXML();
    }
  }

  aumentarCantidad(id: number, amount: number): void {
    const producto = this.productos.find(p => p.id === id);
    if (producto) {
      producto.cantidad += amount;
      this.generarProductosXML();
    }
  }
}