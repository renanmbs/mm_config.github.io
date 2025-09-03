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
  const downloadBtn = document.getElementById("downloadPdfBtn");
  downloadBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 10;

    const img = new Image();
    img.src = "../img/Monarch3Logo.png";

    img.onload = () => {
      const ratio = Math.min(50 / img.width, 25 / img.height);
      const width = img.width * ratio;
      const height = img.height * ratio;

      doc.addImage(img, "PNG", margin, margin, width, height);

      const startY = margin + height + 5;
      const colWidth = (doc.internal.pageSize.getWidth() - margin * 2) / headers.length;

      doc.autoTable({
        head: [headers],
        body: data.choices_array.map(r => headers.map(h => r[h] || "")),
        startY,
        styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak', halign: 'left' },
        headStyles: { fillColor: [179, 0, 0], textColor: 255 },
        columnStyles: headers.reduce((acc, h) => ({ ...acc, [h]: { cellWidth: colWidth } }), {}),
        margin: { left: margin, right: margin }
      });

      const finalY = doc.lastAutoTable?.finalY || startY;
      doc.text(`Total Order Price: $${data.price_per_group}`, margin, finalY + 10);
      doc.save("results.pdf");
    };

    img.onerror = () => alert("Logo PNG not found at ../img/Monarch3Logo.png");
  });
});