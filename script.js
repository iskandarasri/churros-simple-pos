// ========== STATE ==========
let currentOrder = [];
let allSales = [];
let darkMode = localStorage.getItem("darkMode") === "true";
let cartOpen = false;
let customInputVal = "0";
let currentStaff = "Staff 1";
let currentCategory = "all";

// Calculator & Payment state
let paymentMethod = "Cash";
let calcInput = "0";
let calcPrev = null;
let calcOp = null;
let calcReset = false;
let cashAmount = null;

// Tracking untuk Special Dip Family Box
let specialBoxActive = false;
let specialBoxIndex = -1;

// ========== CASH DRAWER STATE ==========
let startingCash = 200.00; // Default starting cash RM200
let cashRefunds = 0;
let paidIn = 0;
let paidOut = 0;
let currentShift = null;

const menuItems = [
  {
    id: 1,
    name: "Single Set",
    price: 7.0,
    image: "single.png",
    color: "#FEF3C7",
    category: "churros",
  },
  {
    id: 2,
    name: "Family Box",
    price: 35.0,
    image: "family.png",
    color: "#FDE68A",
    category: "churros",
  },
  {
    id: 3,
    name: "Special Single Set",
    price: 8.0,
    image: "seasonal_single.png",
    color: "#eefbcf",
    category: "churros",
  },
  // Special Dip untuk Family Box (RM1)
  {
    id: 10,
    name: "+ Special Dip (FB)",
    price: 1.0,
    image: "seasonal_family.png",
    color: "#cfe9d0",
    category: "dips",
    isFamilyBoxDip: true,
  },
  {
    id: 5,
    name: "+ Milk Choco Dip",
    price: 2.0,
    image: "milk_choco.png",
    color: "#e6ae74",
    category: "dips",
  },
  {
    id: 6,
    name: "+ Dark Choco Dip",
    price: 2.0,
    image: "dark_choco.png",
    color: "#a78b78",
    category: "dips",
  },
  {
    id: 7,
    name: "+ Caramel Dip",
    price: 2.0,
    image: "caramel.png",
    color: "#FEF3C7",
    category: "dips",
  },
  {
    id: 8,
    name: "+ Special Dip",
    price: 3.0,
    image: "seasonal_dip.png",
    color: "#cfe9d0",
    category: "dips",
    isSpecialDip: true,
  },
  {
    id: 9,
    name: "Keychain",
    price: 5.0,
    image: "keychain.png",
    color: "#E5E7EB",
    category: "merch",
  },
];

// ========== LOAD STORED DATA ==========
function loadStoredData() {
  try {
    // Load sales
    const saved = localStorage.getItem("churrosSales");
    if (saved) allSales = JSON.parse(saved);
    
    // Load cash drawer
    const savedStartingCash = localStorage.getItem("startingCash");
    if (savedStartingCash) startingCash = parseFloat(savedStartingCash);
    
    const savedCashRefunds = localStorage.getItem("cashRefunds");
    if (savedCashRefunds) cashRefunds = parseFloat(savedCashRefunds);
    
    const savedPaidIn = localStorage.getItem("paidIn");
    if (savedPaidIn) paidIn = parseFloat(savedPaidIn);
    
    const savedPaidOut = localStorage.getItem("paidOut");
    if (savedPaidOut) paidOut = parseFloat(savedPaidOut);
    
    const savedShift = localStorage.getItem("currentShift");
    if (savedShift) currentShift = JSON.parse(savedShift);
    
  } catch (e) {
    console.log("No saved data or error loading:", e);
  }
}

