// 効果音ファイルのパス
const soundFiles = [
    'sounds/dice1.mp3',
    'sounds/dice2.mp3',
    'sounds/dice3.mp3',
    'sounds/dice4.mp3'
];

const freezeStartSound = 'sounds/freeze_start.mp3';   
const freezeImpactSound = 'sounds/freeze_impact.mp3'; 

// DOM要素の取得
const rollButton = document.getElementById('roll-button');
const resetStatsButton = document.getElementById('reset-stats-button');
const diceElements = [
    document.getElementById('dice1'),
    document.getElementById('dice2'),
    document.getElementById('dice3')
];
const resultText = document.getElementById('result-text');
const totalCountElement = document.getElementById('total-count');
const statsBody = document.getElementById('stats-body');
const freezeOverlay = document.getElementById('freeze-overlay');
const freezeWord = document.getElementById('freeze-word');

// 役の定義・カウント・理論上の出現確率
let roles = [
    { key: 'special777', name: '777（特殊役）', count: 0, prob: '1.00%' }, 
    { key: 'pinzoro',    name: 'ピンゾロ',       count: 0, prob: '0.45%' },  
    { key: 'zoro6',      name: '6のゾロ目',      count: 0, prob: '0.45%' },
    { key: 'zoro5',      name: '5のゾロ目',      count: 0, prob: '0.45%' },
    { key: 'zoro4',      name: '4のゾロ目',      count: 0, prob: '0.45%' },
    { key: 'zoro3',      name: '3のゾロ目',      count: 0, prob: '0.45%' },
    { key: 'zoro2',      name: '2のゾロ目',      count: 0, prob: '0.45%' },
    { key: 'shigoro',    name: 'シゴロ(4-5-6)',  count: 0, prob: '2.72%' },  
    { key: 'normal_me6', name: '6の目',          count: 0, prob: '6.81%' },  
    { key: 'normal_me5', name: '5の目',          count: 0, prob: '6.81%' },
    { key: 'normal_me4', name: '4の目',          count: 0, prob: '6.81%' },
    { key: 'normal_me3', name: '3の目',          count: 0, prob: '6.81%' },
    { key: 'normal_me2', name: '2の目',          count: 0, prob: '6.81%' },
    { key: 'normal_me1', name: '1の目',          count: 0, prob: '6.81%' },
    { key: 'menashi',    name: '目なし',         count: 0, prob: '43.56%' }, 
    { key: 'hifumi',     name: 'ヒフミ(1-2-3)',  count: 0, prob: '2.72%' },  
    { key: 'shonben',    name: '場外',           count: 0, prob: '2.00%' }   
];

let totalRolls = 0;

// 出目に応じてサイコロのドット、または「7」「外」を切り替える関数
function renderDice(element, value) {
    element.innerHTML = ''; 
    element.removeAttribute('data-value');
    
    element.style.display = ''; 
    element.style.backgroundColor = '#fff'; 
    element.style.color = '';
    element.style.fontSize = '';
    element.style.fontWeight = '';
    element.textContent = '';   

    if (value === '-') {
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.fontSize = '2.5rem';
        element.style.color = '#333';
        element.textContent = '-';
        return;
    }

    if (value === '外') {
        element.setAttribute('data-value', 'shonben');
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.backgroundColor = '#555'; 
        element.style.color = '#fff';
        element.style.fontSize = '1.8rem';
        element.style.fontWeight = 'bold';
        element.textContent = '外';
        return;
    }

    if (value === 7) {
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.color = '#d9534f'; 
        element.style.fontSize = '2.8rem';
        element.style.fontWeight = 'bold';
        element.textContent = '7';
        return;
    }

    element.style.display = 'grid'; 
    element.setAttribute('data-value', value);

    let dots = [];
    if (value === 1) {
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        dots = ['cc'];
    }
    else if (value === 2) dots = ['tl', 'br'];
    else if (value === 3) dots = ['tl', 'cc', 'br'];
    else if (value === 4) dots = ['tl', 'tr', 'bl', 'br'];
    else if (value === 5) dots = ['tl', 'tr', 'cc', 'bl', 'br'];
    else if (value === 6) dots = ['tl', 'tr', 'cl', 'cr', 'bl', 'br'];

    dots.forEach(pos => {
        const span = document.createElement('span');
        span.className = `dot ${pos}`;
        element.appendChild(span);
    });
}

// LocalStorage からデータを読み込む関数
function loadGameData() {
    const savedTotalRolls = localStorage.getItem('chinchiro_total_rolls');
    if (savedTotalRolls !== null) {
        totalRolls = parseInt(savedTotalRolls, 10);
    }

    const savedRoles = localStorage.getItem('chinchiro_roles');
    if (savedRoles !== null) {
        const parsedRoles = JSON.parse(savedRoles);
        roles.forEach(role => {
            if (parsedRoles[role.key] !== undefined) {
                role.count = parsedRoles[role.key];
            }
        });
    }

    updateUI();
}

// LocalStorage へデータを保存する関数
function saveGameData() {
    localStorage.setItem('chinchiro_total_rolls', totalRolls);

    const rolesToSave = {};
    roles.forEach(role => {
        rolesToSave[role.key] = role.count;
    });
    localStorage.setItem('chinchiro_roles', JSON.stringify(rolesToSave));
}

// 画面表示を一括更新する関数
function updateUI() {
    totalCountElement.textContent = totalRolls;
    statsBody.innerHTML = ''; 

    roles.forEach(role => {
        if (role.key === 'special777' && role.count === 0) {
            return; 
        }

        const tr = document.createElement('tr');
        let percentage = '0.00%';
        if (totalRolls > 0) {
            percentage = ((role.count / totalRolls) * 100).toFixed(2) + '%';
        }

        tr.innerHTML = `
            <td>${role.name}</td>
            <td>${role.prob}</td>
            <td>${role.count} 回</td>
            <td>${percentage}</td>
        `;
        statsBody.appendChild(tr);
    });
}

