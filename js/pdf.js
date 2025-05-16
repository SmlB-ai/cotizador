const { jsPDF } = window.jspdf;

export const generarPDF = async (datos) => {
    try {
        // Crear documento en formato carta
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'letter'
        });

        // Configuración de fecha
        const fecha = new Date().toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });

        // --- Encabezado con logos ---
        const logoConstruccion = new Image();
        logoConstruccion.src = 'assets/logos/construccion.png';
        doc.addImage(logoConstruccion, 'PNG', 15, 10, 25, 25);

        // Información de la empresa (centrada y más profesional)
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('STABLEBUILDS', 105, 20, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text([
            datos.empresa.direccion,
            `Tel: ${datos.empresa.telefono}`,
            `Email: ${datos.empresa.email}`,
            `Web: ${datos.empresa.web}`
        ], 105, 25, { align: 'center', lineHeightFactor: 1.5 });

        // Folio y Fecha (más discretos y organizados)
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text([
            `Cotización: ${datos.folio}`,
            `Fecha: ${fecha}`
        ], 195, 15, { align: 'right' });

        // Línea divisoria
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, 45, 195, 45);

        // --- Información del Cliente (mejor organizada) ---
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text('CLIENTE', 15, 55);

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        // Dividir datos largos en múltiples líneas si es necesario
        const splitNombre = doc.splitTextToSize(`Nombre: ${datos.cliente.nombre}`, 90);
        const splitDireccion = doc.splitTextToSize(`Dirección: ${datos.cliente.direccion}`, 90);
        
        doc.text([
            ...splitNombre,
            ...splitDireccion,
            `Teléfono: ${datos.cliente.telefono}`,
            `Email: ${datos.cliente.email}`
        ], 15, 62, { lineHeightFactor: 1.3 });

        // --- Tabla de Conceptos (mejorada) ---
        doc.setFillColor(40, 40, 40);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.rect(15, 90, 180, 8, 'F');

        // Encabezados de tabla
        const headers = ['Concepto', 'Cant.', 'P.U.', 'Importe'];
        const headerWidths = [100, 20, 30, 30];
        let currentX = 20;
        
        headers.forEach((header, i) => {
            doc.text(header, currentX, 95);
            currentX += headerWidths[i];
        });

        // Contenido de la tabla
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        let y = 105;

        datos.materiales.forEach((item, index) => {
            // Alternar colores de fondo para mejor legibilidad
            if (index % 2 === 0) {
                doc.setFillColor(240, 240, 240);
                doc.rect(15, y-5, 180, 7, 'F');
            }

            const descripcion = doc.splitTextToSize(item.nombre, 95);
            doc.text(descripcion, 20, y);
            doc.text(item.cantidad.toString(), 120, y);
            doc.text(`$${item.precio.toFixed(2)}`, 140, y);
            doc.text(`$${(item.cantidad * item.precio).toFixed(2)}`, 190, y, { align: 'right' });
            
            y += (descripcion.length > 1 ? descripcion.length * 5 : 7);
        });

        // --- Sección de Totales (más detallada) ---
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(120, y+5, 195, y+5);

        doc.setFontSize(10);
        y += 15;
        
        // Tabla de totales alineada a la derecha
        const totalesTable = [
            ['Subtotal:', `$${datos.totales.subtotal.toFixed(2)}`],
            ['Descuento:', `$${datos.descuento.toFixed(2)}`],
            [`IVA (${datos.ivaPorcentaje}%):`, `$${datos.totales.iva.toFixed(2)}`],
            ['Total:', `$${datos.totales.total.toFixed(2)}`],
            ['Anticipo:', `$${datos.anticipo.toFixed(2)}`],
            ['Pendiente:', `$${(datos.totales.total - datos.anticipo).toFixed(2)}`]
        ];

        totalesTable.forEach((row, index) => {
            doc.setFont(undefined, index === 3 || index === 5 ? 'bold' : 'normal');
            doc.text(row[0], 150, y);
            doc.text(row[1], 190, y, { align: 'right' });
            y += 6;
        });

        // --- Condiciones de Pago ---
        y += 10;
        doc.setFont(undefined, 'bold');
        doc.text('Condiciones de Pago:', 15, y);
        doc.setFont(undefined, 'normal');
        doc.text(`Forma de Pago: ${datos.formaPago}`, 15, y + 7);
        
        if (datos.notasPago) {
            const notasSplit = doc.splitTextToSize(`Notas: ${datos.notasPago}`, 180);
            doc.text(notasSplit, 15, y + 14);
        }

        // --- Sección de Firmas ---
        y = 240; // Posición fija para las firmas
        
        // Líneas para firmas
        doc.setDrawColor(100, 100, 100);
        doc.line(25, y, 85, y);
        doc.line(125, y, 185, y);

        // Textos bajo las líneas
        doc.setFontSize(8);
        doc.text('Autoriza Cliente', 55, y + 5, { align: 'center' });
        doc.text(datos.cliente.nombre, 55, y + 10, { align: 'center' });

        doc.text('Por StableBuilds', 155, y + 5, { align: 'center' });
        doc.text(datos.empresa.nombre || 'StableBuilds', 155, y + 10, { align: 'center' });

        // --- Footer ---
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text('Esta cotización tiene una vigencia de 30 días naturales.', 105, 270, { align: 'center' });
        doc.text('stablebuilds.com | skillhub-mex.com', 105, 275, { align: 'center' });

        // Guardar PDF
        doc.save(`Cotizacion_StableBuilds_${datos.folio}.pdf`);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        throw error;
    }
};