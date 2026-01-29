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

  const skipCols = ["Base Price Per Inch", "Quantity Price"];
  const headerMapping = {
    "Price Per Item": "Total Price Per Item"
    // you can add other mappings if you want to rename them
  };

  table.innerHTML =
    `<tr>${headers
      .filter(h => !skipCols.includes(h))
      .map(h => `<th>${headerMapping[h] ?? h}</th>`) // use mapped name or original
      .join("")}<th>Drawing</th></tr>` +
    data.choices_array
      .map(
        row =>
          `<tr>${headers
            .filter(h => !skipCols.includes(h))
            .map(h => `<td>${row[h] != null ? row[h] : ""}</td>`)
            .join("")}</tr>`
      )
      .join("");


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
    let svg = template;

    // Lead in
    const leadIn = parseFloat(row["Lead In For Piece"]);
    svg = svg.replace(
      /{leadin}/g,
      leadIn > 0 ? formatNumber(leadIn) : ""
    );

    // Length (always keep)
    svg = svg.replace(/{length}/g, formatNumber(row["Length"]));

    // Spacing
    const spacing = parseFloat(row["Spacing"]);
    svg = svg.replace(
      /{spacing}/g,
      spacing > 0 ? formatNumber(spacing) : ""
    );

    // Holes
    if (parseInt(row["Hole Amount"], 10) > 0) {
      svg = svg.replace(/{holes}/g, row["Hole Amount"]);
    } else {
      // Replace the whole hole callout with "No Holes"
      svg = svg.replace(
        /Ø\.\d+\s+THRU, <tspan[^>]*>\{holes\}X<\/tspan>/g,
        "No Holes"
      );
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

  //Download single zclip PDF
  function downloadPDF(filename, svgContent, row) {
    const margin = 36;
    const headerHeight = 100;
    let tableTopY = 1000; // place the info table below drawing
    let noteY = 1300;

    const logo = new Image();
    logo.src = "../img/image/Monarch3Logo.png";

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
      // pdf.setFontSize(30);
      // pdf.text("Order Summary", pageWidth - margin, topY + 30, { align: "right" });

      pdf.setFontSize(18);
      pdf.text(new Date().toLocaleDateString(), pageWidth - margin, topY + 30, { align: "right" });

      let headerInfoY = topY + logoHeight + 40;
      if (data.choices_array?.length) {
        const sample = data.choices_array[0];
        let lines = [];
        // if (sample["Company Name"]) lines.push(`Company Name: ${sample["Company Name"]}`);
        // if (sample["Project Name"]) lines.push(`Project Name: ${sample["Project Name"]}`);

        if (lines.length) {
          pdf.setFontSize(13);

          // Company + Project on the right
          lines.forEach((txt, idx) => {
            pdf.text(txt, pageWidth - margin, (topY + 85) + idx * 25, { align: "right" });
          });

          // Find the bottom Y of those lines
          headerInfoY = (topY + 85) + (lines.length - 1) * 25;

          // Add some spacing
          headerInfoY += 30;
        }
      }

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
          weight = (2.442 / 144) * row?.["Length"];
          weight = weight.toFixed(3);
          break;

        case "MF375":
          hole_size = 203;
          tableTopY = 1100;
          noteY = 1350;
          weight = (2.681 / 144) * row?.["Length"];
          weight = weight.toFixed(3);
          break;

        case "MF625":
          hole_size = 203;
          tableTopY = 1220;
          noteY = 1450;
          weight = (2.484 / 144) * row?.["Length"];
          weight = weight.toFixed(3);
          break;

        case "MFSTR-050":
          hole_size = 250;
          weight = (4.133 / 144) * row?.["Length"];
          weight = weight.toFixed(3);
          break;

        case "MFSTR-075":
          hole_size = 250;
          weight = (9.231 / 144) * row?.["Length"];
          weight = weight.toFixed(3);
          break;

        case "MFSTR-0375":
          hole_size = 250;
          tableTopY = 1100;
          noteY = 1350;
          weight = (6.143 / 144) * row?.["Length"];
          weight = weight.toFixed(3);
          break;
      }

      const holeAmount =
        row?.["Hole Amount"] > 0 ? `${row["Hole Amount"]}, Ø.${hole_size}` : "None";

      // --- Info Table (headers across, values in one row) ---
      const headers = [
        "Weight",
        "Material",
        "Finish"
      ];
      const values = [
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
        styles: { fontSize: 18, cellPadding: 32, halign: "center", valign: "middle", textColor: 0 },
        headStyles: { fontSize: 20, fillColor: [179, 0, 0], textColor: 255, fontStyle: "bold" },
        margin: { left: centerX, right: centerX }
      });

      pdf.setFontSize(25);
      pdf.text("Notes:", margin, noteY, { align: "left" });

      const pageHeight = pdf.internal.pageSize.getHeight();

      let property_text = "PROPRIETARY AND CONFIDENTIAL. THE INFORMATION CONTAINED IN THIS DRAWING IS THE SOLE PROPERTY OF MONARCH METAL INC. ANY REPRODUCTION IN PART OR AS A WHOLE WITHOUT THE WRITTEN PERMISSION OF MONARCH METAL INC. IS PROHIBITED."
      pdf.setFontSize(10);
      pdf.text(property_text, pageWidth / 2, pageHeight - 20, { align: "center" });

      pdf.save(filename);
      URL.revokeObjectURL(url);
    });
  }

  //Render drawing buttons after table is built
  renderDrawings(data.choices_array); //--> UNCOMMENT TO HAVE DATA RENDER


  function buildRowTableData(row, hole_size, weight) {

    const headers = [
      "Customer", "Quantity", "Length", "Spacing", "Holes",
      "Lead In", "Price Per Piece", "Total Price For Item", "Weight", "Material", "Finish"
    ];

    // Build hole amount conditionally
    const holeAmount =
      row?.["Hole Amount"] > 0 ? `${row["Hole Amount"]}, Ø.${hole_size}` : "None";

    const values = [
      row?.["Company Name"] || "",
      row?.Quantity || "",
      row?.Length || "",
      row?.["Spacing"] || "",
      holeAmount,
      row?.["Lead In For Piece"] || "",
      row?.["Price Per Piece"] || "",
      row?.["Price Per Item"] || "",
      `${weight} lbs`,
      "Aluminum 6063",
      "Mill"
    ];
    const filtered = headers.map((h, i) => ({ header: h, value: values[i] }))
      .filter(col => col.value !== "" && col.value != null);
    return {
      headers: filtered.map(c => c.header),
      body: [filtered.map(c => c.value)]
    };
  }

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
      doc.text("Order Summary", pageWidth - margin, topY + 20, { align: "right" });
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin, topY + 40, { align: "right" });

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

      // --- Summary Table -->

      const summaryHeaders = [
        "Custom Part Name",
        "Lead In For Piece",
        "Quantity",
        "Full Lengths Needed",
        "Length",
        "Spacing",
        "Hole Amount",
        // "Base Price Per Inch",
        // "Quantity Price",       // becomes "Bulk Price"
        "Price Per Piece",
        "Price Per Item"
      ];

      // Map display names
      const headerMapping = {
        "Custom Part Name": "Custom Part Name",
        "Lead In For Piece": "Lead In",
        Quantity: "Quantity",
        "Full Lengths Needed": "Full Lengths Needed",
        Length: "Length",
        Spacing: "Spacing",
        "Hole Amount": "Hole Amount",
        "Base Price Per Inch": "Base Price/Inch",
        "Quantity Price": "Bulk Price",
        "Price Per Piece": "Price Per Piece",
        "Price Per Item": "Total Price For Item"
      };

      const formattedHeaders = summaryHeaders.map(h => headerMapping[h] || h);

      // Build body rows in same order
      const bodyRows = data.choices_array.map(r =>
        summaryHeaders.map(h => (r[h] != null ? r[h] : ""))
      );

      doc.autoTable({
        head: [formattedHeaders],
        body: bodyRows,
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

          const totalPages = doc.internal.getNumberOfPages();
          for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFontSize(8);
            doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: "right" });
          }

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
        logoRow.src = "../img/image/Monarch3Logo.png";

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
          doc.text("Order Summary", pageWidth - margin, topY + 20, { align: "right" });
          doc.setFontSize(10);
          doc.text(new Date().toLocaleDateString(), pageWidth - margin, topY + 40, { align: "right" });

          // --- Custom Part Name ---
          if (row && row["Custom Part Name"]) {
            doc.setFontSize(22);
            doc.setTextColor(0, 0, 0);
            doc.text(row["Custom Part Name"], pageWidth / 2, margin + headerHeight + 40, { align: "center" });
          }

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = svgImg.width;
          canvas.height = svgImg.height;
          ctx.drawImage(svgImg, 0, 0);

          // --- Render SVG ---
          const maxSvgWidth = pageWidth * 0.8; // increase max width (bigger image)
          const scale = maxSvgWidth / canvas.width;
          const svgWidth = canvas.width * scale;
          const svgHeight = canvas.height * scale;

          // align left of SVG with left of logo
          const svgX = margin;  // same as logo's left
          const svgTop = margin + headerHeight + 40;

          doc.addImage(canvas, "PNG", svgX, svgTop, svgWidth, svgHeight);

          // const svgBottom = svgTop - svgHeight;

          // --- Weight & Hole Size ---
          let hole_size = 0;
          let weight = 0;
          let tableTopY = 0;

          switch (row?.["Z Clip Type"]) {
            case "MF250":
              hole_size = 203;
              weight = (2.442 / 144) * row?.["Length"];
              tableTopY = 375;
              break;
            case "MF375":
              hole_size = 203;
              weight = (2.681 / 144) * row?.["Length"];
              tableTopY = 400;
              break;
            case "MF625":
              hole_size = 203;
              weight = (2.484 / 144) * row?.["Length"];
              tableTopY = 450;
              break;
            case "MFSTR-050":
              hole_size = 250;
              weight = (4.133 / 144) * row?.["Length"];
              tableTopY = 350;
              break;
            case "MFSTR-075":
              hole_size = 250;
              weight = (9.231 / 144) * row?.["Length"];
              tableTopY = 375;
              break;
            case "MFSTR-0375":
              hole_size = 250;
              weight = (6.143 / 144) * row?.["Length"];
              tableTopY = 415;
              break;
          }
          weight = weight.toFixed(3);

          // --- Info Table (under SVG) ---
          const { headers: rowHeaders, body: rowBody } = buildRowTableData(row, hole_size, weight);

          doc.autoTable({
            head: [rowHeaders],
            body: rowBody,
            startY: tableTopY,
            tableWidth: pageWidth * 0.9,
            styles: { fontSize: 8, cellPadding: 12, halign: "center", valign: "middle", textColor: 0 },
            headStyles: { fontSize: 8, fillColor: [179, 0, 0], textColor: 255, fontStyle: "bold" },
            margin: { left: (pageWidth * 0.1) / 2 }
          });

          // --- Notes (directly under table) ---
          const finalY = tableTopY + 110;
          doc.setFontSize(15);
          doc.text("Notes:", margin, finalY - 15, { align: "left" });

          // --- Disclaimer at bottom ---
          const property_text =
            "PROPRIETARY AND CONFIDENTIAL. THE INFORMATION CONTAINED IN THIS DRAWING IS THE SOLE PROPERTY OF MONARCH METAL FABRICATION. ANY REPRODUCTION IN PART OR AS A WHOLE WITHOUT THE WRITTEN PERMISSION OF MONARCH METAL INC. IS PROHIBITED.";
          doc.setFontSize(6);
          doc.text(property_text, pageWidth / 2, pageHeight - 35, { align: "center" });

          // --- Page Number (bottom-right) ---

          URL.revokeObjectURL(url);
          addDrawings(index + 1);
        });

      };

      addDrawings();
    }
  });

});