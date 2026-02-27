// ========== STATE ==========
let currentOrder = [];
let allSales = [];
let darkMode = localStorage.getItem("darkMode") === "true";
let cartOpen = false;
let customInputVal = "0";
let currentStaff = "Cashier 1";
let currentCategory = "all";

// Calculator state
let calcInput = "0";
let calcPrev = null;
let calcOp = null;
let calcReset = false;

// Menu Items
// Menu Items with custom images
const menuItems = [
  {
    id: 1,
    name: "Single Set",
    price: 7.0,
    image: "single.png", // Your image file name
    color: "#FEF3C7",
    category: "churros",
  },
  {
    id: 2,
    name: "Family Box",
    price: 35.0,
    image: "family.png", // Your image file name
    color: "#FDE68A",
    category: "churros",
  },
  {
    id: 3,
    name: "Seasonal Set",
    price: 8.0,
    image: "seasonal.png", // Your image file name
    color: "#FBCFE8",
    category: "churros",
  },
  {
    id: 4,
    name: "Keychain",
    price: 5.0,
    image: "keychain.png", // Your image file name
    color: "#E5E7EB",
    category: "merch",
  },
  {
    id: 5,
    name: "Choco Dip",
    price: 2.0,
    image: "choco-dip.png", // Your image file name
    color: "#D1D5DB",
    category: "dips",
  },
  {
    id: 6,
    name: "Caramel Dip",
    price: 2.0,
    image: "caramel-dip.png", // Your image file name
    color: "#FEF3C7",
    category: "dips",
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

  document.getElementById("staffName").addEventListener("input", (e) => {
    currentStaff = e.target.value || "Cashier 1";
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
};

// ========== UI RENDERERS ==========
function renderMenu() {
  const grid = document.getElementById("menuGrid");
  grid.innerHTML = "";
  
  const filtered = currentCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.category === currentCategory);
  
  filtered.forEach(item => {
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

  // Custom Item Card (only show in "all" or "churros" category)
  if (currentCategory === "all" || currentCategory === "churros") {
    const customCard = document.createElement("div");
    customCard.className = "product-card custom-item-card";
    customCard.onclick = () => openModal('customItemModal');
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

  listEl.innerHTML = "";
  let total = 0;

  if (currentOrder.length === 0) {
    listEl.innerHTML = `<li style="text-align:center; color: var(--text-muted); margin-top: 20px; font-size: 0.9rem;">Cart is empty</li>`;
  } else {
    currentOrder.forEach((item) => {
      total += item.price;
      const li = document.createElement("li");
      li.className = "order-item";
      li.innerHTML = `
        <div style="display: flex; align-items: center;">
          <span class="item-qty">1x</span>
          <span class="item-name">${item.name}</span>
        </div>
        <span class="item-price">RM ${item.price.toFixed(2)}</span>
      `;
      listEl.appendChild(li);
    });
  }

  const formattedTotal = `RM ${total.toFixed(2)}`;
  totalEl.textContent = formattedTotal;
  sheetTotalEl.textContent = formattedTotal;
  countEl.textContent = `${currentOrder.length} Items`;

  if (currentOrder.length > 0 && !cartOpen) {
    const header = document.getElementById("cartHeaderToggle");
    header.style.background = "var(--primary)";
    header.style.color = "#fff";
    setTimeout(() => {
      header.style.background = "";
      header.style.color = "";
    }, 300);
  } else if (currentOrder.length === 0 && cartOpen) {
    toggleCart();
  }
}

// ========== CALCULATOR FUNCTIONS ==========
function updateCalcDisplay() {
  document.getElementById("calc-result").textContent = calcInput;
}

function handleCalcInput(val) {
  if (val === "C") {
    calcInput = "0";
    calcPrev = null;
    calcOp = null;
    calcReset = false;
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
          result = current === 0 ? 0 : calcPrev / current;
          break;
        default:
          return;
      }
      calcInput = result.toString();
      calcPrev = null;
      calcOp = null;
      calcReset = true;
    }
  } else if (["+", "-", "*", "/"].includes(val)) {
    if (calcPrev === null) {
      calcPrev = parseFloat(calcInput);
      calcOp = val;
      calcReset = true;
    } else if (calcOp !== null) {
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
          result = current === 0 ? 0 : calcPrev / current;
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
      if (val === "." && calcInput.includes(".")) return;
      calcInput = calcInput === "0" && val !== "." ? val : calcInput + val;
    }
  }
  updateCalcDisplay();
}

function addCalcToOrder() {
  const val = parseFloat(calcInput);
  if (!isNaN(val) && val > 0) {
    addItem("Calc: RM" + val.toFixed(2), val);
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

function clearOrder() {
  if (confirm("Clear current order?")) {
    currentOrder = [];
    updateOrderList();
  }
}

function saveSale() {
  if (currentOrder.length === 0) {
    alert("Order is empty!");
    return;
  }

  const total = currentOrder.reduce((sum, item) => sum + item.price, 0);
  const staff = document.getElementById("staffName").value || "Staff";

  const newSale = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    staff: staff,
    items: [...currentOrder],
    total: total,
    paid: total,
    change: 0,
    remarks: "",
  };

  allSales.push(newSale);
  localStorage.setItem("churrosSales", JSON.stringify(allSales));

  generateReceipt(newSale);

  currentOrder = [];
  updateOrderList();
  updateReports();
  if (cartOpen) toggleCart();
}

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

// ========== RECEIPTS & REPORTS ==========
function generateReceipt(sale) {
  document.getElementById("receiptDateTime").textContent = sale.date;
  document.getElementById("receiptStaff").textContent =
    "Served by: " + sale.staff;

  const itemsContainer = document.getElementById("receiptItems");
  itemsContainer.innerHTML = "";

  sale.items.forEach((item) => {
    itemsContainer.innerHTML += `
      <div class="receipt-item">
        <span>1x ${item.name}</span>
        <span>${item.price.toFixed(2)}</span>
      </div>
    `;
  });

  document.getElementById("receiptTotal").textContent =
    "RM " + sale.total.toFixed(2);
  openModal("receiptModal");
}

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

function exportToExcel() {
  if (allSales.length === 0) {
    alert("No data to export");
    return;
  }

  let csvContent = "Date,Staff,Items,Total(RM)\n";

  allSales.forEach((sale) => {
    let itemsStr = sale.items.map((i) => i.name).join(" + ");
    let row = `"${sale.date}","${sale.staff}","${itemsStr}",${sale.total.toFixed(2)}`;
    csvContent += row + "\n";
  });

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `churros_sales_${new Date().toISOString().split("T")[0]}.csv`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
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

// ========== EVENT LISTENERS ==========
document
  .getElementById("cartHeaderToggle")
  .addEventListener("click", toggleCart);

document.getElementById("darkModeToggle").addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("darkMode", darkMode);
  document.body.classList.toggle("dark-mode", darkMode);
});

document.getElementById("void-last").addEventListener("click", voidLastItem);
document.getElementById("clear-order").addEventListener("click", clearOrder);
document.getElementById("save-sale").addEventListener("click", saveSale);
document.getElementById("export-btn").addEventListener("click", exportToExcel);

document.getElementById("reset-btn").addEventListener("click", () => {
  if (
    confirm(
      "Are you sure you want to delete all sales data? This cannot be undone.",
    )
  ) {
    allSales = [];
    localStorage.removeItem("churrosSales");
    updateReports();
    alert("Data reset successful.");
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
  updateCalcDisplay();
});

// Navigation
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pageId = btn.dataset.page;
    switchView(pageId);
  });
});

// Expose functions globally
window.openModal = openModal;
window.closeModal = closeModal;
window.calcType = calcType;
window.addCustomItem = addCustomItem;
