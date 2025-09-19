const downloadBtn = document.getElementById("downloadPdfBtn");

  downloadBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const margin = 36;

    // Create the PDF document once
    const doc = new jsPDF("l", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- FIRST PAGE: Logo + Header + Date + Summary Table ---
    const logo = new Image();
    logo.src = "../img/Monarch3Logo.png";

    logo.onload = () => {
      const topY = margin;
      const logoHeight = 60;
      const logoWidth = (logo.width / logo.height) * logoHeight;

      // Logo
      doc.addImage(logo, "PNG", margin, topY, logoWidth, logoHeight);

      // Header text
      doc.setFontSize(16);
      doc.text("Order Summary", pageWidth - margin, topY + 30, { align: "right" });
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin, topY + 60, { align: "right" });

      // --- Company & Project Name (if available) ---
      let headerInfoY = topY + logoHeight + 40;
      if (data.choices_array?.length) {
        const sample = data.choices_array[0];
        let lines = [];
        if (sample["Company Name"]) lines.push(`Company Name: ${sample["Company Name"]}`);
        if (sample["Project Name"]) lines.push(`Project Name: ${sample["Project Name"]}`);
        lines.push(`Estimator: `);

        if (lines.length) {
          doc.setFontSize(13);
          lines.forEach((txt, idx) => {
            doc.text(txt, margin, headerInfoY + idx * 25);
          });
          headerInfoY += lines.length * 20 + 10;
        }
      }

      // --- Summary Table ---
      const filteredHeaders = headers.filter(
        h => h !== "Company Name" && h !== "Z Clip Type" && h !== "Project Name"
      );

      const headerMapping = {
        Quantity: "Quantity",
        Length: "Length",
        "Hole Amount": "Hole Amount",
        "Lead In For Piece": "Lead In",
        "Quantity Price": "Bulk Price",
        "Price Per Piece": "Price Per Piece",
        "Price Per Item": "Total Price For Item"
      };

      const formattedHeaders = filteredHeaders.map(h => headerMapping[h] || h);

      doc.autoTable({
        head: [formattedHeaders],
        body: data.choices_array.map(r =>
          filteredHeaders.map(h => (r[h] != null ? r[h] : ""))
        ),
        startY: headerInfoY,
        styles: { fontSize: 10, cellPadding: 6, halign: "center", valign: "middle" },
        headStyles: { fillColor: [179, 0, 0], textColor: 255, fontSize: 9 },
        margin: { left: 5, right: 5 }
      });

      let finalY = doc.lastAutoTable?.finalY || headerInfoY + 60;
      doc.setFontSize(16);
      doc.text(`TOTAL ORDER PRICE: $${data.price_per_group}`, margin, finalY + 25);

      // --- Append per-row formatted pages ---
      const addDrawings = (index = 0) => {
        if (index >= data.choices_array.length) {
          let companyName = data.choices_array[0]?.["Company Name"];
          let safeCompanyName = companyName
            ? companyName.replace(/[\/\\:*?"<>|]/g, "")
            : "";
          let fileName = safeCompanyName
            ? `Monarch Custom Z Clip ${safeCompanyName}.pdf`
            : `Monarch Custom Z Clip.pdf`;
          doc.save(fileName);
          return;
        }

        const row = data.choices_array[index];
        const svgContent = window[`svgRow${index}`];
        if (!svgContent) {
          addDrawings(index + 1);
          return;
        }

        const logoRow = new Image();
        logoRow.src = "../img/Monarch3Logo.png";

        const svgImg = new Image();
        const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        svgImg.src = url;

        Promise.all([
  new Promise(res => (logoRow.onload = () => res())),
  new Promise(res => (svgImg.onload = () => res()))
]).then(() => {
  doc.addPage();

  const headerHeight = 25;
  const topY = margin;

  // --- Logo ---
  const logoHeight = 40;
  const logoWidth = (logoRow.width / logoRow.height) * logoHeight;
  doc.addImage(logoRow, "PNG", margin, topY, logoWidth, logoHeight);

  // --- Header text ---
  doc.setFontSize(15);
  doc.text("Order Summary", pageWidth - margin, topY + 30, { align: "right" });
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(), pageWidth - margin, topY + 50, { align: "right" });

  // --- Custom Part Name ---
  if (row && row["Custom Part Name"]) {
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(row["Custom Part Name"], pageWidth / 2, margin + headerHeight + 40, { align: "center" });
  }

  // --- Render SVG ---
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = svgImg.width;
  canvas.height = svgImg.height;
  ctx.drawImage(svgImg, 0, 0);

  const maxSvgWidth = pageWidth * 0.9;
  const scale = maxSvgWidth / canvas.width;
  const svgWidth = canvas.width * scale;
  const svgHeight = canvas.height * scale;

  const svgX = margin;
  const svgTop = margin + headerHeight + 40;
  doc.addImage(canvas, "PNG", svgX, svgTop, svgWidth, svgHeight);

  const svgBottom = svgTop + svgHeight;

  // --- Info Table (directly under drawing) ---
  const tableTopY = svgBottom + 30;

  doc.autoTable({
    head: [formattedHeaders],
    body: filteredValues,
    startY: tableTopY,
    tableWidth: pageWidth * 0.9,
    styles: { fontSize: 8, cellPadding: 12, halign: "center", valign: "middle", textColor: 0 },
    headStyles: { fontSize: 8, fillColor: [179, 0, 0], textColor: 255, fontStyle: "bold" },
    margin: { left: (pageWidth * 0.1) / 2 }
  });

  // --- Notes (directly under table) ---
  const finalY = doc.lastAutoTable.finalY || tableTopY + 40;
  doc.setFontSize(18);
  doc.text("Notes:", margin, finalY + 30, { align: "left" });

  // --- Disclaimer ---
  const property_text = "PROPRIETARY AND CONFIDENTIAL. THE INFORMATION CONTAINED IN THIS DRAWING IS THE SOLE PROPERTY OF MONARCH METAL FABRICATION. ANY REPRODUCTION IN PART OR AS A WHOLE WITHOUT THE WRITTEN PERMISSION OF MONARCH METAL INC. IS PROHIBITED.";
  doc.setFontSize(6);
  doc.text(property_text, pageWidth / 2, pageHeight - 20, { align: "center" });

  URL.revokeObjectURL(url);
  addDrawings(index + 1);
})}}});
