async function getSettings() {
  const stored = await chrome.storage.sync.get({
    apiBase: "http://127.0.0.1:4170",
    secret: "dev-speedlead-hook",
  });
  return stored;
}

async function grabPostFromPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection()?.toString()?.trim() || "";
      const article =
        document.querySelector('[role="article"]') ||
        document.querySelector('[data-ad-preview="message"]') ||
        document.body;
      const text = selection || (article?.innerText || "").slice(0, 4000);
      return {
        text,
        url: location.href,
        title: document.title || "",
      };
    },
  });
  return result;
}

document.getElementById("sendBtn").addEventListener("click", async () => {
  const status = document.getElementById("status");
  status.textContent = "Sending…";
  try {
    const settings = await getSettings();
    const post = await grabPostFromPage();
    if (!post?.text || post.text.length < 3) {
      status.textContent = "Couldn’t read the post. Select the text first.";
      return;
    }

    const res = await fetch(`${settings.apiBase.replace(/\/$/, "")}/api/hooks/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Speedlead-Secret": settings.secret,
      },
      body: JSON.stringify({
        text: post.text,
        post_url: post.url || "",
        group_name: "",
        source: "chrome_extension",
      }),
    });

    if (!res.ok) {
      status.textContent = `Failed (${res.status})`;
      return;
    }
    const data = await res.json();
    status.textContent = data.should_alert ? "Job alerted." : "Not a job. Skipped.";
  } catch (err) {
    status.textContent = err.message || "Something went wrong.";
  }
});
