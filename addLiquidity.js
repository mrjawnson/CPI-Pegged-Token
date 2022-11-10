const hre = require("hardhat");

async function main() {
    //get a signer and a address
    const signer0 = await ethers.provider.getSigner(0);
    const address0 = await signer0.getAddress();    

    //get addresses of tokens we are going to reweight
    const daiAddress = "0xc7ad46e0b8a400bb3c915120d284aafba8fc4735";
    const infAddress = "0x627803d6ac4c64e669f38103aab3f61d00a1a3ed";

    //connects to uniswapV2 router, so we can create a pool
    const router = await hre.ethers.getContractAt("IUniswapV2Router02","0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",signer0);
    //connect to DAI and INF contracts
    const dai = await hre.ethers.getContractAt("IERC20",daiAddress,signer0);
    const inf = await hre.ethers.getContractAt("IERC20",infAddress,signer0);

    //sets up variables to create a liquidity pool with 100k DAI and 100k INF at 1-1 ratio.
    const amountDai = 100000;
    const amountInf = 100000;
    let price = amountDai/amountInf;
    const approveAmount = ethers.utils.parseEther("10000000");
    const minInf = 50000;
    const minDai = 50000;
    const deadline = Math.floor(Date.now()/1000) + 60 * 20;

    //approve use of tokens.
    const daiApprove = await dai.approve("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", approveAmount);
    const infApprove = await inf.approve("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", approveAmount);
    await daiApprove.wait();
    await infApprove.wait();

    //add liquidity
    const addLiquid = await router.addLiquidity(daiAddress,
                                            infAddress,
                                            ethers.utils.parseEther(amountDai.toString()),
                                            ethers.utils.parseEther(amountInf.toString()),
                                            ethers.utils.parseEther(minDai.toString()),
                                            ethers.utils.parseEther(minInf.toString()),
                                            address0,
                                            deadline
                                            );

    await addLiquid.wait();




    //GET INFLATION DATA & CALCULATE NEW VALUES;

    //made this up but would get values from oracle.
    const cpi = [270,283.5]; 
    //calculates percent change
    const difference = (cpi[1]-cpi[0])/cpi[0];
    //calculates new price
    price = price + price*difference; 
    const newInfAmount = Math.floor(amountInf / price);


    console.log("" + price + "|" + newInfAmount);

    //REMOVE LIQUIDITY

    //get address of INF/DAI pool
    const pairAddress = "0x423cfeAFD4504Cc3265f7e1f30312b975328e60E";
    const pair = await hre.ethers.getContractAt("IERC20",pairAddress,signer0);
    const pairApprove = await pair.approve("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", approveAmount);
    await pairApprove.wait();

    //checks lp token balance
    const lpBalance = await pair.balanceOf(address0);

    //remove liquidity
    const removeLiquid = await router.removeLiquidity(daiAddress, 
        infAddress, 
        lpBalance,
        minDai,
        minInf,
        address0,
        deadline);

    await removeLiquid.wait();

    //RESUPPLY AT CORRECT RATIO
    const addLiquidAgain = await router.addLiquidity(daiAddress,
        infAddress,
        ethers.utils.parseEther(amountDai.toString()),
        ethers.utils.parseEther(newInfAmount.toString()),
        ethers.utils.parseEther(amountDai.toString()),
        ethers.utils.parseEther(newInfAmount.toString()),
        address0,
        deadline
        );
await addLiquidAgain.wait();



  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


