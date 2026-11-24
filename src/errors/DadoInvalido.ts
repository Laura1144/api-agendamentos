import { AppError } from "./AppError.js"

export class DadoInvalidoError extends AppError {
    constructor(message: string) {
        super(message, 400);
        this.name = "DadoInvalidoError"
    }
}