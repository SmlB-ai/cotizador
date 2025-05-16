// Clase para manejar la configuración de la empresa
export class Config {
  constructor() {
    // Clave para el almacenamiento local
    this.STORAGE_KEY = 'cotizador_config';
    
    // Configuración por defecto
    this.defaultConfig = {
      nombre: 'StableBuilds',
      direccion: 'Av. Construcción #123, CDMX',
      telefono: '55 1234 5678',
      email: 'contacto@stablebuilds.com',
      web: 'stablebuilds.com'
    };
  }
  
  // Guardar la configuración en el almacenamiento local
  guardarConfig(config) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      return false;
    }
  }
  
  // Cargar la configuración desde el almacenamiento local
  cargarConfig() {
    try {
      const configData = localStorage.getItem(this.STORAGE_KEY);
      
      if (configData) {
        return JSON.parse(configData);
      } else {
        // Si no hay datos guardados, devolver la configuración por defecto
        return this.defaultConfig;
      }
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      return this.defaultConfig;
    }
  }
  
  // Restablecer la configuración a los valores por defecto
  restablecerConfig() {
    return this.guardarConfig(this.defaultConfig);
  }
  
  // Verificar si hay configuración guardada
  hayConfigGuardada() {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
}