
// OpenAI integration utility functions
// In a production environment, these API calls should be made server-side to protect your API key

export interface AnalyzedQuestion {
  id: string;
  text: string;
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  confidence?: number;
}

export interface CategorizedQuestions {
  [key: string]: AnalyzedQuestion[];
}

/**
 * Analyze document content using OpenAI's GPT-4o to categorize questions
 * according to Bloom's Taxonomy levels
 */
export const analyzeDocumentWithGPT = async (content: string, apiKey: string): Promise<CategorizedQuestions> => {
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

    // Transform the result into our expected format
    const categorized: CategorizedQuestions = {};
    
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
              id: `${bloomLevel}-${index}`,
              text: question,
              bloomLevel: bloomLevel
            });
          } else if (typeof question === 'object' && question.text) {
            categorized[bloomLevel].push({
              id: `${bloomLevel}-${index}`,
              text: question.text,
              bloomLevel: bloomLevel,
              confidence: question.confidence
            });
          }
        });
      }
    });
    
    return categorized;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};
