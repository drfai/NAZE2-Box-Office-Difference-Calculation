// ==UserScript==
// @name         票房差距实时显示
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  实时显示《哪吒之魔童闹海》、《头脑特工队2》和《狮子王》的票房差距
// @author       Cline
// @match        https://piaofang.maoyan.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let previousDiff = 0;
    let previousLionKingDiff = 0;

    function fetchBoxOffice() {
        return fetch('https://piaofang.maoyan.com/i/globalBox/realtimeRank/anime')
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const script = doc.querySelector('body > script:nth-child(9)');
                if (script) {
                    const scriptContent = script.textContent;
                    const match = scriptContent.match(/var props = (\{.*?\});/);
                    if (match) {
                        const props = JSON.parse(match[1]);
                        const movieList = props.data.detail.list;
                        let nezhaBox = 0;
                        let insideOut2Box = 21200972239;
                        let lionKingBox = 14160042137;

                        movieList.forEach(movie => {
                            const name = movie.movieName;
                            if ('box' in movie) {
                                const box = parseInt(movie.box);
                                if (name.includes('哪吒之魔童闹海')) {
                                    nezhaBox = box;
                                } else if (name.includes('阿凡达')) {
                                    insideOut2Box = box;
                                } else if (name.includes('狮子王1')) {
                                    lionKingBox = box;
                                }
                            }
                        });

                        return {nezhaBox, insideOut2Box, lionKingBox};
                    }
                }
                return {nezhaBox: 0, insideOut2Box: 0, lionKingBox: 0};
            });
    }

    function updateDisplay() {
        fetchBoxOffice().then(({nezhaBox, insideOut2Box, lionKingBox}) => {
            const diff = Math.abs(nezhaBox - insideOut2Box);
            const diffChange = previousDiff - diff;
            const lionKingDiff = Math.abs(nezhaBox - lionKingBox);
            const lionKingDiffChange = previousLionKingDiff - lionKingDiff;

            // 创建或更新显示元素
            let displayDiv = document.getElementById('box-office-diff-display');
            if (!displayDiv) {
                displayDiv = document.createElement('div');
                displayDiv.id = 'box-office-diff-display';
                displayDiv.style.position = 'fixed';
                displayDiv.style.top = '10px';
                displayDiv.style.right = '10px';
                displayDiv.style.zIndex = '9999';
                displayDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
                displayDiv.style.color = 'red';
                displayDiv.style.padding = '10px';
                displayDiv.style.borderRadius = '5px';
                document.body.appendChild(displayDiv);
            }

            let content = `<div style="font-size: 24px; text-align: center;">
                距离哪吒超过阿凡达登顶全球影史票房榜还剩下
                <div style="font-size: 36px; font-weight: bold;">
                    ${(diff / 100000000).toFixed(2)} 亿人民币票房差距
                </div>`;

            if (previousDiff !== 0 && diffChange !== 0) {
                content += `<div style="font-size: 20px;">
                    当前每30秒增速: ${(diffChange / 10000)} 万人民币
                    <br>
                    以此增速${(diff / (diffChange * 2880)).toFixed(2)}天之后登顶
                </div>`;
            }

            content += `<div style="font-size: 24px; margin-top: 20px;">
                距离哪吒冲进全球影史票房榜第七还差:
                <div style="font-size: 36px; font-weight: bold;">
                    ${(lionKingDiff / 100000000).toFixed(2)} 亿人民币
                </div>`;

            if (previousLionKingDiff !== 0 && lionKingDiffChange !== 0) {
                content += `<div style="font-size: 20px;">
                    以此增速${(lionKingDiff / (lionKingDiffChange * 2880)).toFixed(2)}天之后冲进第七
                </div>`;
            }

            displayDiv.innerHTML = content;

            previousDiff = diff;
            previousLionKingDiff = lionKingDiff;
        });
    }

    // 每30秒更新一次
    setInterval(updateDisplay, 30000);
    updateDisplay();
})();
