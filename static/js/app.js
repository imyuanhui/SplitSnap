// Global variables
let currentItems = [];
let currentParticipants = [];

// File upload handling
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
        showMessage('Please select a valid image file (PNG, JPG, JPEG, GIF, BMP, TIFF)', 'error');
        return;
    }

    // Validate file size (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showMessage('File size must be less than 16MB', 'error');
        return;
    }

    uploadReceipt(file);
}

// Upload receipt to server
async function uploadReceipt(file) {
    const formData = new FormData();
    formData.append('receipt', file);

    showLoading(true);
    showProgress();

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            currentItems = data.items;
            displayItems(data.items);
            showMessage('Receipt processed successfully!', 'success');
            document.getElementById('items-section').classList.remove('hidden');
            document.getElementById('participants-section').classList.remove('hidden');
        } else {
            showMessage(data.error || 'Failed to process receipt', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showMessage('Failed to upload receipt. Please try again.', 'error');
    } finally {
        showLoading(false);
        hideProgress();
    }
}

// Display items from receipt
function displayItems(items) {
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';

    if (items.length === 0) {
        itemsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No items found in the receipt.</p>
                <p class="text-sm mt-2">Try uploading a clearer image or manually add items below.</p>
            </div>
        `;
        return;
    }

    items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        itemElement.innerHTML = `
            <div class="item-info">
                <input type="checkbox" 
                       id="item-${index}" 
                       class="item-checkbox" 
                       onchange="updateTotal()"
                       ${item.selected ? 'checked' : ''}>
                <label for="item-${index}" class="item-name">${item.name}</label>
            </div>
            <span class="item-price">$${item.price.toFixed(2)}</span>
        `;
        itemsList.appendChild(itemElement);
    });

    updateTotal();
}

// Update total selected amount
function updateTotal() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    let total = 0;

    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked && currentItems[index]) {
            total += currentItems[index].price;
            currentItems[index].selected = true;
        } else if (currentItems[index]) {
            currentItems[index].selected = false;
        }
    });

    document.getElementById('total-selected').textContent = `$${total.toFixed(2)}`;
}

// Select all items
function selectAllItems() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateTotal();
}

// Deselect all items
function deselectAllItems() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateTotal();
}

// Add participant
function addParticipant() {
    const container = document.getElementById('participants-container');
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant-item';
    participantDiv.innerHTML = `
        <input type="text" 
               placeholder="Enter participant name" 
               class="participant-input">
        <button onclick="removeParticipant(this)" class="remove-participant">×</button>
    `;
    container.appendChild(participantDiv);
}

// Remove participant
function removeParticipant(button) {
    const container = document.getElementById('participants-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
    }
}

// Calculate split
async function calculateSplit() {
    const payer = document.getElementById('payer-input').value.trim();
    const participantInputs = document.querySelectorAll('.participant-input');
    const participants = Array.from(participantInputs)
        .map(input => input.value.trim())
        .filter(name => name.length > 0);

    // Validation
    if (!payer) {
        showMessage('Please enter who paid for the receipt', 'error');
        return;
    }

    if (participants.length === 0) {
        showMessage('Please add at least one participant', 'error');
        return;
    }

    const selectedItems = currentItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
        showMessage('Please select at least one item to split', 'error');
        return;
    }

    // Add payer to participants if not already included
    if (!participants.includes(payer)) {
        participants.push(payer);
    }

    currentParticipants = participants;

    showLoading(true);

    try {
        const response = await fetch('/calculate-split', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: currentItems,
                participants: participants,
                payer: payer
            })
        });

        const data = await response.json();

        if (data.total_amount) {
            displayResults(data);
            showMessage('Split calculated successfully!', 'success');
        } else {
            showMessage(data.error || 'Failed to calculate split', 'error');
        }
    } catch (error) {
        console.error('Calculation error:', error);
        showMessage('Failed to calculate split. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Display split results
function displayResults(data) {
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');

    resultsContent.innerHTML = `
        <!-- Summary -->
        <div class="result-card summary">
            <h3 class="result-title">Split Summary</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Amount:</span>
                    <span class="summary-value">$${data.total_amount}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Split Per Person:</span>
                    <span class="summary-value">$${data.split_per_person}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Participants:</span>
                    <span class="summary-value">${data.participants.length}</span>
                </div>
            </div>
        </div>

        <!-- Selected Items -->
        <div class="result-card items">
            <h3 class="result-title">Selected Items</h3>
            <div class="items-list-result">
                ${data.selected_items.map(item => `
                    <div class="item-result">
                        <span>${item.name}</span>
                        <span class="item-price">$${item.price.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Individual Breakdown -->
        <div class="result-card breakdown">
            <h3 class="result-title">Individual Breakdown</h3>
            <div class="participant-cards">
                ${data.calculations.map(calc => `
                    <div class="participant-card ${calc.status === 'Payer' ? 'payer' : ''}">
                        <div class="participant-info">
                            <span class="participant-name">${calc.name}</span>
                            <span class="participant-status ${calc.status.toLowerCase()}">${calc.status}</span>
                        </div>
                        <div class="participant-amounts">
                            ${calc.owes > 0 ? `<div class="amount-owes">Owes: $${calc.owes}</div>` : ''}
                            ${calc.receives > 0 ? `<div class="amount-receives">Receives: $${calc.receives}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Payment Instructions -->
        <div class="result-card instructions">
            <h3 class="result-title">Payment Instructions</h3>
            <div class="instructions-list">
                ${data.calculations.filter(calc => calc.owes > 0).map(calc => 
                    `<div class="instruction-item">• ${calc.name} should pay $${calc.owes} to ${data.payer}</div>`
                ).join('')}
            </div>
        </div>
    `;

    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Reset application
function resetApp() {
    currentItems = [];
    currentParticipants = [];
    
    // Reset file input
    document.getElementById('receipt-upload').value = '';
    
    // Hide sections
    document.getElementById('items-section').classList.add('hidden');
    document.getElementById('participants-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
    
    // Reset inputs
    document.getElementById('payer-input').value = '';
    document.getElementById('participants-container').innerHTML = `
        <div class="participant-item">
            <input type="text" placeholder="Enter participant name" class="participant-input">
            <button onclick="removeParticipant(this)" class="remove-participant">×</button>
        </div>
    `;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Show progress bar
function showProgress() {
    const progress = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    
    progress.classList.remove('hidden');
    
    // Simulate progress
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
        } else {
            width += Math.random() * 10;
            progressFill.style.width = width + '%';
        }
    }, 200);
}

// Hide progress bar
function hideProgress() {
    const progress = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    
    progressFill.style.width = '100%';
    setTimeout(() => {
        progress.classList.add('hidden');
        progressFill.style.width = '0%';
    }, 500);
}

// Show message
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; margin-left: 1rem; cursor: pointer;">×</button>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// Drag and drop functionality
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('receipt-upload');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight(e) {
        uploadArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload({ target: { files: files } });
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to calculate split
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        calculateSplit();
    }
    
    // Escape to reset
    if (e.key === 'Escape') {
        resetApp();
    }
}); 