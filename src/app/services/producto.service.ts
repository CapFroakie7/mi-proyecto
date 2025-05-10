import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay, tap } from 'rxjs/operators';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private productos: Producto[] = [];
  private apiUrl = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) {
    this.cargarProductosIniciales();
  }

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
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      delay(1000),
      map((data: any[]) => {
        return data.map((prod: any) => {
          return new Producto(
            prod.id,
            prod.nombre,
            prod.precio,
            prod.imagen_url,
            prod.stock,
            prod.descripcion,
            prod.categoria || 'Sin categoría'
          );
        });
      }),
      tap(productos => {
        this.productos = productos;
      }),
      catchError((err) => {
        console.error('Error fetching products:', err);
        return of([]);
      })
    );
  }

  agregarProducto(producto: Producto): Observable<Producto> {
    if (!producto.nombre || producto.precio <= 0 || producto.cantidad < 0 || !producto.categoria) {
      return throwError(() => new Error('Datos inválidos: nombre, precio, cantidad y categoría son obligatorios.'));
    }

    const productoParaEnviar = {
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.cantidad,
      imagen_url: producto.imagen || '',
      categoria: producto.categoria
    };

    return this.http.post<Producto>(this.apiUrl, productoParaEnviar).pipe(
      tap((response: any) => {
        producto.id = response.id;
        this.productos.push(producto);
      }),
      catchError((err) => {
        console.error('Error al agregar producto:', err);
        throw err;
      })
    );
  }

  actualizarProducto(updatedProducto: Producto): Observable<Producto> {
    if (!updatedProducto.id || updatedProducto.id <= 0) {
      return throwError(() => new Error('ID inválido para actualizar el producto.'));
    }
    if (!updatedProducto.nombre || updatedProducto.precio <= 0 || updatedProducto.cantidad < 0 || !updatedProducto.categoria) {
      return throwError(() => new Error('Datos inválidos: nombre, precio, cantidad y categoría son obligatorios.'));
    }

    const productoParaEnviar = {
      nombre: updatedProducto.nombre,
      descripcion: updatedProducto.descripcion || '',
      precio: updatedProducto.precio,
      stock: updatedProducto.cantidad,
      imagen_url: updatedProducto.imagen || '',
      categoria: updatedProducto.categoria
    };

    return this.http.put<Producto>(`${this.apiUrl}/${updatedProducto.id}`, productoParaEnviar).pipe(
      tap(() => {
        const index = this.productos.findIndex(p => p.id === updatedProducto.id);
        if (index !== -1) {
          this.productos[index] = updatedProducto;
        }
      }),
      catchError((err) => {
        console.error('Error al actualizar producto:', err);
        throw err;
      })
    );
  }

  eliminarProducto(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('ID inválido para eliminar el producto.'));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.productos = this.productos.filter(p => p.id !== id);
      }),
      catchError((err) => {
        console.error('Error al eliminar producto:', err);
        throw err;
      })
    );
  }

  disminuirCantidadEnCompra(id: number, amount: number): Observable<void> {
    const producto = this.productos.find(p => p.id === id);
    if (!producto) {
      return throwError(() => new Error('Producto no encontrado.'));
    }
    if (producto.cantidad < amount) {
      return throwError(() => new Error('No hay suficiente stock disponible.'));
    }

    producto.cantidad -= amount;
    return this.actualizarProducto(producto).pipe(
      map(() => void 0),
      catchError((err) => {
        console.error('Error al disminuir cantidad en compra:', err);
        throw err;
      })
    );
  }

  aumentarCantidad(id: number, amount: number): void {
    const producto = this.productos.find(p => p.id === id);
    if (producto) {
      producto.cantidad += amount;
      this.actualizarProducto(producto).subscribe({
        next: () => console.log('Cantidad aumentada y producto actualizado en la base de datos'),
        error: (err) => console.error('Error al aumentar cantidad:', err)
      });
    }
  }

  // Keep disminuirCantidad for other uses if needed, but it's not used in cart operations anymore
  disminuirCantidad(id: number): void {
    const producto = this.productos.find(p => p.id === id);
    if (producto && producto.cantidad > 0) {
      producto.cantidad -= 1;
      this.actualizarProducto(producto).subscribe({
        next: () => console.log('Cantidad disminuida y producto actualizado en la base de datos'),
        error: (err) => console.error('Error al disminuir cantidad:', err)
      });
    }
  }
}