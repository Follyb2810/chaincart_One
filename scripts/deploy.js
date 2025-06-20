
// const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
// const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
// const { GasPrice } = require("@cosmjs/stargate");
// const {  readFileSync } = require("fs");

// // import dotenv from "dotenv"
// require("dotenv").config();

// // dotenv.config()

// const rpcEndpoint = "https://rpc.xion-testnet-2.burnt.com:443";
// const mnemonic = process.env.MNEMONIC;
// const wasmFilePath = "../artifacts/escrow_contract.wasm";

// async function main() {
//   const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
//     prefix: "xion",
//   });

//   const [firstAccount] = await wallet.getAccounts();
//   console.log("Wallet address:", firstAccount.address);

//   const client = await SigningCosmWasmClient.connectWithSigner(
//     rpcEndpoint,
//     wallet,
//     {
//       gasPrice: GasPrice.fromString("0.025uxion")
//     }
//   );

//   const wasmCode = readFileSync(wasmFilePath);
//   const uploadReceipt = await client.upload(firstAccount.address, wasmCode ,"auto");
//   console.log("Upload successful, code ID:", uploadReceipt.codeId);

//   const initMsg = {};
//   const instantiateReceipt = await client.instantiate(firstAccount.address, uploadReceipt.codeId, initMsg, "Escrow", "auto");
//   console.log("Fist account", firstAccount.address);
//   console.log("Contract instantiated at:", instantiateReceipt.contractAddress);
// }
// main().catch(console.error);


import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { readFileSync } from "fs";
 import dotenv from "dotenv"

dotenv.config();

// Xion Network configuration
const XION_RPC_ENDPOINT = "https://rpc.xion-testnet-2.burnt.com:443"; // Testnet
// const XION_RPC_ENDPOINT = "https://rpc.xion-mainnet-1.burnt.com:443"; // Mainnet

const XION_CHAIN_ID = "xion-testnet-2"; // Use "xion-mainnet-1" for mainnet
// const XION_DENOM = "uxion";
const XION_DENOM = "ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4"
const GAS_PRICE = "0.025uxion";
const mnemonic = process.env.MNEMONIC;
const WASM_FILE_PATH = "../artifacts/escrow_contract.wasm";


class XionContractDeployer {
  constructor() {
    this.client = null;
    this.wallet = null;
    this.senderAddress = null;
  }

  async initialize(mnemonic) {
    try {
      console.log("🚀 Initializing Xion Network connection...");
      
      // Create wallet from mnemonic
       
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: "xion",
      });

      // Get the first account
      const [firstAccount] = await this.wallet.getAccounts();
      this.senderAddress = firstAccount.address;
      console.log(`📍 Wallet address: ${this.senderAddress}`);

      // Create signing client
      this.client = await SigningCosmWasmClient.connectWithSigner(
        XION_RPC_ENDPOINT,
        this.wallet,
        {
          gasPrice: GasPrice.fromString(GAS_PRICE),
        }
      );

      console.log("✅ Connected to Xion Network successfully!");
      
      // Check balance
      const balance = await this.client.getBalance(this.senderAddress, XION_DENOM);
      console.log(`💰 Balance: ${balance.amount} ${balance.denom}`);
      
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      return false;
    }
  }

  async uploadContract(wasmFilePath) {
    try {
      console.log("📤 Uploading contract to Xion Network...");
      
      // Read the compiled wasm file
      const wasmCode = readFileSync(wasmFilePath);
      console.log(`📄 Contract size: ${wasmCode.length} bytes`);

      // Upload the contract
      const uploadResult = await this.client.upload(
        this.senderAddress,
        wasmCode,
        "auto", // Let CosmJS calculate gas
        "Escrow Contract v0.1.0" // Memo
      );

      console.log(`✅ Contract uploaded successfully!`);
      console.log(`📋 Code ID: ${uploadResult.codeId}`);
      console.log(`🧾 Transaction Hash: ${uploadResult.transactionHash}`);
      console.log(`⛽ Gas Used: ${uploadResult.gasUsed}`);

      return uploadResult.codeId;
    } catch (error) {
      console.error("❌ Failed to upload contract:", error);
      throw error;
    }
  }

  async instantiateContract(codeId, instantiateMsg, label, admin = null) {
    try {
      console.log("🏗️ Instantiating contract...");
      console.log(`📝 Instantiate message:`, JSON.stringify(instantiateMsg, null, 2));

      const instantiateResult = await this.client.instantiate(
        this.senderAddress,
        codeId,
        instantiateMsg,
        label,
        "auto", // Gas
        {
          memo: `Instantiating ${label}`,
          admin: admin || this.senderAddress, // Set admin for contract upgrades
        }
      );

      console.log(`✅ Contract instantiated successfully!`);
      console.log(`📍 Contract Address: ${instantiateResult.contractAddress}`);
      console.log(`🧾 Transaction Hash: ${instantiateResult.transactionHash}`);
      console.log(`⛽ Gas Used: ${instantiateResult.gasUsed}`);

      return instantiateResult;
    } catch (error) {
      console.error("❌ Failed to instantiate contract:", error);
      throw error;
    }
  }

  async queryContract(contractAddress, queryMsg) {
    try {
      console.log("🔍 Querying contract...");
      const result = await this.client.queryContractSmart(contractAddress, queryMsg);
      console.log("📊 Query result:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("❌ Failed to query contract:", error);
      throw error;
    }
  }

  async executeContract(contractAddress, executeMsg, funds = []) {
    try {
      console.log("⚡ Executing contract...");
      console.log(`📝 Execute message:`, JSON.stringify(executeMsg, null, 2));
      
      const executeResult = await this.client.execute(
        this.senderAddress,
        contractAddress,
        executeMsg,
        "auto",
        "Contract execution",
        funds
      );

      console.log(`✅ Contract executed successfully!`);
      console.log(`🧾 Transaction Hash: ${executeResult.transactionHash}`);
      console.log(`⛽ Gas Used: ${executeResult.gasUsed}`);

      return executeResult;
    } catch (error) {
      console.error("❌ Failed to execute contract:", error);
      throw error;
    }
  }
}

