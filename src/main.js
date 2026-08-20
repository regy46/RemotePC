import { createClient } from "@supabase/supabase-js";
import "./style.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

let isOnPCPage = false;

// ============================================================
// APP
// ============================================================

const app = document.querySelector("#app");

// ============================================================
// INITIAL PAGE
// ============================================================

app.innerHTML = `
  <div class="container">

    <h1>Remote PC</h1>

    <p>
      Pilih PC yang ingin dikendalikan.
    </p>

    <div id="pc-list" class="pc-list">
      <p>Memuat PC...</p>
    </div>

  </div>
`;

// ============================================================
// GET PC
// ============================================================

async function getPCStatus(deviceId) {

  const { data, error } =
    await supabase
      .from("devices")
      .select("*")
      .eq("device_id", deviceId)
      .single();

  if (error) {

    console.error(
      "Gagal mengambil PC:",
      error
    );

    return null;
  }

  return data;
}

// ============================================================
// LOAD PC
// ============================================================

async function loadPCs() {

  if (isOnPCPage) {
    return;
  }

  const pcList =
    document.querySelector("#pc-list");

  if (!pcList) {
    return;
  }

  const { data, error } =
    await supabase
      .from("devices")
      .select("*")
      .order(
        "pc_name",
        {
          ascending: true
        }
      );

  if (error) {

    console.error(error);

    pcList.innerHTML = `
      <p>
        Gagal mengambil daftar PC.
      </p>
    `;

    return;
  }

  if (!data || data.length === 0) {

    pcList.innerHTML = `
      <p>
        Belum ada PC yang terhubung.
      </p>
    `;

    return;
  }

  pcList.innerHTML = "";

  data.forEach((pc) => {

    const card =
      document.createElement("div");

    card.className =
      "pc-card";

    const online =
      pc.status === "online";

    card.innerHTML = `
      <div>

        <h2>
          ${pc.pc_name || "PC Tanpa Nama"}
        </h2>

        <p>
          ${pc.os || "Windows"}
        </p>

      </div>

      <div>

        <span
          class="status ${
            online
              ? "online"
              : "offline"
          }"
        >
          ${
            online
              ? "ONLINE"
              : "OFFLINE"
          }
        </span>

      </div>
    `;

    card.addEventListener(
      "click",
      () => {

        openPC(
          pc.device_id
        );

      }
    );

    pcList.appendChild(card);

  });
}

// ============================================================
// OPEN PC
// ============================================================

