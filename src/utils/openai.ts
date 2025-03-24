// OpenAI integration utility functions

import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker
// Import the worker directly to ensure it's bundled with the application
import 'pdfjs-dist/build/pdf.worker.min.mjs';

// Use a compatible worker setup approach
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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
            
            Extract ALL questions from the document, being sure to identify anything with a question mark as a question. Format your response as a JSON object with Bloom's levels as keys and arrays of questions as values.
            
            Important: If you can't find any questions in the document, create an array of placeholder sample questions categorized by bloom level that would be appropriate for the document content.`
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
      const errorData = await response.json();
      console.error('OpenAI API error response:', errorData);
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
    
    // Store the questions in Supabase
    await storeQuestionsInSupabase(categorized);
    
    return categorized;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

/**
 * Convert PDF page to image data URL
 */
const pdfPageToDataURL = async (pdfData: ArrayBuffer, pageNum: number = 1): Promise<string> => {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    
    // Get the requested page
    const page = await pdf.getPage(pageNum);
    
    // Set the scale for rendering
    const viewport = page.getViewport({ scale: 1.5 });
    
    // Create a canvas to render the page
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Unable to create canvas context');
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render the PDF page to the canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // Convert the canvas to a data URL (PNG format)
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error converting PDF page to image:', error);
    throw new Error('Failed to convert PDF page to image');
  }
};

/**
 * Analyze all pages of a PDF using OpenAI's GPT-4o Vision capabilities
 */
async function analyzeAllPDFPages(
  pdfArrayBuffer: ArrayBuffer,
  apiKey: string
): Promise<CategorizedQuestions> {
  // Get total number of pages from the PDF
  const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  
  console.log(`Processing PDF with ${totalPages} pages`);
  
  // Define max pages to process to avoid excessive API calls
  const MAX_PAGES_TO_PROCESS = 10;
  const pagesToProcess = Math.min(totalPages, MAX_PAGES_TO_PROCESS);
  
  // Process pages in batches to avoid overwhelming the GPU or API
  const BATCH_SIZE = 3;
  const allResults: CategorizedQuestions = {};
  
  // Show a message if we're limiting the pages
  if (totalPages > MAX_PAGES_TO_PROCESS) {
    console.log(`PDF has ${totalPages} pages. For performance reasons, only processing the first ${MAX_PAGES_TO_PROCESS} pages.`);
  }
  
  // Process pages in batches
  for (let batchStart = 0; batchStart < pagesToProcess; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, pagesToProcess);
    const batchPromises = [];
    
    // Create promises for each page in the batch
    for (let pageNum = batchStart + 1; pageNum <= batchEnd; pageNum++) {
      batchPromises.push(analyzePDFPage(pdfArrayBuffer, pageNum, apiKey));
    }
    
    // Wait for all pages in the batch to finish processing
    const batchResults = await Promise.all(batchPromises);
    
    // Merge batch results into the overall results
    batchResults.forEach(pageResult => {
      mergeCategorizedQuestions(allResults, pageResult);
    });
    
    // Small delay between batches to avoid rate limiting
    if (batchEnd < pagesToProcess) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // If we didn't find any questions, generate a placeholder question for each category
  const totalQuestions = Object.values(allResults).flat().length;
  if (totalQuestions === 0) {
    console.log("No questions found in PDF, creating placeholder questions");
    const currentDate = new Date().toISOString();
    
    // Generate a placeholder question for each bloom level
    const bloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    
    bloomLevels.forEach(level => {
      if (!allResults[level]) {
        allResults[level] = [];
      }
      
      // Add a placeholder question based on the bloom level
      allResults[level].push({
        id: uuidv4(),
        text: `Sample ${level} question about this document content?`,
        bloomLevel: level as any,
        confidence: 0.8,
        createdAt: currentDate
      });
    });
  }
  
  return allResults;
}

/**
 * Analyze a single PDF page using OpenAI's GPT-4o Vision
 */
