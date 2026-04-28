import { Pinecone } from '@pinecone-database/pinecone';
import Groq from 'groq-sdk';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const getIndex = () => pinecone.index(process.env.PINECONE_INDEX);
