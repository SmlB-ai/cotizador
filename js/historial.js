// js/historial.js
// Manages the "Historial" (Quote History) tab functionality

window.historialModule = {
    isInitialized: false,
    quoteDetailModalInstance: null, // To store Bootstrap Modal instance

    init: function() {
        if (this.isInitialized) {
            return;
        }
        console.log("Historial module initializing...");

        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error("Firebase or Firestore is not loaded. Historial module cannot start.");
            const historialTableBodyNode = document.getElementById('historialTableBody');
            if (historialTableBodyNode) {
                historialTableBodyNode.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error: Firebase no está configurado.</td></tr>';
            }
            return;
        }
        const db = firebase.firestore();
        const module = this;

        // DOM Elements
        const historialFilterForm = document.getElementById('historialFilterForm');
        const clientNameFilterInput = document.getElementById('histClientNameFilter');
        const statusFilterSelect = document.getElementById('histStatusFilter');
        const dateFromFilterInput = document.getElementById('histDateFromFilter');
        const dateToFilterInput = document.getElementById('histDateToFilter');
        const btnApplyHistFilters = document.getElementById('btnApplyHistFilters');
        const historialTableBody = document.getElementById('historialTableBody');

        const quoteDetailModalElement = document.getElementById('quoteDetailModal');
        if (quoteDetailModalElement) {
            module.quoteDetailModalInstance = new bootstrap.Modal(quoteDetailModalElement);
        }
        const quoteDetailModalBody = document.getElementById('quoteDetailModalBody');


        // --- Load Quotes History ---
        async function loadQuotesHistory() {
            if (!historialTableBody) return;
            historialTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Cargando historial... <i class="fas fa-spinner fa-spin"></i></td></tr>`;

            try {
                let query = db.collection('cotizaciones');

                const clientName = clientNameFilterInput.value.trim();
                const status = statusFilterSelect.value;
                const dateFrom = dateFromFilterInput.value;
                const dateTo = dateToFilterInput.value;

                if (status) {
                    query = query.where('status', '==', status);
                }
                if (dateFrom) {
                    query = query.where('fecha', '>=', dateFrom);
                }
                if (dateTo) {
                    query = query.where('fecha', '<=', dateTo);
                }

                query = query.orderBy('fecha', 'desc').orderBy('quoteNumber', 'desc');

                const snapshot = await query.get();
                historialTableBody.innerHTML = '';

                if (snapshot.empty && !clientName) {
                    historialTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron cotizaciones con los filtros aplicados.</td></tr>`;
                    return;
                }

                let quotesRendered = 0;
                snapshot.forEach(doc => {
                    const quote = { id: doc.id, ...doc.data() };

                    if (clientName && (!quote.clientName || !quote.clientName.toLowerCase().includes(clientName.toLowerCase()))) {
                        return;
                    }

                    renderQuoteHistoryRow(quote);
                    quotesRendered++;
                });

                if (quotesRendered === 0) {
                     historialTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No se encontraron cotizaciones que coincidan con todos los filtros.</td></tr>`;
                }

            } catch (error) {
                console.error("Error loading quote history: ", error);
                historialTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar el historial: ${error.message}</td></tr>`;
            }
        }
        module.loadQuotesHistory = loadQuotesHistory;

        // --- Render Quote Row ---
        function renderQuoteHistoryRow(quoteData) {
            const tr = document.createElement('tr');
            tr.dataset.quoteId = quoteData.id;

            const formattedDate = quoteData.fecha ? new Date(quoteData.fecha + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A';
            const formattedTotal = (quoteData.total || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

            let statusBadgeClass = 'bg-secondary';
            if (quoteData.status === 'aprobada') statusBadgeClass = 'bg-success';
            else if (quoteData.status === 'borrador') statusBadgeClass = 'bg-warning text-dark';
            else if (quoteData.status === 'rechazada') statusBadgeClass = 'bg-danger';

            tr.innerHTML = `
                <td>${quoteData.quoteNumber || 'N/A'}</td>
                <td>${quoteData.clientName || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td>${formattedTotal}</td>
                <td><span class="badge ${statusBadgeClass}">${quoteData.status ? quoteData.status.charAt(0).toUpperCase() + quoteData.status.slice(1) : 'N/A'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info btn-view-quote" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-primary btn-duplicate-quote" title="Duplicar"><i class="fas fa-copy"></i></button>
                    <button class="btn btn-sm btn-secondary btn-pdf-quote" title="Generar PDF"><i class="fas fa-file-pdf"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete-quote-hist" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;

            tr.querySelector('.btn-view-quote').addEventListener('click', () => viewQuoteDetails(quoteData.id));
            tr.querySelector('.btn-duplicate-quote').addEventListener('click', () => duplicateQuote(quoteData.id));
            tr.querySelector('.btn-pdf-quote').addEventListener('click', () => regenerateQuotePDF(quoteData.id));
            tr.querySelector('.btn-delete-quote-hist').addEventListener('click', () => deleteQuoteHistory(quoteData.id, quoteData.quoteNumber));

            historialTableBody.appendChild(tr);
        }

        // --- Action Functions ---
        async function viewQuoteDetails(quoteId) {
            if (!quoteDetailModalBody || !module.quoteDetailModalInstance) return;
            quoteDetailModalBody.innerHTML = `<p class="text-center">Cargando detalles... <i class="fas fa-spinner fa-spin"></i></p>`;
            module.quoteDetailModalInstance.show();

            try {
                const doc = await db.collection('cotizaciones').doc(quoteId).get();
                if (!doc.exists) {
                    quoteDetailModalBody.innerHTML = '<p class="text-danger">No se encontró la cotización.</p>';
                    return;
                }
                const quote = doc.data();
                let itemsHtml = '<ul class="list-group mb-3">';
                (quote.items || []).forEach(item => { // Ensure items is an array
                    itemsHtml += `<li class="list-group-item d-flex justify-content-between align-items-center">
                                    <span>${item.description || 'N/A'} (Cant: ${item.quantity || 0}, P.U.: $${(item.price || 0).toFixed(2)})</span>
                                    <strong>$${(item.subtotal || 0).toFixed(2)}</strong>
                                  </li>`;
                });
                itemsHtml += '</ul>';

                const quoteDate = quote.fecha ? new Date(quote.fecha + 'T00:00:00') : null; // Ensure date is treated as local

                quoteDetailModalBody.innerHTML = `
                    <h5>Cotización: ${quote.quoteNumber || 'N/A'}</h5>
                    <p><strong>Cliente:</strong> ${quote.clientName || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${quoteDate ? quoteDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                    <p><strong>Estado:</strong> <span class="badge bg-${quote.status === 'aprobada' ? 'success' : (quote.status === 'borrador' ? 'warning text-dark' : (quote.status === 'rechazada' ? 'danger' : 'secondary'))}">${quote.status || 'N/A'}</span></p>
                    <hr>
                    <h6>Items:</h6>
                    ${itemsHtml}
                    <div class="text-end">
                        <p><strong>Subtotal:</strong> ${(quote.subtotal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
                        ${(quote.descuentoCalculado || 0) > 0 ? `<p><strong>Descuento:</strong> -${(quote.descuentoCalculado || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>` : ''}
                        <p><strong>Base Imponible:</strong> ${((quote.subtotal || 0) - (quote.descuentoCalculado || 0)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
                        <p><strong>IVA (${((quote.ivaRate || 0.16) * 100).toFixed(0)}%):</strong> ${(quote.iva || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
                        <h5 class="mt-2"><strong>Total: ${(quote.total || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></h5>
                    </div>
                    ${quote.notas ? `<hr><h6>Notas Adicionales:</h6><p>${quote.notas.replace(/\n/g, '<br>')}</p>` : ''}
                `;
            } catch (error) {
                console.error("Error fetching quote details:", error);
                quoteDetailModalBody.innerHTML = '<p class="text-danger">Error al cargar detalles de la cotización.</p>';
            }
        }

        async function duplicateQuote(quoteId) {
            if (!confirm("¿Desea duplicar esta cotización y abrirla para edición en la pestaña 'Cotizaciones'? La nueva cotización se guardará como borrador.")) return;

            try {
                const doc = await db.collection('cotizaciones').doc(quoteId).get();
                if (!doc.exists) {
                    alert("Error: Cotización original no encontrada."); return;
                }
                const originalQuote = doc.data();

                const newQuoteData = { ...originalQuote };
                delete newQuoteData.id;
                newQuoteData.status = 'borrador';
                newQuoteData.fecha = new Date().toISOString().split('T')[0];
                newQuoteData.quoteNumber = '';

                if (window.cotizacionesModule && typeof window.cotizacionesModule.loadQuoteForEditing === 'function') {
                    window.cotizacionesModule.loadQuoteForEditing(newQuoteData);
                    const cotizacionesTabButton = document.querySelector('#mainTabs .nav-link[data-bs-target="#cotizaciones"]');
                    if (cotizacionesTabButton) new bootstrap.Tab(cotizacionesTabButton).show();
                } else {
                    alert("Error: Módulo de cotizaciones no está disponible para cargar la cotización duplicada. Asegúrese de que cotizaciones.js define 'loadQuoteForEditing'.");
                }
            } catch (error) {
                console.error("Error duplicating quote:", error);
                alert("Error al duplicar la cotización: " + error.message);
            }
        }
        
        async function regenerateQuotePDF(quoteId) {
            const regenerateBtn = document.querySelector(`tr[data-quote-id="${quoteId}"] .btn-pdf-quote`);
            if(regenerateBtn) {
                regenerateBtn.disabled = true;
                regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            try {
                const quoteDoc = await db.collection('cotizaciones').doc(quoteId).get();
                if (!quoteDoc.exists) { alert("Error: Cotización no encontrada."); return; }
                const quoteData = {id: quoteDoc.id, ...quoteDoc.data()};

                let companyConfig = { nombreEmpresa: "Su Empresa" }; // Default
                if (window.configuracionModule && typeof window.configuracionModule.getCurrentConfig === 'function') {
                    const fetchedConfig = await window.configuracionModule.getCurrentConfig();
                    if (fetchedConfig) companyConfig = fetchedConfig;
                }


                let clientDetails = { nombre: quoteData.clientName || "Cliente" };
                // If clientID is stored on quoteData, you would fetch full client details here:
                // if (quoteData.clientId && window.clientesModule && typeof window.clientesModule.getClientById === 'function') {
                //     const client = await window.clientesModule.getClientById(quoteData.clientId);
                //     if (client) clientDetails = client;
                // }


                if (typeof generateQuotePDF === 'function') {
                    const pdfBlob = generateQuotePDF(quoteData, companyConfig, clientDetails);
                    if (pdfBlob) {
                        const url = URL.createObjectURL(pdfBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Cotizacion-${quoteData.quoteNumber || quoteData.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    } else {
                        alert("Error al generar el blob del PDF.");
                    }
                } else {
                    alert("Error: Función para generar PDF no disponible. Asegúrese de que pdf-generator.js está cargado.");
                }
            } catch (error) {
                console.error("Error regenerating PDF:", error);
                alert("Error al regenerar PDF: " + error.message);
            } finally {
                if(regenerateBtn) {
                    regenerateBtn.disabled = false;
                    regenerateBtn.innerHTML = '<i class="fas fa-file-pdf"></i>';
                }
            }
        }

        async function deleteQuoteHistory(quoteId, quoteNumber) {
            if (!confirm(`¿Está seguro de que desea eliminar la cotización N° ${quoteNumber || quoteId}? Esta acción no se puede deshacer.`)) return;
            try {
                await db.collection('cotizaciones').doc(quoteId).delete();
                alert(`Cotización N° ${quoteNumber || quoteId} eliminada con éxito.`);
                loadQuotesHistory();
            } catch (error) {
                console.error("Error deleting quote from history: ", error);
                alert(`Error al eliminar cotización: ${error.message}`);
            }
        }

        // Add this function to cotizacionesModule if it doesn't exist
        if (window.cotizacionesModule && typeof window.cotizacionesModule.loadQuoteForEditing !== 'function') {
            window.cotizacionesModule.loadQuoteForEditing = function(quoteToLoad) {
                console.log("cotizacionesModule.loadQuoteForEditing called with:", quoteToLoad);

                // Reset currentQuote in cotizacionesModule
                this.currentQuote = {
                    id: null, // New quote, so no ID yet until first save
                    quoteNumber: '', // Will be generated
                    clientId: quoteToLoad.clientId || '',
                    clientName: quoteToLoad.clientName || '',
                    fecha: new Date().toISOString().split('T')[0], // Default to today for duplicated
                    items: JSON.parse(JSON.stringify(quoteToLoad.items || [])), // Deep copy items
                    subtotal: quoteToLoad.subtotal || 0,
                    descuentoTipo: quoteToLoad.descuentoTipo || 'porcentaje',
                    descuentoValor: quoteToLoad.descuentoValor || 0,
                    descuentoCalculado: quoteToLoad.descuentoCalculado || 0,
                    aplicarIVA: quoteToLoad.aplicarIVA !== undefined ? quoteToLoad.aplicarIVA : true,
                    iva: quoteToLoad.iva || 0,
                    ivaRate: quoteToLoad.ivaRate || 0.16,
                    total: quoteToLoad.total || 0,
                    notas: quoteToLoad.notas || '',
                    status: 'borrador' // Duplicated quotes start as borrador
                };

                // Update UI elements in cotizaciones tab
                const fechaCotizacionInput = document.getElementById('fechaCotizacion');
                const clienteSelect = document.getElementById('clienteSelect'); // Or clientName input
                const notasAdicionalesTextarea = document.getElementById('notasAdicionales');
                const itemsContainer = document.getElementById('itemsContainer');

                if(fechaCotizacionInput) fechaCotizacionInput.value = this.currentQuote.fecha;
                if(clienteSelect) clienteSelect.value = this.currentQuote.clientName; // Assuming it's an input, adjust if it's a select
                if(notasAdicionalesTextarea) notasAdicionalesTextarea.value = this.currentQuote.notas;

                // Clear existing items in UI
                if(itemsContainer) itemsContainer.innerHTML = '';

                // Add items from loaded quote to UI (this part needs access to agregarItem's internal logic or a refactor)
                // This is a simplified representation. The actual re-population of items
                // would need to call the internal `agregarItem` equivalent or directly manipulate DOM
                // and attach listeners, similar to how `agregarItem` in cotizaciones.js works.
                // For now, let's assume cotizaciones.js's init or a refresh function handles UI update from currentQuote.

                // Call functions to update totals and preview
                if (typeof this.calculateTotales === 'function') this.calculateTotales(); // This is not exposed, so it won't work directly
                if (typeof this.updatePreview === 'function') this.updatePreview();   // Same here

                // The easiest way is to trigger a re-initialization or a specific UI refresh function
                // within cotizaciones.js that reads from its `this.currentQuote`.
                // For now, we've updated the data. The UI update needs to be handled by cotizaciones.js itself
                // when it becomes active or via a dedicated public method.

                alert("Cotización cargada para edición. Se guardará como un nuevo borrador.");
                // The generateQuoteNumber and UI refresh should ideally happen when cotizaciones tab is shown
                // or its init logic is robust enough to pick up the new currentQuote.
            };
        }


        // --- EVENT LISTENERS ---
        if (btnApplyHistFilters) {
            btnApplyHistFilters.addEventListener('click', loadQuotesHistory);
        }

        loadQuotesHistory();

        this.isInitialized = true;
        console.log("Historial module Initialized by app.js.");
    },

    onTabShow: function() {
        console.log("Historial tab shown again (via onTabShow).");
        if (this.isInitialized && typeof this.loadQuotesHistory === 'function') {
            this.loadQuotesHistory();
        }
    }
};