// チンチロの通常の出目から役を判定する関数
function judgeDice(d1, d2, d3) {
    const dice = [d1, d2, d3].sort((a, b) => a - b);

    if (dice[0] === 1 && dice[1] === 1 && dice[2] === 1) return { key: 'pinzoro', name: 'ピンゾロ (最高役！)' };
    if (dice[0] === dice[2]) {
        const num = dice[0];
        return { key: `zoro${num}`, name: `${num}のゾロ目` };
    }
    if (dice[0] === 4 && dice[1] === 5 && dice[2] === 6) return { key: 'shigoro', name: 'シゴロ (4-5-6)' };
    if (dice[0] === 1 && dice[1] === 2 && dice[2] === 3) return { key: 'hifumi', name: 'ヒフミ (1-2-3)' };
    
    if (dice[0] === dice[1]) return { key: `normal_me${dice[2]}`, name: `${dice[2]}の目` };
    if (dice[1] === dice[2]) return { key: `normal_me${dice[0]}`, name: `${dice[0]}の目` };

    return { key: 'menashi', name: '目なし' };
}

// サイコロを振るメイン処理
rollButton.addEventListener('click', () => {
    rollButton.disabled = true;
    resultText.textContent = 'シャッフル中...';

    let finalDice = [];
    let finalRoleKey = '';
    let finalRoleName = '';

    //const rand100 = 0
    const rand100 = Math.floor(Math.random() * 100); 
    const rand50 = Math.floor(Math.random() * 50);

    if (rand100 === 0) { 
        finalDice = [7, 7, 7];
        finalRoleKey = 'special777';
        finalRoleName = '奇跡の777（特殊役）！！！';
    } else if (rand50 === 0) {
        finalDice = [0, 0, 0];
        finalRoleKey = 'shonben';
        finalRoleName = '場外！お椀の外に飛び出した！'; 
    } else {
        finalDice = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ];
        const judgment = judgeDice(finalDice[0], finalDice[1], finalDice[2]);
        finalRoleKey = judgment.key;
        finalRoleName = judgment.name;
    }

    const randomSoundIndex = Math.floor(Math.random() * soundFiles.length);
    const audio = new Audio(soundFiles[randomSoundIndex]);
    audio.play().catch(e => console.log("音声再生エラー:", e));

    // サイコロのシャッフルを開始
    const shuffleInterval = setInterval(() => {
        diceElements.forEach(dice => {
            const randomVal = Math.floor(Math.random() * 6) + 1;
            renderDice(dice, randomVal);
        });
    }, 100);

    // ========================================================
    // 【ルート分岐】特殊役（777）だった場合のロングフリーズ演出
    // ========================================================
    if (finalRoleKey === 'special777') {
        // 通常の0.5秒を無視し、5000ミリ秒（5秒間）シャッフルし続ける
        setTimeout(() => {
            clearInterval(shuffleInterval); // 5秒後にシャッフル停止
            audio.pause();                  // ガラガラ音をストップ
            audio.currentTime = 0;

            // ① 画面を真っ暗（黒オーバーレイをアクティブ）にする
            freezeOverlay.classList.add('active');
            
            // ② 画面が暗くなると同時にフリーズ始動音を鳴らす
            const startAudio = new Audio(freezeStartSound);
            startAudio.play().catch(e => console.log("フリーズ始動音エラー:", e));
            
            // ③ 暗転の0.3秒後に「GOD」の文字をフェードイン開始
            setTimeout(() => {
                freezeWord.classList.add('fade-in');
            }, 300);

            // ④ 3.8秒間の暗転演出ののち、結果画面へ移行
            setTimeout(() => {
                freezeOverlay.classList.remove('active');
                freezeWord.classList.remove('fade-in');

                // 確定音（プチュンインパクト音）を鳴らす
                const impactAudio = new Audio(freezeImpactSound);
                impactAudio.play().catch(e => console.log("フリーズ確定音エラー:", e));

                // 画面に出目を表示
                diceElements.forEach(dice => renderDice(dice, 7));
                resultText.textContent = finalRoleName;

                // データの集計とセーブ
                totalRolls++;
                roles.find(r => r.key === 'special777').count++;
                saveGameData();
                updateUI();

                rollButton.disabled = false;
            }, 3800); 

        }, 5000); // 👈 ここを「5000」にすることで5秒間違和感シャッフルになります！
        return; 
    }

    // ========================================================
    // 通常役・通常ルートの確定処理（こちらは従来通り0.5秒）
    // ========================================================
    setTimeout(() => {
        clearInterval(shuffleInterval);

        diceElements.forEach((dice, index) => {
            if (finalRoleKey === 'shonben') {
                renderDice(dice, '外'); 
            } else {
                renderDice(dice, finalDice[index]);
            }
        });

        resultText.textContent = finalRoleName;

        totalRolls++;
        const targetRole = roles.find(r => r.key === finalRoleKey);
        if (targetRole) targetRole.count++;
        
        saveGameData();
        updateUI();
        
        rollButton.disabled = false;
    }, 500); 
});

// 統計データのみリセット
resetStatsButton.addEventListener('click', () => {
    if (confirm('すべての統計データ(プレイ回数・役の履歴)をリセットしますか？')) {
        totalRolls = 0;
        roles.forEach(role => role.count = 0);
        saveGameData();
        updateUI();
        
        diceElements.forEach(dice => renderDice(dice, '-'));
        resultText.textContent = 'ボタンを押してスタート';
    }
});

// 初期表示を「-」に
diceElements.forEach(dice => renderDice(dice, '-'));
loadGameData();