const { jsPDF } = window.jspdf;

export const generarPDF = async (datos) => {
    try {
        const doc = new jsPDF();
        const fecha = new Date().toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });

        // --- Encabezado con logos ---
        // Logo principal (izquierda)
        const logoConstruccion = new Image();
        logoConstruccion.src = 'assets/logos/construccion.png';
        doc.addImage(logoConstruccion, 'PNG', 20, 15, 30, 15);

        // Logo secundario (derecha)
        const logoSkillhub = new Image();
        logoSkillhub.src = 'assets/logos/skillhub.png';
        doc.addImage(logoSkillhub, 'PNG', 160, 15, 30, 15);

        // --- Datos de las empresas (2 columnas) ---
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Negro

        // Columna izquierda (TU EMPRESA)
        doc.setFont(undefined, 'bold');
        doc.text('StableBuilds', 20, 40);
        doc.setFont(undefined, 'normal');
        doc.text(datos.empresa.direccion, 20, 45);
        doc.text(`Tel: ${datos.empresa.telefono}`, 20, 50);
        doc.text(`Email: ${datos.empresa.email}`, 20, 55);
        doc.text(`Web: ${datos.empresa.web}`, 20, 60);

        // Columna derecha (CLIENTE)
        doc.setFont(undefined, 'bold');
        doc.text('Cliente:', 120, 40);
        doc.setFont(undefined, 'normal');
        doc.text(datos.cliente.nombre, 120, 45);
        doc.text(datos.cliente.direccion, 120, 50);
        doc.text(`Tel: ${datos.cliente.telefono}`, 120, 55);
        doc.text(`Email: ${datos.cliente.email}`, 120, 60);

        // --- Línea divisoria ---
        doc.setDrawColor(255, 215, 0); // Amarillo construcción
        doc.setLineWidth(0.5);
        doc.line(20, 65, 190, 65);

        // --- Cuerpo de la cotización ---
        doc.setFontSize(14);
        doc.text(`COTIZACIÓN #${datos.folio}`, 105, 75, { align: 'center' });
        doc.text(`Fecha: ${fecha}`, 105, 82, { align: 'center' });

        // Tabla de conceptos
        doc.setFontSize(10);
        doc.setFillColor(0, 0, 0); // Negro para header
        doc.setTextColor(255, 215, 0); // Amarillo
        doc.rect(20, 90, 170, 8, 'F');
        doc.text('Concepto', 25, 95);
        doc.text('Cant.', 120, 95);
        doc.text('P.U.', 140, 95);
        doc.text('Importe', 170, 95, { align: 'right' });

        // Items
        doc.setTextColor(0, 0, 0);
        let y = 105;
        datos.materiales.forEach(item => {
            doc.text(item.nombre.substring(0, 40), 25, y); // Limita caracteres
            doc.text(item.cantidad.toString(), 120, y);
            doc.text(`$${item.precio.toFixed(2)}`, 140, y);
            doc.text(`$${(item.cantidad * item.precio).toFixed(2)}`, 170, y, { align: 'right' });
            y += 7;
        });

        // --- Totales ---
        doc.setFontSize(12);
        doc.text(`Subtotal: $${datos.totales.subtotal.toFixed(2)}`, 140, y + 10, { align: 'right' });
        doc.text(`IVA (${datos.ivaPorcentaje}%): $${datos.totales.iva.toFixed(2)}`, 140, y + 17, { align: 'right' });
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`TOTAL: $${datos.totales.total.toFixed(2)}`, 140, y + 27, { align: 'right' });

        // --- Footer con URLs ---
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100); // Gris discreto
        doc.text('stablebuilds.com | skillhub-mex.com', 105, 285, { align: 'center' });

        doc.save(`Cotizacion_StableBuilds_${datos.folio}.pdf`);
    } catch (error) {
        console.error('Error al generar PDF:', error);
        throw error;
    }
};