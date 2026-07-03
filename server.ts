/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy client setup to guarantee it won't crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to parse plain text/email thread/roster into structured org chart nodes
app.post('/api/gemini/parse-orgchart', async (req, res) => {
  try {
    const { text, existingNodes = [] } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text prompt description is required' });
      return;
    }

    const client = getAiClient();
    
    const prompt = `Analyze this organizational text description and convert it into a structured list of employees/reporting lines.
Each person should have a name, job title, department, email (or empty string), phone (or empty string), a manager name (the name of the person they report to, or empty/null if they are the CEO or root supervisor), a relationship level, and an influence level.

Current existing team member names in the org chart are: ${JSON.stringify(existingNodes.map((n: any) => n.name))}.
Try to match reporting manager names to existing ones where appropriate.

Text description:
"""
${text}
"""`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert HR systems analyst and Salesforce OrgChart extractor.
Your job is to read unstructured bios, company descriptions, emails, or roster lists and extract clean employee profile nodes.
Ensure that relationship status values map strictly to one of: 'champion', 'supporter', 'neutral', 'detractor', 'blocker'. (Default to 'neutral' if unclear).
Ensure that influence level values map strictly to one of: 'high', 'medium', 'low', 'none'. (Default to 'none' if unclear).
Your response must follow the strict JSON array schema provided.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Employee full name (e.g., John Smith)' },
              title: { type: Type.STRING, description: 'Job title / role (e.g., VP of Sales)' },
              department: { type: Type.STRING, description: 'Division or team (e.g., Enterprise Accounts)' },
              email: { type: Type.STRING, description: 'Email address, optional or predicted' },
              phone: { type: Type.STRING, description: 'Phone number, optional or predicted' },
              managerName: { type: Type.STRING, description: 'Name of the reporting manager / supervisor, or null if root' },
              relationship: {
                type: Type.STRING,
                description: "Stakeholder disposition: 'champion', 'supporter', 'neutral', 'detractor', 'blocker'",
              },
              influence: {
                type: Type.STRING,
                description: "Influence level: 'high', 'medium', 'low', 'none'",
              },
              notes: { type: Type.STRING, description: 'Brief bio details, pain points or interaction advice' },
            },
            required: ['name', 'title', 'department', 'relationship', 'influence'],
          },
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '[]');
    res.json({ result: parsedJson });
  } catch (error: any) {
    console.error('Gemini parsing failed:', error);
    res.status(500).json({ error: error.message || 'An error occurred during parsing' });
  }
});

// Configure Vite or Static Assets handling
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

setupApp();
