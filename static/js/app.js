// --- SPA Navigation ---
function showSection(id) {
  document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = '';
}

// // --- Dummy Receipt Display ---
// function showDummyReceipt() {
//   const data = JSON.parse(localStorage.getItem('dummy_receipt') || '{}');
//   if (!data || !data.Items) {
//     alert('No dummy data found!');
//     return;
//   }
//   let html = `<h2 style="text-align:center;">${data['Shop name'] || 'Shop'}</h2>`;
//   html += '<ul style="list-style:none;padding:0;">';
//   Object.entries(data.Items).forEach(([name, price]) => {
//     html += `<li style="display:flex;justify-content:space-between;padding:0.5em 0;border-bottom:1px solid #eee;">
//       <span>${name}</span>
//       <span style="color:#059669;font-weight:600;">$${Number(price).toFixed(2)}</span>
//     </li>`;
//   });
//   html += '</ul>';
//   html += `<div style="text-align:right;font-size:1.2em;margin-top:1em;"><b>Total:</b> $${Number(data.Total).toFixed(2)}</div>`;
//   showSection('result-section');
//   const resultList = document.getElementById('result-list');
//   resultList.innerHTML = html;
// }

// // Add demo button to home section
// const homeSection = document.getElementById('home-section');
// if (homeSection) {
//   const btn = document.createElement('button');
//   btn.textContent = 'Show Dummy Receipt';
//   btn.className = 'btn';
//   btn.style.marginTop = '2rem';
//   btn.onclick = showDummyReceipt;
//   homeSection.appendChild(btn);
// }

// --- Home Section ---
const plusBtn = document.getElementById('plusBtn');
if (plusBtn) {
  plusBtn.onclick = function() {
    showSection('upload-section');
  };
}

// --- Upload Section ---
(function() {
  const uploadSection = document.getElementById('upload-section');
  if (!uploadSection) return;

  // File input logic
  const fileInput = document.getElementById('receipt-upload');
  const fileInfo = document.getElementById('selected-file-info');
  const fileNameSpan = document.getElementById('file-name');
  const filePreview = document.getElementById('file-preview');
  const removeFileBtn = document.getElementById('remove-file-btn');
  let selectedFile = null;

  function resetFileInput() {
    fileInput.value = '';
    fileInfo.style.display = 'none';
    filePreview.style.display = 'none';
    fileNameSpan.textContent = '';
    selectedFile = null;
  }

  fileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    fileInfo.style.display = 'flex';
    fileNameSpan.textContent = file.name;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        filePreview.src = ev.target.result;
        filePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      filePreview.style.display = 'none';
    }
  };
  if (removeFileBtn) {
    removeFileBtn.onclick = resetFileInput;
  }
  document.getElementById('upload-area').onclick = function() {
    fileInput.click();
  };

  // Tag input logic
  let payerTags = [];
  let participantTags = [];
  function renderTags(containerId, tags, removeFn) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    tags.forEach((tag, idx) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = tag;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-tag';
      removeBtn.innerHTML = '&times;';
      removeBtn.onclick = () => removeFn(idx);
      tagEl.appendChild(removeBtn);
      container.appendChild(tagEl);
    });
  }
  function addPayerTag(name) {
    name = name.trim();
    if (name && !payerTags.includes(name)) {
      payerTags.push(name);
      renderTags('payer-tags', payerTags, removePayerTag);
    }
  }
  function removePayerTag(idx) {
    payerTags.splice(idx, 1);
    renderTags('payer-tags', payerTags, removePayerTag);
  }
  function addParticipantTag(name) {
    name = name.trim();
    if (name && !participantTags.includes(name)) {
      participantTags.push(name);
      renderTags('participant-tags', participantTags, removeParticipantTag);
    }
  }
  function removeParticipantTag(idx) {
    participantTags.splice(idx, 1);
    renderTags('participant-tags', participantTags, removeParticipantTag);
  }
  const payerInputTag = document.getElementById('payer-input-tag');
  if (payerInputTag) {
    payerInputTag.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        addPayerTag(this.value);
        this.value = '';
        e.preventDefault();
      }
    });
  }
  const participantInputTag = document.getElementById('participant-input-tag');
  if (participantInputTag) {
    participantInputTag.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        addParticipantTag(this.value);
        this.value = '';
        e.preventDefault();
      }
    });
  }

  // Continue button logic
  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.onclick = function() {
      // Validate
      if (payerTags.length === 0) {
        alert('Please enter at least one payer.');
        return;
      }
      if (participantTags.length === 0) {
        alert('Please enter at least one participant.');
        return;
      }
      // 构造表单数据
      const formData = new FormData();
      formData.append('payer', payerTags[0]); // 只取第一个payer
      participantTags.forEach(s => formData.append('spliters', s));
      // 如果你想上传图片，可以加上
      // if (selectedFile) formData.append('file', selectedFile);
    
      // 发送POST请求到后端
      fetch('/process_upload', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (res.redirected) {
          window.location.href = res.url; // 跳转到后端返回的页面
        } else {
          res.text().then(alert);
        }
      });
    };
  }
})();

