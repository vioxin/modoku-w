// 【重要】Google Apps Scriptで発行したURLをここに貼り付けてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbzOpcoQtkoLBCUhmfd4RPCV6BhQs8ngf9fLiXYE8ALgDmJsr_ic4LnrSyFj5ChgwJoRhQ/exec";


// 1. メッセージを取得して表示する関数
async function getMessages() {
  const listElement = document.getElementById("messageList");
  const statusElement = document.getElementById("syncStatus");

  // --- キャッシュの読み込み ---
  const cachedData = localStorage.getItem("bbs_cache");
  if (cachedData) {
    renderMessages(JSON.parse(cachedData));
    statusElement.innerText = "同期中...";
    statusElement.classList.add("is-loading");
    listElement.classList.add("loading-fade");
  } else {
    listElement.innerHTML = "<p>読み込み中...</p>";
  }

  // --- サーバーから最新取得 ---
  try {
    const response = await fetch(GAS_URL);
    const data = await response.json();
    
    localStorage.setItem("bbs_cache", JSON.stringify(data));
    renderMessages(data);
    
    statusElement.innerText = "最新の状態";
    setTimeout(() => statusElement.classList.remove("is-loading"), 2000);
  } catch (error) {
    console.error("エラー:", error);
    statusElement.innerText = "オフライン表示中";
  } finally {
    listElement.classList.remove("loading-fade");
  }
}

// 2. 画面に投稿を描画する関数
function renderMessages(data) {
  const listElement = document.getElementById("messageList");
  listElement.innerHTML = "";

  if (!data || data.length === 0) {
    listElement.innerHTML = "<p>まだ投稿がありません。</p>";
    return;
  }

  // 最新が上に来るように逆順で表示
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

// 3. 投稿を送信する関数
async function postMessage() {
  const nameEl = document.getElementById("userName");
  const msgEl = document.getElementById("userMsg");
  const btn = document.getElementById("postBtn");

  if (!nameEl.value || !msgEl.value) {
    alert("名前とメッセージを入力してください");
    return;
  }

  btn.disabled = true;
  btn.innerText = "送信中...";

  try {
    await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ name: nameEl.value, message: msgEl.value })
    });
    msgEl.value = ""; // メッセージのみクリア
    await getMessages(); // リストを更新
  } catch (e) {
    alert("送信に失敗しました");
  } finally {
    btn.disabled = false;
    btn.innerText = "投稿する";
  }
}

// 起動時に実行
getMessages();
// script.js の最後の方に追加

function updateNavigation() {
  const navArea = document.getElementById("nav-area");
  const userName = localStorage.getItem("userName"); // ログイン情報を確認

  if (userName) {
    // ログインしている時
    navArea.innerHTML = `
      <div class="user-info">
        <span>こんにちは、${userName} さん</span>
        <button onclick="location.href='main.html'" class="nav-btn">マイページへ</button>
      </div>
    `;
  } else {
    // ログインしていない時
    navArea.innerHTML = `
      <button onclick="location.href='login.html'" class="nav-btn login-style">ログイン</button>
    `;
  }
}

// ページ読み込み時に実行
window.addEventListener('load', updateNavigation);
