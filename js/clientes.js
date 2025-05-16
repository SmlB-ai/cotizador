// Clase para gestionar clientes
export class Clientes {
  constructor() {
    // Clave para almacenamiento local
    this.STORAGE_KEY = 'cotizador_clientes';
    
    // Lista de clientes
    this.lista = [];
    
    // Cargar clientes guardados
    this.cargarClientes();
  }
  
  // Cargar clientes desde almacenamiento local
  cargarClientes() {
    try {
      const clientesData = localStorage.getItem(this.STORAGE_KEY);
      
      if (clientesData) {
        this.lista = JSON.parse(clientesData);
      }
    } catch (error) {
      console.error('Error al cargar los clientes:', error);
      this.lista = [];
    }
    
    return this.lista;
  }
  
  // Guardar lista de clientes en almacenamiento local
  guardarClientes() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.lista));
      return true;
    } catch (error) {
      console.error('Error al guardar los clientes:', error);
      return false;
    }
  }
  
  // Agregar un nuevo cliente
  agregarCliente(cliente) {
    // Verificar si ya existe un cliente con el mismo ID o email
    const clienteExistente = this.lista.find(c => 
      c.email === cliente.email && cliente.email !== '' ||
      c.nombre === cliente.nombre
    );
    
    if (clienteExistente) {
      // Actualizar datos del cliente existente
      Object.assign(clienteExistente, cliente);
    } else {
      // Agregar nuevo cliente
      this.lista.push({
        ...cliente,
        id: Date.now().toString() // Generar ID único
      });
    }
    
    // Guardar cambios
    this.guardarClientes();
    
    return true;
  }
  
  // Obtener un cliente por su ID
  obtenerCliente(id) {
    return this.lista.find(cliente => cliente.id === id);
  }
  
  // Eliminar un cliente por su ID
  eliminarCliente(id) {
    const indexInicial = this.lista.length;
    this.lista = this.lista.filter(cliente => cliente.id !== id);
    
    // Verificar si se eliminó algún cliente
    if (this.lista.length < indexInicial) {
      this.guardarClientes();
      return true;
    }
    
    return false;
  }
  
  // Obtener todos los clientes
  obtenerTodos() {
    return [...this.lista];
  }
}