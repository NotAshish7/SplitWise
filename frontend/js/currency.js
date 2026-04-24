// ROOT CAUSE FIX: Currency Helper Functions with REAL conversion
// This file provides currency formatting, symbol functions, and exchange rate conversion

const CURRENCY_SYMBOLS = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$'
};

const CURRENCY_NAMES = {
    'INR': 'Indian Rupee',
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'JPY': 'Japanese Yen',
    'AUD': 'Australian Dollar'
};

// Get exchange rates from localStorage or use defaults
function getExchangeRates() {
    const savedRates = localStorage.getItem('exchangeRates');
    if (savedRates) {
        try {
            return JSON.parse(savedRates);
        } catch (e) {
            console.warn('Error parsing exchange rates from localStorage');
        }
    }
    
    // Default rates (fallback if API fails)
    return {
        'USD': 1,
        'INR': 83.50,
        'EUR': 0.92,
        'GBP': 0.79,
        'JPY': 149.50,
        'AUD': 1.52
    };
}

// ROOT CAUSE FIX: Convert amount from one currency to another using exchange rates
function convertAmount(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return amount;
    }
    
    const exchangeRates = getExchangeRates();
    
    // Convert to USD first (base currency), then to target currency
    if (exchangeRates[fromCurrency] && exchangeRates[toCurrency]) {
        const amountInUSD = amount / exchangeRates[fromCurrency];
        return amountInUSD * exchangeRates[toCurrency];
    }
    
    // If rates not available, return original amount
    console.warn(`Exchange rates not available for ${fromCurrency} or ${toCurrency}`);
    return amount;
}

// Get user's preferred currency
function getUserCurrency() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.preferredCurrency || 'INR';
}

// Get currency symbol
function getCurrencySymbol(currency = null) {
    const curr = currency || getUserCurrency();
    return CURRENCY_SYMBOLS[curr] || '₹';
}

// ROOT CAUSE FIX: Format amount with currency symbol AND convert to user's preferred currency
function formatCurrency(amount, currency = null, convert = true) {
    const userCurrency = getUserCurrency();
    const sourceCurrency = currency || 'INR'; // Default source currency is INR
    
    // Convert amount if needed
    let displayAmount = amount;
    if (convert && sourceCurrency !== userCurrency) {
        displayAmount = convertAmount(parseFloat(amount || 0), sourceCurrency, userCurrency);
    }
    
    const symbol = getCurrencySymbol(userCurrency);
    const formattedAmount = parseFloat(displayAmount || 0).toFixed(2);
    return `${symbol}${formattedAmount}`;
}

// Format amount with currency symbol (no decimals) with conversion
function formatCurrencyInt(amount, currency = null, convert = true) {
    const userCurrency = getUserCurrency();
    const sourceCurrency = currency || 'INR';
    
    // Convert amount if needed
    let displayAmount = amount;
    if (convert && sourceCurrency !== userCurrency) {
        displayAmount = convertAmount(parseFloat(amount || 0), sourceCurrency, userCurrency);
    }
    
    const symbol = getCurrencySymbol(userCurrency);
    const formattedAmount = Math.round(parseFloat(displayAmount || 0));
    return `${symbol}${formattedAmount.toLocaleString()}`;
}

// ROOT CAUSE FIX: Convert and format with comma separators
function formatCurrencyWithCommas(amount, currency = null, convert = true) {
    const userCurrency = getUserCurrency();
    const sourceCurrency = currency || 'INR';
    
    // Convert amount if needed
    let displayAmount = amount;
    if (convert && sourceCurrency !== userCurrency) {
        displayAmount = convertAmount(parseFloat(amount || 0), sourceCurrency, userCurrency);
    }
    
    const symbol = getCurrencySymbol(userCurrency);
    const formattedAmount = parseFloat(displayAmount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${symbol}${formattedAmount}`;
}

// Replace all ₹ symbols in the document with current currency symbol
function updateCurrencySymbols() {
    const symbol = getCurrencySymbol();
    
    // Update all text content that contains currency symbols
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const nodesToUpdate = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.textContent.includes('₹') || 
            node.textContent.includes('$') || 
            node.textContent.includes('€') || 
            node.textContent.includes('£') ||
            node.textContent.includes('¥')) {
            nodesToUpdate.push(node);
        }
    }
    
    nodesToUpdate.forEach(node => {
        // Replace any currency symbol with the current one
        node.textContent = node.textContent
            .replace(/₹/g, symbol)
            .replace(/\$/g, symbol)
            .replace(/€/g, symbol)
            .replace(/£/g, symbol)
            .replace(/¥/g, symbol);
    });
}

// Fetch exchange rates from API (called from settings page, but available here too)
async function fetchExchangeRates() {
    try {
        console.log('Fetching live exchange rates...');
        
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        
        if (!response.ok) {
            throw new Error('Failed to fetch rates');
        }
        
        const data = await response.json();
        
        const exchangeRates = {
            'USD': 1,
            'INR': data.rates.INR,
            'EUR': data.rates.EUR,
            'GBP': data.rates.GBP,
            'JPY': data.rates.JPY,
            'AUD': data.rates.AUD
        };
        
        localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates));
        localStorage.setItem('lastRateUpdate', new Date().toISOString());
        
        console.log('Exchange rates updated successfully:', exchangeRates);
        
        return true;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return false;
    }
}

// Call this on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCurrencySymbols();
    
    // Check if rates need update (older than 1 hour)
    const lastUpdate = localStorage.getItem('lastRateUpdate');
    if (!lastUpdate) {
        fetchExchangeRates(); // Fetch on first load
    } else {
        const now = new Date();
        const lastUpdateDate = new Date(lastUpdate);
        const diffHours = (now - lastUpdateDate) / (1000 * 60 * 60);
        
        if (diffHours >= 1) {
            fetchExchangeRates(); // Fetch if older than 1 hour
        }
    }
});

// Export functions for use in other files
if (typeof window !== 'undefined') {
    window.convertAmount = convertAmount;
    window.formatCurrency = formatCurrency;
    window.formatCurrencyInt = formatCurrencyInt;
    window.formatCurrencyWithCommas = formatCurrencyWithCommas;
    window.getCurrencySymbol = getCurrencySymbol;
    window.getUserCurrency = getUserCurrency;
    window.fetchExchangeRates = fetchExchangeRates;
}


