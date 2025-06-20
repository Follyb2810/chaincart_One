import { XionContractDeployer } from './deploy.js';

// Configuration
const MNEMONIC = "bread physical debate betray reunion vocal approve route accuse result bonus planet onion shoe shallow mammal victory burst shiver avoid fame lawn immense deer";
const CONTRACT_ADDRESS = "xion18g2pzn4lalr0am5zrx058xp2j9ennyy7kt8ac56skr9upnwl906s08092w"; // Replace with your deployed contract address
const XION_DENOM = "ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4";

async function main() {
  const deployer = new XionContractDeployer();
  
  try {
    // Initialize connection
    console.log("🔗 Connecting to Xion Network...");
    await deployer.initialize(MNEMONIC);
    
    console.log("\n" + "=".repeat(50));
    console.log("CONTRACT INTERACTION MENU");
    console.log("=".repeat(50));
    
    // Get command line argument for action
    const action = process.argv[2];
    
    switch (action) {
      case 'query':
        await queryState(deployer);
        break;
      case 'deposit':
        await makeDeposit(deployer);
        break;
      case 'release':
        await releaseFunds(deployer);
        break;
      case 'refund':
        await refundFunds(deployer);
        break;
      default:
        console.log("Usage: node interact.js <action>");
        console.log("Actions: query, deposit, release, refund");
        console.log("\nExamples:");
        console.log("  node interact.js query     - Query contract state");
        console.log("  node interact.js deposit   - Make deposit (buyer only)");
        console.log("  node interact.js release   - Release funds (marketplace only)");
        console.log("  node interact.js refund    - Refund deposit (marketplace only)");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

async function queryState(deployer) {
  console.log("🔍 Querying contract state...");
  try {
    const state = await deployer.queryContract(CONTRACT_ADDRESS, { get_state: {} });
    
    console.log("\n📊 CONTRACT STATE:");
    console.log("==================");
    console.log(`👤 Buyer: ${state.buyer}`);
    console.log(`🏪 Seller: ${state.seller}`);
    console.log(`🏢 Marketplace: ${state.marketplace}`);
    console.log(`💰 Required Deposit: ${state.required_deposit} ${state.denom}`);
    console.log(`💸 Fee Percentage: ${state.fee_percentage}%`);
    console.log(`📋 Status: ${state.status}`);
    
    // Calculate fee amount
    const depositAmount = parseInt(state.required_deposit);
    const feeAmount = Math.floor(depositAmount * state.fee_percentage / 100);
    const sellerAmount = depositAmount - feeAmount;
    
    console.log("\n💡 TRANSACTION BREAKDOWN:");
    console.log("=========================");
    console.log(`💰 Total Deposit: ${depositAmount} ${state.denom}`);
    console.log(`💸 Marketplace Fee: ${feeAmount} ${state.denom}`);
    console.log(`🏪 Seller Receives: ${sellerAmount} ${state.denom}`);
    
  } catch (error) {
    console.error("❌ Failed to query state:", error);
  }
}

async function makeDeposit(deployer) {
  console.log("💰 Making deposit...");
  
  try {
    // First query to get deposit amount
    const state = await deployer.queryContract(CONTRACT_ADDRESS, { get_state: {} });
    
    if (state.status !== "Created") {
      console.log(`⚠️ Cannot deposit. Contract status is: ${state.status}`);
      return;
    }
    
    console.log(`💸 Depositing ${state.required_deposit} ${state.denom}...`);
    
    const funds = [{
      denom: state.denom,
      amount: state.required_deposit
    }];
    
    const result = await deployer.executeContract(
      CONTRACT_ADDRESS,
      { deposit: {} },
      funds
    );
    
    console.log("✅ Deposit successful!");
    console.log(`🧾 Transaction: ${result.transactionHash}`);
    
    // Query updated state
    await queryState(deployer);
    
  } catch (error) {
    console.error("❌ Deposit failed:", error);
  }
}

async function releaseFunds(deployer) {
  console.log("🚀 Releasing funds to seller...");
  
  try {
    const result = await deployer.executeContract(
      CONTRACT_ADDRESS,
      { release: {} }
    );
    
    console.log("✅ Funds released successfully!");
    console.log(`🧾 Transaction: ${result.transactionHash}`);
    
    // Query updated state
    await queryState(deployer);
    
  } catch (error) {
    console.error("❌ Release failed:", error);
  }
}

async function refundFunds(deployer) {
  console.log("↩️ Refunding deposit to buyer...");
  
  try {
    const result = await deployer.executeContract(
      CONTRACT_ADDRESS,
      { refund: {} }
    );
    
    console.log("✅ Refund successful!");
    console.log(`🧾 Transaction: ${result.transactionHash}`);
    
    // Query updated state
    await queryState(deployer);
    
  } catch (error) {
    console.error("❌ Refund failed:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}