import { AppError } from "./AppError.js"

export class NaoEncontradoError extends AppError {
    constructor(message: string) {
        super(message, 404);
        this.name = "NaoEncontradoError"
    }
}