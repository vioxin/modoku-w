// ==========================================
// 1. 設定：あなたのGASのURLをここに貼り付けてください
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzOpcoQtkoLBCUhmfd4RPCV6BhQs8ngf9fLiXYE8ALgDmJsr_ic4LnrSyFj5ChgwJoRhQ/exec";

// ==========================================
// 2. ページ読み込み時の初期化処理
// ==========================================
window.addEventListener('load', () => {
    updateNavigation(); // ナビゲーション（ログインボタン等）の表示更新
    getMessages();      // 掲示板のメッセージ取得
});

// ==========================================
// 3. サイドメニューの開閉機能
// ==========================================
function toggleMenu() {
    const menu = document.getElementById("side-menu");
    menu.classList.toggle("open");
}

// ==========================================
// 4. ナビゲーション（右上ボタン）の切り替え
// ==========================================
function updateNavigation() {
    const navArea = document.getElementById("nav-area");
    const userName = localStorage.getItem("userName");

    if (userName) {
        // 【ログイン状態】名前とマイページボタンを表示
        navArea.innerHTML = `
            <div class="user-info">
                <span>こんにちは、${userName} さん</span>
                <button onclick="location.href='main.html'" class="nav-btn">マイページへ</button>
            </div>
        `;
        // 掲示板の名前入力欄に自動で名前を入れる（あれば）
        const nameInput = document.getElementById("userName");
        if (nameInput) nameInput.value = userName;
    } else {
        // 【ログアウト状態】新規登録とログインボタンを表示
        navArea.innerHTML = `
            <div class="guest-nav">
                <button onclick="location.href='signup.html'" class="nav-btn signup-style">新規登録</button>
                <button onclick="location.href='login.html'" class="nav-btn">ログイン</button>
            </div>
        `;
    }
}

// ==========================================
// 5. 掲示板：メッセージ取得機能（キャッシュ対応）
// ==========================================
async function getMessages() {
    const listElement = document.getElementById("messageList");
    const statusElement = document.getElementById("syncStatus");

    // --- A. キャッシュの読み込み（即座に表示） ---
    const cachedData = localStorage.getItem("bbs_cache");
    if (cachedData) {
        renderMessages(JSON.parse(cachedData));
        if (statusElement) {
            statusElement.innerText = "同期中...";
            statusElement.classList.add("is-loading");
        }
        listElement.classList.add("loading-fade");
    } else {
        listElement.innerHTML = "<p>読み込み中...</p>";
    }

    // --- B. サーバー（GAS）から最新データを取得 ---
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        
        // 最新データをキャッシュに保存
        localStorage.setItem("bbs_cache", JSON.stringify(data));
        
        // 画面を最新データで上書き
        renderMessages(data);
        
        if (statusElement) {
            statusElement.innerText = "最新の状態";
            setTimeout(() => statusElement.classList.remove("is-loading"), 2000);
        }
    } catch (error) {
        console.error("通信エラー:", error);
        if (statusElement) statusElement.innerText = "オフライン表示中";
    } finally {
        listElement.classList.remove("loading-fade");
    }
}

// ==========================================
// 6. 掲示板：メッセージ描画ヘルパー
// ==========================================
function renderMessages(data) {
    const listElement = document.getElementById("messageList");
    if (!listElement) return;

    listElement.innerHTML = ""; // 表示をリセット

    if (!data || data.length === 0) {
        listElement.innerHTML = "<p>まだ投稿がありません。</p>";
        return;
    }

    // 配列をコピーして逆順（最新を上）にする
    [...data].reverse().forEach(item => {
        const div = document.createElement("div");
        div.className = "post-item";
        div.innerHTML = `
            <div class="post-header">
                <span class="post-name">${item.name} さん</span>
                <span class="post-date">${item.date || ""}</span>
            </div>
            <div class="post-text">${item.message}</div>
        `;
        listElement.appendChild(div);
    });
}

// ==========================================
// 7. 掲示板：投稿送信機能
// ==========================================
async function postMessage() {
    const nameEl = document.getElementById("userName");
    const msgEl = document.getElementById("userMsg");
    const btn = document.getElementById("postBtn") || document.querySelector("button[onclick='postMessage()']");

    if (!nameEl.value || !msgEl.value) {
        alert("名前とメッセージを入力してください");
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "送信中...";

    try {
        // GASへデータを送信
        await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ 
                action: "post", // 掲示板投稿であることを明示（GAS側でアクション分岐させる場合用）
                name: nameEl.value, 
                message: msgEl.value 
            })
        });

        msgEl.value = ""; // メッセージ入力欄だけ空にする
        await getMessages(); // 最新のリストを取得して更新
    } catch (e) {
        console.error(e);
        alert("投稿に失敗しました。時間をおいて再度お試しください。");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}
