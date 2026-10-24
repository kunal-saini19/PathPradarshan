import hre from "hardhat";

async function main() {
  const ethers = (hre as any).ethers;
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No signer available for deployment");
  }

  const Token = await ethers.getContractFactory("TwoGathersToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log(`TwoGathersToken deployed to ${address}`);
  console.log(`Owner: ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
