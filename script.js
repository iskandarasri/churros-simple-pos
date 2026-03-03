// ========== STATE ==========
let currentOrder = [];
let allSales = [];
let darkMode = localStorage.getItem("darkMode") === "true";
let cartOpen = false;
let customInputVal = "0";
let currentStaff = "Staff 1";
let currentCategory = "all";

// Calculator & Payment state
// Add this with other state variables near the top
let paymentMethod = "Cash"; // "cash" or "qr"
let calcInput = "0";
let calcPrev = null;
let calcOp = null;
let calcReset = false;
let cashAmount = null; // Amount customer paid

const menuItems = [
  {
    id: 1,
    name: "Single Set",
    price: 7.0,
    image: "img/single.png",
    color: "#FEF3C7",
    category: "churros",
  },
  {
    id: 2,
    name: "Family Box",
    price: 35.0,
    image: "img/family.png",
    color: "#FDE68A",
    category: "churros",
  },
  {
    id: 3,
    name: "Special Single Set",
    price: 8.0,
    image: "img/seasonal_single.png",
    color: "#eefbcf",
    category: "churros",
  },
  {
    id: 4,
    name: "Special Family Box",
    price: 36.0,
    image: "img/seasonal_family.png",
    color: "#eefbcf",
    category: "churros",
  },
  {
    id: 5,
    name: "+ Milk Choco Dip",
    price: 2.0,
    image: "img/milk_choco.png",
    color: "#e6ae74",
    category: "dips",
  },
  {
    id: 6,
    name: "+ Dark Choco Dip",
    price: 2.0,
    image: "img/dark_choco.png",
    color: "#a78b78",
    category: "dips",
  },
  {
    id: 7,
    name: "+ Caramel Dip",
    price: 2.0,
    image: "img/caramel.png",
    color: "#FEF3C7",
    category: "dips",
  },
  {
    id: 8,
    name: "+ Special Dip",
    price: 3.0,
    image: "img/seasonal_dip.png",
    color: "#cfe9d0",
    category: "dips",
  },
  {
    id: 9,
    name: "Keychain",
    price: 5.0,
    image: "img/keychain.png",
    color: "#E5E7EB",
    category: "merch",
  },
];

