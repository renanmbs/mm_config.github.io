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
    `<tr>${headers.map(h => `<th>${h}</th>`).join("")}<th>Drawing</th></tr>` +
    data.choices_array.map(row =>
      `<tr>${headers.map(h => `<td>${row[h] != null ? row[h] : ""}</td>`).join("")}</tr>`
    ).join("");

  // --- Show total ---
  const totalDiv = document.getElementById("total");
  if (totalDiv) totalDiv.textContent = `TOTAL ORDER PRICE: $${data.price_per_group}`;

  // --- Drawing functions ---
  async function loadTemplate(zclip) {
    const res = await fetch(`../img/zclips/${zclip}.svg`);
    // const res = await fetch(`../img/zclips/MF625.svg`);
    // console.log(zclip);
    return await res.text();
  }

  function formatNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? value : num.toFixed(3); // 3 decimals
}

 function generateSVG(template, row) {
  let svg = template
    .replace(/{leadin}/g, formatNumber(row["Lead In For Piece"]))
    .replace(/{length}/g, formatNumber(row["Length"]))
    .replace(/{spacing}/g, formatNumber(row["Spacing"]));

  // Only replace holes if > 0
  if (parseInt(row["Hole Amount"], 10) > 0) {
    svg = svg.replace(/{holes}/g, row["Hole Amount"]);
  } 
  else {
    // Remove the whole ", {holes}X" text
     svg = svg.replace(/, <tspan[^>]*>\{holes\}X<\/tspan>/g, "");
  }
  return svg;
}

  function downloadSVG(filename, content) {
    const blob = new Blob([content], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function renderDrawings(results) {
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const template = await loadTemplate(row["Z Clip Type"]);
      const svgContent = generateSVG(template, row);

      // Keep SVG in memory
      window[`svgRow${i}`] = svgContent;

      // Add a download button for each row
      const btn = document.createElement("button");
      btn.textContent = "Download Drawing";
      btn.classList.add("download_btn_draw");
      btn.onclick = () => downloadRow(i, row);

      const tr = table.rows[i + 1]; // +1 for header row
      const td = document.createElement("td");
      td.appendChild(btn);
      tr.appendChild(td);
    }
  }

  function downloadRow(i, row) {
    const svgContent = window[`svgRow${i}`];
    // const filename = `${row["Custom Part Name"] || "drawing"}_${i + 1}.svg`;
    const filename = `${row["Custom Part Name"] || "drawing"}.svg`;
    downloadSVG(filename, svgContent);
  }

  // Render drawing buttons after table is built
  // renderDrawings(data.choices_array); //--> UNCOMMENT TO HAVE DATA RENDER

  // --- PDF download ---
  const downloadBtn = document.getElementById("downloadPdfBtn");
  downloadBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");
    const margin = 36;
    const topY = 40;

    const img = new Image();
    img.src = "../img/Monarch3Logo.png";

    img.onload = () => {
      const pageWidth = doc.internal.pageSize.getWidth();

      // Logo
      const logoHeight = 40;
      const logoWidth = (img.width / img.height) * logoHeight;
      doc.addImage(img, "PNG", margin, topY, logoWidth, logoHeight);

      // Header text
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
          headerInfoY += lines.length * 20 + 10;
        }
      }

      // Table headers
      const filteredHeaders = headers.filter(
        h => h !== "Company Name" && h !== "Z Clip Type" && h !== "Project Name"
      );
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
        body: data.choices_array.map(r => filteredHeaders.map(h => r[h] != null ? r[h] : "")),
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
            acc[i] = { cellWidth: "wrap", minCellWidth: 60, maxCellWidth: 140 };
          } else {
            acc[i] = { cellWidth: "wrap", minCellWidth: 40, maxCellWidth: 80 };
          }
          return acc;
        }, {}),
        didDrawCell: function (data) {
          const { section, cell } = data;

          if (section === "body" && data.row.index !== data.table.body.length - 1) {
            const x1 = cell.x;
            const x2 = cell.x + cell.width;
            const y = cell.y + cell.height;
            doc.setDrawColor(0);
            doc.setLineWidth(0.2);
            doc.line(x1, y, x2, y);
          }

          if (section === "head" && data.column.index === 0) {
            const headerX = cell.x;
            const headerY = cell.y;
            const headerHeight = cell.height;
            const headerWidth = data.table.columns.reduce((sum, col) => sum + col.width, 0);
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.rect(headerX, headerY, headerWidth, headerHeight, "S");
          }
        }
      });

      const finalY = doc.lastAutoTable?.finalY || headerInfoY;

      // Total
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);
      doc.rect(margin, finalY + 10, pageWidth - margin * 2, 20, "F");
      doc.setFontSize(13);
      doc.text(`TOTAL ORDER PRICE: $${data.price_per_group}`, margin, finalY + 25, { align: "left" });

      let companyName = data.choices_array[0]?.["Company Name"];
      let safeCompanyName = companyName ? companyName.replace(/[\/\\:*?"<>|]/g, "") : "";
      let fileName = safeCompanyName
        ? `Monarch Custom Z Clip ${safeCompanyName}.pdf`
        : `Monarch Custom Z Clip.pdf`;

      doc.save(fileName);
    };

    img.onerror = () => alert("Logo PNG not found at ../img/Monarch3Logo.png");
  });
});