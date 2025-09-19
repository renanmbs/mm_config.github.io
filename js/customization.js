// UI and UX Components for Z Clip Customization Form

// When the DOM is fully loaded, initialize event listeners and form validation
document.addEventListener("DOMContentLoaded", () => {
  const userChoiceContainer = document.getElementById("user_choice_container");
  const addChoiceBtn = document.getElementById("add_choice_btn");
  const form = document.getElementById("customerForm");

  const clearAllBtn = document.getElementById("clear_all");

  clearAllBtn.addEventListener("click", () => {
    location.reload();
  });

  // Add event listeners for buttons inside user_choice dynamically (event delegation)
  userChoiceContainer.addEventListener("click", (e) => {

    if (e.target.classList.contains("clear-btn")) {
      clearUserChoice(e.target);
    }
    else if (e.target.classList.contains("remove-btn")) {
      removeUserChoice(e.target);
    }


    //UNCOMMENT THIS IF YOU WANT TO ENABLE UNIQUE PROJECT NAME
    // else if (e.target.classList.contains("change-btn")) {
    //   changeProjectName(e.target);
    // }

  });

  // Add new user choice options
  addChoiceBtn.addEventListener("click", () => {
    addUserChoice();
  });

  // Handle form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;
    const userChoices = userChoiceContainer.querySelectorAll(".user_choice1");

    userChoices.forEach(choice => {
      const lengthInput = choice.querySelector('input[name="len"]');
      const lenVal = parseFloat(lengthInput.value);

      if (!isIncrement(lenVal, 1.5, 0.25)) {
        isValid = false;
        lengthInput.setCustomValidity("Length must be in 0.25\" increments starting from 1.5\".");
        lengthInput.reportValidity();
      }

      else {
        lengthInput.setCustomValidity("");
      }

      const spaceInput = choice.querySelector('input[name="space"]');
      const spaceVal = parseFloat(spaceInput.value);

      if (!isIncrement(spaceVal, 1, 0.5)) {
        isValid = false;
        spaceInput.setCustomValidity("Spacing must be in 0.5\" increments starting from 1\".");
        spaceInput.reportValidity();
      }

      else {
        spaceInput.setCustomValidity("");
      }

      // Validate length > spacing (only flag one field)
      if (!isNaN(lenVal) && !isNaN(spaceVal)) {
        if (lenVal <= spaceVal) {
          isValid = false;
          // Flag spacing as the dependent variable
          spaceInput.setCustomValidity("Spacing must be smaller than length.");
          spaceInput.reportValidity();
          lengthInput.setCustomValidity("");
        }

        else {
          lengthInput.setCustomValidity("");
          spaceInput.setCustomValidity("");
        }
      }
    });

    if (!isValid) return;

    const data = gatherFormData();
    // console.log("Form data:", data);
    // alert("Check console for collected data.");
  });



  // Live validation for length > spacing
  userChoiceContainer.addEventListener("input", (e) => {
    const choice = e.target.closest(".user_choice1");
    if (!choice) return;

    const lengthInput = choice.querySelector('input[name="len"]');
    const lenVal = parseFloat(lengthInput.value);

    const spaceInput = choice.querySelector('input[name="space"]');
    const spaceVal = parseFloat(spaceInput.value);

    if (!isNaN(lenVal) && !isNaN(spaceVal)) {
      if (lenVal <= spaceVal) {
        // only flag the field being changed
        if (e.target === lengthInput) {
          lengthInput.setCustomValidity("Length must be greater than spacing.");
          spaceInput.setCustomValidity("");
          lengthInput.reportValidity();
        }

        else {
          spaceInput.setCustomValidity("Spacing must be smaller than length.");
          lengthInput.setCustomValidity("");
          spaceInput.reportValidity();
        }
      }

      else {
        lengthInput.setCustomValidity("");
        spaceInput.setCustomValidity("");
      }
    }
  });

  // Helper function to check increment step
  function isIncrement(value, base, step) {
    const remainder = (value - base) % step;
    return Math.abs(remainder) < 1e-8;
  }

  // Clear user choice inputs
  function clearUserChoice(button) {
    const block = button.closest(".user_choice1");
    if (!block) return;

    block.querySelectorAll("input, select").forEach(el => {
      if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      }

      else {
        el.value = "";
        el.setCustomValidity("");
      }
    });
  }

  // Remove extra Z Clip options
  function removeUserChoice(button) {
    const block = button.closest(".user_choice1");
    if (!block) return;

    const allChoices = userChoiceContainer.querySelectorAll(".user_choice1");
    if (allChoices.length > 1) {
      block.remove();
    }

    else {
      alert("At least one Z Clip option must remain.");
    }
  }

  // // Toggle Unique Project Name field
  // function changeProjectName() {
  //   const existing = document.getElementById("unique_proj_name");
  //   if (!existing) {
  //     const newName = document.createElement("div");
  //     newName.classList.add("user_choice1");
  //     newName.setAttribute("id", "unique_proj_name_block");

  //     newName.innerHTML =
  //       `<div class="input-row">
  //       <div class="input-group">
  //         <label for="unique_proj_name">Unique Project Name <span class="req">*</span></label>
  //         <div class="with-reset">
  //           <input type="text" id="unique_proj_name" name="unique_proj_name" required />
  //           <button type="button" class="reset-field" data-target="unique_proj_name">✕</button>
  //         </div>
  //       </div>
  //     </div>`;

  //     userChoiceContainer.appendChild(newName);

  //     newName.querySelector(".reset-field").addEventListener("click", () => {
  //       const input = document.getElementById("unique_proj_name");
  //       if (input) input.value = "";
  //     });

  //   }

  //   else {
  //     const block = document.getElementById("unique_proj_name_block");
  //     if (block) block.remove();
  //   }
  // }

  // Add new user choice block
  let choiceCount = 0;

  function addUserChoice() {
    // alert("Multi Product usability not finalized yet. Please use the single product options for now.");
    choiceCount++;
    const holeSizeGroupName = `hole_size_${choiceCount}`;

    const newChoice = document.createElement("div");
    newChoice.classList.add("user_choice1");
    newChoice.innerHTML = `
      <div class="input-row">
         <div class="input-group">
              <label for="zclip">Z Clip Options <span class="req">*</span></label>
              <select id="zclip" name="zclip" class="zclip" required>
                <option value="" selected disabled>Choose An Option</option>
                <option value="MF250">MF250</option>
                <option value="MF375">MF375</option>
                <option value="MF625">MF625</option>
                <option value="MFSTR-050">MFSTR-050</option>
                <option value="MFSTR-075">MFSTR-075</option>
                <option value="MFSTR-0375">MFSTR-0375</option>
              </select>
            </div>

            <div class="input-group">
              <label for="quant">Quantity <span class="req">*</span></label>
              <input type="number" id="quant" name="quant" min="1" step="1" required />
            </div>
      </div>

      <div class="input-row">

            <div class="input-group">
              <label for="len" class="tooltip" data-tooltip='Spacing must be in 0.25" increments'>
                Length <span class="span2">(Inches)</span>
                <span class="req">*</span>
              </label>

              <input type="number" name="len" min="1.5" max="144" step="0.25" placeholder='Choose from 1.5" to 144"'
                id="len" required />
            </div>

            <div class="input-group">
              <label for="space" class="tooltip" data-tooltip='Spacing must be in 0.5" increment'>
                Spacing <span class="span2">(Inches)</span><span class="req">*</span>
              </label>
              <input type="number" name="space" min="0" placeholder='Min. 0"' step="0.5" required id="space" />
            </div>

          </div>

      <div id="box"></div>

      <div class="input-row buttons">
        <button type="button" class="clear-btn">Clear</button>
        <button type="button" class="remove-btn">Remove This Option</button>
      </div>
    `;

    userChoiceContainer.appendChild(newChoice);
  }

  function gatherFormData() {
    const companyName = form.querySelector("#comp_name").value.trim();
    const projectName = form.querySelector("#proj_name").value.trim();

    const choices = [];
    userChoiceContainer.querySelectorAll(".user_choice1").forEach(choice => {
      const zclip = choice.querySelector('select[name="zclip"]').value;
      const quantity = parseInt(choice.querySelector('input[name="quant"]').value);
      const length = parseFloat(choice.querySelector('input[name="len"]').value);
      const spacing = parseFloat(choice.querySelector('input[name="space"]').value);

      choices.push({ zclip, quantity, length, spacing, companyName, projectName });
    });

    let total = calculateOrder(choices);

    return { companyName, projectName, total, choices };
  }
});

