// Clase para manejar la lógica de cotización
export class Cotizacion {
  constructor(config = {}) {
    // Configuración inicial
    this.ivaPorcentaje = config.ivaDefault || 16;
    this.descuento = config.descuentoDefault || 0;
    this.anticipo = config.anticipoDefault || 0;
    this.fechaAnticipo = config.fechaAnticipoDefault || '';
    this.formaPago = config.formaPagoDefault || 'Efectivo';
    this.notasPago = config.notasPagoDefault || '';
    
    // Inicializar materiales y totales
    this.materiales = [];
    this.subtotal = 0;
    this.iva = 0;
    this.total = 0;
    this.pendiente = 0;
  
  // Actualizar la configuración (IVA y descuento)
  actualizarConfiguracion(config) {
    this.ivaPorcentaje = config.ivaPorcentaje !== undefined ? config.ivaPorcentaje : this.ivaPorcentaje;
    this.descuento = config.descuento !== undefined ? config.descuento : this.descuento;
    this.anticipo = config.anticipo !== undefined ? config.anticipo : this.anticipo;
    this.fechaAnticipo = config.fechaAnticipo !== undefined ? config.fechaAnticipo : this.fechaAnticipo;
    this.formaPago = config.formaPago !== undefined ? config.formaPago : this.formaPago;
    this.notasPago = config.notasPago !== undefined ? config.notasPago : this.notasPago;
    
    // Recalcular los totales
    this.calcularTotales();
  }
  
  // Actualizar la lista de materiales
  actualizarMateriales(materiales) {
    this.materiales = materiales;
    
    // Recalcular los totales
    this.calcularTotales();
  }
  
  // Calcular subtotal, IVA y total
  calcularTotales() {
    // Calcular el subtotal
    this.subtotal = this.materiales.reduce((sum, material) => sum + material.total, 0);
    
    // Aplicar el descuento (no puede ser mayor que el subtotal)
    const descuentoEfectivo = Math.min(this.descuento, this.subtotal);
    
    // Base imponible después de descuento
    const baseImponible = this.subtotal - descuentoEfectivo;
    
    // Calcular IVA
    this.iva = baseImponible * (this.ivaPorcentaje / 100);
    
    // Calcular total
    this.total = baseImponible + this.iva;
    
    // Calcular pendiente después de aplicar anticipo
    this.pendiente = Math.max(0, this.total - this.anticipo);
  }
  
  // Agregar un nuevo material
  agregarMaterial(material) {
    this.materiales.push(material);
    this.calcularTotales();
  }
  
  // Eliminar un material por índice
  eliminarMaterial(index) {
    if (index >= 0 && index < this.materiales.length) {
      this.materiales.splice(index, 1);
      this.calcularTotales();
    }
  }
  
  // Actualizar un material existente
  actualizarMaterial(index, material) {
    if (index >= 0 && index < this.materiales.length) {
      this.materiales[index] = material;
      this.calcularTotales();
    }
  }
  
  // Obtener datos completos de la cotización
  obtenerDatos() {
    return {
      materiales: this.materiales,
      subtotal: this.subtotal,
      descuento: this.descuento,
      ivaPorcentaje: this.ivaPorcentaje,
      iva: this.iva,
      total: this.total
    };
  }

  // Convertir a formato para almacenamiento
  toJSON() {
    return {
      materiales: this.materiales,
      subtotal: this.subtotal,
      descuento: this.descuento,
      ivaPorcentaje: this.ivaPorcentaje,
      iva: this.iva,
      total: this.total,
      anticipo: this.anticipo,
      fechaAnticipo: this.fechaAnticipo,
      formaPago: this.formaPago,
      notasPago: this.notasPago,
      pendiente: this.pendiente
    };
  }
  
  // Cargar desde formato almacenado
  cargarDesdeJSON(json) {
    this.materiales = json.materiales || [];
    this.ivaPorcentaje = json.ivaPorcentaje || 16;
    this.descuento = json.descuento || 0;
    this.anticipo = json.anticipo || 0;
    this.fechaAnticipo = json.fechaAnticipo || '';
    this.formaPago = json.formaPago || 'Efectivo';
    this.notasPago = json.notasPago || '';
    
    // Recalcular los totales
    this.calcularTotales();
  }
}