// ========== INITIALIZATION ==========
window.onload = () => {
  try {
    const saved = localStorage.getItem("churrosSales");
    if (saved) allSales = JSON.parse(saved);
  } catch (e) {
    console.log("No saved data");
  }

  if (darkMode) document.body.classList.add("dark-mode");

  renderMenu();
  updateOrderList();
  updateReports();
  updateCalcDisplay();
  updatePaymentDisplay();

  document.getElementById("staffName").addEventListener("input", (e) => {
    currentStaff = e.target.value || "Staff 1";
  });

  // Category filters
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".cat-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentCategory = e.target.dataset.category;
      renderMenu();
    });
  });

  // Money Presets - Quick payment amounts
  document.querySelectorAll(".money-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const amount = parseFloat(btn.dataset.amount);
      if (!isNaN(amount) && amount > 0) {
        // Use the existing setCashAmount function
        setCashAmount(amount);

        // Also update the manual input field for visibility
        const manualInput = document.getElementById("manual-paid-amount");
        if (manualInput) {
          manualInput.value = amount;
        }

        // Visual feedback
        btn.style.transform = "scale(0.95)";
        setTimeout(() => {
          btn.style.transform = "scale(1)";
        }, 100);
      }
    });
  });

  // Search input listener
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.removeAttribute("readonly");
    searchInput.addEventListener("input", function (e) {
      renderMenu();
    });
    searchInput.addEventListener("search", function (e) {
      renderMenu();
    });
  }

  // Cart header toggle
  document
    .getElementById("cartHeaderToggle")
    .addEventListener("click", toggleCart);

  // Dark mode toggle
  document.getElementById("darkModeToggle").addEventListener("click", () => {
    darkMode = !darkMode;
    localStorage.setItem("darkMode", darkMode);
    document.body.classList.toggle("dark-mode", darkMode);
  });

  // Core buttons
  document.getElementById("void-last").addEventListener("click", voidLastItem);
  document.getElementById("clear-order").addEventListener("click", clearOrder);
  document.getElementById("save-sale").addEventListener("click", saveSale);
  document
    .getElementById("export-btn")
    .addEventListener("click", exportToExcel);

  document.getElementById("reset-btn").addEventListener("click", async () => {
    const confirmed = await showCustomConfirm(
      "Are you sure you want to delete all sales data? This cannot be undone.",
      "Reset All Data",
      "⚠️"
    );
    if (confirmed) {
      allSales = [];
      localStorage.removeItem("churrosSales");
      updateReports();
      await showCustomAlert("Data reset successful.", "Success", "✅");
    }
  });

  // Calculator event listeners
  document.querySelectorAll("[data-calc]").forEach((btn) => {
    btn.addEventListener("click", () => handleCalcInput(btn.dataset.calc));
  });

  document
    .getElementById("calc-add-to-cart")
    .addEventListener("click", addCalcToOrder);
  document.getElementById("calc-clear").addEventListener("click", () => {
    calcInput = "0";
    calcPrev = null;
    calcOp = null;
    calcReset = false;
    cashAmount = null;
    updateCalcDisplay();
    updatePaymentDisplay();
  });

  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pageId = btn.dataset.page;
      switchView(pageId);
    });
  });

  // Expose functions globally
  window.setCashAmount = setCashAmount;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.calcType = calcType;
  window.addCustomItem = addCustomItem;

  // Initialize Easter egg
  setTimeout(initEasterEgg, 1000);

  // Payment method toggle
  const paymentCashBtn = document.getElementById("payment-cash");
  const paymentQrBtn = document.getElementById("payment-qr");

  function updatePaymentButtons() {
    if (paymentCashBtn && paymentQrBtn) {
      if (paymentMethod === "cash") {
        paymentCashBtn.classList.add("active");
        paymentQrBtn.classList.remove("active");
      } else {
        paymentQrBtn.classList.add("active");
        paymentCashBtn.classList.remove("active");
      }
    }
  }

  if (paymentCashBtn) {
    paymentCashBtn.addEventListener("click", () => {
      paymentMethod = "cash";
      updatePaymentButtons();
    });
  }

  if (paymentQrBtn) {
    paymentQrBtn.addEventListener("click", () => {
      paymentMethod = "qr";
      updatePaymentButtons();
    });
  }

  updatePaymentButtons();

  // Quick Notes Preset
  document.querySelectorAll(".note-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const note = btn.dataset.note;
      const remarksInput = document.getElementById("saleRemarks");
      if (remarksInput) {
        if (remarksInput.value) {
          remarksInput.value += ", " + note;
        } else {
          remarksInput.value = note;
        }
      }
    });
  });

  // Manual Payment Input
  const manualPaidInput = document.getElementById("manual-paid-amount");
  const applyPaymentBtn = document.getElementById("apply-payment-btn");

  function applyManualPayment() {
    const amount = parseFloat(manualPaidInput.value);
    if (!isNaN(amount) && amount >= 0) {
      cashAmount = amount;
      calcInput = amount.toString();
      calcPrev = null;
      calcOp = null;
      calcReset = false;
      updateCalcDisplay();
      updatePaymentDisplay();
      manualPaidInput.value = ""; // Clear input after applying
    } else {
      showCustomAlert("Please enter a valid amount", "Invalid Input", "⚠️");
    }
  }

  if (applyPaymentBtn) {
    applyPaymentBtn.addEventListener("click", applyManualPayment);
  }

  if (manualPaidInput) {
    manualPaidInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyManualPayment();
      }
    });
  }
};

