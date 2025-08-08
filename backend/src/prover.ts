import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import type { ProofInputs } from "./computeInputs.ts";

export interface ProveResult {
  proofPath: string;
  publicSignalsPath: string;
}

export function writeInputJson(inputs: ProofInputs, circuitsBuildDir: string): string {
  const inputPath = path.join(circuitsBuildDir, "input.from.backend.json");
  fs.writeFileSync(inputPath, JSON.stringify(inputs, null, 2));
  return inputPath;
}

export function runWitnessAndProve(circuitsBuildDir: string): ProveResult {
  const wasm = path.join(circuitsBuildDir, "spend_limit_js", "spend_limit.wasm");
  const witness = path.join(circuitsBuildDir, "witness.from.backend.wtns");
  const zkey = path.join(circuitsBuildDir, "spend_limit_0001.zkey");
  const proof = path.join(circuitsBuildDir, "proof.from.backend.json");
  const pub = path.join(circuitsBuildDir, "public.from.backend.json");
  const input = path.join(circuitsBuildDir, "input.from.backend.json");

  const witnessGen = spawnSync("node", [path.join(circuitsBuildDir, "spend_limit_js", "generate_witness.js"), wasm, input, witness], { stdio: "inherit" });
  if (witnessGen.status !== 0) {
    throw new Error("Witness generation failed");
  }
  const prove = spawnSync("npx", ["snarkjs", "groth16", "prove", zkey, witness, proof, pub], { stdio: "inherit" });
  if (prove.status !== 0) {
    throw new Error("Prove failed");
  }
  return { proofPath: proof, publicSignalsPath: pub };
}