async function analyzePDFPage(
  pdfArrayBuffer: ArrayBuffer,
  pageNum: number,
  apiKey: string
): Promise<CategorizedQuestions> {
  console.log(`Processing page ${pageNum}...`);
  
  try {
    // Convert the PDF page to an image
    const pdfImageDataUrl = await pdfPageToDataURL(pdfArrayBuffer, pageNum);
    
    // Extract the base64 data
    const base64Image = pdfImageDataUrl.split(',')[1];
    
    // Send the image to OpenAI
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
            Remember, Understand, Apply, Analyze, Evaluate, and Create. Your task is to analyze a PDF document and extract all questions, 
            then categorize each according to the appropriate Bloom's level.
            
            Remember: Questions that ask students to recall facts, terms, basic concepts, or answers. Keywords: define, describe, identify, list, name, recall, recognize.
            Understand: Questions that ask students to demonstrate understanding of facts and ideas. Keywords: explain, interpret, classify, compare, discuss, summarize.
            Apply: Questions that ask students to use acquired knowledge in new situations. Keywords: apply, demonstrate, implement, solve, use, calculate, execute.
            Analyze: Questions that ask students to examine and break information into parts. Keywords: analyze, categorize, compare, contrast, examine, test, differentiate.
            Evaluate: Questions that ask students to present and defend opinions. Keywords: evaluate, argue, defend, judge, select, support, value, critique.
            Create: Questions that ask students to compile information in a different way. Keywords: create, design, develop, formulate, construct, plan, produce.
            
            Extract ALL questions from the document, being sure to identify anything with a question mark as a question. Format your response as a JSON object with Bloom's levels as keys and arrays of questions as values.
            
            This is page ${pageNum} of a multi-page document. Focus only on extracting questions from this specific page.
            
            Important: If you can't find any questions in the document, identify key topics and create appropriate questions for those topics categorized by bloom level.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this PDF page image and extract all questions, categorizing them by Bloom's Taxonomy levels.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
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
      const errorData = await response.json();
      console.error(`OpenAI Vision API error on page ${pageNum}:`, errorData);
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
        result[category].forEach((question: string | {text: string, confidence?: number}) => {
          if (typeof question === 'string') {
            categorized[bloomLevel].push({
              id: uuidv4(),
              text: question,
              bloomLevel: bloomLevel,
              createdAt: currentDate
            });
          } else if (typeof question === 'object' && question.text) {
            categorized[bloomLevel].push({
              id: uuidv4(),
              text: question.text,
              bloomLevel: bloomLevel,
              confidence: question.confidence,
              createdAt: currentDate
            });
          }
        });
      }
    });
    
    console.log(`Page ${pageNum} processed successfully, found ${Object.values(categorized).flat().length} questions`);
    return categorized;
  } catch (error) {
    console.error(`Error processing page ${pageNum}:`, error);
    // Return empty result for this page, but don't fail the entire process
    return {};
  }
}

/**
 * Helper function to merge multiple categorized question sets
 */
function mergeCategorizedQuestions(
  target: CategorizedQuestions,
  source: CategorizedQuestions
): void {
  // For each category in the source
  Object.keys(source).forEach(category => {
    // If the category doesn't exist in the target, create it
    if (!target[category]) {
      target[category] = [];
    }
    
    // Add all questions from this category to the target
    target[category].push(...source[category]);
  });
}

/**
 * Analyze PDF document using OpenAI's GPT-4o Vision capabilities
 * This function now processes multiple pages of the PDF
 */
