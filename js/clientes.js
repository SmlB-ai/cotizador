// js/clientes.js
// Manages the "Clientes" tab functionality

window.clientesModule = {
    isInitialized: false,
    editingClientId: null, // Moved from global scope to module scope

    init: function() {
        if (this.isInitialized) {
            // console.log("Clientes module already initialized.");
            // this.loadClients(); // Optionally refresh clients if tab is re-focused
            return;
        }
        console.log("Clientes module initializing...");

        // Ensure Firebase is available
        if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
            console.error("Firebase or Firestore is not loaded. Client module cannot start.");
            const clientListTableBodyNode = document.getElementById('clientListTableBody');
            if (clientListTableBodyNode) {
                clientListTableBodyNode.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error: Firebase no está configurado. Contacte al administrador.</td></tr>';
            }
            return;
        }
        const db = firebase.firestore();

        // Cache DOM Elements (make them properties of the module or local consts if only used in init)
        // For simplicity, making them local to init and functions will re-query or be passed them.
        // A more performant approach might cache them on `this.` if frequently accessed by other module methods.
        const btnAgregarCliente = document.getElementById('btnAgregarCliente');
        const clientFormContainer = document.getElementById('clientFormContainer');
        const clientForm = document.getElementById('clientForm');
        const clientFormTitle = document.getElementById('clientFormTitle');
        const editingClientIdInput = document.getElementById('editingClientId');
        const clientNameInput = document.getElementById('clientName');
        const clientPhoneInput = document.getElementById('clientPhone');
        const clientEmailInput = document.getElementById('clientEmail');
        const clientTypeSelect = document.getElementById('clientType');
        const clientRFCInput = document.getElementById('clientRFC');
        const clientIsFavoriteCheckbox = document.getElementById('clientIsFavorite');
        const clientAddressTextarea = document.getElementById('clientAddress');
        const clientNotesTextarea = document.getElementById('clientNotes');
        // const btnSaveClient = document.getElementById('btnSaveClient'); // Handled by form submit
        const btnCancelClientForm = document.getElementById('btnCancelClientForm');

        const clientListTableBody = document.getElementById('clientListTableBody');
        const clientSearchInput = document.getElementById('clientSearchInput');
        const clientFilterType = document.getElementById('clientFilterType');

        const module = this; // Reference to self for inner functions

        // --- FORM MANAGEMENT (now methods or inner functions) ---
        function openClientForm(mode = 'new', clientData = null) {
            module.editingClientId = null;
            if(editingClientIdInput) editingClientIdInput.value = '';
            if (clientForm) clientForm.reset();

            if (mode === 'edit' && clientData) {
                if (clientFormTitle) clientFormTitle.textContent = 'Editar Cliente';
                module.editingClientId = clientData.id;
                if (editingClientIdInput) editingClientIdInput.value = clientData.id;

                if (clientNameInput) clientNameInput.value = clientData.nombre || '';
                if (clientPhoneInput) clientPhoneInput.value = clientData.telefono || '';
                if (clientEmailInput) clientEmailInput.value = clientData.email || '';
                if (clientTypeSelect) clientTypeSelect.value = clientData.tipo || 'Particular';
                if (clientRFCInput) clientRFCInput.value = clientData.rfc || '';
                if (clientAddressTextarea) clientAddressTextarea.value = clientData.direccion || '';
                if (clientNotesTextarea) clientNotesTextarea.value = clientData.notas || '';
                if (clientIsFavoriteCheckbox) clientIsFavoriteCheckbox.checked = clientData.esFavorito || false;
            } else {
                if (clientFormTitle) clientFormTitle.textContent = 'Agregar Nuevo Cliente';
            }
            if (clientFormContainer) clientFormContainer.style.display = 'block';
        }

        function closeClientForm() {
            if (clientFormContainer) clientFormContainer.style.display = 'none';
            if (clientForm) clientForm.reset();
            module.editingClientId = null;
            if (editingClientIdInput) editingClientIdInput.value = '';
        }

        // --- CRUD FUNCTIONS (now methods or inner functions) ---

        async function saveClient(event) {
            event.preventDefault();

            const nombre = clientNameInput ? clientNameInput.value.trim() : '';
            const telefono = clientPhoneInput ? clientPhoneInput.value.trim() : '';
            const email = clientEmailInput ? clientEmailInput.value.trim() : '';

            if (!nombre || !telefono || !email) {
                alert("Nombre, Teléfono y Email son campos obligatorios.");
                return;
            }

            const clientDataObject = { // Renamed to avoid conflict with clientData parameter name
                nombre: nombre,
                telefono: telefono,
                email: email,
                tipo: clientTypeSelect ? clientTypeSelect.value : 'Particular',
                rfc: clientRFCInput ? clientRFCInput.value.trim() : '',
                direccion: clientAddressTextarea ? clientAddressTextarea.value.trim() : '',
                notas: clientNotesTextarea ? clientNotesTextarea.value.trim() : '',
                esFavorito: clientIsFavoriteCheckbox ? clientIsFavoriteCheckbox.checked : false,
            };

            try {
                if (module.editingClientId) {
                    clientDataObject.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('clientes').doc(module.editingClientId).update(clientDataObject);
                    alert('Cliente actualizado con éxito.');
                } else {
                    clientDataObject.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('clientes').add(clientDataObject);
                    alert('Cliente guardado con éxito.');
                }
                closeClientForm();
                loadClients();
            } catch (error) {
                console.error("Error saving client: ", error);
                alert(`Error al guardar cliente: ${error.message}`);
            }
        }

        async function loadClients() {
            if (!clientListTableBody) return;
            clientListTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando clientes...</td></tr>';

            const searchTerm = clientSearchInput ? clientSearchInput.value.toLowerCase() : '';
            const filterTypeVal = clientFilterType ? clientFilterType.value : ''; // Renamed to avoid conflict

            try {
                let query = db.collection('clientes').orderBy('nombre');

                const snapshot = await query.get();
                if (snapshot.empty && !searchTerm && !filterTypeVal) {
                    clientListTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay clientes registrados.</td></tr>';
                    return;
                }

                clientListTableBody.innerHTML = '';
                let clientsRendered = 0;
                snapshot.forEach(doc => {
                    const client = { id: doc.id, ...doc.data() };

                    if (filterTypeVal && client.tipo !== filterTypeVal) {
                        return;
                    }
                    if (searchTerm && !(client.nombre || '').toLowerCase().includes(searchTerm) && !(client.email || '').toLowerCase().includes(searchTerm) ) {
                         return;
                    }

                    renderClientRow(client);
                    clientsRendered++;
                });

                if (clientsRendered === 0) {
                     clientListTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No se encontraron clientes con los filtros aplicados o no hay clientes registrados.</td></tr>';
                }

            } catch (error) {
                console.error("Error loading clients: ", error);
                clientListTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar clientes.</td></tr>';
            }
        }
        // Expose loadClients if it needs to be called from outside (e.g. onTabShow)
        module.loadClients = loadClients;


        function renderClientRow(clientData) {
            const tr = document.createElement('tr');
            tr.dataset.clientId = clientData.id;
        tr.innerHTML = `
            tr.innerHTML = `
                <td>${clientData.nombre || 'N/A'}</td>
                <td>${clientData.telefono || 'N/A'}</td>
                <td>${clientData.email || 'N/A'}</td>
                <td>${clientData.tipo || 'N/A'}</td>
                <td>${clientData.esFavorito ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>'}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-edit-client" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete-client" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;

            const editButton = tr.querySelector('.btn-edit-client');
            if (editButton) editButton.addEventListener('click', () => editClient(clientData.id));

            const deleteButton = tr.querySelector('.btn-delete-client');
            if (deleteButton) deleteButton.addEventListener('click', () => deleteClient(clientData.id, clientData.nombre));

            if (clientListTableBody) clientListTableBody.appendChild(tr);
        }

        async function editClient(clientId) {
            try {
                const doc = await db.collection('clientes').doc(clientId).get();
                if (doc.exists) {
                    openClientForm('edit', { id: doc.id, ...doc.data() });
                } else {
                    alert("Cliente no encontrado.");
                    console.error("Client not found for ID:", clientId);
                }
            } catch (error) {
                console.error("Error fetching client for edit: ", error);
                alert("Error al cargar datos del cliente para editar.");
            }
        }

        async function deleteClient(clientId, clientName) {
            if (confirm(`¿Está seguro de que desea eliminar a ${clientName}? Esta acción no se puede deshacer.`)) {
                try {
                    await db.collection('clientes').doc(clientId).delete();
                    alert(`${clientName} ha sido eliminado.`);
                    loadClients();
                } catch (error) {
                    console.error("Error deleting client: ", error);
                    alert(`Error al eliminar cliente: ${error.message}`);
                }
            }
        }

        // This function can be called by other modules if exposed, e.g., window.clientesModule.getClientOptions()
        module.getClientOptionsForSelect = async function() {
            const clients = [];
            try {
                const snapshot = await db.collection('clientes').orderBy('nombre').get();
                snapshot.forEach(doc => {
                    clients.push({ id: doc.id, nombre: doc.data().nombre });
                });
            } catch (error) {
                console.error("Error fetching client names for select:", error);
            }
            return clients;
        };

        // --- EVENT LISTENERS (within init) ---
        if (btnAgregarCliente) {
            btnAgregarCliente.addEventListener('click', () => openClientForm('new'));
        }
        if (btnCancelClientForm) {
            btnCancelClientForm.addEventListener('click', closeClientForm);
        }
        if (clientForm) {
            clientForm.addEventListener('submit', saveClient);
        }

        if (clientSearchInput) {
            clientSearchInput.addEventListener('input', loadClients);
        }
        if (clientFilterType) {
            clientFilterType.addEventListener('change', loadClients);
        }

        // Initial load of clients is now handled by app.js calling this init function
        // when the tab is shown for the first time.
        // So, we call loadClients directly here as part of initialization.
        loadClients();

        this.isInitialized = true;
        console.log("Clientes module Initialized by app.js.");
    },

    onTabShow: function() {
        console.log("Clientes tab shown again (via onTabShow).");
        // Refresh client list if needed, or perform other actions when tab becomes visible again
        if (this.isInitialized && typeof this.loadClients === 'function') {
            this.loadClients();
        }
    }
};
// No more DOMContentLoaded listener.
