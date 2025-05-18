import { Message } from './message.types';

export interface SessionHistory {
    sessionId: string;
    messages: Message[];
    createdAt: string;
    lastUpdated: string;
}

export interface IIPFSStorage {
    uploadToIPFS(data: SessionHistory): Promise<string>;
    retrieveFromIPFS(cid: string): Promise<SessionHistory>;
    uploadSessionMessages(sessionId: string, messages: Message[]): Promise<string>;
    retrieveSessionMessages(cid: string): Promise<Message[]>;
} 