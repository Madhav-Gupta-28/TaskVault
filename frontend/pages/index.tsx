import { ConnectWallet, useAddress, useContract, useContractRead ,useUser  , Web3Button , useSDK } from "@thirdweb-dev/react";
// import {useSDK} from "@thirdweb-dev/auth";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import { NextPage } from "next";
import { signIn , useSession , signOut} from "next-auth/react";
import {taskVaultAddress , taskvaultNftAddress} from "../const/consts";
import { BigNumber , ethers } from "ethers";
import { useState } from "react";


const Home: NextPage = () => {
  const address  = useAddress()
  const [form , setForm] = useState({
    amount:"",
    days:0
  })

  const sdk = useSDK()
  const {data : discordAuthData , status : discordAuthStatus } = useSession();
  const {contract , isLoading} = useContract(taskVaultAddress);
  const {contract : nftCollection} = useContract(taskvaultNftAddress);
  const {data  : lockedFundsData , isLoading : loadingLockedFunds , error} = useContractRead(contract   , "addressTofunds" , [address])
  const {user} =useUser()

  console.log(contract);
  console.log(lockedFundsData )

  if (!address) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Discord Task Vault Application</h1>
          <div className={styles.connect}>
            <ConnectWallet />
          </div>
        </main>
      </div>
    );
  }

  if (loadingLockedFunds) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Discord Task Vault Application</h1>
          <p className="text-2xl text-lime-500">Loading...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className="text-3xl text-orange-600 ">Something went wrong</h1>
          {/* @ts-ignore */}
          <p>{error.reason}</p>
          <ConnectWallet />
        </main>
      </div>
    );
  }


  async function attemptWithdraw() {
    // Sign in With Ethereum
    const domain = "example.com";
    const loginPayload = await sdk?.auth.login(domain);



    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({
          loginPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        return;
      }

      // If we're eligible, we can mint the NFT
      const tx = await nftCollection?.erc721.signature.mint(data.signature);

      console.log(tx);

      alert("Minted NFT succesfully!");

      // Now we can call the withdraw function.
      const withdrawTx = await contract?.call("withdraw");
      console.log(withdrawTx);

      alert("Withdrew succesfully!");
    } catch (e) {
      console.error(e);
    }

    // And IF we are, then we'll receieve a signature
    // we can use the signature to mint the NFT.
    // If we're not, we'll receive an error.
  }


 

  if (lockedFundsData.lockedupfund.eq(0)) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Accountability Project</h1>

          {/* Form that allows users to lock funds for X amount of time */}

          <div className={styles.form}>
            <input
              type="text"
              placeholder="Amount to commit"
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value,
                })
              }
              className={styles.input}
            />

            <input
              type="number"
              placeholder="Days to commit"
              onChange={(e) =>
                setForm({
                  ...form,
                  days: Number(e.target.value),
                })
              }
              className={styles.input}
            />

            <Web3Button
              contractAddress={taskVaultAddress}
              action={(contract) =>
                contract.call("deposit",[ ethers.utils.parseUnits(form.amount.toString() , "ether"), 
                  form.days * 86400
                ] , {value: ethers.utils.parseUnits(form.amount.toString() , "ether")} )
              }
              onSuccess={() => alert("Success")}
              onError={() => alert("Error")}
            >
              Lock Funds
            </Web3Button>
          </div>
        </main>
      </div>
    );
  }



  return (
<div className="w-screen h-screen "  style={{backgroundColor:'#393E46' , color:"#fff"}}>

  {/* heading div  */}
<div className="w-screen p-10  h-8 flex justify-between ">
    {/* heading title */}
  <div className="text-2xl ">Task Vault</div>

  {/* heading buttons div */}
  <div className="flex justify-between gap-x-11">
    <div>
      <ConnectWallet/>
    </div>
    <div>
      { discordAuthStatus !== "authenticated" ? 
              <button
                className="p-4 text-xl w-48 rounded-2xl" style={{backgroundColor:"#6527BE" , color:"hsl(256, 6.0%, 93.2%)"}}
                onClick={() => signIn("discord")}
              >
                SignIn
              </button>: 
            <button 
            className="p-4  text-xl w-48  rounded-2xl" style={{backgroundColor:"#FF6666" , color:"hsl(256, 6.0%, 93.2%)"}}
            onClick={() => signOut()}>
              Sign  Out
            </button>
            }
    </div>
  </div>
</div>


{/* main body starts from here  */}
<div className=" content-start p-5 flex flex-row gap-6 justify-center mt-10 ">
    <div className="content-start  flex flex-column gap-10 justify-center self-center mt-40">

      <div className=" content-start m-10 p-10 border-solid	 rounded-2xl  border-4 border-white" >

        <p className=" text-left text-2xl">Amount Locked</p>
        <p className=" mt-4 text-xl"><span>{
            ethers.utils.formatEther(lockedFundsData.lockedupfund.toNumber())
          }  Eth</span></p>

      </div >

      <div className=" content-start m-10 p-10 border-solid	 rounded-2xl  border-4 border-white">

      <p  className=" text-left text-2xl">Time You can UnLock</p>
        <p className="  mt-4 text-xl"><span>{
         new Date(
          BigNumber.from(lockedFundsData.deadline).toNumber() * 1000
        ).toLocaleString()}
          </span></p>

      </div>


      <div className=" content-start m-10 p-10 border-solid	 rounded-2xl  border-4 border-white">

      <p  className=" text-left text-2xl">Rewards</p>
        <p className="  mt-4 text-xl"><span>{}</span></p>
      </div>

      </div>
            </div>

          <div className="flex justify-center">

         

     {
            // The user needs to sign in with Discord, before this button appears.
            discordAuthStatus !== "authenticated" ? (
              <button
                className={styles.mainButton}
                onClick={() => signIn("discord")}
              >
                Sign in with Discord
              </button>
            ) : // If the time is available, show the withdraw button.




            BigNumber.from(lockedFundsData.deadline)
                .mul(1000)
                .lt(BigNumber.from(Date.now())) ? (
              <Web3Button
                contractAddress={taskVaultAddress}
                action={() => attemptWithdraw()}
              >
                Mint NFT & Withdraw Funds
              </Web3Button>


           
            ) : (
              <p>You&apos;re not ready to withdraw yet.</p>
            )
          }

       
</div>

          
   
   

</div>

 ) 
 } 


export default Home;
