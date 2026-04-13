(function() {
    'use strict';

    // 印刷用の特殊なスタイルをあらかじめ注入しておく
    function injectPrintStyle() {
        const styleId = 'utaten-pdf-print-style';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
            
            #utaten-print-view {
                display: none; /* 通常のブラウジング時は非表示 */
                font-family: "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
                padding: 40px;
                color: #222;
                max-width: 900px;
                margin: 0 auto;
                line-height: 1.8;
                background-color: white; /* 透過防止 */
            }
            #utaten-print-view .header-container {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
            }
            #utaten-print-view h1 { font-size: 28px; margin: 0 0 10px 0; letter-spacing: 2px; }
            #utaten-print-view h2 { font-size: 18px; font-weight: normal; margin: 0; color: #555; }
            #utaten-print-view .lyrics {
                font-size: 20px;
                line-height: 2.5;
                white-space: normal;
                font-weight: 500;
                text-align: center;
            }
            #utaten-print-view ruby { ruby-position: over; }
            #utaten-print-view rt { font-size: 0.6em; color: #666; margin-bottom: 3px; }
            #utaten-print-view .footer {
                margin-top: 60px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 11px;
                color: #aaa;
                text-align: right;
                font-family: sans-serif;
            }
            
            /* 印刷時のみ適用されるレイアウト */
            @media print {
                /* UtaTenの通常の要素をすべて非表示にする */
                body > *:not(#utaten-print-view) {
                    display: none !important;
                }
                /* 印刷用ビューを表示 */
                #utaten-print-view {
                    display: block !important;
                }
                /* 印刷用の余白設定 */
                @page { margin: 15mm; }
            }
        `;
        document.head.appendChild(style);
    }

    // PDF作成・印刷処理
    // withRuby: true の場合はふりがな（ルビ）あり、false の場合はルビなしになる
    function generatePDF(withRuby) {
        const lyricsContainer = document.querySelector('.hiragana');
        if (!lyricsContainer) {
            alert('歌詞データが見つかりませんでした。');
            return;
        }

        // --- 印刷用インページビューの構築 ---
        let printView = document.getElementById('utaten-print-view');
        if (printView) printView.remove(); // 古いものがあれば削除

        printView = document.createElement('div');
        printView.id = 'utaten-print-view';

        // タイトルとアーティスト名を取得
        let title = 'Unknown Title';
        let artist = 'Unknown Artist';
        
        const titleElem = document.querySelector('.newLyricTitle__main');
        if (titleElem) {
            title = titleElem.childNodes[0].textContent.trim();
        } else {
            // フォールバック: titleタグから抽出
            const docTitle = document.title;
            const titleMatch = docTitle.match(/^(.*?) 歌詞 (.*?) (?:ふりがな|動画)/);
            if (titleMatch) {
                title = titleMatch[1];
                artist = titleMatch[2];
            }
        }
        
        const artistElem = document.querySelector('.newLyricWork__name a') || document.querySelector('.newLyricWork__name');
        if (artistElem && artist === 'Unknown Artist') {
            artist = artistElem.textContent.trim();
        }

        // 歌詞要素をクローン
        const clone = lyricsContainer.cloneNode(true);
        
        // ふりがな（ルビ）の処理
        const rubySpans = clone.querySelectorAll('.ruby');
        if (withRuby) {
            // ルビを標準のHTMLタグに変換して印刷
            rubySpans.forEach(span => {
                const rb = span.querySelector('.rb');
                const rt = span.querySelector('.rt');
                if (rb && rt) {
                    const rubyElem = document.createElement('ruby');
                    rubyElem.appendChild(document.createTextNode(rb.textContent));
                    const rtElem = document.createElement('rt');
                    rtElem.textContent = rt.textContent;
                    rubyElem.appendChild(rtElem);
                    span.parentNode.replaceChild(rubyElem, span);
                }
            });
        } else {
            // ふりがな無し: ルビ自体（rt要素）を破棄し、漢字（rb要素）だけ残す
            rubySpans.forEach(span => {
                const rb = span.querySelector('.rb');
                if (rb) {
                    span.parentNode.replaceChild(document.createTextNode(rb.textContent), span);
                }
            });
        }

        const currentUrl = window.location.href;
        const today = new Date().toLocaleDateString('ja-JP');

        // ビューにHTMLを挿入
        printView.innerHTML = `
            <div class="header-container">
                <h1>${title}</h1>
                <h2>${artist}</h2>
            </div>
            <div class="lyrics">
                ${clone.innerHTML}
            </div>
            <div class="footer">
                Source: <a href="${currentUrl}">${currentUrl}</a><br>
                Printed on: ${today}
            </div>
        `;

        document.body.appendChild(printView);

        // --- 印刷の実行 ---
        // Noto Serifフォント等の読み込みを完全に待機してから印刷ダイアログを開く
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                window.print();
            });
        } else {
            // IE等の古いブラウザ向けフォールバック
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }

    // 初期化処理
    function init() {
        injectPrintStyle();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ポップアップからの実行メッセージを受け取る
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'generatePDF') {
            generatePDF(request.withRuby);
            sendResponse({ success: true });
        }
        return true;
    });
})();
