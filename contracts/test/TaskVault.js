const { expect } = require("chai");
const {ethers} = require("ethers")

describe("TaskVault", function () {
  let TaskVault;
  let taskVault;
  let NFTCollection;
  let nftCollection;
  let owner;
  let addr1;
  let addr2;

  

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    TaskVault = await ethers.getContractFactory("TaskVault");
    taskVault = await TaskVault.deploy();

    NFTCollection = await ethers.getContractFactory("NFTCollection");
    nftCollection = await NFTCollection.deploy();

    await taskVault.deployed();
    await nftCollection.deployed();
  });

  it("Should deposit funds correctly", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    const timelock = 86400; // 1 day

    // Connect to the NFTCollection contract
    await taskVault.connect(owner).deposit(depositAmount, timelock);

    // Verify the deposit
    const lockedFunds = await taskVault.addressTofunds(owner.address);
    expect(lockedFunds.lockedupfund).to.equal(depositAmount);
    expect(lockedFunds.deadline).to.be.above(0);
  });

  it("Should not deposit funds below the specified amount", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    const lessAmount = ethers.utils.parseEther("0.5");
    const timelock = 86400; // 1 day

    // Attempt to deposit less than the specified amount
    await expect(
      taskVault.connect(owner).deposit(lessAmount, timelock)
    ).to.be.revertedWith("Less than inputed amount");

    // Verify that no funds were deposited
    const lockedFunds = await taskVault.addressTofunds(owner.address);
    expect(lockedFunds.lockedupfund).to.equal(0);
    expect(lockedFunds.deadline).to.equal(0);
  });

  it("Should withdraw funds correctly after the timelock has passed", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    const timelock = 1; // 1 second

    // Connect to the NFTCollection contract
    await taskVault.connect(owner).deposit(depositAmount, timelock);

    // Wait for the timelock to pass
    await ethers.provider.send("evm_increaseTime", [timelock + 1]);
    await ethers.provider.send("evm_mine");

    // Verify the withdrawal
    const initialBalance = await owner.getBalance();
    await taskVault.connect(owner).withdraw();

    // Check the final balance of the owner
    const finalBalance = await owner.getBalance();
    expect(finalBalance).to.be.above(initialBalance);
  });

  it("Should not allow withdrawal before the timelock has passed", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    const timelock = 86400; // 1 day

    // Connect to the NFTCollection contract
    await taskVault.connect(owner).deposit(depositAmount, timelock);

    // Attempt to withdraw before the timelock
    await expect(taskVault.connect(owner).withdraw()).to.be.revertedWith(
      "Deadline has been not passed yet"
    );
  });

  it("Should not allow withdrawal if no NFT from Collection is owned", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    const timelock = 86400; // 1 day

    // Connect to the NFTCollection contract
    await taskVault.connect(owner).deposit(depositAmount, timelock);

    // Attempt to withdraw without owning an NFT
    await expect(taskVault.connect(owner).withdraw()).to.be.revertedWith(
      "You don't have an NFT from Collection"
    );
  });
});
