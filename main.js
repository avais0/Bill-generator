let expenses = [];
let currentEditId = null;
let chartInstance = null;
let currentCurrency = "USD";
const storageKey = "monthly_expenses_app";
const currencyPrefKey = "expense_currency_pref";
const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

// DOM elements
const monthSelector = document.getElementById("monthSelector");
const monthTotalDisplay = document.getElementById("monthTotalDisplay");
const expenseDesc = document.getElementById("expenseDesc");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDate = document.getElementById("expenseDate");
const submitBtn = document.getElementById("submitExpenseBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editBadge = document.getElementById("editBadge");
const formTitle = document.getElementById("formTitle");
const formErrorMsg = document.getElementById("formErrorMsg");
const expensesTableBody = document.getElementById("expensesTableBody");
const expenseCountBadge = document.getElementById("expenseCountBadge");
const clearAllBtn = document.getElementById("clearAllBtn");
const chartCanvas = document.getElementById("expenseChart");
const chartNoDataMsg = document.getElementById("chartNoDataMsg");
const currencySelector = document.getElementById("currencySelector");
const amountPrefixSymbol = document.getElementById("amountPrefixSymbol");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

// Helper: currency symbol
function getCurrencySymbol(currency) {
  return currency === "PKR" ? "Rs" : "$";
}

function formatMoney(amount) {
  const symbol = getCurrencySymbol(currentCurrency);
  return `${symbol} ${Number(amount).toFixed(2)}`;
}

function updateAmountInputPrefix() {
  amountPrefixSymbol.innerText = getCurrencySymbol(currentCurrency);
}

function setCurrency(currency) {
  currentCurrency = currency;
  localStorage.setItem(currencyPrefKey, currency);
  currencySelector.value = currency;
  updateAmountInputPrefix();
  renderUI();
}

function loadCurrencyPreference() {
  const saved = localStorage.getItem(currencyPrefKey);
  if (saved === "PKR" || saved === "USD") currentCurrency = saved;
  else currentCurrency = "USD";
  currencySelector.value = currentCurrency;
  updateAmountInputPrefix();
}

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function setDefaultDate() {
  if (!expenseDate.value) expenseDate.value = getTodayDate();
}

function loadExpenses() {
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    expenses = JSON.parse(stored);
    if (!Array.isArray(expenses)) expenses = [];
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentMonthDate = (d) =>
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const prevMonthDate = () => {
      let prevDate = new Date(year, month, 1);
      prevDate.setDate(1);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}-15`;
    };
    expenses = [
      {
        id: Date.now() + 1,
        description: "Grocery Shopping",
        amount: 145.75,
        category: "Food",
        date: currentMonthDate(5),
      },
      {
        id: Date.now() + 2,
        description: "Uber Ride",
        amount: 24.5,
        category: "Transport",
        date: currentMonthDate(10),
      },
      {
        id: Date.now() + 3,
        description: "Netflix Subscription",
        amount: 15.99,
        category: "Entertainment",
        date: currentMonthDate(12),
      },
      {
        id: Date.now() + 4,
        description: "Electric Bill",
        amount: 68.3,
        category: "Bills",
        date: currentMonthDate(3),
      },
      {
        id: Date.now() + 5,
        description: "New Headphones",
        amount: 89.99,
        category: "Shopping",
        date: prevMonthDate(),
      },
    ];
    saveExpensesToLocal();
  }
  setDefaultDate();
}

function saveExpensesToLocal() {
  localStorage.setItem(storageKey, JSON.stringify(expenses));
}

function getSelectedMonth() {
  return monthSelector.value;
}

function filterExpensesByMonth(monthValue) {
  if (!monthValue) return [];
  return expenses.filter(
    (exp) => exp.date && exp.date.substring(0, 7) === monthValue,
  );
}

function computeTotal(filteredArray) {
  return filteredArray.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
}

function renderTable(filtered) {
  if (filtered.length === 0) {
    expensesTableBody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">✨ No expenses recorded for this month. Add one above!</td></tr>`;
    expenseCountBadge.innerText = `0 items`;
    return;
  }
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  let rowsHtml = "";
  sorted.forEach((exp) => {
    const formattedAmt = formatMoney(exp.amount);
    rowsHtml += `
                    <tr class="hover:bg-gray-50 transition">
                        <td class="px-5 py-3 text-sm font-medium text-gray-800">${escapeHtml(exp.description)}</td>
                        <td class="px-5 py-3 text-sm"><span class="bg-gray-100 px-2 py-1 rounded-full text-xs">${escapeHtml(exp.category)}</span></td>
                        <td class="px-5 py-3 text-sm font-semibold text-gray-900">${escapeHtml(formattedAmt)}</td>
                        <td class="px-5 py-3 text-sm text-gray-500">${escapeHtml(exp.date)}</td>
                        <td class="px-5 py-3 text-center whitespace-nowrap">
                            <button class="edit-expense text-indigo-600 hover:text-indigo-800 mx-1 transition" data-id="${exp.id}"><i class="fas fa-edit"></i></button>
                            <button class="delete-expense text-red-500 hover:text-red-700 mx-1 transition" data-id="${exp.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `;
  });
  expensesTableBody.innerHTML = rowsHtml;
  expenseCountBadge.innerText = `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function updateChart(filteredExpenses) {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  if (!filteredExpenses.length) {
    chartCanvas.classList.add("hidden");
    chartNoDataMsg.classList.remove("hidden");
    return;
  }
  chartCanvas.classList.remove("hidden");
  chartNoDataMsg.classList.add("hidden");

  const categoryMap = new Map();
  categories.forEach((cat) => categoryMap.set(cat, 0));
  filteredExpenses.forEach((exp) => {
    let cat = exp.category;
    if (!categories.includes(cat)) cat = "Other";
    const current = categoryMap.get(cat) || 0;
    categoryMap.set(cat, current + Number(exp.amount));
  });

  const labels = [];
  const data = [];
  categoryMap.forEach((val, key) => {
    if (val > 0) {
      labels.push(key);
      data.push(val);
    }
  });

  if (labels.length === 0) {
    chartCanvas.classList.add("hidden");
    chartNoDataMsg.classList.remove("hidden");
    return;
  }

  const ctx = chartCanvas.getContext("2d");
  const colorPalette = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec489a",
    "#14b8a6",
  ];
  const backgroundColors = labels.map(
    (_, idx) => colorPalette[idx % colorPalette.length],
  );

  chartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (tooltipItem) => {
              return `${tooltipItem.label}: ${formatMoney(tooltipItem.raw)}`;
            },
          },
        },
      },
    },
  });
}

function renderUI() {
  const selectedMonth = getSelectedMonth();
  if (!selectedMonth) return;
  const filtered = filterExpensesByMonth(selectedMonth);
  const total = computeTotal(filtered);
  monthTotalDisplay.innerText = formatMoney(total);
  renderTable(filtered);
  updateChart(filtered);
}

// ************ PDF Export Function ************
async function exportToPDF() {
  const selectedMonth = getSelectedMonth();
  if (!selectedMonth) {
    showError("No month selected.");
    return;
  }
  const filtered = filterExpensesByMonth(selectedMonth);
  if (filtered.length === 0) {
    showError("No expenses to export for this month.");
    return;
  }

  // Prepare data for table
  const tableData = filtered.map((exp) => [
    exp.description,
    exp.category,
    `${getCurrencySymbol(currentCurrency)} ${Number(exp.amount).toFixed(2)}`,
    exp.date,
  ]);

  const totalAmount = computeTotal(filtered);
  const totalFormatted = formatMoney(totalAmount);
  const monthName = new Date(selectedMonth + "-01").toLocaleDateString(
    undefined,
    { year: "numeric", month: "long" },
  );

  // Create PDF using jspdf and autoTable
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Report", 14, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Month: ${monthName}`, 14, 30);
  doc.text(
    `Currency: ${currentCurrency} (${getCurrencySymbol(currentCurrency)})`,
    14,
    37,
  );
  doc.text(`Total Spending: ${totalFormatted}`, 14, 44);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 51);

  // Category summary (optional)
  const categoryTotals = {};
  filtered.forEach((exp) => {
    const cat = exp.category;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount);
  });
  let summaryText = "Category Breakdown:\n";
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    summaryText += `${cat}: ${formatMoney(amt)}\n`;
  }
  doc.setFontSize(10);
  const splitSummary = doc.splitTextToSize(summaryText, 180);
  doc.text(splitSummary, 14, 60);

  // Add expense table
  doc.autoTable({
    startY: 75,
    head: [["Description", "Category", "Amount", "Date"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
    },
  });

  // Save PDF
  doc.save(`expenses_${selectedMonth}_${currentCurrency}.pdf`);
  showSuccessMsg("PDF report downloaded!");
}

