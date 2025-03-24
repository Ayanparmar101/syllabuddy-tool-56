
import React from 'react';
import { Clock, Database, Loader2 } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentHistoryProps {
  documents: { id: string, title: string }[];
  historyFilter: string;
  setHistoryFilter: (filter: string) => void;
  isLoadingHistory: boolean;
  filteredQuestionsCount: number;
}

const DocumentHistory: React.FC<DocumentHistoryProps> = ({ 
  documents, 
  historyFilter, 
  setHistoryFilter, 
  isLoadingHistory,
  filteredQuestionsCount
}) => {
  return (
    <div className="bloom-card p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Document History</h2>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {documents.length} documents stored
          </span>
        </div>
      </div>

      {isLoadingHistory ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading stored documents...</span>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Select value={historyFilter} onValueChange={setHistoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Questions</SelectItem>
                <SelectItem value="latest">Latest 20</SelectItem>
                {documents.map(doc => (
                  <SelectItem key={doc.id} value={doc.title}>
                    {doc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className="flex items-center mb-2">
              <Database className="h-4 w-4 mr-2" />
              <span>Questions are stored in Supabase database</span>
            </div>
            {historyFilter !== 'all' && (
              <p>
                Showing {filteredQuestionsCount} questions
                {historyFilter !== 'latest' ? ` from "${historyFilter}"` : ''}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentHistory;
