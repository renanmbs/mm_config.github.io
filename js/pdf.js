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
    return await res.text();
  }

  //Format 3 decimals
  function formatNumber(value) {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(3); // 3 decimals
  }

  //Generate SVG drawing for Zclip
  function generateSVG(template, row) {
    let svg = template
      .replace(/{leadin}/g, formatNumber(row["Lead In For Piece"]))
      .replace(/{length}/g, formatNumber(row["Length"]))
      .replace(/{spacing}/g, formatNumber(row["Spacing"]));

    //Only replace holes if > 0
    if (parseInt(row["Hole Amount"], 10) > 0) {
      svg = svg.replace(/{holes}/g, row["Hole Amount"]);
    }
    else {
      //Remove the whole ", {holes}X" text
      svg = svg.replace(/, <tspan[^>]*>\{holes\}X<\/tspan>/g, "");
    }
    return svg;
  }

  //Render Drawing for specific rows
  async function renderDrawings(results) {
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const template = await loadTemplate(row["Z Clip Type"]);
      const svgContent = generateSVG(template, row);

      // Keep SVG in memory
      window[`svgRow${i}`] = svgContent;

      // Add a PDF download button for each row
      const btn = document.createElement("button");
      btn.textContent = "Download Drawing";
      btn.classList.add("download_btn_draw");
      btn.onclick = () => {
        const filename = `${row["Custom Part Name"] || "drawing"}.pdf`;
        downloadPDF(filename, svgContent, row); // pass the row
      };

      const tr = table.rows[i + 1]; // +1 for header row
      const td = document.createElement("td");
      td.appendChild(btn);
      tr.appendChild(td);
    }
  }

  //
  function downloadPDF(filename, svgContent, row) {
    const margin = 36;
    const headerHeight = 100;
    let tableTopY = 1000; // place the info table below drawing
    let noteY = 1300;

    const logo = new Image();
    logo.src = "../img/Monarch3Logo.png";

    const svgImg = new Image();
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    svgImg.src = url;

    Promise.all([
      new Promise(res => (logo.onload = () => res())),
      new Promise(res => (svgImg.onload = () => res()))
    ]).then(() => {
      // --- Render SVG into canvas ---
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = svgImg.width;
      canvas.height = svgImg.height;
      ctx.drawImage(svgImg, 0, 0);

      // --- Create PDF ---
      const pdf = new jspdf.jsPDF("l", "pt", [canvas.width, canvas.height]);
      const pageWidth = pdf.internal.pageSize.getWidth();

      // --- Logo ---
      const logoHeight = 100;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      const topY = margin;

      // logo at top
      pdf.addImage(logo, "PNG", margin, topY, logoWidth, logoHeight);

      // header text also aligned to same topY
      pdf.setFontSize(30);
      pdf.text("Order Summary", pageWidth - margin, topY + 30, { align: "right" });

      pdf.setFontSize(18);
      pdf.text(new Date().toLocaleDateString(), pageWidth - margin, topY + 60, { align: "right" });

      // --- Custom Part Name ---
      if (row && row["Custom Part Name"]) {
        pdf.setFontSize(40);
        pdf.setTextColor(0, 0, 0);
        pdf.text(row["Custom Part Name"], pageWidth / 2, margin + headerHeight + 40, {
          align: "center"
        });
      }
      // --- SVG Drawing ---
      const maxSvgWidth = pageWidth * 0.98; // increase max width (bigger image)
      const scale = maxSvgWidth / canvas.width;
      const svgWidth = canvas.width * scale;
      const svgHeight = canvas.height * scale;

      // align left of SVG with left of logo
      const svgX = margin;  // same as logo's left
      const svgTop = margin + headerHeight + 80;

      pdf.addImage(canvas, "PNG", svgX, svgTop, svgWidth, svgHeight);

      let hole_size = 0;
      let weight = 0;

      switch (row?.["Z Clip Type"]) {
        case "MF250":
          hole_size = 203;
          weight = 2.442;
          break;
        case "MF375":
          hole_size = 203;
          tableTopY = 1100;
          noteY = 1350;
          weight = 2.681;
          break;
        case "MF625":
          hole_size = 203;
          tableTopY = 1220;
          noteY = 1450;
          weight = 2.484;
          break;
        case "MFSTR-050":
          hole_size = 250;
          weight = 4.133;
          break;
        case "MFSTR-075":
          hole_size = 250;
          weight = 9.231;
          break;
        case "MFSTR-0375":
          hole_size = 250;
          tableTopY = 1100;
          noteY = 1350;
          weight = 6.143;
          break;
      }

      // --- Info Table (headers across, values in one row) ---
      const headers = [
        "Customer",
        "Quantity",
        "Length",
        "Spacing",
        "Holes",
        "Lead In",
        "Price Per Piece",
        "Price For Item",
        "Weight",
        "Material",
        "Finish"
      ];
      const values = [
        row?.["Company Name"] || "",
        row?.Quantity || "",
        row?.Length || "",
        row?.["Spacing"] || "",
        `${row?.["Hole Amount"]}, Ø.${hole_size}` || "",
        row?.["Lead In For Piece"] || "",
        row?.["Price Per Piece"] || "",
        row?.["Price Per Item"] || "",
        `${weight} lbs`,
        "Aluminum 6063",
        "Mill"
      ];

      // Filter out empty columns
      let filtered = headers.map((h, i) => ({ header: h, value: values[i] }))
        .filter(col => col.value !== "" && col.value != null);

      const formattedHeaders = filtered.map(c => c.header);
      const filteredValues = [filtered.map(c => c.value)]; // autoTable expects an array of rows

      const tableWidth = pageWidth * 0.90; // 60% of page width
      const centerX = (pageWidth - tableWidth) / 2; // center the table

      pdf.autoTable({
        head: [formattedHeaders],
        body: filteredValues,
        startY: tableTopY,
        tableWidth: tableWidth,
        styles: { fontSize: 18, cellPadding: 32, halign: "center", valign: "middle", textColor: 0},
        headStyles: { fontSize: 20, fillColor: [179, 0, 0], textColor: 255, fontStyle: "bold" },
        margin: { left: centerX, right: centerX }
      });

      pdf.setFontSize(25);
      pdf.text("Notes:", margin, noteY, { align: "left" });

      pdf.save(filename);
      URL.revokeObjectURL(url);
    });
  }


  //Render drawing buttons after table is built
  renderDrawings(data.choices_array); //--> UNCOMMENT TO HAVE DATA RENDER

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

      // --- Company & Project Name ---
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

      // Table
      const filteredHeaders = headers.filter(
        h => h !== "Company Name" && h !== "Z Clip Type" && h !== "Project Name"
      );
      const headerMapping = { /* your mapping stays the same */ };
      const formattedHeaders = filteredHeaders.map(h => headerMapping[h] || h);

      doc.autoTable({
        head: [formattedHeaders],
        body: data.choices_array.map(r => filteredHeaders.map(h => r[h] != null ? r[h] : "")),
        startY: headerInfoY,
        styles: { fontSize: 10, cellPadding: 6, halign: "center", valign: "middle" },
        headStyles: { fillColor: [179, 0, 0], textColor: 255, fontSize: 9 },
        margin: { left: 5, right: 5 }
      });

      let finalY = doc.lastAutoTable?.finalY || headerInfoY;

      // Total
      doc.setFontSize(13);
      doc.text(`TOTAL ORDER PRICE: $${data.price_per_group}`, margin, finalY + 25);

      finalY += 60; // spacing before drawings

      // --- Append all drawings ---
      const addDrawings = (index = 0) => {
        if (index >= data.choices_array.length) {
          // done → save file
          let companyName = data.choices_array[0]?.["Company Name"];
          let safeCompanyName = companyName ? companyName.replace(/[\/\\:*?"<>|]/g, "") : "";
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

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function () {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const pageW = doc.internal.pageSize.getWidth() - margin * 2;
          const pageH = doc.internal.pageSize.getHeight() - margin * 2;
          let imgW = canvas.width;
          let imgH = canvas.height;

          // Scale down to fit within page margins
          if (imgW > pageW) {
            const scale = pageW / imgW;
            imgW *= scale;
            imgH *= scale;
          }
          if (imgH > pageH) {
            const scale = pageH / imgH;
            imgW *= scale;
            imgH *= scale;
          }

          // Add new page if needed
          if (finalY + imgH > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            finalY = margin;
          }

          doc.addImage(canvas, "PNG", margin, finalY, imgW, imgH);
          finalY += imgH + 30;

          URL.revokeObjectURL(url);
          addDrawings(index + 1);
        };

        img.src = url;
      };

      addDrawings();
    };
  });


});