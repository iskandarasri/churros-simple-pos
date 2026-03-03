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

  // Petty Cash event listeners
  document.querySelectorAll('.petty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const amount = parseFloat(e.target.dataset.petty);
      addPettyCash(amount);
    });
  });

  document.getElementById('pettyAddBtn')?.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('pettyAmount').value);
    if (!isNaN(amount)) {
      addPettyCash(amount);
      document.getElementById('pettyAmount').value = '';
    }
  });

  document.getElementById('pettyWithdrawBtn')?.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('pettyAmount').value);
    if (!isNaN(amount)) {
      withdrawPettyCash(amount);
      document.getElementById('pettyAmount').value = '';
    }
  });

  // Initialize petty cash display
  updatePettyCashDisplay();

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
    searchInput.addEventListener("input", function (e) {
      renderMenu();
    });
    searchInput.addEventListener("search", function (e) {
      renderMenu();
    });
  }

  // Clear Petty Cash button
  document.getElementById('pettyClearBtn')?.addEventListener('click', clearPettyCash);

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
    // SET value baru, bukan ADD
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

  // First, find Family Box
  const familyBoxIndex = currentOrder.findIndex(item => item.name === "Family Box");
  const familyBoxDips = [];
  const otherItems = [];

  // Separate items
  currentOrder.forEach((item, index) => {
    if (item.name === "Family Box") {
      // Handle separately
    } else if (item.isFamilyBoxDip || item.name === "+ Special Dip (FB)") {
      familyBoxDips.push({ ...item, originalIndex: index });
    } else {
      otherItems.push({ ...item, originalIndex: index });
    }
  });

  // Display Family Box if exists
  if (familyBoxIndex !== -1) {
    const boxItem = currentOrder[familyBoxIndex];
    const boxQuantity = boxItem.quantity || 1;
    
    // Calculate total dips quantity
    let totalDipQuantity = 0;
    familyBoxDips.forEach(dip => {
      totalDipQuantity += dip.quantity || 1;
    });
    
    const boxTotal = (35.0 * boxQuantity) + (totalDipQuantity * 1.0);
    total += boxTotal;
    itemCount += boxQuantity;

    const boxLi = document.createElement("li");
    boxLi.className = "order-item";
    
    let dipDisplay = '';
    if (totalDipQuantity > 0) {
      dipDisplay = ` (with ${totalDipQuantity} special dip${totalDipQuantity > 1 ? 's' : ''})`;
    }
    
    boxLi.innerHTML = `
      <div class="order-item-left">
        <span class="item-qty">${boxQuantity}x</span>
        <span class="item-name">Family Box${dipDisplay}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="item-price">RM ${boxTotal.toFixed(2)}</span>
        <button class="delete-item-btn" data-item-index="${familyBoxIndex}" data-item-type="family-box">✕</button>
      </div>
    `;
    listEl.appendChild(boxLi);

    // Display special dips with their own quantities
    familyBoxDips.forEach((dip, dipIdx) => {
      const dipQuantity = dip.quantity || 1;
      const dipLi = document.createElement("li");
      dipLi.className = "order-item";
      dipLi.style.paddingLeft = "30px";
      dipLi.style.fontSize = "0.85rem";
      dipLi.style.opacity = "0.8";
      dipLi.style.borderBottom = "none";
      dipLi.innerHTML = `
        <div class="order-item-left">
          <span class="item-qty">${dipQuantity}x</span>
          <span class="item-name">↳ + Special Dip (FB)</span>
        </div>
        <span class="item-price">RM ${(dipQuantity * 1.0).toFixed(2)}</span>
      `;
      listEl.appendChild(dipLi);
    });
  }

  // Display other items with quantities
  otherItems.forEach((item) => {
    const quantity = item.quantity || 1;
    const itemTotal = item.price;
    total += itemTotal;
    itemCount += quantity;
    
    const li = document.createElement("li");
    li.className = "order-item";
    li.innerHTML = `
      <div class="order-item-left">
        <span class="item-qty">${quantity}x</span>
        <span class="item-name">${item.name}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="item-price">RM ${itemTotal.toFixed(2)}</span>
        <button class="delete-item-btn" data-item-index="${item.originalIndex}" data-item-type="regular">✕</button>
      </div>
    `;
    listEl.appendChild(li);
  });

  // Delete button listeners
  document.querySelectorAll(".delete-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.itemIndex);
      const type = btn.dataset.itemType;
      
      if (type === "family-box") {
        // Remove the family box and all its dips
        const newOrder = [];
        for (let i = 0; i < currentOrder.length; i++) {
          if (i === index) continue; // Skip the box
          if (currentOrder[i].isFamilyBoxDip || currentOrder[i].name === "+ Special Dip (FB)") continue; // Skip dips
          newOrder.push(currentOrder[i]);
        }
        currentOrder = newOrder;
      } else {
        // Remove regular item
        currentOrder.splice(index, 1);
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

// ========== VOID LAST ITEM FUNCTION (TAMBAH INI) ==========
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
  }
  
  updateOrderList();
}