// ========== UI RENDERERS ==========
function renderMenu() {
  const grid = document.getElementById("menuGrid");
  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  grid.innerHTML = "";

  // First filter by category
  let filtered =
    currentCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === currentCategory);

  // Then filter by search term if present
  if (searchTerm) {
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(searchTerm),
    );
  }

  if (filtered.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.style.cssText =
      "grid-column: span 2; text-align: center; padding: 40px 20px; color: var(--text-muted);";
    noResults.innerHTML = `
      <span style="font-size: 3rem; display: block; margin-bottom: 10px;">🔍</span>
      <p>No items found matching "${searchTerm}"</p>
    `;
    grid.appendChild(noResults);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.onclick = () => addItem(item.name, item.price);
    card.innerHTML = `
      <div class="product-img" style="background: ${item.color}; display: flex; align-items: center; justify-content: center;">
        <img src="${item.image}" alt="${item.name}" class="menu-item-image" 
             onerror="this.style.display='none'; this.parentElement.innerHTML='📦';" />
      </div>
      <div class="product-info">
        <h3>${item.name}</h3>
        <p>RM ${item.price.toFixed(2)}</p>
      </div>
    `;
    grid.appendChild(card);
  });

  // Custom Item Card
  if (
    !searchTerm &&
    (currentCategory === "all" || currentCategory === "churros")
  ) {
    const customCard = document.createElement("div");
    customCard.className = "product-card custom-item-card";
    customCard.onclick = () => openModal("customItemModal");
    customCard.innerHTML = `
      <div class="product-img" style="display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 2.5rem;">➕</span>
      </div>
      <div class="product-info" style="text-align: center;">
        <h3>Custom<br>Amount</h3>
      </div>
    `;
    grid.appendChild(customCard);
  }
}

function updateOrderList() {
  const listEl = document.getElementById("order-list");
  const totalEl = document.getElementById("order-total-amount");
  const sheetTotalEl = document.getElementById("cartTotalSummary");
  const countEl = document.getElementById("cartCount");
  const cartHeader = document.getElementById("cartHeaderToggle");

  listEl.innerHTML = "";
  let total = 0;

  if (currentOrder.length === 0) {
    listEl.innerHTML = `<li style="text-align:center; color: var(--text-muted); margin-top: 20px; font-size: 0.9rem;">Cart is empty</li>`;
    countEl.textContent = `0 Items`;
    totalEl.textContent = `RM 0.00`;
    sheetTotalEl.textContent = `RM 0.00`;
    return;
  }

  // Group identical items
  const groupedItems = {};
  currentOrder.forEach((item, index) => {
    const key = `${item.name}_${item.price}`;
    if (!groupedItems[key]) {
      groupedItems[key] = {
        name: item.name,
        price: item.price,
        quantity: 1,
        indices: [index],
      };
    } else {
      groupedItems[key].quantity++;
      groupedItems[key].indices.push(index);
    }
  });

  // Calculate total
  total = currentOrder.reduce((sum, item) => sum + item.price, 0);

  // Render grouped items
  Object.values(groupedItems).forEach((group) => {
    const li = document.createElement("li");
    li.className = "order-item";
    li.innerHTML = `
      <div class="order-item-left">
        <span class="item-qty">${group.quantity}x</span>
        <span class="item-name">${group.name}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="item-price">RM ${(group.price * group.quantity).toFixed(2)}</span>
        <button class="delete-item-btn" data-item-name="${group.name}" data-item-price="${group.price}">✕</button>
      </div>
    `;
    listEl.appendChild(li);
  });

  // Add delete event listeners
  document.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemName = btn.dataset.itemName;
      const itemPrice = parseFloat(btn.dataset.itemPrice);
      deleteItemFromOrder(itemName, itemPrice);
    });
  });

  const formattedTotal = `RM ${total.toFixed(2)}`;
  totalEl.textContent = formattedTotal;
  sheetTotalEl.textContent = formattedTotal;
  countEl.textContent = `${currentOrder.length} Items`;

  updatePaymentDisplay();

  // Flash effect with rounded corners
  if (currentOrder.length > 0 && !cartOpen) {
    cartHeader.classList.add("cart-flash");
    setTimeout(() => {
      cartHeader.classList.remove("cart-flash");
    }, 300);
  } else if (currentOrder.length === 0 && cartOpen) {
    toggleCart();
  }
}

// New function to delete specific item
function deleteItemFromOrder(itemName, itemPrice) {
  // Find the index of the item to delete (first occurrence)
  const index = currentOrder.findIndex(
    (item) => item.name === itemName && item.price === itemPrice,
  );

  if (index !== -1) {
    currentOrder.splice(index, 1);
    updateOrderList();
  }
}

// ========== CALCULATOR FUNCTIONS ==========
function updateCalcDisplay() {
  document.getElementById("calc-result").textContent = calcInput;

  const hintEl = document.getElementById("calc-operator-hint");
  if (calcOp && calcPrev !== null) {
    hintEl.textContent = `${calcPrev} ${calcOp}`;
  } else {
    hintEl.textContent = "";
  }
}

