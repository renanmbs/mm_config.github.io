// Default hole sizes based on Z-Clip type
const defaultHoleSizes = {
  "MF625": "0.203",
  "MF375": "0.203",
  "MF250": "0.203",
  "MFSTR-0375": "0.250",
  "MFSTR-050": "0.250",
  "MFSTR-075": "0.250"
};

const ALL_HOLE_SIZES = [
  "0.125",
  "0.156",
  "0.188",
  "0.203",
  "0.250",
  "0.313"
];

function updateDefaultHoleSizeText(choiceBlock) {
  const zclipSelect = choiceBlock.querySelector('select[name="zclip"]');
  const holeSizeSelect = choiceBlock.querySelector('select[name="hole_size"]');
  
  if (!zclipSelect || !holeSizeSelect) return;

  const zclipType = zclipSelect.value;
  const defaultSize = defaultHoleSizes[zclipType];
  
  // 1. Render the options list
  let optionsHTML = '';
  let selectedSize = holeSizeSelect.value; // Preserve currently selected value

  if (zclipType && defaultSize) {
    // Set the display text for the default option
    optionsHTML += `<option value="default" selected>Default - ${defaultSize}"</option>`;
    
    // Add all other options, skipping the one that matches the default size
    for (const size of ALL_HOLE_SIZES) {
      if (size !== defaultSize) {
        optionsHTML += `<option value="${size}">${size}"</option>`;
      }
    }
  } else {
    // If no Z-Clip is selected, just show the placeholder default option
    optionsHTML += '<option value="default" selected>Default</option>';
    for (const size of ALL_HOLE_SIZES) {
        optionsHTML += `<option value="${size}">${size}"</option>`;
    }
  }
  
  // Update the select element's HTML
  holeSizeSelect.innerHTML = optionsHTML;
  
  // 2. Attempt to restore the previous selection, or ensure 'default' is selected
  // If the previously selected size is not the default, try to reselect it.
  if (selectedSize !== 'default' && holeSizeSelect.querySelector(`option[value="${selectedSize}"]`)) {
     holeSizeSelect.value = selectedSize;
  }
}

