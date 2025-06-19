// Global variables
let currencies = [];
let rates = [];
let opportunities = [];
let graph = null;

// DOM elements
const exchangeRatesEl = document.getElementById('exchangeRates');
const opportunitiesEl = document.getElementById('opportunities');
const fromCurrencyEl = document.getElementById('fromCurrency');
const toCurrencyEl = document.getElementById('toCurrency');
const rateEl = document.getElementById('rate');
const updateRateBtn = document.getElementById('updateRate');
const rateGraphCanvas = document.getElementById('rateGraph');

// Fetch data from the API
async function fetchData() {
    try {
        const prevFrom = fromCurrencyEl.value;
        const prevTo = toCurrencyEl.value;

        const response = await fetch('http://localhost:8000/api/data');
        const data = await response.json();

        currencies = data.currencies;
        rates = data.rates;
        opportunities = data.opportunities;

        // ✅ Ensure all possible currency pairs exist in rates
        currencies.forEach(from => {
            currencies.forEach(to => {
                if (from !== to && !rates.some(r => r.from === from && r.to === to)) {
                    rates.push({ from, to, rate: 1.0 });
                }
            });
        });

        renderExchangeRates();
        renderCurrencySelects();

        if (currencies.includes(prevFrom)) fromCurrencyEl.value = prevFrom;
        if (currencies.includes(prevTo)) toCurrencyEl.value = prevTo;

        renderRateGraph();
    } catch (error) {
        console.error('Error fetching data:', error);
        exchangeRatesEl.innerHTML = '<div class="error">Error loading data. Make sure the server is running.</div>';
        opportunitiesEl.innerHTML = '<div class="error">Error loading data. Make sure the server is running.</div>';
    }
}

function renderExchangeRates() {
    if (rates.length === 0) {
        exchangeRatesEl.innerHTML = '<div class="no-data">No exchange rates available</div>';
        return;
    }

    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">`;
    rates.forEach(rate => {
        html += `
            <div class="flex items-center justify-between bg-white border border-indigo-200 rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition duration-200">
                <div class="flex items-center gap-2">
                    <span class="text-lg font-semibold text-indigo-700">${rate.from}</span>
                    <span class="mx-1 text-gray-400">→</span>
                    <span class="text-lg font-semibold text-indigo-700">${rate.to}</span>
                </div>
                <span class="text-xl font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded truncate max-w-[100px] overflow-hidden" title="${rate.rate}">
                    ${rate.rate.toFixed(4)}
                </span>
            </div>`;
    });
    html += `</div>`;

    exchangeRatesEl.innerHTML = html;
}

function filterOpportunitiesBySelection(from, to) {
    return opportunities.filter(opp =>
        opp.path[0] === from && opp.path[opp.path.length - 1] === to
    );
}

function renderOpportunities(filteredList) {
    let list = filteredList;
    if (!list) {
        const from = fromCurrencyEl.value;
        const to = toCurrencyEl.value;
        list = opportunities.filter(opp =>
            opp.path[0] === from && opp.path[opp.path.length - 1] === to
        );
    }

    if (list.length === 0) {
        opportunitiesEl.innerHTML = '<div class="no-data">No arbitrage opportunities found</div>';
        return;
    }

    let userAmount = parseFloat(rateEl.value);
    if (isNaN(userAmount) || userAmount <= 0) userAmount = 1;

    let html = `<div class="grid grid-cols-1 gap-4">`;
    list.forEach(opp => {
        let rate = 1;
        let valid = true;
        for (let i = 0; i < opp.path.length - 1; i++) {
            const from = opp.path[i];
            const to = opp.path[i + 1];
            const rateObj = rates.find(r => r.from === from && r.to === to);
            if (!rateObj) {
                valid = false;
                break;
            }
            rate *= rateObj.rate;
        }
        if (!valid) return;

        const fromCurr = opp.path[0];
        const toCurr = opp.path[opp.path.length - 1];
        const directRateObj = rates.find(r => r.from === fromCurr && r.to === toCurr);
        const directRate = directRateObj ? directRateObj.rate : 1;
        const profit = (rate - directRate) / directRate;
        const profitPercent = (profit * 100).toFixed(2);

        const profitColor = profit > 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
        const resultValue = userAmount * rate;
        let conversionText = `<span class="font-semibold text-indigo-700">${userAmount}</span> ${fromCurr} = <span class="font-semibold text-indigo-700">${resultValue.toFixed(4)}</span> ${toCurr}`;

        let pathHtml = '<div class="flex flex-wrap items-center gap-2 justify-center mb-2">';
        opp.path.forEach((currency, i) => {
            pathHtml += `<span class="font-semibold text-indigo-700">${currency}</span>`;
            if (i < opp.path.length - 1) {
                pathHtml += '<span class="text-indigo-400">→</span>';
            }
        });
        pathHtml += '</div>';

        html += `
            <div class="bg-white border border-indigo-200 rounded-lg shadow-sm px-4 py-3 hover:shadow-md transition duration-200">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold text-indigo-700">Opportunity</h3>
                    <span class="${profitColor} px-3 py-1 rounded font-semibold text-base">
                        Profit: ${profitPercent}%
                    </span>
                </div>
                ${pathHtml}
                <div class="mt-2 text-sm text-indigo-900">
                    <span class="font-medium">${conversionText}</span>
                </div>
            </div>`;
    });
    html += `</div>`;

    opportunitiesEl.innerHTML = html;
}

