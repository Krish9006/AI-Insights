import { Pinecone } from '@pinecone-database/pinecone';
import Groq from 'groq-sdk';

let pineconeInstance = null;
let groqInstance = null;

export const pinecone = new Proxy({}, {
  get(target, prop) {
    if (!pineconeInstance) {
      const apiKey = process.env.PINECONE_API_KEY;
      if (!apiKey) {
        throw new Error("PINECONE_API_KEY is not defined in environment variables.");
      }
      pineconeInstance = new Pinecone({ apiKey });
    }
    return Reflect.get(pineconeInstance, prop);
  }
});

export const groq = new Proxy({}, {
  get(target, prop) {
    if (!groqInstance) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("GROQ_API_KEY is not defined in environment variables.");
      }
      groqInstance = new Groq({ apiKey });
    }
    return Reflect.get(groqInstance, prop);
  }
});

export const getIndex = () => {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) {
    throw new Error("PINECONE_INDEX is not defined in environment variables.");
  }
  return pinecone.index(indexName);
};

