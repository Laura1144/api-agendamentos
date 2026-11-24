import type { Request, Response } from "express";

export function rotaNaoEncontrada(req: Request, res: Response) {
    res.status(404).json({ message: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}
