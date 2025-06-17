// js/calculadoras.js
// Manages the "Calculadoras" tab functionality

window.calculadorasModule = {
    isInitialized: false,
    drywallCalculatedResults: null, // To store results from drywall calculation

    init: function() {
        if (this.isInitialized) {
            return;
        }
        console.log("Calculadoras module initializing...");

        const module = this;
        module.drywallCalculatedResults = null; // Ensure reset on init
        module.pinturaCalculatedResults = null; // For pintura calculator

        // DOM Elements for Drywall Calculator
        const drywallLargoInput = document.getElementById('drywallLargo');
        const drywallAnchoInput = document.getElementById('drywallAncho');
        const drywallAltoInput = document.getElementById('drywallAlto');
        const drywallWasteInput = document.getElementById('drywallWaste');
        const btnCalculateDrywall = document.getElementById('btnCalculateDrywall');
        const drywallResultsDiv = document.getElementById('drywallResults');
        const btnAddDrywallToQuote = document.getElementById('btnAddDrywallToQuote');

        // DOM Elements for Pintura Calculator
        const pinturaAreaInput = document.getElementById('pinturaArea');
        const pinturaManosInput = document.getElementById('pinturaManos');
        const pinturaRendimientoInput = document.getElementById('pinturaRendimiento');
        const btnCalculatePintura = document.getElementById('btnCalculatePintura');
        const pinturaResultsDiv = document.getElementById('pinturaResults');
        const btnAddPinturaToQuote = document.getElementById('btnAddPinturaToQuote');

        // DOM Elements for Concreto Calculator
        const concretoLargoInput = document.getElementById('concretoLargo');
        const concretoAnchoInput = document.getElementById('concretoAncho');
        const concretoEspesorInput = document.getElementById('concretoEspesor');
        const concretoWasteInput = document.getElementById('concretoWaste');
        const concretoIncluirMallaCheckbox = document.getElementById('concretoIncluirMalla');
        const concretoDesgloseComponentesCheckbox = document.getElementById('concretoDesgloseComponentes');
        const btnCalculateConcreto = document.getElementById('btnCalculateConcreto');
        const concretoResultsDiv = document.getElementById('concretoResults');
        const btnAddConcretoToQuote = document.getElementById('btnAddConcretoToQuote');

        // DOM Elements for Electrica Calculator
        const electricaTipoInstalacionSelect = document.getElementById('electricaTipoInstalacion');
        const electricaMetrosCanalizacionInput = document.getElementById('electricaMetrosCanalizacion');
        const electricaNumSalidasInput = document.getElementById('electricaNumSalidas');
        // const electricaNumCircuitosInput = document.getElementById('electricaNumCircuitos'); // Optional
        const btnCalculateElectrica = document.getElementById('btnCalculateElectrica');
        const electricaResultsDiv = document.getElementById('electricaResults');
        const btnAddElectricaToQuote = document.getElementById('btnAddElectricaToQuote');

        // DOM Elements for Electrica Calculator (already added in previous diff by mistake, ensuring they are covered)
        const electricaTipoInstalacionSelect = document.getElementById('electricaTipoInstalacion');
        const electricaMetrosCanalizacionInput = document.getElementById('electricaMetrosCanalizacion');
        const electricaNumSalidasInput = document.getElementById('electricaNumSalidas');
        const btnCalculateElectrica = document.getElementById('btnCalculateElectrica');
        const electricaResultsDiv = document.getElementById('electricaResults');
        const btnAddElectricaToQuote = document.getElementById('btnAddElectricaToQuote');


        // Sub-navigation tab handling
        const calculatorTabs = document.querySelectorAll('#calculatorsSubNav .nav-link');
        calculatorTabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', function(event) {
                console.log(`Calculator sub-tab shown: ${event.target.id}`);
                // Reset results when switching calculator types
                if (drywallResultsDiv) drywallResultsDiv.innerHTML = '';
                if (btnAddDrywallToQuote) btnAddDrywallToQuote.disabled = true;
                module.drywallCalculatedResults = null;

                if (pinturaResultsDiv) pinturaResultsDiv.innerHTML = '';
                if (btnAddPinturaToQuote) btnAddPinturaToQuote.disabled = true;
                module.pinturaCalculatedResults = null;

                if (concretoResultsDiv) concretoResultsDiv.innerHTML = '';
                if (btnAddConcretoToQuote) btnAddConcretoToQuote.disabled = true;
                module.concretoCalculatedResults = null;

                if (electricaResultsDiv) electricaResultsDiv.innerHTML = '';
                if (btnAddElectricaToQuote) btnAddElectricaToQuote.disabled = true;
                module.electricaCalculatedResults = null;

            });
        });

        // --- Drywall Calculator Logic ---
        function calculateDrywall() {
            if (!drywallLargoInput || !drywallAnchoInput || !drywallAltoInput || !drywallWasteInput || !drywallResultsDiv || !btnAddDrywallToQuote) {
                console.error("Missing Drywall DOM elements."); return;
            }
            const largo = parseFloat(drywallLargoInput.value);
            const ancho = parseFloat(drywallAnchoInput.value);
            const alto = parseFloat(drywallAltoInput.value);
            const wastePercentage = parseFloat(drywallWasteInput.value) / 100;

            if (isNaN(largo) || isNaN(ancho) || isNaN(alto) || largo <= 0 || ancho <= 0 || alto <= 0) {
                alert("Drywall: Ingrese dimensiones válidas para la habitación (Largo, Ancho, Alto).");
                return;
            }

            const panelArea = 1.22 * 2.44;
            const areaParedesLargos = 2 * largo * alto;
            const areaParedesAnchos = 2 * ancho * alto;
            const areaTecho = largo * ancho;
            const totalAreaDrywallNeto = areaParedesLargos + areaParedesAnchos + areaTecho;
            const totalAreaDrywallConDesperdicio = totalAreaDrywallNeto * (1 + wastePercentage);
            const numPaneles = Math.ceil(totalAreaDrywallConDesperdicio / panelArea);
            const perimetro = 2 * (largo + ancho);
            const separacionPostes = 0.60;
            const numPostesParedes = Math.ceil(perimetro / separacionPostes) + 4;
            const numPostesTotal = numPostesParedes;
            const numCanales = Math.ceil(perimetro * 2 / 3.05) + Math.ceil(largo / 3.05) * 2 + Math.ceil(ancho / 3.05) * 2 ;
            const tornillosPorPanel = 32;
            const numTornillosDrywall = numPaneles * tornillosPorPanel;
            const numTornillosEstructura = numPostesTotal * 4;
            const metrosCinta = Math.ceil(totalAreaDrywallNeto * 0.75);
            const kgCompuesto = Math.ceil(totalAreaDrywallNeto * 0.8);

            module.drywallCalculatedResults = {
                paneles: { RAPS: numPaneles, description: "Paneles de Drywall Estándar (1.22x2.44m)", unit: "pza" },
                postes: { RAPS: numPostesTotal, description: "Postes Metálicos (ej. 6.35cm x 2.44m)", unit: "pza" },
                canales: { RAPS: numCanales, description: "Canales Metálicos (ej. 6.35cm x 3.05m)", unit: "pza" },
                tornillosDrywall: { RAPS: numTornillosDrywall, description: "Tornillos para Drywall (ej. 1 1/4\")", unit: "pza" },
                tornillosEstructura: { RAPS: numTornillosEstructura, description: "Tornillos para Estructura Metálica (ej. punta broca)", unit: "pza" },
                cinta: { RAPS: metrosCinta, description: "Cinta para Juntas de Drywall", unit: "mts" },
                compuesto: { RAPS: kgCompuesto, description: "Compuesto para Juntas (Pasta)", unit: "kg" }
            };

            drywallResultsDiv.innerHTML = `
                <h5>Resultados Estimados (Drywall):</h5>
                <ul class="list-group">
                    <li class="list-group-item"><strong>Paneles de Drywall (1.22x2.44m):</strong> ${numPaneles} pzas</li>
                    <li class="list-group-item"><strong>Postes Metálicos (aprox.):</strong> ${numPostesTotal} pzas</li>
                    <li class="list-group-item"><strong>Canales Metálicos (aprox.):</strong> ${numCanales} pzas</li>
                    <li class="list-group-item"><strong>Tornillos para Drywall:</strong> ${numTornillosDrywall} pzas (aprox.)</li>
                    <li class="list-group-item"><strong>Tornillos para Estructura:</strong> ${numTornillosEstructura} pzas (aprox.)</li>
                    <li class="list-group-item"><strong>Cinta para Juntas:</strong> ${metrosCinta} mts (aprox.)</li>
                    <li class="list-group-item"><strong>Compuesto para Juntas:</strong> ${kgCompuesto} kg (aprox.)</li>
                </ul>
                <small class="form-text text-muted mt-2">Nota: Estimaciones para muros y techo. No incluye aberturas. Consulte a un profesional.</small>
            `;
            btnAddDrywallToQuote.disabled = false;
        }

        function addDrywallResultsToQuote() {
            if (!module.drywallCalculatedResults) {
                alert("Drywall: Primero calcule los materiales.");
                return;
            }
            if (!window.cotizacionesModule || typeof window.cotizacionesModule.addItemsToCurrentQuote !== 'function') {
                alert("Error: Módulo de cotizaciones no disponible."); return;
            }
            const itemsToAdd = Object.values(module.drywallCalculatedResults).map(result => ({
                description: result.description, quantity: result.RAPS, price: 0, unit: result.unit, subtotal: 0
            }));
            window.cotizacionesModule.addItemsToCurrentQuote(itemsToAdd);
            const cotizacionesTabButton = document.querySelector('#mainTabs .nav-link[data-bs-target="#cotizaciones"]');
            if (cotizacionesTabButton) new bootstrap.Tab(cotizacionesTabButton).show();
            alert("Materiales de Drywall agregados a la cotización. Revise precios.");
        }

        // --- Pintura Calculator Logic ---
        function calculatePintura() {
            if (!pinturaAreaInput || !pinturaManosInput || !pinturaRendimientoInput || !pinturaResultsDiv || !btnAddPinturaToQuote) {
                console.error("Missing Pintura DOM elements."); return;
            }
            const area = parseFloat(pinturaAreaInput.value);
            const manos = parseInt(pinturaManosInput.value);
            const rendimiento = parseFloat(pinturaRendimientoInput.value); // m^2 per Litro

            if (isNaN(area) || area <= 0 || isNaN(manos) || manos <= 0 || isNaN(rendimiento) || rendimiento <= 0) {
                alert("Pintura: Ingrese valores válidos (Área, Manos, Rendimiento).");
                return;
            }

            const totalAreaACubrir = area * manos;
            const litrosPintura = Math.ceil(totalAreaACubrir / rendimiento);
            // Primer/Sellador: e.g., 50% of paint needed, or specific rendimiento for primer
            const rendimientoSellador = rendimiento * 1.5; // Assuming primer covers more
            const litrosSellador = Math.ceil(area / rendimientoSellador); // Primer is usually one coat on raw area

            module.pinturaCalculatedResults = {
                pintura: { RAPS: litrosPintura, description: `Pintura Vinílica (${manos} manos)`, unit: "Lts" },
                sellador: { RAPS: litrosSellador, description: "Sellador Vinílico", unit: "Lts" },
                accesorios: { RAPS: 1, description: "Kit Básico de Pintura (Rodillo, Brocha, Charola)", unit: "kit" }
            };

            pinturaResultsDiv.innerHTML = `
                <h5>Resultados Estimados (Pintura):</h5>
                <ul class="list-group">
                    <li class="list-group-item"><strong>Litros de Pintura:</strong> ${litrosPintura} Lts</li>
                    <li class="list-group-item"><strong>Litros de Sellador/Primer:</strong> ${litrosSellador} Lts</li>
                    <li class="list-group-item"><strong>Accesorios:</strong> 1 Kit básico</li>
                </ul>
                <small class="form-text text-muted mt-2">Nota: Estimación basada en rendimiento y manos especificadas. No incluye desperdicio adicional.</small>
            `;
            btnAddPinturaToQuote.disabled = false;
        }

        function addPinturaResultsToQuote() {
            if (!module.pinturaCalculatedResults) {
                alert("Pintura: Primero calcule los materiales.");
                return;
            }
            if (!window.cotizacionesModule || typeof window.cotizacionesModule.addItemsToCurrentQuote !== 'function') {
                alert("Error: Módulo de cotizaciones no disponible."); return;
            }
            const itemsToAdd = Object.values(module.pinturaCalculatedResults).map(result => ({
                description: result.description, quantity: result.RAPS, price: 0, unit: result.unit, subtotal: 0
            }));
            window.cotizacionesModule.addItemsToCurrentQuote(itemsToAdd);
            const cotizacionesTabButton = document.querySelector('#mainTabs .nav-link[data-bs-target="#cotizaciones"]');
            if (cotizacionesTabButton) new bootstrap.Tab(cotizacionesTabButton).show();
            alert("Materiales de Pintura agregados a la cotización. Revise precios.");
        }

        // --- Concreto Calculator Logic ---
        function calculateConcreto() {
            if (!concretoLargoInput || !concretoAnchoInput || !concretoEspesorInput || !concretoWasteInput || !concretoResultsDiv || !btnAddConcretoToQuote) {
                console.error("Missing Concreto DOM elements."); return;
            }
            const largo = parseFloat(concretoLargoInput.value);
            const ancho = parseFloat(concretoAnchoInput.value);
            const espesorCm = parseFloat(concretoEspesorInput.value);
            const wastePercentage = parseFloat(concretoWasteInput.value) / 100;
            const incluirMalla = concretoIncluirMallaCheckbox.checked;
            const desgloseComponentes = concretoDesgloseComponentesCheckbox.checked;

            if (isNaN(largo) || largo <= 0 || isNaN(ancho) || ancho <= 0 || isNaN(espesorCm) || espesorCm <= 0) {
                alert("Concreto: Ingrese Largo, Ancho y Espesor válidos.");
                return;
            }
            const espesorM = espesorCm / 100; // Convert cm to meters

            const volumenNeto = largo * ancho * espesorM;
            const volumenTotalConcreto = volumenNeto * (1 + wastePercentage);

            module.concretoCalculatedResults = {};
            let resultsHTML = `<h5>Resultados Estimados (Concreto):</h5><ul class="list-group">`;
            resultsHTML += `<li class="list-group-item"><strong>Volumen Total de Concreto:</strong> ${volumenTotalConcreto.toFixed(3)} m³</li>`;
            module.concretoCalculatedResults.concretoPremezclado = { RAPS: parseFloat(volumenTotalConcreto.toFixed(3)), description: `Concreto Premezclado (Resistencia por especificar)`, unit: "m³" };

            if (desgloseComponentes) {
                // Ratio 1:2:3 (Cemento:Arena:Grava) by volume. Total parts = 6.
                // Densities (approx kg/m^3): Cemento ~1440, Arena ~1600, Grava ~1550
                // Factor de conversion de volumen de mezcla a volumen seco de componentes (aprox 1.54 para concreto)
                const factorExpansion = 1.54;
                const volumenSecoTotal = volumenTotalConcreto * factorExpansion;

                const volCemento = (volumenSecoTotal / 6) * 1;
                const volArena = (volumenSecoTotal / 6) * 2;
                const volGrava = (volumenSecoTotal / 6) * 3;

                // Convert cemento a kg y luego a sacos (ej. 50kg/saco)
                const kgCemento = volCemento * 1440; // densidad cemento
                const sacosCemento = Math.ceil(kgCemento / 50);

                resultsHTML += `<li class="list-group-item ms-3"><em>Desglose (Ratio 1:2:3):</em></li>`;
                resultsHTML += `<li class="list-group-item ms-3">- Cemento: ${sacosCemento} sacos (50kg) (aprox. ${kgCemento.toFixed(2)} kg)</li>`;
                resultsHTML += `<li class="list-group-item ms-3">- Arena: ${volArena.toFixed(3)} m³</li>`;
                resultsHTML += `<li class="list-group-item ms-3">- Grava: ${volGrava.toFixed(3)} m³</li>`;
                // For adding to quote, we might add these instead of pre-mixed if desglose is checked
                module.concretoCalculatedResults = {}; // Reset if desglose
                module.concretoCalculatedResults.cemento = { RAPS: sacosCemento, description: "Cemento Gris (saco 50kg)", unit: "saco" };
                module.concretoCalculatedResults.arena = { RAPS: parseFloat(volArena.toFixed(3)), description: "Arena para construcción", unit: "m³" };
                module.concretoCalculatedResults.grava = { RAPS: parseFloat(volGrava.toFixed(3)), description: "Grava para construcción", unit: "m³" };
            }

            if (incluirMalla) {
                const areaMalla = largo * ancho * (1 + 0.10); // 10% waste/overlap for mesh
                resultsHTML += `<li class="list-group-item"><strong>Malla Electrosoldada (6x6, 10/10):</strong> ${areaMalla.toFixed(2)} m²</li>`;
                module.concretoCalculatedResults.malla = { RAPS: parseFloat(areaMalla.toFixed(2)), description: "Malla Electrosoldada 6x6 (10/10 o similar)", unit: "m²" };
            }
            resultsHTML += `</ul><small class="form-text text-muted mt-2">Nota: Estimaciones. El desglose de componentes es aproximado y depende de la calidad de los agregados y resistencia deseada.</small>`;
            concretoResultsDiv.innerHTML = resultsHTML;
            btnAddConcretoToQuote.disabled = false;
        }

        function addConcretoResultsToQuote() {
            if (!module.concretoCalculatedResults || Object.keys(module.concretoCalculatedResults).length === 0) {
                alert("Concreto: Primero calcule los materiales.");
                return;
            }
            if (!window.cotizacionesModule || typeof window.cotizacionesModule.addItemsToCurrentQuote !== 'function') {
                alert("Error: Módulo de cotizaciones no disponible."); return;
            }
            const itemsToAdd = Object.values(module.concretoCalculatedResults).map(result => ({
                description: result.description, quantity: result.RAPS, price: 0, unit: result.unit, subtotal: 0
            }));
            window.cotizacionesModule.addItemsToCurrentQuote(itemsToAdd);
            const cotizacionesTabButton = document.querySelector('#mainTabs .nav-link[data-bs-target="#cotizaciones"]');
            if (cotizacionesTabButton) new bootstrap.Tab(cotizacionesTabButton).show();
            alert("Materiales de Concreto agregados a la cotización. Revise precios.");
        }


        // --- Event Listeners ---
        if (btnCalculateDrywall) btnCalculateDrywall.addEventListener('click', calculateDrywall);
        if (btnAddDrywallToQuote) btnAddDrywallToQuote.addEventListener('click', addDrywallResultsToQuote);

        if (btnCalculatePintura) btnCalculatePintura.addEventListener('click', calculatePintura);
        if (btnAddPinturaToQuote) btnAddPinturaToQuote.addEventListener('click', addPinturaResultsToQuote);

        if (btnCalculateConcreto) btnCalculateConcreto.addEventListener('click', calculateConcreto);
        if (btnAddConcretoToQuote) btnAddConcretoToQuote.addEventListener('click', addConcretoResultsToQuote);

        if (btnCalculateElectrica) btnCalculateElectrica.addEventListener('click', calculateElectrica); // Listener was already added in previous file content
        if (btnAddElectricaToQuote) btnAddElectricaToQuote.addEventListener('click', addElectricaResultsToQuote); // Listener was already added

        // Temporary addItemsToCurrentQuote in cotizacionesModule (should be moved to cotizaciones.js)
        if (window.cotizacionesModule && typeof window.cotizacionesModule.addItemsToCurrentQuote !== 'function') {
            window.cotizacionesModule.addItemsToCurrentQuote = function(itemsArray) {
                if (!this.currentQuote || !this.currentQuote.items) { console.error("currentQuote not found in cotizacionesModule"); return; }
                itemsArray.forEach(item => {
                    const newItemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    this.currentQuote.items.push({
                        id: newItemId, description: item.description, quantity: item.quantity,
                        price: item.price || 0, unit: item.unit || 'pza',
                        subtotal: (item.quantity || 0) * (item.price || 0)
                    });
                });
                console.log("Items added by Calculadoras (temp function):", this.currentQuote.items);
                alert(`${itemsArray.length} item(s) agregados al modelo de datos. Refresque la UI de Cotizaciones manualmente o implemente refreshQuoteUI.`);
            };
             console.warn("Using temporary addItemsToCurrentQuote from calculadoras.js. This should be in cotizaciones.js.");
        }

        this.isInitialized = true;
        console.log("Calculadoras module Initialized by app.js.");
    },

    onTabShow: function() {
        console.log("Calculadoras tab shown again (via onTabShow).");
        // Reset all calculator forms and results to ensure a clean state when tab is revisited
        const drywallResultsDiv = document.getElementById('drywallResults');
        if (drywallResultsDiv) drywallResultsDiv.innerHTML = '';
        const btnAddDrywallToQuote = document.getElementById('btnAddDrywallToQuote');
        if (btnAddDrywallToQuote) btnAddDrywallToQuote.disabled = true;
        this.drywallCalculatedResults = null;

        const pinturaResultsDiv = document.getElementById('pinturaResults');
        if (pinturaResultsDiv) pinturaResultsDiv.innerHTML = '';
        const btnAddPinturaToQuote = document.getElementById('btnAddPinturaToQuote');
        if (btnAddPinturaToQuote) btnAddPinturaToQuote.disabled = true;
        this.pinturaCalculatedResults = null;

        const concretoResultsDiv = document.getElementById('concretoResults');
        if (concretoResultsDiv) concretoResultsDiv.innerHTML = '';
        const btnAddConcretoToQuote = document.getElementById('btnAddConcretoToQuote');
        if (btnAddConcretoToQuote) btnAddConcretoToQuote.disabled = true;
        this.concretoCalculatedResults = null;

        const electricaResultsDiv = document.getElementById('electricaResults');
        if (electricaResultsDiv) electricaResultsDiv.innerHTML = '';
        const btnAddElectricaToQuote = document.getElementById('btnAddElectricaToQuote');
        if (btnAddElectricaToQuote) btnAddElectricaToQuote.disabled = true;
        this.electricaCalculatedResults = null; // Resetting this again, ensuring it's covered.
    }
};
