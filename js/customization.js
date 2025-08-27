// UI and UX Components for Z Clip Customization Form

/* CHANGES BETWEEN VERSIONS

- Changes on the length > spacing validation
- Console logs for debugging
- Details tab on how to use it

*/

/*CHANGE THE PRICE DATABASE FOR 625!!!!! */

// When the DOM is fully loaded, initialize event listeners and form validation
document.addEventListener("DOMContentLoaded", () => {
  const userChoiceContainer = document.getElementById("user_choice_container");
  const addChoiceBtn = document.getElementById("add_choice_btn");
  const form = document.getElementById("customerForm");

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
    alert("Check console for collected data.");
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
    alert("Multi Product usability not finalized yet. Please use the single product options for now.");
    choiceCount++;
    const holeSizeGroupName = `hole_size_${choiceCount}`;

    const newChoice = document.createElement("div");
    newChoice.classList.add("user_choice1");
    newChoice.innerHTML = `
      <div class="input-row">
        <div class="input-group">
          <label>Z Clip Options <span class="req">*</span></label>
           <select name="zclip" id="zclip" required>
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
          <label>Quantity <span class="req">*</span></label>
          <input type="number" name="qnt" min="1" required />
        </div>
      </div>

      <div class="input-row">
        <div class="input-group">
          <label>Length <span class="span2">(Inches)</span><span class="tooltip" data-tooltip='Spacing must be in 0.25" increment'><span class="req">*</span></span></label>
          <input type="number" name="len" min="1.5" max="144" step="0.25" placeholder='Choose from 1.5" to 144"' required />
        </div>
        <div class="input-group">
          <label>Spacing <span class="span2">(Inches)</span><span class="tooltip" data-tooltip='Spacing must be in 0.5" increment'><span class="req">*</span></span></label>
          <input type="number" name="space" min="1" placeholder='Min. 1"' step="0.5" required />
        </div>
      </div>

      <div id="box"></div>

      <div class="input-row buttons">
        <button type="button" class="clear-btn">Clear</button>
        <button type="button" class="remove-btn">Remove This Option</button>
        <button type="button" class="change-btn">Set Unique Project Name</button>
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
      const quantity = parseInt(choice.querySelector('input[name="qnt"]').value);
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

// Calculate Lead In and Hole Amount for each choice
function calculateLeadIn(choices) {
  const choices_holes = [];

  //Calculate lead in and hole amount for each choice
  for (choices_data of choices) {

    // console.log("length: " + choices_data.length + " spacing: " + choices_data.spacing);

    let leadIn = choices_data.length / choices_data.spacing;

    if (Number.isInteger(leadIn)) {
      leadIn = leadIn - 1;
      // console.log("Lead in is an integer, subtracting 1");
    }

    else {
      leadIn = Math.floor(leadIn);
      // console.log("Lead in is not an integer, rounding down - " + leadIn);
    }

    let hole_amount = leadIn + 1;

    leadIn = leadIn * choices_data.spacing;

    leadIn = choices_data.length - leadIn;

    let leadInForPiece = leadIn / 2;

    if (leadInForPiece < 0.5) {
      leadInForPiece = 0.5;

      // MAKE SURE THIS IS CORRECT
      hole_amount = hole_amount - 1;

      // console.log("Lead in for piece is less than 0.5, setting to 0.5");
    }

    // console.log("Lead In First Part Calculation: " + leadIn);
    // console.log("Hole amount: " + hole_amount);
    // console.log("Lead in for piece: " + leadInForPiece);
    // console.log("______  END OF CHOICE ______");

    choices_holes.push({ hole_amount, leadInForPiece, leadIn });


  }
  return { choices_holes };
}

// Calculate Single Price

function calculateSinglePrice(choices) {
  // Run once and get all hole data
  const { choices_holes } = calculateLeadIn(choices);
  const choice_info = [];

  // Iterate through each choice and calculate the price
  for (let [index, choices_data] of choices.entries()) {
    const { hole_amount, leadInForPiece, leadIn } = choices_holes[index];

    // console.log("______ START OF CHOICE ______");

    // console.log("Choice index:", index);
    // console.log("Holes per piece:", hole_amount);
    // console.log("Lead in for piece:", leadInForPiece);
    // console.log("Lead in:", leadIn);

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
    // console.log("Single Yield:", singleYield);

    // Finished Parts per Length (Part 2)
    let total_length_stock;
    if (choices_data.length < 6) {
      total_length_stock = 140
    }
    else {
      total_length_stock = 144
    }

    let amount_finished_part = total_length_stock / singleYield;
    if (!Number.isInteger(amount_finished_part)) {
      amount_finished_part = Math.floor(amount_finished_part);
      //console.log("Rounded finished parts:", amount_finished_part);
    }

    // Lengths Needed (Part 3)
    let lengths_needed = choices_data.quantity / amount_finished_part;
    if (!Number.isInteger(lengths_needed)) {
      lengths_needed = Math.ceil(lengths_needed);
      // console.log("Rounded lengths needed:", lengths_needed);
    }

    // Quantity Price (Part 4)
    const quantity_price = getPrice(lengths_needed, choices_data.zclip);
    // console.log("Price per piece:", quantity_price);

    // Material Price (Part 5)
    const material_price = (lengths_needed * quantity_price).toFixed(2);
    //console.log("Material price:", material_price);

    // Cut Charge (Part 6)
    let cut_charge = 0.25 * choices_data.quantity;
    if (cut_charge < 25) cut_charge = 25;
    //console.log("Cut charge:", cut_charge);

    // Holes per piece (Part 7)
    // Already calculated as hole_amount

    // Total Punch Charge (Part 8)
    let total_punch_charge = hole_amount * 0.25;

    if (total_punch_charge < 0.55) {
      total_punch_charge = 0.55;
      //console.log("Total punch charge is less than 0.55, setting to 0.55");
    }

    else {
      //Do nothing
      //console.log("Total punch charge: " + total_punch_charge);
    }

    let total_punch_job = total_punch_charge * choices_data.quantity;
    total_punch_job = total_punch_job + 30;
    total_punch_job = total_punch_job.toFixed(2);

    //console.log("Total punch job: " + total_punch_job);

    // Calculate Total Price (Part 9)
    let total_price = parseFloat(material_price) + parseFloat(cut_charge) + parseFloat(total_punch_job);

    //console.log(material_price, cut_charge, total_punch_job);
    total_price = total_price.toFixed(2);

    // console.log("Total price for this choice: " + total_price);

    // Calculate Price per piece (Part 10)
    let price_per_piece = total_price / choices_data.quantity;

    price_per_piece = price_per_piece.toFixed(2);

    //console.log("Price per piece: " + price_per_piece);

    //CALCULATE TOTAL PRICE
    let total_single = (price_per_piece * choices_data.quantity).toFixed(2);

    let unsorted_obj_answer = {
      "Price Per Piece": '$' + parseFloat(price_per_piece),
      "Quantity Price": '$' + parseFloat(quantity_price),
      "Total Price": '$' + parseFloat(total_price),
      "Length": parseFloat(choices_data.length),
      "Quantity": parseInt(choices_data.quantity),
      "Spacing": parseFloat(choices_data.spacing),
      "Z Clip Type": choices_data.zclip,
      "Hole Amount": parseInt(choices_holes[index].hole_amount),
      "Lead In For Piece": parseFloat(choices_holes[index].leadInForPiece),
      "Company Name": choices_data.companyName,
      "Project Name": choices_data.projectName,
      "Price Per Item": '$' + parseFloat(total_single),
      "Full Lengths For Order": lengths_needed
    }

    choice_info.push(sortObjectKeys(unsorted_obj_answer));
  }

  let total_order_price = total_order(choice_info); // sum of all choice prices
  console.table(choice_info);
  console.log(JSON.stringify(choice_info, null, 2))
  console.log("PRICE PER GROUP: $" + total_order_price);

  return total_order_price; // <- return numeric total

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

// Calculate Multiple Items Price
function calculateMultiPrice(choices) {
  // Calculate lead in and choice amount
  const { choices_holes } = calculateLeadIn(choices);
  const piece_order_array = [];
  let choice_info = [];
  let quantity_price;
  let base_per_inch;
  let total_lengths = 0;
  let sum_inches_customer = 0;

  // Iterate through options
  for (let [index, choices_data] of choices.entries()) {
    const { hole_amount, leadInForPiece } = choices_holes[index];

    // Use object so it's easier to handle later
    piece_order_array.push({
      type: choices_data.zclip,
      quantity: choices_data.quantity,
      length: choices_data.length,
      spacing: choices_data.spacing,
      companyName: choices_data.companyName,
      projectName: choices_data.projectName,
      hole_amount,
      leadInForPiece
    });
  }

  // Sort by length from largest to smallest (step 1)
  piece_order_array.sort((a, b) => b.length - a.length);

  // Loop through choices 
  for (let [index, choices_data] of piece_order_array.entries()) {
    let singleYield;
    let finished_part_length;
    let lengths_per_item;
    let total_inches_customer;

    // Calculate yield
    switch (choices_data.length) {
      case 12: singleYield = 11.875; break;
      case 18: singleYield = 17.875; break;
      case 24: singleYield = 23.875; break;
      case 36: singleYield = 35.875; break;
      case 48: singleYield = 47.875; break;
      default: singleYield = choices_data.length + 0.125;
      // default: singleYield = choices_data.length;
    }

    // Calculate the amount of finished parts per length (part 2)
    let total_length_stock;
    if (choices_data.length < 6) {
      total_length_stock = 140
    }
    else {
      total_length_stock = 144
    }
    finished_part_length = total_length_stock / singleYield;

    if (!Number.isInteger(finished_part_length)) {
      // console.log("Number not integer, rounding down " + finished_part_length);
      finished_part_length = Math.floor(finished_part_length);
    }

    // Calculate Number of lengths needed per item (part 3)
    lengths_per_item = choices_data.quantity / finished_part_length;

    if (!Number.isInteger(lengths_per_item)) {
      // console.log("Number not integer, rounding up " + lengths_per_item);
      lengths_per_item = Math.ceil(lengths_per_item);
    }

    // console.log("Lengths per item " + lengths_per_item);

    // Calculate number of lengths needed to be cut to complete the job (part 4)
    // total_lengths += lengths_per_item;
    // Expand order into an array of part lengths
    // Expand all parts into an array
    let allParts = [];
    for (let [index, choices_data] of piece_order_array.entries()) {
      for (let q = 0; q < choices_data.quantity; q++) {
        allParts.push(choices_data.length);
      }
    }

    const stockLength = 144; // or 140 if <6" part rule
    total_lengths = packParts(allParts, stockLength);
    // console.log("Total Length " + total_lengths);

    total_inches_customer = choices_data.length * choices_data.quantity;

    // Determine total inches the customer is purchasing (part 5)
    sum_inches_customer += total_inches_customer;

    // console.log(total_inches_customer)

  }
  // console.log("Total: " + total_lengths + ' ZClip: ' + choices_data.zclip);

  // Calculate quantity price (part 6)
  const groupType = choices[0]?.zclip;
  quantity_price = getPrice(total_lengths, groupType);

  // Calculate base price per inch (part 7)
  base_per_inch = quantity_price * total_lengths;
  // console.log(base_per_inch);

  // Quick calculation that is easier to manipulate for set up charge
  let setup_charge = 30 * choices.length;
  console.log(setup_charge);

  // console.log(setup_charge);

  base_per_inch = (base_per_inch + setup_charge).toFixed(2);
  base_per_inch = parseFloat(base_per_inch);
  // console.log(base_per_inch);

  // Calculate Cut Charge per item (Part 9)
  if (choices_data.quantity < 100) {
    cut_per_item = 25;
  }
  else {
    cut_per_item = choices_data.quantity * 0.25;
  }

  // cut_per_item = cut_per_item / choices_data.quantity;

  base_per_inch = ((base_per_inch + cut_per_item) / sum_inches_customer).toFixed(2);
  base_per_inch = parseFloat(base_per_inch);
  // console.log(base_per_inch);

  for (let [index, choices_data] of piece_order_array.entries()) {
    let cut_per_item;
    let per_run_per_inch;

    // Calculate Punch Charge Per Item (Part 8)
    let punch_charge = choices_data.hole_amount * 0.25;

    if (punch_charge < 0.55) {
      punch_charge = 0.55;
    }
    else {
      //Do nothing
    }

    // // Calculate Cut Charge per item (Part 9)
    // if (choices_data.quantity < 100) {
    //   cut_per_item = 25;
    // }
    // else {
    //   cut_per_item = choices_data.quantity * 0.25;
    // }

    // cut_per_item = cut_per_item / choices_data.quantity;

    //Calculate Per Run Per Inch (Step 10)
    per_run_per_inch = choices_data.length * base_per_inch;

    per_run_per_inch = (per_run_per_inch + punch_charge).toFixed(2);

    // console.log(per_run_per_inch);

    //CALCULATE TOTAL PRICE
    let total_single = (per_run_per_inch * choices_data.quantity).toFixed(2);

    let unsorted_obj_answer = {
      "Price Per Piece": '$' + parseFloat(per_run_per_inch),
      "Quantity Price": '$' + parseFloat(quantity_price),
      "Base Price Per Inch": '$' + parseFloat(base_per_inch),
      "Length": parseFloat(choices_data.length),
      "Quantity": parseInt(choices_data.quantity),
      "Spacing": parseFloat(choices_data.spacing),
      "Z Clip Type": choices_data.type,
      "Hole Amount": parseFloat(choices_holes[index].hole_amount),
      "Lead In For Piece": parseFloat(choices_holes[index].leadInForPiece),
      "Company Name": choices_data.companyName,
      "Project Name": choices_data.projectName,
      "Full Lengths For Order": parseInt(total_lengths),
      "Price Per Item": '$' + parseFloat(total_single)
    }

    choice_info.push(sortObjectKeys(unsorted_obj_answer));
  }

  let total_order_price = total_order(choice_info);

  total_order_price = total_order_price.toFixed(2);

  console.table(choice_info);
  console.log(JSON.stringify(choice_info, null, 2));
  console.log("Total group price: $" + total_order_price);

  return total_order_price; // <- return numeric total

  // return choice_info;
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

function calculateOrder(choices) {
  const groups = {};
  let total_order = 0; // sum of all groups

  // Group items by zclip type
  for (const item of choices) {
    if (!groups[item.zclip]) groups[item.zclip] = [];
    groups[item.zclip].push(item);
  }

  // Loop over each group
  for (const type in groups) {
    const groupItems = groups[type];

    let group_total = 0;

    if (groupItems.length > 1) {
      // Multi calculator → should return numeric total
      group_total = calculateMultiPrice(groupItems);
    } else {
      // Single calculator → wrap single item in array
      group_total = calculateSinglePrice([groupItems[0]]);
    }

    // Add this group's total to the overall total
    total_order = parseFloat(total_order) + parseFloat(group_total);

    total_order = total_order.toFixed(2);
  }
  console.log("__________________");
  console.log("TOTAL ORDER: $", total_order);
  return total_order;
}

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
      } else {
        // Doesn’t fit → try next smaller part
        i++;
      }
    }
  }

  return barsUsed;
}