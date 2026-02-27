(function () {
  // ========== STATE ==========
  let currentInput = "0";
  let previousOperand = null;
  let operator = null;
  let shouldResetScreen = false;

  let cashAmount = null;
  let currentOrder = [];
  let allSales = [];
  
  // ========== CUSTOM ITEMS STATE ==========
  let customItems = [];

  let currentStaff = "Cashier 1";
  let darkMode = localStorage.getItem("darkMode") === "true";

  // Load saved sales
  try {
    const saved = localStorage.getItem("churrosSales");
    if (saved) {
      allSales = JSON.parse(saved);
    }
  } catch (e) {
    console.log("No saved data");
  }

  // Load custom items from localStorage
  try {
    const savedItems = localStorage.getItem("customItems");
    if (savedItems) {
      customItems = JSON.parse(savedItems);
    }
  } catch (e) {
    console.log("No custom items saved");
  }

  // ========== DOM ELEMENTS ==========
  const resultEl = document.getElementById("result");
  const orderListEl = document.getElementById("order-list");
  const orderTotalEl = document.getElementById("order-total-amount");
  const paidAmountEl = document.getElementById("paid-amount");
  const changeAmountEl = document.getElementById("change-amount");
  const todayTotalEl = document.getElementById("today-total");
  const totalSalesEl = document.getElementById("total-sales");
  const totalItemsEl = document.getElementById("total-items");
  const saleRemarks = document.getElementById("saleRemarks");
  const currentStaffEl = document.getElementById("currentStaff");
  const staffNameInput = document.getElementById("staffName");
  
  // ========== DOM ELEMENTS for Custom Items ==========
  const newItemName = document.getElementById("newItemName");
  const newItemPrice = document.getElementById("newItemPrice");
  const addNewItemBtn = document.getElementById("addNewItemBtn");
  const customItemsList = document.getElementById("customItemsList");

  // ========== DARK MODE ==========
  function applyDarkMode() {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      document.getElementById("darkModeToggle").textContent = "☀️ Light Mode";
    } else {
      document.body.classList.remove("dark-mode");
      document.getElementById("darkModeToggle").textContent = "🌙 Dark Mode";
    }
    localStorage.setItem("darkMode", darkMode);
  }

  document.getElementById("darkModeToggle").addEventListener("click", () => {
    darkMode = !darkMode;
    applyDarkMode();
  });

  applyDarkMode();

  // ========== STAFF LOGIN ==========
  document.getElementById("staffLogin").addEventListener("click", () => {
    const name = staffNameInput.value.trim();
    if (name) {
      currentStaff = name;
      currentStaffEl.textContent = `👤 Current: ${currentStaff}`;
    }
  });

  // ========== DISPLAY FUNCTIONS ==========
  function updateDisplay() {
    resultEl.innerText = currentInput;
  }

  function updatePaymentDisplay() {
    const total = parseFloat(orderTotalEl.textContent.replace("RM ", "")) || 0;
    const paid = cashAmount || 0;
    const change = paid - total;

    paidAmountEl.textContent = `RM ${paid.toFixed(2)}`;
    changeAmountEl.textContent = `RM ${Math.max(0, change).toFixed(2)}`;

    if (change < 0) {
      changeAmountEl.style.color = "#e1100b";
    } else {
      changeAmountEl.style.color = "#821e0e";
    }
  }

  function updateOrderDisplay() {
    if (currentOrder.length === 0) {
      orderListEl.innerHTML =
        '<div style="text-align:center; padding:10px; color:#666;">No items in order</div>';
      orderTotalEl.textContent = "RM 0.00";
    } else {
      let html = "";
      let total = 0;

      const grouped = {};
      currentOrder.forEach((item) => {
        const key = `${item.name}_${item.price}`;
        if (!grouped[key]) {
          grouped[key] = { ...item, qty: 1 };
        } else {
          grouped[key].qty++;
        }
      });

      Object.values(grouped).forEach((item) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += `<div class="order-item">
                    <span><strong>${item.qty}x</strong> ${item.name}</span>
                    <span>RM ${itemTotal.toFixed(2)}</span>
                </div>`;
      });

      orderListEl.innerHTML = html;
      orderTotalEl.textContent = `RM ${total.toFixed(2)}`;
    }
    updatePaymentDisplay();
  }

  function updateDashboard() {
    const today = new Date().toDateString();
    let todayTotal = 0;
    let totalItems = 0;

    allSales.forEach((sale) => {
      if (new Date(sale.date).toDateString() === today) {
        todayTotal += sale.total;
      }
      totalItems += sale.items ? sale.items.length : 0;
    });

    todayTotalEl.textContent = `RM${todayTotal.toFixed(2)}`;
    totalSalesEl.textContent = allSales.length;
    totalItemsEl.textContent = totalItems;
  }

  // ========== CALCULATOR FUNCTIONS ==========
  function appendNumber(num) {
    if (shouldResetScreen) {
      currentInput = "";
      shouldResetScreen = false;
    }

    if (num === "." && currentInput.includes(".")) return;

    if (currentInput === "0" && num !== ".") {
      currentInput = num;
    } else {
      currentInput += num;
    }

    cashAmount = parseFloat(currentInput) || 0;
    updateDisplay();
    updatePaymentDisplay();
  }

  function setCashAmount(amount) {
    cashAmount = amount;
    currentInput = amount.toString();
    shouldResetScreen = false;

    updateDisplay();
    updatePaymentDisplay();
  }

  function chooseOperation(op) {
    const currentValue = parseFloat(currentInput);
    if (isNaN(currentValue)) return;

    if (previousOperand === null) {
      previousOperand = currentValue;
    } else if (operator) {
      calculate();
    }

    operator = op;
    shouldResetScreen = true;
  }

  function calculate() {
    if (previousOperand === null || operator === null) return;

    const currentValue = parseFloat(currentInput);
    if (isNaN(currentValue)) return;

    let result;
    switch (operator) {
      case "+":
        result = previousOperand + currentValue;
        break;
      case "-":
        result = previousOperand - currentValue;
        break;
      case "*":
        result = previousOperand * currentValue;
        break;
      case "/":
        if (currentValue === 0) {
          alert("Cannot divide by zero");
          return;
        }
        result = previousOperand / currentValue;
        break;
      default:
        return;
    }

    currentInput = result.toString();
    cashAmount = parseFloat(currentInput);
    previousOperand = null;
    operator = null;
    shouldResetScreen = true;
    updateDisplay();
    updatePaymentDisplay();
  }

  function clearCalculator() {
    currentInput = "0";
    previousOperand = null;
    operator = null;
    shouldResetScreen = false;
    cashAmount = null;
    updateDisplay();
    updatePaymentDisplay();
  }

  // ========== ORDER FUNCTIONS ==========
  function addToOrder(name, price) {
    currentOrder.push({ name, price, timestamp: new Date() });
    updateOrderDisplay();
  }

  function voidLastItem() {
    if (currentOrder.length > 0) {
      currentOrder.pop();
      updateOrderDisplay();
    }
  }

  function clearOrder() {
    if (confirm("Clear current order?")) {
      currentOrder = [];
      cashAmount = null;
      clearCalculator();
      updateOrderDisplay();
    }
  }

  // ========== CUSTOM ITEMS FUNCTIONS ==========
  function renderCustomItems() {
    if (!customItemsList) return;
    
    if (customItems.length === 0) {
      customItemsList.innerHTML = '<div style="color: #666; padding: 10px; text-align: center;">No custom items yet. Add one above!</div>';
      return;
    }
    
    let html = "";
    customItems.forEach((item, index) => {
      html += `
        <div class="custom-item-tag" data-item-index="${index}">
          <span>${item.name} (RM${item.price.toFixed(2)})</span>
          <button class="delete-item" data-delete-index="${index}">✕</button>
        </div>
      `;
    });
    
    customItemsList.innerHTML = html;
    
    // Add click events to custom item tags
    document.querySelectorAll('.custom-item-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        // Don't trigger if clicking delete button
        if (e.target.classList.contains('delete-item')) return;
        
        const index = tag.dataset.itemIndex;
        if (index !== undefined) {
          const item = customItems[index];
          addToOrder(item.name, item.price);
        }
      });
    });
    
    // Add click events to delete buttons
    document.querySelectorAll('.delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = btn.dataset.deleteIndex;
        if (index !== undefined) {
          deleteCustomItem(index);
        }
      });
    });
  }

  function addNewCustomItem() {
    const name = newItemName.value.trim();
    const price = parseFloat(newItemPrice.value);
    
    if (!name) {
      alert("Please enter an item name");
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price");
      return;
    }
    
    customItems.push({
      name: name,
      price: price,
      id: Date.now() + Math.random()
    });
    
    // Save to localStorage
    localStorage.setItem("customItems", JSON.stringify(customItems));
    
    // Clear inputs
    newItemName.value = "";
    newItemPrice.value = "";
    
    // Refresh display
    renderCustomItems();
  }

  function deleteCustomItem(index) {
    if (confirm("Delete this item?")) {
      customItems.splice(index, 1);
      localStorage.setItem("customItems", JSON.stringify(customItems));
      renderCustomItems();
    }
  }

  // ========== RECEIPT FUNCTION ==========
  function showReceipt(sale) {
    const modal = document.getElementById("receiptModal");
    document.getElementById("receiptDateTime").textContent =
      new Date().toLocaleString();
    document.getElementById("receiptStaff").textContent =
      `Staff: ${sale.staff || currentStaff}`;

    let itemsHtml = "";
    let total = 0;
    sale.items.forEach((item) => {
      itemsHtml += `<div class="receipt-item">
            <span>${item.name}</span>
            <span>RM ${item.price.toFixed(2)}</span>
          </div>`;
      total += item.price;
    });

    document.getElementById("receiptItems").innerHTML = itemsHtml;
    document.getElementById("receiptTotal").innerHTML =
      `Total: RM ${total.toFixed(2)}`;
    document.getElementById("receiptPaid").textContent =
      `RM ${(sale.paid || 0).toFixed(2)}`;
    document.getElementById("receiptChange").textContent =
      `RM ${Math.max(0, (sale.paid || 0) - total).toFixed(2)}`;
    document.getElementById("receiptRemarks").textContent =
      sale.remarks || "No remarks";

    modal.style.display = "flex";
  }

  // ========== DAILY REPORT ==========
  function showDailyReport() {
    const modal = document.getElementById("reportModal");
    const today = new Date().toDateString();
    const todaySales = allSales.filter(
      (s) => new Date(s.date).toDateString() === today
    );

    let totalRevenue = 0;
    let totalItems = 0;
    let singles = 0;
    let families = 0;

    todaySales.forEach((sale) => {
      totalRevenue += sale.total;
      totalItems += sale.items.length;
      sale.items.forEach((item) => {
        if (item.name.includes("Single")) singles++;
        if (item.name.includes("Family")) families++;
      });
    });

    document.getElementById("reportDate").innerHTML = `<strong>${today}</strong>`;
    document.getElementById("reportStats").innerHTML = `
      <div>Total Sales: ${todaySales.length}</div>
      <div>Total Revenue: RM ${totalRevenue.toFixed(2)}</div>
      <div>Total Items: ${totalItems}</div>
      <div>Singles Sold: ${singles}</div>
      <div>Families Sold: ${families}</div>
      <div>Average Order: RM ${
        todaySales.length ? (totalRevenue / todaySales.length).toFixed(2) : 0
      }</div>
    `;

    let salesList = '<h3 style="margin-top:20px;">Transactions:</h3>';
    todaySales.forEach((sale, i) => {
      salesList += `<div style="border-top:1px solid #ccc; padding:10px;">
        <div>${new Date(sale.date).toLocaleTimeString()}</div>
        <div>Items: ${sale.items.length} | Total: RM ${sale.total.toFixed(2)}</div>
        <div style="font-size:0.9rem; color:#666;">${sale.remarks || "No remarks"}</div>
      </div>`;
    });

    document.getElementById("reportSalesList").innerHTML = salesList;
    modal.style.display = "flex";
  }

  // ========== SALE FUNCTIONS ==========
  function saveSale() {
    if (currentOrder.length === 0) {
      alert("No items in order!");
      return;
    }

    const total = parseFloat(orderTotalEl.textContent.replace("RM ", ""));
    const now = new Date();
    const saleRecord = {
      id: Date.now(),
      date: now.toISOString(),
      datetime: now.toLocaleString("en-MY"),
      items: [...currentOrder],
      total: total,
      paid: cashAmount || 0,
      change: Math.max(0, (cashAmount || 0) - total),
      staff: currentStaff,
      remarks: saleRemarks.value || "No remarks",
    };

    allSales.push(saleRecord);
    localStorage.setItem("churrosSales", JSON.stringify(allSales));

    // Show receipt
    showReceipt(saleRecord);

    // Clear everything
    currentOrder = [];
    cashAmount = null;
    saleRemarks.value = "";
    clearCalculator();
    updateOrderDisplay();
    updateDashboard();
  }

  // ========== EXPORT FUNCTION ==========
  function exportToExcel() {
    if (allSales.length === 0) {
      alert("No sales data to export");
      return;
    }

    let csv =
      "Date,Time,Staff,Items,Total (RM),Paid (RM),Change (RM),Remarks\n";
    let grandTotal = 0;

    allSales.forEach((sale) => {
      const date = new Date(sale.date);
      const dateStr = date.toLocaleDateString("en-MY");
      const timeStr = date.toLocaleTimeString("en-MY");
      let itemsList = sale.items.map((i) => i.name).join(" + ");

      csv += `"${dateStr}","${timeStr}","${sale.staff || "Unknown"}","${itemsList}",${sale.total.toFixed(2)},${sale.paid.toFixed(2)},${sale.change.toFixed(2)},"${sale.remarks || ""}"\n`;
      grandTotal += sale.total;
    });

    csv += `\n"GRAND TOTAL","","","",${grandTotal.toFixed(2)},,,`;

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const filename = `churros_sales_${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}.csv`;

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function resetAllData() {
    if (confirm("⚠️ Reset ALL sales data? This cannot be undone!")) {
      allSales = [];
      localStorage.removeItem("churrosSales");
      currentOrder = [];
      cashAmount = null;
      clearCalculator();
      updateOrderDisplay();
      updateDashboard();
      alert("All data cleared");
    }
  }

  // ========== EVENT LISTENERS ==========
  // Number buttons - for MANUAL ENTRY of any amount
  document.querySelectorAll("[data-num]").forEach((btn) => {
    btn.addEventListener("click", () => appendNumber(btn.dataset.num));
  });

  // Operator buttons (for calculations)
  document.querySelectorAll("[data-op]").forEach((btn) => {
    btn.addEventListener("click", () => chooseOperation(btn.dataset.op));
  });

  // Equals button
  document.getElementById("equals-btn").addEventListener("click", calculate);

  // Clear button
  document.getElementById("clear-btn").addEventListener("click", clearCalculator);

  // Cash note buttons - QUICK BUTTONS for common amounts
  document.getElementById("note-10").addEventListener("click", () => setCashAmount(10));
  document.getElementById("note-20").addEventListener("click", () => setCashAmount(20));
  document.getElementById("note-50").addEventListener("click", () => setCashAmount(50));
  document.getElementById("note-100").addEventListener("click", () => setCashAmount(100));

  // Meal buttons - choose items
  document.getElementById("meal-single").addEventListener("click", () => addToOrder("Single Set", 7));
  document.getElementById("meal-family").addEventListener("click", () => addToOrder("Family Box", 35));

  // ========== CUSTOM ITEMS EVENT LISTENERS ==========
  if (addNewItemBtn) {
    addNewItemBtn.addEventListener("click", addNewCustomItem);
  }
  
  // Allow Enter key in price input
  if (newItemPrice) {
    newItemPrice.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addNewCustomItem();
      }
    });
  }
  
  // Allow Enter key in name input
  if (newItemName) {
    newItemName.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        newItemPrice.focus();
      }
    });
  }

  // Void last item
  document.getElementById("void-last").addEventListener("click", voidLastItem);

  // Clear order
  document.getElementById("clear-order").addEventListener("click", clearOrder);
  document.getElementById("reset-btn").addEventListener("click", resetAllData);

  // Save and export
  document.getElementById("save-sale").addEventListener("click", saveSale);
  document.getElementById("export-btn").addEventListener("click", exportToExcel);

  // Daily Report
  document.getElementById("daily-report").addEventListener("click", showDailyReport);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    const receiptModal = document.getElementById("receiptModal");
    const reportModal = document.getElementById("reportModal");
    
    if (e.target === receiptModal) {
      receiptModal.style.display = "none";
    }
    if (e.target === reportModal) {
      reportModal.style.display = "none";
    }
  });

  // ========== INITIALIZE ==========
  updateDisplay();
  updateOrderDisplay();
  updateDashboard();
  renderCustomItems(); // Initialize custom items display
})();