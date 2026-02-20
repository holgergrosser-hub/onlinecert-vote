import './style.css';

// !!! WICHTIG: Diese URL nach Google Apps Script Deployment ersetzen !!!
const BACKEND_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

// Badge data
const badges = [
  {
    id: 'badge1',
    title: 'Design 1 - Der Klassiker',
    description: 'Dunkel-elegantes Design mit kreisförmigem Haken. Moderne Typografie mit klarem Kontrast.',
    image: '/badge1.png'
  },
  {
    id: 'badge2',
    title: 'Design 2 - Das Siegel',
    description: 'Komplett in OnlineCert-Blau. Klassische Siegel-Optik mit rundem Design.',
    image: '/badge2.png'
  }
];

// Check if user has already voted (using cookie)
function hasVoted() {
  return document.cookie.includes('badge_voted=true');
}

// Set voted cookie (expires in 30 days)
function setVotedCookie() {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  document.cookie = `badge_voted=true; expires=${expires.toUTCString()}; path=/`;
}

// Get current vote results from backend
async function getVotes() {
  try {
    const response = await fetch(`${BACKEND_URL}?action=getResults`);
    const data = await response.json();
    return {
      badge1: data.badge1 || 0,
      badge2: data.badge2 || 0,
      total: data.total || 0,
      userVoted: hasVoted()
    };
  } catch (error) {
    console.error('Error fetching votes:', error);
    return { badge1: 0, badge2: 0, total: 0, userVoted: hasVoted() };
  }
}

// Submit vote to backend
async function submitVote(badgeId) {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body: new URLSearchParams({
        action: 'vote',
        badge: badgeId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setVotedCookie();
      return true;
    } else {
      alert(data.message || 'Fehler beim Abstimmen');
      return false;
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    alert('Fehler beim Abstimmen. Bitte versuchen Sie es später erneut.');
    return false;
  }
}

// Handle vote
async function handleVote(badgeId) {
  if (hasVoted()) {
    alert('Sie haben bereits abgestimmt! Vielen Dank für Ihre Teilnahme.');
    return;
  }
  
  // Show loading state
  const btn = document.querySelector(`[data-vote="${badgeId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Wird abgestimmt...';
  }
  
  const success = await submitVote(badgeId);
  
  if (success) {
    await render();
  } else {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Für dieses Design stimmen';
    }
  }
}

// Share functions
function shareLinkedIn() {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent('🥊 Badge Battle! Welches ISO 9001 Design soll es werden? Stimmen Sie jetzt ab!');
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, '_blank');
}

function shareWhatsApp() {
  const text = encodeURIComponent('🥊 Badge Battle! Welches ISO 9001 Design soll es werden? Jetzt abstimmen: ' + window.location.href);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareEmail() {
  const subject = encodeURIComponent('Badge Battle - ISO 9001 Design Abstimmung');
  const body = encodeURIComponent(`Hallo,\n\nhelfen Sie uns bei der Auswahl des besten ISO 9001 Badge-Designs!\n\nJetzt abstimmen: ${window.location.href}\n\nViele Grüße\nOnlineCert Team`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// Render the page
async function render() {
  const votes = await getVotes();
  const totalVotes = votes.total;
  const hasVoted = votes.userVoted;
  
  const app = document.querySelector('#app');
  
  app.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>🥊 Badge Battle 2025</h1>
        <p>Welches ISO 9001 Zertifikat-Badge soll das offizielle OnlineCert-Design werden? Ihre Stimme entscheidet!</p>
      </div>
      
      <div class="badges-grid">
        ${badges.map(badge => {
          const userVotedThis = hasVoted && document.cookie.includes(`voted_for=${badge.id}`);
          return `
            <div class="badge-card ${userVotedThis ? 'voted' : ''}" data-badge="${badge.id}">
              <h3 class="badge-title">${badge.title}</h3>
              <img src="${badge.image}" alt="${badge.title}" class="badge-image" />
              <p class="badge-description">${badge.description}</p>
              <button 
                class="vote-btn" 
                data-vote="${badge.id}"
                ${hasVoted ? 'disabled' : ''}
              >
                ${hasVoted ? (userVotedThis ? '✓ Ihre Stimme' : 'Nicht gewählt') : 'Für dieses Design stimmen'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
      
      ${totalVotes > 0 ? `
        <div class="results">
          <h2>📊 Aktueller Stand</h2>
          ${badges.map(badge => {
            const voteCount = votes[badge.id];
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isWinner = voteCount === Math.max(votes.badge1, votes.badge2) && voteCount > 0 && votes.badge1 !== votes.badge2;
            
            return `
              <div class="result-item">
                <div class="result-header">
                  <span>${badge.title}</span>
                  <span>${voteCount} Stimme${voteCount !== 1 ? 'n' : ''} (${percentage}%)</span>
                </div>
                <div class="result-bar">
                  <div class="result-fill ${isWinner ? 'winner' : ''}" style="width: ${percentage}%">
                    ${percentage > 15 ? `${percentage}%` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
          <p style="text-align: center; margin-top: 20px; color: var(--text-light);">
            Gesamt: ${totalVotes} Stimme${totalVotes !== 1 ? 'n' : ''}
          </p>
        </div>
      ` : '<p style="text-align: center; color: var(--text-light); margin: 40px 0;">Seien Sie der Erste, der abstimmt!</p>'}
      
      <div class="share-section">
        <h3>📢 Teilen Sie die Abstimmung!</h3>
        <p style="color: var(--text-light); margin-bottom: 20px;">
          Je mehr mitmachen, desto aussagekräftiger wird das Ergebnis!
        </p>
        <div class="share-buttons">
          <button class="share-btn linkedin" id="share-linkedin">
            Auf LinkedIn teilen
          </button>
          <button class="share-btn whatsapp" id="share-whatsapp">
            Per WhatsApp teilen
          </button>
          <button class="share-btn email" id="share-email">
            Per E-Mail teilen
          </button>
        </div>
      </div>
      
      <div class="footer">
        <p>
          Eine Initiative von <a href="https://onlinecert.info" target="_blank">OnlineCert</a> 
          - Ihre schnelle & transparente ISO-Zertifizierung
        </p>
        <p style="margin-top: 10px; font-size: 0.9rem;">
          Das Gewinner-Badge wird ab März 2025 allen zertifizierten Unternehmen zur Verfügung gestellt.
        </p>
      </div>
    </div>
  `;
  
  // Add event listeners
  document.querySelectorAll('[data-vote]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const badgeId = e.target.dataset.vote;
      handleVote(badgeId);
    });
  });
  
  document.getElementById('share-linkedin')?.addEventListener('click', shareLinkedIn);
  document.getElementById('share-whatsapp')?.addEventListener('click', shareWhatsApp);
  document.getElementById('share-email')?.addEventListener('click', shareEmail);
}

// Initialize and auto-refresh every 10 seconds
render();
setInterval(() => {
  if (!hasVoted()) {
    render(); // Only refresh if user hasn't voted yet
  }
}, 10000);
