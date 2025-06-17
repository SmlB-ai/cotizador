// js/communication.js
// Manages email communication logic, like preparing and "sending" quotes.

window.communicationModule = {
    isInitialized: false,
    emailQuoteModalInstance: null,
    currentQuoteIdForEmail: null, // To store the quote ID when modal is opened

    init: function() {
        if (this.isInitialized) return;
        console.log("Communication module initializing...");

        if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.storage) {
            console.error("Firebase components not available. Communication module cannot fully start.");
            // We can still initialize the modal UI part
        }

        const module = this;

        // DOM Elements for Email Modal
        const emailModalElement = document.getElementById('emailQuoteModal');
        if (emailModalElement) {
            module.emailQuoteModalInstance = new bootstrap.Modal(emailModalElement);
        }
        const emailToInput = document.getElementById('emailToInput');
        const emailSubjectInput = document.getElementById('emailSubjectInput');
        const emailBodyTextarea = document.getElementById('emailBodyTextarea');
        const sendEmailConfirmButton = document.getElementById('sendEmailConfirmButton'); // Corrected ID based on modal HTML
        const emailQuoteIdInput = document.getElementById('emailQuoteId'); // Hidden input in modal form


        if (sendEmailConfirmButton) {
            sendEmailConfirmButton.addEventListener('click', () => module.processEmailRequest());
        }

        this.isInitialized = true;
        console.log("Communication module initialized.");
    },

    openEmailQuoteModal: async function(quoteId, clientEmail = '', quoteNumber = '', clientName = '') {
        if (!this.emailQuoteModalInstance) {
            console.error("Email modal not initialized.");
            alert("Error: La funcionalidad de email no está disponible.");
            return;
        }
        this.currentQuoteIdForEmail = quoteId;

        const emailToInput = document.getElementById('emailToInput');
        const emailSubjectInput = document.getElementById('emailSubjectInput');
        const emailBodyTextarea = document.getElementById('emailBodyTextarea');
        const emailQuoteIdInput = document.getElementById('emailQuoteId');

        if(emailQuoteIdInput) emailQuoteIdInput.value = quoteId;
        if(emailToInput) emailToInput.value = clientEmail || '';

        let companyName = "Tu Empresa"; // Default
        if (window.configuracionModule && typeof window.configuracionModule.getCurrentConfig === 'function') {
            const currentConfig = await window.configuracionModule.getCurrentConfig(true); // true to force fetch
            if (currentConfig && currentConfig.nombreEmpresa) {
                companyName = currentConfig.nombreEmpresa;
            }
        }

        if(emailSubjectInput) emailSubjectInput.value = `Cotización ${quoteNumber || quoteId} de ${companyName}`;
        if(emailBodyTextarea) {
            emailBodyTextarea.value = `Estimado/a ${clientName || 'Cliente'},\n\nAdjunto encontrará la cotización (${quoteNumber || quoteId}) solicitada.\n\nQuedamos a sus órdenes para cualquier aclaración.\n\nSaludos cordiales,\n${companyName}`;
        }

        this.emailQuoteModalInstance.show();
    },

    processEmailRequest: async function() {
        if (!this.currentQuoteIdForEmail) {
            alert("Error: No se ha especificado una cotización para enviar.");
            return;
        }

        const db = firebase.firestore();
        const storage = firebase.storage();

        const emailToInput = document.getElementById('emailToInput');
        const emailSubjectInput = document.getElementById('emailSubjectInput');
        const emailBodyTextarea = document.getElementById('emailBodyTextarea');

        const toEmail = emailToInput.value.trim();
        const subject = emailSubjectInput.value.trim();
        const body = emailBodyTextarea.value.trim();
        const quoteId = this.currentQuoteIdForEmail;

        if (!toEmail || !subject || !body) {
            alert("Por favor, complete todos los campos del email: Para, Asunto y Mensaje.");
            return;
        }

        // Disable button to prevent multiple clicks
        const sendButton = document.getElementById('sendEmailConfirmButton');
        if(sendButton) sendButton.disabled = true;
        if(sendButton) sendButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';


        try {
            // 1. Fetch Quote Data
            const quoteDoc = await db.collection('cotizaciones').doc(quoteId).get();
            if (!quoteDoc.exists) {
                throw new Error("Cotización no encontrada en la base de datos.");
            }
            const quoteData = { id: quoteDoc.id, ...quoteDoc.data() };

            // 2. Fetch Company Config
            let companyConfig = { nombreEmpresa: "Tu Empresa" }; // Default
            if (window.configuracionModule && typeof window.configuracionModule.getCurrentConfig === 'function') {
                const fetchedConfig = await window.configuracionModule.getCurrentConfig(true);
                if (fetchedConfig) companyConfig = fetchedConfig;
            }

            // 3. Fetch Client Details (simplified, assumes clientName is on quoteData for now)
            let clientDetails = { nombre: quoteData.clientName || "Cliente" };
            if (quoteData.clienteId && window.clientesModule && typeof window.clientesModule.getClientById === 'function') {
                // This function would need to be added to clientesModule
                // const client = await window.clientesModule.getClientById(quoteData.clienteId);
                // if (client) clientDetails = client;
            }

            // 4. Generate PDF in memory
            if (typeof generateQuotePDF !== 'function') {
                throw new Error("La función generateQuotePDF no está disponible.");
            }
            const { jsPDF } = window.jspdf; // Ensure jsPDF is available
            const pdfDoc = new jsPDF(); // Create a new instance for the PDF generation
            // Call the global generateQuotePDF, but it needs to be adapted to return the doc or blob, not save.
            // For now, let's assume generateQuotePDF is modified or we have a new function.
            // This is a conceptual placeholder for getting the PDF blob.
            // The actual generateQuotePDF needs to be refactored to support outputting blob/datauristring.

            // --- Conceptual refactor of generateQuotePDF for this use case ---
            // Option A: Modify generateQuotePDF to accept an outputType parameter.
            // Option B: Create a new function like getQuotePDFBlob(quoteData, companyData, clientData)
            // For this step, we'll simulate getting the blob after calling a modified generateQuotePDF.

            // Generate PDF (now returns a blob)
            const pdfBlob = generateQuotePDF(quoteData, companyConfig, clientDetails);

            if (!pdfBlob) {
                throw new Error("Falló la generación del PDF (retornó null).");
            }
            console.log("PDF Blob generated. Size:", pdfBlob.size);

            // 5. Upload PDF to Firebase Storage
            const filePath = `quote_emails/${quoteId}/${new Date().getTime()}_${quoteData.quoteNumber || 'cotizacion'}.pdf`;
            const uploadTask = storage.ref(filePath).put(pdfBlob);

            await uploadTask;
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            console.log("PDF uploaded to Firebase Storage:", downloadURL);

            // 6. Prepare data for Cloud Function
            const functionData = {
                quoteId: quoteId,
                toEmail: toEmail,
                subject: subject,
                body: body,
                pdfDownloadUrl: downloadURL,
                companyName: companyConfig.nombreEmpresa,
                clientName: clientDetails.nombre
                // You might want to pass more company/client details to the CF
            };

            // 7. Simulate Cloud Function Call
            console.log("Simulating call to Firebase Cloud Function 'sendQuoteEmail' with data:", functionData);
            // Actual call would be:
            // const sendEmailFunction = firebase.functions().httpsCallable('sendQuoteEmail');
            // await sendEmailFunction(functionData);

            alert("Simulación: Email preparado y PDF subido. Se requiere una Cloud Function 'sendQuoteEmail' para el envío real.\n\nPara: " + toEmail + "\nAsunto: " + subject + "\nURL del PDF (simulado): " + downloadURL);

            if (this.emailQuoteModalInstance) this.emailQuoteModalInstance.hide();

        } catch (error) {
            console.error("Error processing email request: ", error);
            alert(`Error al preparar el email: ${error.message}`);
        } finally {
            if(sendButton) sendButton.disabled = false;
            if(sendButton) sendButton.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Enviar Email';
        }
    }
};

// Initialize the module in app.js
// document.addEventListener('DOMContentLoaded', () => {
//     if (window.communicationModule && typeof window.communicationModule.init === 'function') {
//         window.communicationModule.init();
//     }
// });