// Handle form submit, edit, delete, clear
function handleSubmitExpense() {
  formErrorMsg.classList.add("hidden");
  const description = expenseDesc.value.trim();
  const amountRaw = expenseAmount.value.trim();
  const category = expenseCategory.value;
  const date = expenseDate.value;

  if (!description) return showError("Please enter a description.");
  if (!amountRaw || isNaN(parseFloat(amountRaw)) || parseFloat(amountRaw) <= 0)
    return showError("Valid positive amount required.");
  if (!date) return showError("Select a date.");
  const amount = parseFloat(amountRaw);

  if (currentEditId !== null) {
    const index = expenses.findIndex((exp) => exp.id === currentEditId);
    if (index !== -1) {
      expenses[index] = {
        ...expenses[index],
        description,
        amount,
        category,
        date,
      };
      saveExpensesToLocal();
      resetEditMode();
      renderUI();
      showSuccessMsg("Expense updated!");
    } else {
      showError("Expense not found.");
      resetEditMode();
    }
  } else {
    expenses.push({ id: Date.now(), description, amount, category, date });
    saveExpensesToLocal();
    clearFormFields();
    renderUI();
    showSuccessMsg("Expense added!");
  }
}

function showError(msg) {
  formErrorMsg.innerText = msg;
  formErrorMsg.classList.remove("hidden");
  setTimeout(() => formErrorMsg.classList.add("hidden"), 2500);
}

