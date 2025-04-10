import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private productos: Producto[] = [];
  private apiUrl = 'http://localhost:3000/api/productos'; // URL del backend

  constructor(private http: HttpClient) {
    this.cargarProductosDesdeApi();
  }

  // Obtener productos (devuelve un Observable y recarga desde la API)
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      map((data: any[]) => {
        return data.map((prod: any) => {
          return new Producto(
            prod.id,
            prod.nombre,
            prod.precio,
            prod.imagen_url, // Mapeamos imagen_url a imagen
            prod.stock, // Mapeamos stock a cantidad
          );
        });
      }),
      tap(productos => {
        this.productos = productos; // Actualizamos la lista local
      }),
      catchError((err) => {
        console.error('Error al cargar productos:', err);
        return of([]);
      })
    );
  }

  // Agregar un producto (devuelve un Observable)
  agregarProducto(producto: Producto): Observable<Producto> {
    const productoParaEnviar = {
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.cantidad, // Mapeamos cantidad a stock
      imagen_url: producto.imagen // Mapeamos imagen a imagen_url
    };

    return this.http.post<Producto>(this.apiUrl, productoParaEnviar).pipe(
      tap((response: any) => {
        // Actualizamos el ID del producto con el que devuelve el backend
        producto.id = response.id;
        this.productos.push(producto); // Agregamos a la lista local
      }),
      catchError((err) => {
        console.error('Error al agregar producto:', err);
        throw err; // Propagamos el error para que el componente lo maneje
      })
    );
  }

  // Actualizar un producto (devuelve un Observable)
  actualizarProducto(producto: Producto): Observable<Producto> {
    const productoParaEnviar = {
      nombre: producto.nombre, 
      precio: producto.precio,
      stock: producto.cantidad, // Mapeamos cantidad a stock
      imagen_url: producto.imagen // Mapeamos imagen a imagen_url
    };

    return this.http.put<Producto>(`${this.apiUrl}/${producto.id}`, productoParaEnviar).pipe(
      tap(() => {
        // Actualizamos el producto en la lista local
        const index = this.productos.findIndex(p => p.id === producto.id);
        if (index !== -1) {
          this.productos[index] = producto;
        }
      }),
      catchError((err) => {
        console.error('Error al actualizar producto:', err);
        throw err; // Propagamos el error para que el componente lo maneje
      })
    );
  }

  // Eliminar un producto (devuelve un Observable)
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Eliminamos el producto de la lista local
        this.productos = this.productos.filter(p => p.id !== id);
      }),
      catchError((err) => {
        console.error('Error al eliminar producto:', err);
        throw err; // Propagamos el error para que el componente lo maneje
      })
    );
  }

  // Cargar productos desde la API (mantenemos este método para la carga inicial)
  private cargarProductosDesdeApi(): void {
    this.getProductos().subscribe();
  }
}