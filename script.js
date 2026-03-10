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

// ========== PRODUCTION SUMMARY STATE ==========
let totalKgSold = 0;
let unsoldDefect = 0;
let productionData = [];

// ========== CASH DRAWER STATE ==========
let startingCash = 200.00; // Default starting cash RM200

// ========== DAILY UPDATE STATE ==========
let dailyUpdates = [];

// ========== CONSISTENT DATE FORMATTING ==========
function getCurrentFormattedDate() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

function parseDateFromString(dateString) {
  // Default to current date
  const now = new Date();
  let day = now.getDate();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  try {
    if (dateString) {
      // Split date and time
      const parts = dateString.split(', ');
      if (parts.length >= 1) {
        // Parse date part (dd/mm/yyyy)
        const dateParts = parts[0].split('/');
        if (dateParts.length === 3) {
          day = parseInt(dateParts[0], 10);
          month = parseInt(dateParts[1], 10);
          year = parseInt(dateParts[2], 10);
        }
      }
      
      if (parts.length >= 2) {
        // Parse time part (hh:mm:ss)
        const timeParts = parts[1].split(':');
        if (timeParts.length >= 1) hours = parseInt(timeParts[0], 10);
        if (timeParts.length >= 2) minutes = parseInt(timeParts[1], 10);
        if (timeParts.length >= 3) seconds = parseInt(timeParts[2], 10);
      }
    }
  } catch (e) {
    console.log("Error parsing date:", e);
  }
  
  return { day, month, year, hours, minutes, seconds };
}

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
  console.log("Loading stored data...");
  try {
    // Load sales
    const saved = localStorage.getItem("churrosSales");
    if (saved) {
      allSales = JSON.parse(saved);
      console.log("Loaded", allSales.length, "sales");
    } else {
      console.log("No sales found");
      allSales = [];
    }
    
    // Load cash drawer
    const savedStartingCash = localStorage.getItem("startingCash");
    if (savedStartingCash) startingCash = parseFloat(savedStartingCash);
    
  } catch (e) {
    console.log("Error loading stored data:", e);
    allSales = [];
  }
  return allSales;
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
  loadDailyUpdates();
  loadProductionData();

  document.getElementById("staffName").addEventListener("input", (e) => {
    currentStaff = e.target.value || "Staff 1";
  });

  // Add auto-save listeners for production inputs
  const kgInput = document.getElementById("totalKgSold");
  const defectInput = document.getElementById("unsoldDefect");

  if (kgInput) {
    kgInput.addEventListener("input", debouncedAutoSave);
  }

  if (defectInput) {
    defectInput.addEventListener("input", debouncedAutoSave);
  }

  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pageId = btn.dataset.page;
      switchView(pageId);
      
      // Refresh data when switching to specific pages
      if (pageId === 'reports') {
        setTimeout(() => {
          loadStoredData();
          updateReports();
        }, 50);
      }
      
      if (pageId === 'daily') {
        setTimeout(() => {
          loadDailyUpdates();
          updateDailyUpdatesList();
        }, 50);
      }
    });
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

  // Settings page functionality
  const settingsDarkModeToggle = document.getElementById("settingsDarkModeToggle");
  if (settingsDarkModeToggle) {
    settingsDarkModeToggle.checked = darkMode;
    settingsDarkModeToggle.addEventListener("change", (e) => {
      darkMode = e.target.checked;
      localStorage.setItem("darkMode", darkMode);
      document.body.classList.toggle("dark-mode", darkMode);
    });
  }

  // Tablet/Laptop layout toggle
  const tabletLayoutToggle = document.getElementById("tabletLayoutToggle");
  if (tabletLayoutToggle) {
    // Load saved preference
    const tabletMode = localStorage.getItem("tabletMode") === "true";
    tabletLayoutToggle.checked = tabletMode;
    if (tabletMode) document.body.classList.add("tablet-layout");
    
    tabletLayoutToggle.addEventListener("change", (e) => {
      const isTablet = e.target.checked;
      localStorage.setItem("tabletMode", isTablet);
      document.body.classList.toggle("tablet-layout", isTablet);
    });
  }

  // Add daily update event listeners
  document.getElementById("save-daily-update")?.addEventListener("click", saveDailyUpdate);
  document.getElementById("clear-daily")?.addEventListener("click", clearDailyForm);
  
  // Update daily list when switching to daily page
  updateDailyUpdatesList();

  // Developer info link
  document.getElementById("settingsDevInfo")?.addEventListener("click", () => {
    switchView("dev");
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

  // Dark mode toggle (header)
  document.getElementById("darkModeToggle").addEventListener("click", () => {
  darkMode = !darkMode;
  localStorage.setItem("darkMode", darkMode);
  document.body.classList.toggle("dark-mode", darkMode);
  
  // Sync settings toggle if exists
  if (settingsDarkModeToggle) {
    settingsDarkModeToggle.checked = darkMode;
  }
});

  // Cash Drawer event listeners
  document.getElementById("updateFloatBtn")?.addEventListener("click", updateStartingCash);
  document.getElementById("startingCashInput")?.addEventListener("change", updateStartingCash);
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
      dailyUpdates = [];
      productionData = [];
      localStorage.removeItem("churrosSales");
      localStorage.removeItem("dailyUpdates");
      localStorage.removeItem("productionData");
      updateReports();
      updateDailyUpdatesList();
      
      // Reset production input fields
      const kgInput = document.getElementById("totalKgSold");
      const defectInput = document.getElementById("unsoldDefect");
      if (kgInput) kgInput.value = "0";
      if (defectInput) defectInput.value = "0";
      totalKgSold = 0;
      unsoldDefect = 0;
      
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

// ========== EXPORT TO CSV WITH PROPER GROUPING ==========
async function exportToExcel() {
  if (allSales.length === 0 && dailyUpdates.length === 0) {
    await showCustomAlert("No data to export", "Export Error", "📊");
    return;
  }

  // Format today's date as dd/mm/yyyy for filtering
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayYear = today.getFullYear();
  const todayFormatted = `${todayDay}/${todayMonth}/${todayYear}`;

  // Filter today's sales using the formatted date
  const todaysSales = allSales.filter((sale) => {
    const { day, month, year } = parseDateFromString(sale.date);
    const saleDateFormatted = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    return saleDateFormatted === todayFormatted;
  });
  
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

  // Count items by category (with grouping)
  let totalSingles = 0, totalFamilies = 0, totalSpecialSingles = 0;
  let totalMilkDips = 0, totalDarkDips = 0, totalCaramelDips = 0, totalSpecialDips = 0, totalFamilyBoxDips = 0;
  let totalKeychains = 0;

  allSales.forEach((sale) => {
    // Group items within each sale
    const saleGroups = {};
    
    sale.items.forEach((item) => {
      const itemName = item.name;
      
      if (!saleGroups[itemName]) {
        saleGroups[itemName] = {
          name: itemName,
          count: 1,
          isFamilyBoxDip: item.isFamilyBoxDip || false
        };
      } else {
        saleGroups[itemName].count += 1;
      }
    });

    // Count the grouped items
    Object.values(saleGroups).forEach(item => {
      if (item.name === "Single Set") totalSingles += item.count;
      else if (item.name === "Family Box") totalFamilies += item.count;
      else if (item.name === "Special Single Set") totalSpecialSingles += item.count;
      else if (item.name === "+ Milk Choco Dip") totalMilkDips += item.count;
      else if (item.name === "+ Dark Choco Dip") totalDarkDips += item.count;
      else if (item.name === "+ Caramel Dip") totalCaramelDips += item.count;
      else if (item.name === "+ Special Dip") totalSpecialDips += item.count;
      else if (item.isFamilyBoxDip || item.name === "+ Special Dip (FB)") totalFamilyBoxDips += item.count;
      else if (item.name === "Keychain") totalKeychains += item.count;
    });
  });

  const totalChurros = totalSingles + totalFamilies + totalSpecialSingles;
  const totalDips = totalMilkDips + totalDarkDips + totalCaramelDips + totalSpecialDips + totalFamilyBoxDips;
  const totalItems = totalChurros + totalDips + totalKeychains;

  // Use comma delimiter for Excel (standard CSV)
  const delimiter = ",";
  
  // Helper function to escape CSV fields for Excel
  const escapeCSV = (str) => {
    if (str === null || str === undefined) return "";
    let cleaned = str.toString();
    if (cleaned.startsWith('=') || cleaned.startsWith('+') || 
        cleaned.startsWith('-') || cleaned.startsWith('@')) {
      cleaned = "'" + cleaned;
    }
    if (cleaned.includes(delimiter) || cleaned.includes('"') || cleaned.includes('\n')) {
      return '"' + cleaned.replace(/"/g, '""') + '"';
    }
    return cleaned;
  };

  const formatNumber = (num) => num.toFixed(2);

  let csvContent = "";

  // HEADER
  csvContent += "MR CHURROS DUNGUN POS - SALES REPORT\n";
  
  const genDay = String(today.getDate()).padStart(2, '0');
  const genMonth = String(today.getMonth() + 1).padStart(2, '0');
  const genYear = today.getFullYear();
  const genHours = String(today.getHours()).padStart(2, '0');
  const genMinutes = String(today.getMinutes()).padStart(2, '0');
  const genSeconds = String(today.getSeconds()).padStart(2, '0');
  const generatedDateTime = `${genDay}/${genMonth}/${genYear} ${genHours}:${genMinutes}:${genSeconds}`;
  
  csvContent += `Generated,${escapeCSV(generatedDateTime)}\n\n`;

  // TODAY'S SUMMARY
  csvContent += "TODAY'S SUMMARY\n";
  csvContent += `Date,${escapeCSV(todayFormatted)}\n`;
  csvContent += `Total Sales,${todayCount}\n`;
  csvContent += `Total Revenue,${formatNumber(todayTotal)}\n`;
  csvContent += `Cash Payments,${formatNumber(cashToday)}\n`;
  csvContent += `QR Payments,${formatNumber(qrToday)}\n\n`;

  // ========== PRODUCTION SUMMARY ==========
  csvContent += "TODAY PRODUCTION SUMMARY\n";
  csvContent += `Total KG Sold,${totalKgSold.toFixed(2)}\n`;
  csvContent += `Unsold/Defect (PCS),${unsoldDefect}\n\n`;

  // TODAY'S TRANSACTIONS
  csvContent += "TODAY'S TRANSACTIONS\n";
  csvContent += `Date,Time,Items,Total (RM),Paid (RM),Change (RM),Payment,Staff,Remarks\n`;

  todaysSales.forEach((sale) => {
    const { day, month, year, hours, minutes, seconds } = parseDateFromString(sale.date);
    const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Group items within this sale
    const groupedItems = {};
    sale.items.forEach((item) => {
      const itemName = item.name;
      
      if (!groupedItems[itemName]) {
        groupedItems[itemName] = 1;
      } else {
        groupedItems[itemName] += 1;
      }
    });
    
    // Build items list with grouped quantities
    let itemsList = [];
    // Sort items alphabetically for consistent output
    const sortedItems = Object.entries(groupedItems).sort((a, b) => a[0].localeCompare(b[0]));
    
    for (const [itemName, count] of sortedItems) {
      itemsList.push(`${count}x ${itemName}`);
    }
    const itemsString = itemsList.join(" + ");
    
    csvContent += `${escapeCSV(dateStr)},`;
    csvContent += `${escapeCSV(timeStr)},`;
    csvContent += `${escapeCSV(itemsString)},`;
    csvContent += `${formatNumber(sale.total)},`;
    csvContent += `${formatNumber(sale.paid)},`;
    csvContent += `${formatNumber(sale.change)},`;
    csvContent += `${escapeCSV(sale.paymentMethod)},`;
    csvContent += `${escapeCSV(sale.staff)},`;
    csvContent += `${escapeCSV(sale.remarks || '')}\n`;
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
  csvContent += `'+ Milk Choco Dip,${totalMilkDips}\n`;
  csvContent += `'+ Dark Choco Dip,${totalDarkDips}\n`;
  csvContent += `'+ Caramel Dip,${totalCaramelDips}\n`;
  csvContent += `'+ Special Dip,${totalSpecialDips}\n`;
  csvContent += `'+ Family Box Special Dip,${totalFamilyBoxDips}\n`;
  csvContent += `Total Dips,${totalDips}\n\n`;

  csvContent += "MERCHANDISE\n";
  csvContent += `Keychain,${totalKeychains}\n\n`;
  csvContent += `TOTAL ITEMS SOLD,${totalItems}\n\n`;

  csvContent += "CASH DRAWER\n";
  csvContent += `Starting Cash,${formatNumber(startingCash)}\n`;
  csvContent += `Cash Sales,${formatNumber(cashToday)}\n`;
  const expectedCash = startingCash + cashToday;
  csvContent += `Expected Cash,${formatNumber(expectedCash)}\n\n`;

  csvContent += "ALL TRANSACTIONS HISTORY\n";
  csvContent += `Date,Time,Items,Total (RM),Paid (RM),Change (RM),Payment,Staff,Remarks\n`;

  allSales.forEach((sale) => {
    const { day, month, year, hours, minutes, seconds } = parseDateFromString(sale.date);
    const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Group items within this sale
    const groupedItems = {};
    sale.items.forEach((item) => {
      const itemName = item.name;
      
      if (!groupedItems[itemName]) {
        groupedItems[itemName] = 1;
      } else {
        groupedItems[itemName] += 1;
      }
    });
    
    // Build items list with grouped quantities
    let itemsList = [];
    const sortedItems = Object.entries(groupedItems).sort((a, b) => a[0].localeCompare(b[0]));
    
    for (const [itemName, count] of sortedItems) {
      itemsList.push(`${count}x ${itemName}`);
    }
    const itemsString = itemsList.join(" + ");
    
    csvContent += `${escapeCSV(dateStr)},`;
    csvContent += `${escapeCSV(timeStr)},`;
    csvContent += `${escapeCSV(itemsString)},`;
    csvContent += `${formatNumber(sale.total)},`;
    csvContent += `${formatNumber(sale.paid)},`;
    csvContent += `${formatNumber(sale.change)},`;
    csvContent += `${escapeCSV(sale.paymentMethod)},`;
    csvContent += `${escapeCSV(sale.staff)},`;
    csvContent += `${escapeCSV(sale.remarks || '')}\n`;
  });

  // ========== DAILY UPDATES - Dalam bentuk list (vertical) ==========
  csvContent += "\nDAILY UPDATES\n";
  
  // Filter daily updates by comparing date strings directly
  const todaysUpdates = dailyUpdates.filter((update) => {
    if (!update || !update.date) return false;
    
    try {
      // Extract the date part from update.date (format: "dd/mm/yyyy, hh:mm:ss")
      const updateDatePart = update.date.split(',')[0].trim();
      
      // Compare with today's formatted date
      return updateDatePart === todayFormatted;
    } catch (e) {
      console.log("Error filtering daily update:", e);
      return false;
    }
  });

  if (todaysUpdates.length === 0) {
    csvContent += "No daily updates today.\n\n";
  } else {
    todaysUpdates.forEach((update, index) => {
      // Extract time from update.date
      let timeStr = "";
      try {
        const timeParts = update.date.split(',')[1]?.trim() || "";
        timeStr = timeParts.substring(0, 5); // Get HH:MM only
      } catch (e) {
        timeStr = "--:--";
      }

      csvContent += `\n--- UPDATE #${index + 1}: ${todayFormatted} ${timeStr} ---\n`;
      csvContent += `PIC: ${update.pic || 'Staff'}\n`;
      csvContent += `Outlet: ${update.outlet || 'DUNGUN'}\n`;
      
      // Restock items
      csvContent += `\n>> RESTOCK CHECKLIST:\n`;
      if (update.restock) {
        const restockItems = [
          { name: "TEPUNG", value: update.restock.tepung },
          { name: "PASTE", value: update.restock.paste },
          { name: "DIPPING CUP", value: update.restock.dippingCup },
          { name: "FAMILY BOX", value: update.restock.familybox },
          { name: "PAPER BAG", value: update.restock.paperBag },
          { name: "MILK CHOC", value: update.restock.milkChoc },
          { name: "DARK CHOC", value: update.restock.darkChoc },
          { name: "CARAMEL", value: update.restock.caramel },
          { name: "MINYAK", value: update.restock.minyak },
          { name: "CINNAMON SUGAR", value: update.restock.cinamon },
          { name: "TISU KERING", value: update.restock.tisuKering },
          { name: "TISU BASAH", value: update.restock.tisuBasah },
          { name: "PLASTIK KECIL", value: update.restock.plastikKecil },
          { name: "PLASTIK BESAR", value: update.restock.plastikBesar || 0 },
          { name: "GLOVE L", value: update.restock.gloveL || 0 },
          { name: "GLOVE S", value: update.restock.gloveS || 0 }
        ];
        
        let hasRestock = false;
        restockItems.forEach(item => {
          if (item.value && item.value > 0) {
            csvContent += `  ${item.name}: ${item.value} PCS\n`;
            hasRestock = true;
          }
        });
        
        if (!hasRestock) {
          csvContent += `  No restock items\n`;
        }
      } else {
        csvContent += `  No restock data\n`;
      }

      // Expenses
      if (update.expenses && update.expenses.length > 0) {
        csvContent += `\n>> EXPENSES:\n`;
        update.expenses.forEach(exp => {
          if (exp.desc && exp.amount > 0) {
            csvContent += `  ${exp.desc}: RM ${exp.amount.toFixed(2)}\n`;
          }
        });
      }

      // Requests
      if (update.requests && update.requests.length > 0) {
        csvContent += `\n>> REQUESTS:\n`;
        update.requests.forEach(req => {
          if (req.desc && req.qty > 0) {
            csvContent += `  ${req.desc}: ${req.qty} PCS\n`;
          }
        });
      }
      
      csvContent += `\n${'-'.repeat(30)}\n`;
    });
  }

  const filename = `churros_sales_${todayYear}${todayMonth}${todayDay}.csv`;
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid && window.Android) {
    await showCustomAlert("Saving to Downloads folder...", "Download", "📥");
    Android.downloadCSV(csvContent, filename);
  } else {
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

// ========== PRODUCTION SUMMARY FUNCTIONS ==========
function loadProductionData() {
  try {
    const saved = localStorage.getItem("productionData");
    if (saved) productionData = JSON.parse(saved);
    
    // Load today's data if exists
    const today = new Date().toLocaleDateString();
    const todayData = productionData.find(d => d.date === today);
    if (todayData) {
      totalKgSold = todayData.totalKg || 0;
      unsoldDefect = todayData.unsoldDefect || 0;
      
      // Update input fields
      const kgInput = document.getElementById("totalKgSold");
      const defectInput = document.getElementById("unsoldDefect");
      
      if (kgInput) kgInput.value = totalKgSold;
      if (defectInput) defectInput.value = unsoldDefect;
    }
  } catch (e) {
    console.log("No production data");
  }
}

// Auto-save function that saves to localStorage
function autoSaveProduction() {
  const kgInput = document.getElementById("totalKgSold");
  const defectInput = document.getElementById("unsoldDefect");
  
  if (!kgInput || !defectInput) return;
  
  totalKgSold = parseFloat(kgInput.value) || 0;
  unsoldDefect = parseInt(defectInput.value) || 0;
  
  const today = new Date().toLocaleDateString();
  
  // Find if today's data exists
  const existingIndex = productionData.findIndex(d => d.date === today);
  
  const todayData = {
    date: today,
    totalKg: totalKgSold,
    unsoldDefect: unsoldDefect
  };
  
  if (existingIndex >= 0) {
    productionData[existingIndex] = todayData;
  } else {
    productionData.push(todayData);
  }
  
  localStorage.setItem("productionData", JSON.stringify(productionData));
  
  // Optional visual feedback
  kgInput.style.borderColor = "var(--success)";
  defectInput.style.borderColor = "var(--success)";
  setTimeout(() => {
    kgInput.style.borderColor = "";
    defectInput.style.borderColor = "";
  }, 300);
}

// Debounce function to prevent too many saves while typing
function debounce(func, delay) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(func, delay);
  };
}

// Create debounced version of autoSave
const debouncedAutoSave = debounce(autoSaveProduction, 500);

// ========== LOAD DAILY UPDATES ==========
function loadDailyUpdates() {
  console.log("Loading daily updates...");
  try {
    const saved = localStorage.getItem("dailyUpdates");
    if (saved) {
      dailyUpdates = JSON.parse(saved);
      console.log("Loaded daily updates:", dailyUpdates);
    } else {
      console.log("No daily updates found");
      dailyUpdates = [];
    }
  } catch (e) {
    console.error("Error loading daily updates:", e);
    dailyUpdates = [];
  }
  
  // Always update the list after loading
  updateDailyUpdatesList();
}

// ========== UPDATE DAILY UPDATES LIST ==========
function updateDailyUpdatesList() {
  console.log("Updating daily updates list...");
  
  const listEl = document.getElementById("daily-updates-list");
  if (!listEl) {
    console.error("Daily updates list element not found!");
    return;
  }
  
  // Get today's date in the SAME format used when saving (dd/mm/yyyy)
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayYear = today.getFullYear();
  const todayDateStr = `${todayDay}/${todayMonth}/${todayYear}`;
  
  console.log("Today's date for filtering:", todayDateStr);
  
  // Filter updates that match today's date
  const todaysUpdates = dailyUpdates.filter(update => {
    if (!update || !update.date) return false;
    
    try {
      // Extract the date part (format: "dd/mm/yyyy, hh:mm:ss")
      const updateDatePart = update.date.split(',')[0].trim();
      return updateDatePart === todayDateStr;
    } catch (e) {
      console.log("Error parsing update date:", e);
      return false;
    }
  }).reverse();
  
  listEl.innerHTML = "";
  
  if (todaysUpdates.length === 0) {
    listEl.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No updates yet today.</p>';
    return;
  }
  
  todaysUpdates.forEach(update => {
    // Extract time part (HH:MM)
    let timeStr = "--:--";
    try {
      const timeParts = update.date.split(',')[1]?.trim() || "";
      timeStr = timeParts.substring(0, 5); // Get HH:MM only
    } catch (e) {}
    
    let items = [];
    
    // Count restock items
    if (update.restock) {
      const restockCount = Object.values(update.restock).filter(v => v > 0).length;
      if (restockCount > 0) items.push(`${restockCount} restock items`);
    }
    
    if (update.expenses?.length > 0) items.push(`${update.expenses.length} expenses`);
    if (update.requests?.length > 0) items.push(`${update.requests.length} requests`);
    
    const itemText = items.join(', ') || 'No items';
    
    const div = document.createElement('div');
    div.className = 'update-item';
    div.innerHTML = `
      <span class="update-time">${timeStr}</span>
      <span class="update-desc">${update.pic || 'Staff'} - ${itemText}</span>
    `;
    listEl.appendChild(div);
  });
}

// ========== SAVE DAILY UPDATE ==========
function saveDailyUpdate() {
  console.log("Saving daily update...");
  
  // Get restock values
  const restockData = {
    tepung: parseInt(document.getElementById("restock-tepung")?.value) || 0,
    paste: parseInt(document.getElementById("restock-paste")?.value) || 0,
    dippingCup: parseInt(document.getElementById("restock-dipping-cup")?.value) || 0,
    familybox: parseInt(document.getElementById("restock-familybox")?.value) || 0,
    paperBag: parseInt(document.getElementById("restock-paper-bag")?.value) || 0,
    milkChoc: parseInt(document.getElementById("restock-milk-choc")?.value) || 0,
    darkChoc: parseInt(document.getElementById("restock-dark-choc")?.value) || 0,
    caramel: parseInt(document.getElementById("restock-caramel")?.value) || 0,
    minyak: parseInt(document.getElementById("restock-minyak")?.value) || 0,
    cinamon: parseInt(document.getElementById("restock-cinamon")?.value) || 0,
    tisuKering: parseInt(document.getElementById("restock-tisu-kering")?.value) || 0,
    tisuBasah: parseInt(document.getElementById("restock-tisu-basah")?.value) || 0,
    plastikKecil: parseInt(document.getElementById("restock-plastik-kecil")?.value) || 0,
    plastikBesar: parseInt(document.getElementById("restock-plastik-besar")?.value) || 0,
    gloveL: parseInt(document.getElementById("restock-glove-l")?.value) || 0,
    gloveS: parseInt(document.getElementById("restock-glove-s")?.value) || 0,
  };

  // Get expenses
  const expenses = [];
  for (let i = 1; i <= 4; i++) {
    const desc = document.getElementById(`expense-${i}-desc`)?.value;
    const amount = parseFloat(document.getElementById(`expense-${i}-amount`)?.value) || 0;
    if (desc && desc.trim() !== '' && amount > 0) {
      expenses.push({ desc: desc.trim(), amount });
    }
  }

  // Get requests
  const requests = [];
  for (let i = 1; i <= 4; i++) {
    const desc = document.getElementById(`request-${i}-desc`)?.value;
    const qty = parseInt(document.getElementById(`request-${i}-qty`)?.value) || 0;
    if (desc && desc.trim() !== '' && qty > 0) {
      requests.push({ desc: desc.trim(), qty });
    }
  }

  const pic = document.getElementById("daily-pic")?.value || "Staff";
  const outlet = document.getElementById("daily-outlet")?.value || "DUNGUN";

  // Create date in a consistent format
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
 
  const newUpdate = {
    id: Date.now(),
    date: formattedDate,
    pic: pic,
    outlet: outlet,
    restock: restockData,
    expenses: expenses,
    requests: requests
  };

  console.log("New update:", newUpdate);

  dailyUpdates.push(newUpdate);
  localStorage.setItem("dailyUpdates", JSON.stringify(dailyUpdates));

  // Clear form
  clearDailyForm();
  
  // Update list
  updateDailyUpdatesList();
  
  showCustomAlert("Daily update saved!", "Success", "✅");
}

function clearDailyForm() {
  // Clear restock inputs
  document.querySelectorAll('.restock-input').forEach(input => input.value = '0');
  
  // Clear expense inputs
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`expense-${i}-desc`).value = '';
    document.getElementById(`expense-${i}-amount`).value = '0';
  }
  
  // Clear request inputs
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`request-${i}-desc`).value = '';
    document.getElementById(`request-${i}-qty`).value = '0';
  }
  
  // Reset PIC
  document.getElementById("daily-pic").value = currentStaff || "Staff 1";
}

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

  // Calculate expected cash: startingCash + cashSales
  const expectedCash = startingCash + cashSales;
  document.getElementById("expectedCash").textContent =
    `RM ${expectedCash.toFixed(2)}`;

  // Save to localStorage
  localStorage.setItem("startingCash", startingCash.toString());
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

  const expectedCash = startingCash + cashSales;

  // Format with proper line breaks
  const shiftReport = 
