/**
 * Clase para manejar el formulario de clientes
 * Incluye la lógica de importación y exportación
 */
export class ClienteForm {
    constructor(gestorClientes) {
        this.gestorClientes = gestorClientes;
        this.setupEventListeners();
    }

    /**
     * Configura los escuchadores de eventos
     */
    setupEventListeners() {
        // Botón de importar
        const btnImportar = document.getElementById('btnImportarClientes');
        if (btnImportar) {
            btnImportar.addEventListener('click', () => this.iniciarImportacion());
        }

        // Botón de exportar
        const btnExportar = document.getElementById('btnExportarClientes');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarClientes());
        }

        // Input de archivo oculto
        const inputArchivo = document.createElement('input');
        inputArchivo.type = 'file';
        inputArchivo.accept = '.csv';
        inputArchivo.style.display = 'none';
        inputArchivo.addEventListener('change', (e) => this.manejarSeleccionArchivo(e));
        document.body.appendChild(inputArchivo);
        this.inputArchivo = inputArchivo;
    }

    /**
     * Inicia el proceso de importación
     */
    iniciarImportacion() {
        this.inputArchivo.click();
    }

    /**
     * Maneja la selección de archivo
     * @param {Event} evento - Evento de cambio del input file
     */
    manejarSeleccionArchivo(evento) {
        const archivo = evento.target.files[0];
        if (!archivo) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const contenido = e.target.result;
                console.log('Contenido del archivo:', contenido.substring(0, 100)); // Para depuración
                const resultado = this.gestorClientes.importarCSV(contenido);
                this.mostrarResultadoImportacion(resultado);
            } catch (error) {
                console.error('Error al importar:', error);
                alert('Error al importar el archivo: ' + error.message);
            }
        };

        reader.onerror = (error) => {
            console.error('Error al leer el archivo:', error);
            alert('Error al leer el archivo');
        };

        reader.readAsText(archivo);
    }

    /**
     * Muestra el resultado de la importación
     * @param {Object} resultado - Resultado de la importación
     */
    mostrarResultadoImportacion(resultado) {
        let mensaje = `Importación completada:\n`;
        mensaje += `- Clientes importados exitosamente: ${resultado.exitosos}\n`;
        mensaje += `- Clientes con errores: ${resultado.fallidos}`;

        if (resultado.errores.length > 0) {
            mensaje += '\n\nErrores encontrados:\n' + resultado.errores.join('\n');
        }

        alert(mensaje);
    }

    /**
     * Exporta los clientes a un archivo CSV
     */
    exportarClientes() {
        try {
            const csvContent = this.gestorClientes.exportarCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            // Crear URL para descargar
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.display = 'none';
            
            // Agregar a documento y hacer clic
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar:', error);
            alert('Error al exportar los clientes: ' + error.message);
        }
    }
}