export const analyzePDFWithGPTVision = async (
  file: File, 
  apiKey: string
): Promise<CategorizedQuestions> => {
  try {
    // Validate API key format first
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format. OpenAI API keys should start with "sk-"');
    }

    console.log("Processing PDF document using GPT-4o vision capabilities");
    
    // Read the PDF file as ArrayBuffer
    const pdfArrayBuffer = await file.arrayBuffer();
    
    // Process all pages of the PDF
    const categorized = await analyzeAllPDFPages(pdfArrayBuffer, apiKey);
    
    // Save the document to Supabase
    const documentId = await saveDocumentToSupabase(file.name, file.type, new Date().toISOString());
    
    // Add document name to all questions
    Object.keys(categorized).forEach(category => {
      categorized[category].forEach(question => {
        question.documentName = file.name;
      });
    });
    
    // Store the questions in Supabase with document reference
    await storeQuestionsInSupabase(categorized, documentId);
    
    return categorized;
  } catch (error) {
    console.error('PDF processing error:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'PDF analysis failed';
    
    if (error.message.includes('Invalid API key format')) {
      errorMessage = `${errorMessage}: ${error.message}. Please provide a valid OpenAI API key`;
    } else if (error.message.includes('Authentication error')) {
      errorMessage = `${errorMessage}: ${error.message}. Please verify your API key`;
    } else if (error.message.includes('Authorization error')) {
      errorMessage = `${errorMessage}: ${error.message}. Please ensure your OpenAI account has access to GPT-4o`;
    } else if (error.message.includes('Rate limit exceeded')) {
      errorMessage = `${errorMessage}: ${error.message}. Please try again later`;
    } else if (error.message.includes('OpenAI API error')) {
      errorMessage = `${errorMessage}: ${error.message}`;
    } else if (error.message.includes('Failed to convert PDF page to image')) {
      errorMessage = `${errorMessage}: Could not convert your PDF to an image. Try with a different PDF or a simpler document.`;
    } else {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    throw new Error(errorMessage);
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

/**
 * Save document to Supabase
 */
const saveDocumentToSupabase = async (fileName: string, fileType: string, createdAt: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: fileName,
        file_type: fileType,
        file_url: 'local', // Since we're not actually uploading the file
        created_at: createdAt
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error saving document to Supabase:', error);
      return '';
    }
    
    return data.id;
  } catch (error) {
    console.error('Supabase error:', error);
    return '';
  }
};

/**
 * Store questions in Supabase
 */
export const storeQuestionsInSupabase = async (
  categorizedQuestions: CategorizedQuestions,
  documentId?: string
): Promise<void> => {
  try {
    // Flatten the categorized questions
    const allQuestions: any[] = [];
    
    Object.entries(categorizedQuestions).forEach(([bloomLevel, questions]) => {
      questions.forEach(question => {
        allQuestions.push({
          text: question.text,
          bloom_level: bloomLevel,
          document_id: documentId || null,
          created_at: question.createdAt,
          keywords: []
        });
      });
    });
    
    if (allQuestions.length > 0) {
      const { error } = await supabase
        .from('questions')
        .insert(allQuestions);
      
      if (error) {
        console.error('Error storing questions in Supabase:', error);
      }
    }
  } catch (error) {
    console.error('Supabase error:', error);
  }
};

/**
 * Get all questions from Supabase
 */
export const getAllQuestionsFromDatabase = async (): Promise<AnalyzedQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        text,
        bloom_level,
        created_at,
        documents(title)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting questions from Supabase:', error);
      return [];
    }
    
    // Transform the data into the expected format
    return data.map(item => ({
      id: item.id,
      text: item.text,
      bloomLevel: item.bloom_level as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create',
      createdAt: item.created_at,
      documentName: item.documents ? item.documents.title : undefined
    }));
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
};

/**
 * Get questions by bloom level from Supabase
 */
export const getQuestionsByBloomLevel = async (
  bloomLevel: string
): Promise<AnalyzedQuestion[]> => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        text,
        bloom_level,
        created_at,
        documents(title)
      `)
      .eq('bloom_level', bloomLevel)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting questions from Supabase:', error);
      return [];
    }
    
    // Transform the data into the expected format
    return data.map(item => ({
      id: item.id,
      text: item.text,
      bloomLevel: item.bloom_level as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create',
      createdAt: item.created_at,
      documentName: item.documents ? item.documents.title : undefined
    }));
  } catch (error) {
    console.error('Database error:', error);
    return [];
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

// Keep the IndexedDB functions for backward compatibility
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
 * Store questions in IndexedDB (for backward compatibility)
 */
export const storeQuestionsInDatabase = async (
  categorizedQuestions: CategorizedQuestions
): Promise<void> => {
  // Also store in Supabase
  await storeQuestionsInSupabase(categorizedQuestions);
  
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