// ========== INITIALIZATION ==========
window.onload = () => {
  loadStoredData();

  if (darkMode) document.body.classList.add("dark-mode");

  renderMenu();
  updateOrderList();
  updateReports();
  updateCalcDisplay();
  updatePaymentDisplay();
  updateCashDrawerDisplay();

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
        setCashAmount(amount);
        const manualInput = document.getElementById("manual-paid-amount");
        if (manualInput) {
          manualInput.value = amount;
        }
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
    searchInput.addEventListener("input", function () {
      renderMenu();
    });
    searchInput.addEventListener("search", function () {
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

  // Cash Drawer event listeners
  document.getElementById("updateFloatBtn")?.addEventListener("click", updateStartingCash);
  document.getElementById("startingCashInput")?.addEventListener("change", updateStartingCash);
  document.getElementById("paidInBtn")?.addEventListener("click", addPaidIn);
  document.getElementById("paidOutBtn")?.addEventListener("click", addPaidOut);
  document.getElementById("closeShiftBtn")?.addEventListener("click", closeShift);
  document.getElementById("resetDrawerBtn")?.addEventListener("click", resetDrawer);

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
      if (paymentMethod === "Cash") {
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
      paymentMethod = "Cash";
      updatePaymentButtons();
    });
  }

  if (paymentQrBtn) {
    paymentQrBtn.addEventListener("click", () => {
      paymentMethod = "QR";
      updatePaymentButtons();
    });
  }

  updatePaymentButtons();

  // Quick Notes Preset (if elements exist)
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
      manualPaidInput.value = "";
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

// ========== CASH DRAWER FUNCTIONS ==========
function updateCashDrawerDisplay() {
  // Check if elements exist
  if (!document.getElementById("startingCashInput")) return;
  
  // Get today's sales
  const today = new Date().toLocaleDateString();
  const todaysSales = allSales.filter((sale) => sale.date.includes(today));

  // Calculate cash sales and card sales
  let cashSales = 0;
  let cardSales = 0;

  todaysSales.forEach((sale) => {
    if (sale.paymentMethod === "Cash") {
      cashSales += sale.total;
    } else {
      cardSales += sale.total;
    }
  });

  // Update display
  document.getElementById("startingCashInput").value = startingCash.toFixed(2);
  document.getElementById("cashSalesTotal").textContent =
    `RM ${cashSales.toFixed(2)}`;
  document.getElementById("cardSalesTotal").textContent =
    `RM ${cardSales.toFixed(2)}`;
  document.getElementById("cashRefunds").textContent =
    `RM ${cashRefunds.toFixed(2)}`;
  document.getElementById("paidIn").textContent = `RM ${paidIn.toFixed(2)}`;
  document.getElementById("paidOut").textContent = `RM ${paidOut.toFixed(2)}`;

  // Calculate expected cash: startingCash + cashSales - cashRefunds + paidIn - paidOut
  const expectedCash =
    startingCash + cashSales - cashRefunds + paidIn - paidOut;
  document.getElementById("expectedCash").textContent =
    `RM ${expectedCash.toFixed(2)}`;

  // Save to localStorage
  localStorage.setItem("startingCash", startingCash.toString());
  localStorage.setItem("cashRefunds", cashRefunds.toString());
  localStorage.setItem("paidIn", paidIn.toString());
  localStorage.setItem("paidOut", paidOut.toString());
}

// Update starting cash from input
function updateStartingCash() {
  const input = document.getElementById("startingCashInput");
  if (!input) return;
  
  const newFloat = parseFloat(input.value);
  if (!isNaN(newFloat) && newFloat >= 0) {
    startingCash = newFloat;
    updateCashDrawerDisplay();
    showCustomAlert(
      `Starting cash set to RM ${startingCash.toFixed(2)}`,
      "Success",
      "💰"
    );
  } else {
    showCustomAlert("Please enter a valid amount", "Error", "❌");
    input.value = startingCash.toFixed(2);
  }
}

// Paid In / Paid Out with styled modal
async function addPaidIn() {
  const amount = await showCustomInputModal(
    "Enter amount to add (Paid In):",
    "💰",
    "0"
  );
  
  if (amount !== null && amount > 0) {
    paidIn += amount;
    updateCashDrawerDisplay();
    showCustomAlert(
      `Added RM ${amount.toFixed(2)} to drawer`,
      "Success",
      "✅"
    );
  }
}

async function addPaidOut() {
  const amount = await showCustomInputModal(
    "Enter amount to withdraw (Paid Out):",
    "💸",
    "0"
  );
  
  if (amount !== null && amount > 0) {
    // Check if enough cash in drawer
    const today = new Date().toLocaleDateString();
    const todaysSales = allSales.filter((sale) => sale.date.includes(today));
    const cashSales = todaysSales
      .filter((s) => s.paymentMethod === "Cash")
      .reduce((sum, s) => sum + s.total, 0);
    
    const currentDrawer = startingCash + cashSales - cashRefunds + paidIn - paidOut;
    
    if (amount > currentDrawer) {
      showCustomAlert(
        `Insufficient funds! Current drawer: RM ${currentDrawer.toFixed(2)}`,
        "Error",
        "❌"
      );
      return;
    }
    
    paidOut += amount;
    updateCashDrawerDisplay();
    showCustomAlert(
      `Withdrew RM ${amount.toFixed(2)} from drawer`,
      "Success",
      "✅"
    );
  }
}

// Close Shift
function closeShift() {
  const today = new Date().toLocaleDateString();
  const todaysSales = allSales.filter((sale) => sale.date.includes(today));

  let cashSales = 0;
  let cardSales = 0;

  todaysSales.forEach((sale) => {
    if (sale.paymentMethod === "Cash") {
      cashSales += sale.total;
    } else {
      cardSales += sale.total;
    }
  });

  const expectedCash =
    startingCash + cashSales - cashRefunds + paidIn - paidOut;

  // Format with proper line breaks
  const shiftReport = 
`SHIFT CLOSING REPORT
====================
Date: ${today}

STARTING CASH: RM ${startingCash.toFixed(2)}

SALES SUMMARY:
  Cash Sales: RM ${cashSales.toFixed(2)}
  Card Sales: RM ${cardSales.toFixed(2)}

ADJUSTMENTS:
  Refunds: RM ${cashRefunds.toFixed(2)}
  Paid In: RM ${paidIn.toFixed(2)}
  Paid Out: RM ${paidOut.toFixed(2)}

EXPECTED CASH: RM ${expectedCash.toFixed(2)}

Take out RM ${cashSales.toFixed(2)} (cash sales) to bank,
leaving RM ${startingCash.toFixed(2)} for next shift.`;

  showCustomAlert(shiftReport, "Shift Closed", "✅");
}

// Reset Drawer
function resetDrawer() {
  showCustomConfirm(
    "Reset cash drawer? This will clear all adjustments (Paid In/Out).",
    "Reset Drawer",
    "⚠️"
  ).then((confirmed) => {
    if (confirmed) {
      cashRefunds = 0;
      paidIn = 0;
      paidOut = 0;
      updateCashDrawerDisplay();
      showCustomAlert("Drawer reset successfully", "Success", "✅");
    }
  });
}

// ========== UI RENDERERS ==========
function renderMenu() {
  const grid = document.getElementById("menuGrid");
  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  grid.innerHTML = "";

  let filtered =
    currentCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === currentCategory);

  if (searchTerm) {
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
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
    card.onclick = () => addItem(item.name, item.price, item);
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

// Custom Input Modal Function
function showCustomInputModal(title = "Enter Amount", icon = "💰", defaultValue = "0") {
  return new Promise((resolve) => {
    const modal = document.getElementById("customInputModal");
    
    if (!modal) {
      const result = prompt(title, defaultValue);
      if (result === null) resolve(null);
      else {
        const num = parseFloat(result);
        resolve(isNaN(num) ? null : num);
      }
      return;
    }

    const titleEl = document.getElementById("inputModalTitle");
    const iconEl = document.getElementById("inputModalIcon");
    const inputField = document.getElementById("inputModalField");
    const confirmBtn = document.getElementById("inputModalConfirmBtn");
    const cancelBtn = document.getElementById("inputModalCancelBtn");

    if (!titleEl || !iconEl || !inputField || !confirmBtn || !cancelBtn) {
      const result = prompt(title, defaultValue);
      if (result === null) resolve(null);
      else {
        const num = parseFloat(result);
        resolve(isNaN(num) ? null : num);
      }
      return;
    }

    titleEl.textContent = title;
    iconEl.textContent = icon;
    inputField.value = defaultValue;
    inputField.focus();
    inputField.select();

    modal.classList.add("active");

    const handleConfirm = () => {
      const value = parseFloat(inputField.value);
      modal.classList.remove("active");
      cleanup();
      if (!isNaN(value) && value >= 0) {
        resolve(value);
      } else {
        resolve(null);
      }
    };

    const handleCancel = () => {
      modal.classList.remove("active");
      cleanup();
      resolve(null);
    };

    const handleOutsideClick = (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        cleanup();
        resolve(null);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        handleConfirm();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    };

    const cleanup = () => {
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
      modal.removeEventListener("click", handleOutsideClick);
      inputField.removeEventListener("keydown", handleKeyPress);
    };

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    modal.addEventListener("click", handleOutsideClick);
    inputField.addEventListener("keydown", handleKeyPress);
  });
}

function updateOrderList() {
  const listEl = document.getElementById("order-list");
  const totalEl = document.getElementById("order-total-amount");
  const sheetTotalEl = document.getElementById("cartTotalSummary");
  const countEl = document.getElementById("cartCount");
  const cartHeader = document.getElementById("cartHeaderToggle");

  listEl.innerHTML = "";
  let total = 0;
  let itemCount = 0;

  if (currentOrder.length === 0) {
    listEl.innerHTML = `<li style="text-align:center; color: var(--text-muted); margin-top: 20px; font-size: 0.9rem;">Cart is empty</li>`;
    countEl.textContent = `0 Items`;
    totalEl.textContent = `RM 0.00`;
    sheetTotalEl.textContent = `RM 0.00`;
    return;
  }

  // Group items by name
  const grouped = {};
  
  currentOrder.forEach((item) => {
    const key = item.name;
    if (!grouped[key]) {
      grouped[key] = {
        name: item.name,
        price: item.price,
        count: 1,
        isFamilyBoxDip: item.isFamilyBoxDip || false
      };
    } else {
      grouped[key].count++;
    }
  });

  // Separate Family Box and its dips
  let familyBoxCount = 0;
  let dipCount = 0;
  const otherItems = [];

  Object.values(grouped).forEach(item => {
    if (item.name === "Family Box") {
      familyBoxCount = item.count;
    } else if (item.isFamilyBoxDip || item.name === "+ Special Dip (FB)") {
      dipCount = item.count;
    } else {
      otherItems.push(item);
    }
  });

  // Display Family Box with dips
  if (familyBoxCount > 0) {
    const boxTotal = 35.0 * familyBoxCount + dipCount * 1.0;
    total += boxTotal;
    itemCount += familyBoxCount;

    const boxLi = document.createElement("li");
    boxLi.className = "order-item";
    
    let dipDisplay = "";
    if (dipCount > 0) {
      dipDisplay = ` (with ${dipCount} special dip${dipCount > 1 ? "s" : ""})`;
    }

    boxLi.innerHTML = `
      <div class="order-item-left">
        <span class="item-qty">${familyBoxCount}x</span>
        <span class="item-name">Family Box${dipDisplay}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="item-price">RM ${boxTotal.toFixed(2)}</span>
        <button class="delete-item-btn" data-item-type="family-box">✕</button>
      </div>
    `;
    listEl.appendChild(boxLi);

    // Show dips count
    if (dipCount > 0) {
      const dipLi = document.createElement("li");
      dipLi.className = "order-item";
      dipLi.style.paddingLeft = "30px";
      dipLi.style.fontSize = "0.85rem";
      dipLi.style.opacity = "0.8";
      dipLi.style.borderBottom = "none";
      dipLi.innerHTML = `
        <div class="order-item-left">
          <span class="item-qty">${dipCount}x</span>
          <span class="item-name">↳ + Special Dip (FB)</span>
        </div>
        <span class="item-price">RM ${(dipCount * 1.0).toFixed(2)}</span>
      `;
      listEl.appendChild(dipLi);
    }
  }

  // Display other items
  otherItems.forEach(item => {
    const itemTotal = item.price * item.count;
    total += itemTotal;
    itemCount += item.count;

    const li = document.createElement("li");
    li.className = "order-item";
    li.innerHTML = `
      <div class="order-item-left">
        <span class="item-qty">${item.count}x</span>
        <span class="item-name">${item.name}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="item-price">RM ${itemTotal.toFixed(2)}</span>
        <button class="delete-item-btn" data-item-name="${item.name}" data-item-price="${item.price}">✕</button>
      </div>
    `;
    listEl.appendChild(li);
  });

  // Delete button listeners
  document.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      
      if (btn.dataset.itemType === "family-box") {
        // Remove all Family Boxes and dips
        currentOrder = currentOrder.filter(item => 
          item.name !== "Family Box" && 
          !item.isFamilyBoxDip && 
          item.name !== "+ Special Dip (FB)"
        );
      } else {
        const itemName = btn.dataset.itemName;
        const itemPrice = parseFloat(btn.dataset.itemPrice);
        
        // Find and remove one instance of this item
        const index = currentOrder.findIndex(
          item => item.name === itemName && item.price === itemPrice
        );
        if (index !== -1) {
          currentOrder.splice(index, 1);
        }
      }
      
      updateOrderList();
    });
  });

  const formattedTotal = `RM ${total.toFixed(2)}`;
  totalEl.textContent = formattedTotal;
  sheetTotalEl.textContent = formattedTotal;
  countEl.textContent = `${itemCount} Items`;

  updatePaymentDisplay();

  if (currentOrder.length > 0 && !cartOpen) {
    cartHeader.classList.add("cart-flash");
    setTimeout(() => {
      cartHeader.classList.remove("cart-flash");
    }, 300);
  } else if (currentOrder.length === 0 && cartOpen) {
    toggleCart();
  }
}