async function handleCalcInput(val) {
  if (val === "C") {
    calcInput = "0";
    calcPrev = null;
    calcOp = null;
    calcReset = false;
    cashAmount = null;
    updatePaymentDisplay();
  } else if (val === "=") {
    if (calcPrev !== null && calcOp !== null) {
      const current = parseFloat(calcInput);
      let result;

      switch (calcOp) {
        case "+":
          result = calcPrev + current;
          break;
        case "-":
          result = calcPrev - current;
          break;
        case "*":
          result = calcPrev * current;
          break;
        case "/":
          if (current === 0) {
            await showCustomAlert("Cannot divide by zero", "Math Error", "➗");
            return;
          }
          result = calcPrev / current;
          break;
        default:
          return;
      }

      calcInput = result.toString();
      cashAmount = parseFloat(calcInput); // Set as cash paid
      calcPrev = null;
      calcOp = null;
      calcReset = true;
      updatePaymentDisplay();
    }
  } else if (["+", "-", "*", "/"].includes(val)) {
    const current = parseFloat(calcInput);

    if (calcPrev === null) {
      calcPrev = current;
      calcOp = val;
      calcReset = true;
    } else if (calcOp !== null) {
      let result;
      switch (calcOp) {
        case "+":
          result = calcPrev + current;
          break;
        case "-":
          result = calcPrev - current;
          break;
        case "*":
          result = calcPrev * current;
          break;
        case "/":
          if (current === 0) {
            await showCustomAlert("Cannot divide by zero", "Math Error", "➗");
            return;
          }
          result = calcPrev / current;
          break;
        default:
          return;
      }
      calcInput = result.toString();
      calcPrev = parseFloat(calcInput);
      calcOp = val;
      calcReset = true;
    }
  } else {
    // Number or decimal input
    if (calcReset) {
      calcInput = val;
      calcReset = false;
    } else {
      if (val === ".") {
        if (calcInput.includes(".")) return;
        calcInput = calcInput + ".";
      } else {
        calcInput = calcInput === "0" ? val : calcInput + val;
      }
    }
    cashAmount = parseFloat(calcInput); // Update cash amount as user types
    updatePaymentDisplay();
  }

  updateCalcDisplay();
}

// Quick cash buttons - SETS the cash amount (what customer paid)
// Quick cash buttons - ADDS with visual feedback in calculator
function setCashAmount(amount) {
  if (cashAmount === null) {
    // First time pressing cash button
    cashAmount = amount;
    calcInput = amount.toString();
    calcPrev = null;
    calcOp = null;
  } else {
    // Show the addition in calculator hint
    calcPrev = cashAmount;
    calcOp = "+";
    cashAmount += amount;
    calcInput = cashAmount.toString();

    // Clear the operation after a short delay
    setTimeout(() => {
      calcPrev = null;
      calcOp = null;
      updateCalcDisplay();
    }, 1000);
  }

  calcReset = false;
  updateCalcDisplay();
  updatePaymentDisplay();

  // Visual feedback
  const cashBtn = event?.target;
  if (cashBtn) {
    cashBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
      cashBtn.style.transform = "scale(1)";
    }, 100);
  }
}

// ADD TO ORDER BUTTON - Now just updates payment display
async function addCalcToOrder() {
  if (currentOrder.length === 0) {
    await showCustomAlert("Add items to order first!", "No Items", "🛒");
    return;
  }

  // This just updates the payment display - doesn't add an item
  updatePaymentDisplay();

  // Show confirmation that payment is recorded
  const calcAddBtn = document.getElementById("calc-add-to-cart");
  const originalText = calcAddBtn.textContent;
  calcAddBtn.textContent = "✓ Payment Set";
  setTimeout(() => {
    calcAddBtn.textContent = originalText;
  }, 1000);
}

