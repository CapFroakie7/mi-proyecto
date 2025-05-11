import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: Producto[] = [];

  constructor() {
    const storedCarrito = localStorage.getItem('carrito');
    if (storedCarrito) {
      this.carrito = JSON.parse(storedCarrito);
    }
  }

  agregarProducto(producto: Producto): void {
    const productoExistente = this.carrito.find(p => p.id === producto.id);
    if (productoExistente) {
      productoExistente.cantidad += 1;
    } else {
      this.carrito.push({ ...producto, cantidad: 1 });
    }
    this.guardarCarrito();
    console.log('Carrito actual:', this.carrito);
  }

  obtenerCarrito(): Producto[] {
    return this.carrito;
  }

  eliminarProducto(id: number): void {
    this.carrito = this.carrito.filter(p => p.id !== id);
    this.guardarCarrito();
  }

  actualizarCarrito(carrito: Producto[]): void {
    this.carrito = carrito;
    this.guardarCarrito();
  }

  limpiarCarrito(): void {
    this.carrito = [];
    this.guardarCarrito();
  }

  descargaXML(productos: Producto[]): void {
    console.log('Iniciando descarga XML con productos:', productos);
    if (!productos || productos.length === 0) {
      console.error('No hay productos para generar el XML');
      return;
    }

    let subtotal = 0;
    productos.forEach((producto) => {
      const precio = Number(producto.precio) || 0;
      subtotal += precio * producto.cantidad;
    });
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<cfdi:Comprobante Version="4.0" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" `;
    xml += `xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" `;
    xml += `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" `;
    xml += `xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/cfd/4/cfdv40.xsd" `;
    xml += `Serie="A" Folio="12345" Fecha="${new Date().toISOString()}" FormaPago="01" Moneda="MXN" `;
    xml += `SubTotal="${subtotal.toFixed(2)}" Descuento="0.00" Total="${total.toFixed(2)}" `;
    xml += `TipoDeComprobante="I" MetodoPago="PUE" LugarExpedicion="99999">\n`;

    xml += `  <cfdi:Emisor Rfc="EMIS123456789" Nombre="Emisor SA de CV" RegimenFiscal="601"/>\n`;
    xml += `  <cfdi:Receptor Rfc="RECEP987654321" Nombre="Receptor SA de CV" UsoCFDI="G03"/>\n`;
    xml += `  <cfdi:Conceptos>\n`;
    productos.forEach((producto) => {
      const precio = Number(producto.precio) || 0;
      xml += `    <cfdi:Concepto ClaveProdServ="10101504" Cantidad="${producto.cantidad}" ClaveUnidad="H87" `;
      xml += `Descripcion="${producto.nombre || 'Producto sin nombre'}" `;
      xml += `ValorUnitario="${precio.toFixed(2)}" Importe="${(precio * producto.cantidad).toFixed(2)}"/>\n`;
    });
    xml += `  </cfdi:Conceptos>\n`;
    xml += `  <cfdi:Impuestos TotalImpuestosRetenidos="0.00" TotalImpuestosTrasladados="${iva.toFixed(2)}">\n`;
    xml += `    <cfdi:Traslados>\n`;
    xml += `      <cfdi:Traslado Base="${subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}"/>\n`;
    xml += `    </cfdi:Traslados>\n`;
    xml += `  </cfdi:Impuestos>\n`;
    xml += `  <cfdi:Complemento>\n`;
    xml += `    <tfd:TimbreFiscalDigital Version="1.1" UUID="7E6492B9-43B7-418B-90C1-B174F2743242" `;
    xml += `FechaTimbrado="${new Date().toISOString()}" SelloCFD="..." SelloSAT="..." NoCertificadoSAT="12345678901234567890"/>\n`;
    xml += `  </cfdi:Complemento>\n`;
    xml += `</cfdi:Comprobante>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carrito_cfdi.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private guardarCarrito(): void {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
    console.log('Carrito guardado en localStorage:', this.carrito);
  }
}