// When the DOM is fully loaded, initialize event listeners and form validation
document.addEventListener("DOMContentLoaded", () => {
  const userChoiceContainer = document.getElementById("user_choice_container");
  const addChoiceBtn = document.getElementById("add_choice_btn");
  const form = document.getElementById("customerForm");

  const clearAllBtn = document.getElementById("clear_all");

  clearAllBtn.addEventListener("click", () => {
    location.reload();
  });

  const initialChoiceBlock = document.querySelector(".user_choice1");

  // Initial setup call to populate the first hole size dropdown
  if (initialChoiceBlock) {
     updateDefaultHoleSizeText(initialChoiceBlock);
  }

  // --- NEW EVENT DELEGATION FOR Z-CLIP CHANGE ---
  // This listener handles changes to the Z Clip dropdown dynamically
  userChoiceContainer.addEventListener("change", (e) => {
    if (e.target.name === "zclip") {
      const choiceBlock = e.target.closest(".user_choice1");
      updateDefaultHoleSizeText(choiceBlock);
    }
  });
  // ---------------------------------------------
  
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

      // NOTE: Original step check was 0.25" increments, but input step is 0.125"
      // Assuming you want to keep the input step validation:
      // if (!isIncrement(lenVal, 1.5, 0.125)) { // Changed validation to match input step
      if (!isIncrement(lenVal, 1.5, 0.125)) {
        isValid = false;
        lengthInput.setCustomValidity("Length must be in 0.125\" increments starting from 1.5\".");
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
    if (data) calculateOrder(data.choices); // Pass only choices to the new calculation logic
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

    block.querySelectorAll("input, select, textarea").forEach(el => { // Added textarea
      if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      }

      else {
        el.value = "";
        el.setCustomValidity("");
      }
    });
    
    // Rerun the update to reset "Default" text if clearing Z-Clip choice
    updateDefaultHoleSizeText(block);
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

  // Add new user choice block
  let choiceCount = 0;

  function addUserChoice() {
    choiceCount++;
    // We don't need holeSizeGroupName, but keeping choiceCount for IDs
    
    const newChoice = document.createElement("div");
    newChoice.classList.add("user_choice1");
    newChoice.innerHTML = `
    <hr/>
      <div class="input-row">
         <div class="input-group">
              <label for="zclip_${choiceCount}">Z Clip Options <span class="req">*</span></label>
              <select id="zclip_${choiceCount}" name="zclip" class="zclip" required>
                <option value="" selected disabled>Choose An Option</option>
                <option value="MF250">MF250</option>
                <option value="MF375">MF375</option>
                <option value="MF625">MF625</option>
                <option value="MFSTR-050">MFSTR-050</option>
                <option value="MFSTR-075">MFSTR-075</option>
                <option value="MFSTR-0375">MFSTR-0375</option>
              </select>
            </div>

      </div>

      <div class="input-row">

            <div class="input-group">
                <label for="hole_size_${choiceCount}">Hole Size <span class="req">*</span></label>

                <select id="hole_size_${choiceCount}" name="hole_size" class="hole_size" required>
                    </select>
            </div>

             <div class="input-group">
              <label for="quant_${choiceCount}">Quantity <span class="req">*</span></label>
              <input type="number" id="quant_${choiceCount}" name="quant" min="1" step="1" required />
            </div>

          </div>

      <div class="input-row">

            <div class="input-group">
              <div class="label-row">
                <label for="len_${choiceCount}" class="tooltip" data-tooltip='Spacing must be in 0.125" increments'>
                  Length <span class="span2">(Inches)</span>
                  <span class="req">*</span>
                </label>

                <button type="button" class="toggle-btn tooltip"
                  data-tooltip='Click here to account for the saw cut thickness' aria-pressed="false" id="toggle-btn_${choiceCount}">
                  Optimize Length
                </button>
              </div>

              <input type="number" name="len" min="1.5" max="144" step="0.125" placeholder='Choose from 1.5" to 144"'
                id="len_${choiceCount}" required />

            </div>

            <div class="input-group">
              <label for="space_${choiceCount}" class="tooltip" data-tooltip='Spacing must be in 0.5" increment'>
                Spacing <span class="span2">(Inches)</span><span class="req">*</span>
              </label>
              <input type="number" name="space" min="0" placeholder='Min. 0"' step="0.5" required id="space_${choiceCount}" />
            </div>

          </div>

      <div id="box"></div>

      <div class="input-row">
            <div class="input-group">
              <label for="notes">Additional Notes <span class="span2">(Max 130 characters)</span></label>
              <textarea id="notes" name="notes" rows="3" cols="30" maxlength="130"
                placeholder="e.g., Special packaging, rush order, non-standard finish, etc."></textarea>
            </div>
          </div>


      <div class="input-row buttons">
        <button type="button" class="clear-btn">Clear</button>
        <button type="button" class="remove-btn">Remove This Option</button>
      </div>
    `;

    userChoiceContainer.appendChild(newChoice);
    
    // Initial update call is crucial for populating the empty select element
    updateDefaultHoleSizeText(newChoice);
  }

  function gatherFormData() {
    const companyName = form.querySelector("#comp_name").value.trim();
    const projectName = form.querySelector("#proj_name").value.trim();

    const choices = [];
    userChoiceContainer.querySelectorAll(".user_choice1").forEach(choice => {
      const zclipSelect = choice.querySelector('select[name="zclip"]');
      const holeSizeSelect = choice.querySelector('select[name="hole_size"]');
      
      const zclip = zclipSelect.value;
      let hole_size = holeSizeSelect.value;
      
      // *** LOGIC TO DEFAULT HOLE SIZE ON SUBMIT ***
      if (hole_size === "default") {
        // Use the map to get the default size. If zclip is unselected, this returns undefined, 
        // so we must provide a final fallback (though validation should prevent submit if zclip is empty).
        hole_size = defaultHoleSizes[zclip] || "N/A"; 
      }
      // **********************************************
      
      const quantity = parseInt(choice.querySelector('input[name="quant"]').value, 10);
      const lengthInput = choice.querySelector('input[name="len"]');

      const rawOpt = lengthInput.dataset.optimizedValue;
      const length = rawOpt && !isNaN(parseFloat(rawOpt))
        ? parseFloat(rawOpt)
        : parseFloat(lengthInput.value);

      const spacing = parseFloat(choice.querySelector('input[name="space"]').value);
      const notes = choice.querySelector('textarea[name="notes"]').value.substring(0, 150); // Apply max length
      const toggleBtn = choice.querySelector('.toggle-btn');

      choices.push({
        zclip,
        hole_size, // Now the correct defaulted value
        quantity,
        length,
        spacing,
        notes,
        companyName,
        projectName,
        _toggleBtn: toggleBtn
      });
    });

    return { companyName, projectName, choices };
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

// Set up fee (Kept for structure)
let setup_fee = 50; 

function computeHoleData(length, spacing) {
  if (!spacing || parseFloat(spacing) === 0) {
    return {
      hole_amount: 0,
      leadInForPiece: 0,
      leadIn: 0
    };
  }

  let holesBetween = Math.floor(length / spacing);

  if (Number.isInteger(length / spacing)) {
    holesBetween -= 1;
  }

  let hole_amount = holesBetween + 1;

  let totalLeadIn = length - (holesBetween * spacing);
  let leadInForPiece = totalLeadIn / 2;

  // enforce minimum lead-in of 0.5"
  if (leadInForPiece < 0.5) {
    leadInForPiece = 0.5;
    hole_amount -= 1;
  }

  // round lead-in to nearest 1/16"
  const roundTo = 1 / 16; // 0.0625
  leadInForPiece = Math.round(leadInForPiece / roundTo) * roundTo;
  totalLeadIn = leadInForPiece * 2;

  return {
    hole_amount,
    leadInForPiece,
    leadIn: totalLeadIn
  };
}

// Placeholder for packParts logic (removed as it's not present in the provided code)
function packParts(allParts, total_length_stock) {

  let singleYield = allParts[0] - 0.125; // Assuming all lengths in allParts are the same for a choice
  if (singleYield <= 0) return 1;

  const amount_finished_part = Math.floor(total_length_stock / singleYield);
  if (amount_finished_part <= 0) return allParts.length;

  return Math.ceil(allParts.length / amount_finished_part);
}

// Handle optimize button click
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;

  const choice = btn.closest(".user_choice1");
  if (!choice) return;

  const lengthInput = choice.querySelector('input[name="len"]');
  const currentValue = parseFloat(lengthInput.value) || 0;
  const isOptimized = btn.dataset.optimized === "true";

  if (currentValue === 144) {
    alert("Z-clip length cannot exceed 144 inches.");
    return; // stop further processing
  }

  // Toggle optimized state
  btn.dataset.optimized = (!isOptimized).toString();
  btn.classList.toggle("optimized-btn", !isOptimized);

  if (!isOptimized) {
    lengthInput.dataset.optimizedValue = String(currentValue + 0.125);
    console.log("Optimized value set:", lengthInput.dataset.optimizedValue);
  } else {
    lengthInput.removeAttribute("data-optimized-value");
    console.log("Optimized value cleared");
  }
});

// Handle manual input changes
document.addEventListener("input", (e) => {
  const input = e.target;
  if (input.name !== "len") return;

  const choice = input.closest(".user_choice1");
  if (!choice) return;

  if (input.dataset.optimizedValue) {
    input.removeAttribute("data-optimized-value"); // Correct DOM-safe way

    const toggleBtn = choice.querySelector(".toggle-btn");
    if (toggleBtn) {
      toggleBtn.dataset.optimized = "false";
      toggleBtn.classList.remove("optimized-btn");
    }

    console.log("Manual change detected — optimization cleared");
  }
});


// Calculate Single Price (Now used for every choice)
function calculateSinglePrice(choices_data) {
  const choice_info = [];
  let total_inches_customer = 0;

  console.log("SINGLE ITEM PRODUCT BREAKDOWN (PRICING SET TO ZERO):");
  console.log("\n");

  const { hole_amount, leadInForPiece } = computeHoleData(
    choices_data.length,
    choices_data.spacing
  );

  // Single Yield
  let singleYield = choices_data.length - 0.125;
  if (singleYield <= 0) singleYield = 0.001; // Avoid division by zero

  console.log(choices_data.zclip + ":");

  console.log("Single Yield: " + singleYield);

  // Finished Parts per Stock Length
  const total_length_stock = choices_data.length < 6 ? 140 : 144;
  console.log("Total Stock Length: " + total_length_stock);

  const allParts = Array(choices_data.quantity).fill(choices_data.length);
  const total_lengths = packParts(allParts, total_length_stock);
  console.log("Full Lengths Needed: " + total_lengths);

  // Quantity Price (for bulk material) - MODIFIED TO RETURN 0
  const quantity_price = getPrice(total_lengths, choices_data.zclip); // Returns 0

  console.log("Bulk material price: $" + quantity_price.toFixed(2));

  // Material Price (Total material cost) - MODIFIED TO BE 0
  let material_price = 0; // Total material cost is 0
  
  // Cut charge for less than 100 pieces - MODIFIED TO BE 0
  if (choices_data.quantity < 100) {
    material_price += 0; // bulk material
    console.log("Cut charge for less than 100 pieces: $" + 0);
  }

  // Setup Fee - MODIFIED TO BE 0
  let setup_charge = 0; 
  material_price += setup_charge;

  // Cut Charge per piece - MODIFIED TO BE 0
  const cut_charge_per_piece = 0;
  if (cut_charge_per_piece !== 0) console.log(`Cut charge for 100+ pieces: $${cut_charge_per_piece.toFixed(2)}`);

  // Punch Charge - MODIFIED TO BE 0
  let punch_charge_per_piece = 0;
  if (choices_data.spacing !== 0) {
    punch_charge_per_piece = 0; // Math.max(hole_amount * 0.25, 0.55) : 0;
  }
  else {
    punch_charge_per_piece = 0;
  }

  console.log("Total material cost (includes Setup): $" + material_price.toFixed(2));
  console.log(`Punch charge per piece: $${punch_charge_per_piece.toFixed(2)}`);
  console.log("Setup Fee: $" + setup_charge.toFixed(2));

  // Total line price (material + punch + cut) - MODIFIED TO BE 0
  const total_line_price = 0;

  console.log("Total Price per item: $" + total_line_price.toFixed(2));

  // Price per piece - MODIFIED TO BE 0
  const price_per_piece = 0;
  console.log("Price per piece: $" + price_per_piece.toFixed(2))

  // Track totals for price per inch
  const inches_customer = choices_data.length * choices_data.quantity;
  total_inches_customer += inches_customer;
  console.log(`Total inches for this item: ${inches_customer}"`);

  const price_per_inch_line = 0;
  console.log("Price per inch: $" + price_per_inch_line.toFixed(2));

  // Part name
  const custom_name = name_part(choices_data);
  
  // Logic for Additional Notes: 'Yes' if text is present, otherwise blank/undefined
  const notes_status = choices_data.notes && choices_data.notes.trim().length > 0 ? "Yes" : "No";
  
  choice_info.push({
    "Company Name": capitalizeFirstLetter(choices_data.companyName),
    "Project Name": capitalizeFirstLetter(choices_data.projectName),
    "Custom Part Name": custom_name,
    "Z Clip Type": choices_data.zclip,
    "Hole Size": choices_data.hole_size, // Now the correct defaulted value
    "Lead In For Piece": parseFloat(leadInForPiece),
    "Quantity": parseInt(choices_data.quantity),
    "Full Lengths Needed": total_lengths,
    "Length": parseFloat(choices_data.length),
    "Spacing": parseFloat(choices_data.spacing),
    "Hole Amount": parseInt(hole_amount),
    "Notes Status": notes_status, // <-- Changed to Notes Status
    "Additional Notes": choices_data.notes, // <-- Keep the full note here for separate storage/use
    "Base Price Per Inch": price_per_inch_line, // Now a number (0)
    "Quantity Price": quantity_price, // Now a number (0)
    "Price Per Piece": price_per_piece, // Now a number (0)
    "Price Per Item": total_line_price, // Now a number (0)
  });

  console.log("\n");

  return choice_info;
}

// Get price based on quantity and Z clip type - MODIFIED TO RETURN 0
function getPrice(quantity, zclip_type) {
  // Original logic removed. Returning 0.
  console.warn("Pricing tier logic skipped, returning 0 as requested.");
  return 0;
}

function capitalizeFirstLetter(string) {
  if (typeof string !== 'string' || string.length === 0) {
    return string; // Handle non-string input or empty strings
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Calculate total order price - MODIFIED TO SAFELY SUM NUMBERS (0)
function total_order(choices) {
  let total = 0;

  for (const item of choices) {
    let raw = item["Price Per Item"];

    if (raw == null) continue; // skip missing

    // Check if it's a number (which is what calculateSinglePrice returns now)
    if (typeof raw === "number") {
      total += raw;
      continue;
    }

    // Fallback for previous string format, though now it should be a number (0)
    const num = parseFloat(String(raw).replace(/[$,]/g, ""));
    if (!isNaN(num)) total += num;
  }

  return total;
}

//Function to calculate multi price and single price
function calculateOrder(choices) {
  const all_results = [];
  let grand_total = 0;

  // 1. Iterate over each choice and calculate price individually
  for (const item of choices) {
    const group_results = calculateSinglePrice(item); // calculates for a single choice item
    all_results.push(...group_results); // push the resulting object(s)

    // 2. Sum the individual totals to get the grand total
    grand_total += total_order(group_results);
  }

  all_results.sort((a, b) => {
    const clipA = a["Z Clip Type"].toUpperCase();
    const clipB = b["Z Clip Type"].toUpperCase();
    if (clipA < clipB) return -1;
    if (clipA > clipB) return 1;
    return 0;
  });

  // Final step: print the full merged dataset
  print_results(all_results, formatPrice(grand_total));
  return grand_total;
}

//Naming part function
function name_part(choice) {
  // Determine the length to use for naming
  // If the toggle optimization was applied, subtract 0.125
  let lengthForName = choice.length;
  if (choice._toggleBtn?.dataset.optimized === "true") {
    lengthForName = parseFloat((choice.length - 0.125).toFixed(3));
  }

  // Start building the custom part name
  let custom_name = `CUS-${choice.zclip}-${lengthForName}`;

  // Append spacing info if > 0
  if (choice.spacing && parseFloat(choice.spacing) > 0) {
    custom_name += `H${choice.spacing}`;
  }

  // Append hole size info (which is the actual value, not "default", thanks to gatherFormData)
  if (choice.hole_size && choice.hole_size !== "default") {
    custom_name += `D${choice.hole_size}`;
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

    // Remove "Notes Status" if it's not 'Yes' (i.e., if it was undefined)
    if (obj["Notes Status"] === undefined) {
      delete obj["Notes Status"];
    }

    // Format pricing fields (which will all be $0.00 now)
    for (const key of ["Base Price Per Inch", "Price Per Item", "Price Per Piece", "Quantity Price"]) {
      if (obj[key] != null && !String(obj[key]).startsWith('$')) {
        obj[key] = '$' + formatPrice(parseFloat(String(obj[key]).replace(/[$,]/g, "")));
      }
    }
    return obj;
  });

  const data = {
    price_per_group: grand_total, // grand_total is already formatted here
    choices_array: formatted
  };

  localStorage.setItem("calc_results", JSON.stringify(data));

  window.open("./html/calculation_results.html", "_blank");
}