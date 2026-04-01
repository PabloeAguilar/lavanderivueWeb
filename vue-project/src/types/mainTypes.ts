export interface Client {
    id: number;
    name: string;
    phone?: string;
}

export interface Order {
    id: number;
    clientIndex: number;
    fechaRegistro: string;
    comentarios?: string;
    adelanto?: number;
    fechaEntrega?: string;
}

export interface SugerenciaPieza {
    id: number,
    clave: string,
    nombre: string,
    precio_individual: number,
}

export interface IndividualPiece {
    descripcion: string;
    piezas: number;
    precio: number;
}   

