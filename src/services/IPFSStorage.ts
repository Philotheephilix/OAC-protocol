import axios from 'axios';
import { Message } from '../types/message.types';

export interface WalrusConfig {
    aggregatorUrl: string;
    publisherUrl: string;
}

export class IPFSStorage {
    private aggregatorUrl: string;
    private publisherUrl: string;

    constructor(config: WalrusConfig) {
        this.aggregatorUrl = config.aggregatorUrl;
        this.publisherUrl = config.publisherUrl;
    }

    private getHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json'
        };
    }

    async uploadSessionMessages(sessionId: string, messages: Message[]): Promise<string> {
        try {
            // Prepare the data
            const data = {
                sessionId,
                messages,
                timestamp: new Date().toISOString()
            };

            // Store the data using Walrus publisher
            const response = await axios.put(
                `${this.publisherUrl}/v1/blobs`,
                JSON.stringify(data),
                { 
                    headers: this.getHeaders(),
                    params: {
                        epochs: 5 // Store for 5 epochs
                    }
                }
            );

            if (response.data.newlyCreated) {
                return response.data.newlyCreated.blobObject.blobId;
            } else if (response.data.alreadyCertified) {
                return response.data.alreadyCertified.blobId;
            } else {
                throw new Error('Unexpected response from Walrus publisher');
            }
        } catch (error) {
            throw new Error(`Failed to upload session messages: ${error}`);
        }
    }

    async retrieveSessionMessages(blobId: string): Promise<Message[]> {
        try {
            // Get data from Walrus aggregator
            const response = await axios.get(
                `${this.aggregatorUrl}/v1/blobs/${blobId}`,
                { headers: this.getHeaders() }
            );

            const data = JSON.parse(response.data);
            if (!data.messages) {
                throw new Error('Invalid message data format');
            }

            return data.messages;
        } catch (error) {
            throw new Error(`Failed to retrieve session messages: ${error}`);
        }
    }

    async uploadSessionHistory(sessionId: string, history: any): Promise<string> {
        try {
            // Store the data using Walrus publisher
            const response = await axios.put(
                `${this.publisherUrl}/v1/blobs`,
                JSON.stringify(history),
                { 
                    headers: {
                        ...this.getHeaders(),
                        'Content-Type': 'application/json'
                    },
                    params: {
                        epochs: 5 // Store for 5 epochs
                    }
                }
            );

            if (response.data.newlyCreated) {
                return response.data.newlyCreated.blobObject.blobId;
            } else if (response.data.alreadyCertified) {
                return response.data.alreadyCertified.blobId;
            } else {
                throw new Error('Unexpected response from Walrus publisher');
            }
        } catch (error) {
            throw new Error(`Failed to upload session history: ${error}`);
        }
    }

    async retrieveSessionHistory(blobId: string): Promise<any> {
        try {
            // Get data from Walrus aggregator
            const response = await axios.get(
                `${this.aggregatorUrl}/v1/blobs/${blobId}`,
                { 
                    headers: {
                        ...this.getHeaders(),
                        'Accept': 'application/json'
                    }
                }
            );

            // The response should already be JSON
            const data = response.data;
            if (!data.history) {
                throw new Error('Invalid history data format');
            }

            return data;
        } catch (error) {
            throw new Error(`Failed to retrieve session history: ${error}`);
        }
    }

    async listAllSessions(): Promise<string[]> {
        try {
            // Note: This is a placeholder as Walrus doesn't have a direct list API
            // You would need to maintain your own index of blob IDs
            throw new Error('Listing all sessions is not supported in Walrus storage');
        } catch (error) {
            throw new Error(`Failed to list sessions: ${error}`);
        }
    }

    async deleteSession(blobId: string): Promise<void> {
        try {
            // Note: Walrus doesn't support direct deletion of blobs
            // They are automatically deleted after their storage epoch expires
            throw new Error('Direct deletion is not supported in Walrus storage');
        } catch (error) {
            throw new Error(`Failed to delete session: ${error}`);
        }
    }
} 