window.openPC =
  async function (
    deviceId
  ) {

    isOnPCPage = true;

    const pc =
      await getPCStatus(
        deviceId
      );

    if (!pc) {

      app.innerHTML = `
        <div class="container">

          <h1>
            PC tidak ditemukan
          </h1>

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

    const online =
      pc.status === "online";

    app.innerHTML = `
      <div class="container">

        <div class="screen-header">

          <div>

            <h1>
              ${pc.pc_name}
            </h1>

            <p>
              ${pc.os || "Windows"}
            </p>

          </div>

          <span class="live-status">

            ${
              online
                ? "🟢 ONLINE"
                : "🔴 OFFLINE"
            }

          </span>

        </div>

        <div class="controls">

          <button
            onclick="pingPC('${deviceId}')"
          >
            📡 Ping
          </button>

          <button
            onclick="viewScreen('${deviceId}')"
          >
            🖥️ Lihat Layar
          </button>

          <button
            onclick="shutdownPC('${deviceId}')"
          >
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
// BACK
// ============================================================

window.backToPCList =
  function () {

    isOnPCPage = false;

    app.innerHTML = `
      <div class="container">

        <h1>
          Remote PC
        </h1>

        <p>
          Pilih PC yang ingin dikendalikan.
        </p>

        <div
          id="pc-list"
          class="pc-list"
        >
          <p>
            Memuat PC...
          </p>
        </div>

      </div>
    `;

    loadPCs();
  };

// ============================================================
// SEND COMMAND
// ============================================================

async function sendCommand(
  deviceId,
  command
) {

  const { error } =
    await supabase
      .from("commands")
      .insert({
        device_id: deviceId,
        command: command
      });

  if (error) {

    console.error(
      "Command error:",
      error
    );

    return false;
  }

  return true;
}

// ============================================================
// PING
// ============================================================

window.pingPC =
  async function (
    deviceId
  ) {

    const success =
      await sendCommand(
        deviceId,
        "ping"
      );

    if (success) {

      alert(
        "📡 Ping command terkirim."
      );

    }
  };

// ============================================================
// VIEW SCREEN
// ============================================================

window.viewScreen =
  async function (
    deviceId
  ) {

    isOnPCPage = true;

    const pc =
      await getPCStatus(
        deviceId
      );

    if (!pc) {
      return;
    }

    app.innerHTML = `

      <div
        class="container screen-page"
      >

        <div class="screen-header">

          <div>

            <h1>
              🖥️ Remote Screen
            </h1>

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

        <!-- ==================================================
             LIVE SCREEN
        ================================================== -->

        <div
          id="screen-box"
          class="screen-box"
        >

          <div
            id="screen-loading"
          >

            <div class="loader"></div>

            <div>
              Menghubungkan ke layar PC...
            </div>

          </div>

          <img
            id="live-screen"
            alt="Live Screen"
            draggable="false"
          />

          <!-- VIRTUAL CURSOR -->

          <div
            id="virtual-cursor"
            aria-hidden="true"
          >

            <div
              class="cursor-dot"
            ></div>

            <div
              class="cursor-ring"
            ></div>

          </div>

        </div>

        <!-- ==================================================
             VIRTUAL MOUSE
        ================================================== -->

        <div
          class="virtual-mouse"
        >

          <div class="virtual-title">
            🎯 Mouse Virtual
          </div>

          <div class="mouse-info">
            Geser cursor biru di layar.
            Mouse Windows tidak akan bergerak.
            Gunakan tombol di bawah untuk klik.
          </div>

          <div
            class="mouse-buttons"
          >

            <button
              class="mouse-button"
              id="screen-left-click"
            >
              🖱️ Klik Kiri
            </button>

            <button
              class="mouse-button"
              id="screen-right-click"
            >
              🖱️ Klik Kanan
            </button>

            <button
              class="mouse-button"
              id="screen-double-click"
            >
              🖱️ Double Click
            </button>

            <button
              class="mouse-button"
              id="screen-middle-click"
            >
              🖱️ Klik Tengah
            </button>

          </div>

        </div>

        <!-- ==================================================
             TOUCHPAD
        ================================================== -->

        <div
          class="virtual-mouse"
        >

          <div class="virtual-title">
            🖱️ Touchpad
          </div>

          <div
            id="virtual-touchpad"
            class="virtual-touchpad"
          >

            <div
              class="touchpad-icon"
            >
              🖱️
            </div>

            <div>
              Geser untuk menggerakkan
              mouse Windows
            </div>

          </div>

          <div
            class="scroll-buttons"
          >

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

        <!-- ==================================================
             KEYBOARD
        ================================================== -->

        <div
          class="virtual-keyboard"
        >

          <input
            id="keyboard-input"
            type="text"
            placeholder="Ketik teks untuk dikirim ke PC..."
            autocomplete="off"
          />

          <div
            class="keyboard-row"
          >

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

          <div
            class="keyboard-row"
          >

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

          <div
            class="keyboard-row"
          >

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

          <div
            class="keyboard-row"
          >

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

    // ========================================================
    // ELEMENTS
    // ========================================================

    const screenBox =
      document.querySelector(
        "#screen-box"
      );

    const liveScreen =
      document.querySelector(
        "#live-screen"
      );

    const screenLoading =
      document.querySelector(
        "#screen-loading"
      );

    const liveStatus =
      document.querySelector(
        "#live-status"
      );

    const virtualCursor =
      document.querySelector(
        "#virtual-cursor"
      );

    // ========================================================
    // SCREEN INTERACTION SETTINGS
    //
    // Pointer ditangkap oleh screenBox.
    // Ini membuat cursor tetap bisa digerakkan walaupun
    // gambar live screen mempunyai masalah pointer-events.
    // ========================================================

    screenBox.style.touchAction = "none";
    screenBox.style.userSelect = "none";

    liveScreen.style.userSelect = "none";
    liveScreen.style.webkitUserSelect = "none";
    liveScreen.style.webkitTouchCallout = "none";

    virtualCursor.style.pointerEvents = "none";

    // ========================================================
    // VIRTUAL CURSOR
    // ========================================================

    let cursorX = 0;
    let cursorY = 0;

    let cursorReady = false;

    function resetCursor() {

      const imageRect =
        liveScreen.getBoundingClientRect();

      const boxRect =
        screenBox.getBoundingClientRect();

      if (
        imageRect.width <= 0 ||
        imageRect.height <= 0
      ) {

        return;
      }

      cursorX =
        imageRect.left -
        boxRect.left +
        imageRect.width / 2;

      cursorY =
        imageRect.top -
        boxRect.top +
        imageRect.height / 2;

      cursorReady = true;

      virtualCursor.style.left =
        `${cursorX}px`;

      virtualCursor.style.top =
        `${cursorY}px`;
    }

    function setCursorPosition(
      x,
      y
    ) {

      const imageRect =
        liveScreen.getBoundingClientRect();

      const boxRect =
        screenBox.getBoundingClientRect();

      const minX =
        imageRect.left -
        boxRect.left;

      const minY =
        imageRect.top -
        boxRect.top;

      const maxX =
        minX +
        imageRect.width;

      const maxY =
        minY +
        imageRect.height;

      cursorX =
        Math.max(
          minX,
          Math.min(
            maxX,
            x
          )
        );

      cursorY =
        Math.max(
          minY,
          Math.min(
            maxY,
            y
          )
        );

      virtualCursor.style.left =
        `${cursorX}px`;

      virtualCursor.style.top =
        `${cursorY}px`;
    }

    // ========================================================
    // GET VIRTUAL CURSOR WINDOWS COORDINATES
    // ========================================================

    function getVirtualCursorWindowsCoordinates() {

      const imageRect =
        liveScreen.getBoundingClientRect();

      const imageWidth =
        liveScreen.naturalWidth || 1920;

      const imageHeight =
        liveScreen.naturalHeight || 1080;

      const cursorRect =
        virtualCursor.getBoundingClientRect();

      const cursorCenterX =
        cursorRect.left +
        cursorRect.width / 2;

      const cursorCenterY =
        cursorRect.top +
        cursorRect.height / 2;

      let x =
        (
          cursorCenterX -
          imageRect.left
        )
        *
        (
          imageWidth /
          imageRect.width
        );

      let y =
        (
          cursorCenterY -
          imageRect.top
        )
        *
        (
          imageHeight /
          imageRect.height
        );

      x =
        Math.round(x);

      y =
        Math.round(y);

      x =
        Math.max(
          0,
          Math.min(
            imageWidth - 1,
            x
          )
        );

      y =
        Math.max(
          0,
          Math.min(
            imageHeight - 1,
            y
          )
        );

      return {
        x,
        y
      };
    }

    // ========================================================
    // UPDATE VIRTUAL CURSOR
    //
    // PENTING:
    // TIDAK ADA sendCommand DI SINI.
    //
    // Jadi gerakan cursor biru TIDAK menggerakkan
    // mouse Windows.
    // ========================================================

    function updateVirtualCursor(
      clientX,
      clientY
    ) {

      const imageRect =
        liveScreen.getBoundingClientRect();

      const boxRect =
        screenBox.getBoundingClientRect();

      if (
        imageRect.width <= 0 ||
        imageRect.height <= 0
      ) {

        return;
      }

      let localX =
        clientX -
        imageRect.left;

      let localY =
        clientY -
        imageRect.top;

      localX =
        Math.max(
          0,
          Math.min(
            imageRect.width,
            localX
          )
        );

      localY =
        Math.max(
          0,
          Math.min(
            imageRect.height,
            localY
          )
        );

      const newX =
        imageRect.left -
        boxRect.left +
        localX;

      const newY =
        imageRect.top -
        boxRect.top +
        localY;

      setCursorPosition(
        newX,
        newY
      );
    }

    // ========================================================
    // RESET CURSOR SETELAH LAYAR SIAP
    // ========================================================

    function resetCursorWhenReady() {

      if (
        liveScreen.naturalWidth > 0 &&
        liveScreen.naturalHeight > 0
      ) {

        resetCursor();

      }
    }

    // ========================================================
    // SCREEN POINTER
    //
    // PERBAIKAN UTAMA:
    // Event sekarang ditangkap oleh screenBox.
    //
    // TIDAK ADA sendCommand DI SINI.
    // ========================================================

    let screenDragging = false;

    screenBox.addEventListener(
      "pointerdown",
      (event) => {

        if (
          event.target.closest?.(
            "button"
          )
        ) {

          return;
        }

        event.preventDefault();

        if (
          liveScreen.naturalWidth <= 0 ||
          liveScreen.naturalHeight <= 0
        ) {

          return;
        }

        screenDragging = true;

        try {

          screenBox.setPointerCapture(
            event.pointerId
          );

        } catch (error) {
          // ignore
        }

        updateVirtualCursor(
          event.clientX,
          event.clientY
        );
      }
    );

    screenBox.addEventListener(
      "pointermove",
      (event) => {

        if (!screenDragging) {
          return;
        }

        event.preventDefault();

        updateVirtualCursor(
          event.clientX,
          event.clientY
        );
      }
    );

    screenBox.addEventListener(
      "pointerup",
      (event) => {

        screenDragging = false;

        try {

          screenBox.releasePointerCapture(
            event.pointerId
          );

        } catch (error) {
          // ignore
        }
      }
    );

    screenBox.addEventListener(
      "pointercancel",
      () => {

        screenDragging = false;

      }
    );

    screenBox.addEventListener(
      "pointerleave",
      () => {

        // Jangan menghilangkan cursor.
        // Cursor tetap berada di posisi terakhir.

      }
    );

    // ========================================================
    // LEFT CLICK
    // ========================================================

    document
      .querySelector(
        "#screen-left-click"
      )
      .addEventListener(
        "click",
        async () => {

          const coords =
            getVirtualCursorWindowsCoordinates();

          console.log(
            "🖱️ Virtual Left Click:",
            coords.x,
            coords.y
          );

          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );

        }
      );

    // ========================================================
    // RIGHT CLICK
    // ========================================================

    document
      .querySelector(
        "#screen-right-click"
      )
      .addEventListener(
        "click",
        async () => {

          const coords =
            getVirtualCursorWindowsCoordinates();

          console.log(
            "🖱️ Virtual Right Click:",
            coords.x,
            coords.y
          );

          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:right`
          );

        }
      );

    // ========================================================
    // MIDDLE CLICK
    // ========================================================

    document
      .querySelector(
        "#screen-middle-click"
      )
      .addEventListener(
        "click",
        async () => {

          const coords =
            getVirtualCursorWindowsCoordinates();

          console.log(
            "🖱️ Virtual Middle Click:",
            coords.x,
            coords.y
          );

          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:middle`
          );

        }
      );

    // ========================================================
    // DOUBLE CLICK
    // ========================================================

    document
      .querySelector(
        "#screen-double-click"
      )
      .addEventListener(
        "click",
        async () => {

          const coords =
            getVirtualCursorWindowsCoordinates();

          console.log(
            "🖱️ Virtual Double Click:",
            coords.x,
            coords.y
          );

          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                80
              )
          );

          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );

        }
      );

    // ========================================================
    // TOUCHPAD
    //
    // TOUCHPAD TETAP MENGGERAKKAN MOUSE WINDOWS.
    // ========================================================

    const touchpad =
      document.querySelector(
        "#virtual-touchpad"
      );

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

      lastX =
        touch.clientX;

      lastY =
        touch.clientY;

      if (!moveTimer) {

        moveTimer =
          setInterval(
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
        touch.clientX -
        lastX;

      const rawDY =
        touch.clientY -
        lastY;

      lastX =
        touch.clientX;

      lastY =
        touch.clientY;

      const sensitivity =
        2.5;

      moveDX +=
        rawDX *
        sensitivity;

      moveDY +=
        rawDY *
        sensitivity;
    }

    function endTouch(event) {

      if (!touching) {
        return;
      }

      event.preventDefault();

      touching = false;

      sendBufferedMovement();

      if (moveTimer) {

        clearInterval(
          moveTimer
        );

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

    // ========================================================
    // SCROLL
    // ========================================================

    document
      .querySelector(
        "#scroll-up"
      )
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
      .querySelector(
        "#scroll-down"
      )
      .addEventListener(
        "click",
        () => {

          sendCommand(
            deviceId,
            "scroll:-5"
          );

        }
      );

    // ========================================================
    // KEYBOARD
    // ========================================================

    const keyboardInput =
      document.querySelector(
        "#keyboard-input"
      );

    keyboardInput.addEventListener(
      "keydown",
      async (event) => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          const text =
            keyboardInput.value;

          if (
            text.trim() !== ""
          ) {

            await sendCommand(
              deviceId,
              `type_text:${text}`
            );

            keyboardInput.value =
              "";

          }
        }

      }
    );

    // ========================================================
    // KEYBOARD BUTTONS
    // ========================================================

    document
      .querySelectorAll(
        ".keyboard-row button"
      )
      .forEach(
        (button) => {

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

        }
      );

    // ========================================================
    // GET CLOUDFLARE URL
    // ========================================================

    const {
      data: tunnelData,
      error: tunnelError
    } =
      await supabase
        .from("tunnel_urls")
        .select(
          "tunnel_url"
        )
        .eq(
          "device_id",
          deviceId
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(1)
        .maybeSingle();

    if (tunnelError) {

      console.error(
        "Tunnel URL error:",
        tunnelError
      );

      screenLoading.innerHTML = `
        <div class="error-icon">
          ❌
        </div>

        <div>
          Gagal mengambil URL Cloudflare.
        </div>
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
        <div class="error-icon">
          ❌
        </div>

        <div>
          URL Cloudflare belum tersedia.
        </div>
      `;

      liveStatus.textContent =
        "🔴 Tidak tersedia";

      return;
    }

    let websocketURL =
      tunnelData.tunnel_url
        .replace(
          /^https:/,
          "wss:"
        );

    websocketURL +=
      "/screen";

    console.log(
      "WebSocket:",
      websocketURL
    );

    // ========================================================
    // WEBSOCKET
    // ========================================================

    let socket;

    try {

      socket =
        new WebSocket(
          websocketURL
        );

      socket.binaryType =
        "blob";

      socket.onopen =
        () => {

          console.log(
            "🟢 WebSocket connected"
          );

          liveStatus.textContent =
            "🟢 LIVE";
        };

      socket.onmessage =
        (event) => {

          if (
            !(
              event.data
              instanceof Blob
            )
          ) {

            return;
          }

          const imageURL =
            URL.createObjectURL(
              event.data
            );

          liveScreen.onload =
            () => {

              liveScreen.style.display =
                "block";

              screenLoading.style.display =
                "none";

              resetCursorWhenReady();

              setTimeout(
                () => {

                  URL.revokeObjectURL(
                    imageURL
                  );

                },
                1000
              );

            };

          liveScreen.src =
            imageURL;

        };

      socket.onerror =
        (error) => {

          console.error(
            "WebSocket error:",
            error
          );

          liveStatus.textContent =
            "🔴 Error";

          screenLoading.innerHTML = `
            <div class="error-icon">
              ❌
            </div>

            <div>
              Gagal terhubung ke layar PC.
            </div>
          `;

        };

      socket.onclose =
        () => {

          console.log(
            "🔌 WebSocket disconnected"
          );

          liveStatus.textContent =
            "🔴 Terputus";

        };

    } catch (error) {

      console.error(
        error
      );

      liveStatus.textContent =
        "🔴 Error";
    }

    // ========================================================
    // BACK
    // ========================================================

    document
      .querySelector(
        "#back-screen"
      )
      .addEventListener(
        "click",
        () => {

          if (moveTimer) {

            clearInterval(
              moveTimer
            );

            moveTimer = null;

          }

          if (socket) {

            try {

              socket.close();

            } catch (error) {

              console.error(
                error
              );

            }

          }

          window.openPC(
            deviceId
          );

        }
      );
  };

// ============================================================
// SHUTDOWN
// ============================================================

window.shutdownPC =
  async function (
    deviceId
  ) {

    const confirmed =
      confirm(
        "Yakin ingin mematikan PC ini?"
      );

    if (!confirmed) {
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
// AUTO REFRESH
// ============================================================

setInterval(
  () => {

    if (!isOnPCPage) {

      loadPCs();

    }

  },
  5000
);