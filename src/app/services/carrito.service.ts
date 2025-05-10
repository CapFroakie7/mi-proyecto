import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: Producto[] = [];

  constructor() {
    // Cargar el carrito desde localStorage al iniciar
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

  // Method to clear the cart after purchase
  limpiarCarrito(): void {
    this.carrito = [];
    this.guardarCarrito();
  }

  descargaXML(): void {
    // Calcular subtotal, IVA y total
    let subtotal = 0;
    this.carrito.forEach((producto) => {
      subtotal += (producto.precio * producto.cantidad) || 0;
    });
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    // Generar el XML en el formato CFDI 4.0
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<ຈ:Comprobante Version="4.0" xmlns:ຈ="http://www.sat.gob.mx/cfd/4" `;
    xml += `xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" `;
    xml += `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" `;
    xml += `xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/cfd/4/cfdv40.xsd" `;
    xml += `Serie="A" Folio="12345" Fecha="${new Date().toISOString()}" FormaPago="01" Moneda="MXN" `;
    xml += `SubTotal="${subtotal.toFixed(2)}" Descuento="0.00" Total="${total.toFixed(2)}" `;
    xml += `TipoDeComprobante="I" MetodoPago="PUE" LugarExpedicion="99999">\n`;

    xml += `  <cfdi:Emisor Rfc="EMIS123456789" Nombre="Emisor SA de CV" RegimenFiscal="601"/>\n`;
    xml += `  <cfdi:Receptor Rfc="RECEP987654321" Nombre="Receptor SA de CV" UsoCFDI="G03"/>\n`;
    xml += `  <cfdi:Conceptos>\n`;
    this.carrito.forEach((producto) => {
      xml += `    <cfdi:Concepto ClaveProdServ="10101504" Cantidad="${producto.cantidad}" ClaveUnidad="H87" `;
      xml += `Descripcion="${producto.nombre || 'Producto sin nombre'}" `;
      xml += `ValorUnitario="${(producto.precio || 0).toFixed(2)}" Importe="${(producto.precio * producto.cantidad).toFixed(2)}"/>\n`;
    });
    xml += `  </cfdi:Conceptos>\n`;
    xml += `  <cfdi:Impuestos TotalImpuestosRetenidos="0.00" TotalImpuestosTrasladados="${iva.toFixed(2)}">\n`;
    xml += `    <cfdi:Traslados>\n`;
    xml += `      <cfdi:Traslado Importe="${iva.toFixed(2)}" TipoImpuesto="IVA" TasaImpuesto="16.00">\n`;
    xml += `        <cfdi:BaseImpuesto>${subtotal.toFixed(2)}</cfdi:BaseImpuesto>\n`;
    xml += `      </cfdi:Traslado>\n`;
    xml += `    </cfdi:Traslados>\n`;
    xml += `  </cfdi:Impuestos>\n`;
    xml += `  <cfdi:TimbreFiscalDigital Version="1.1" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital">\n`;
    xml += `    <tfd:UUID>7E6492B9-43B7-418B-90C1-B174F2743242</tfd:UUID>\n`;
    xml += `    <tfd:FechaTimbrado>${new Date().toISOString()}</tfd:FechaTimbrado>\n`;
    xml += `  </cfdi:TimbreFiscalDigital>\n`;
    xml += `</cfdi:Comprobante>`;

    // Descargar el archivo XML
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carrito_cfdi.xml';
    a.click();
    URL.revokeObjectURL(url);
  }

  private guardarCarrito(): void {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
  }
}