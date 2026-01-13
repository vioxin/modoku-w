// 【重要】Google Apps Scriptで発行したURLをここに貼り付けてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbzOpcoQtkoLBCUhmfd4RPCV6BhQs8ngf9fLiXYE8ALgDmJsr_ic4LnrSyFj5ChgwJoRhQ/exec";

// 投稿を読み込む関数
// script.js の getMessages 関数を少し改良
async function getMessages() {
  const listElement = document.getElementById("messageList");
  
  // 読み込み中であることを表示
  listElement.innerHTML = "<p style='color: #aaaaaa;'>データを取得中...</p>";

  try {
    const response = await fetch(GAS_URL);
    const data = await response.json();
    
    listElement.innerHTML = ""; // 表示をクリア

    if (data.length === 0) {
      listElement.innerHTML = "<p>まだ投稿がありません。</p>";
      return;
    }

    data.reverse().forEach(item => {
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
  } catch (error) {
    listElement.innerHTML = "<p>読み込みに失敗しました。再試行してください。</p>";
    console.error("読み込みエラー:", error);
  }
}

// 投稿を送信する関数
async function postMessage() {
  const name = document.getElementById("userName").value;
  const message = document.getElementById("userMsg").value;

  if (!name || !message) {
    alert("名前とメッセージを入力してください");
    return;
  }

  // 送信中はボタンを無効化
  const btn = document.querySelector("button");
  btn.disabled = true;
  btn.innerText = "送信中...";

  try {
    await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify({ name: name, message: message })
    });

    // 入力欄を空にする
    document.getElementById("userName").value = "";
    document.getElementById("userMsg").value = "";
    
    // 一覧を再読み込み
    await getMessages();
  } catch (error) {
    alert("投稿に失敗しました");
  } finally {
    btn.disabled = false;
    btn.innerText = "投稿する";
  }
}

// ページを開いた時に実行
getMessages();
