export interface WalletInfo {
    address: string;
    seedPhrase: string;
    createdAt: string;
    lastUsed: string;
}

export interface AgentDetails {
    address: string;
    balance: string;
    createdAt: string;
    lastUsed: string;
}

export interface WalletManagerConfig {
    rpcUrl: string;
    walletsDir: string;
}

export interface IWalletManager {
    createAgentWallet(agentId: string): Promise<{ wallet: any; seedPhrase: string }>;
    importWalletFromSeed(agentId: string, seedPhrase: string): Promise<any>;
    getAgentAddress(agentId: string): Promise<string>;
    getAgentDetails(agentId: string): Promise<AgentDetails>;
} 