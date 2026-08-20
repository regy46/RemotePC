import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

let isOnPCPage = false;

const app = document.querySelector("#app");


// ============================================================
// CHECK PAGE
// ============================================================

function isPCPage() {
  return isOnPCPage;
}


// ============================================================
// INITIAL PAGE
// ============================================================

app.innerHTML = `
  <div class="container">
    <h1>Remote PC</h1>
    <p>Pilih PC yang ingin dikendalikan.</p>

    <div id="pc-list" class="pc-list">
      <p>Memuat PC...</p>
    </div>
  </div>
`;


// ============================================================
// GET PC STATUS
// ============================================================

async function getPCStatus(deviceId) {

  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}


// ============================================================
// LOAD PC
// ============================================================

async function loadPCs() {

  if (isPCPage()) {
    return;
  }

  const pcList = document.querySelector("#pc-list");

  if (!pcList) {
    return;
  }

  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("pc_name", {
      ascending: true
    });

  if (error) {

    console.error(error);

    pcList.innerHTML = `
      <p>Gagal mengambil daftar PC.</p>
    `;

    return;
  }

  if (!data || data.length === 0) {

    pcList.innerHTML = `
      <p>Belum ada PC yang terhubung.</p>
    `;

    return;
  }

  pcList.innerHTML = "";

  data.forEach((pc) => {

    const card = document.createElement("div");

    card.className = "pc-card";

    const isOnline = pc.status === "online";

    card.innerHTML = `
      <div>
        <h2>${pc.pc_name || "PC Tanpa Nama"}</h2>

        <p>
          ${pc.os || "Windows"}
        </p>
      </div>

      <div>
        <span class="status ${isOnline ? "online" : "offline"}">
          ${isOnline ? "ONLINE" : "OFFLINE"}
        </span>
      </div>
    `;

    card.style.cursor = "pointer";

    card.addEventListener("click", () => {
      openPC(pc.device_id);
    });

    pcList.appendChild(card);
  });
}


// ============================================================
// OPEN PC
// ============================================================

window.openPC = async function (deviceId) {

  isOnPCPage = true;

  const pc = await getPCStatus(deviceId);

  if (!pc) {

    app.innerHTML = `
      <div class="container">

        <h1>PC tidak ditemukan</h1>

        <button
          class="back-button"
          onclick="backToPCList()"
        >
          ← Kembali
        </button>

      </div>
    `;

    return;
  }

  const isOnline = pc.status === "online";

  app.innerHTML = `
    <div class="container">

      <div class="screen-header">

        <div>
          <h1>${pc.pc_name}</h1>

          <p>
            ${pc.os || "Windows"}
          </p>
        </div>

        <span class="live-status">
          ${isOnline ? "🟢 ONLINE" : "🔴 OFFLINE"}
        </span>

      </div>

      <div class="controls">

        <button onclick="pingPC('${deviceId}')">
          📡 Ping
        </button>

        <button onclick="viewScreen('${deviceId}')">
          🖥️ Lihat Layar
        </button>

        <button onclick="shutdownPC('${deviceId}')">
          ⏻ Shutdown
        </button>

      </div>

      <button
        class="back-button"
        onclick="backToPCList()"
      >
        ← Kembali
      </button>

    </div>
  `;
};


// ============================================================
// BACK TO PC LIST
// ============================================================

window.backToPCList = function () {

  isOnPCPage = false;

  app.innerHTML = `
    <div class="container">

      <h1>Remote PC</h1>

      <p>Pilih PC yang ingin dikendalikan.</p>

      <div id="pc-list" class="pc-list">
        <p>Memuat PC...</p>
      </div>

    </div>
  `;

  loadPCs();
};


// ============================================================
// SEND COMMAND
// ============================================================

async function sendCommand(deviceId, command) {

  const { error } = await supabase
    .from("commands")
    .insert({
      device_id: deviceId,
      command: command
    });

  if (error) {

    console.error("Command error:", error);

    alert("Gagal mengirim command.");

    return false;
  }

  return true;
}


// ============================================================
// PING
// ============================================================

window.pingPC = async function (deviceId) {

  const success = await sendCommand(
    deviceId,
    "ping"
  );

  if (success) {
    alert("📡 Ping command terkirim.");
  }
};


// ============================================================
// LIVE SCREEN
// ============================================================

