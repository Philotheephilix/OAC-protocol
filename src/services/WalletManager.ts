import { 
    SuiClient
} from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64, toB64 } from '@mysten/sui/utils';
import * as fs from 'fs';
import * as path from 'path';
import { 
    WalletInfo, 
    AgentDetails, 
    WalletManagerConfig, 
    IWalletManager 
} from '../types/wallet.types';

export interface WalletConfig {
    rpcUrl: string;
    walletsDir: string;
}

export class WalletManager implements IWalletManager {
    private client: SuiClient;
    private walletsDir: string;

    constructor(config: WalletConfig) {
        this.client = new SuiClient({ url: config.rpcUrl });
        this.walletsDir = config.walletsDir;
        this.ensureWalletsDirectory();
    }

    private ensureWalletsDirectory(): void {
        if (!fs.existsSync(this.walletsDir)) {
            fs.mkdirSync(this.walletsDir, { recursive: true });
        }
    }

    async createAgentWallet(agentId: string): Promise<{ wallet: Ed25519Keypair; seedPhrase: string }> {
        try {
            // Generate new keypair with proper entropy
            const keypair = Ed25519Keypair.generate();
            const address = keypair.getPublicKey().toSuiAddress();

            // Get the private key bytes
            const privateKeyBytes = keypair.getSecretKey();
            
            // Convert to hex for better compatibility
            const privateKeyHex = Buffer.from(privateKeyBytes).toString('hex');
            
            // Generate a proper seed phrase (in a real implementation, this would be derived from the keypair)
            // For now, we'll use a timestamp-based seed for demonstration
            const seedPhrase = `sui_${Date.now()}_${Math.random().toString(36).substring(2)}`;

            // Save wallet to file with proper format
            const walletPath = path.join(this.walletsDir, `${agentId}.wallet`);
            const walletData = {
                privateKey: privateKeyHex,
                address,
                seedPhrase,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                network: 'testnet' // Specify the network
            };
            fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));

            console.log(`Wallet created for agent ${agentId} at ${walletPath}`);
            console.log(`Address: ${address}`);
            console.log(`Network: testnet`);
            console.log(`View on explorer: https://suiexplorer.com/address/${address}?network=testnet`);

            return { wallet: keypair, seedPhrase };
        } catch (error) {
            throw new Error(`Failed to create wallet for agent ${agentId}: ${error}`);
        }
    }

    async importWalletFromSeed(agentId: string, seedPhrase: string): Promise<Ed25519Keypair> {
        try {
            // In a real implementation, this would derive the keypair from the seed phrase
            // For now, we'll generate a new keypair and store it with the provided seed phrase
            const keypair = Ed25519Keypair.generate();
            const address = keypair.getPublicKey().toSuiAddress();
            const privateKeyHex = Buffer.from(keypair.getSecretKey()).toString('hex');

            // Save wallet to file
            const walletPath = path.join(this.walletsDir, `${agentId}.wallet`);
            const walletData = {
                privateKey: privateKeyHex,
                address,
                seedPhrase,
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                network: 'testnet'
            };
            fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));

            console.log(`Imported wallet for agent ${agentId} at ${walletPath}`);
            console.log(`Address: ${address}`);
            console.log(`Network: testnet`);
            console.log(`View on explorer: https://suiexplorer.com/address/${address}?network=testnet`);

            return keypair;
        } catch (error) {
            throw new Error(`Failed to import wallet for agent ${agentId}: ${error}`);
        }
    }

    async loadAgentWallet(agentId: string): Promise<{ wallet: Ed25519Keypair; address: string }> {
        try {
            const walletPath = path.join(this.walletsDir, `${agentId}.wallet`);
            if (!fs.existsSync(walletPath)) {
                throw new Error(`Wallet not found for agent ${agentId}`);
            }

            const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
            // Convert hex private key back to bytes
            const privateKeyBytes = Buffer.from(walletData.privateKey, 'hex');
            const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);

            return { wallet: keypair, address: walletData.address };
        } catch (error) {
            throw new Error(`Failed to load wallet for agent ${agentId}: ${error}`);
        }
    }

    async getBalance(address: string): Promise<string> {
        try {
            const coins = await this.client.getCoins({
                owner: address
            });
            return coins.data.reduce((total, coin) => total + Number(coin.balance), 0).toString();
        } catch (error) {
            throw new Error(`Failed to get balance for address ${address}: ${error}`);
        }
    }

    async getAgentAddress(agentId: string): Promise<string> {
        const wallet = await this.loadAgentWallet(agentId);
        return wallet.address;
    }

    async getAgentDetails(agentId: string): Promise<AgentDetails> {
        const wallet = await this.loadAgentWallet(agentId);
        const walletInfo = await this.loadWalletInfo(agentId);
        
        const balance = await this.getBalance(wallet.address);

        return {
            address: wallet.address,
            balance: balance,
            createdAt: walletInfo.createdAt,
            lastUsed: walletInfo.lastUsed
        };
    }

    private async walletExists(agentId: string): Promise<boolean> {
        try {
            await fs.promises.access(this.getWalletPath(agentId));
            return true;
        } catch {
            return false;
        }
    }

    private async saveWalletInfo(agentId: string, info: WalletInfo): Promise<void> {
        const filePath = this.getWalletPath(agentId);
        await fs.promises.writeFile(filePath, JSON.stringify(info, null, 2));
    }

    private async loadWalletInfo(agentId: string): Promise<WalletInfo> {
        try {
            const filePath = this.getWalletPath(agentId);
            const data = await fs.promises.readFile(filePath, 'utf-8');
            return JSON.parse(data) as WalletInfo;
        } catch (error) {
            throw new Error(`No wallet found for agent ${agentId}`);
        }
    }

    private getWalletPath(agentId: string): string {
        return path.join(this.walletsDir, `${agentId}.wallet`);
    }
} 