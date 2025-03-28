
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export type QuestionItem = {
  id: string;
  text: string;
  bloom_level: string;
  marks?: number;
  created_at?: string;
  keywords?: string[];
  image_url?: string | null;
};

type QuestionInput = Omit<QuestionItem, 'id' | 'created_at'>;

export const useQuestionDatabase = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setQuestions(data || []);
    } catch (err: any) {
      console.error('Error fetching questions:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuestion = async (questionData: QuestionInput) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([{
          id: uuidv4(),
          ...questionData,
          created_at: new Date().toISOString(),
        }])
        .select();
      
      if (error) throw error;
      
      // Update the local state with the new question
      setQuestions(prev => [data[0], ...prev]);
      
      return data[0];
    } catch (err: any) {
      console.error('Error adding question:', err);
      throw err;
    }
  };

  const updateQuestion = async (questionData: QuestionItem) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({
          text: questionData.text,
          bloom_level: questionData.bloom_level,
          marks: questionData.marks,
          image_url: questionData.image_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionData.id)
        .select();
      
      if (error) throw error;
      
      // Update the question in the local state
      setQuestions(prev => 
        prev.map(q => (q.id === questionData.id ? data[0] : q))
      );
      
      return data[0];
    } catch (err: any) {
      console.error('Error updating question:', err);
      throw err;
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove the question from the local state
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      console.error('Error deleting question:', err);
      throw err;
    }
  };

  return {
    questions,
    loading,
    error,
    fetchQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion
  };
};
