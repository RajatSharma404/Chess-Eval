let mastermindBtn = null;
let gameFinished = false;

function createMasterMindButton() {
    if (document.getElementById('mastermind-extension-btn')) return;

    mastermindBtn = document.createElement('button');
    mastermindBtn.id = 'mastermind-extension-btn';
    mastermindBtn.innerHTML = '🧠 Analyze in MasterMind';
    mastermindBtn.style.cssText = `
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
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: none;
    `;

    mastermindBtn.onmouseover = () => {
        mastermindBtn.style.transform = gameFinished ? 'translate(-50%, -50%) scale(1.05)' : 'translateY(-5px) scale(1.02)';
        mastermindBtn.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.6)';
    };
    mastermindBtn.onmouseout = () => {
        mastermindBtn.style.transform = gameFinished ? 'translate(-50%, -50%) scale(1)' : 'translateY(0) scale(1)';
        mastermindBtn.style.boxShadow = gameFinished ? '0 0 50px rgba(16, 185, 129, 0.8)' : '0 10px 30px rgba(16, 185, 129, 0.4)';
    };

    mastermindBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let gameUrl = window.location.href;
        window.open(`http://localhost:3003/?url=${encodeURIComponent(gameUrl)}`, '_blank');
    };

    document.body.appendChild(mastermindBtn);
}

function checkGameState() {
    const isChessCom = window.location.href.includes('chess.com');
    const isLichess = window.location.href.includes('lichess.org');

    if (!isChessCom && !isLichess) return;

    if (!mastermindBtn) createMasterMindButton();

    // Check if game is over
    let isGameOver = false;

    if (isChessCom) {
        // Look for common game-over modals or result strings
        isGameOver = !!document.querySelector('.game-over-modal-content, .game-over-dialog-content, .game-result-wrapper, .daily-game-footer-game-over');
    } else if (isLichess) {
        // Look for the result wrap which only appears when the game is over
        const resultWrap = document.querySelector('.result-wrap .result');
        isGameOver = resultWrap && resultWrap.innerText.trim() !== '';
    }

    if (isGameOver && !gameFinished) {
        gameFinished = true;
        // Game just finished! Move the button to the center and make it huge
        mastermindBtn.innerHTML = '✨ Game Over! Analyze with MasterMind ✨';
        mastermindBtn.style.display = 'block';
        mastermindBtn.style.bottom = '50%';
        mastermindBtn.style.right = '50%';
        mastermindBtn.style.transform = 'translate(50%, 50%) scale(1.2)';
        mastermindBtn.style.padding = '24px 36px';
        mastermindBtn.style.fontSize = '18px';
        mastermindBtn.style.boxShadow = '0 0 50px rgba(16, 185, 129, 0.8)';
        mastermindBtn.style.animation = 'pulse 2s infinite';
        
        // Add a pulsing animation dynamically if not present
        if (!document.getElementById('mastermind-pulse')) {
            const style = document.createElement('style');
            style.id = 'mastermind-pulse';
            style.innerHTML = `
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `;
            document.head.appendChild(style);
        }
    } else if (!isGameOver) {
        // Game is ongoing, show standard bottom right button
        gameFinished = false;
        mastermindBtn.style.display = 'block';
        mastermindBtn.innerHTML = '🧠 Analyze in MasterMind';
        mastermindBtn.style.bottom = '24px';
        mastermindBtn.style.right = '24px';
        mastermindBtn.style.transform = 'translateY(0) scale(1)';
        mastermindBtn.style.padding = '16px 24px';
        mastermindBtn.style.fontSize = '14px';
        mastermindBtn.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
        mastermindBtn.style.animation = 'none';
    }
}

// Check every 1 second
setInterval(checkGameState, 1000);
