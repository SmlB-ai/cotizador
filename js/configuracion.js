// js/configuracion.js
// Manages the "Configuración" tab functionality

window.configuracionModule = {
    isInitialized: false,
    selectedLogoFile: null, // To store the selected logo file object

    init: function() {
        if (this.isInitialized) {
            // console.log("Configuracion module already initialized.");
            return;
        }
        console.log("Configuracion module initializing...");

        if (typeof firebase === 'undefined' || !firebase.firestore || !firebase.storage) {
            console.error("Firebase, Firestore, or Storage is not loaded. Configuracion module cannot start.");
            // Optionally display an error message in the UI
            return;
        }
        const db = firebase.firestore();
        const storage = firebase.storage();
        const module = this;

        // DOM Elements
        const configForm = document.getElementById('configForm');
        const configCompanyNameInput = document.getElementById('configCompanyName');
        const configCompanyRfcInput = document.getElementById('configCompanyRfc');
        const configCompanyAddressTextarea = document.getElementById('configCompanyAddress');
        const configCompanyPhoneInput = document.getElementById('configCompanyPhone');
        const configCompanyEmailInput = document.getElementById('configCompanyEmail');

        const companyLogoInput = document.getElementById('companyLogoInput');
        const companyLogoPreview = document.getElementById('companyLogoPreview');
        const currentLogoUrlInput = document.getElementById('currentLogoUrl'); // Hidden input

        const defaultIvaRateInput = document.getElementById('defaultIvaRate');
        const termsConditionsTextarea = document.getElementById('termsConditionsInput');
        const bankDetailsTextarea = document.getElementById('bankDetailsInput');
        // const btnSaveConfiguration = document.getElementById('btnSaveConfiguration'); // Form submit handles this

        const CONFIG_DOC_ID = 'empresaDetails'; // Fixed ID for the configuration document

        // --- Logo Preview ---
        function previewLogo(event) {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // Max 2MB
                    alert("El archivo del logo es demasiado grande. Máximo 2MB.");
                    companyLogoInput.value = ""; // Reset file input
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    companyLogoPreview.src = e.target.result;
                    module.selectedLogoFile = file; // Store file object for upload
                }
                reader.readAsDataURL(file);
            } else {
                 // If no file selected or selection cancelled, revert to current logo or placeholder
                companyLogoPreview.src = currentLogoUrlInput.value || 'https://via.placeholder.com/200x100.png?text=Vista+Previa+Logo';
                module.selectedLogoFile = null;
            }
        }
        if (companyLogoInput) companyLogoInput.addEventListener('change', previewLogo);

        // --- Load Configuration ---
        async function loadConfiguration() {
            console.log("Loading configuration...");
            try {
                const doc = await db.collection('configuracion').doc(CONFIG_DOC_ID).get();
                if (doc.exists) {
                    const config = doc.data();
                    if (configCompanyNameInput) configCompanyNameInput.value = config.nombreEmpresa || '';
                    if (configCompanyRfcInput) configCompanyRfcInput.value = config.rfcEmpresa || '';
                    if (configCompanyAddressTextarea) configCompanyAddressTextarea.value = config.direccionEmpresa || '';
                    if (configCompanyPhoneInput) configCompanyPhoneInput.value = config.telefonoEmpresa || '';
                    if (configCompanyEmailInput) configCompanyEmailInput.value = config.emailEmpresa || '';

                    if (defaultIvaRateInput) defaultIvaRateInput.value = config.defaultIva !== undefined ? config.defaultIva : '';
                    if (termsConditionsTextarea) termsConditionsTextarea.value = config.terminosCondiciones || '';
                    if (bankDetailsTextarea) bankDetailsTextarea.value = config.datosBancarios || '';

                    if (companyLogoPreview && config.logoUrl) {
                        companyLogoPreview.src = config.logoUrl;
                        currentLogoUrlInput.value = config.logoUrl; // Store for reference
                    } else if (companyLogoPreview) {
                        companyLogoPreview.src = 'https://via.placeholder.com/200x100.png?text=Vista+Previa+Logo';
                        currentLogoUrlInput.value = '';
                    }
                    console.log("Configuration loaded into form.");
                } else {
                    console.log("No existing configuration found. Displaying defaults.");
                    if (companyLogoPreview) companyLogoPreview.src = 'https://via.placeholder.com/200x100.png?text=Vista+Previa+Logo';
                }
            } catch (error) {
                console.error("Error loading configuration: ", error);
                alert("Error al cargar la configuración: " + error.message);
            }
        }
        module.loadConfiguration = loadConfiguration; // Expose for onTabShow or manual refresh

        // --- Save Configuration ---
        async function saveConfiguration(event) {
            event.preventDefault();
            console.log("Attempting to save configuration...");

            const nombreEmpresa = configCompanyNameInput.value.trim();
            const defaultIva = parseFloat(defaultIvaRateInput.value);

            if (!nombreEmpresa || isNaN(defaultIva) || defaultIva < 0) {
                alert("Nombre de la Empresa y Tasa de IVA son campos obligatorios. IVA no puede ser negativo.");
                return;
            }

            const configData = {
                nombreEmpresa: nombreEmpresa,
                rfcEmpresa: configCompanyRfcInput.value.trim(),
                direccionEmpresa: configCompanyAddressTextarea.value.trim(),
                telefonoEmpresa: configCompanyPhoneInput.value.trim(),
                emailEmpresa: configCompanyEmailInput.value.trim(),
                defaultIva: defaultIva,
                terminosCondiciones: termsConditionsTextarea.value.trim(),
                datosBancarios: bankDetailsTextarea.value.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                // Handle Logo Upload
                if (module.selectedLogoFile) {
                    const logoFile = module.selectedLogoFile;
                    const logoPath = `logos/${CONFIG_DOC_ID}_company_logo.${logoFile.name.split('.').pop()}`;
                    const logoStorageRef = storage.ref(logoPath);

                    console.log(`Uploading logo to: ${logoPath}`);
                    const uploadTask = logoStorageRef.put(logoFile);

                    await uploadTask; // Wait for upload to complete
                    configData.logoUrl = await uploadTask.snapshot.ref.getDownloadURL();
                    console.log("Logo uploaded successfully. URL:", configData.logoUrl);
                    module.selectedLogoFile = null; // Reset after upload
                    if(currentLogoUrlInput) currentLogoUrlInput.value = configData.logoUrl;
                } else if (currentLogoUrlInput.value) {
                    // No new file selected, keep existing logo URL if one exists
                    configData.logoUrl = currentLogoUrlInput.value;
                } else {
                    configData.logoUrl = null; // No new logo and no existing one
                }

                await db.collection('configuracion').doc(CONFIG_DOC_ID).set(configData, { merge: true });
                alert('Configuración guardada con éxito.');
                console.log("Configuration saved.");

            } catch (error) {
                console.error("Error saving configuration: ", error);
                alert(`Error al guardar la configuración: ${error.message}`);
            }
        }

        // --- EVENT LISTENERS ---
        if (configForm) configForm.addEventListener('submit', saveConfiguration);

        loadConfiguration(); // Initial load

        // Apply role-based UI access if role is already known
        if (window.currentUserRole) {
            module.updateUIAccess(window.currentUserRole);
        }

        this.isInitialized = true;
        console.log("Configuracion module Initialized by app.js.");
    },

    updateUIAccess: function(role) {
        console.log("Configuracion module updating UI access for role:", role);
        const isAdmin = (role === 'admin');

        // Cache elements if not already done, or ensure they are accessible
        const configForm = document.getElementById('configForm'); // The form itself
        const btnSaveConfiguration = document.getElementById('btnSaveConfiguration');
        const companyLogoInput = document.getElementById('companyLogoInput');

        if (btnSaveConfiguration) btnSaveConfiguration.disabled = !isAdmin;
        if (companyLogoInput) companyLogoInput.disabled = !isAdmin;

        // Make all form inputs read-only if not admin
        if (configForm) {
            const inputs = configForm.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                // Don't disable the file input itself as it might prevent preview,
                // but the save button being disabled is the main control.
                // Or, disable it if there's no separate 'edit/cancel' mode for viewing.
                if (input.id !== 'companyLogoInput') { // Keep logo input enabled for preview, save is disabled
                     input.readOnly = !isAdmin;
                }
                 if(input.type === 'select-one' || input.type === 'checkbox' || input.type === 'file') {
                    input.disabled = !isAdmin; // Selects and checkboxes use 'disabled'
                }
            });
        }

        // You could also add a visual cue, like a banner if user is not admin
        let noticeDiv = document.getElementById('adminNoticeConfig');
        if (!noticeDiv && !isAdmin && document.getElementById('configForm')) {
            noticeDiv = document.createElement('div');
            noticeDiv.id = 'adminNoticeConfig';
            noticeDiv.className = 'alert alert-warning mt-2';
            noticeDiv.textContent = 'Los campos de configuración solo pueden ser modificados por un administrador.';
            document.getElementById('configForm').insertAdjacentElement('beforebegin', noticeDiv);
        } else if (noticeDiv && isAdmin) {
            noticeDiv.remove();
        }


    },

    onTabShow: function() {
        console.log("Configuracion tab shown again (via onTabShow).");
        if (this.isInitialized) {
            if (typeof this.loadConfiguration === 'function') this.loadConfiguration();
            if (typeof this.updateUIAccess === 'function' && window.currentUserRole !== undefined) {
                this.updateUIAccess(window.currentUserRole);
            }
        }
    },

    // Method to get the current configuration data (might be from a cached object)
    // The `loadConfiguration` function already fetches and populates form fields.
    // We need a way to access this data, perhaps by storing it on the module when loaded.
    // Let's modify loadConfiguration to store it and add getCurrentConfig.

    // currentConfigData: null, // Add this near isInitialized
    // Modify loadConfiguration to set this.currentConfigData
    // Then getCurrentConfig can return it.

    // For this diff, I'll just add getCurrentConfig assuming currentConfigData is populated.
    // A more complete solution would involve ensuring this.currentConfigData is set in loadConfiguration.
    // For now, it will primarily fetch if not already available or if forced.

    currentConfigData: null, // To cache loaded config

    getCurrentConfig: async function(forceFetch = false) {
        if (!this.isInitialized && typeof this.init === 'function') this.init(); // Ensure initialized

        if (!forceFetch && this.currentConfigData) {
            console.log("Returning cached config data.");
            return this.currentConfigData;
        }

        console.log("Fetching current configuration for getCurrentConfig...");
        const db = firebase.firestore(); // Ensure db is available
        const CONFIG_DOC_ID = 'empresaDetails';
        try {
            const doc = await db.collection('configuracion').doc(CONFIG_DOC_ID).get();
            if (doc.exists) {
                this.currentConfigData = doc.data();
                return this.currentConfigData;
            } else {
                console.warn("No configuration document found in getCurrentConfig.");
                return { nombreEmpresa: "Empresa (No Configurada)" }; // Default placeholder
            }
        } catch (error) {
            console.error("Error in getCurrentConfig:", error);
            return { nombreEmpresa: "Empresa (Error al Cargar)" }; // Error placeholder
        }
    }
};
