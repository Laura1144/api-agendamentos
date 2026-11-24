import { AppError } from "./AppError.js"

export class ConflitoError extends AppError {
    constructor(message: string) {
        super(message, 409);
        this.name = "ConflitoError"
    }
}