import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

export interface TxItem {
  amount: number;
  token: string;
  timestamp: number;
}

export interface ProofInputs {
  total_spent: number;
  week_start: number;
  hash_of_tx_list: string;
}

export function loadMockTxs(mockPath: string): TxItem[] {
  const raw = fs.readFileSync(mockPath, "utf-8");
  return JSON.parse(raw) as TxItem[];
}

export function computeWeekStart(nowSec: number): number {
  const date = new Date(nowSec * 1000);
  const day = date.getUTCDay();
  const diffDays = (day + 6) % 7; // make Monday=0
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diffDays));
  monday.setUTCHours(0, 0, 0, 0);
  return Math.floor(monday.getTime() / 1000);
}

export function aggregateWeeklySpend(txs: TxItem[], weekStart: number): number {
  const weekEnd = weekStart + 7 * 24 * 60 * 60;
  return txs
    .filter((t) => t.timestamp >= weekStart && t.timestamp < weekEnd)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function hashTxList(txs: TxItem[]): string {
  const h = crypto.createHash("sha256");
  h.update(JSON.stringify(txs));
  return "0x" + h.digest("hex");
}

export function buildProofInputs(txs: TxItem[], weekStart: number): ProofInputs {
  const total = aggregateWeeklySpend(txs, weekStart);
  const hash = hashTxList(txs);
  return { total_spent: total, week_start: weekStart, hash_of_tx_list: hash };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function defaultPaths(): { mock: string; circuitsBuild: string } {
  const root = path.join(__dirname, "..", "..");
  return {
    mock: path.join(root, "mock", "txs.json"),
    circuitsBuild: path.join(root, "circuits", "build"),
  };
}


