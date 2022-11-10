const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Greeter", function () {
  it("deploy contract and return address", async function () {
    const signer0 = await ethers.provider.getSigner(0);
    const address0 = await signer0.getAddress();
    
    const MatrixMult = await ethers.getContractFactory("MatrixMultDiverse");
    const matrixMult = await MatrixMult.deploy();
    await matrixMult.deployed();

    console.log("deployed to:" + matrixMult.address);


  });
});
