import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

const ERROS_PRISMA: Record<string, { status: number; message: string }> = {
    P2002: { status: 409, message: "Já existe um registro com estes dados únicos." },
    P2003: { status: 409, message: "Operação não permitida: o registro está vinculado a outro." },
    P2025: { status: 404, message: "Registro não encontrado." }
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "JSON inválido no corpo da requisição." });
    }

    if (typeof err === "object" && err !== null && "code" in err && typeof err.code === "string") {
        const erroPrisma = ERROS_PRISMA[err.code];
        if (erroPrisma) {
            return res.status(erroPrisma.status).json({ message: erroPrisma.message });
        }
    }

    console.error("Erro inesperado: ", err);
    return res.status(500).json({ message: "Erro interno do servidor." });
}
