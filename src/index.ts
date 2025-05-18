import { WalletManager } from './services/WalletManager';

async function main() {
    try {
        // Initialize wallet manager
        const walletManager = new WalletManager({
            rpcUrl: 'https://fullnode.mainnet.sui.io:443',
            walletsDir: './wallets'
        });

        // Create new wallet for agent
        const agentId = 'agent1';
        const { wallet, seedPhrase } = await walletManager.createAgentWallet(agentId);
        console.log(`Created new wallet for ${agentId}`);
        console.log(`Address: ${wallet.getPublicKey().toSuiAddress()}`);
        console.log(`Seed phrase: ${seedPhrase}`);

        // Get agent details
        const details = await walletManager.getAgentDetails(agentId);
        console.log('Agent details:', details);

    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 