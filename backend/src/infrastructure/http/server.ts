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
import { createSavingsTrackerRepository } from "../db/repositories/savingsTrackerRepository.js";
import { createAccountUseCases } from "../../application/accounts.js";
import { createIncomeUseCases } from "../../application/incomes.js";
import { createExpenseUseCases } from "../../application/expenses.js";
import { createDebtUseCases } from "../../application/debts.js";
import { createTransferUseCases } from "../../application/transfers.js";
import { createSavingsTrackerUseCases } from "../../application/savingsTrackers.js";
import { createExportUseCases } from "../../application/exportData.js";

export async function buildServer(pool: Pool) {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] });

  app.get("/health", async () => ({ status: "ok" }));

  const accountRepository = createAccountRepository(pool);
  const incomeRepository = createIncomeRepository(pool);
  const expenseRepository = createExpenseRepository(pool);
  const debtRepository = createDebtRepository(pool);
  const transferRepository = createTransferRepository(pool);
  const savingsTrackerRepository = createSavingsTrackerRepository(pool);

  registerAccountRoutes(app, createAccountUseCases(accountRepository));
  registerCrudRoutes(app, "/incomes", createIncomeUseCases(incomeRepository));
  registerCrudRoutes(app, "/expenses", createExpenseUseCases(expenseRepository));
  registerCrudRoutes(app, "/debts", createDebtUseCases(debtRepository));
  registerCrudRoutes(app, "/transfers", createTransferUseCases(transferRepository));
  registerCrudRoutes(app, "/savings-trackers", createSavingsTrackerUseCases(savingsTrackerRepository));

  const exportUseCases = createExportUseCases({
    accounts: accountRepository,
    incomes: incomeRepository,
    expenses: expenseRepository,
    debts: debtRepository,
    transfers: transferRepository,
    savingsTrackers: savingsTrackerRepository,
  });
  app.get("/export", async () => exportUseCases.exportAll());

  return app;
}
