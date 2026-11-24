import fs from "node:fs";
import { execSync } from "node:child_process";
import { parse } from "dotenv";

export default function setup() {
    if (!fs.existsSync(".env.test")) {
        throw new Error("Arquivo .env.test não encontrado. Copie o .env.test.example para .env.test e ajuste os valores.");
    }

    const envTeste = parse(fs.readFileSync(".env.test"));

    if (!envTeste.DB_NAME?.endsWith("_test") || !envTeste.DATABASE_URL?.includes("_test")) {
        throw new Error('O banco configurado em .env.test deve terminar com "_test".');
    }

    execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, ...envTeste } });
}