// ========== PAYMENT DISPLAY ==========
function updatePaymentDisplay() {
  const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
  const paid = cashAmount || 0;
  const change = paid - total;

  const paidEl = document.getElementById("paid-amount");
  const changeEl = document.getElementById("change-amount");
  const changeRow = document.querySelector(".change-row");

  if (paidEl && changeEl && changeRow) {
    paidEl.textContent = `RM ${paid.toFixed(2)}`;
    changeEl.textContent = `RM ${Math.max(0, change).toFixed(2)}`;

    if (change < 0) {
      changeEl.style.color = "var(--danger)";
      changeRow.style.color = "var(--danger)";
      changeRow.querySelector("span:first-child").textContent = "Still Need:";
    } else {
      changeEl.style.color = "var(--success)";
      changeRow.style.color = "var(--text-main)";
      changeRow.querySelector("span:first-child").textContent =
        "Change to Return:";
    }
  }
}

// ========== CORE POS LOGIC ==========
function addItem(name, price) {
  currentOrder.push({ name, price });
  updateOrderList();
}

function voidLastItem() {
  if (currentOrder.length > 0) {
    currentOrder.pop();
    updateOrderList();
  }
}

// Change to async
async function clearOrder() {
  const confirmed = await showCustomConfirm("Clear current order?", "Clear Order", "🗑️");
  if (confirmed) {
    currentOrder = [];
    cashAmount = null;
    calcInput = "0";
    calcPrev = null;
    calcOp = null;
    updateOrderList();
    updateCalcDisplay();
    updatePaymentDisplay();
  }
}

async function saveSale() {
  if (currentOrder.length === 0) {
    await showCustomAlert("Order is empty!", "No Order", "🛒");
    return;
  }

  const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
  const paid = cashAmount || 0;
  const change = Math.max(0, paid - total);

  if (paymentMethod === "Cash" && paid < total) {
    const confirmed = await showCustomConfirm(
      `Customer still needs to pay RM ${(total - paid).toFixed(2)}. Continue anyway?`,
      "Insufficient Payment",
      "💰"
    );
    if (!confirmed) {
      return;
    }
  }

  const staff = document.getElementById("staffName").value || "Staff";
  const remarks = document.getElementById("saleRemarks")?.value || "";

  const newSale = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    staff: staff,
    items: [...currentOrder],
    total: total,
    paid: paid,
    change: change,
    paymentMethod: paymentMethod,
    remarks: remarks,
  };

  allSales.push(newSale);
  localStorage.setItem("churrosSales", JSON.stringify(allSales));

  generateReceipt(newSale);

  currentOrder = [];
  cashAmount = null;
  calcInput = "0";
  calcPrev = null;
  calcOp = null;
  if (document.getElementById("saleRemarks")) {
    document.getElementById("saleRemarks").value = "";
  }

  updateOrderList();
  updateReports();
  updateCalcDisplay();
  if (cartOpen) toggleCart();
}

// ========== RECEIPT FUNCTION ==========
function generateReceipt(sale) {
  document.getElementById("receiptDateTime").textContent = sale.date;
  document.getElementById("receiptStaff").textContent =
    "Served by: " + sale.staff;

  const itemsContainer = document.getElementById("receiptItems");
  itemsContainer.innerHTML = "";

  // Add payment method to receipt
  itemsContainer.innerHTML += `
  <div class="receipt-item">
    <span>Payment</span>
    <span>${sale.paymentMethod === "Cash" ? "Cash" : "QR Pay"}</span>
  </div>
`;

  sale.items.forEach((item) => {
    itemsContainer.innerHTML += `
      <div class="receipt-item">
        <span>1x ${item.name}</span>
        <span>RM ${item.price.toFixed(2)}</span>
      </div>
    `;
  });

  itemsContainer.innerHTML += `
    <div style="border-top: 1px dashed var(--border); margin: 10px 0; padding-top: 10px;"></div>
    <div class="receipt-item">
      <span>Total</span>
      <span>RM ${sale.total.toFixed(2)}</span>
    </div>
    <div class="receipt-item">
      <span>Paid</span>
      <span>RM ${sale.paid.toFixed(2)}</span>
    </div>
    <div class="receipt-item">
      <span>Change</span>
      <span>RM ${sale.change.toFixed(2)}</span>
    </div>
  `;

  if (sale.remarks) {
    itemsContainer.innerHTML += `
      <div style="margin-top: 10px; font-style: italic; color: var(--text-muted);">
        Note: ${sale.remarks}
      </div>
    `;
  }

  document.getElementById("receiptTotal").textContent =
    "RM " + sale.total.toFixed(2);
  openModal("receiptModal");
}