// Reset individual inputs outside DOMContentLoaded
document.querySelectorAll(".reset-field").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (input) input.value = "";
  });
});


/*CALCULATIONS*/

// Database of pricing tiers
const pricingTiers_MF625 = [
  { max: 19, price: 27.30 },
  { max: 39, price: 25.37 },
  { max: 79, price: 21.48 },
  { max: 159, price: 20.52 },
  { max: Infinity, price: 20.23 }
];

const pricingTiers_MF250 = [
  { max: 19, price: 30.22 },
  { max: 39, price: 28.28 },
  { max: 79, price: 24.40 },
  { max: 159, price: 23.43 },
  { max: Infinity, price: 23.14 }
];

const pricingTiers_MFSTR_050 = [
  { max: 19, price: 51.10 },
  { max: 39, price: 49.23 },
  { max: 79, price: 44.88 },
  { max: 159, price: 38.78 },
  { max: Infinity, price: 36.58 }
];

const pricingTiers_MFSTR_0375 = [
  { max: 19, price: 72.22 },
  { max: 39, price: 69.47 },
  { max: 79, price: 63.47 },
  { max: 159, price: 54.67 },
  { max: Infinity, price: 51.65 }
];

const pricingTiers_MFSTR_075 = [
  { max: 19, price: 107.69 },
  { max: 39, price: 103.62 },
  { max: 79, price: 94.66 },
  { max: 159, price: 81.57 },
  { max: Infinity, price: 77.11 }
];

