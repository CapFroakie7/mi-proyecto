export class Producto {
    constructor(
      public id: number,
      public nombre: string,
      public precio: number,
      public imagen: string,
      public cantidad: number // Added field
    ) {}
  }