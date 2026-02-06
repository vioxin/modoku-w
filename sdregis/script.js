const GAS_ENDPOINT = "YOUR_GAS_WEB_APP_URL"; // GASでデプロイしたURLをここに貼る

document.getElementById('subdomainForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const msg = document.getElementById('message');
    
    // UI Feedback
    btn.disabled = true;
    btn.innerText = "送信中...";
    msg.classList.add('hidden');

    const formData = {
        subdomain: document.getElementById('subdomain').value + ".modoku.click",
        target: document.getElementById('target').value,
        ttl: document.getElementById('ttl').value,
        timestamp: new Date().toLocaleString("ja-JP")
    };

    try {
        // Fetch APIでGASにPOST送信（no-corsモードが必要な場合があります）
        const response = await fetch(GAS_ENDPOINT, {
            method: "POST",
            body: JSON.stringify(formData)
        });

        msg.innerText = "✅ 申請が完了しました！";
        msg.className = "mt-4 text-center text-sm font-medium text-green-600";
        document.getElementById('subdomainForm').reset();
    } catch (error) {
        msg.innerText = "❌ 送信に失敗しました。";
        msg.className = "mt-4 text-center text-sm font-medium text-red-600";
    } finally {
        btn.disabled = false;
        btn.innerText = "申請を送信する";
        msg.classList.remove('hidden');
    }
});
