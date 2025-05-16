/**
 * Clase para la gestión de clientes
 * Maneja el almacenamiento local y la validación de datos
 */
export class Clientes {
    constructor() {
        this.storageKey = 'cotizador_clientes';
        this.clientesCache = null;
        this.inicializarDB();
    }

    /**
     * Inicializa la base de datos local
     */
    inicializarDB() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /**
     * Obtiene todos los clientes ordenados por nombre
     * @returns {Array} Lista de clientes
     */
    obtenerTodos() {
        if (!this.clientesCache) {
            const clientes = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
            // Ordenar por nombre
            clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
            this.clientesCache = clientes;
        }
        return this.clientesCache;
    }

    /**
     * Busca clientes por nombre o correo
     * @param {string} termino - Término de búsqueda
     * @returns {Array} Clientes que coinciden con la búsqueda
     */
    buscar(termino) {
        const terminoLower = termino.toLowerCase();
        return this.obtenerTodos().filter(cliente => 
            cliente.nombre.toLowerCase().includes(terminoLower) ||
            (cliente.email && cliente.email.toLowerCase().includes(terminoLower))
        );
    }

    /**
     * Guarda un nuevo cliente o actualiza uno existente
     * @param {Object} cliente - Datos del cliente
     * @returns {Object} Cliente guardado con ID
     */
    guardar(cliente) {
        const validacion = this.validarCliente(cliente);
        if (!validacion.esValido) {
            throw new Error(validacion.errores.join('\n'));
        }

        const clientes = this.obtenerTodos();
        
        // Verificar si el cliente ya existe
        const indiceExistente = clientes.findIndex(c => 
            c.id === cliente.id || 
            (c.email && c.email === cliente.email) ||
            (c.nombre === cliente.nombre && c.telefono === cliente.telefono)
        );

        if (indiceExistente >= 0) {
            // Actualizar cliente existente
            clientes[indiceExistente] = {
                ...clientes[indiceExistente],
                ...cliente,
                actualizado: new Date().toISOString()
            };
        } else {
            // Agregar nuevo cliente
            clientes.push({
                id: this.generarId(),
                ...cliente,
                creado: new Date().toISOString(),
                actualizado: new Date().toISOString()
            });
        }

        this.guardarEnStorage(clientes);
        return cliente;
    }

    /**
     * Elimina un cliente
     * @param {string} id - ID del cliente
     * @returns {boolean} true si se eliminó correctamente
     */
    eliminar(id) {
        const clientes = this.obtenerTodos();
        const indice = clientes.findIndex(c => c.id === id);
        
        if (indice >= 0) {
            clientes.splice(indice, 1);
            this.guardarEnStorage(clientes);
            return true;
        }
        return false;
    }

    /**
     * Busca un cliente por su ID
     * @param {string} id - ID del cliente
     * @returns {Object|null} Cliente encontrado o null
     */
    obtenerPorId(id) {
        return this.obtenerTodos().find(c => c.id === id) || null;
    }

    /**
     * Exporta todos los clientes a CSV
     * @returns {string} Contenido CSV
     */
    exportarCSV() {
        const clientes = this.obtenerTodos();
        const campos = ['nombre', 'direccion', 'telefono', 'email', 'creado', 'actualizado'];
        
        const csvContent = [
            campos.join(','), // Encabezados
            ...clientes.map(cliente => 
                campos.map(campo => 
                    // Escapar comas y comillas en los valores
                    `"${(cliente[campo] || '').toString().replace(/"/g, '""')}"`
                ).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    /**
     * Importa clientes desde CSV
     * @param {string} csvContent - Contenido CSV
     * @returns {Object} Resultado de la importación
     */
    importarCSV(csvContent) {
        // Normalizar saltos de línea
        const contenidoNormalizado = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lineas = contenidoNormalizado.split('\n').filter(linea => linea.trim() !== '');
        
        if (lineas.length === 0) {
            throw new Error('El archivo está vacío');
        }

        const encabezados = lineas[0].split(',');
        const resultado = {
            exitosos: 0,
            fallidos: 0,
            errores: []
        };

        // Procesar cada línea
        for (let i = 1; i < lineas.length; i++) {
            try {
                const valores = this.parsearCSVLinea(lineas[i]);
                if (valores.length !== encabezados.length) continue;

                const cliente = {};
                encabezados.forEach((campo, index) => {
                    cliente[campo.trim()] = valores[index].trim();
                });

                this.guardar(cliente);
                resultado.exitosos++;
            } catch (error) {
                resultado.fallidos++;
                resultado.errores.push(`Línea ${i + 1}: ${error.message}`);
            }
        }

        return resultado;
    }

    /**
     * Valida los datos de un cliente
     * @param {Object} cliente - Cliente a validar
     * @returns {Object} Resultado de la validación
     */
    validarCliente(cliente) {
        const errores = [];

        // Validar nombre
        if (!cliente.nombre || cliente.nombre.trim().length < 2) {
            errores.push('El nombre debe tener al menos 2 caracteres');
        }

        // Validar email si existe
        if (cliente.email && !this.validarEmail(cliente.email)) {
            errores.push('El email no es válido');
        }

        // Validar teléfono si existe
        if (cliente.telefono && !this.validarTelefono(cliente.telefono)) {
            errores.push('El teléfono no es válido');
        }

        return {
            esValido: errores.length === 0,
            errores
        };
    }

    /**
     * Guarda los clientes en el almacenamiento local
     * @param {Array} clientes - Lista de clientes
     */
    guardarEnStorage(clientes) {
        localStorage.setItem(this.storageKey, JSON.stringify(clientes));
        this.clientesCache = clientes;
    }

    /**
     * Genera un ID único para un cliente
     * @returns {string} ID generado
     */
    generarId() {
        return 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean} true si el email es válido
     */
    validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Valida un número de teléfono
     * @param {string} telefono - Teléfono a validar
     * @returns {boolean} true si el teléfono es válido
     */
    validarTelefono(telefono) {
        // Permite números, espacios, guiones y paréntesis
        const re = /^[\d\s\-()]+$/;
        return re.test(telefono) && telefono.replace(/[^\d]/g, '').length >= 8;
    }

    /**
     * Parsea una línea de CSV
     * @param {string} linea - Línea a parsear
     * @returns {Array} Valores de la línea
     */
    parsearCSVLinea(linea) {
        const valores = [];
        let valor = '';
        let dentroDeCampo = false;

        for (let i = 0; i < linea.length; i++) {
            const char = linea[i];
            
            if (char === '"') {
                if (dentroDeCampo && linea[i + 1] === '"') {
                    valor += '"';
                    i++;
                } else {
                    dentroDeCampo = !dentroDeCampo;
                }
            } else if (char === ',' && !dentroDeCampo) {
                valores.push(valor);
                valor = '';
            } else {
                valor += char;
            }
        }
        
        valores.push(valor);
        return valores;
    }
}