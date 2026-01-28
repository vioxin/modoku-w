// ==========================================
// 1. 設定：あなたのGASのURLをここに貼り付けてください
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzOpcoQtkoLBCUhmfd4RPCV6BhQs8ngf9fLiXYE8ALgDmJsr_ic4LnrSyFj5ChgwJoRhQ/exec";
const userId = localStorage.getItem("userId");
const userName = localStorage.getItem("userName");
// ==========================================
// 2. ページ読み込み時の初期化処理
// ==========================================
window.addEventListener('load', () => {
    updateNavigation(); // ナビゲーションの表示更新
    getMessages();      // 掲示板のメッセージ取得
});

// --- アンカー変換ヘルパー (>>1 をリンクにする) ---
function formatAnchor(text) {
    if (!text) return "";
    // HTMLエスケープ（セキュリティ対策）
    const escaped = text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    
    // >>数字 をアンカーリンクに置換
    return escaped.replace(/&gt;&gt;(\d+)/g, '<a href="#post-$1" class="anchor">>>$1</a>');
}

// ==========================================
// 3. サイドメニューの開閉機能
// ==========================================
function toggleMenu() {
    const menu = document.getElementById("side-menu");
    if (menu) menu.classList.toggle("open");
}

// ==========================================
// 4. ナビゲーション（右上ボタン）の切り替え
// ==========================================
function updateNavigation() {
    const navArea = document.getElementById("nav-area");
    const userName = localStorage.getItem("userName");

    if (!navArea) return;

    if (userName) {
        navArea.innerHTML = `
            <div class="user-info">
                <span>こんにちは、${userName} さん</span>
                <button onclick="location.href='main.html'" class="nav-btn">マイページへ</button>
            </div>
        `;
        const nameInput = document.getElementById("userName");
        if (nameInput) nameInput.value = userName;
    } else {
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

    if (!listElement) return;

    // --- A. キャッシュの読み込み ---
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

    // --- B. 最新データを取得 ---
    try {
        const response = await fetch(GAS_URL);
        const data = await response.json();
        
        localStorage.setItem("bbs_cache", JSON.stringify(data));
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
// 6. 掲示板：メッセージ描画ヘルパー (レス番号/アンカー対応)
// ==========================================
function renderMessages(data) {
    const listElement = document.getElementById("messageList");
    if (!listElement) return;

    listElement.innerHTML = "";

    if (!data || data.length === 0) {
        listElement.innerHTML = "<p>まだ投稿がありません。</p>";
        return;
    }

    // すでに逆順（最新上）で届いている想定ですが、
    // ここで .reverse() を使うか使わないかはGAS側の出力順に合わせて調整してください
    data.forEach(item => {
        // 1. 自分のIDを取得
        const myId = localStorage.getItem("userId");

        // 2. 投稿の外枠（div）を作成
        const div = document.createElement("div");
        div.className = "post-item";
        div.id = `post-${item.id}`; // アンカー用ID
    
        // 3. 投稿のヘッダーと本文のHTMLを組み立て
        div.innerHTML = `
            <div class="post-header">
                <div>
                    <span class="res-num">${item.id}</span>
                    <span class="post-name">${item.name} さん</span>
                </div>
                <span class="post-date">${item.date || ""}</span>
            </div>
            <div class="post-text" style="white-space: pre-wrap; word-break: break-all;">
                ${formatAnchor(item.message)}
            </div>
        `;

        // 4. 自分の投稿なら削除ボタンを追加
        // ※item.userid か item.userId か、スプレッドシートのヘッダーに合わせて調整してください
        if (item.uId === myId || item.uid === myId) {
            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "🗑️ 自分の投稿を削除";
        
            // デザイン（枠組みの設定）
            deleteBtn.style.marginTop = "8px";
            deleteBtn.style.color = "#ff4d4d";
            deleteBtn.style.background = "none";
            deleteBtn.style.border = "1px solid #ff4d4d";
            deleteBtn.style.borderRadius = "4px";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.fontSize = "11px";
            deleteBtn.style.padding = "2px 6px";

            // クリックイベント
            deleteBtn.onclick = () => deleteMyPost(item.row);
        
            // 投稿枠(div)の最後に追加
            div.appendChild(deleteBtn);
        }

        // 5. 最後にリスト本体に追加
        listElement.appendChild(div);
    });
};
// ==========================================
// 7. 掲示板：投稿送信機能
// ==========================================
async function postMessage() {
    const nameEl = document.getElementById("userName");
    const msgEl = document.getElementById("userMsg");
    const btn = document.getElementById("postBtn");
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    const currentIp = ipData.ip;
    if (!userId) {
        alert("ログインしてください");
        return;
    }
    if (!nameEl.value || !msgEl.value) {
        alert("名前とメッセージを入力してください");
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "送信中...";

    try {
        const res = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ 
                name: nameEl.value, 
                message: msgEl.value,
                userid: userId,
                username: userName,
                userip: currentIp
            })
        });
        const result = await res.json();

        if (result.success) {
            alert("投稿しました！");
            location.reload();
        } else {
            // GASからエラーが返ってきた場合
            if (result.errorType === "EMOJI_RESTRICTED") {
                alert("🚨 " + result.msg); // ここで「絵文字はproプラン専用です」が出る
            } else {
                alert("エラー: " + result.msg);
            }
        }
        msgEl.value = ""; 
        await getMessages(); 
    } catch (e) {
        console.error(e);
        alert("投稿に失敗しました。");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}
async function deleteMyPost(rowNumber) {
    if (!confirm("自分の投稿を削除してもよろしいですか？")) return;

    try {
        const response = await fetch(GAS_URL, { // GAS_URLは自分のURLに書き換えてください
            method: "POST",
            body: JSON.stringify({
                action: "user_delete_post",
                row: rowNumber,
                userId: localStorage.getItem("userId")
            })
        });

        const result = await response.json();

        if (result.success) {
            alert("削除に成功しました！");
            location.reload(); // 画面を更新して削除を反映
        } else {
            // ここでGAS側からの「Pro限定です」などのエラーメッセージが表示されます
            alert("削除できませんでした: " + result.msg);
        }
    } catch (error) {
        alert("通信エラーが発生しました。");
    }
}
