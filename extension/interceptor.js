// Intercept clipboard writes from the page context to capture Chess.com PGN exports
(function() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        const originalWriteText = navigator.clipboard.writeText;
        navigator.clipboard.writeText = function(text) {
            if (text && text.includes('[Event ')) {
                window.postMessage({ type: 'MASTERMIND_PGN_COPIED', pgn: text }, '*');
            }
            return originalWriteText.apply(this, arguments);
        };
    }
})();
