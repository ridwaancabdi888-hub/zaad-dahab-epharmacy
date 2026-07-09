/**
 * Renders a titled PDF report from one or more { heading, head, body }
 * table sections — used by the Reports screen's "Export PDF" button.
 * jspdf/jspdf-autotable are dynamically imported so their ~180kB doesn't
 * sit in the main bundle for a feature only used on demand.
 */
export async function exportReportPdf({ title, generatedAt, sections }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new jsPDF();
  let cursorY = 18;

  doc.setFontSize(16);
  doc.setTextColor(0, 108, 73);
  doc.text(title, 14, cursorY);

  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  cursorY += 6;
  doc.text(`Generated ${generatedAt}`, 14, cursorY);

  for (const section of sections) {
    cursorY += 10;
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(section.heading, 14, cursorY);

    autoTable(doc, {
      startY: cursorY + 3,
      head: [section.head],
      body: section.body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14, right: 14 },
    });

    cursorY = doc.lastAutoTable.finalY;
  }

  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