let setup_fee = 50;

function computeHoleData(length, spacing) {
  // holesBetween = number of spacings that actually fit strictly inside the length

  if (!spacing || parseFloat(spacing) === 0) {
    return {
      hole_amount: 0,
      leadInForPiece: 0,
      leadIn: 0
    };
  }

  let holesBetween = Math.floor(length / spacing);

  if (Number.isInteger(length / spacing)) {
    // if spacing divides length exactly, there is one less interior spacing
    holesBetween -= 1;
  }

  // total holes = interior spacings + 1
  let hole_amount = holesBetween + 1;

  // total lead-in leftover across both ends
  const totalLeadIn = length - (holesBetween * spacing);
  let leadInForPiece = totalLeadIn / 2;

  // enforce 0.5" minimum lead-in each end; if we bump, we must remove one hole
  if (leadInForPiece < 0.5) {
    leadInForPiece = 0.5;
    hole_amount -= 1;
  }

  return {
    hole_amount,
    leadInForPiece,
    leadIn: totalLeadIn, // total for both ends (you were logging this)
  };
}

// Calculate Lead In and Hole Amount for each choice
function calculateLeadIn(choices) {
  const choices_holes = choices.map(c => computeHoleData(c.length, c.spacing));
  return { choices_holes };
}

// Calculate Single Price
function calculateSinglePrice(choices) {
  const choice_info = [];
  let total_inches_customer = 0;

  console.log("Single Item Product Breakdown:");
  console.log("\n");

  for (const choices_data of choices) {
    const { hole_amount, leadInForPiece } = computeHoleData(
      choices_data.length,
      choices_data.spacing
    );

    // Single Yield
    let singleYield;
    switch (choices_data.length) {
      case 12: singleYield = 11.875; break;
      case 18: singleYield = 17.875; break;
      case 24: singleYield = 23.875; break;
      case 36: singleYield = 35.875; break;
      case 48: singleYield = 47.875; break;
      case 140: singleYield = 139.875; break;
      case 144: singleYield = 143.875; break;
      default: singleYield = choices_data.length + 0.125;
    }

    console.log(choices_data.zclip + ":");

    console.log("Single Yield: " + singleYield);

    // Finished Parts per Stock Length
    const total_length_stock = choices_data.length < 6 ? 140 : 144;
    const amount_finished_part = Math.floor(total_length_stock / singleYield);

    // Lengths Needed
    const lengths_needed = Math.ceil(choices_data.quantity / amount_finished_part);

    // Quantity Price
    const quantity_price = getPrice(lengths_needed, choices_data.zclip);

    console.log("Quantity price: $" + quantity_price.toFixed(2));

    // Material Price
    let material_price = lengths_needed * quantity_price;

    console.log("Material price: $" + material_price.toFixed(2));

    if (choices_data.quantity < 100) {
      material_price += 25; // bulk material
      console.log("Cut charge for less than 100 pieces: $" + material_price.toFixed(2));
    }

    // Cut Charge per piece
    const cut_charge_per_piece = choices_data.quantity >= 100 ? 0.25 : 0;
    if (cut_charge_per_piece !== 0) console.log(`Cut charge for 100+ pieces: $${cut_charge_per_piece.toFixed(2)}`);

    // Punch Charge
    const punch_charge_per_piece = hole_amount > 0 ? Math.max(hole_amount * 0.25, 0.55) : 0;
    console.log(`Punch charge: $${punch_charge_per_piece.toFixed(2)}`);

    // Total line price (material + punch + cut + setup)
    const total_line_price = material_price + (punch_charge_per_piece + cut_charge_per_piece) * choices_data.quantity + setup_fee; //50 setup fee
    console.log("Setup Fee: $" + setup_fee.toFixed(2));
    console.log("Price per item: $" + total_line_price.toFixed(2));

    // Price per piece
    const price_per_piece = total_line_price / choices_data.quantity;
    console.log("Price per piece: $" + price_per_piece.toFixed(2))

    // Track totals for price per inch
    const inches_customer = choices_data.length * choices_data.quantity;
    total_inches_customer += inches_customer;
    console.log(`Total inches: ${total_inches_customer}"`);
    // total_base_pool += total_line_price;

    const price_per_inch_line = total_line_price / inches_customer;
    console.log("Price per inch: $" + price_per_inch_line.toFixed(2));

    // Part name
    const custom_name = name_part(choices_data);

    choice_info.push({
      "Company Name": capitalizeFirstLetter(choices_data.companyName),
      "Project Name": capitalizeFirstLetter(choices_data.projectName),
      "Custom Part Name": custom_name,
      "Z Clip Type": choices_data.zclip,
      "Lead In For Piece": parseFloat(leadInForPiece),
      "Quantity": parseInt(choices_data.quantity),
      "Full Lengths Needed": lengths_needed,
      "Length": parseFloat(choices_data.length),
      "Spacing": parseFloat(choices_data.spacing),
      "Hole Amount": parseInt(hole_amount),
      "Base Price Per Inch": formatPrice(price_per_inch_line),
      "Quantity Price": formatPrice(quantity_price),
      "Price Per Piece": formatPrice(price_per_piece),
      "Price Per Item": formatPrice(total_line_price),
    });

    console.log("\n");
  }

  const total_order_price = total_order(choice_info);
  return choice_info;
}