function deleteItemFromOrder(itemName, itemPrice) {
  const index = currentOrder.findIndex(
    (item) => item.name === itemName && item.price === itemPrice
  );

  if (index !== -1) {
    currentOrder.splice(index, 1);
    updateOrderList();
  }
}

// ========== PETTY CASH STATE ==========
let pettyCashBalance = 0;
let pettyCashHistory = [];

try {
  const savedBalance = localStorage.getItem("pettyCashBalance");
  if (savedBalance) pettyCashBalance = parseFloat(savedBalance);
  
  const savedHistory = localStorage.getItem("pettyCashHistory");
  if (savedHistory) pettyCashHistory = JSON.parse(savedHistory);
} catch (e) {
  console.log("No petty cash data");
}

// ========== PETTY CASH FUNCTIONS ==========
function updatePettyCashDisplay() {
  const balanceEl = document.getElementById("pettyCashBalance");
  if (balanceEl) {
    balanceEl.textContent = `RM ${pettyCashBalance.toFixed(2)}`;
  }
  
  localStorage.setItem("pettyCashBalance", pettyCashBalance.toString());
  localStorage.setItem("pettyCashHistory", JSON.stringify(pettyCashHistory));
  
  updatePettyCashHistory();
}

function updatePettyCashHistory() {
  const historyEl = document.getElementById("pettyHistoryList");
  if (!historyEl) return;
  
  if (pettyCashHistory.length === 0) {
    historyEl.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 10px;">No transactions yet</p>';
    return;
  }
  
  let html = '';
  [...pettyCashHistory].reverse().slice(0, 15).forEach(trans => {
    const typeClass = trans.type === 'add' ? 'add' : 'withdraw';
    const sign = trans.type === 'add' ? '+' : '-';
    let note = trans.note ? ` <span style="font-size:0.7rem; opacity:0.7;">(${trans.note})</span>` : '';
    html += `
      <div class="petty-history-item ${typeClass}">
        <span>${sign} RM ${trans.amount.toFixed(2)}${note}</span>
        <span class="date">${trans.date}</span>
      </div>
    `;
  });
  historyEl.innerHTML = html;
}

function addPettyCash(amount) {
  if (amount <= 0) {
    showCustomAlert("Please enter a valid amount", "Invalid Amount", "⚠️");
    return;
  }
  
  pettyCashBalance += amount;
  pettyCashHistory.push({
    type: 'add',
    amount: amount,
    date: new Date().toLocaleString()
  });
  
  updatePettyCashDisplay();
  showCustomAlert(`Added RM ${amount.toFixed(2)} to petty cash`, "Success", "💰");
}

function withdrawPettyCash(amount) {
  if (amount <= 0) {
    showCustomAlert("Please enter a valid amount", "Invalid Amount", "⚠️");
    return;
  }
  
  if (amount > pettyCashBalance) {
    showCustomAlert("Insufficient balance", "Error", "❌");
    return;
  }
  
  pettyCashBalance -= amount;
  pettyCashHistory.push({
    type: 'withdraw',
    amount: amount,
    date: new Date().toLocaleString()
  });
  
  updatePettyCashDisplay();
  showCustomAlert(`Withdrew RM ${amount.toFixed(2)} from petty cash`, "Success", "💰");
}

