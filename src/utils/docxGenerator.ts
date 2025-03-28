
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ImageRun } from 'docx';
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
  const headerParagraphs = [];
  
  // Add logo if provided
  if (universityLogo) {
    try {
      const response = await fetch(universityLogo);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Create image paragraph
      const logoParagraph = new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new ImageRun({
            data: arrayBuffer,
            transformation: {
              width: 100,
              height: 100,
            },
            type: "png" as "png" | "jpg" | "gif" | "bmp" | "svg", // Type assertion for valid image types
          }),
        ],
      });
      
      headerParagraphs.push(logoParagraph);
    } catch (error) {
      console.error('Error adding logo to document:', error);
      // Continue without the logo if there's an error
    }
  }
  
  // Add title
  headerParagraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );
  
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
  const questionsParagraphs = [];
  
  // Process each question
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const questionNumber = index + 1;
    const marksText = question.marks ? ` [${question.marks} marks]` : '';
    
    // Add question text
    questionsParagraphs.push(
      new Paragraph({
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
        spacing: { after: question.image_url ? 100 : 200 },
      })
    );
    
    // Add question image if available
    if (question.image_url) {
      try {
        const response = await fetch(question.image_url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        // Determine image type from URL or default to png
        let imageType: "png" | "jpg" | "gif" | "bmp" | "svg" = "png";
        if (question.image_url.toLowerCase().endsWith('.jpg') || question.image_url.toLowerCase().endsWith('.jpeg')) {
          imageType = "jpg";
        }
        
        // Create image paragraph
        const imageParagraph = new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new ImageRun({
              data: arrayBuffer,
              transformation: {
                width: 300,
                height: 200,
              },
              type: imageType,
            }),
          ],
        });
        
        questionsParagraphs.push(imageParagraph);
      } catch (error) {
        console.error(`Error adding image for question ${questionNumber}:`, error);
        // Continue without the image if there's an error
      }
    }
  }
  
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