// Get price based on quantity and Z clip type
function getPrice(quantity, zclip_type) {

  // console.log(zclip_type);

  let getPrice_result;

  switch (zclip_type) {
    case "MF625":
      getPrice_result = pricingTiers_MF625.find(tier => quantity <= tier.max).price;
      break;
    case "MF375":
      getPrice_result = pricingTiers_MF625.find(tier => quantity <= tier.max).price;
      break;
    case "MF250":
      getPrice_result = pricingTiers_MF250.find(tier => quantity <= tier.max).price;
      break;
    case "MFSTR-050":
      getPrice_result = pricingTiers_MFSTR_050.find(tier => quantity <= tier.max).price;
      break;
    case "MFSTR-0375":
      getPrice_result = pricingTiers_MFSTR_0375.find(tier => quantity <= tier.max).price;
      break;
    case "MFSTR-075":
      getPrice_result = pricingTiers_MFSTR_075.find(tier => quantity <= tier.max).price;
      break;
    default:
      throw new Error("Unknown zclip type: " + zclip_type);
  }
  return getPrice_result;
}

function capitalizeFirstLetter(string) {
  if (typeof string !== 'string' || string.length === 0) {
    return string; // Handle non-string input or empty strings
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Calculate Multiple Items Price
function calculateMultiPrice(choices) {
  // Build objects with computed hole data attached BEFORE sorting
  const piece_order_array = choices.map(c => {
    const hd = computeHoleData(c.length, c.spacing);
    return {
      zclip: c.zclip,
      quantity: c.quantity,
      length: c.length,
      spacing: c.spacing,
      companyName: c.companyName,
      projectName: c.projectName,
      hole_amount: hd.hole_amount,
      leadInForPiece: hd.leadInForPiece,
    };
  });

  // Sort by length from largest to smallest (step 1)
  piece_order_array.sort((a, b) => b.length - a.length);

  let total_lengths = 0;
  let sum_inches_customer = 0;

  // Compute packing and inches
  const total_length_stock = piece_order_array.length && piece_order_array[0].length < 6 ? 140 : 144;

  //console.log("Total length stock " + total_length_stock);

  // Build list of all parts for packing
  const allParts = [];
  for (const item of piece_order_array) {
    for (let q = 0; q < item.quantity; q++) {
      allParts.push(item.length);
    }
    sum_inches_customer += item.length * item.quantity;
  }

  console.log("Multiple Item Product Breakdown:");
  console.log("\n");
  console.log(`Total inches: ${sum_inches_customer}"`);

  total_lengths = packParts(allParts, total_length_stock);

  // Quantity price (part 6)
  const groupType = choices[0]?.zclip;
  const quantity_price = getPrice(total_lengths, groupType);

  console.log("Quantity price: $" + quantity_price);

  // Setup charge (quick calc)
  const setup_charge = setup_fee * piece_order_array.length;

  console.log("Setup Fee: $" + setup_charge);

  // Base price per inch calculation (before per-item loop)
  let cut_charge_total = 0;

  // If any item has quantity < 100, add $25 to the base pool
  if (piece_order_array.some(item => item.quantity < 100)) {
    cut_charge_total = 25;
    console.log("Cut charge for less than 100 pieces: $" + cut_charge_total);
  }

  if (!total_lengths || !sum_inches_customer) {
    return []; // or handle gracefully
  }

  // Base price per inch
  let base_pool = (quantity_price * total_lengths) + setup_charge + cut_charge_total;
  let base_per_inch = parseFloat((base_pool / sum_inches_customer).toFixed(2));

  console.log("Price per inch: $" + base_per_inch);
  console.log("\n");

  const choice_info = [];

  // Per-item prices
  for (const item of piece_order_array) {
    // Punch charge per item
    let punch_charge = item.hole_amount * 0.25;
    if (punch_charge < 0.55) punch_charge = 0.55;

    // Name
    let custom_name = name_part(item);

    console.log(custom_name);
    console.log(`Punch charge: $${punch_charge}`);

    // Cut charge per piece
    let cut_charge = item.quantity >= 100 ? 0.25 : 0;

    if (cut_charge !== 0) console.log(`Cut charge for 100+ pieces: $${cut_charge}`);

    // Per run per inch
    let per_run_per_inch = (item.length * base_per_inch) + punch_charge + cut_charge;
    per_run_per_inch = parseFloat(per_run_per_inch.toFixed(2));

    console.log(`Price per item per piece: $${per_run_per_inch}`);

    // Total price for that line
    let total_single = parseFloat((per_run_per_inch * item.quantity).toFixed(2));

    let unsorted_obj_answer = {
      "Company Name": capitalizeFirstLetter(item.companyName),
      "Project Name": capitalizeFirstLetter(item.projectName),
      "Custom Part Name": custom_name,
      "Z Clip Type": item.zclip,
      "Lead In For Piece": parseFloat(item.leadInForPiece),
      "Quantity": parseInt(item.quantity),
      "Full Lengths Needed": parseInt(total_lengths),
      "Length": parseFloat(item.length),
      "Spacing": parseFloat(item.spacing),
      "Hole Amount": parseInt(item.hole_amount),
      "Base Price Per Inch": formatPrice(base_per_inch),
      "Quantity Price": formatPrice(quantity_price),
      "Price Per Piece": formatPrice(per_run_per_inch),
      "Price Per Item": formatPrice(total_single),
    };

    choice_info.push(unsorted_obj_answer);
    console.log("\n")
  }

  let total_order_price = total_order(choice_info);
  total_order_price = total_order_price.toFixed(2);
  //DO SOMETHING WITH TOTAL ORDER PRICE
  return choice_info;
}

// Sort alphabetically the object
function sortObjectKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

// Calculate total order price
function total_order(choices) {
  let total = 0;

  for (const item of choices) {
    let raw = item["Price Per Item"];

    if (raw == null) continue; // skip missing

    // If it's already a number, use it
    if (typeof raw === "number") {
      total += raw;
      continue;
    }

    // Otherwise it's a string like "$1,234.56" — strip $ and commas, then parse
    const num = parseFloat(String(raw).replace(/[$,]/g, ""));
    if (!isNaN(num)) total += num;
    // else skip silently (or you can console.warn here)
  }

  return total;
}

//Function to calculate multi price and single price
function calculateOrder(choices) {
  const groups = {};
  let grand_total = 0;
  const all_results = [];

  for (const item of choices) {
    if (!groups[item.zclip]) groups[item.zclip] = [];
    groups[item.zclip].push(item);
  }

  for (const type in groups) {
    let group_results;

    if (groups[type].length > 1) {
      group_results = calculateMultiPrice(groups[type]);
    }

    else {
      group_results = calculateSinglePrice(groups[type]);
    }

    all_results.push(...group_results);
    grand_total += total_order(group_results);
  }

  // ONE CALL — prints the full merged dataset
  print_results(all_results, formatPrice(grand_total));
  return grand_total;
}

//Recursion function to calculate the lengths needed reutilizing drop
function packParts(parts, stockLength) {
  // Sort parts descending (largest first, helps efficiency)
  parts.sort((a, b) => b - a);

  let barsUsed = 0;

  while (parts.length > 0) {
    let remaining = stockLength;

    // Always start a new bar
    barsUsed++;

    for (let i = 0; i < parts.length;) {
      let part = parts[i];

      if (part <= remaining) {
        // Fits → cut it
        remaining -= part;
        parts.splice(i, 1);

        // If remainder is ≤ 6, scrap it and break
        if (remaining <= 6) break;
        //console.log("scrap under 6 inches");
      }

      else {
        // Doesn’t fit → try next smaller part
        i++;
      }
    }
  }

  return barsUsed;
}

//Naming part function
function name_part(choice) {
  const hole_diameter = .313;
  const hd = hole_diameter.toString().replace(/^0+/, '');

  let custom_name = `CUS-${choice.zclip}-${choice.length}`;
  if (choice.spacing && parseFloat(choice.spacing) > 0) {
    custom_name += `H${choice.spacing}`;
    //diameter: + `_D${hd}`
  }

  return custom_name;
}

// Format price with commas and two decimals
function formatPrice(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

//Function to print the results
function print_results(results_array, grand_total) {

  const formatted = results_array.map(item => {
    const obj = { ...item };
    for (const key of ["Base Price Per Inch", "Price Per Item", "Price Per Piece", "Quantity Price"]) {
      if (obj[key] != null && !String(obj[key]).startsWith('$')) {
        obj[key] = '$' + formatPrice(parseFloat(String(obj[key]).replace(/[$,]/g, "")));
      }
    }
    return obj;
  });

  const data = {
    price_per_group: formatPrice(grand_total),
    choices_array: formatted
  };

  localStorage.setItem("calc_results", JSON.stringify(data));

  window.open("./html/calculation_results.html", "_blank");
}