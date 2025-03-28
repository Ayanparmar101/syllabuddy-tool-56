
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ImageRun, Table, TableRow, TableCell, WidthType, TableBorders } from 'docx';
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
  
  // Document sections
  const children = [];
  
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
            type: "png",
          }),
        ],
      });
      
      children.push(logoParagraph);
    } catch (error) {
      console.error('Error adding logo to document:', error);
      // Continue without the logo if there's an error
    }
  }
  
  // Add title - "University Examinations" header
  children.push(
    new Paragraph({
      text: `University Examinations – ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: {
        bottom: {
          color: "000000",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
      heading: HeadingLevel.HEADING_2,
    })
  );
  
  // Create the course info table - matches the preview format
  const courseInfoTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            width: {
              size: 30,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                text: "Course Code",
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_3,
              }),
            ],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            width: {
              size: 40,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                text: "Course Title",
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_3,
              }),
            ],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            width: {
              size: 30,
              type: WidthType.PERCENTAGE,
            },
            children: [
              new Paragraph({
                text: "MAX MARKS",
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_3,
              }),
            ],
          }),
        ],
      }),
      // Values row
      new TableRow({
        children: [
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [
              new Paragraph({
                text: courseCode || "ECSCI24202",
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [
              new Paragraph({
                text: title,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [
              new Paragraph({
                text: totalMarks.toString(),
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
      // Duration row
      new TableRow({
        children: [
          new TableCell({
            borders: {
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [
              new Paragraph({
                text: "Session",
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_3,
              }),
            ],
          }),
          new TableCell({
            borders: {
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [
              new Paragraph({
                text: "",
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: "Duration",
                alignment: AlignmentType.LEFT,
                heading: HeadingLevel.HEADING_3,
              }),
              new Paragraph({
                text: duration,
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        ],
      }),
    ],
  });
  
  children.push(courseInfoTable);
  
  // Course outcomes section - using the instructions
  children.push(
    new Paragraph({
      text: "COURSE OUTCOMES:",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 },
    })
  );
  
  // Add instructions as a numbered list
  const instructionLines = instructions.split('\n');
  instructionLines.forEach((line, index) => {
    children.push(
      new Paragraph({
        text: `${index + 1}. ${line}`,
        spacing: { after: 100 },
      })
    );
  });
  
  // Instructions to students section
  children.push(
    new Paragraph({
      text: "INSTRUCTION TO THE STUDENTS:",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 },
    })
  );
  
  // Standard instructions
  const standardInstructions = [
    "Attempt all questions.",
    "Make suitable assumptions wherever necessary.",
    "Figures to the right indicate full marks."
  ];
  
  standardInstructions.forEach((instruction, index) => {
    children.push(
      new Paragraph({
        text: `${index + 1}. ${instruction}`,
        spacing: { after: 100 },
      })
    );
  });
  
  // Bloom's Taxonomy table
  children.push(
    new Paragraph({
      text: "BLOOM'S TAXONOMY [BT]:",
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 },
    })
  );
  
  const bloomTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "Remember", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "Understand", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "Apply", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "Analyze", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "Evaluate", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "Create", alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: {
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "R", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "U", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "A", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "N", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            borders: {
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            children: [new Paragraph({ text: "E", alignment: AlignmentType.CENTER })],
          }),
          new TableCell({
            children: [new Paragraph({ text: "C", alignment: AlignmentType.CENTER })],
          }),
        ],
      }),
    ],
  });
  
  children.push(bloomTable);
  
  // Separator before questions
  children.push(
    new Paragraph({
      text: "",
      spacing: { before: 400, after: 400 },
      border: {
        bottom: {
          color: "000000",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
    })
  );
  
  // Questions section
  children.push(
    new Paragraph({
      text: "Questions:",
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    })
  );
  
  // Process each question
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const questionNumber = index + 1;
    const marksText = question.marks ? ` [${question.marks} marks]` : '';
    
    // Add question text
    children.push(
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
    
    // Add a line showing the Bloom's level
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Bloom's Level: ${question.bloom_level.toUpperCase()}`,
            size: 20,
            color: "666666",
          })
        ],
        spacing: { after: 200 },
      })
    );
    
    // Add question image if available
    if (question.image_url) {
      try {
        const response = await fetch(question.image_url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        // Determine image type from URL
        let imageType: "png" | "jpg" = "png";
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
        
        children.push(imageParagraph);
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
        children: children
      }
    ]
  });
  
  // Generate the document
  const buffer = await Packer.toBlob(doc);
  
  // Save the document
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(buffer, fileName);
};
