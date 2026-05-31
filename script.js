/* ============================================================
   MUTUAL FUND DASHBOARD - SCRIPT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const API_BASE = 'http://localhost:8000/api/v1';

  // DOM Elements
  const fromDateInput = document.getElementById('fromDate');
  const toDateInput = document.getElementById('toDate');
  const btnApplyFilter = document.getElementById('btnApplyFilter');
  const btnResetFilter = document.getElementById('btnResetFilter');
  
  const loader = document.getElementById('loader');
  const dashboardContent = document.getElementById('dashboardContent');

  const tbodyInvestorPurchase = document.getElementById('tbodyInvestorPurchase');
  const tbodyMfInvestor = document.getElementById('tbodyMfInvestor');
  const tbodyInvestors = document.getElementById('tbodyInvestors');
  const tbodyMfSummary = document.getElementById('tbodyMfSummary');

  // Formatters
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  const formatUnits = (val) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(val);

  // Fetch Data function
  const fetchData = async (fromDate = '', toDate = '') => {
    
    // Show loading state
    loader.style.display = 'flex';
    dashboardContent.style.opacity = '0.3';
    btnApplyFilter.disabled = true;

    try {
      let queryParams = new URLSearchParams();
      if (fromDate) queryParams.append('from_date', fromDate);
      if (toDate) queryParams.append('to_date', toDate);
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

      // API Endpoints corresponding directly to requirements
      const urls = [
        `${API_BASE}/investor-purchase-summary${queryStr}`,
        `${API_BASE}/mutualfund-investor-summary${queryStr}`,
        `${API_BASE}/investors${queryStr}`,
        `${API_BASE}/mutualfund-summary${queryStr}`
      ];

      const responses = await Promise.all(urls.map(url => fetch(url)));
      
      // Check for errors
      for(let res of responses) {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      }

      const [invPurchaseData, mfInvSummaryData, investorsData, mfSummaryData] = await Promise.all(responses.map(r => r.json()));

      // 1. Render Investor-wise Purchase Summary per Mutual Fund
      renderTable(
        tbodyInvestorPurchase, 
        invPurchaseData, 
        (row) => `
          <tr>
            <td><strong>${row.inv_name}</strong></td>
            <td>${row.pan}</td>
            <td>${row.scheme}</td>
            <td class="text-right">${formatCurrency(row.total_amount)}</td>
            <td class="text-right">${formatUnits(row.total_units)}</td>
          </tr>
        `,
        5
      );

      // 2. Render Mutual Fund-wise Summary per Investor
      renderTable(
        tbodyMfInvestor, 
        mfInvSummaryData, 
        (row) => `
          <tr>
            <td><strong>${row.scheme}</strong></td>
            <td>${row.inv_name}</td>
            <td>${row.pan}</td>
            <td class="text-right">${formatCurrency(row.total_amount)}</td>
            <td class="text-right">${formatUnits(row.total_units)}</td>
          </tr>
        `,
        5
      );

      // 3. Render Investor List with Purchase Details
      renderTable(
        tbodyInvestors, 
        investorsData, 
        (row) => `
          <tr>
            <td><strong>${row.inv_name}</strong></td>
            <td>${row.pan}</td>
            <td class="text-right">${formatCurrency(row.total_investment)}</td>
          </tr>
        `,
        3
      );

      // 4. Render Mutual Fund Summary
      renderTable(
        tbodyMfSummary, 
        mfSummaryData, 
        (row) => `
          <tr>
            <td><strong>${row.scheme}</strong></td>
            <td class="text-right">${formatCurrency(row.total_amount)}</td>
            <td class="text-right">${formatUnits(row.total_units)}</td>
            <td class="text-right">${formatCurrency(row.avg_nav)}</td>
          </tr>
        `,
        4
      );

    } catch (error) {
      console.error("Fetch error:", error);
      alert("Failed to load data from backend. Please ensure the FastAPI server is running.");
    } finally {
      loader.style.display = 'none';
      dashboardContent.style.opacity = '1';
      btnApplyFilter.disabled = false;
    }
  };

  // Helper to render table contents
  const renderTable = (tbodyElement, dataArray, rowTemplateFn, colCount) => {
    if (!dataArray || dataArray.length === 0) {
      tbodyElement.innerHTML = `<tr class="empty-row"><td colspan="${colCount}">No data found for the selected date range.</td></tr>`;
      return;
    }
    
    let html = '';
    dataArray.forEach(row => {
      html += rowTemplateFn(row);
    });
    tbodyElement.innerHTML = html;
  };

  // Event Listeners
  btnApplyFilter.addEventListener('click', () => {
    fetchData(fromDateInput.value, toDateInput.value);
  });

  btnResetFilter.addEventListener('click', () => {
    fromDateInput.value = '';
    toDateInput.value = '';
    fetchData();
  });

  // Initial Load
  fetchData();

});
