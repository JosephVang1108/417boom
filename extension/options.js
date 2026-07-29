async function load() {
  const stored = await chrome.storage.sync.get({
    apiBase: "http://127.0.0.1:4170",
    secret: "dev-speedlead-hook",
  });
  document.getElementById("apiBase").value = stored.apiBase;
  document.getElementById("secret").value = stored.secret;
}

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    apiBase: document.getElementById("apiBase").value.trim(),
    secret: document.getElementById("secret").value.trim(),
  });
  document.getElementById("saved").textContent = "Saved.";
});

load();