function clearPettyCash() {
  if (pettyCashBalance === 0) {
    showCustomAlert("Petty cash is already empty", "Info", "💰");
    return;
  }
  
  showCustomConfirm(
    `Are you sure you want to clear all petty cash (RM ${pettyCashBalance.toFixed(2)})?`,
    "Clear Petty Cash",
    "⚠️"
  ).then((confirmed) => {
    if (confirmed) {
      if (pettyCashBalance > 0) {
        pettyCashHistory.push({
          type: 'withdraw',
          amount: pettyCashBalance,
          date: new Date().toLocaleString(),
          note: 'Cleared all petty cash'
        });
      }
      
      pettyCashBalance = 0;
      localStorage.setItem("pettyCashBalance", "0");
      localStorage.setItem("pettyCashHistory", JSON.stringify(pettyCashHistory));
      
      updatePettyCashDisplay();
      showCustomAlert("Petty cash cleared successfully", "Success", "✅");
    }
  });
}

// ========== CORE POS LOGIC ==========
function addItem(name, price, itemData = {}) {
  // Check if this is Special Dip for Family Box (RM1)
  if (name === "+ Special Dip (FB)") {
    // Check if Family Box exists in order
    const hasFamilyBox = currentOrder.some(item => 
      item.name === "Family Box"
    );
    
    if (hasFamilyBox) {
      // Check if there's already a Special Dip (FB) item
      const existingDipIndex = currentOrder.findIndex(item => 
        item.name === "+ Special Dip (FB)" || item.isFamilyBoxDip
      );
      
      if (existingDipIndex !== -1) {
        // If exists, increase quantity
        if (!currentOrder[existingDipIndex].quantity) {
          currentOrder[existingDipIndex].quantity = 2;
        } else {
          currentOrder[existingDipIndex].quantity++;
        }
        // Update price (quantity * 1.0)
        currentOrder[existingDipIndex].price = currentOrder[existingDipIndex].quantity * 1.0;
      } else {
        // Add new with quantity 1
        currentOrder.push({
          name: "+ Special Dip (FB)",
          price: 1.0,
          quantity: 1,
          isFamilyBoxDip: true,
        });
      }
      
      showCustomAlert("Added Special Dip (RM1) to Family Box", "Success", "✅");
    } else {
      showCustomAlert("Please add Family Box first!", "Error", "❌");
      return;
    }
  }
  // Check if this is regular Special Dip (RM3)
  else if (name === "+ Special Dip") {
    // Check if there's already a regular Special Dip item
    const existingDipIndex = currentOrder.findIndex(item => 
      item.name === "+ Special Dip" && !item.isFamilyBoxDip
    );
    
    if (existingDipIndex !== -1) {
      // If exists, increase quantity
      if (!currentOrder[existingDipIndex].quantity) {
        currentOrder[existingDipIndex].quantity = 2;
      } else {
        currentOrder[existingDipIndex].quantity++;
      }
      // Update price (quantity * 3.0)
      currentOrder[existingDipIndex].price = currentOrder[existingDipIndex].quantity * 3.0;
    } else {
      // Add new with quantity 1
      currentOrder.push({
        name: "+ Special Dip",
        price: 3.0,
        quantity: 1,
      });
    }
  }
  // Regular items without quantity (or with quantity if needed)
  else {
    // Check if this item already exists (for items that should be grouped)
    const existingItemIndex = currentOrder.findIndex(item => 
      item.name === name && item.price === price && !item.isFamilyBoxDip
    );
    
    if (existingItemIndex !== -1 && name !== "Family Box" && name !== "Single Set") {
      // For items that can be grouped (like dips)
      if (!currentOrder[existingItemIndex].quantity) {
        currentOrder[existingItemIndex].quantity = 2;
      } else {
        currentOrder[existingItemIndex].quantity++;
      }
      currentOrder[existingItemIndex].price = currentOrder[existingItemIndex].quantity * price;
    } else {
      // Add as new item
      currentOrder.push({ 
        name, 
        price,
        quantity: 1,
      });
    }
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
    "🗑️"
  );
  
  if (confirmed) {
    currentOrder = [];
    cashAmount = null;  // Reset cashAmount
    calcInput = "0";
    calcPrev = null;
    calcOp = null;
    
    // Reset manual input
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

  // Reset everything
  currentOrder = [];
  cashAmount = null;  // Reset cashAmount
  calcInput = "0";
  calcPrev = null;
  calcOp = null;
  
  // Reset manual input field
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
  updatePaymentDisplay(); // Ini akan set paid-amount balik ke RM 0.00
  
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
        <span>${familyBoxQuantity}x Family Box ${familyBoxDipsQuantity > 0 ? `(+${familyBoxDipsQuantity} dip${familyBoxDipsQuantity > 1 ? 's' : ''})` : ''}</span>
        <span>RM ${(familyBoxTotal + familyBoxDipsTotal).toFixed(2)}</span>
      </div>
    `;
  }

  // Display other items with quantities
  sale.items.forEach((item) => {
    if (item.name !== "Family Box" && !item.isFamilyBoxDip && item.name !== "+ Special Dip (FB)") {
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
      if (item.name === "Single Set") totalSingles++;
      else if (item.name === "Family Box") totalFamilies++;
      else if (item.name === "Special Single Set") totalSpecialSingles++;
      else if (item.name === "+ Milk Choco Dip") totalMilkDips++;
      else if (item.name === "+ Dark Choco Dip") totalDarkDips++;
      else if (item.name === "+ Caramel Dip") totalCaramelDips++;
      else if (item.name === "+ Special Dip") totalSpecialDips++;
      else if (item.isFamilyBoxDip || item.name === "+ Special Dip (FB)") totalFamilyBoxDips++;
      else if (item.name === "Keychain") totalKeychains++;
    });
  });

  const totalChurros = totalSingles + totalFamilies + totalSpecialSingles;
  const totalDips = totalMilkDips + totalDarkDips + totalCaramelDips + totalSpecialDips + totalFamilyBoxDips;
  const totalItems = totalChurros + totalDips + totalKeychains;

  let csvContent = "MR. CHURROS DUNGUN POS - SALES REPORT\n";
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  csvContent += "=== TODAY'S SUMMARY ===\n";
  csvContent += `Date,${today}\n`;
  csvContent += `Total Sales,${todayCount}\n`;
  csvContent += `Total Revenue,RM ${todayTotal.toFixed(2)}\n`;
  csvContent += `Cash Payments,RM ${cashToday.toFixed(2)}\n`;
  csvContent += `QR Payments,RM ${qrToday.toFixed(2)}\n\n`;

  csvContent += "=== TODAY'S TRANSACTIONS ===\n";
  csvContent += "Time,Items,Total(RM),Paid(RM),Change(RM),Payment,Staff,Remarks\n";

  todaysSales.forEach((sale) => {
    const date = new Date(sale.date);
    const timeStr = date.toLocaleTimeString();
    let itemsList = sale.items.map((i) => i.name).join(" + ");

    csvContent += `"${timeStr}","${itemsList}",${sale.total.toFixed(2)},${sale.paid.toFixed(2)},${sale.change.toFixed(2)},"${sale.paymentMethod}","${sale.staff}","${sale.remarks}"\n`;
  });

  csvContent += "\n=== OVERALL SUMMARY ===\n";
  csvContent += `Total Transactions,${allSales.length}\n`;
  csvContent += `Total Revenue,RM ${grandTotal.toFixed(2)}\n`;
  csvContent += `Total Paid,RM ${totalPaid.toFixed(2)}\n`;
  csvContent += `Total Change Given,RM ${totalChange.toFixed(2)}\n\n`;

  csvContent += "=== PAYMENT METHOD BREAKDOWN ===\n";
  const totalCash = allSales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((sum, s) => sum + s.total, 0);
  const totalQR = allSales
    .filter((s) => s.paymentMethod === "QR")
    .reduce((sum, s) => sum + s.total, 0);
  csvContent += `Cash Payments,RM ${totalCash.toFixed(2)}\n`;
  csvContent += `QR Payments,RM ${totalQR.toFixed(2)}\n\n`;

  csvContent += "=== ITEM BREAKDOWN ===\n";
  csvContent += "CHURROS SETS\n";
  csvContent += `Single Set,${totalSingles}\n`;
  csvContent += `Family Box,${totalFamilies}\n`;
  csvContent += `Special Single Set,${totalSpecialSingles}\n`;
  csvContent += `Total Churros Sets,${totalChurros}\n\n`;

  csvContent += "DIPS (Add-ons)\n";
  csvContent += `Milk Choco Dip,${totalMilkDips}\n`;
  csvContent += `Dark Choco Dip,${totalDarkDips}\n`;
  csvContent += `Caramel Dip,${totalCaramelDips}\n`;
  csvContent += `Regular Special Dip (RM3),${totalSpecialDips}\n`;
  csvContent += `Family Box Special Dip (RM1),${totalFamilyBoxDips}\n`;
  csvContent += `Total Dips,${totalDips}\n\n`;

  csvContent += "MERCHANDISE\n";
  csvContent += `Keychain,${totalKeychains}\n\n`;

  csvContent += `TOTAL ITEMS SOLD,${totalItems}\n\n`;

  csvContent += "=== PETTY CASH ===\n";
  csvContent += `Current Balance,RM ${pettyCashBalance.toFixed(2)}\n`;
  csvContent += "Recent Transactions:\n";
  pettyCashHistory.slice(-5).reverse().forEach(trans => {
    csvContent += `${trans.date},${trans.type === 'add' ? '+' : '-'} RM ${trans.amount.toFixed(2)}\n`;
  });
  csvContent += "\n";

  csvContent += "=== ALL TRANSACTIONS HISTORY ===\n";
  csvContent += "Date,Time,Items,Total(RM),Paid(RM),Change(RM),Payment,Staff,Remarks\n";

  allSales.forEach((sale) => {
    const date = new Date(sale.date);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    let itemsList = sale.items.map((i) => i.name).join(" + ");

    csvContent += `"${dateStr}","${timeStr}","${itemsList}",${sale.total.toFixed(2)},${sale.paid.toFixed(2)},${sale.change.toFixed(2)},"${sale.paymentMethod}","${sale.staff}","${sale.remarks}"\n`;
  });

  const filename = `churros_sales_${new Date().toISOString().split("T")[0]}.csv`;
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid && window.Android) {
    await showCustomAlert("Saving to Downloads folder...", "Download", "📥");
    Android.downloadCSV(csvContent, filename);
  } else {
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

// ========== CALCULATOR FUNCTIONS ==========
function updateCalcDisplay() {
  document.getElementById("calc-result").textContent = calcInput;
  const hintEl = document.getElementById("calc-operator-hint");
  hintEl.textContent = calcOp && calcPrev !== null ? `${calcPrev} ${calcOp}` : "";
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
        case "+": result = calcPrev + current; break;
        case "-": result = calcPrev - current; break;
        case "*": result = calcPrev * current; break;
        case "/":
          if (current === 0) {
            await showCustomAlert("Cannot divide by zero", "Math Error", "➗");
            return;
          }
          result = calcPrev / current;
          break;
        default: return;
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
        case "+": result = calcPrev + current; break;
        case "-": result = calcPrev - current; break;
        case "*": result = calcPrev * current; break;
        case "/":
          if (current === 0) {
            await showCustomAlert("Cannot divide by zero", "Math Error", "➗");
            return;
          }
          result = calcPrev / current;
          break;
        default: return;
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
  // SET value baru, gantikan value lama
  cashAmount = amount;
  calcInput = amount.toString();
  calcPrev = null;
  calcOp = null;
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
  const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
  const paid = cashAmount || 0;  // Jika cashAmount null, guna 0
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
      changeRow.querySelector("span:first-child").textContent = "Change to Return:";
    }
  }
}

// ========== CUSTOM POPUP SYSTEM ==========
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
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));

  document.getElementById("page-" + pageId).classList.add("active");
  document.querySelector(`.nav-btn[data-page="${pageId}"]`).classList.add("active");

  const sheet = document.getElementById("cartSheet");
  if (pageId === "pos" || pageId === "calc") {
    sheet.style.display = "flex";
  } else {
    sheet.style.display = "none";
    if (cartOpen) toggleCart();
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
