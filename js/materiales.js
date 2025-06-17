// js/materiales.js
// Manages the "Materiales" tab functionality

window.materialesModule = {
    isInitialized: false,
    editingMaterialId: null,

    init: function() {
        if (this.isInitialized) {
            // console.log("Materiales module already initialized.");
            return;
        }
        console.log("Materiales module initializing...");

        if (typeof firebase === 'undefined' || typeof firebase.firestore === 'undefined') {
            console.error("Firebase or Firestore is not loaded. Materiales module cannot start.");
            const materialListTableBodyNode = document.getElementById('materialListTableBody');
            if (materialListTableBodyNode) {
                materialListTableBodyNode.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error: Firebase no está configurado.</td></tr>';
            }
            return;
        }
        const db = firebase.firestore();
        const module = this;

        // DOM Elements
        const btnAgregarMaterial = document.getElementById('btnAgregarMaterial');
        const materialFormContainer = document.getElementById('materialFormContainer');
        const materialForm = document.getElementById('materialForm');
        const materialFormTitle = document.getElementById('materialFormTitle');
        const editingMaterialIdInput = document.getElementById('editingMaterialId'); // Hidden input

        const materialNameInput = document.getElementById('materialName');
        const materialSkuInput = document.getElementById('materialSku');
        const materialPriceInput = document.getElementById('materialPrice');
        const materialUnitInput = document.getElementById('materialUnit');
        const materialCategorySelect = document.getElementById('materialCategory');
        const materialSupplierInput = document.getElementById('materialSupplier');
        const materialNotesTextarea = document.getElementById('materialNotes');

        const btnCancelMaterialForm = document.getElementById('btnCancelMaterialForm');

        const materialListTableBody = document.getElementById('materialListTableBody');
        const materialSearchInput = document.getElementById('materialSearchInput');
        const materialCategoryFilter = document.getElementById('materialCategoryFilter');

        // --- FORM MANAGEMENT ---
        function openMaterialForm(mode = 'new', materialData = null) {
            module.editingMaterialId = null;
            if(editingMaterialIdInput) editingMaterialIdInput.value = '';
            if (materialForm) materialForm.reset();

            if (mode === 'edit' && materialData) {
                if (materialFormTitle) materialFormTitle.textContent = 'Editar Material';
                module.editingMaterialId = materialData.id;
                if (editingMaterialIdInput) editingMaterialIdInput.value = materialData.id;

                if (materialNameInput) materialNameInput.value = materialData.nombre || '';
                if (materialSkuInput) materialSkuInput.value = materialData.sku || '';
                if (materialPriceInput) materialPriceInput.value = materialData.precio || 0;
                if (materialUnitInput) materialUnitInput.value = materialData.unidad || '';
                if (materialCategorySelect) materialCategorySelect.value = materialData.categoria || '';
                if (materialSupplierInput) materialSupplierInput.value = materialData.proveedor || '';
                if (materialNotesTextarea) materialNotesTextarea.value = materialData.notas || '';
            } else {
                if (materialFormTitle) materialFormTitle.textContent = 'Agregar Nuevo Material';
            }
            if (materialFormContainer) materialFormContainer.style.display = 'block';
        }

        function closeMaterialForm() {
            if (materialFormContainer) materialFormContainer.style.display = 'none';
            if (materialForm) materialForm.reset();
            module.editingMaterialId = null;
            if (editingMaterialIdInput) editingMaterialIdInput.value = '';
        }

        // --- CRUD FUNCTIONS ---
        async function saveMaterial(event) {
            event.preventDefault();
            const nombre = materialNameInput.value.trim();
            const precio = parseFloat(materialPriceInput.value);
            const unidad = materialUnitInput.value.trim();
            const categoria = materialCategorySelect.value;

            if (!nombre || isNaN(precio) || precio <= 0 || !unidad || !categoria) {
                alert("Nombre, Precio, Unidad y Categoría son campos obligatorios. El precio debe ser mayor a cero.");
                return;
            }

            const materialDataObject = {
                nombre: nombre,
                sku: materialSkuInput.value.trim(),
                precio: precio,
                unidad: unidad,
                categoria: categoria,
                proveedor: materialSupplierInput.value.trim(),
                notas: materialNotesTextarea.value.trim(),
            };

            try {
                if (module.editingMaterialId) {
                    materialDataObject.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('materiales').doc(module.editingMaterialId).update(materialDataObject);
                    alert('Material actualizado con éxito.');
                } else {
                    materialDataObject.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    materialDataObject.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
                    await db.collection('materiales').add(materialDataObject);
                    alert('Material guardado con éxito.');
                }
                closeMaterialForm();
                loadMaterials();
            } catch (error) {
                console.error("Error saving material: ", error);
                alert(`Error al guardar material: ${error.message}`);
            }
        }

        async function loadMaterials() {
            if (!materialListTableBody) return;
            materialListTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Cargando materiales...</td></tr>`;

            const searchTerm = materialSearchInput.value.toLowerCase();
            const categoryFilter = materialCategoryFilter.value;

            try {
                let query = db.collection('materiales');

                if (categoryFilter) {
                    query = query.where('categoria', '==', categoryFilter);
                }
                // Firestore doesn't support case-insensitive search or partial matches on multiple fields directly
                // So, we fetch based on category (if any) and then filter client-side for text search.
                // For more complex scenarios, a dedicated search service like Algolia/Typesense would be better.
                query = query.orderBy('nombre');

                const snapshot = await query.get();
                if (snapshot.empty && !searchTerm && !categoryFilter) {
                    materialListTableBody.innerHTML = `<tr><td colspan="7" class="text-center">No hay materiales registrados.</td></tr>`;
                    return;
                }

                materialListTableBody.innerHTML = '';
                let materialsRendered = 0;
                snapshot.forEach(doc => {
                    const material = { id: doc.id, ...doc.data() };

                    // Client-side search filtering
                    if (searchTerm) {
                        const nameMatch = (material.nombre || '').toLowerCase().includes(searchTerm);
                        const skuMatch = (material.sku || '').toLowerCase().includes(searchTerm);
                        if (!nameMatch && !skuMatch) {
                            return; // Skip if no match
                        }
                    }

                    renderMaterialRow(material);
                    materialsRendered++;
                });

                if (materialsRendered === 0) {
                    materialListTableBody.innerHTML = `<tr><td colspan="7" class="text-center">No se encontraron materiales con los filtros aplicados.</td></tr>`;
                }
            } catch (error) {
                console.error("Error loading materials: ", error);
                materialListTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar materiales.</td></tr>`;
            }
        }
        module.loadMaterials = loadMaterials; // Expose for onTabShow

        function renderMaterialRow(materialData) {
            const tr = document.createElement('tr');
            tr.dataset.materialId = materialData.id;
            tr.innerHTML = `
                <td>${materialData.nombre || 'N/A'}</td>
                <td>${materialData.sku || 'N/A'}</td>
                <td>${materialData.categoria || 'N/A'}</td>
                <td>${(materialData.precio || 0).toFixed(2)}</td>
                <td>${materialData.unidad || 'N/A'}</td>
                <td>${materialData.proveedor || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-edit-material" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger btn-delete-material" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tr.querySelector('.btn-edit-material').addEventListener('click', () => editMaterial(materialData.id));
            tr.querySelector('.btn-delete-material').addEventListener('click', () => deleteMaterial(materialData.id, materialData.nombre));
            materialListTableBody.appendChild(tr);
        }

        async function editMaterial(materialId) {
            try {
                const doc = await db.collection('materiales').doc(materialId).get();
                if (doc.exists) {
                    openMaterialForm('edit', { id: doc.id, ...doc.data() });
                } else {
                    alert("Material no encontrado.");
                }
            } catch (error) {
                console.error("Error fetching material for edit: ", error);
                alert("Error al cargar datos del material.");
            }
        }

        async function deleteMaterial(materialId, materialName) {
            if (confirm(`¿Está seguro de que desea eliminar el material "${materialName}"?`)) {
                try {
                    await db.collection('materiales').doc(materialId).delete();
                    alert(`"${materialName}" ha sido eliminado.`);
                    loadMaterials();
                } catch (error) {
                    console.error("Error deleting material: ", error);
                    alert(`Error al eliminar material: ${error.message}`);
                }
            }
        }

        // --- EVENT LISTENERS ---
        if (btnAgregarMaterial) btnAgregarMaterial.addEventListener('click', () => openMaterialForm('new'));
        if (btnCancelMaterialForm) btnCancelMaterialForm.addEventListener('click', closeMaterialForm);
        if (materialForm) materialForm.addEventListener('submit', saveMaterial);
        if (materialSearchInput) materialSearchInput.addEventListener('input', loadMaterials);
        if (materialCategoryFilter) materialCategoryFilter.addEventListener('change', loadMaterials);

        loadMaterials(); // Initial load

        this.isInitialized = true;
        console.log("Materiales module Initialized by app.js.");
    },

    onTabShow: function() {
        console.log("Materiales tab shown again (via onTabShow).");
        if (this.isInitialized && typeof this.loadMaterials === 'function') {
            this.loadMaterials();
        }
    }
};
