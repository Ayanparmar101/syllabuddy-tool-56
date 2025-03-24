
// OpenAI integration utility functions

import { v4 as uuidv4 } from 'uuid';

export interface AnalyzedQuestion {
  id: string;
  text: string;
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  confidence?: number;
  createdAt: string;
  documentName?: string;
}

export interface CategorizedQuestions {
  [key: string]: AnalyzedQuestion[];
}

/**
 * Analyze document content using OpenAI's GPT-4o to categorize questions
 * according to Bloom's Taxonomy levels
 */
export const analyzeDocumentWithGPT = async (
  content: string, 
  apiKey: string, 
  documentName?: string
): Promise<CategorizedQuestions> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert in Bloom's Taxonomy, which categorizes educational goals and objectives into six levels: 
            Remember, Understand, Apply, Analyze, Evaluate, and Create. Your task is to analyze a document and extract all questions, 
            then categorize each according to the appropriate Bloom's level.
            
            Remember: Questions that ask students to recall facts, terms, basic concepts, or answers. Keywords: define, describe, identify, list, name, recall, recognize.
            Understand: Questions that ask students to demonstrate understanding of facts and ideas. Keywords: explain, interpret, classify, compare, discuss, summarize.
            Apply: Questions that ask students to use acquired knowledge in new situations. Keywords: apply, demonstrate, implement, solve, use, calculate, execute.
            Analyze: Questions that ask students to examine and break information into parts. Keywords: analyze, categorize, compare, contrast, examine, test, differentiate.
            Evaluate: Questions that ask students to present and defend opinions. Keywords: evaluate, argue, defend, judge, select, support, value, critique.
            Create: Questions that ask students to compile information in a different way. Keywords: create, design, develop, formulate, construct, plan, produce.
            
            Please extract all questions from the document and categorize them. Format your response as a JSON object with Bloom's levels as keys and arrays of questions as values.`
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    // Transform the result into our expected format with timestamps
    const categorized: CategorizedQuestions = {};
    const currentDate = new Date().toISOString();
    
    // Process each category in the response
    Object.keys(result).forEach(category => {
      const bloomLevel = category.toLowerCase() as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
      
      if (!categorized[bloomLevel]) {
        categorized[bloomLevel] = [];
      }
      
      // If the result has an array of questions
      if (Array.isArray(result[category])) {
        result[category].forEach((question: string | {text: string, confidence?: number}, index: number) => {
          if (typeof question === 'string') {
            categorized[bloomLevel].push({
              id: uuidv4(),
              text: question,
              bloomLevel: bloomLevel,
              createdAt: currentDate,
              documentName
            });
          } else if (typeof question === 'object' && question.text) {
            categorized[bloomLevel].push({
              id: uuidv4(),
              text: question.text,
              bloomLevel: bloomLevel,
              confidence: question.confidence,
              createdAt: currentDate,
              documentName
            });
          }
        });
      }
    });
    
    // Store the questions in the database
    await storeQuestionsInDatabase(categorized);
    
    return categorized;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

/**
 * Analyze PDF document using OpenAI's GPT-4o vision capabilities to extract and categorize questions
 */
