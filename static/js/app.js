const sampleSongs = [
  {
    id: 1,
    title: "Buwan",
    artist: "Juan Karlos",
    era: "Modern",
    mood: "Moody",
    image_url:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
    spotify_url: "https://open.spotify.com/",
  },
  {
    id: 2,
    title: "Himig ng Pag-ibig",
    artist: "ASIN",
    era: "Classic",
    mood: "Folk",
    image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    spotify_url: "https://open.spotify.com/",
  },
  {
    id: 3,
    title: "Kwarto",
    artist: "Sugarfree",
    era: "Modern",
    mood: "Bittersweet",
    image_url:
      "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=600&q=80",
    spotify_url: "https://open.spotify.com/",
  },
  {
    id: 4,
    title: "Kundiman",
    artist: "Traditional",
    era: "Classic",
    mood: "Romantic",
    image_url:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    spotify_url: "https://open.spotify.com/",
  },
];

let apiOrigin = window.location.origin;

if (window.location.protocol === "file:") {
  apiOrigin = "http://127.0.0.1:5000";
} else if (
  ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
  window.location.port &&
  window.location.port !== "5000"
) {
  apiOrigin = `${window.location.protocol}//${window.location.hostname}:5000`;
}

const API_BASE = `${apiOrigin}/api/songs`;
const songGrid = document.getElementById("songGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const filterButtons = document.querySelectorAll("[data-filter]");
const statusMessage = document.getElementById("statusMessage");
const songForm = document.getElementById("songForm");
const clearFormBtn = document.getElementById("clearForm");
const submitBtn = document.getElementById("submitBtn");
const deleteBtn = document.getElementById("deleteBtn");
const manageList = document.getElementById("manageList");

const titleInput = document.getElementById("titleInput");
const artistInput = document.getElementById("artistInput");
const eraInput = document.getElementById("eraInput");
const moodInput = document.getElementById("moodInput");
const spotifyInput = document.getElementById("spotifyInput");
const imageInput = document.getElementById("imageInput");

let cachedSongs = [];
let activeFilter = "all";
let editingId = null;
let apiReady = true;

function setStatus(message, isError = false) {
  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#ff8a3d" : "";
}

function setFormEnabled(enabled) {
  [
    titleInput,
    artistInput,
    eraInput,
    moodInput,
    spotifyInput,
    imageInput,
    submitBtn,
    deleteBtn,
  ].forEach((el) => {
    if (el) {
      el.disabled = !enabled;
    }
  });
}

function resetForm() {
  editingId = null;
  songForm.reset();
  submitBtn.textContent = "Create song";
  deleteBtn.disabled = true;
}

function getFormPayload() {
  return {
    title: titleInput.value.trim(),
    artist: artistInput.value.trim(),
    era: eraInput.value.trim(),
    mood: moodInput.value.trim(),
    spotify_url: spotifyInput.value.trim(),
    image_url: imageInput.value.trim(),
  };
}

function renderSongs(songs) {
  songGrid.innerHTML = "";
  songs.forEach((song, index) => {
    const card = document.createElement("article");
    card.className = "song-card";
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
      <img src="${song.image_url}" alt="${song.title}" />
      <div>
        <h4>${song.title}</h4>
        <p>${song.artist}</p>
      </div>
      <div class="song-meta">
        <span>${song.era}</span>
        <span>${song.mood}</span>
      </div>
      <a class="pill" href="${song.spotify_url}" target="_blank" rel="noreferrer">Listen</a>
    `;

    songGrid.appendChild(card);
  });
}

function renderManageList(songs) {
  manageList.innerHTML = "";
  songs.slice(0, 20).forEach((song) => {
    const item = document.createElement("div");
    item.className = "manage-item";
    item.innerHTML = `
      <strong>${song.title}</strong>
      <small>${song.artist} · ${song.era} · ${song.mood}</small>
      <div class="manage-actions">
        <button class="pill" data-action="edit" data-id="${song.id}">Edit</button>
        <button class="pill ghost" data-action="delete" data-id="${song.id}">Delete</button>
      </div>
    `;
    manageList.appendChild(item);
  });
}

async function fetchSongs(query = "") {
  try {
    const response = await fetch(
      query ? `${API_BASE}?q=${encodeURIComponent(query)}` : API_BASE,
    );
    if (response.status === 501) {
      apiReady = false;
      setFormEnabled(false);
      setStatus("Supabase not configured. Showing sample songs.", true);
      return sampleSongs;
    }

    const data = await response.json();
    apiReady = true;
    setFormEnabled(true);
    setStatus("Add, edit, or delete songs in your Supabase table.");
    return data.length ? data : sampleSongs;
  } catch (error) {
    console.error(error);
    apiReady = false;
    setFormEnabled(false);
    setStatus("Backend unavailable. Showing sample songs.", true);
    return sampleSongs;
  }
}

function applyFilter() {
  if (activeFilter === "all") {
    renderSongs(cachedSongs);
    return;
  }

  const filtered = cachedSongs.filter((song) =>
    song.era.toLowerCase().includes(activeFilter),
  );
  renderSongs(filtered.length ? filtered : cachedSongs);
}

searchBtn.addEventListener("click", async () => {
  cachedSongs = await fetchSongs(searchInput.value.trim());
  applyFilter();
  renderManageList(cachedSongs);
});

searchInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    cachedSongs = await fetchSongs(searchInput.value.trim());
    applyFilter();
    renderManageList(cachedSongs);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    applyFilter();
  });
});

songForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!apiReady) {
    setStatus("Supabase is not configured yet.", true);
    return;
  }

  const payload = getFormPayload();
  const endpoint = editingId ? `${API_BASE}/${editingId}` : API_BASE;
  const method = editingId ? "PUT" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    setStatus("Failed to save the song. Check required fields.", true);
    return;
  }

  resetForm();
  cachedSongs = await fetchSongs(searchInput.value.trim());
  applyFilter();
  renderManageList(cachedSongs);
});

deleteBtn.addEventListener("click", async () => {
  if (!editingId || !apiReady) {
    return;
  }

  await fetch(`${API_BASE}/${editingId}`, { method: "DELETE" });
  resetForm();
  cachedSongs = await fetchSongs(searchInput.value.trim());
  applyFilter();
  renderManageList(cachedSongs);
});

clearFormBtn.addEventListener("click", () => {
  resetForm();
});

manageList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!id) {
    return;
  }

  if (action === "delete") {
    await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    cachedSongs = await fetchSongs(searchInput.value.trim());
    applyFilter();
    renderManageList(cachedSongs);
    return;
  }

  const song = cachedSongs.find((item) => String(item.id) === String(id));
  if (!song) {
    return;
  }

  editingId = song.id;
  titleInput.value = song.title || "";
  artistInput.value = song.artist || "";
  eraInput.value = song.era || "";
  moodInput.value = song.mood || "";
  spotifyInput.value = song.spotify_url || "";
  imageInput.value = song.image_url || "";
  submitBtn.textContent = "Update song";
  deleteBtn.disabled = false;
});

(async () => {
  cachedSongs = await fetchSongs();
  renderSongs(cachedSongs);
  renderManageList(cachedSongs);
})();
