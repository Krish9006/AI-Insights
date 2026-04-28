# ContentBrain AI

A powerful AI-powered Content Assistant built with Next.js, Groq (Llama-3.3), and Pinecone Serverless Native Inference.

## Overview
ContentBrain AI is a Retrieval-Augmented Generation (RAG) tool that allows users to upload pieces of content (like blog articles or documents), store them in a vector database, and dynamically query the content. It also features a 1-click "Generate Insights" feature that automatically extracts Key Topics, New Content Ideas, and CTA Suggestions based on the uploaded knowledge base.

## Features
- **Data Ingestion:** Upload multiple pieces of text/content at once.
- **Serverless Embeddings (RAG):** Content is chunked and natively embedded using Pinecone's Inference API (`multilingual-e5-large`). No third-party embedding API keys required!
- **Ultra-Fast AI Chat:** Uses Groq's bleeding-edge Llama-3.3 (`llama-3.3-70b-versatile`) to answer user queries accurately and instantly based *only* on the ingested context.
- **Insight Generation:** Automatically outputs structured JSON data containing Key Topics, Content Ideas, and Call-to-Actions.
- **Modern UI:** Built with Tailwind CSS and Lucide Icons for a sleek, premium, glassmorphism look.

## Tech Stack
- **Frontend & Backend:** Next.js (App Router), React, Tailwind CSS
- **Vector Database & Embeddings:** Pinecone (Native Inference API)
- **LLM / Inference:** Groq SDK (Llama-3.3)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Krish9006/AI-Insights.git
   cd AI-Insights
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory and add the following keys. (See `.env.example` for reference).
   ```env
   GROQ_API_KEY=your_groq_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=content-index 
   # Note: Ensure your Pinecone index is created with '1024' dimensions and 'cosine' metric.
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## How it works (The RAG Approach)
1. **Ingest:** Text is split into chunks -> Embedded natively via Pinecone Inference API -> Upserted to Pinecone Vector Database.
2. **Retrieve:** User asks a question -> Question is embedded -> Pinecone returns Top-K matching chunks using cosine similarity.
3. **Generate:** Chunks are fed as context into Groq's Llama-3.3 model -> Model generates a highly accurate, hallucination-free answer at lightning speed.