window.viewScreen = async function (deviceId) {

  isOnPCPage = true;

  const pc = await getPCStatus(deviceId);

  if (!pc) {
    return;
  }

  app.innerHTML = `
    <div class="container screen-page">

      <div class="screen-header">

        <div>
          <h1>🖥️ Remote Screen</h1>

          <p>
            ${pc.pc_name}
          </p>
        </div>

        <span
          id="live-status"
          class="live-status"
        >
          🔄 Menghubungkan...
        </span>

      </div>


      <!-- SCREEN -->

      <div
        id="screen-box"
        class="screen-box"
      >

        <div id="screen-loading">

          <div class="loader"></div>

          <div>
            Menghubungkan ke layar PC...
          </div>

        </div>

        <img
          id="live-screen"
          alt="Live Screen"
        />

        <!-- VIRTUAL CURSOR -->

        <div
          id="virtual-cursor"
          aria-hidden="true"
        >

          <div class="cursor-dot"></div>

          <div class="cursor-ring"></div>

        </div>

      </div>


      <!-- VIRTUAL MOUSE -->

      <div class="virtual-mouse">

        <div class="virtual-title">
          🖱️ Virtual Mouse
        </div>


        <div
          id="virtual-touchpad"
          class="virtual-touchpad"
        >

          <div class="touchpad-icon">
            🖱️
          </div>

          <div>
            Geser untuk menggerakkan mouse
          </div>

          <small>
            Posisi mouse ditunjukkan oleh indikator biru
          </small>

        </div>


        <div class="mouse-buttons">

          <button
            class="mouse-button"
            id="left-click"
          >
            🖱️ Klik Kiri
          </button>

          <button
            class="mouse-button"
            id="right-click"
          >
            🖱️ Klik Kanan
          </button>

          <button
            class="mouse-button"
            id="double-click"
          >
            🖱️ Double Click
          </button>

          <button
            class="mouse-button"
            id="middle-click"
          >
            🖱️ Klik Tengah
          </button>

        </div>


        <div class="scroll-buttons">

          <button
            class="mouse-button"
            id="scroll-up"
          >
            ⬆️ Scroll Atas
          </button>

          <button
            class="mouse-button"
            id="scroll-down"
          >
            ⬇️ Scroll Bawah
          </button>

        </div>

      </div>


      <!-- KEYBOARD -->

      <div class="virtual-keyboard">

        <input
          id="keyboard-input"
          type="text"
          placeholder="Ketik teks untuk dikirim ke PC..."
          autocomplete="off"
        />


        <div class="keyboard-row">

          <button data-key="ENTER">
            Enter
          </button>

          <button data-key="BACKSPACE">
            Backspace
          </button>

          <button data-key="TAB">
            Tab
          </button>

          <button data-key="ESC">
            Esc
          </button>

        </div>


        <div class="keyboard-row">

          <button data-key="UP">
            ↑
          </button>

          <button data-key="DOWN">
            ↓
          </button>

          <button data-key="LEFT">
            ←
          </button>

          <button data-key="RIGHT">
            →
          </button>

        </div>


        <div class="keyboard-row">

          <button data-key="CTRL">
            Ctrl
          </button>

          <button data-key="ALT">
            Alt
          </button>

          <button data-key="SHIFT">
            Shift
          </button>

          <button data-key="SPACE">
            Space
          </button>

        </div>


        <div class="keyboard-row">

          <button data-key="F1">
            F1
          </button>

          <button data-key="F2">
            F2
          </button>

          <button data-key="F5">
            F5
          </button>

          <button data-key="F11">
            F11
          </button>

        </div>

      </div>


      <button
        class="back-button"
        id="back-screen"
      >
        ← Kembali
      </button>

    </div>
  `;


  // ============================================================
  // ELEMENTS
  // ============================================================

  const screenBox =
    document.querySelector("#screen-box");

  const liveScreen =
    document.querySelector("#live-screen");

  const screenLoading =
    document.querySelector("#screen-loading");

  const liveStatus =
    document.querySelector("#live-status");

  const touchpad =
    document.querySelector("#virtual-touchpad");

  const virtualCursor =
    document.querySelector("#virtual-cursor");


  // ============================================================
  // VIRTUAL CURSOR POSITION
  // ============================================================

  let cursorX = 0;
  let cursorY = 0;

  let cursorInitialized = false;


  function resetVirtualCursor() {

    if (!screenBox || !virtualCursor) {
      return;
    }

    cursorX =
      screenBox.clientWidth / 2;

    cursorY =
      screenBox.clientHeight / 2;

    cursorInitialized = true;

    virtualCursor.style.left =
      `${cursorX}px`;

    virtualCursor.style.top =
      `${cursorY}px`;
  }


  function moveVirtualCursor(
    remoteDx,
    remoteDy
  ) {

    if (
      !screenBox ||
      !virtualCursor
    ) {
      return;
    }

    if (!cursorInitialized) {
      resetVirtualCursor();
    }


    const imageWidth =
      liveScreen.naturalWidth || 1920;

    const imageHeight =
      liveScreen.naturalHeight || 1080;


    const displayedWidth =
      liveScreen.getBoundingClientRect().width;

    const displayedHeight =
      liveScreen.getBoundingClientRect().height;


    const scaleX =
      displayedWidth / imageWidth;

    const scaleY =
      displayedHeight / imageHeight;


    cursorX += remoteDx * scaleX;
    cursorY += remoteDy * scaleY;


    const cursorSize = 15;


    cursorX = Math.max(
      cursorSize,
      Math.min(
        screenBox.clientWidth - cursorSize,
        cursorX
      )
    );


    cursorY = Math.max(
      cursorSize,
      Math.min(
        screenBox.clientHeight - cursorSize,
        cursorY
      )
    );


    virtualCursor.style.left =
      `${cursorX}px`;

    virtualCursor.style.top =
      `${cursorY}px`;
  }


  resetVirtualCursor();


  window.addEventListener(
    "resize",
    () => {

      if (isOnPCPage) {
        resetVirtualCursor();
      }

    }
  );


  // ============================================================
  // TOUCHPAD
  // ============================================================

  let touching = false;

  let lastX = 0;
  let lastY = 0;

  let moveDX = 0;
  let moveDY = 0;

  let moveTimer = null;


  function sendBufferedMovement() {

    if (
      moveDX === 0 &&
      moveDY === 0
    ) {
      return;
    }


    const dx =
      Math.round(moveDX);

    const dy =
      Math.round(moveDY);


    moveDX = 0;
    moveDY = 0;


    sendCommand(
      deviceId,
      `mouse_move_relative:${dx}:${dy}`
    );
  }


  function startTouch(event) {

    if (
      !event.touches ||
      event.touches.length === 0
    ) {
      return;
    }


    event.preventDefault();


    const touch =
      event.touches[0];


    touching = true;

    lastX = touch.clientX;
    lastY = touch.clientY;


    if (!moveTimer) {

      moveTimer = setInterval(
        sendBufferedMovement,
        80
      );

    }
  }


  function moveTouch(event) {

    if (!touching) {
      return;
    }


    if (
      !event.touches ||
      event.touches.length === 0
    ) {
      return;
    }


    event.preventDefault();


    const touch =
      event.touches[0];


    const rawDX =
      touch.clientX - lastX;

    const rawDY =
      touch.clientY - lastY;


    lastX = touch.clientX;
    lastY = touch.clientY;


    const sensitivity = 2.5;


    const dx =
      rawDX * sensitivity;

    const dy =
      rawDY * sensitivity;


    moveDX += dx;
    moveDY += dy;


    // Update indikator cursor
    moveVirtualCursor(
      dx,
      dy
    );
  }


  function endTouch(event) {

    if (!touching) {
      return;
    }


    event.preventDefault();


    touching = false;


    sendBufferedMovement();


    if (moveTimer) {

      clearInterval(moveTimer);

      moveTimer = null;

    }
  }


  touchpad.addEventListener(
    "touchstart",
    startTouch,
    {
      passive: false
    }
  );


  touchpad.addEventListener(
    "touchmove",
    moveTouch,
    {
      passive: false
    }
  );


  touchpad.addEventListener(
    "touchend",
    endTouch,
    {
      passive: false
    }
  );


  touchpad.addEventListener(
    "touchcancel",
    endTouch,
    {
      passive: false
    }
  );


  // ============================================================
  // MOUSE BUTTONS
  // ============================================================

  document
    .querySelector("#left-click")
    .addEventListener(
      "click",
      () => {

        sendCommand(
          deviceId,
          "mouse_click:left"
        );

      }
    );


  document
    .querySelector("#right-click")
    .addEventListener(
      "click",
      () => {

        sendCommand(
          deviceId,
          "mouse_click:right"
        );

      }
    );


  document
    .querySelector("#middle-click")
    .addEventListener(
      "click",
      () => {

        sendCommand(
          deviceId,
          "mouse_click:middle"
        );

      }
    );


  document
    .querySelector("#double-click")
    .addEventListener(
      "click",
      () => {

        sendCommand(
          deviceId,
          "mouse_double_click:left"
        );

      }
    );


  // ============================================================
  // SCROLL
  // ============================================================

  document
    .querySelector("#scroll-up")
    .addEventListener(
      "click",
      () => {

        sendCommand(
          deviceId,
          "scroll:5"
        );

      }
    );


  document
    .querySelector("#scroll-down")
    .addEventListener(
      "click",
      () => {

        sendCommand(
          deviceId,
          "scroll:-5"
        );

      }
    );


  // ============================================================
  // KEYBOARD INPUT
  // ============================================================

  const keyboardInput =
    document.querySelector(
      "#keyboard-input"
    );


  keyboardInput.addEventListener(
    "keydown",
    async (event) => {

      if (event.key === "Enter") {

        event.preventDefault();


        const text =
          keyboardInput.value;


        if (text.trim() !== "") {

          await sendCommand(
            deviceId,
            `type_text:${text}`
          );

          keyboardInput.value = "";

        }

      }

    }
  );


  // ============================================================
  // VIRTUAL KEYBOARD BUTTONS
  // ============================================================

  document
    .querySelectorAll(
      ".keyboard-row button"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const key =
            button.dataset.key;


          if (!key) {
            return;
          }


          sendCommand(
            deviceId,
            `key:${key}`
          );

        }
      );

    });


  // ============================================================
  // BACK BUTTON
  // ============================================================

  document
    .querySelector("#back-screen")
    .addEventListener(
      "click",
      () => {

        if (moveTimer) {

          clearInterval(moveTimer);

          moveTimer = null;

        }


        if (socket) {

          try {
            socket.close();
          } catch (error) {
            console.error(error);
          }

        }


        window.openPC(deviceId);

      }
    );


  // ============================================================
  // GET LATEST CLOUDFLARE URL
  // ============================================================

  const { data: tunnelData, error: tunnelError } =
    await supabase
      .from("tunnel_urls")
      .select("tunnel_url")
      .eq("device_id", deviceId)
      .order("created_at", {
        ascending: false
      })
      .limit(1)
      .maybeSingle();


  if (tunnelError) {

    console.error(
      "Tunnel URL error:",
      tunnelError
    );

    screenLoading.innerHTML = `
      <div class="error-icon">❌</div>
      <div>Gagal mengambil URL Cloudflare.</div>
    `;

    liveStatus.textContent =
      "🔴 Error";

    return;
  }


  if (
    !tunnelData ||
    !tunnelData.tunnel_url
  ) {

    screenLoading.innerHTML = `
      <div class="error-icon">❌</div>
      <div>URL Cloudflare belum tersedia.</div>
    `;

    liveStatus.textContent =
      "🔴 Tidak tersedia";

    return;
  }


  let tunnelURL =
    tunnelData.tunnel_url;


  // HTTPS → WSS

  let websocketURL =
    tunnelURL.replace(
      /^https:/,
      "wss:"
    );


  websocketURL += "/screen";


  console.log(
    "WebSocket:",
    websocketURL
  );


  // ============================================================
  // WEBSOCKET
  // ============================================================

  let socket;


  try {

    socket =
      new WebSocket(
        websocketURL
      );


    socket.binaryType =
      "blob";


    socket.onopen = () => {

      console.log(
        "🟢 WebSocket connected"
      );


      liveStatus.textContent =
        "🟢 LIVE";

    };


    socket.onmessage = (event) => {

      if (!(event.data instanceof Blob)) {
        return;
      }


      const imageURL =
        URL.createObjectURL(
          event.data
        );


      liveScreen.onload = () => {

        liveScreen.style.display =
          "block";

        screenLoading.style.display =
          "none";


        if (!cursorInitialized) {
          resetVirtualCursor();
        }


        setTimeout(() => {

          URL.revokeObjectURL(
            imageURL
          );

        }, 1000);

      };


      liveScreen.src =
        imageURL;

    };


    socket.onerror = (error) => {

      console.error(
        "WebSocket error:",
        error
      );


      liveStatus.textContent =
        "🔴 Error";


      screenLoading.innerHTML = `
        <div class="error-icon">❌</div>
        <div>Gagal terhubung ke layar PC.</div>
      `;

    };


    socket.onclose = () => {

      console.log(
        "🔌 WebSocket disconnected"
      );


      liveStatus.textContent =
        "🔴 Terputus";

    };

  } catch (error) {

    console.error(error);

    liveStatus.textContent =
      "🔴 Error";

  }
};


// ============================================================
// SHUTDOWN PC
// ============================================================

window.shutdownPC = async function (deviceId) {

  const confirmShutdown =
    confirm(
      "Yakin ingin mematikan PC ini?"
    );


  if (!confirmShutdown) {
    return;
  }


  const success =
    await sendCommand(
      deviceId,
      "shutdown"
    );


  if (success) {

    alert(
      "⏻ Command shutdown terkirim."
    );

  }
};


// ============================================================
// INITIAL LOAD
// ============================================================

loadPCs();


// ============================================================
// AUTO REFRESH PC STATUS
// ============================================================

setInterval(
  () => {

    if (!isOnPCPage) {
      loadPCs();
    }

  },
  5000
);