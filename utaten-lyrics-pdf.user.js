// ==UserScript==
// @name         UtaTen Lyrics to PDF
// @namespace    https://github.com/NiIsanDaYo/UtaTen-Lyrics-to-PDF
// @version      1.1
// @description  UtaTenの歌詞をふりがな付きでPDF化（印刷）するスクリプト
// @author       NiIsanDaYo
// @match        https://utaten.com/lyric/*
// @homepageURL  https://github.com/NiIsanDaYo/UtaTen-Lyrics-to-PDF
// @supportURL   https://github.com/NiIsanDaYo/UtaTen-Lyrics-to-PDF/issues
// @downloadURL  https://github.com/NiIsanDaYo/UtaTen-Lyrics-to-PDF/raw/main/utaten-lyrics-pdf.user.js
// @updateURL    https://github.com/NiIsanDaYo/UtaTen-Lyrics-to-PDF/raw/main/utaten-lyrics-pdf.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ボタンを追加する関数
    function addPrintButton() {
        const button = document.createElement('button');
        button.innerText = '歌詞をPDF/印刷';
        button.id = 'utaten-pdf-button'; // IDを追加して管理しやすくする
        button.style.position = 'fixed';
        button.style.top = '70px'; // ヘッダーを避けるために少し下げる
        button.style.right = '20px';
        button.style.zIndex = '99999'; // かなり前面に
        button.style.padding = '12px 24px';
        button.style.backgroundColor = '#ff5b4f';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '30px'; // 丸みを帯びさせる
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
        button.style.fontWeight = 'bold';
        button.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
        button.style.fontSize = '14px';
        button.style.transition = 'all 0.3s ease';

        // ホバー効果
        button.onmouseover = function() {
            button.style.backgroundColor = '#ff3b2f';
            button.style.boxShadow = '0 6px 8px rgba(0,0,0,0.3)';
            button.style.transform = 'translateY(-2px)';
        };
        button.onmouseout = function() {
            button.style.backgroundColor = '#ff5b4f';
            button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
            button.style.transform = 'translateY(0)';
        };

        button.onclick = generatePDF;
        document.body.appendChild(button);
    }

    // メイン処理
    function generatePDF() {
        // 歌詞コンテナを取得 (ふりがな付きのものを優先)
        const lyricsContainer = document.querySelector('.hiragana');
        
        if (!lyricsContainer) {
            alert('歌詞データが見つかりませんでした。');
            return;
        }

        // 歌詞要素をクローン
        const clone = lyricsContainer.cloneNode(true);

        // UtaTenのruby構造 (<span class="ruby"><span class="rb">...</span><span class="rt">...</span></span>) を
        // 標準的なHTMLのrubyタグ (<ruby>...<rt>...</rt></ruby>) に変換
        const rubySpans = clone.querySelectorAll('.ruby');
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

        // タイトルとアーティスト名を取得
        // ページタイトルから解析: "曲名 歌詞 アーティスト名 ふりがな付 - うたてん"
        let title = 'Unknown Title';
        let artist = 'Unknown Artist';
        
        const docTitle = document.title;
        // 一般的な形式: "曲名 歌詞 アーティスト名 ..."
        const titleMatch = docTitle.match(/^(.*?) 歌詞 (.*?) (?:ふりがな|動画)/);
        if (titleMatch) {
            title = titleMatch[1];
            artist = titleMatch[2];
        } else {
            // H1などから取得を試みる
            const h1 = document.querySelector('h1.movieTtl'); // 仮のクラス名、実際のサイトに合わせて調整が必要かも
            if (h1) title = h1.textContent.trim();
        }

        const currentUrl = window.location.href;
        const today = new Date().toLocaleDateString('ja-JP');

        // 印刷用ウィンドウを作成
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
            <title>${title} - ${artist}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap');
                
                body {
                    font-family: "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif;
                    padding: 40px;
                    color: #222;
                    max-width: 800px; /* A4サイズ程度に見やすく */
                    margin: 0 auto;
                    line-height: 1.8;
                }
                .header-container {
                    text-align: center;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 20px;
                }
                h1 {
                    font-size: 36px;
                    margin: 0 0 10px 0;
                    letter-spacing: 2px;
                }
                h2 {
                    font-size: 20px;
                    font-weight: normal;
                    margin: 0;
                    color: #555;
                }
                .lyrics {
                    font-size: 20px;
                    line-height: 2.5; /* 歌詞はゆったりと */
                    white-space: normal;
                    font-weight: 500;
                    text-align: center; /* 歌詞を中央揃えにしてみる（好みによるが） */
                }
                ruby {
                    ruby-position: over;
                }
                rt {
                    font-size: 0.6em;
                    color: #666;
                    margin-bottom: 3px;
                }
                .footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 10px;
                    color: #aaa;
                    text-align: right;
                    font-family: sans-serif;
                }
                .footer a {
                    color: #aaa;
                    text-decoration: none;
                }

                /* 印刷時の設定 */
                @media print {
                    body { 
                        padding: 0; 
                        max-width: 100%;
                    }
                    button { display: none; }
                    .header-container { margin-bottom: 20px; }
                    h1 { font-size: 28px; }
                    .lyrics { font-size: 18px; line-height: 2.2; }
                    @page {
                        margin: 20mm;
                    }
                }
            </style>
            </head>
            <body>
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

                <script>
                    window.onload = function() {
                        setTimeout(() => {
                           window.print();
                        }, 500); // 画像等の読み込み完了を少し待つ
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // ページ読み込み完了後にボタンを追加
    window.addEventListener('load', addPrintButton);
})();
