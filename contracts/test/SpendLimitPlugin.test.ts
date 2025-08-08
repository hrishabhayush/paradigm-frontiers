import { expect } from "chai";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

function loadProof() {
  const proofPath = path.resolve(__dirname, "../../circuits/build/proof.json");
  const raw = fs.readFileSync(proofPath, "utf-8");
  const json = JSON.parse(raw);
  // snarkjs proof fields: pi_a, pi_b, pi_c (decimal strings)
  const a: [bigint, bigint] = [BigInt(json.pi_a[0]), BigInt(json.pi_a[1])];
  // Note: Solidity verifier expects swapped coordinates for bn128
  const b: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(json.pi_b[0][1]), BigInt(json.pi_b[0][0])],
    [BigInt(json.pi_b[1][1]), BigInt(json.pi_b[1][0])],
  ];
  const c: [bigint, bigint] = [BigInt(json.pi_c[0]), BigInt(json.pi_c[1])];
  return { a, b, c };
}

describe("SpendLimitPlugin", () => {
  it("accepts valid proof from authorized relayer", async () => {
    const [deployer, relayer] = await ethers.getSigners();
    const Plugin = await ethers.getContractFactory("SpendLimitPlugin", deployer);
    const plugin = await Plugin.deploy();
    await plugin.waitForDeployment();

    await (await plugin.setConfig({
      spendLimit: 100n,
      relayerAddress: await relayer.getAddress(),
      recoveryAddress: deployer.address,
    })).wait();

    const { a, b, c } = loadProof();

    await expect(
      plugin.connect(relayer).executeWithProof("0x", a, b, c, [])
    ).to.not.be.reverted;
  });

  it("reverts on invalid proof", async () => {
    const [deployer, relayer] = await ethers.getSigners();
    const Plugin = await ethers.getContractFactory("SpendLimitPlugin", deployer);
    const plugin = await Plugin.deploy();
    await plugin.waitForDeployment();

    await (await plugin.setConfig({
      spendLimit: 100n,
      relayerAddress: await relayer.getAddress(),
      recoveryAddress: deployer.address,
    })).wait();

    const { a, b, c } = loadProof();

    await expect(
      plugin.connect(relayer).executeWithProof("0x", a, b, c, [1])
    ).to.be.reverted;
  });

  it("reverts on wrong relayer", async () => {
    const [deployer, relayer, other] = await ethers.getSigners();
    const Plugin = await ethers.getContractFactory("SpendLimitPlugin", deployer);
    const plugin = await Plugin.deploy();
    await plugin.waitForDeployment();

    await (await plugin.setConfig({
      spendLimit: 100n,
      relayerAddress: await relayer.getAddress(),
      recoveryAddress: deployer.address,
    })).wait();

    const { a, b, c } = loadProof();

    await expect(
      plugin.connect(other).executeWithProof("0x", a, b, c, [])
    ).to.be.revertedWithCustomError(plugin, "InvalidRelayer");
  });
});


