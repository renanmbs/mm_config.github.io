document.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("calc_results") || "{}");

  if (!data?.choices_array?.length) {
    document.body.innerHTML += "<p>No results found.</p>";
    return;
  }

  // --- Render Table ---
  const table = document.getElementById("resultsTable");
  let headers = [...new Set(data.choices_array.flatMap(Object.keys))];

  // Remove Company/Project Name if empty
  headers = headers.filter(h =>
    (h === "Company Name" || h === "Project Name")
      ? data.choices_array.some(obj => (obj[h] ?? "").trim() !== "")
      : true
  );

  table.innerHTML =
    `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>` +
    data.choices_array.map(row =>
      `<tr>${headers.map(h => `<td>${row[h] || ""}</td>`).join("")}</tr>`
    ).join("");

  // --- Show total ---
  const totalDiv = document.getElementById("total");
  if (totalDiv) totalDiv.textContent = `TOTAL ORDER PRICE: $${data.price_per_group}`;

  // --- PDF download ---
  // --- PDF download ---
  const downloadBtn = document.getElementById("downloadPdfBtn");
  downloadBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4"); // better precision with points
    const margin = 36; // left/right margin
    const topY = 40;   // top margin

    const img = new Image();
    img.src = "../img/Monarch3Logo.png";

    img.onload = () => {
      const pageWidth = doc.internal.pageSize.getWidth();

      // Scale logo
      const logoHeight = 40;
      const logoWidth = (img.width / img.height) * logoHeight;

      // Draw logo (top-left)
      doc.addImage(img, "PNG", margin, topY, logoWidth, logoHeight);

      // Header text (aligned right)
      doc.setFontSize(14);
      doc.text("Order Summary", pageWidth - margin, topY + 15, { align: "right" });
      
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin, topY + 30, { align: "right" });

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
          headerInfoY += lines.length * 20 + 10; // push table start down
        }
      }

      // Filter out Company/Project Name for table only
      const filteredHeaders = headers.filter(h => h !== "Company Name" && h !== "Z Clip Type" && h !== "Project Name");

      // Map headers to display names
      const headerMapping = {
        "Custom Part Name": "Custom Part Number",
        "Z Clip Type": "Z Clip",
        "Lead In For Piece": "Lead In",
        "Quantity": "Quantity",
        "Full Lengths Needed": "Full Lengths",
        "Length": "Length",
        "Spacing": "Spacing",
        "Hole Amount": "Hole Amount",
        "Base Price Per Inch": "Base Price Per Inch",
        "Price Per Item": "Price Per Item",
        "Price Per Piece": "Price Per Piece",
        "Quantity Price": "Quantity Price"
      };

      const formattedHeaders = filteredHeaders.map(h => headerMapping[h] || h);

      // Table
      doc.autoTable({
  head: [formattedHeaders],
  body: data.choices_array.map(r => filteredHeaders.map(h => r[h] || "")),
  startY: headerInfoY,
  styles: {
    fontSize: 10,
    cellPadding: 6,
    overflow: "linebreak",
    halign: "center",
    valign: "middle",
    textColor: 0,
    lineWidth: 0.2,
    lineColor: 0
  },
  headStyles: {
    fillColor: [179, 0, 0],
    textColor: 255,
    fontSize: 9,
    halign: "center",
    valign: "middle",
    lineWidth: 0
  },
  margin: { left: 5, right: 5 },
  tableWidth: "auto",
  columnStyles: filteredHeaders.reduce((acc, h, i) => {
    if (h === "Custom Part Name") {
      acc[i] = { cellWidth: "wrap", minCellWidth: 60, maxCellWidth: 140 }; // allow wrapping
    } else {
      acc[i] = { cellWidth: "wrap", minCellWidth: 40, maxCellWidth: 80 }; // other columns
    }
    return acc;
  }, {}),
  didDrawCell: function(data) {
    const { section, cell } = data;

    // Draw horizontal lines for body rows
    if (section === 'body' && data.row.index !== data.table.body.length - 1) {
      const x1 = cell.x;
      const x2 = cell.x + cell.width;
      const y = cell.y + cell.height;
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(x1, y, x2, y);
    }

    // Draw outside border around header
    if (section === 'head' && data.column.index === 0) {
      const headerX = cell.x;
      const headerY = cell.y;
      const headerHeight = cell.height;
      const headerWidth = data.table.columns.reduce((sum, col) => sum + col.width, 0);
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(headerX, headerY, headerWidth, headerHeight, "S"); // stroke only
    }
  }
});

      const finalY = doc.lastAutoTable?.finalY || headerInfoY;

      // Total price box
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0); // white text
      doc.rect(margin, finalY + 10, pageWidth - margin * 2, 20, "F");
      doc.setFontSize(13);
      doc.text(`TOTAL ORDER PRICE: $${data.price_per_group}`, margin, finalY + 25, { align: "left" });

      const companyName = data.choices_array[0]?.["Company Name"] || "UnknownCompany";
      doc.save(`Monarch Custom Z Clip ${companyName}.pdf`);
    };

    doc.setTextColor(0, 0, 0);

    img.onerror = () => alert("Logo PNG not found at ../img/Monarch3Logo.png");
  });
});