// ========== VOID LAST ITEM FUNCTION ==========
function voidLastItem() {
  if (currentOrder.length === 0) {
    showCustomAlert("No items to void", "Cart Empty", "🛒");
    return;
  }

  // Dapatkan item terakhir
  const lastItem = currentOrder[currentOrder.length - 1];

  // Kalau item last ada quantity lebih dari 1, kurangkan quantity
  if (lastItem.quantity && lastItem.quantity > 1) {
    lastItem.quantity--;

    // Update price based on quantity
    if (lastItem.isFamilyBoxDip || lastItem.name === "+ Special Dip (FB)") {
      lastItem.price = lastItem.quantity * 1.0;
    } else if (lastItem.name === "+ Special Dip") {
      lastItem.price = lastItem.quantity * 3.0;
    } else {
      // For other items, assume price is per item
      const originalPrice = lastItem.price / (lastItem.quantity + 1);
      lastItem.price = originalPrice * lastItem.quantity;
    }

    showCustomAlert("Last item quantity reduced", "Void", "↩️");
  } else {
    // Kalau quantity 1 atau takde quantity, buang item terus
    currentOrder.pop();
    showCustomAlert("Last item removed", "Void", "↩️");
  }

  updateOrderList();
}

function deleteItemFromOrder(itemName, itemPrice) {
  // Find the FIRST index of the item to delete
  const index = currentOrder.findIndex(
    (item) => item.name === itemName && item.price === itemPrice
  );

  if (index !== -1) {
    // Check if this item has quantity > 1
    if (currentOrder[index].quantity && currentOrder[index].quantity > 1) {
      // Reduce quantity instead of removing the item
      currentOrder[index].quantity--;
      // Update price
      if (currentOrder[index].isFamilyBoxDip || currentOrder[index].name === "+ Special Dip (FB)") {
        currentOrder[index].price = currentOrder[index].quantity * 1.0;
      } else if (currentOrder[index].name === "+ Special Dip") {
        currentOrder[index].price = currentOrder[index].quantity * 3.0;
      } else {
        currentOrder[index].price = currentOrder[index].quantity * itemPrice;
      }
    } else {
      // Remove the item completely
      currentOrder.splice(index, 1);
    }
    updateOrderList();
  }
}

