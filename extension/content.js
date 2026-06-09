function addMasterMindButton() {
    if (document.getElementById('mastermind-extension-btn')) return;

    // Check if we are on a game page
    const isChessComGame = window.location.href.includes('chess.com/game/live') || window.location.href.includes('chess.com/analysis/game');
    const isLichessGame = window.location.href.match(/lichess\.org\/[a-zA-Z0-9]{8,}/);

    if (!isChessComGame && !isLichessGame) return;

    const btn = document.createElement('button');
    btn.id = 'mastermind-extension-btn';
    btn.innerHTML = '🧠 Analyze in MasterMind';
    btn.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: #10B981;
        color: #000;
        font-size: 14px;
        font-weight: 900;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 16px 24px;
        border-radius: 16px;
        border: 2px solid rgba(255,255,255,0.2);
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    btn.onmouseover = () => {
        btn.style.transform = 'translateY(-5px) scale(1.02)';
        btn.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.6)';
    };
    btn.onmouseout = () => {
        btn.style.transform = 'translateY(0) scale(1)';
        btn.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
    };

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let gameUrl = window.location.href;
        
        // Redirect to local MasterMind with URL parameter
        window.open(`http://localhost:3003/?url=${encodeURIComponent(gameUrl)}`, '_blank');
    };

    document.body.appendChild(btn);
}

// Check periodically since both sites are Single Page Applications (SPAs)
setInterval(addMasterMindButton, 2000);
addMasterMindButton();
