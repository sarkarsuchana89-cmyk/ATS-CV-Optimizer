const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = require('docx');

/**
 * Generates a 100% valid, ATS-compliant Word (.docx) document
 * Fully compatible with all versions of Microsoft Word, Word Online, LibreOffice & WPS
 */
async function generateDocx(cvData) {
  const children = [];
  const contact = cvData.contactInfo || {};

  // 1. Candidate Name (Header)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: (contact.name || 'Candidate Name').trim(),
          bold: true,
          size: 32, // 16pt
          font: 'Calibri',
          color: '0F172A'
        })
      ]
    })
  );

  // 2. Candidate Title (if present)
  if (contact.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: contact.title.trim(),
            bold: true,
            size: 22, // 11pt
            font: 'Calibri',
            color: '2B6CB0'
          })
        ]
      })
    );
  }

  // 3. Contact Information Line
  const contactParts = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.github
  ].filter(Boolean);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: contactParts.join('   |   '),
            size: 19, // 9.5pt
            font: 'Calibri',
            color: '475569'
          })
        ]
      })
    );
  }

  // Helper function for standard ATS Section Headings
  const addSectionHeader = (title) => {
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 100 },
        border: {
          bottom: {
            color: '2B6CB0',
            space: 4,
            style: BorderStyle.SINGLE,
            size: 8
          }
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22, // 11pt
            font: 'Calibri',
            color: '2B6CB0'
          })
        ]
      })
    );
  };

  // 4. Professional Summary
  if (cvData.summary) {
    addSectionHeader('Professional Summary');
    children.push(
      new Paragraph({
        spacing: { after: 160, line: 260 },
        children: [
          new TextRun({
            text: cvData.summary.trim(),
            size: 20, // 10pt
            font: 'Calibri',
            color: '334155'
          })
        ]
      })
    );
  }

  // 5. Core Skills
  if (cvData.skills && cvData.skills.length > 0) {
    addSectionHeader('Technical & Core Competencies');
    children.push(
      new Paragraph({
        spacing: { after: 160, line: 260 },
        children: [
          new TextRun({
            text: cvData.skills.join('   •   '),
            size: 20,
            font: 'Calibri',
            color: '334155'
          })
        ]
      })
    );
  }

  // 6. Professional Experience
  if (cvData.experience && cvData.experience.length > 0) {
    addSectionHeader('Professional Experience');

    for (const job of cvData.experience) {
      const roleText = job.role || 'Software Engineer';
      const companyText = job.company ? ` — ${job.company}` : '';
      const locationText = job.location ? ` (${job.location})` : '';

      children.push(
        new Paragraph({
          spacing: { before: 140, after: 40 },
          children: [
            new TextRun({
              text: `${roleText}${companyText}${locationText}`,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A'
            }),
            new TextRun({
              text: job.dates ? `     ${job.dates}` : '',
              italics: true,
              size: 19,
              font: 'Calibri',
              color: '64748B'
            })
          ]
        })
      );

      // Bullets
      if (job.bullets && job.bullets.length > 0) {
        for (const bullet of job.bullets) {
          children.push(
            new Paragraph({
              indent: { left: 360, hanging: 180 },
              spacing: { after: 50, line: 250 },
              children: [
                new TextRun({
                  text: '•  ',
                  bold: true,
                  size: 20,
                  font: 'Calibri',
                  color: '2B6CB0'
                }),
                new TextRun({
                  text: bullet.trim(),
                  size: 20,
                  font: 'Calibri',
                  color: '334155'
                })
              ]
            })
          );
        }
      }
    }
  }

  // 7. Projects
  if (cvData.projects && cvData.projects.length > 0) {
    addSectionHeader('Key Projects');

    for (const proj of cvData.projects) {
      const projHeader = proj.techStack ? `${proj.name} (${proj.techStack})` : proj.name;

      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: projHeader,
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '0F172A'
            })
          ]
        })
      );

      if (proj.bullets && proj.bullets.length > 0) {
        for (const bullet of proj.bullets) {
          children.push(
            new Paragraph({
              indent: { left: 360, hanging: 180 },
              spacing: { after: 50, line: 250 },
              children: [
                new TextRun({
                  text: '•  ',
                  bold: true,
                  size: 20,
                  font: 'Calibri',
                  color: '2B6CB0'
                }),
                new TextRun({
                  text: bullet.trim(),
                  size: 20,
                  font: 'Calibri',
                  color: '334155'
                })
              ]
            })
          );
        }
      }
    }
  }

  // 8. Education
  if (cvData.education && cvData.education.length > 0) {
    addSectionHeader('Education');

    for (const edu of cvData.education) {
      const eduHeader = [
        edu.degree,
        edu.institution ? `— ${edu.institution}` : '',
        edu.dates ? `(${edu.dates})` : ''
      ].filter(Boolean).join(' ');

      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: eduHeader,
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '0F172A'
            })
          ]
        })
      );

      if (edu.details && edu.details.length > 0) {
        for (const detail of edu.details) {
          children.push(
            new Paragraph({
              indent: { left: 360, hanging: 180 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: '•  ',
                  size: 20,
                  font: 'Calibri',
                  color: '2B6CB0'
                }),
                new TextRun({
                  text: detail.trim(),
                  size: 20,
                  font: 'Calibri',
                  color: '334155'
                })
              ]
            })
          );
        }
      }
    }
  }

  // 9. Certifications
  if (cvData.certifications && cvData.certifications.length > 0) {
    addSectionHeader('Certifications & Credentials');

    for (const cert of cvData.certifications) {
      children.push(
        new Paragraph({
          indent: { left: 360, hanging: 180 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: '•  ',
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '2B6CB0'
            }),
            new TextRun({
              text: cert.trim(),
              size: 20,
              font: 'Calibri',
              color: '334155'
            })
          ]
        })
      );
    }
  }

  // Create document with standard 1-inch margins and default styles
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
            color: '334155'
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch (1440 dxa)
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  generateDocx
};