`SHIFT CLOSING REPORT
====================
Date: ${today}

STARTING CASH: RM ${startingCash.toFixed(2)}

SALES SUMMARY:
  Cash Sales: RM ${cashSales.toFixed(2)}
  QR Sales: RM ${cardSales.toFixed(2)}

EXPECTED CASH: RM ${expectedCash.toFixed(2)}

Take out RM ${cashSales.toFixed(2)} (cash sales) to bank,
leaving RM ${startingCash.toFixed(2)} for next shift.`;

  showCustomAlert(shiftReport, "Shift Closed", "✅");
}

// Reset Drawer
function resetDrawer() {
  showCustomConfirm(
    "Reset cash drawer?",
    "Reset Drawer",
    "⚠️"
  ).then((confirmed) => {
    if (confirmed) {
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
    updatePaymentDisplay();
    return;
  }

  // Group items
  const grouped = {};
  
  currentOrder.forEach((item) => {
    const key = item.name;
    if (!grouped[key]) {
      grouped[key] = { 
        name: item.name, 
        price: item.price, 
        count: item.quantity || 1, 
        isFamilyBoxDip: item.isFamilyBoxDip || false 
      };
    } else {
      grouped[key].count += (item.quantity || 1);
    }
  });

  let familyBoxCount = 0, dipCount = 0;
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
    const boxTotal = (35.0 * familyBoxCount) + (dipCount * 1.0);
    total += boxTotal;
    // Add Family Box to item count
    itemCount += familyBoxCount;

    const dipDisplay = dipCount > 0 ? ` (with ${dipCount} special dip${dipCount > 1 ? "s" : ""})` : "";
    const boxLi = document.createElement("li");
    boxLi.className = "order-item";
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

    // Display dips - AND ADD THEM TO ITEM COUNT
    if (dipCount > 0) {
      // Add dips to item count
      itemCount += dipCount;
      
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
    itemCount += item.count; // Add to item count

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
        currentOrder = currentOrder.filter(item => 
          item.name !== "Family Box" && !item.isFamilyBoxDip && item.name !== "+ Special Dip (FB)"
        );
      } else {
        const itemName = btn.dataset.itemName;
        const itemPrice = parseFloat(btn.dataset.itemPrice);
        const index = currentOrder.findIndex(item => item.name === itemName && item.price === itemPrice);
        if (index !== -1) currentOrder.splice(index, 1);
      }
      updateOrderList();
    });
  });

  const formattedTotal = `RM ${total.toFixed(2)}`;
  totalEl.textContent = formattedTotal;
  sheetTotalEl.textContent = formattedTotal;
  countEl.textContent = `${itemCount} Items`; // Now includes dips!

  updatePaymentDisplay();

  if (currentOrder.length > 0 && !cartOpen) {
    cartHeader.classList.add("cart-flash");
    setTimeout(() => cartHeader.classList.remove("cart-flash"), 300);
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

// ========== SAVE SALE ==========
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

  // Use consistent date format (dd/mm/yyyy, hh:mm:ss)
  const formattedDate = getCurrentFormattedDate();

  const newSale = {
    id: Date.now(),
    date: formattedDate,
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

  // Force reload data and update all displays
  loadStoredData(); // Reload from localStorage to ensure sync
  updateOrderList();
  updateReports();
  updateCalcDisplay();
  updatePaymentDisplay();
  updateCashDrawerDisplay();

  if (cartOpen) toggleCart();
  
  console.log("Sale saved successfully:", newSale);
}

// ========== RECEIPT FUNCTION - FIXED GROUPING ==========
function generateReceipt(sale) {
  document.getElementById("receiptDateTime").textContent = sale.date;
  document.getElementById("receiptStaff").textContent = "Served by: " + sale.staff;

  const itemsContainer = document.getElementById("receiptItems");
  itemsContainer.innerHTML = "";

  // Group ALL items by name and price
  const groupedItems = {};
  
  sale.items.forEach((item) => {
    const key = `${item.name}_${item.price}`;
    const quantity = item.quantity || 1;
    
    if (!groupedItems[key]) {
      groupedItems[key] = {
        name: item.name,
        price: item.price,
        quantity: quantity,
        isFamilyBoxDip: item.isFamilyBoxDip || false
      };
    } else {
      groupedItems[key].quantity += quantity;
    }
  });

  // Separate Family Box and its dips
  let familyBoxGroup = null;
  let familyBoxDips = [];
  const otherGroups = [];

  Object.values(groupedItems).forEach(group => {
    if (group.name === "Family Box") {
      familyBoxGroup = group;
    } else if (group.isFamilyBoxDip || group.name === "+ Special Dip (FB)") {
      familyBoxDips.push(group);
    } else {
      otherGroups.push(group);
    }
  });

  // Display Family Box with dips
  if (familyBoxGroup) {
    const boxQuantity = familyBoxGroup.quantity;
    let totalDipQuantity = 0;
    familyBoxDips.forEach(dip => totalDipQuantity += dip.quantity);
    
    const boxTotal = (35.0 * boxQuantity) + (totalDipQuantity * 1.0);
    
    itemsContainer.innerHTML += `
      <div class="receipt-item">
        <span>${boxQuantity}x Family Box ${totalDipQuantity > 0 ? `(+${totalDipQuantity} dip${totalDipQuantity > 1 ? 's' : ''})` : ''}</span>
        <span>RM ${boxTotal.toFixed(2)}</span>
      </div>
    `;
  }

  // Display all other items (grouped)
  otherGroups.forEach(group => {
    const quantity = group.quantity;
    const totalPrice = group.price * quantity;
    
    itemsContainer.innerHTML += `
      <div class="receipt-item">
        <span>${quantity}x ${group.name}</span>
        <span>RM ${totalPrice.toFixed(2)}</span>
      </div>
    `;
  });

  // Add payment summary
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

  document.getElementById("receiptTotal").textContent = "RM " + sale.total.toFixed(2);
  openModal("receiptModal");
}

// ========== REPORTS ==========
function updateReports() {
  console.log("Updating reports...");
  
  // Force reload sales data from localStorage
  loadStoredData();
  
  // Get today's date in the format used in sales data (dd/mm/yyyy)
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayYear = today.getFullYear();
  const todayDateStr = `${todayDay}/${todayMonth}/${todayYear}`;
  
  console.log("Today's date:", todayDateStr);
  console.log("All sales:", allSales);
  
  // Filter today's sales by comparing date strings
  const todaysSales = allSales.filter(sale => {
    if (!sale || !sale.date) return false;
    
    try {
      // Extract date part from sale.date (format: "dd/mm/yyyy, hh:mm:ss")
      const saleDatePart = sale.date.split(',')[0].trim();
      return saleDatePart === todayDateStr;
    } catch (e) {
      console.log("Error parsing sale date:", e);
      return false;
    }
  });
  
  console.log("Today's sales:", todaysSales);
  
  const totalAmount = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const orderCount = todaysSales.length;
  
  // Update the UI
  document.getElementById("reportTotalSales").textContent = `RM ${totalAmount.toFixed(2)}`;
  document.getElementById("reportOrderCount").textContent = orderCount;
  
  // Update cash drawer display
  updateCashDrawerDisplay();
  
  // Update recent transactions list
  const listEl = document.getElementById("reportSalesList");
  if (!listEl) return;
  
  listEl.innerHTML = "";
  
  if (todaysSales.length === 0) {
    listEl.innerHTML = '<li style="text-align:center; color: var(--text-muted); font-size: 0.9rem;">No sales yet today.</li>';
    return;
  }
  
  // Show most recent sales first
  [...todaysSales].reverse().forEach((sale) => {
    // Extract time from sale.date
    let timeStr = "--:--";
    try {
      const timeParts = sale.date.split(',')[1]?.trim() || "";
      timeStr = timeParts.substring(0, 5); // Get HH:MM only
    } catch (e) {}
    
    const li = document.createElement("li");
    li.style.cssText = "display:flex; justify-content:space-between; padding: 12px 0; border-bottom: 1px solid var(--border); font-size:0.9rem;";
    
    li.innerHTML = `
      <div>
        <strong style="color:var(--text-main);">${timeStr}</strong><br>
        <span style="color:var(--text-muted); font-size:0.8rem;">${sale.items.length} items</span>
      </div>
      <strong style="color:var(--primary);">RM ${sale.total.toFixed(2)}</strong>
    `;
    listEl.appendChild(li);
  });
  
  console.log("Reports updated successfully");
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