// ========== REPORTS ==========
function updateReports() {
  const today = new Date().toLocaleDateString();
  const todaysSales = allSales.filter((sale) => sale.date.includes(today));

  const totalAmount = todaysSales.reduce((sum, sale) => sum + sale.total, 0);

  document.getElementById("reportTotalSales").textContent =
    `RM ${totalAmount.toFixed(2)}`;
  document.getElementById("reportOrderCount").textContent = todaysSales.length;

  const listEl = document.getElementById("reportSalesList");
  listEl.innerHTML = "";

  if (todaysSales.length === 0) {
    listEl.innerHTML = `<li style="text-align:center; color: var(--text-muted); font-size: 0.9rem;">No sales yet today.</li>`;
    return;
  }

  [...todaysSales].reverse().forEach((sale) => {
    const li = document.createElement("li");
    li.style.cssText =
      "display:flex; justify-content:space-between; padding: 12px 0; border-bottom: 1px solid var(--border); font-size:0.9rem;";

    let time = sale.date.split(", ")[1] || sale.date;

    li.innerHTML = `
      <div>
        <strong style="color:var(--text-main);">${time}</strong><br>
        <span style="color:var(--text-muted); font-size:0.8rem;">${sale.items.length} items</span>
      </div>
      <strong style="color:var(--primary);">RM ${sale.total.toFixed(2)}</strong>
    `;
    listEl.appendChild(li);
  });
}

