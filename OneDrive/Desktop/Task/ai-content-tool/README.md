# ContentBrain AI

A powerful AI-powered Content Assistant built with Next.js, Google Gemini, Groq (Llama-3), and Pinecone.

## Overview
ContentBrain AI is a Retrieval-Augmented Generation (RAG) tool that allows users to upload pieces of content (like blog articles or documents), store them in a vector database, and dynamically query the content. It also features a 1-click "Generate Insights" feature that automatically extracts Key Topics, New Content Ideas, and CTA Suggestions based on the uploaded knowledge base.

## Features
- **Data Ingestion:** Upload multiple pieces of text/content at once.
- **Vector Search (RAG):** Content is chunked, embedded using Google Gemini (`text-embedding-004`), and stored in Pinecone for semantic search.
- **Ultra-Fast AI Chat:** Uses Groq's Llama-3 (`llama3-8b-8192`) to answer user queries accurately based *only* on the ingested context.
- **Insight Generation:** Automatically outputs structured JSON data containing Key Topics, Content Ideas, and Call-to-Actions.
- **Modern UI:** Built with Tailwind CSS and Lucide Icons for a sleek, premium look.

## Tech Stack
- **Frontend & Backend:** Next.js (App Router), React, Tailwind CSS
- **Vector Database:** Pinecone
- **Embeddings:** Google Gemini (`@google/genai`)
- **LLM / Inference:** Groq SDK (Llama-3)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-content-tool
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=your_index_name (Ensure dimension is set to 768)
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## How it works (The RAG Approach)
1. **Ingest:** Text is split into chunks -> Embedded via Gemini -> Upserted to Pinecone.
2. **Retrieve:** User asks a question -> Question is embedded -> Pinecone returns Top-K matching chunks.
3. **Generate:** Chunks are fed as context into Groq's Llama-3 model -> Model generates an accurate, hallucination-free answer.
