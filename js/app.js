  // Inicializar todos los listeners de eventos
  initEventListeners() {
    // Botón de configuración
    this.elements.btnConfig.addEventListener('click', () => {
      this.toggleConfigPanel();
    });
    
    // Guardar configuración
    this.elements.btnGuardarConfig.addEventListener('click', () => {
      this.guardarConfiguracion();
    });
    
    // Selector de clientes
    this.elements.clientesSelect.addEventListener('change', () => {
      this.cargarClienteSeleccionado();
    });
    
    // Guardar cliente
    this.elements.btnGuardarCliente.addEventListener('click', () => {
      this.guardarCliente();
    });
    
    // Agregar material
    this.elements.btnAddMaterial// Importamos los módulos necesarios
import { Cotizacion } from './cotizacion.js';
import { Config } from './config.js';
import { Clientes } from './clientes.js';
import { generarPDF } from './pdf.js';

// Clase principal de la aplicación
class App {
  constructor() {
    // Inicializar la configuración
    this.config = new Config();
    
    // Inicializar el gestor de clientes
    this.clientes = new Clientes();
    
    // Inicializar la cotización
    this.cotizacion = new Cotizacion({
      ivaDefault: 16,
      descuentoDefault: 0,
      anticipoDefault: 0
    });
    
    // Elementos del DOM
    this.elements = {
      // Sección de configuración
      configPanel: document.getElementById('config-section'),
      btnConfig: document.getElementById('btn-config'),
      btnGuardarConfig: document.getElementById('btn-guardar-config'),
      configEmpresa: document.getElementById('config-empresa'),
      configDireccion: document.getElementById('config-direccion'),
      configTelefono: document.getElementById('config-telefono'),
      configEmail: document.getElementById('config-email'),
      configWeb: document.getElementById('config-web'),
      
      // Gestión de clientes
      clientesSelect: document.getElementById('clientes-guardados'),
      btnGuardarCliente: document.getElementById('btn-guardar-cliente'),
      
      // Datos del cliente
      clienteNombre: document.getElementById('cliente-nombre'),
      clienteDireccion: document.getElementById('cliente-direccion'),
      clienteTelefono: document.getElementById('cliente-telefono'),
      clienteEmail: document.getElementById('cliente-email'),
      
      // Datos de cotización
      cotizacionFolio: document.getElementById('cotizacion-folio'),
      cotizacionIva: document.getElementById('cotizacion-iva'),
      cotizacionDescuento: document.getElementById('cotizacion-descuento'),
      
      // Datos de pagos
      pagoAnticipo: document.getElementById('pago-anticipo'),
      fechaAnticipo: document.getElementById('fecha-anticipo'),
      formaPago: document.getElementById('forma-pago'),
      notasPago: document.getElementById('notas-pago'),
      
      // Materiales
      listaMateriales: document.getElementById('lista-materiales'),
      btnAddMaterial: document.getElementById('btn-add-material'),
      templateMaterial: document.getElementById('template-material'),
      
      // Totales
      subtotal: document.getElementById('subtotal'),
      descuento: document.getElementById('descuento'),
      iva: document.getElementById('iva'),
      total: document.getElementById('total'),
      ivaPorcentaje: document.getElementById('iva-porcentaje'),
      anticipoDisplay: document.getElementById('anticipo-display'),
      pendiente: document.getElementById('pendiente'),
      
      // PDF
      btnGenerarPDF: document.getElementById('btn-generar-pdf')
    };
    
    // Cargar configuración guardada
    this.cargarConfiguracion();
    
    // Cargar la lista de clientes
    this.cargarListaClientes();
    
    // Iniciar listeners de eventos
    this.initEventListeners();
    
    // Agregar un primer material por defecto
    this.agregarMaterial();
    
    // Actualizar los totales iniciales
    this.actualizarTotales();
  }
  
  // Inicializar todos los listeners de eventos
  initEventListeners() {
    // Botón de configuración
    this.elements.btnConfig.addEventListener('click', () => {
      this.toggleConfigPanel();
    });
    
    // Guardar configuración
    this.elements.btnGuardarConfig.addEventListener('click', () => {
      this.guardarConfiguracion();
    });
    
    // Agregar material
    this.elements.btnAddMaterial.addEventListener('click', () => {
      this.agregarMaterial();
    });
    
    // Cambios en IVA y descuento
    this.elements.cotizacionIva.addEventListener('input', () => {
      this.actualizarConfiguracionCotizacion();
    });
    
    this.elements.cotizacionDescuento.addEventListener('input', () => {
      this.actualizarConfiguracionCotizacion();
    });
    
    // Generar PDF
    this.elements.btnGenerarPDF.addEventListener('click', () => {
      this.generarPDF();
    });
  }
  
  // Mostrar/ocultar panel de configuración
  toggleConfigPanel() {
    this.elements.configPanel.classList.toggle('hidden');
  }
  
  // Agregar un nuevo material a la lista
  agregarMaterial() {
    // Clonar la plantilla
    const template = this.elements.templateMaterial.content.cloneNode(true);
    const materialItem = template.querySelector('.material-item');
    
    // Obtener referencias a los elementos
    const btnEliminar = materialItem.querySelector('.btn-eliminar');
    const inputNombre = materialItem.querySelector('.material-nombre');
    const inputCantidad = materialItem.querySelector('.material-cantidad');
    const inputPrecio = materialItem.querySelector('.material-precio');
    const spanTotal = materialItem.querySelector('.material-total');
    
    // Configurar eventos
    btnEliminar.addEventListener('click', () => {
      // Solo permitir eliminar si hay más de un material
      if (this.elements.listaMateriales.children.length > 1) {
        materialItem.remove();
        this.actualizarTotales();
      } else {
        alert('Debe haber al menos un concepto en la cotización');
      }
    });
    
    // Actualizar el total del material cuando cambia cantidad o precio
    const actualizarTotalMaterial = () => {
      const cantidad = parseFloat(inputCantidad.value) || 0;
      const precio = parseFloat(inputPrecio.value) || 0;
      const total = cantidad * precio;
      spanTotal.textContent = `$${total.toFixed(2)}`;
      
      // Actualizar los totales generales
      this.actualizarTotales();
    };
    
    inputNombre.addEventListener('input', () => {
      // Si cambiamos el nombre, también actualizamos totales para validar
      this.actualizarTotales();
    });
    
    inputCantidad.addEventListener('input', actualizarTotalMaterial);
    inputPrecio.addEventListener('input', actualizarTotalMaterial);
    
    // Añadir el material a la lista
    this.elements.listaMateriales.appendChild(materialItem);
    
    // Inicializar el total
    actualizarTotalMaterial();
    
    // Focus en el nuevo material
    inputNombre.focus();
  }
  
  // Actualizar totales de la cotización
  actualizarTotales() {
    // Obtener todos los materiales
    const materiales = [];
    let subtotal = 0;
    
    // Recorrer los materiales y calcular subtotal
    Array.from(this.elements.listaMateriales.children).forEach(item => {
      const nombre = item.querySelector('.material-nombre').value;
      const cantidad = parseFloat(item.querySelector('.material-cantidad').value) || 0;
      const precio = parseFloat(item.querySelector('.material-precio').value) || 0;
      const total = cantidad * precio;
      
      materiales.push({
        nombre,
        cantidad,
        precio,
        total
      });
      
      subtotal += total;
    });
    
    // Actualizar la cotización con los nuevos materiales
    this.cotizacion.actualizarMateriales(materiales);
    
    // Mostrar los totales en la interfaz
    this.elements.subtotal.textContent = `$${this.cotizacion.subtotal.toFixed(2)}`;
    this.elements.descuento.textContent = `$${this.cotizacion.descuento.toFixed(2)}`;
    this.elements.iva.textContent = `$${this.cotizacion.iva.toFixed(2)}`;
    this.elements.total.textContent = `$${this.cotizacion.total.toFixed(2)}`;
  }
  
  // Actualizar la configuración de la cotización (IVA y descuento)
  actualizarConfiguracionCotizacion() {
    const ivaPorcentaje = parseFloat(this.elements.cotizacionIva.value) || 0;
    const descuento = parseFloat(this.elements.cotizacionDescuento.value) || 0;
    
    // Actualizar el porcentaje de IVA visible
    this.elements.ivaPorcentaje.textContent = ivaPorcentaje;
    
    // Actualizar la cotización
    this.cotizacion.actualizarConfiguracion({
      ivaPorcentaje,
      descuento
    });
    
    // Actualizar los totales
    this.actualizarTotales();
  }
  
  // Guardar la configuración de la empresa
  guardarConfiguracion() {
    const configData = {
      nombre: this.elements.configEmpresa.value || 'StableBuilds',
      direccion: this.elements.configDireccion.value || '',
      telefono: this.elements.configTelefono.value || '',
      email: this.elements.configEmail.value || '',
      web: this.elements.configWeb.value || 'stablebuilds.com'
    };
    
    // Guardar la configuración
    this.config.guardarConfig(configData);
    
    // Ocultar el panel de configuración
    this.elements.configPanel.classList.add('hidden');
    
    // Mostrar mensaje
    alert('Configuración guardada correctamente');
  }
  
  // Cargar la configuración guardada
  cargarConfiguracion() {
    const configData = this.config.cargarConfig();
    
    if (configData) {
      this.elements.configEmpresa.value = configData.nombre || '';
      this.elements.configDireccion.value = configData.direccion || '';
      this.elements.configTelefono.value = configData.telefono || '';
      this.elements.configEmail.value = configData.email || '';
      this.elements.configWeb.value = configData.web || '';
    }
  }
  
  // Validar los datos de la cotización antes de generar el PDF
  validarDatos() {
    // Validar datos del cliente
    if (!this.elements.clienteNombre.value.trim()) {
      alert('Ingrese el nombre del cliente');
      this.elements.clienteNombre.focus();
      return false;
    }
    
    // Validar materiales
    let materialesValidos = true;
    Array.from(this.elements.listaMateriales.children).forEach(item => {
      const nombre = item.querySelector('.material-nombre').value.trim();
      if (!nombre) {
        materialesValidos = false;
        item.querySelector('.material-nombre').focus();
      }
    });
    
    if (!materialesValidos) {
      alert('Complete la descripción de todos los conceptos');
      return false;
    }
    
    return true;
  }
  
  // Generar el PDF de la cotización
  generarPDF() {
    // Validar datos
    if (!this.validarDatos()) {
      return;
    }
    
    // Preparar datos para el PDF
    const datosEmpresa = this.config.cargarConfig() || {
      nombre: 'StableBuilds',
      direccion: '',
      telefono: '',
      email: '',
      web: 'stablebuilds.com'
    };
    
    const datosPDF = {
      empresa: datosEmpresa,
      cliente: {
        nombre: this.elements.clienteNombre.value,
        direccion: this.elements.clienteDireccion.value,
        telefono: this.elements.clienteTelefono.value,
        email: this.elements.clienteEmail.value
      },
      folio: this.elements.cotizacionFolio.value,
      ivaPorcentaje: this.cotizacion.ivaPorcentaje,
      materiales: this.cotizacion.materiales,
      subtotal: this.cotizacion.subtotal,
      descuento: this.cotizacion.descuento,
      iva: this.cotizacion.iva,
      total: this.cotizacion.total
    };
    
    // Generar el PDF
    generarPDF(datosPDF);
  }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
  // Registrar el Service Worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado'))
      .catch(err => console.error('Error al registrar Service Worker', err));
  }
  
  // Iniciar la aplicación
  window.app = new App();
});