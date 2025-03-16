import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Producto } from '../models/producto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private productos: Producto[] = [];

  constructor(private http: HttpClient) {
    this.cargarProductosDesdeXml();
  }

  getProductos(): Producto[] {
    return this.productos;
  }

  agregarProducto(producto: Producto): void {
    producto.id = this.productos.length + 1;
    this.productos.push(producto);
  }

  actualizarProducto(producto: Producto): void {
    const index = this.productos.findIndex(p => p.id === producto.id);
    if (index !== -1) {
      this.productos[index] = producto;
    }
  }

  eliminarProducto(id: number): void {
    this.productos = this.productos.filter(p => p.id !== id);
  }

  private cargarProductosDesdeXml(): void {
    this.http.get('assets/productos.xml', { responseType: 'text' })
      .pipe(
        map(xml => this.parseXml(xml))
      )
      .subscribe(productos => {
        this.productos = productos;
      });
  }

  private parseXml(xmlStr: string): Producto[] {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, 'text/xml');
    const productosXml = xml.getElementsByTagName('producto');
    const productos: Producto[] = [];

    for (let i = 0; i < productosXml.length; i++) {
      const productoXml = productosXml[i];

      const getElementText = (tagName: string): string => {
        const elements = productoXml.getElementsByTagName(tagName);
        return elements.length > 0 ? elements[0].textContent || '' : '';
      };

      const id = Number(getElementText('id'));
      const nombre = getElementText('nombre');
      const precio = Number(getElementText('precio'));
      const imagen = getElementText('imagen');
      const cantidad = Number(getElementText('cantidad'));

      const producto = new Producto(id, nombre, precio, imagen, cantidad);
      productos.push(producto);
    }
    return productos;
  }

  actualizarXml(): Observable<any> {
    const xmlStr = this.generarXml();
    return this.http.post('assets/update-productos.php', { xml: xmlStr });
  }

  private generarXml(): string {
    let xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n<productos>\n';
    this.productos.forEach(producto => {
      xmlStr += `  <producto>\n`;
      xmlStr += `    <id>${producto.id}</id>\n`;
      xmlStr += `    <nombre>${producto.nombre}</nombre>\n`;
      xmlStr += `    <precio>${producto.precio}</precio>\n`;
      xmlStr += `    <imagen>${producto.imagen}</imagen>\n`;
      xmlStr += `    <cantidad>${producto.cantidad}</cantidad>\n`;
      xmlStr += `  </producto>\n`;
    });
    xmlStr += '</productos>';
    return xmlStr;
  }
}