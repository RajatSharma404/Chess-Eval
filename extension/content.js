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

    mastermindBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let gameUrl = window.location.href;
        
        // Visual feedback
        const originalText = mastermindBtn.innerHTML;
        mastermindBtn.innerHTML = '⏳ EXTRACTING PGN...';
        mastermindBtn.style.pointerEvents = 'none';
        
        let extractedPgn = null;

        try {
            if (gameUrl.includes('chess.com')) {
                try {
                    // Clipboard interceptor is now loaded at document_start via manifest.json (interceptor.js)
                    // so we don't dynamically inject inline scripts and trigger CSP violations.
                    
                    let pgnFromClipboard = null;
                    const messageListener = (event) => {
                        if (event.data && event.data.type === 'MASTERMIND_PGN_COPIED') {
                            pgnFromClipboard = event.data.pgn;
                        }
                    };
                    window.addEventListener('message', messageListener);

                    // Step 1: Click the share button
                    const shareBtn = document.querySelector('button[aria-label="Share"]') || 
                                     document.querySelector('.icon-font-chess.share')?.closest('button') || 
                                     document.querySelector('.share')?.closest('button') ||
                                     document.querySelector('[data-cy="share-button"]');
                    
                    if (shareBtn) {
                        console.log("MasterMind: Found Share button, clicking...");
                        shareBtn.click();
                        
                        // Wait for modal to appear (poll up to 2s)
                        for(let i = 0; i < 20; i++) {
                            await new Promise(r => setTimeout(r, 100));
                            if (document.querySelector('.share-menu-modal, .share-menu-component, [aria-label="Share Menu"], .modal-container, .board-modal-container')) {
                                break;
                            }
                        }
                        
                        // Step 2: Click on the PGN tab (poll up to 1.5s)
                        for(let i = 0; i < 15; i++) {
                            const tabs = Array.from(document.querySelectorAll('button, [role="tab"], .share-menu-tab, .board-tabs-tab, .share-menu-tab-component, .tab-component'));
                            const pgnTab = tabs.find(el => el.textContent.trim().toUpperCase() === 'PGN' || el.innerText?.trim() === 'PGN');
                            
                            if (pgnTab) {
                                console.log("MasterMind: Found PGN tab, clicking...");
                                pgnTab.click();
                                await new Promise(r => setTimeout(r, 500)); // wait for tab content to render
                                break;
                            }
                            await new Promise(r => setTimeout(r, 100));
                        }
                        
                        // Step 3: Trigger Copy buttons and intercept
                        const modalContainers = document.querySelectorAll('.share-menu-modal, .modal-container, .board-modal-container, .share-menu-component');
                        if (modalContainers.length > 0) {
                            const copyBtns = modalContainers[0].querySelectorAll('button');
                            for (let btn of copyBtns) {
                                if (btn.className.includes('copy') || btn.getAttribute('aria-label')?.toLowerCase().includes('copy') || btn.querySelector('.icon-font-chess.copy')) {
                                    console.log("MasterMind: Clicking copy button to trigger clipboard interceptor...");
                                    btn.click();
                                }
                            }
                        }

                        // Poll for intercepted clipboard text (up to 1.5s)
                        for(let i = 0; i < 15; i++) {
                            if (pgnFromClipboard) {
                                extractedPgn = pgnFromClipboard;
                                break;
                            }
                            await new Promise(r => setTimeout(r, 100));
                        }
                        
                        // If clipboard intercept failed, try fallback DOM extraction
                        if (!extractedPgn) {
                            console.log("MasterMind: Clipboard intercept missed, falling back to direct DOM text extraction...");
                            // Next, try to find a textarea containing the PGN
                            const textareas = document.querySelectorAll('textarea');
                            for (let ta of textareas) {
                                if (ta.value && ta.value.includes('[Event ') && ta.value.includes('[Site ')) {
                                    extractedPgn = ta.value;
                                    break;
                                }
                            }
                            
                            // Finally, check if it's rendered as text inside a div/span
                            if (!extractedPgn) {
                                const pgnElements = Array.from(document.querySelectorAll('div, span, p')).filter(el => 
                                    el.innerText && el.innerText.includes('[Event "') && el.innerText.includes('1.') // MUST include moves '1.' so it doesn't truncate!
                                );
                                if (pgnElements.length > 0) {
                                    pgnElements.sort((a, b) => a.innerText.length - b.innerText.length);
                                    extractedPgn = pgnElements[0].innerText;
                                }
                            }
                        }
                        
                        console.log("MasterMind: Extracted PGN successfully?", !!extractedPgn);
                        
                        // Close the modal to clean up UI
                        const closeBtn = document.querySelector('button[aria-label="Close"]') || 
                                         document.querySelector('.icon-font-chess.x')?.closest('button') ||
                                         document.querySelector('.close-button');
                        if (closeBtn) closeBtn.click();
                    } else {
                        console.log("MasterMind: Share button not found in DOM");
                    }

                    window.removeEventListener('message', messageListener);
                } catch (domErr) {
                    console.error("DOM Extraction Error:", domErr);
                }

                // Fallback to network fetch if DOM automation fails
                if (!extractedPgn) {
                    let fetchUrl = gameUrl.split('?')[0]; // Remove query params
                    fetchUrl = fetchUrl.replace('/analysis/game/', '/game/'); // Convert analysis URL to standard game URL
                    
                    const response = await fetch(fetchUrl);
                    const html = await response.text();
                    
                    // Parse the embedded PGN from the authenticated HTML response
                    const pgnMatch = html.match(/"pgn":"([^"]+)"/);
                    if (pgnMatch && pgnMatch[1]) {
                        extractedPgn = pgnMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    }
                }
            } else if (gameUrl.includes('lichess.org')) {
                const lichessMatch = gameUrl.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
                if (lichessMatch) {
                    const response = await fetch(`https://lichess.org/game/export/${lichessMatch[1]}`, {
                        headers: { "Accept": "application/x-chess-pgn" }
                    });
                    if (response.ok) extractedPgn = await response.text();
                }
            }
        } catch (err) {
            console.error("MasterMind PGN Extraction Error:", err);
        }

        mastermindBtn.innerHTML = originalText;
        mastermindBtn.style.pointerEvents = 'auto';

        // Redirect to local MasterMind with either the raw PGN or fallback URL
        if (extractedPgn) {
            // Encode the raw PGN directly into the URL
            window.open(`http://localhost:3003/?pgn=${encodeURIComponent(extractedPgn)}`, '_blank');
        } else {
            // Fallback to URL method
            window.open(`http://localhost:3003/?url=${encodeURIComponent(gameUrl)}`, '_blank');
        }
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
