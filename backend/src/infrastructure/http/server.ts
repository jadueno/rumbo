import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Pool } from "pg";
import { registerCrudRoutes } from "./crudRoutes.js";
import { registerAccountRoutes } from "./accountRoutes.js";
import { createAccountRepository } from "../db/repositories/accountRepository.js";
import { createIncomeRepository } from "../db/repositories/incomeRepository.js";
import { createExpenseRepository } from "../db/repositories/expenseRepository.js";
import { createDebtRepository } from "../db/repositories/debtRepository.js";
import { createTransferRepository } from "../db/repositories/transferRepository.js";
import { createAccountUseCases } from "../../application/accounts.js";
import { createIncomeUseCases } from "../../application/incomes.js";
import { createExpenseUseCases } from "../../application/expenses.js";
import { createDebtUseCases } from "../../application/debts.js";
import { createTransferUseCases } from "../../application/transfers.js";

export async function buildServer(pool: Pool) {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] });

  app.get("/health", async () => ({ status: "ok" }));

  registerAccountRoutes(app, createAccountUseCases(createAccountRepository(pool)));
  registerCrudRoutes(app, "/incomes", createIncomeUseCases(createIncomeRepository(pool)));
  registerCrudRoutes(app, "/expenses", createExpenseUseCases(createExpenseRepository(pool)));
  registerCrudRoutes(app, "/debts", createDebtUseCases(createDebtRepository(pool)));
  registerCrudRoutes(app, "/transfers", createTransferUseCases(createTransferRepository(pool)));

  return app;
}
