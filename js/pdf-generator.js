// js/pdf-generator.js
// Module for generating PDF documents, primarily for quotes.

/**
 * Generates a PDF document for a given quote.
 * @param {object} quoteData - The quote object (from js/cotizaciones.js currentQuote).
 * @param {object} companyData - Company information (from js/configuracion.js or placeholders).
 * @param {object} clientDataInput - Client information (from js/clientes.js or quoteData).
 */
function generateQuotePDF(quoteData, companyData, clientDataInput) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- Default Data & Placeholders ---
    const defaultCompanyData = {
        name: "Nombre de tu Empresa (Configurar)",
        address: "Tu Dirección, Ciudad, País",
        phone: "Tu Teléfono",
        email: "tu@email.com",
        rfc: "Tu RFC",
        logoUrl: null // URL to company logo
    };
    const finalCompanyData = { ...defaultCompanyData, ...companyData };

    // Client data might be directly on quoteData or passed separately
    const finalClientData = {
        nombre: clientDataInput?.nombre || quoteData?.clientName || "Cliente General",
        direccion: clientDataInput?.direccion || "",
        telefono: clientDataInput?.telefono || "",
        email: clientDataInput?.email || "",
        rfc: clientDataInput?.rfc || ""
    };

    const quoteNumber = quoteData.quoteNumber || 'COT-XXXX-0000';
    const quoteDate = quoteData.fecha ? new Date(quoteData.fecha).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
    const quoteStatus = quoteData.status || 'Borrador';

    // --- PDF Styling and Constants ---
    const pageMargin = 15;
    const lineSpacing = 7;
    const titleFontSize = 18;
    const headerFontSize = 12;
    const normalFontSize = 10;
    const smallFontSize = 8;
    let yPos = pageMargin; // Current Y position on the page

    // --- Helper Functions ---
    function addPageHeader() {
        // Placeholder for company logo (requires more advanced handling for images)
        if (finalCompanyData.logoUrl) {
            // try {
            //     // This is a simplified example. Image loading needs to be handled carefully,
            //     // possibly asynchronously or by pre-loading the image data.
            //     // For now, we'll just put a placeholder text if a logo URL is provided.
            //     // doc.addImage(finalCompanyData.logoUrl, 'PNG', pageMargin, yPos, 40, 15);
            //     // yPos += 20; // Adjust yPos after logo
            //     doc.setFontSize(normalFontSize);
            //     doc.text("Logo Placeholder", pageMargin, yPos);
            //     yPos += lineSpacing;
            // } catch (e) {
            //     console.error("Error adding logo:", e);
            //     doc.text("Logo (Error)", pageMargin, yPos);
            //     yPos += lineSpacing;
            // }
             doc.setFontSize(headerFontSize);
             doc.setFont(undefined, 'bold');
             doc.text(finalCompanyData.name.toUpperCase(), pageMargin, yPos);
             yPos += lineSpacing;

        } else {
            doc.setFontSize(headerFontSize);
            doc.setFont(undefined, 'bold');
            doc.text(finalCompanyData.name.toUpperCase(), pageMargin, yPos);
            yPos += lineSpacing;
        }

        doc.setFontSize(smallFontSize);
        doc.setFont(undefined, 'normal');
        if (finalCompanyData.address) { doc.text(finalCompanyData.address, pageMargin, yPos); yPos += 4; }
        if (finalCompanyData.rfc) { doc.text(`RFC: ${finalCompanyData.rfc}`, pageMargin, yPos); yPos += 4; }
        if (finalCompanyData.phone) { doc.text(`Tel: ${finalCompanyData.phone}`, pageMargin, yPos); yPos += 4; }
        if (finalCompanyData.email) { doc.text(`Email: ${finalCompanyData.email}`, pageMargin, yPos); yPos += 4; }
        yPos += lineSpacing / 2; // Extra space after company info
    }

    function addDocumentTitle() {
        doc.setFontSize(titleFontSize);
        doc.setFont(undefined, 'bold');
        doc.text("COTIZACIÓN", doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += lineSpacing * 1.5;
    }

    function addQuoteClientInfo() {
        const rightColX = doc.internal.pageSize.getWidth() - pageMargin;

        doc.setFontSize(normalFontSize);
        doc.setFont(undefined, 'bold');
        doc.text("Número de Cotización:", pageMargin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(quoteNumber, pageMargin + 55, yPos);

        doc.setFont(undefined, 'bold');
        doc.text("Fecha:", rightColX - 40, yPos, { align: 'left' });
        doc.setFont(undefined, 'normal');
        doc.text(quoteDate, rightColX, yPos, { align: 'right' });
        yPos += lineSpacing;

        doc.setFont(undefined, 'bold');
        doc.text("Estado:", pageMargin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(quoteStatus.toUpperCase(), pageMargin + 55, yPos);
        yPos += lineSpacing * 1.5;

        doc.setFontSize(normalFontSize);
        doc.setFont(undefined, 'bold');
        doc.text("Cliente:", pageMargin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(finalClientData.nombre, pageMargin + 20, yPos);
        yPos += lineSpacing;

        if (finalClientData.direccion) { doc.text(finalClientData.direccion, pageMargin + 20, yPos); yPos += 5; }
        if (finalClientData.telefono) { doc.text(`Tel: ${finalClientData.telefono}`, pageMargin + 20, yPos); yPos += 5; }
        if (finalClientData.email) { doc.text(`Email: ${finalClientData.email}`, pageMargin + 20, yPos); yPos += 5; }
        if (finalClientData.rfc) { doc.text(`RFC: ${finalClientData.rfc}`, pageMargin + 20, yPos); yPos += 5; }
        yPos += lineSpacing;
    }

    function addItemsTable() {
        const tableHeaders = [["Descripción", "Cantidad", "P. Unitario", "Subtotal"]];
        const tableBody = quoteData.items.map(item => [
            item.description || "N/A",
            item.quantity || 0,
            (item.price || 0).toFixed(2),
            (item.subtotal || 0).toFixed(2)
        ]);

        doc.autoTable({
            startY: yPos,
            head: tableHeaders,
            body: tableBody,
            theme: 'grid', // 'striped', 'grid', 'plain'
            headStyles: { fillColor: [22, 160, 133], textColor: [255,255,255] }, // Example: Teal header
            styles: { fontSize: normalFontSize, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Description
                1: { cellWidth: 20, halign: 'right' }, // Quantity
                2: { cellWidth: 30, halign: 'right' }, // Price
                3: { cellWidth: 30, halign: 'right' }  // Subtotal
            }
        });
        yPos = doc.autoTable.previous.finalY + lineSpacing; // Update yPos to after the table
    }

    function addTotals() {
        const rightAlignX = doc.internal.pageSize.getWidth() - pageMargin;
        const labelOffset = 45; // How far left of rightAlignX the labels will be

        doc.setFontSize(normalFontSize);

        doc.setFont(undefined, 'bold');
        doc.text("Subtotal:", rightAlignX - labelOffset, yPos, { align: 'left' });
        doc.setFont(undefined, 'normal');
        doc.text(`$${(quoteData.subtotal || 0).toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
        yPos += lineSpacing;

        if (quoteData.descuentoCalculado && quoteData.descuentoCalculado > 0) {
            const discountLabel = `Descuento (${quoteData.descuentoTipo === 'fijo' ? '$' : ''}${quoteData.descuentoValor}${quoteData.descuentoTipo === 'porcentaje' ? '%' : ''}):`;
            doc.setFont(undefined, 'bold');
            doc.text(discountLabel, rightAlignX - labelOffset, yPos, { align: 'left' });
            doc.setFont(undefined, 'normal');
            doc.text(`-$${(quoteData.descuentoCalculado || 0).toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
            yPos += lineSpacing;
        }

        const baseImponible = (quoteData.subtotal || 0) - (quoteData.descuentoCalculado || 0);
        doc.setFont(undefined, 'bold');
        doc.text("Base Imponible:", rightAlignX - labelOffset, yPos, { align: 'left' });
        doc.setFont(undefined, 'normal');
        doc.text(`$${baseImponible.toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
        yPos += lineSpacing;

        if (quoteData.aplicarIVA && quoteData.iva > 0) {
            doc.setFont(undefined, 'bold');
            doc.text(`IVA (${(quoteData.ivaRate || 0.16) * 100}%):`, rightAlignX - labelOffset, yPos, { align: 'left' }); // Assuming ivaRate is stored or use default
            doc.setFont(undefined, 'normal');
            doc.text(`$${(quoteData.iva || 0).toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
            yPos += lineSpacing;
        }

        doc.setFontSize(headerFontSize); // Larger for total
        doc.setFont(undefined, 'bold');
        doc.text("Total General:", rightAlignX - labelOffset, yPos, { align: 'left' });
        doc.text(`$${(quoteData.total || 0).toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
        yPos += lineSpacing * 2;
        doc.setFontSize(normalFontSize); // Reset
    }

    function addNotesAndTerms() {
        doc.setFont(undefined, 'normal');
        if (quoteData.notas && quoteData.notas.trim() !== "") {
            doc.setFont(undefined, 'bold');
            doc.text("Notas Adicionales:", pageMargin, yPos);
            yPos += lineSpacing / 1.5;
            doc.setFont(undefined, 'normal');
            const notesLines = doc.splitTextToSize(quoteData.notas, doc.internal.pageSize.getWidth() - pageMargin * 2);
            doc.text(notesLines, pageMargin, yPos);
            yPos += (notesLines.length * (lineSpacing / 1.5)) + lineSpacing;
        }

        const termsPlaceholder = "Términos y Condiciones:\n1. Validez de la cotización: 30 días.\n2. Precios sujetos a cambio sin previo aviso después de la validez.\n3. Pago: 50% anticipo, 50% contra entrega.\nPara cualquier duda o aclaración, favor de contactarnos.";
        doc.setFont(undefined, 'bold');
        doc.text("Términos y Condiciones:", pageMargin, yPos);
        yPos += lineSpacing / 1.5;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(smallFontSize);
        const termsLines = doc.splitTextToSize(termsPlaceholder, doc.internal.pageSize.getWidth() - pageMargin * 2);
        doc.text(termsLines, pageMargin, yPos);
        yPos += (termsLines.length * (lineSpacing / 2)) + lineSpacing;
        doc.setFontSize(normalFontSize); // Reset
    }

    function addSignatureLines() {
        const signatureY = doc.internal.pageSize.getHeight() - 40 > yPos ? doc.internal.pageSize.getHeight() - 40 : yPos + 20;
        const signatureLineLength = 60;
        const signatureXCliente = pageMargin + (signatureLineLength / 2);
        const signatureXEmpresa = doc.internal.pageSize.getWidth() - pageMargin - (signatureLineLength / 2);

        doc.line(signatureXCliente - (signatureLineLength/2), signatureY, signatureXCliente + (signatureLineLength/2), signatureY);
        doc.text("Firma Cliente", signatureXCliente, signatureY + 5, { align: 'center' });

        doc.line(signatureXEmpresa - (signatureLineLength/2), signatureY, signatureXEmpresa + (signatureLineLength/2), signatureY);
        doc.text(finalCompanyData.name, signatureXEmpresa, signatureY + 5, { align: 'center' });
        yPos = signatureY + 10;
    }

    function addFooter() {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(smallFontSize);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
            doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, pageMargin, doc.internal.pageSize.getHeight() - 5);
        }
    }

    // --- PDF Generation Flow ---
    addPageHeader();
    addDocumentTitle();
    addQuoteClientInfo();
    addItemsTable();
    addTotals();
    addNotesAndTerms();
    addSignatureLines(); // Should be placed considering content length
    addFooter();

    // --- Return PDF Blob ---
    try {
        console.log("PDF content generated, returning as blob.");
        return doc.output('blob');
    } catch (e) {
        console.error("Error generating PDF blob:", e);
        alert("Hubo un error al generar el PDF para su procesamiento. Revise la consola.");
        return null; // Or throw error
    }
}

// Expose the function to be callable from other scripts if not using ES6 modules
// window.generateQuotePDF = generateQuotePDF;
// If cotizaciones.js is also not a module, it can call generateQuotePDF directly if this script is loaded first.