// ========== CORE POS LOGIC ==========
function addItem(name, price, itemData = {}) {
  console.log("Adding item:", name, price);
  
  // Check if this is Special Dip for Family Box (RM1)
  if (name === "+ Special Dip (FB)") {
    // Check if Family Box exists in order
    const hasFamilyBox = currentOrder.some(
      (item) => item.name === "Family Box"
    );

    if (hasFamilyBox) {
      currentOrder.push({
        name: "+ Special Dip (FB)",
        price: 1.0,
        isFamilyBoxDip: true
      });
      showCustomAlert("Added Special Dip (RM1) to Family Box", "Success", "✅");
    } else {
      showCustomAlert("Please add Family Box first!", "Error", "❌");
      return;
    }
  }
  // Check if this is regular Special Dip (RM3)
  else if (name === "+ Special Dip") {
    currentOrder.push({
      name: "+ Special Dip",
      price: 3.0
    });
  }
  // Regular items
  else {
    currentOrder.push({
      name: name,
      price: price
    });
  }
  
  updateOrderList();
}

async function clearOrder() {
  if (currentOrder.length === 0) {
    showCustomAlert("Cart is already empty", "Info", "🛒");
    return;
  }

  const confirmed = await showCustomConfirm(
    "Clear entire order?",
    "Clear Order",
    "🗑️",
  );

  if (confirmed) {
    currentOrder = [];
    cashAmount = null;
    calcInput = "0";
    calcPrev = null;
    calcOp = null;

    const manualInput = document.getElementById("manual-paid-amount");
    if (manualInput) {
      manualInput.value = "";
    }

    updateOrderList();
    updateCalcDisplay();
    updatePaymentDisplay();
    showCustomAlert("Order cleared", "Success", "✅");
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
      "💰",
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

  // Reset everything
  currentOrder = [];
  cashAmount = null;
  calcInput = "0";
  calcPrev = null;
  calcOp = null;

  const manualInput = document.getElementById("manual-paid-amount");
  if (manualInput) {
    manualInput.value = "";
  }

  if (document.getElementById("saleRemarks")) {
    document.getElementById("saleRemarks").value = "";
  }

  updateOrderList();
  updateReports();
  updateCalcDisplay();
  updatePaymentDisplay();

  if (cartOpen) toggleCart();
}

// ========== RECEIPT FUNCTION ==========
function generateReceipt(sale) {
  document.getElementById("receiptDateTime").textContent = sale.date;
  document.getElementById("receiptStaff").textContent =
    "Served by: " + sale.staff;

  const itemsContainer = document.getElementById("receiptItems");
  itemsContainer.innerHTML = "";

  // Group items for cleaner receipt
  let familyBoxTotal = 0;
  let familyBoxQuantity = 0;
  let familyBoxDipsTotal = 0;
  let familyBoxDipsQuantity = 0;

  sale.items.forEach((item) => {
    if (item.name === "Family Box") {
      familyBoxQuantity += item.quantity || 1;
      familyBoxTotal += 35.0 * (item.quantity || 1);
    } else if (item.isFamilyBoxDip || item.name === "+ Special Dip (FB)") {
      familyBoxDipsQuantity += item.quantity || 1;
      familyBoxDipsTotal += 1.0 * (item.quantity || 1);
    }
  });

  // Display Family Box with dips
  if (familyBoxQuantity > 0) {
    itemsContainer.innerHTML += `
      <div class="receipt-item">
        <span>${familyBoxQuantity}x Family Box ${familyBoxDipsQuantity > 0 ? `(+${familyBoxDipsQuantity} dip${familyBoxDipsQuantity > 1 ? "s" : ""})` : ""}</span>
        <span>RM ${(familyBoxTotal + familyBoxDipsTotal).toFixed(2)}</span>
      </div>
    `;
  }

  // Display other items with quantities
  sale.items.forEach((item) => {
    if (
      item.name !== "Family Box" &&
      !item.isFamilyBoxDip &&
      item.name !== "+ Special Dip (FB)"
    ) {
      const quantity = item.quantity || 1;
      itemsContainer.innerHTML += `
        <div class="receipt-item">
          <span>${quantity}x ${item.name}</span>
          <span>RM ${item.price.toFixed(2)}</span>
        </div>
      `;
    }
  });

  itemsContainer.innerHTML += `
    <div style="border-top: 1px dashed var(--border); margin: 10px 0; padding-top: 10px;"></div>
    <div class="receipt-item">
      <span>Subtotal</span>
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
    <div class="receipt-item">
      <span>Payment</span>
      <span>${sale.paymentMethod === "Cash" ? "Cash" : "QR Pay"}</span>
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

  // Update cash drawer display
  updateCashDrawerDisplay();

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

  const today = new Date().toLocaleDateString();
  const todaysSales = allSales.filter((sale) => sale.date.includes(today));
  const todayTotal = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const todayCount = todaysSales.length;

  const cashToday = todaysSales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((sum, s) => sum + s.total, 0);
  const qrToday = todaysSales
    .filter((s) => s.paymentMethod === "QR")
    .reduce((sum, s) => sum + s.total, 0);

  const grandTotal = allSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalPaid = allSales.reduce((sum, sale) => sum + sale.paid, 0);
  const totalChange = allSales.reduce((sum, sale) => sum + sale.change, 0);

  // Count items by category
  let totalSingles = 0,
    totalFamilies = 0,
    totalSpecialSingles = 0;
  let totalMilkDips = 0,
    totalDarkDips = 0,
    totalCaramelDips = 0,
    totalSpecialDips = 0,
    totalFamilyBoxDips = 0;
  let totalKeychains = 0;

  allSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const quantity = item.quantity || 1;
      
      if (item.name === "Single Set") totalSingles += quantity;
      else if (item.name === "Family Box") totalFamilies += quantity;
      else if (item.name === "Special Single Set") totalSpecialSingles += quantity;
      else if (item.name === "+ Milk Choco Dip") totalMilkDips += quantity;
      else if (item.name === "+ Dark Choco Dip") totalDarkDips += quantity;
      else if (item.name === "+ Caramel Dip") totalCaramelDips += quantity;
      else if (item.name === "+ Special Dip") totalSpecialDips += quantity;
      else if (item.isFamilyBoxDip || item.name === "+ Special Dip (FB)")
        totalFamilyBoxDips += quantity;
      else if (item.name === "Keychain") totalKeychains += quantity;
    });
  });

  const totalChurros = totalSingles + totalFamilies + totalSpecialSingles;
  const totalDips =
    totalMilkDips +
    totalDarkDips +
    totalCaramelDips +
    totalSpecialDips +
    totalFamilyBoxDips;
  const totalItems = totalChurros + totalDips + totalKeychains;

  // Use comma delimiter for Excel (standard CSV)
  const delimiter = ",";
  
  // Helper function to escape CSV fields for Excel
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return "";
    // Replace any potential formula characters
    let cleaned = str.toString();
    // If string starts with =, +, -, @, add a single quote to prevent formula execution
    if (cleaned.startsWith('=') || cleaned.startsWith('+') || 
        cleaned.startsWith('-') || cleaned.startsWith('@')) {
      cleaned = "'" + cleaned;
    }
    // If contains delimiter, quotes, or newlines, wrap in quotes
    if (cleaned.includes(delimiter) || cleaned.includes('"') || cleaned.includes('\n')) {
      return '"' + cleaned.replace(/"/g, '""') + '"';
    }
    return cleaned;
  };

  // Helper for numbers (always use dot as decimal separator)
  const formatNumber = (num) => {
    return num.toFixed(2);
  };

  let csvContent = "";

  // HEADER - Excel format
  csvContent += "MR CHURROS DUNGUN POS - SALES REPORT\n";
  csvContent += `Generated,${escapeCSV(new Date().toLocaleString())}\n\n`;

  // TODAY'S SUMMARY
  csvContent += "TODAY'S SUMMARY\n";
  csvContent += `Date,${escapeCSV(today)}\n`;
  csvContent += `Total Sales,${todayCount}\n`;
  csvContent += `Total Revenue,${formatNumber(todayTotal)}\n`;
  csvContent += `Cash Payments,${formatNumber(cashToday)}\n`;
  csvContent += `QR Payments,${formatNumber(qrToday)}\n\n`;

  // TODAY'S TRANSACTIONS
  csvContent += "TODAY'S TRANSACTIONS\n";
  csvContent += `Time,Items,Total (RM),Paid (RM),Change (RM),Payment,Staff,Remarks\n`;

  todaysSales.forEach((sale) => {
    const date = new Date(sale.date);
    const timeStr = date.toLocaleTimeString();
    
    // Build items list with quantities
    let itemsList = [];
    sale.items.forEach((item) => {
      const qty = item.quantity || 1;
      if (qty > 1) {
        itemsList.push(`${qty}x ${item.name}`);
      } else {
        itemsList.push(item.name);
      }
    });
    const itemsString = itemsList.join(" + ");
    
    csvContent += `${escapeCSV(timeStr)},`;
    csvContent += `${escapeCSV(itemsString)},`;
    csvContent += `${formatNumber(sale.total)},`;
    csvContent += `${formatNumber(sale.paid)},`;
    csvContent += `${formatNumber(sale.change)},`;
    csvContent += `${escapeCSV(sale.paymentMethod)},`;
    csvContent += `${escapeCSV(sale.staff)},`;
    csvContent += `${escapeCSV(sale.remarks)}\n`;
  });

  csvContent += "\nOVERALL SUMMARY\n";
  csvContent += `Total Transactions,${allSales.length}\n`;
  csvContent += `Total Revenue,${formatNumber(grandTotal)}\n`;
  csvContent += `Total Paid,${formatNumber(totalPaid)}\n`;
  csvContent += `Total Change Given,${formatNumber(totalChange)}\n\n`;

  csvContent += "PAYMENT METHOD BREAKDOWN\n";
  const totalCash = allSales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((sum, s) => sum + s.total, 0);
  const totalQR = allSales
    .filter((s) => s.paymentMethod === "QR")
    .reduce((sum, s) => sum + s.total, 0);
  csvContent += `Cash Payments,${formatNumber(totalCash)}\n`;
  csvContent += `QR Payments,${formatNumber(totalQR)}\n\n`;

  csvContent += "ITEM BREAKDOWN\n";
  csvContent += "CHURROS SETS\n";
  csvContent += `Single Set,${totalSingles}\n`;
  csvContent += `Family Box,${totalFamilies}\n`;
  csvContent += `Special Single Set,${totalSpecialSingles}\n`;
  csvContent += `Total Churros Sets,${totalChurros}\n\n`;

  csvContent += "DIPS (Add-ons)\n";
  // For Excel, add a single quote before + signs to prevent formula errors
  // The quote won't show in the cell
  csvContent += `'+ Milk Choco Dip,${totalMilkDips}\n`;
  csvContent += `'+ Dark Choco Dip,${totalDarkDips}\n`;
  csvContent += `'+ Caramel Dip,${totalCaramelDips}\n`;
  csvContent += `'+ Regular Special Dip,${totalSpecialDips}\n`;
  csvContent += `'+ Family Box Special Dip,${totalFamilyBoxDips}\n`;
  csvContent += `Total Dips,${totalDips}\n\n`;

  csvContent += "MERCHANDISE\n";
  csvContent += `Keychain,${totalKeychains}\n\n`;

  csvContent += `TOTAL ITEMS SOLD,${totalItems}\n\n`;

  // CASH DRAWER
  csvContent += "CASH DRAWER\n";
  csvContent += `Starting Cash,${formatNumber(startingCash)}\n`;
  csvContent += `Cash Sales,${formatNumber(cashToday)}\n`;
  csvContent += `Cash Refunds,${formatNumber(cashRefunds)}\n`;
  csvContent += `Paid In,${formatNumber(paidIn)}\n`;
  csvContent += `Paid Out,${formatNumber(paidOut)}\n`;
  const expectedCash = startingCash + cashToday - cashRefunds + paidIn - paidOut;
  csvContent += `Expected Cash,${formatNumber(expectedCash)}\n\n`;

  csvContent += "ALL TRANSACTIONS HISTORY\n";
  csvContent += `Date,Time,Items,Total (RM),Paid (RM),Change (RM),Payment,Staff,Remarks\n`;

  allSales.forEach((sale) => {
    const date = new Date(sale.date);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    
    // Build items list with quantities
    let itemsList = [];
    sale.items.forEach((item) => {
      const qty = item.quantity || 1;
      if (qty > 1) {
        itemsList.push(`${qty}x ${item.name}`);
      } else {
        itemsList.push(item.name);
      }
    });
    const itemsString = itemsList.join(" + ");
    
    csvContent += `${escapeCSV(dateStr)},`;
    csvContent += `${escapeCSV(timeStr)},`;
    csvContent += `${escapeCSV(itemsString)},`;
    csvContent += `${formatNumber(sale.total)},`;
    csvContent += `${formatNumber(sale.paid)},`;
    csvContent += `${formatNumber(sale.change)},`;
    csvContent += `${escapeCSV(sale.paymentMethod)},`;
    csvContent += `${escapeCSV(sale.staff)},`;
    csvContent += `${escapeCSV(sale.remarks)}\n`;
  });

  const filename = `churros_sales_${new Date().toISOString().split("T")[0]}.csv`;
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid && window.Android) {
    await showCustomAlert("Saving to Downloads folder...", "Download", "📥");
    Android.downloadCSV(csvContent, filename);
  } else {
    // For desktop Excel, use standard CSV with UTF-8 BOM
    const blob = new Blob(["\uFEFF" + csvContent], { 
      type: "text/csv;charset=utf-8", 
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

// ========== CALCULATOR FUNCTIONS ==========
function updateCalcDisplay() {
  document.getElementById("calc-result").textContent = calcInput;
  const hintEl = document.getElementById("calc-operator-hint");
  hintEl.textContent =
    calcOp && calcPrev !== null ? `${calcPrev} ${calcOp}` : "";
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
      cashAmount = parseFloat(calcInput);
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
    if (calcReset) {
      calcInput = val;
      calcReset = false;
    } else {
      if (val === ".") {
        if (calcInput.includes(".")) return;
        calcInput += ".";
      } else {
        calcInput = calcInput === "0" ? val : calcInput + val;
      }
    }
    cashAmount = parseFloat(calcInput);
    updatePaymentDisplay();
  }
  updateCalcDisplay();
}

// Quick cash buttons - SETS the cash amount (bukan ADD)
function setCashAmount(amount) {
  cashAmount = amount;
  calcInput = amount.toString();
  calcPrev = null;
  calcOp = null;
  calcReset = false;

  updateCalcDisplay();
  updatePaymentDisplay();

  const cashBtn = event?.target;
  if (cashBtn) {
    cashBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
      cashBtn.style.transform = "scale(1)";
    }, 100);
  }
}

async function addCalcToOrder() {
  if (currentOrder.length === 0) {
    await showCustomAlert("Add items to order first!", "No Items", "🛒");
    return;
  }
  updatePaymentDisplay();
  const calcAddBtn = document.getElementById("calc-add-to-cart");
  const originalText = calcAddBtn.textContent;
  calcAddBtn.textContent = "✓ Payment Set";
  setTimeout(() => {
    calcAddBtn.textContent = originalText;
  }, 1000);
}

function updatePaymentDisplay() {
  // Recalculate total from current order
  const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
  const paid = cashAmount || 0;
  const change = paid - total;

  const paidEl = document.getElementById("paid-amount");
  const changeEl = document.getElementById("change-amount");
  const changeRow = document.querySelector(".change-row");
  const changeLabel = changeRow?.querySelector("span:first-child");

  if (paidEl && changeEl && changeRow) {
    paidEl.textContent = `RM ${paid.toFixed(2)}`;
    
    if (change < 0) {
      // Still need to pay - show the remaining amount
      changeEl.textContent = `RM ${Math.abs(change).toFixed(2)}`;
      changeEl.style.color = "var(--danger)";
      changeRow.style.color = "var(--danger)";
      if (changeLabel) changeLabel.textContent = "Still Need:";
    } else {
      // Change to return
      changeEl.textContent = `RM ${change.toFixed(2)}`;
      changeEl.style.color = "var(--success)";
      changeRow.style.color = "var(--text-main)";
      if (changeLabel) changeLabel.textContent = "Change to Return:";
    }
  }
}

function showCustomAlert(message, title = "Alert", icon = "🔔") {
  return new Promise((resolve) => {
    const modal = document.getElementById("customAlertModal");
    if (!modal) {
      alert(message);
      resolve();
      return;
    }
    
    const titleEl = document.getElementById("alertTitle");
    const messageEl = document.getElementById("alertMessage");
    const iconEl = document.getElementById("alertIcon");

    if (titleEl) titleEl.textContent = title;
    if (iconEl) iconEl.textContent = icon;
    
    // Convert newlines to <br> tags for HTML display
    if (messageEl) {
      messageEl.innerHTML = message.replace(/\n/g, '<br>');
    }

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
      if (okBtn) okBtn.removeEventListener("click", handleOk);
      modal.removeEventListener("click", handleOutsideClick);
    };

    if (okBtn) okBtn.addEventListener("click", handleOk);
    modal.addEventListener("click", handleOutsideClick);
  });
}