async function exportToExcel() {
  if (allSales.length === 0) {
    await showCustomAlert("No data to export", "Export Error", "📊");
    return;
  }

  // Calculate today's sales
  const today = new Date().toLocaleDateString();
  const todaysSales = allSales.filter((sale) => sale.date.includes(today));
  const todayTotal = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const todayCount = todaysSales.length;

  // Calculate payment method totals
  const cashToday = todaysSales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((sum, s) => sum + s.total, 0);
  const qrToday = todaysSales
    .filter((s) => s.paymentMethod === "QR")
    .reduce((sum, s) => sum + s.total, 0);

  // Calculate overall totals
  const grandTotal = allSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalPaid = allSales.reduce((sum, sale) => sum + sale.paid, 0);
  const totalChange = allSales.reduce((sum, sale) => sum + sale.change, 0);

  // Count items by category - FIXED to properly detect all items
  let totalSingles = 0,
    totalFamilies = 0,
    totalSpecialSingles = 0,
    totalSpecialFamilies = 0;
  let totalMilkDips = 0,
    totalDarkDips = 0,
    totalCaramelDips = 0,
    totalSpecialDips = 0;
  let totalKeychains = 0;

  allSales.forEach((sale) => {
    sale.items.forEach((item) => {
      // Log each item for debugging
      console.log("Counting item:", item.name);
      
      if (item.name === "Single Set") totalSingles++;
      else if (item.name === "Family Box") totalFamilies++;
      else if (item.name === "Special Single Set") totalSpecialSingles++;
      else if (item.name === "Special Family Box") totalSpecialFamilies++;
      else if (item.name === "+ Milk Choco Dip") totalMilkDips++;
      else if (item.name === "+ Dark Choco Dip") totalDarkDips++;
      else if (item.name === "+ Caramel Dip") totalCaramelDips++;
      else if (item.name === "+ Special Dip") totalSpecialDips++;
      else if (item.name === "Keychain") totalKeychains++;
    });
  });

  // Calculate totals
  const totalChurros =
    totalSingles + totalFamilies + totalSpecialSingles + totalSpecialFamilies;
  const totalDips =
    totalMilkDips + totalDarkDips + totalCaramelDips + totalSpecialDips;
  const totalItems = totalChurros + totalDips + totalKeychains;

  // Create CSV header
  let csvContent = "MR. CHURROS DUNGUN POS - SALES REPORT\n";
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  // TODAY'S SUMMARY
  csvContent += "=== TODAY'S SUMMARY ===\n";
  csvContent += `Date,${today}\n`;
  csvContent += `Total Sales,${todayCount}\n`;
  csvContent += `Total Revenue,RM ${todayTotal.toFixed(2)}\n`;
  csvContent += `Cash Payments,RM ${cashToday.toFixed(2)}\n`;
  csvContent += `QR Payments,RM ${qrToday.toFixed(2)}\n\n`;

  // TODAY'S TRANSACTIONS
  csvContent += "=== TODAY'S TRANSACTIONS ===\n";
  csvContent +=
    "Time,Items,Total(RM),Paid(RM),Change(RM),Payment,Staff,Remarks\n";

  todaysSales.forEach((sale) => {
    const date = new Date(sale.date);
    const timeStr = date.toLocaleTimeString();
    let itemsList = sale.items.map((i) => i.name).join(" + ");

    csvContent += `"${timeStr}","${itemsList}",${sale.total.toFixed(2)},${sale.paid.toFixed(2)},${sale.change.toFixed(2)},"${sale.paymentMethod}","${sale.staff}","${sale.remarks}"\n`;
  });

  // OVERALL SUMMARY
  csvContent += "\n=== OVERALL SUMMARY ===\n";
  csvContent += `Total Transactions,${allSales.length}\n`;
  csvContent += `Total Revenue,RM ${grandTotal.toFixed(2)}\n`;
  csvContent += `Total Paid,RM ${totalPaid.toFixed(2)}\n`;
  csvContent += `Total Change Given,RM ${totalChange.toFixed(2)}\n\n`;

  // PAYMENT METHOD BREAKDOWN
  csvContent += "=== PAYMENT METHOD BREAKDOWN ===\n";
  const totalCash = allSales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((sum, s) => sum + s.total, 0);
  const totalQR = allSales
    .filter((s) => s.paymentMethod === "QR")
    .reduce((sum, s) => sum + s.total, 0);
  csvContent += `Cash Payments,RM ${totalCash.toFixed(2)}\n`;
  csvContent += `QR Payments,RM ${totalQR.toFixed(2)}\n\n`;

  // ITEM BREAKDOWN - Updated to show "+" format
  csvContent += "=== ITEM BREAKDOWN ===\n";
  csvContent += "CHURROS SETS\n";
  csvContent += `Single Set,${totalSingles}\n`;
  csvContent += `Family Box,${totalFamilies}\n`;
  csvContent += `Special Single Set,${totalSpecialSingles}\n`;
  csvContent += `Special Family Box,${totalSpecialFamilies}\n`;
  csvContent += `Total Churros Sets,${totalChurros}\n\n`;

  csvContent += "DIPS (Add-ons)\n";
  csvContent += `Milk Choco Dip (add-on),${totalMilkDips}\n`;
  csvContent += `Dark Choco Dip (add-on),${totalDarkDips}\n`;
  csvContent += `Caramel Dip (add-on),${totalCaramelDips}\n`;
  csvContent += `Special Dip (add-on),${totalSpecialDips}\n`;
  csvContent += `Total Dips,${totalDips}\n\n`;

  csvContent += "MERCHANDISE\n";
  csvContent += `Keychain,${totalKeychains}\n\n`;

  csvContent += `TOTAL ITEMS SOLD,${totalItems}\n\n`;

  // ALL TRANSACTIONS HISTORY
  csvContent += "=== ALL TRANSACTIONS HISTORY ===\n";
  csvContent +=
    "Date,Time,Items,Total(RM),Paid(RM),Change(RM),Payment,Staff,Remarks\n";

  allSales.forEach((sale) => {
    const date = new Date(sale.date);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    let itemsList = sale.items.map((i) => i.name).join(" + ");

    csvContent += `"${dateStr}","${timeStr}","${itemsList}",${sale.total.toFixed(2)},${sale.paid.toFixed(2)},${sale.change.toFixed(2)},"${sale.paymentMethod}","${sale.staff}","${sale.remarks}"\n`;
  });

  // Create filename
  const filename = `churros_sales_${new Date().toISOString().split("T")[0]}.csv`;

  // Check if running in Android WebView
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid && window.Android) {
    // Use Android interface to save file
    await showCustomAlert("Saving to Downloads folder...", "Download", "📥");
    Android.downloadCSV(csvContent, filename);
  } else {
    // Regular browser download using Blob
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

// ========== CUSTOM POPUP SYSTEM ==========

// Custom Alert
function showCustomAlert(message, title = "Alert", icon = "🔔") {
  return new Promise((resolve) => {
    const modal = document.getElementById("customAlertModal");
    const titleEl = document.getElementById("alertTitle");
    const messageEl = document.getElementById("alertMessage");
    const iconEl = document.getElementById("alertIcon");
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    iconEl.textContent = icon;
    
    modal.classList.add("active");
    
    const okBtn = document.getElementById("alertOkBtn");
    
    const handleOk = () => {
      modal.classList.remove("active");
      cleanup();
      resolve();
    };
    
    const handleOutsideClick = (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        cleanup();
        resolve();
      }
    };
    
    const cleanup = () => {
      okBtn.removeEventListener("click", handleOk);
      modal.removeEventListener("click", handleOutsideClick);
    };
    
    okBtn.addEventListener("click", handleOk);
    modal.addEventListener("click", handleOutsideClick);
  });
}

