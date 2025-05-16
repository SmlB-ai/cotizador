// Importamos los módulos necesarios
import { Cotizacion } from './cotizacion.js';
import { Config } from './config.js';
import { Clientes } from './clientes.js';
import { Historial } from './historial.js';
import { generarPDF } from './pdf.js';

class App {
    constructor() {
        console.log('Iniciando aplicación...');
        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log('Inicializando elementos...');
            this.initializeElements();

            console.log('Inicializando módulos...');
            this.config = new Config();
            this.clientes = new Clientes();
            this.historial = new Historial();
            this.cotizacion = new Cotizacion({
                ivaDefault: 16,
                descuentoDefault: 0,
                anticipoDefault: 0
            });

            console.log('Cargando datos iniciales...');
            await this.cargarDatosIniciales();

            console.log('Configurando eventos...');
            this.initializeEventListeners();
            this.initializeValidationEvents();
            this.initializeTheme();

            console.log('Iniciando primer material...');
            this.agregarMaterial();

            console.log('Aplicación iniciada correctamente');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.mostrarNotificacion('Error al iniciar la aplicación', 'error');
        }
    }

    initializeElements() {
        this.elements = {
            // Configuración
            configPanel: document.getElementById('config-section'),
            btnConfig: document.getElementById('btn-config'),
            btnCloseConfig: document.getElementById('btn-close-config'),
            btnGuardarConfig: document.getElementById('btn-guardar-config'),
            configEmpresa: document.getElementById('config-empresa'),
            configDireccion: document.getElementById('config-direccion'),
            configTelefono: document.getElementById('config-telefono'),
            configEmail: document.getElementById('config-email'),
            configWeb: document.getElementById('config-web'),
            
            // Tema
            btnTheme: document.getElementById('btn-theme'),
            
            // Cliente
            clientesSelect: document.getElementById('clientes-guardados'),
            btnGuardarCliente: document.getElementById('btn-guardar-cliente'),
            btnNuevoCliente: document.getElementById('btn-nuevo-cliente'),
            clienteNombre: document.getElementById('cliente-nombre'),
            clienteDireccion: document.getElementById('cliente-direccion'),
            clienteTelefono: document.getElementById('cliente-telefono'),
            clienteEmail: document.getElementById('cliente-email'),
            
            // Cotización
            cotizacionFolio: document.getElementById('cotizacion-folio'),
            cotizacionIva: document.getElementById('cotizacion-iva'),
            cotizacionDescuento: document.getElementById('cotizacion-descuento'),
            
            // Materiales
            listaMateriales: document.getElementById('lista-materiales'),
            btnAddMaterial: document.getElementById('btn-add-material'),
            templateMaterial: document.getElementById('template-material'),
            
            // Pagos
            pagoAnticipo: document.getElementById('pago-anticipo'),
            fechaAnticipo: document.getElementById('fecha-anticipo'),
            formaPago: document.getElementById('forma-pago'),
            notasPago: document.getElementById('notas-pago'),
            
            // Totales
            subtotal: document.getElementById('subtotal'),
            descuento: document.getElementById('descuento'),
            iva: document.getElementById('iva'),
            total: document.getElementById('total'),
            ivaPorcentaje: document.getElementById('iva-porcentaje'),
            anticipoDisplay: document.getElementById('anticipo-display'),
            pendiente: document.getElementById('pendiente'),
            
            // Acciones
            btnGuardar: document.getElementById('btn-guardar'),
            btnGenerarPDF: document.getElementById('btn-generar-pdf'),

            // Importación/Exportación
            btnExportarClientes: document.getElementById('btn-exportar-clientes'),
            btnImportarClientes: document.getElementById('btn-importar-clientes'),
            inputImportarClientes: document.getElementById('input-importar-clientes')
        };
    }

    cargarDatosIniciales() {
        // Cargar configuración
        const configData = this.config.cargarConfig();
        if (configData) {
            this.elements.configEmpresa.value = configData.nombre || '';
            this.elements.configDireccion.value = configData.direccion || '';
            this.elements.configTelefono.value = configData.telefono || '';
            this.elements.configEmail.value = configData.email || '';
            this.elements.configWeb.value = configData.web || '';
        }

        // Cargar lista de clientes
        this.actualizarListaClientes();

        // Generar folio automático
        this.generarFolioAutomatico();
    }

    initializeEventListeners() {
        try {
            // Configuración
            if (this.elements.btnConfig) {
                this.elements.btnConfig.addEventListener('click', () => this.toggleConfigPanel());
            }
            if (this.elements.btnCloseConfig) {
                this.elements.btnCloseConfig.addEventListener('click', () => this.toggleConfigPanel());
            }
            if (this.elements.btnGuardarConfig) {
                this.elements.btnGuardarConfig.addEventListener('click', () => this.guardarConfiguracion());
            }

            // Tema
            if (this.elements.btnTheme) {
                this.elements.btnTheme.addEventListener('click', () => this.toggleTheme());
            }

            // Clientes
            if (this.elements.clientesSelect) {
                this.elements.clientesSelect.addEventListener('change', () => this.cargarClienteSeleccionado());
            }
            if (this.elements.btnGuardarCliente) {
                this.elements.btnGuardarCliente.addEventListener('click', () => this.guardarCliente());
            }
            if (this.elements.btnNuevoCliente) {
                this.elements.btnNuevoCliente.addEventListener('click', () => this.nuevoCliente());
            }

            // Materiales
            if (this.elements.btnAddMaterial) {
                this.elements.btnAddMaterial.addEventListener('click', () => this.agregarMaterial());
            }

            // Campos que afectan totales
            if (this.elements.cotizacionIva) {
                this.elements.cotizacionIva.addEventListener('input', () => this.actualizarTotales());
            }
            if (this.elements.cotizacionDescuento) {
                this.elements.cotizacionDescuento.addEventListener('input', () => this.actualizarTotales());
            }
            if (this.elements.pagoAnticipo) {
                this.elements.pagoAnticipo.addEventListener('input', () => this.actualizarTotales());
            }

            // Acciones principales
            if (this.elements.btnGuardar) {
                this.elements.btnGuardar.addEventListener('click', () => this.guardarCotizacion());
            }
            if (this.elements.btnGenerarPDF) {
                this.elements.btnGenerarPDF.addEventListener('click', () => this.generarPDF());
            }

            // Exportar/Importar clientes
            if (this.elements.btnExportarClientes) {
                this.elements.btnExportarClientes.addEventListener('click', () => this.exportarClientes());
            }
            if (this.elements.btnImportarClientes) {
                this.elements.btnImportarClientes.addEventListener('click', () => {
                    if (this.elements.inputImportarClientes) {
                        this.elements.inputImportarClientes.click();
                    }
                });
            }
            if (this.elements.inputImportarClientes) {
                this.elements.inputImportarClientes.addEventListener('change', (e) => this.importarClientes(e));
            }

        } catch (error) {
            console.error('Error al inicializar eventos:', error);
            this.mostrarNotificacion('Error al inicializar eventos', 'error');
        }
    }

    initializeValidationEvents() {
        // Validación de campos numéricos
        const numericalInputs = [
            this.elements.cotizacionIva,
            this.elements.cotizacionDescuento,
            this.elements.pagoAnticipo
        ];

        numericalInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    let value = e.target.value;
                    if (value < 0) e.target.value = 0;
                    if (e.target.id === 'cotizacion-iva' && value > 100) e.target.value = 100;
                });
            }
        });

        // Validación de email
        if (this.elements.clienteEmail) {
            this.elements.clienteEmail.addEventListener('blur', (e) => {
                const email = e.target.value;
                if (email && !this.validarEmail(email)) {
                    this.mostrarNotificacion('Por favor, ingrese un email válido', 'warning');
                }
            });
        }
    }

    initializeTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', theme);
        this.updateThemeButton(theme);
    }

    // Gestión de materiales
    agregarMaterial() {
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
            if (this.elements.listaMateriales.children.length > 1) {
                materialItem.classList.add('fade-out');
                setTimeout(() => {
                    materialItem.remove();
                    this.actualizarTotales();
                }, 300);
            } else {
                this.mostrarNotificacion('Debe haber al menos un concepto en la cotización', 'warning');
            }
        });
        
        // Actualizar totales al cambiar valores
        const actualizarTotalMaterial = () => {
            const cantidad = parseFloat(inputCantidad.value) || 0;
            const precio = parseFloat(inputPrecio.value) || 0;
            const total = cantidad * precio;
            spanTotal.textContent = this.formatearMoneda(total);
            this.actualizarTotales();
        };
        
        inputNombre.addEventListener('input', () => this.actualizarTotales());
        inputCantidad.addEventListener('input', actualizarTotalMaterial);
        inputPrecio.addEventListener('input', actualizarTotalMaterial);
        
        // Añadir el material con animación
        this.elements.listaMateriales.appendChild(materialItem);
        materialItem.classList.add('fade-in');
        
        // Focus en el nuevo material
        inputNombre.focus();
    }

    // Gestión de clientes
    exportarClientes() {
        const csv = this.clientes.exportarCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    async importarClientes(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const content = await file.text();
                const resultado = this.clientes.importarCSV(content);
                this.mostrarNotificacion(
                    `Importación completada: ${resultado.exitosos} exitosos, ${resultado.fallidos} fallidos`,
                    resultado.fallidos > 0 ? 'warning' : 'success'
                );
                this.actualizarListaClientes();
            } catch (error) {
                this.mostrarNotificacion('Error al importar clientes', 'error');
            }
        }
        event.target.value = '';
    }

    actualizarListaClientes() {
        const clientes = this.clientes.obtenerTodos();
        const select = this.elements.clientesSelect;
        
        // Limpiar opciones existentes
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar clientes
        clientes.forEach((cliente, index) => {
            const option = new Option(cliente.nombre, index.toString());
            select.add(option);
        });
    }

    cargarClienteSeleccionado() {
        const index = this.elements.clientesSelect.value;
        if (index === '') {
            this.nuevoCliente();
            return;
        }

        const cliente = this.clientes.obtenerTodos()[parseInt(index)];
        if (cliente) {
            this.elements.clienteNombre.value = cliente.nombre;
            this.elements.clienteDireccion.value = cliente.direccion || '';
            this.elements.clienteTelefono.value = cliente.telefono || '';
            this.elements.clienteEmail.value = cliente.email || '';
        }
    }

    guardarCliente() {
        console.log('Iniciando guardado de cliente');
        try {
            const clienteData = {
                nombre: this.elements.clienteNombre.value.trim(),
                direccion: this.elements.clienteDireccion.value.trim(),
                telefono: this.elements.clienteTelefono.value.trim(),
                email: this.elements.clienteEmail.value.trim()
            };

            console.log('Datos del cliente a guardar:', clienteData);

            if (!clienteData.nombre) {
                this.mostrarNotificacion('El nombre del cliente es requerido', 'error');
                return;
            }

            this.clientes.guardar(clienteData);
            this.actualizarListaClientes();
            this.mostrarNotificacion('Cliente guardado exitosamente', 'success');
            
            console.log('Cliente guardado correctamente');
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            this.mostrarNotificacion('Error al guardar cliente: ' + error.message, 'error');
        }
    }

    nuevoCliente() {
        this.elements.clientesSelect.value = '';
        this.elements.clienteNombre.value = '';
        this.elements.clienteDireccion.value = '';
        this.elements.clienteTelefono.value = '';
        this.elements.clienteEmail.value = '';
        this.elements.clienteNombre.focus();
    }

    // Configuración
    guardarConfiguracion() {
        const configData = {
            nombre: this.elements.configEmpresa.value.trim(),
            direccion: this.elements.configDireccion.value.trim(),
            telefono: this.elements.configTelefono.value.trim(),
            email: this.elements.configEmail.value.trim(),
            web: this.elements.configWeb.value.trim()
        };

        if (!configData.nombre) {
            this.mostrarNotificacion('El nombre de la empresa es requerido', 'error');
            return;
        }

        this.config.guardarConfig(configData);
        this.toggleConfigPanel();
        this.mostrarNotificacion('Configuración guardada exitosamente', 'success');
    }

    // Métodos de UI
    toggleConfigPanel() {
        this.elements.configPanel.classList.toggle('hidden');
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeButton(newTheme);
    }

    updateThemeButton(theme) {
        if (this.elements.btnTheme) {
            this.elements.btnTheme.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }

    // Cálculos y actualizaciones
    actualizarTotales() {
        const materiales = this.obtenerMateriales();
        const ivaPorcentaje = parseFloat(this.elements.cotizacionIva.value) || 0;
        const descuento = parseFloat(this.elements.cotizacionDescuento.value) || 0;
        const anticipo = parseFloat(this.elements.pagoAnticipo.value) || 0;

        // Actualizar cotización
        this.cotizacion.actualizarDatos({
            materiales,
            ivaPorcentaje,
            descuento,
            anticipo
        });

        // Actualizar UI
        this.elements.subtotal.textContent = this.formatearMoneda(this.cotizacion.subtotal);
        this.elements.descuento.textContent = this.formatearMoneda(this.cotizacion.descuento);
        this.elements.iva.textContent = this.formatearMoneda(this.cotizacion.iva);
        this.elements.total.textContent = this.formatearMoneda(this.cotizacion.total);
        this.elements.ivaPorcentaje.textContent = ivaPorcentaje;
        this.elements.anticipoDisplay.textContent = this.formatearMoneda(anticipo);
        this.elements.pendiente.textContent = this.formatearMoneda(this.cotizacion.total - anticipo);
    }

    obtenerMateriales() {
        return Array.from(this.elements.listaMateriales.children).map(item => ({
            nombre: item.querySelector('.material-nombre').value,
            cantidad: parseFloat(item.querySelector('.material-cantidad').value) || 0,
            precio: parseFloat(item.querySelector('.material-precio').value) || 0
        }));
    }

    // Gestión de cotizaciones
    generarFolioAutomatico() {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const ultimoFolio = this.historial.obtenerUltimoFolio() || 0;
        const nuevoNumero = (ultimoFolio + 1).toString().padStart(3, '0');
        this.elements.cotizacionFolio.value = `COT-${año}${mes}-${nuevoNumero}`;
    }

    guardarCotizacion() {
        if (!this.validarCotizacion()) {
            return;
        }

        const cotizacionData = {
            folio: this.elements.cotizacionFolio.value,
            fecha: new Date().toISOString(),
            cliente: {
                nombre: this.elements.clienteNombre.value,
                direccion: this.elements.clienteDireccion.value,
                telefono: this.elements.clienteTelefono.value,
                email: this.elements.clienteEmail.value
            },
            materiales: this.obtenerMateriales(),
            ivaPorcentaje: parseFloat(this.elements.cotizacionIva.value),
            descuento: parseFloat(this.elements.cotizacionDescuento.value),
            anticipo: parseFloat(this.elements.pagoAnticipo.value),
            formaPago: this.elements.formaPago.value,
            fechaAnticipo: this.elements.fechaAnticipo.value,
            notasPago: this.elements.notasPago.value,
            totales: {
                subtotal: this.cotizacion.subtotal,
                descuento: this.cotizacion.descuento,
                iva: this.cotizacion.iva,
                total: this.cotizacion.total
            }
        };

        this.historial.guardar(cotizacionData);
        this.mostrarNotificacion('Cotización guardada exitosamente', 'success');
        this.generarFolioAutomatico();
    }

    async generarPDF() {
        if (!this.validarCotizacion()) {
            return;
        }

        const configData = this.config.cargarConfig();
        if (!configData) {
            this.mostrarNotificacion('Configure los datos de la empresa antes de generar el PDF', 'warning');
            return;
        }

        try {
            await generarPDF({
                empresa: configData,
                folio: this.elements.cotizacionFolio.value,
                fecha: new Date(),
                cliente: {
                    nombre: this.elements.clienteNombre.value,
                    direccion: this.elements.clienteDireccion.value,
                    telefono: this.elements.clienteTelefono.value,
                    email: this.elements.clienteEmail.value
                },
                materiales: this.obtenerMateriales(),
                ivaPorcentaje: parseFloat(this.elements.cotizacionIva.value),
                descuento: parseFloat(this.elements.cotizacionDescuento.value),
                anticipo: parseFloat(this.elements.pagoAnticipo.value),
                formaPago: this.elements.formaPago.value,
                totales: this.cotizacion.obtenerTotales()
            });
            this.mostrarNotificacion('PDF generado exitosamente', 'success');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            this.mostrarNotificacion('Error al generar el PDF', 'error');
        }
    }

    // Utilidades
    validarCotizacion() {
        if (!this.elements.clienteNombre.value.trim()) {
            this.mostrarNotificacion('Ingrese el nombre del cliente', 'error');
            this.elements.clienteNombre.focus();
            return false;
        }

        const materiales = this.obtenerMateriales();
        if (!materiales.length || !materiales.every(m => m.nombre.trim())) {
            this.mostrarNotificacion('Complete la descripción de todos los conceptos', 'error');
            return false;
        }

        return true;
    }

    validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(valor);
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        console.log(`Notificación (${tipo}):`, mensaje);
        
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        
        // Asegurarse de que el contenedor existe
        let contenedor = document.getElementById('notificaciones-container');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'notificaciones-container';
            document.body.appendChild(contenedor);
        }
        
        contenedor.appendChild(notificacion);
        
        // Animar entrada
        setTimeout(() => notificacion.classList.add('visible'), 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notificacion.classList.remove('visible');
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Registrar el Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.error('Error al registrar Service Worker:', err));
    }
    
    // Iniciar la aplicación
    window.app = new App();
});

export default App;
