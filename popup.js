document.addEventListener('DOMContentLoaded', () => {
    const btnRuby = document.getElementById('btn-ruby');
    const btnNoRuby = document.getElementById('btn-noruby');
    const status = document.getElementById('status');

    function sendToContentScript(withRuby) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0] || !tabs[0].url.includes('utaten.com/lyric')) {
                status.textContent = 'UtaTenの歌詞ページを開いてください';
                return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { action: 'generatePDF', withRuby: withRuby }, (response) => {
                if (chrome.runtime.lastError) {
                    status.textContent = 'ページのロード完了をお待ちください';
                } else if (response && response.success) {
                    window.close(); // 成功したらポップアップを閉じる
                }
            });
        });
    }

    btnRuby.addEventListener('click', () => sendToContentScript(true));
    btnNoRuby.addEventListener('click', () => sendToContentScript(false));
});