// Main deployment function
async function deployEscrowContract() {
  const deployer = new XionContractDeployer();
  
  // Configuration - UPDATE THESE VALUES
  // const MNEMONIC = "your twelve word mnemonic phrase goes here for wallet access";
  
  
  // Escrow contract parameters
  const BUYER_ADDRESS = "xion1gapszks8r7fnfgah6qgzt9p8utlsuczthvvy69"; // Replace with actual buyer address
  const SELLER_ADDRESS = "xion1c6y8tdknd5qpkxtph9l0njj0dxdzglwrw4f3de"; // Replace with actual seller address
  const MARKETPLACE_ADDRESS = "xion1uy2glj674hx2k02wwc8ctgk3cfhfu7z0vyduww"; // Replace with actual marketplace address
  const REQUIRED_DEPOSIT = "1000000"; // 1 XION (in uxion)
  const FEE_PERCENTAGE = 5; // 5% fee
  

  try {
    // Initialize connection
    const initialized = await deployer.initialize(mnemonic);
    if (!initialized) {
      throw new Error("Failed to initialize connection");
    }

    // Upload contract
    console.log("\n" + "=".repeat(50));
    console.log("STEP 1: UPLOADING CONTRACT");
    console.log("=".repeat(50));
    const codeId = await deployer.uploadContract(WASM_FILE_PATH);

    // Prepare instantiate message
    const instantiateMsg = {
      buyer: BUYER_ADDRESS,
      seller: SELLER_ADDRESS,
      marketplace: MARKETPLACE_ADDRESS,
      required_deposit: REQUIRED_DEPOSIT,
      denom: XION_DENOM,
      fee_percentage: FEE_PERCENTAGE,
    };

    // Instantiate contract
    console.log("\n" + "=".repeat(50));
    console.log("STEP 2: INSTANTIATING CONTRACT");
    console.log("=".repeat(50));
    const instantiateResult = await deployer.instantiateContract(
      codeId,
      instantiateMsg,
      "Escrow Contract Instance",
      deployer.senderAddress // Set deployer as admin
    );

    const contractAddress = instantiateResult.contractAddress;

    // Query initial state
    console.log("\n" + "=".repeat(50));
    console.log("STEP 3: QUERYING INITIAL STATE");
    console.log("=".repeat(50));
    const state =await deployer.queryContract(contractAddress, { get_state: {} });
    console.log({state},'in deloy')
    // Display deployment summary
    console.log("\n" + "🎉".repeat(20));
    console.log("DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("🎉".repeat(20));
    console.log(`📋 Code ID: ${codeId}`);
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 Network: ${XION_CHAIN_ID}`);
    console.log(`💰 Required Deposit: ${REQUIRED_DEPOSIT} ${XION_DENOM}`);
    console.log(`💸 Fee Percentage: ${FEE_PERCENTAGE}%`);

    // Example usage instructions
    console.log("\n" + "📚 USAGE EXAMPLES:");
    console.log("=".repeat(30));
    console.log("1. Deposit funds (buyer only):");
    console.log(`   executeContract("${contractAddress}", { deposit: {} }, [{ denom: "${XION_DENOM}", amount: "${REQUIRED_DEPOSIT}" }])`);
    
    console.log("\n2. Release funds (marketplace only):");
    console.log(`   executeContract("${contractAddress}", { release: {} })`);
    
    console.log("\n3. Refund funds (marketplace only):");
    console.log(`   executeContract("${contractAddress}", { refund: {} })`);
    
    console.log("\n4. Query contract state:");
    console.log(`   queryContract("${contractAddress}", { get_state: {} })`);

    return {
      codeId,
      contractAddress,
      deployer: deployer.senderAddress,
    };

  } catch (error) {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }
}

// Example interaction functions
async function interactWithContract(contractAddress, mnemonic) {
  const deployer = new XionContractDeployer();
  await deployer.initialize(mnemonic);

  console.log("\n" + "🔄 CONTRACT INTERACTION EXAMPLES");
  console.log("=".repeat(40));

  try {
    // Query current state
    console.log("1. Querying current state...");
    await deployer.queryContract(contractAddress, { get_state: {} });

    // Example: Deposit (uncomment if you're the buyer)
    /*
    console.log("\n2. Making deposit...");
    await deployer.executeContract(
      contractAddress,
      { deposit: {} },
      [{ denom: XION_DENOM, amount: "1000000" }]
    );
    */

    // Example: Release funds (uncomment if you're the marketplace)
    /*
    console.log("\n3. Releasing funds...");
    await deployer.executeContract(contractAddress, { release: {} });
    */

  } catch (error) {
    console.error("❌ Interaction failed:", error);
  }
}

// Export for use as module
export { XionContractDeployer, deployEscrowContract, interactWithContract };

// Run deployment if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployEscrowContract();
}

