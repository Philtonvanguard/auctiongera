const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, WidthType, BorderStyle, ShadingType, HeadingLevel, PageOrientation } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 32, bold: true, font: "Arial", color: "1F4E78" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: {
          width: 12240,
          height: 15840
        },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: "AUCTIONGERA",
            bold: true,
            size: 40,
            color: "1F4E78"
          })
        ]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: "Online Shed Auction Platform",
            size: 24,
            color: "666666",
            italics: true
          })
        ]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 480 },
        children: [
          new TextRun({
            text: "Project Overview Report",
            size: 24,
            color: "999999"
          })
        ]
      }),

      // Section 1
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("What is AuctionGera?")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "AuctionGera is an online auction website designed to buy and sell sheds. Instead of traditional in-person auctions, customers can now bid on sheds from their computer or phone, anywhere, anytime."
          })
        ]
      }),

      new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: "Think of it like eBay, but specifically for sheds &#x2014; people place bids, the highest bidder wins, and we handle everything online."
          })
        ]
      }),

      // Section 2
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("How Does It Work?")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("For Customers")]
      }),

      new Paragraph({
        spacing: { line: 360, after: 200 },
        children: [
          new TextRun({
            text: "1.  Browse available sheds on the homepage\n2.  Click on a shed to see details and photos\n3.  Place a bid when the auction is live\n4.  Watch the countdown timer &#x2014; highest bidder wins\n5.  Arrange purchase and delivery"
          })
        ]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240 },
        children: [new TextRun("For Admin (Owner)")]
      }),

      new Paragraph({
        spacing: { line: 360, after: 400 },
        children: [
          new TextRun({
            text: "1.  Create a new auction with shed details\n2.  Set exact start and end date/time\n3.  Set starting price and bid increments\n4.  Monitor bids in real-time\n5.  Manage completed auctions"
          })
        ]
      }),

      // Section 3
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Key Features")]
      }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders,
                shading: { fill: "1F4E78", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  children: [new TextRun({ text: "Feature", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders,
                shading: { fill: "1F4E78", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  children: [new TextRun({ text: "What It Does", bold: true, color: "FFFFFF" })]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("Live Countdown Timers")] })]
              }),
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  children: [new TextRun("Shows exactly when each auction starts and ends. Updates automatically on the screen.")]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("Automatic Bid Buttons")] })]
              }),
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  children: [new TextRun("Customers can click quick buttons to bid (+1x, +2x, +5x, +10x) instead of typing amounts.")]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("Real-Time Bid Updates")] })]
              }),
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  children: [new TextRun("Customers see current bid amount update automatically every 5 seconds.")]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("Status Display")] })]
              }),
              new TableCell({
                borders,
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  children: [new TextRun("Each shed shows if it&#x2019;s &#x201C;Upcoming&#x201D;, &#x201C;Live Now&#x201D;, or &#x201C;Ended&#x201D;.")]
                })]
              })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { after: 400 }, children: [new TextRun("")] }),

      // Section 4
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Admin Login")]
      }),

      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun("Username: "), new TextRun({ text: "admin", bold: true })]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("Password: "), new TextRun({ text: "admin123", bold: true })]
      }),

      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({
          text: "Important: Change this password to something private immediately.",
          italics: true,
          color: "C00000"
        })]
      }),

      // Section 5
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Benefits")]
      }),

      new Paragraph({
        spacing: { line: 320, after: 200 },
        children: [
          new TextRun({
            text: "&#x2022;  Reach more customers &#x2014; people worldwide can bid, not just those who attend in-person\n\n&#x2022;  Available 24/7 &#x2014; customers can bid anytime, growing sales potential\n\n&#x2022;  Less effort &#x2014; no need to organize physical auctions\n\n&#x2022;  Transparent bidding &#x2014; everyone sees current prices and bid activity\n\n&#x2022;  Professional image &#x2014; modern online presence attracts more customers"
          })
        ]
      }),

      new Paragraph({ spacing: { after: 400 }, children: [new TextRun("")] }),

      // Section 6
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Current Status")]
      }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun("The website is now "), new TextRun({ text: "LIVE", bold: true, color: "00B050" }),
          new TextRun(" and running on the internet at:")]
      }),

      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({
          text: "https://auctiongera.up.railway.app",
          bold: true,
          color: "0563C1"
        })]
      }),

      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun("You can log in with your admin account and start creating auctions immediately.")]
      }),

      // Section 7
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("Next Steps")]
      }),

      new Paragraph({
        spacing: { line: 320 },
        children: [
          new TextRun({
            text: "1.  Change your admin password to something secure\n\n2.  Log in and create your first shed auction\n\n3.  Test with friends to make sure bidding works\n\n4.  Promote the website to start getting real customers\n\n5.  Monitor bids and manage completed auctions"
          })
        ]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:\\Users\\pmspi\\Auctiongera\\AUCTIONGERA_Report.docx", buffer);
  console.log("✓ Report created: AUCTIONGERA_Report.docx");
});
