import { Component, OnInit, AfterViewInit, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { ProductoService } from '../../services/producto.service';
import { Router } from '@angular/router';
import { Producto } from '../../models/producto';

declare var paypal: any; // Declare PayPal SDK

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit, AfterViewInit, OnDestroy {
  carrito: Producto[] = [];
  productosInventario: Producto[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  mostrarModalExito: boolean = false;
  transactionId: string = '';
  compraExitosa: Producto[] = [];
  private isPayPalButtonRendered: boolean = false;

  constructor(
    private carritoService: CarritoService,
    private productoService: ProductoService,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.carrito = this.carritoService.obtenerCarrito();
    this.cargarInventario();
    this.loadPayPalScript();
  }

  ngAfterViewInit(): void {
    if (!this.isPayPalButtonRendered && typeof paypal !== 'undefined') {
      this.renderPayPalButton();
    }
  }

  ngOnDestroy(): void {
    // Limpiar el script de PayPal para evitar problemas al recargar el componente
    const script = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
    if (script) {
      this.renderer.removeChild(document.body, script);
    }
  }

  cargarInventario(): void {
    this.productoService.obtenerProducto().subscribe({
      next: (productos) => {
        this.productosInventario = productos;
      },
      error: (err) => {
        console.error('Error cargando inventario:', err);
        this.productosInventario = [];
        this.errorMessage = 'Error al cargar el inventario. Intenta de nuevo.';
      }
    });
  }

  private loadPayPalScript(): void {
    // Evitar cargar el script si ya existe
    if (document.querySelector(`script[src*="paypal.com/sdk/js"]`)) {
      if (typeof paypal !== 'undefined' && !this.isPayPalButtonRendered) {
        this.renderPayPalButton();
      }
      return;
    }

    const script = this.renderer.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=AU4LfGMYtluPGQkrvgjQsRiPKugLsUl2Ah7b_RyLpy7DpJsDUbm3JXO7IA3GEvlsRrD33iMmFkzOsCNH&currency=MXN`;
    script.onload = () => {
      console.log('PayPal SDK cargado');
      if (!this.isPayPalButtonRendered) {
        this.renderPayPalButton();
      }
    };
    script.onerror = () => {
      this.errorMessage = 'Error al cargar el SDK de PayPal. Intenta de nuevo más tarde.';
      console.error('Error al cargar el SDK de PayPal');
    };
    this.renderer.appendChild(document.body, script);
  }

  private renderPayPalButton(): void {
    if (this.carrito.length === 0 || !paypal || this.isPayPalButtonRendered) {
      console.warn('No se renderiza el botón de PayPal: carrito vacío, paypal no definido o ya renderizado');
      return;
    }

    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
    }

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: (data: any, actions: any) => {
        const updates: { id: number, cantidad: number }[] = [];
        for (const item of this.carrito) {
          const inventarioProducto = this.productosInventario.find(p => p.id === item.id);
          if (!inventarioProducto || inventarioProducto.cantidad < item.cantidad) {
            this.errorMessage = `No hay suficiente stock para ${item.nombre}. Disponible: ${inventarioProducto?.cantidad || 0}`;
            return Promise.reject(new Error('Stock insuficiente'));
          }
          updates.push({ id: item.id, cantidad: item.cantidad });
        }
      
        let itemTotal = 0;
        const items = this.carrito.map(item => {
          const precio = Number(item.precio);
          if (isNaN(precio) || precio <= 0) {
            this.errorMessage = `El precio de ${item.nombre} no es válido.`;
            throw new Error('Precio inválido');
          }
          const subtotal = precio * item.cantidad;
          itemTotal += subtotal;
          return {
            name: item.nombre,
            unit_amount: { currency_code: 'MXN', value: precio.toFixed(2) },
            quantity: item.cantidad.toString()
          };
        });
      
        const iva = itemTotal * 0.16;
        const total = itemTotal + iva;
      
        return actions.order.create({
          purchase_units: [{
            amount: {
              currency_code: 'MXN',
              value: total.toFixed(2),
              breakdown: {
                item_total: { currency_code: 'MXN', value: itemTotal.toFixed(2) },
                tax_total: { currency_code: 'MXN', value: iva.toFixed(2) }
              }
            },
            items: items
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        this.isLoading = true;
        this.errorMessage = null;
        try {
          this.compraExitosa = [...this.carrito];
          const order = await actions.order.capture();
      
          const updates: { id: number, cantidad: number }[] = [];
          for (const item of this.carrito) {
            const inventarioProducto = this.productosInventario.find(p => p.id === item.id);
            if (!inventarioProducto || inventarioProducto.cantidad < item.cantidad) {
              this.errorMessage = `No hay suficiente stock para ${item.nombre}. Disponible: ${inventarioProducto?.cantidad || 0}`;
              this.isLoading = false;
              return;
            }
            updates.push({ id: item.id, cantidad: item.cantidad });
          }
      
          for (const update of updates) {
            await this.productoService.disminuirCantidadEnCompra(update.id, update.cantidad).toPromise();
          }
      
          this.carritoService.limpiarCarrito();
          this.carrito = this.carritoService.obtenerCarrito();
          this.cargarInventario();
      
          this.transactionId = order.id;
          this.mostrarModalExito = true;
        } catch (err) {
          console.error('Error al procesar el pago:', err);
          this.errorMessage = 'Error al procesar el pago. Intenta de nuevo.';
        } finally {
          this.isLoading = false;
        }
      },
      onError: (err: any) => {
        console.error('Error en el flujo de PayPal:', err);
        this.errorMessage = 'Error en el proceso de pago. Intenta de nuevo.';
        this.isLoading = false;
      },
      onCancel: () => {
        this.errorMessage = 'Pago cancelado por el usuario.';
        this.isLoading = false;
      }
    }).render('#paypal-button-container').then(() => {
      this.isPayPalButtonRendered = true;
    }).catch((err: any) => {
      console.error('Error al renderizar el botón de PayPal:', err);
      this.errorMessage = 'Error al cargar el botón de PayPal. Intenta de nuevo.';
    });
  }

  calcularSubtotal(): number {
    let subtotal = 0;
    this.carrito.forEach((producto) => {
      const precio = Number(producto.precio) || 0;
      subtotal += precio * producto.cantidad;
    });
    return subtotal;
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.transactionId = '';
    if (this.compraExitosa.length > 0) {
      this.carritoService.descargaXML(this.compraExitosa);
    } else {
      this.errorMessage = 'No hay datos de compra para generar el XML.';
    }
    this.compraExitosa = [];
  }

  aumentarCantidad(index: number): void {
    const producto = this.carrito[index];
    const inventarioProducto = this.productosInventario.find(p => p.id === producto.id);
    if (inventarioProducto && inventarioProducto.cantidad > producto.cantidad) {
      producto.cantidad += 1;
      this.carritoService.actualizarCarrito(this.carrito);
      console.log('Cantidad aumentada en carrito:', this.carrito);
    } else {
      this.errorMessage = `No hay suficiente stock para ${producto.nombre}. Disponible: ${inventarioProducto?.cantidad || 0}`;
    }
  }

  disminuirCantidad(index: number): void {
    const producto = this.carrito[index];
    if (producto.cantidad > 1) {
      producto.cantidad -= 1;
      this.carritoService.actualizarCarrito(this.carrito);
      console.log('Cantidad disminuida en carrito:', this.carrito);
    }
  }

  eliminarProducto(id: number): void {
    this.carritoService.eliminarProducto(id);
    this.carrito = this.carritoService.obtenerCarrito();
    this.errorMessage = null;
  }

  isProductInStock(id: number): boolean {
    const producto = this.productosInventario.find(p => p.id === id);
    return producto ? producto.cantidad > 0 : false;
  }

  irAlCatalogo(): void {
    this.router.navigate(['/']);
  }
}