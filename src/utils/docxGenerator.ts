
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import type { QuestionItem } from '@/hooks/useQuestionDatabase';

interface QuestionPaperOptions {
  title: string;
  subject: string;
  duration: string;
  instructions: string;
  questions: QuestionItem[];
  totalMarks: number;
  courseCode?: string;
  universityLogo?: string;
}

export const downloadQuestionPaper = async (options: QuestionPaperOptions) => {
  const { title, subject, duration, instructions, questions, totalMarks, courseCode, universityLogo } = options;
  
  // Create header section
  const headerParagraphs = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
  ];
  
  if (subject) {
    headerParagraphs.push(
      new Paragraph({
        text: `Subject: ${subject}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    );
  }
  
  if (courseCode) {
    headerParagraphs.push(
      new Paragraph({
        text: `Course Code: ${courseCode}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    );
  }
  
  if (duration) {
    headerParagraphs.push(
      new Paragraph({
        text: `Duration: ${duration}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    );
  }
  
  headerParagraphs.push(
    new Paragraph({
      text: `Total Marks: ${totalMarks}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );
  
  // Instructions section
  const instructionsParagraphs = [
    new Paragraph({
      text: 'Instructions:',
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: instructions,
      spacing: { after: 400 }
    })
  ];
  
  // Questions section
  const questionsParagraphs = questions.map((question, index) => {
    const questionNumber = index + 1;
    const marksText = question.marks ? ` [${question.marks} marks]` : '';
    
    return new Paragraph({
      children: [
        new TextRun({
          text: `${questionNumber}. `,
          bold: true
        }),
        new TextRun({
          text: question.text
        }),
        new TextRun({
          text: marksText,
          italics: true
        })
      ],
      spacing: { after: 200 },
    });
  });
  
  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerParagraphs,
          ...instructionsParagraphs,
          ...questionsParagraphs
        ]
      }
    ]
  });
  
  // Generate the document
  const buffer = await Packer.toBlob(doc);
  
  // Save the document
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(buffer, fileName);
};
