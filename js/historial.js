export class Historial {
    constructor() {
        this.storageKey = 'cotizador_historial';
        this.inicializarDB();
    }

    inicializarDB() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    guardar(cotizacion) {
        try {
            const historial = this.obtenerTodos();
            historial.push({
                ...cotizacion,
                id: this.generarId(),
                fecha: new Date().toISOString()
            });
            localStorage.setItem(this.storageKey, JSON.stringify(historial));
            return true;
        } catch (error) {
            console.error('Error al guardar en historial:', error);
            return false;
        }
    }

    obtenerTodos() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            return [];
        }
    }

    obtenerUltimoFolio() {
        const historial = this.obtenerTodos();
        if (historial.length === 0) return 0;
        
        const ultimaCotizacion = historial[historial.length - 1];
        const folio = ultimaCotizacion.folio || '';
        const match = folio.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
    }

    generarId() {
        return 'cot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}