// --- Split Section ---
(function() {
  const splitSection = document.getElementById('split-section');
  if (!splitSection) return;
  // Load OCR items from localStorage
  const items = JSON.parse(localStorage.getItem('ocr_items') || '[]');
  // Load participants from localStorage
  const participants = JSON.parse(localStorage.getItem('usernames') || '[]');
  const itemsList = document.getElementById('items-list');
  // Render items with participant assignment checkboxes
  function renderItems() {
    itemsList.innerHTML = '';
    items.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'item-row';
      let checkboxes = participants.map(name =>
        `<label style="margin-right:1em;">
          <input type="checkbox" class="assign-checkbox" data-idx="${idx}" value="${name}"> ${name}
        </label>`
      ).join('');
      div.innerHTML = `
        <div class="item-name">${item.name} <span class="item-price">($${item.price})</span></div>
        <div>${checkboxes}</div>
      `;
      itemsList.appendChild(div);
    });
  }
  renderItems();
  // Handle form submission
  document.getElementById('items-form').onsubmit = function(e) {
    e.preventDefault();
    // Use participants from localStorage
    const assignments = items.map((item, idx) => {
      const checked = Array.from(document.querySelectorAll(`.assign-checkbox[data-idx='${idx}']:checked`));
      const assigned = checked.map(cb => cb.value);
      return {
        name: item.name,
        price: item.price,
        assigned
      };
    });
    // Simulate backend split calculation
    const perUser = {};
    assignments.forEach(item => {
      item.assigned.forEach(u => {
        if (!perUser[u]) perUser[u] = 0;
        perUser[u] += item.price / (item.assigned.length || 1);
      });
    });
    const result = Object.entries(perUser).map(([name, total]) => ({ name, total }));
    localStorage.setItem('split_result', JSON.stringify(result));
    showSection('result-section');
    renderResult();
  };
  // Show participants as tags above the form
  const usernamesInput = document.getElementById('usernames');
  if (usernamesInput) {
    usernamesInput.value = participants.join(', ');
    usernamesInput.readOnly = true;
    usernamesInput.style.background = '#f3f4f6';
    usernamesInput.style.color = '#888';
  }
})();

// --- Result Section ---
function renderResult() {
  const list = document.getElementById('result-list');
  if (!list) return;
  let result = [];
  try {
    result = JSON.parse(localStorage.getItem('split_result') || '[]');
  } catch (e) {}
  if (!Array.isArray(result)) result = [];
  list.innerHTML = '';
  if (result.length === 0) {
    list.innerHTML = '<li style="text-align:center;color:#888;">No result data found.</li>';
  } else {
    result.forEach(({ name, total }) => {
      const li = document.createElement('li');
      li.className = 'result-item';
      li.innerHTML = `<span class="user-name">${name}</span><span class="user-total">$${Number(total).toFixed(2)}</span>`;
      list.appendChild(li);
    });
  }
}
// If result section is shown, render result
if (document.getElementById('result-section')) {
  renderResult();
}