function renderCurrencySelects() {
    let fromHtml = '';
    let toHtml = '';

    currencies.forEach(currency => {
        fromHtml += `<option value="${currency}">${currency}</option>`;
        toHtml += `<option value="${currency}">${currency}</option>`;
    });

    fromCurrencyEl.innerHTML = fromHtml;
    toCurrencyEl.innerHTML = toHtml;

    if (currencies.length > 1) {
        toCurrencyEl.selectedIndex = 1;
    }
}

function setupOpportunityFilter() {
    function filterAndRender() {
        const from = fromCurrencyEl.value;
        const to = toCurrencyEl.value;
        const filtered = filterOpportunitiesBySelection(from, to);
        renderOpportunities(filtered);
    }
    fromCurrencyEl.addEventListener('change', filterAndRender);
    toCurrencyEl.addEventListener('change', filterAndRender);
    filterAndRender();
}

// ✅ Update rate immediately in memory and rerender on input
rateEl.addEventListener('input', () => {
    const from = fromCurrencyEl.value;
    const to = toCurrencyEl.value;
    const inputRate = parseFloat(rateEl.value);

    if (from !== to && !isNaN(inputRate) && inputRate > 0) {
        const existingRate = rates.find(r => r.from === from && r.to === to);
        if (existingRate) {
            existingRate.rate = inputRate;
        } else {
            rates.push({ from, to, rate: inputRate });
        }
    }

    const filtered = filterOpportunitiesBySelection(from, to);
    renderOpportunities(filtered);
});

function renderRateGraph() {
    const nodes = currencies.map(currency => ({
        id: currency,
        label: currency,
        x: Math.random() * rateGraphCanvas.width,
        y: Math.random() * rateGraphCanvas.height
    }));

    const edges = rates.map(rate => ({
        from: rate.from,
        to: rate.to,
        rate: rate.rate
    }));

    for (let i = 0; i < 100; i++) {
        for (let j = 0; j < nodes.length; j++) {
            for (let k = 0; k < nodes.length; k++) {
                if (j !== k) {
                    const dx = nodes[j].x - nodes[k].x;
                    const dy = nodes[j].y - nodes[k].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        nodes[j].x += dx * 0.1;
                        nodes[j].y += dy * 0.1;
                    }
                }
            }
        }
        for (let j = 0; j < nodes.length; j++) {
            nodes[j].x += (rateGraphCanvas.width / 2 - nodes[j].x) * 0.01;
            nodes[j].y += (rateGraphCanvas.height / 2 - nodes[j].y) * 0.01;
        }
    }

    const ctx = rateGraphCanvas.getContext('2d');
    ctx.clearRect(0, 0, rateGraphCanvas.width, rateGraphCanvas.height);

    edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);

        if (fromNode && toNode) {
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);

            const isArbitrageEdge = opportunities.some(opp => {
                for (let i = 0; i < opp.path.length - 1; i++) {
                    if (opp.path[i] === edge.from && opp.path[i + 1] === edge.to) {
                        return true;
                    }
                }
                return false;
            });

            ctx.strokeStyle = isArbitrageEdge ? '#ff6b6b' : '#aaa';
            ctx.lineWidth = isArbitrageEdge ? 2 : 1;
            ctx.stroke();

            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            ctx.fillStyle = '#555';
            ctx.font = '10px Arial';
            ctx.fillText(edge.rate.toFixed(2), midX, midY);
        }
    });

    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
        ctx.fillStyle = '#3a7bd5';
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x, node.y);
    });
}

async function updateRate() {
    const from = fromCurrencyEl.value;
    const to = toCurrencyEl.value;
    const rate = parseFloat(rateEl.value);

    if (from === to) {
        alert('From and To currencies must be different');
        return;
    }

    if (isNaN(rate) || rate <= 0) {
        alert('Please enter a valid positive rate');
        return;
    }

    try {
        const existingRateIndex = rates.findIndex(r => r.from === from && r.to === to);

        if (existingRateIndex >= 0) {
            rates[existingRateIndex].rate = rate;
        } else {
            rates.push({ from, to, rate });
        }

        await fetch('http://localhost:8000/api/update');
        await fetchData();

        alert('Rate updated successfully');
    } catch (error) {
        console.error('Error updating rate:', error);
        alert('Error updating rate. Make sure the server is running.');
    }
}

function resizeCanvas() {
    rateGraphCanvas.width = rateGraphCanvas.parentElement.clientWidth;
    rateGraphCanvas.height = 300;
    if (currencies.length > 0) {
        renderRateGraph();
    }
}

window.addEventListener('load', () => {
    resizeCanvas();
    fetchData();
    setupOpportunityFilter();

    const openChatbotBtn = document.getElementById('openChatbotBtn');
    const chatbotModal = document.getElementById('chatbotModal');
    const chatbotBox = chatbotModal ? chatbotModal.querySelector('.bg-white') : null;
    const closeChatbotBtn = document.getElementById('closeChatbotBtn');

    if (openChatbotBtn && chatbotModal && chatbotBox && closeChatbotBtn) {
        openChatbotBtn.addEventListener('click', () => {
            chatbotBox.style.display = 'flex';
            chatbotModal.style.pointerEvents = 'auto';
        });
        closeChatbotBtn.addEventListener('click', () => {
            chatbotBox.style.display = 'none';
            chatbotModal.style.pointerEvents = 'none';
        });
        chatbotModal.addEventListener('mousedown', (e) => {
            if (e.target === chatbotModal) {
                chatbotBox.style.display = 'none';
                chatbotModal.style.pointerEvents = 'none';
            }
        });
    }
});

window.addEventListener('resize', resizeCanvas);
setInterval(fetchData, 30000);
