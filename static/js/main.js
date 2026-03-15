// ── AuctionGera Main JS ──────────────────────────────────────────────────────

// Auto-dismiss flash messages after 5s
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.flash').forEach(el => {
    setTimeout(() => el.remove(), 5000);
  });

  // Initialize all countdowns on the page
  document.querySelectorAll('[data-countdown]').forEach(el => {
    startCountdown(el);
  });
});

// ── Countdown Timer ──────────────────────────────────────────────────────────
function startCountdown(el) {
  const endTime   = new Date(el.dataset.end   + 'Z');   // UTC from server
  const startTime = new Date(el.dataset.start + 'Z');
  const statusEl  = el.closest('[data-auction-id]');

  function tick() {
    const now  = new Date();
    const diff = endTime - now;
    const toStart = startTime - now;

    if (toStart > 0) {
      // Upcoming
      renderCountdown(el, toStart, 'Starts in');
      return;
    }

    if (diff <= 0) {
      el.innerHTML = '<span style="color:var(--text-muted);font-weight:600;">Auction Ended</span>';
      if (statusEl) statusEl.querySelector('.status-badge')?.classList.remove('status-live');
      return;
    }

    renderCountdown(el, diff, 'Ends in');
  }

  tick();
  setInterval(tick, 1000);
}

function renderCountdown(el, ms, label) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000)  / 60000);
  const s = Math.floor((ms % 60000)    / 1000);

  if (el.classList.contains('countdown-grid')) {
    el.innerHTML = `
      ${d > 0 ? `<div class="cd-unit"><span class="cd-num">${pad(d)}</span><span class="cd-lbl">Days</span></div><span class="cd-sep">:</span>` : ''}
      <div class="cd-unit"><span class="cd-num">${pad(h)}</span><span class="cd-lbl">Hrs</span></div>
      <span class="cd-sep">:</span>
      <div class="cd-unit"><span class="cd-num">${pad(m)}</span><span class="cd-lbl">Min</span></div>
      <span class="cd-sep">:</span>
      <div class="cd-unit"><span class="cd-num">${pad(s)}</span><span class="cd-lbl">Sec</span></div>`;
  } else {
    el.innerHTML = `<span class="timer-value">${d > 0 ? `${d}d ` : ''}${pad(h)}:${pad(m)}:${pad(s)}</span>`;
    el.setAttribute('title', label);
  }
}

function pad(n) { return String(n).padStart(2, '0'); }

// ── Auction Detail Live Polling ───────────────────────────────────────────────
let pollInterval = null;

function initAuctionDetail(auctionId) {
  pollInterval = setInterval(() => pollAuction(auctionId), 5000);
}

function pollAuction(auctionId) {
  fetch(`/auction/${auctionId}/status`)
    .then(r => r.json())
    .then(data => {
      // Update price
      const priceEl = document.getElementById('live-price');
      if (priceEl) priceEl.textContent = '$' + formatMoney(data.current_price);

      // Update bid count
      const bidCountEl = document.getElementById('live-bid-count');
      if (bidCountEl) bidCountEl.textContent = data.bid_count + ' bid' + (data.bid_count !== 1 ? 's' : '');

      // Update bid history list
      if (data.recent_bids && data.recent_bids.length > 0) {
        updateBidHistory(data.recent_bids);
      }

      // Handle ended
      if (data.status === 'ended') {
        document.getElementById('bid-form-wrap')?.classList.add('auction-ended');
        const submitBtn = document.querySelector('.bid-submit');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Auction Ended'; }
        clearInterval(pollInterval);
      }
    })
    .catch(() => {});
}

function updateBidHistory(bids) {
  const container = document.getElementById('bid-history-list');
  if (!container) return;
  container.innerHTML = bids.map((b, i) => `
    <div class="bid-item ${i === 0 ? 'bid-item-top' : ''}">
      <span class="bid-item-user">${escHtml(b.bidder)}</span>
      <span class="bid-item-amount">$${formatMoney(b.amount)}</span>
      <span class="bid-item-time">${b.time}</span>
    </div>`).join('');
}

// ── Place Bid ─────────────────────────────────────────────────────────────────
function placeBid(auctionId) {
  const input   = document.getElementById('bid-amount');
  const msgEl   = document.getElementById('bid-message');
  const amount  = parseFloat(input?.value);

  if (!amount || isNaN(amount)) {
    showBidMessage(msgEl, 'error', 'Please enter a valid bid amount.');
    return;
  }

  const btn = document.querySelector('.bid-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Placing bid…'; }

  fetch(`/auction/${auctionId}/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      showBidMessage(msgEl, 'success', data.message);
      document.getElementById('live-price').textContent = '$' + formatMoney(data.new_price);
      document.getElementById('live-bid-count').textContent = data.bid_count + ' bid' + (data.bid_count !== 1 ? 's' : '');
      // Update min bid hint
      const minBid = data.new_price + parseFloat(document.getElementById('bid-increment')?.value || 50);
      const hintEl = document.getElementById('min-bid-hint');
      if (hintEl) hintEl.innerHTML = `Minimum bid: <strong>$${formatMoney(minBid)}</strong>`;
      updateQuickBids(data.new_price, parseFloat(document.getElementById('bid-increment')?.value || 50));
      input.value = '';
    } else {
      showBidMessage(msgEl, 'error', data.message);
    }
  })
  .catch(() => showBidMessage(msgEl, 'error', 'Network error. Please try again.'))
  .finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = 'Place Bid'; }
  });
}

function showBidMessage(el, type, text) {
  if (!el) return;
  el.className = 'bid-message ' + type;
  el.textContent = text;
  setTimeout(() => { el.className = 'bid-message'; el.textContent = ''; }, 5000);
}

function setQuickBid(amount) {
  const input = document.getElementById('bid-amount');
  if (input) input.value = amount;
}

function updateQuickBids(currentPrice, increment) {
  const container = document.getElementById('quick-bids');
  if (!container) return;
  const multiples = [1, 2, 5, 10];
  container.innerHTML = multiples.map(m => {
    const amount = currentPrice + increment * m;
    return `<button class="quick-bid-btn" onclick="setQuickBid(${amount})">+$${formatMoney(increment * m)}</button>`;
  }).join('');
}

// ── Admin helpers ─────────────────────────────────────────────────────────────
function toggleAuction(auctionId, btn) {
  fetch(`/admin/auction/${auctionId}/toggle`, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      btn.textContent = data.is_active ? 'Deactivate' : 'Activate';
      btn.className   = data.is_active ? 'btn btn-sm btn-ghost' : 'btn btn-sm btn-success';
    });
}

function confirmDelete(auctionId, title) {
  if (confirm(`Delete auction "${title}"? This cannot be undone.`)) {
    document.getElementById(`delete-form-${auctionId}`).submit();
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatMoney(n) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
