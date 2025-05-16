/**
 * Clase que maneja la lógica de cotizaciones
 */
export class Cotizacion {
    /**
     * @param {Object} config - Configuración inicial
     * @param {number} config.ivaDefault - Porcentaje de IVA por defecto
     * @param {number} config.descuentoDefault - Monto de descuento por defecto
     * @param {number} config.anticipoDefault - Monto de anticipo por defecto
     */
    constructor(config) {
        this.materiales = [];
        this.ivaPorcentaje = config.ivaDefault;
        this.descuento = config.descuentoDefault;
        this.anticipo = config.anticipoDefault;
        this.subtotal = 0;
        this.iva = 0;
        this.total = 0;
        
        // Historial de cambios para función de deshacer
        this.historialCambios = [];
        this.indiceHistorial = -1;
    }

    /**
     * Actualiza los datos de la cotización
     * @param {Object} datos - Nuevos datos de la cotización
     */
    actualizarDatos({ materiales, ivaPorcentaje, descuento, anticipo }) {
        // Guardar estado actual en el historial
        this.guardarEnHistorial();

        // Actualizar datos
        this.materiales = materiales || this.materiales;
        this.ivaPorcentaje = ivaPorcentaje ?? this.ivaPorcentaje;
        this.descuento = descuento ?? this.descuento;
        this.anticipo = anticipo ?? this.anticipo;

        // Recalcular totales
        this.calcularTotales();
    }

    /**
     * Calcula todos los totales de la cotización
     * @returns {Object} Objeto con los totales calculados
     */
    calcularTotales() {
        // Calcular subtotal
        this.subtotal = this.materiales.reduce((sum, item) => {
            const cantidad = parseFloat(item.cantidad) || 0;
            const precio = parseFloat(item.precio) || 0;
            return sum + (cantidad * precio);
        }, 0);

        // Aplicar descuento
        const baseIva = this.subtotal - this.descuento;

        // Calcular IVA
        this.iva = baseIva * (this.ivaPorcentaje / 100);

        // Calcular total
        this.total = baseIva + this.iva;

        return this.obtenerTotales();
    }

    /**
     * Obtiene los totales actuales
     * @returns {Object} Objeto con todos los totales
     */
    obtenerTotales() {
        return {
            subtotal: this.subtotal,
            descuento: this.descuento,
            iva: this.iva,
            total: this.total,
            anticipo: this.anticipo,
            pendiente: this.total - this.anticipo
        };
    }

    /**
     * Actualiza la lista de materiales
     * @param {Array} materiales - Nueva lista de materiales
     */
    actualizarMateriales(materiales) {
        this.guardarEnHistorial();
        this.materiales = materiales;
        return this.calcularTotales();
    }

    /**
     * Agrega un nuevo material a la cotización
     * @param {Object} material - Material a agregar
     */
    agregarMaterial(material) {
        this.guardarEnHistorial();
        this.materiales.push(material);
        return this.calcularTotales();
    }

    /**
     * Elimina un material de la cotización
     * @param {number} index - Índice del material a eliminar
     */
    eliminarMaterial(index) {
        if (index >= 0 && index < this.materiales.length) {
            this.guardarEnHistorial();
            this.materiales.splice(index, 1);
            return this.calcularTotales();
        }
        return this.obtenerTotales();
    }

    /**
     * Actualiza la configuración de la cotización
     * @param {Object} config - Nueva configuración
     */
    actualizarConfiguracion({ ivaPorcentaje, descuento }) {
        this.guardarEnHistorial();
        if (typeof ivaPorcentaje !== 'undefined') {
            this.ivaPorcentaje = parseFloat(ivaPorcentaje);
        }
        if (typeof descuento !== 'undefined') {
            this.descuento = parseFloat(descuento);
        }
        return this.calcularTotales();
    }