function showSuccessMsg(msg) {
  const oldDiv = document.getElementById("tempSuccessMsg");
  if (oldDiv) oldDiv.remove();
  const div = document.createElement("div");
  div.id = "tempSuccessMsg";
  div.className =
    "fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm z-50";
  div.innerText = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

function clearFormFields() {
  expenseDesc.value = "";
  expenseAmount.value = "";
  expenseCategory.value = "Food";
  expenseDate.value = getTodayDate();
}

function resetEditMode() {
  currentEditId = null;
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Expense';
  formTitle.innerText = "Add New Expense";
  editBadge.classList.add("hidden");
  cancelEditBtn.classList.add("hidden");
  clearFormFields();
}

function startEditExpense(expenseId) {
  const expense = expenses.find((exp) => exp.id === expenseId);
  if (!expense) return;
  currentEditId = expense.id;
  expenseDesc.value = expense.description;
  expenseAmount.value = expense.amount;
  expenseCategory.value = expense.category;
  expenseDate.value = expense.date;
  submitBtn.innerHTML = '<i class="fas fa-pen"></i> Update Expense';
  formTitle.innerText = "Edit Expense";
  editBadge.classList.remove("hidden");
  cancelEditBtn.classList.remove("hidden");
  document
    .querySelector(".bg-white.rounded-2xl.shadow-md.p-5")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteExpense(expenseId) {
  if (confirm("Delete this expense permanently?")) {
    expenses = expenses.filter((exp) => exp.id !== expenseId);
    saveExpensesToLocal();
    if (currentEditId === expenseId) resetEditMode();
    renderUI();
    showSuccessMsg("Expense removed");
  }
}

function clearAllExpenses() {
  if (
    confirm("⚠️ This will delete ALL expenses. Cannot be undone. Continue?")
  ) {
    expenses = [];
    saveExpensesToLocal();
    resetEditMode();
    renderUI();
    showSuccessMsg("All expenses cleared");
  }
}

function attachTableEvents() {
  expensesTableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-expense");
    const deleteBtn = e.target.closest(".delete-expense");
    if (editBtn) {
      const id = parseInt(editBtn.getAttribute("data-id"));
      if (id) startEditExpense(id);
    }
    if (deleteBtn) {
      const id = parseInt(deleteBtn.getAttribute("data-id"));
      if (id) deleteExpense(id);
    }
  });
}

function onMonthChange() {
  renderUI();
}
function cancelEdit() {
  resetEditMode();
  renderUI();
}
function setDefaultMonth() {
  const today = new Date();
  monthSelector.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function init() {
  loadCurrencyPreference();
  loadExpenses();
  setDefaultMonth();
  setDefaultDate();
  attachTableEvents();
  renderUI();

  monthSelector.addEventListener("change", onMonthChange);
  submitBtn.addEventListener("click", handleSubmitExpense);
  cancelEditBtn.addEventListener("click", cancelEdit);
  clearAllBtn.addEventListener("click", clearAllExpenses);
  currencySelector.addEventListener("change", (e) =>
    setCurrency(e.target.value),
  );
  downloadPdfBtn.addEventListener("click", exportToPDF);

  document
    .querySelectorAll("form")
    .forEach((f) => f.addEventListener("submit", (e) => e.preventDefault()));
  [expenseDesc, expenseAmount, expenseDate].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSubmitExpense();
    });
  });
}

init();
