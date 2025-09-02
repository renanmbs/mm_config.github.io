// UI and UX Components for Z Clip Customization Form

/* CHANGES BETWEEN VERSIONS

- Changes on the length > spacing validation
- Console logs for debugging
- Details tab on how to use it

*/

/*
PRINT RESULTS:

- ONE PRODUCT - WORKS
- ONE PRODUCT, MULTIPLE ITEMS - WORKS
- MULTIPLE ITEMS, MULTIPLE PRODUCTS - DOESN'T WORK
*/ 

/*

TO DO:

- Solve multiple items, multiple products printing fix
- Check wrong hole amount (see image)
- Fix hole amount display

*/

// When the DOM is fully loaded, initialize event listeners and form validation
document.addEventListener("DOMContentLoaded", () => {
  const userChoiceContainer = document.getElementById("user_choice_container");
  const addChoiceBtn = document.getElementById("add_choice_btn");
  const form = document.getElementById("customerForm");

  const clearAllBtn = document.getElementById("clear_all");

  clearAllBtn.addEventListener("click", () => {
    const form = document.getElementById("customerForm");

    // Reset all inputs in the form
    form.querySelectorAll("input, select").forEach(el => {
      if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      } else {
        el.value = "";
        el.setCustomValidity(""); // Clear validation errors
      }
    });


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

  // Toggle Unique Project Name field
  function changeProjectName() {
    const existing = document.getElementById("unique_proj_name");
    if (!existing) {
      const newName = document.createElement("div");
      newName.classList.add("user_choice1");
      newName.setAttribute("id", "unique_proj_name_block");

      newName.innerHTML =
        `<div class="input-row">
        <div class="input-group">
          <label for="unique_proj_name">Unique Project Name <span class="req">*</span></label>
          <div class="with-reset">
            <input type="text" id="unique_proj_name" name="unique_proj_name" required />
            <button type="button" class="reset-field" data-target="unique_proj_name">✕</button>
          </div>
        </div>
      </div>`;

      userChoiceContainer.appendChild(newName);

      newName.querySelector(".reset-field").addEventListener("click", () => {
        const input = document.getElementById("unique_proj_name");
        if (input) input.value = "";
      });

    }

    else {
      const block = document.getElementById("unique_proj_name_block");
      if (block) block.remove();
    }
  }

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
                <option value="MF625">MF625</option>
                <option value="MF375">MF375</option>
                <option value="MF250">MF250</option>
                <option value="MFSTR-0375">MFSTR-0375</option>
                <option value="MFSTR-050">MFSTR-050</option>
                <option value="MFSTR-075">MFSTR-075</option>
              </select>
            </div>

            <div class="input-group">
              <label for="quant">Quantity <span class="req">*</span></label>
              <input type="number" id="quant" name="quant" min="1" step="1" required />
            </div>
      </div>

      <div class="input-row">

            <div class="input-group">
              <label for="len">Length <span class="span2">(Inches)</span><span class="tooltip"
                  data-tooltip='Spacing must be in 0.25" increment'><span class="req">*</span></span></label>
              <input type="number" name="len" min="1.5" max="144" step="0.25" placeholder='Choose from 1.5" to 144"'
                id="len" required />
            </div>

            <div class="input-group">
              <label for="space">Spacing <span class="span2">(Inches)</span><span class="tooltip"
                  data-tooltip='Spacing must be in 0.5" increment'><span class="req">*</span></span></label>
              <input type="number" name="space" min="1" placeholder='Min. 1"' step="0.5" required id="space" />
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

    // If same items, different sizes (Multi Product Calculator)
    // let calc_type;
    // if (choices.length === 1) {
    //   // Case 1: Only one product
    //   calc_type = "Single";
    // }
    // else if (choices.every(c => c.zclip === choices[0].zclip)) {
    //   // Case 2: Multiple products but all same type
    //   calc_type = "Multi";
    // }
    // else {
    //   // Case 3: Multiple products with different types
    //   calc_type = "Single";
    // }

    // console.log(calc_type);

    // // If different items (Single Product Calculator)
    // if (calc_type === "Multi") {
    //   console.log("Using Multi Product Calculator.");
    //   calculateMultiPrice(choices);
    // }

    // // If one item (Single Product Calculator)
    // else if (calc_type === "Single") {
    //   console.log("Using Single Product Calculator.");
    //   calculateSinglePrice(choices);
    //   //ADD CALCULATION FOR SINGLE PRODUCT
    // }
    //MULT AND SINGLE PRICE CALCULATIONS
    // calculateMultiPrice(choices);
    // calculateSinglePrice(choices);

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

function computeHoleData(length, spacing) {
  // holesBetween = number of spacings that actually fit strictly inside the length
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
// --- REPLACE calculateLeadIn with this thin wrapper (optional) ---
function calculateLeadIn(choices) {
  const choices_holes = choices.map(c => computeHoleData(c.length, c.spacing));
  return { choices_holes };
}

// Calculate Single Price

function calculateSinglePrice(choices) {
  const choice_info = [];

  for (const choices_data of choices) {
    const { hole_amount, leadInForPiece, leadIn } = computeHoleData(
      choices_data.length,
      choices_data.spacing
    );

    // Single Yield Calculation (Part 1)
    let singleYield;
    switch (choices_data.length) {
      case 12: singleYield = 11.875; break;
      case 18: singleYield = 17.875; break;
      case 24: singleYield = 23.875; break;
      case 36: singleYield = 35.875; break;
      case 48: singleYield = 47.875; break;
      default: singleYield = choices_data.length + 0.125;
    }

    // Finished Parts per Length (Part 2)
    const total_length_stock = choices_data.length < 6 ? 140 : 144;
    let amount_finished_part = Math.floor(total_length_stock / singleYield);

    // Lengths Needed (Part 3)
    let lengths_needed = Math.ceil(choices_data.quantity / amount_finished_part);

    // Quantity Price (Part 4)
    const quantity_price = getPrice(lengths_needed, choices_data.zclip);

    // Material Price (Part 5)
    const material_price = (lengths_needed * quantity_price);

    // Cut Charge (Part 6)
    let cut_charge = 0.25 * choices_data.quantity;
    if (cut_charge < 25) cut_charge = 25;

    // Total Punch Charge (Part 8)
    let total_punch_charge = hole_amount * 0.25;
    if (total_punch_charge < 0.55) total_punch_charge = 0.55;

    let total_punch_job = (total_punch_charge * choices_data.quantity) + 30;

    // Total Price (Part 9)
    let total_price = material_price + cut_charge + total_punch_job;

    // Price per piece (Part 10)
    let price_per_piece = total_price / choices_data.quantity;

    //CALCULATE TOTAL PRICE
    let total_single = price_per_piece * choices_data.quantity;

    //ADD PART NAME
    let custom_name = name_part(choices_data);

    let unsorted_obj_answer = {
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
      "Base Price Per Inch": "Not calculated for single price items",
      "Price Per Item": '$' + parseFloat(total_single.toFixed(2)),
      "Price Per Piece": '$' + parseFloat(price_per_piece.toFixed(2)),
      "Quantity Price": '$' + parseFloat(quantity_price)
    };

    choice_info.push(unsorted_obj_answer);
  }

  let total_order_price = total_order(choice_info);
  //DO SOMETHING WITH TOTAL ORDER PRICE
  return choice_info;
}

// Get price based on quantity and Z clip type
function getPrice(quantity, zclip_type) {

  console.log(zclip_type);

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

  // Build list of all parts for packing
  const allParts = [];
  for (const item of piece_order_array) {
    for (let q = 0; q < item.quantity; q++) {
      allParts.push(item.length);
    }
    sum_inches_customer += item.length * item.quantity;
  }

  total_lengths = packParts(allParts, total_length_stock);

  // Quantity price (part 6)
  const groupType = choices[0]?.zclip;
  const quantity_price = getPrice(total_lengths, groupType);

  // Setup charge (quick calc)
  const setup_charge = 30 * piece_order_array.length;

  // Cut charge across the group (fixing the out-of-scope bug)
  let cut_charge_total = 0;
  for (const item of piece_order_array) {
    cut_charge_total += Math.max(25, item.quantity * 0.25);
  }

  // Base price per inch
  let base_pool = (quantity_price * total_lengths) + setup_charge + cut_charge_total;
  let base_per_inch = parseFloat((base_pool / sum_inches_customer).toFixed(2));

  const choice_info = [];

  // Per-item prices
  for (const item of piece_order_array) {
    // Punch charge per item
    let punch_charge = item.hole_amount * 0.25;
    if (punch_charge < 0.55) punch_charge = 0.55;

    // Per run per inch
    let per_run_per_inch = (item.length * base_per_inch) + punch_charge;
    per_run_per_inch = parseFloat(per_run_per_inch.toFixed(2));

    // Total price for that line
    let total_single = parseFloat((per_run_per_inch * item.quantity).toFixed(2));

    // Name
    let custom_name = name_part(item);

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
      "Base Price Per Inch": '$' + base_per_inch,
      "Price Per Item": '$' + total_single,
      "Price Per Piece": '$' + per_run_per_inch,
      "Quantity Price": '$' + parseFloat(quantity_price),
    };

    choice_info.push(unsorted_obj_answer);
  }

  let total_order_price = total_order(choice_info).toFixed(2);
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
  let total_order = 0;

  for (let choices_data of choices) {
    // Remove $ and convert to number
    const price = parseFloat(choices_data["Price Per Item"].replace('$', ''));
    // console.log("pre", total_order);
    total_order += price;
    // console.log("in", total_order);
  }

  // console.log("post", total_order);
  return total_order;
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
    } else {
      group_results = calculateSinglePrice(groups[type]);
    }

    all_results.push(...group_results);
    grand_total += total_order(group_results);
  }

  // ONE CALL — prints the full merged dataset
  print_results(all_results, grand_total.toFixed(2));
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
  //Replace leading 0 from hole diameter
  const hd = hole_diameter.toString().replace(/^0+/, '');

  let custom_name = `CUS-${choice.zclip}-${choice.length}H${choice.spacing}`;

  //UNCOMMENT THIS WHEN HOLE DIAMETER SHOULD BE CONSIDERED;
  // let custom_name = `CUS-${choice.zclip}-${choice.length}H${choice.spacing}_D${hd}`;

  return custom_name;
}

//Function to add both single and multi results into the same container
// let array = [];
// function gatherdata(choice) {
//   array.push({ choice, "Price per group": parseFloat(price_per_group) });

//   print_results(array,price_per_group);
// }



//Function to print the results
function print_results(results_array, total_order_price) {
  const data = {
    price_per_group: total_order_price,
    choices_array: results_array
  };

  localStorage.setItem("calc_results", JSON.stringify(data));
  window.open("./html/calculation_results.html", "_blank");
}