    /**
     * Guarda el estado actual en el historial
     */
    guardarEnHistorial() {
        // Eliminar estados futuros si estamos en medio del historial
        if (this.indiceHistorial < this.historialCambios.length - 1) {
            this.historialCambios = this.historialCambios.slice(0, this.indiceHistorial + 1);
        }

        // Guardar estado actual
        const estadoActual = {
            materiales: JSON.parse(JSON.stringify(this.materiales)),
            ivaPorcentaje: this.ivaPorcentaje,
            descuento: this.descuento,
            anticipo: this.anticipo,
            subtotal: this.subtotal,
            iva: this.iva,
            total: this.total
        };

        this.historialCambios.push(estadoActual);
        this.indiceHistorial = this.historialCambios.length - 1;

        // Mantener un máximo de 50 estados en el historial
        if (this.historialCambios.length > 50) {
            this.historialCambios.shift();
            this.indiceHistorial--;
        }
    }

    /**
     * Deshace el último cambio
     * @returns {boolean} Verdadero si se pudo deshacer
     */
    deshacer() {
        if (this.indiceHistorial > 0) {
            this.indiceHistorial--;
            const estadoAnterior = this.historialCambios[this.indiceHistorial];
            this.restaurarEstado(estadoAnterior);
            return true;
        }
        return false;
    }

    /**
     * Rehace el último cambio deshecho
     * @returns {boolean} Verdadero si se pudo rehacer
     */
    rehacer() {
        if (this.indiceHistorial < this.historialCambios.length - 1) {
            this.indiceHistorial++;
            const estadoSiguiente = this.historialCambios[this.indiceHistorial];
            this.restaurarEstado(estadoSiguiente);
            return true;
        }
        return false;
    }

    /**
     * Restaura un estado guardado
     * @param {Object} estado - Estado a restaurar
     */
    restaurarEstado(estado) {
        this.materiales = JSON.parse(JSON.stringify(estado.materiales));
        this.ivaPorcentaje = estado.ivaPorcentaje;
        this.descuento = estado.descuento;
        this.anticipo = estado.anticipo;
        this.subtotal = estado.subtotal;
        this.iva = estado.iva;
        this.total = estado.total;
    }

    /**
     * Valida los datos de la cotización
     * @returns {Object} Objeto con el resultado de la validación
     */
    validar() {
        const errores = [];

        // Validar que haya al menos un material
        if (this.materiales.length === 0) {
            errores.push('Debe agregar al menos un material o servicio');
        }

        // Validar cada material
        this.materiales.forEach((material, index) => {
            if (!material.nombre || material.nombre.trim() === '') {
                errores.push(`El material #${index + 1} debe tener un nombre`);
            }
            if (material.cantidad <= 0) {
                errores.push(`La cantidad del material "${material.nombre || '#' + (index + 1)}" debe ser mayor a 0`);
            }
            if (material.precio < 0) {
                errores.push(`El precio del material "${material.nombre || '#' + (index + 1)}" no puede ser negativo`);
            }
        });

        // Validar IVA
        if (this.ivaPorcentaje < 0 || this.ivaPorcentaje > 100) {
            errores.push('El porcentaje de IVA debe estar entre 0 y 100');
        }

        // Validar descuento
        if (this.descuento < 0) {
            errores.push('El descuento no puede ser negativo');
        }
        if (this.descuento > this.subtotal) {
            errores.push('El descuento no puede ser mayor al subtotal');
        }

        // Validar anticipo
        if (this.anticipo < 0) {
            errores.push('El anticipo no puede ser negativo');
        }
        if (this.anticipo > this.total) {
            errores.push('El anticipo no puede ser mayor al total');
        }

        return {
            esValido: errores.length === 0,
            errores
        };
    }

    /**
     * Exporta la cotización a un objeto plano
     * @returns {Object} Datos de la cotización
     */
    exportar() {
        return {
            materiales: this.materiales,
            ivaPorcentaje: this.ivaPorcentaje,
            descuento: this.descuento,
            anticipo: this.anticipo,
            totales: this.obtenerTotales(),
            fecha: new Date().toISOString()
        };
    }

    /**
     * Importa datos de una cotización
     * @param {Object} datos - Datos a importar
     */
    importar(datos) {
        this.guardarEnHistorial();
        this.materiales = datos.materiales || [];
        this.ivaPorcentaje = datos.ivaPorcentaje || 0;
        this.descuento = datos.descuento || 0;
        this.anticipo = datos.anticipo || 0;
        this.calcularTotales();
    }
}