// Custom Confirm
function showCustomConfirm(message, title = "Confirm", icon = "❓") {
  return new Promise((resolve) => {
    const modal = document.getElementById("customConfirmModal");
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const iconEl = document.getElementById("confirmIcon");
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    iconEl.textContent = icon;
    
    modal.classList.add("active");
    
    const okBtn = document.getElementById("confirmOkBtn");
    const cancelBtn = document.getElementById("confirmCancelBtn");
    
    const handleOk = () => {
      modal.classList.remove("active");
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      modal.classList.remove("active");
      cleanup();
      resolve(false);
    };
    
    const handleOutsideClick = (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        cleanup();
        resolve(false);
      }
    };
    
    const cleanup = () => {
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      modal.removeEventListener("click", handleOutsideClick);
    };
    
    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    modal.addEventListener("click", handleOutsideClick);
  });
}

// Override native browser popups
window.alert = function(message) {
  return showCustomAlert(message);
};

window.confirm = function(message) {
  return showCustomConfirm(message);
};

// ========== CUSTOM NUMPAD ==========
function calcType(val) {
  if (val === "C") {
    customInputVal = "0";
  } else {
    if (customInputVal === "0" && val !== "00") {
      customInputVal = val;
    } else {
      customInputVal += val;
    }
  }

  let num = parseInt(customInputVal, 10);
  if (isNaN(num)) num = 0;
  document.getElementById("calcDisplay").textContent = (num / 100).toFixed(2);
}

function addCustomItem() {
  let num = parseInt(customInputVal, 10);
  if (isNaN(num) || num === 0) return;

  let price = num / 100;
  let name = document.getElementById("customItemName").value || "Misc Item";

  addItem(name, price);

  customInputVal = "0";
  document.getElementById("calcDisplay").textContent = "0.00";
  document.getElementById("customItemName").value = "Misc Item";
  closeModal("customItemModal");
}

// ========== UI INTERACTIONS ==========
function toggleCart() {
  const sheet = document.getElementById("cartSheet");
  cartOpen = !cartOpen;
  sheet.classList.toggle("open", cartOpen);
}

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function switchView(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));

  document.getElementById("page-" + pageId).classList.add("active");
  document
    .querySelector(`.nav-btn[data-page="${pageId}"]`)
    .classList.add("active");

  const sheet = document.getElementById("cartSheet");
  if (pageId === "pos" || pageId === "calc") {
    sheet.style.display = "flex";
  } else {
    sheet.style.display = "none";
    if (cartOpen) toggleCart();
  }
}

// ========== EASTER EGG - Logo click to open dev page ==========
function initEasterEgg() {
  const logoElement = document.getElementById("devEasterEgg");

  if (!logoElement) {
    console.log("Logo element not found yet, retrying...");
    setTimeout(initEasterEgg, 500);
    return;
  }

  let logoClickCount = 0;
  let logoClickTimer;

  logoElement.addEventListener("click", () => {
    logoClickCount++;
    console.log("Logo clicked:", logoClickCount); // Debug log

    // Clear the previous timer
    clearTimeout(logoClickTimer);

    // Set a new timer to reset count after 2 seconds
    logoClickTimer = setTimeout(() => {
      logoClickCount = 0;
      console.log("Click count reset");
    }, 2000);

    // If clicked 3 times, open dev page
    if (logoClickCount === 3) {
      logoClickCount = 0;

      // Switch to dev page
      switchView("dev");
    }
  });

  console.log("Easter egg initialized!");
}