function showCustomConfirm(message, title = "Confirm", icon = "❓") {
  return new Promise((resolve) => {
    const modal = document.getElementById("customConfirmModal");
    if (!modal) {
      resolve(confirm(message));
      return;
    }
    
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const iconEl = document.getElementById("confirmIcon");

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;

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
      if (okBtn) okBtn.removeEventListener("click", handleOk);
      if (cancelBtn) cancelBtn.removeEventListener("click", handleCancel);
      modal.removeEventListener("click", handleOutsideClick);
    };

    if (okBtn) okBtn.addEventListener("click", handleOk);
    if (cancelBtn) cancelBtn.addEventListener("click", handleCancel);
    modal.addEventListener("click", handleOutsideClick);
  });
}

window.alert = function (message) {
  return showCustomAlert(message);
};

window.confirm = function (message) {
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
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
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
  if (sheet) {
    if (pageId === "pos" || pageId === "calc") {
      sheet.style.display = "flex";
    } else {
      sheet.style.display = "none";
      if (cartOpen) toggleCart();
    }
  }
}

// ========== EASTER EGG ==========
function initEasterEgg() {
  const logoElement = document.getElementById("devEasterEgg");
  if (!logoElement) {
    setTimeout(initEasterEgg, 500);
    return;
  }

  let logoClickCount = 0;
  let logoClickTimer;

  logoElement.addEventListener("click", () => {
    logoClickCount++;
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => {
      logoClickCount = 0;
    }, 2000);

    if (logoClickCount === 3) {
      logoClickCount = 0;
      switchView("dev");
    }
  });
}
