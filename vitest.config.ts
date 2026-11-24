import fs from "node:fs";
import { parse } from "dotenv";
import { defineConfig } from "vitest/config";

const envTeste = fs.existsSync(".env.test") ? parse(fs.readFileSync(".env.test")) : {};

export default defineConfig({
    test: {
        include: ["src/tests/**/*.test.ts"],
        env: envTeste,
        globalSetup: ["vitest.global-setup.ts"],
        fileParallelism: false,
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: ["src/tests/**", "src/generated/**", "src/server.ts"],
            reporter: ["text", "html"],
            thresholds: {
                lines: 60,
                statements: 60,
                functions: 60,
                branches: 60
            }
        }
    }
});