export const analyzePDFWithGPTVision = async (
  file: File, 
  apiKey: string
): Promise<CategorizedQuestions> => {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert in Bloom's Taxonomy, which categorizes educational goals and objectives into six levels: 
            Remember, Understand, Apply, Analyze, Evaluate, and Create. Your task is to analyze a document image and extract all questions, 
            then categorize each according to the appropriate Bloom's level.
            
            Remember: Questions that ask students to recall facts, terms, basic concepts, or answers. Keywords: define, describe, identify, list, name, recall, recognize.
            Understand: Questions that ask students to demonstrate understanding of facts and ideas. Keywords: explain, interpret, classify, compare, discuss, summarize.
            Apply: Questions that ask students to use acquired knowledge in new situations. Keywords: apply, demonstrate, implement, solve, use, calculate, execute.
            Analyze: Questions that ask students to examine and break information into parts. Keywords: analyze, categorize, compare, contrast, examine, test, differentiate.
            Evaluate: Questions that ask students to present and defend opinions. Keywords: evaluate, argue, defend, judge, select, support, value, critique.
            Create: Questions that ask students to compile information in a different way. Keywords: create, design, develop, formulate, construct, plan, produce.
            
            Please extract all questions from the document image and categorize them. Format your response as a JSON object with Bloom's levels as keys and arrays of questions as values.`
          },
          {
            role: 'user',
            content: [
              { 
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${base64Data}`
                }
              },
              {
                type: 'text',
                text: "Please identify and categorize all questions in this document according to Bloom's Taxonomy levels."
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Vision API response:", data);
    
    const result = JSON.parse(data.choices[0].message.content);

    // Transform the result into our expected format with timestamps
    const categorized: CategorizedQuestions = {};
    const currentDate = new Date().toISOString();
    
    // Process each category in the response
    Object.keys(result).forEach(category => {
      const bloomLevel = category.toLowerCase() as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
      
      if (!categorized[bloomLevel]) {
        categorized[bloomLevel] = [];
      }
      
      // If the result has an array of questions
      if (Array.isArray(result[category])) {
        result[category].forEach((question: string | {text: string, confidence?: number}, index: number) => {
          if (typeof question === 'string') {
            categorized[bloomLevel].push({
              id: uuidv4(),
              text: question,
              bloomLevel: bloomLevel,
              createdAt: currentDate,
              documentName: file.name
            });
          } else if (typeof question === 'object' && question.text) {
            categorized[bloomLevel].push({
              id: uuidv4(),
              text: question.text,
              bloomLevel: bloomLevel,
              confidence: question.confidence,
              createdAt: currentDate,
              documentName: file.name
            });
          }
        });
      }
    });
    
    // Store the questions in the database
    await storeQuestionsInDatabase(categorized);
    
    return categorized;
  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    throw error;
  }
};

/**
 * Convert file to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract the base64 part from data URL
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Database module for storing and retrieving questions
const DB_NAME = 'bloombuddy-db';
const QUESTIONS_STORE = 'analyzed-questions';

/**
 * Initialize IndexedDB database
 */
const initDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('Error opening database');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(QUESTIONS_STORE)) {
        const store = db.createObjectStore(QUESTIONS_STORE, { keyPath: 'id' });
        store.createIndex('bloomLevel', 'bloomLevel', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('documentName', 'documentName', { unique: false });
      }
    };
  });
};

/**
 * Store questions in IndexedDB
 */
export const storeQuestionsInDatabase = async (
  categorizedQuestions: CategorizedQuestions
): Promise<void> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([QUESTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(QUESTIONS_STORE);
    
    // Flatten the categorized questions
    const allQuestions: AnalyzedQuestion[] = [];
    Object.values(categorizedQuestions).forEach(questions => {
      allQuestions.push(...questions);
    });
    
    // Store each question
    allQuestions.forEach(question => {
      store.add(question);
    });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('Transaction error:', event);
        reject('Error storing questions');
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

/**
 * Get all questions from IndexedDB
 */
export const getAllQuestionsFromDatabase = async (): Promise<AnalyzedQuestion[]> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([QUESTIONS_STORE], 'readonly');
    const store = transaction.objectStore(QUESTIONS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Request error:', event);
        reject('Error getting questions');
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

/**
 * Get questions by bloom level from IndexedDB
 */
export const getQuestionsByBloomLevel = async (
  bloomLevel: string
): Promise<AnalyzedQuestion[]> => {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([QUESTIONS_STORE], 'readonly');
    const store = transaction.objectStore(QUESTIONS_STORE);
    const index = store.index('bloomLevel');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(bloomLevel);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error('Request error:', event);
        reject('Error getting questions');
      };
    });
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

/**
 * Format categorized questions from flat array
 */
export const formatCategorizedQuestions = (
  questions: AnalyzedQuestion[]
): CategorizedQuestions => {
  const categorized: CategorizedQuestions = {};
  
  questions.forEach(question => {
    if (!categorized[question.bloomLevel]) {
      categorized[question.bloomLevel] = [];
    }
    
    categorized[question.bloomLevel].push(question);
  });
  
  return categorized;
};
