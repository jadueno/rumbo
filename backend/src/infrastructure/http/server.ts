import Fastify from "fastify";
import cors from "@fastify/cors";
import type { Pool } from "pg";
import { registerAuth } from "./auth.js";
import { registerCrudRoutes } from "./crudRoutes.js";
import { registerAccountRoutes } from "./accountRoutes.js";
import { createAccountRepository } from "../db/repositories/accountRepository.js";
import { createIncomeRepository } from "../db/repositories/incomeRepository.js";
import { createExpenseRepository } from "../db/repositories/expenseRepository.js";
import { createDebtRepository } from "../db/repositories/debtRepository.js";
import { createTransferRepository } from "../db/repositories/transferRepository.js";
import { createSavingsTrackerRepository } from "../db/repositories/savingsTrackerRepository.js";
import { createPropertyRepository } from "../db/repositories/propertyRepository.js";
import { createSnapshotRepository } from "../db/repositories/snapshotRepository.js";
import { createAccountUseCases } from "../../application/accounts.js";
import { createIncomeUseCases } from "../../application/incomes.js";
import { createExpenseUseCases } from "../../application/expenses.js";
import { createDebtUseCases } from "../../application/debts.js";
import { createTransferUseCases } from "../../application/transfers.js";
import { createSavingsTrackerUseCases } from "../../application/savingsTrackers.js";
import { createPropertyUseCases } from "../../application/properties.js";
import { createSnapshotUseCases } from "../../application/snapshots.js";
import { createExportUseCases } from "../../application/exportData.js";

export async function buildServer(pool: Pool, options: { logger?: boolean; apiToken?: string } = {}) {
  const app = Fastify({ logger: options.logger ?? true });
  await app.register(cors, { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] });

  app.get("/health", async () => ({ status: "ok" }));

  registerAuth(app, options.apiToken);

  const accountRepository = createAccountRepository(pool);
  const incomeRepository = createIncomeRepository(pool);
  const expenseRepository = createExpenseRepository(pool);
  const debtRepository = createDebtRepository(pool);
  const transferRepository = createTransferRepository(pool);
  const savingsTrackerRepository = createSavingsTrackerRepository(pool);
  const propertyRepository = createPropertyRepository(pool);
  const snapshotRepository = createSnapshotRepository(pool);

  registerAccountRoutes(app, createAccountUseCases(accountRepository));
  registerCrudRoutes(app, "/incomes", createIncomeUseCases(incomeRepository));
  registerCrudRoutes(app, "/expenses", createExpenseUseCases(expenseRepository));
  registerCrudRoutes(app, "/debts", createDebtUseCases(debtRepository));
  registerCrudRoutes(app, "/transfers", createTransferUseCases(transferRepository));
  registerCrudRoutes(app, "/savings-trackers", createSavingsTrackerUseCases(savingsTrackerRepository));
  registerCrudRoutes(app, "/properties", createPropertyUseCases(propertyRepository));
  registerCrudRoutes(app, "/snapshots", createSnapshotUseCases(snapshotRepository));

  const exportUseCases = createExportUseCases({
    accounts: accountRepository,
    incomes: incomeRepository,
    expenses: expenseRepository,
    debts: debtRepository,
    transfers: transferRepository,
    savingsTrackers: savingsTrackerRepository,
    properties: propertyRepository,
    snapshots: snapshotRepository,
  });
  app.get("/export", async () => exportUseCases.exportAll());

  return app;
}
