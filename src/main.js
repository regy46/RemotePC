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

window.openPC = async function (
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
             DIRECT SCREEN MOUSE
        ================================================== -->

        <div
          class="virtual-mouse"
        >

          <div class="virtual-title">
            🎯 Mouse Virtual
          </div>


          <div class="mouse-info">
            Geser atau tap langsung pada layar
            untuk menentukan posisi mouse.
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
    // VIRTUAL CURSOR
    // ========================================================

    let cursorX = 0;
    let cursorY = 0;

    let cursorReady = false;


    function resetCursor() {

      cursorX =
        screenBox.clientWidth / 2;

      cursorY =
        screenBox.clientHeight / 2;

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

      cursorX = Math.max(
        0,
        Math.min(
          screenBox.clientWidth,
          x
        )
      );


      cursorY = Math.max(
        0,
        Math.min(
          screenBox.clientHeight,
          y
        )
      );


      virtualCursor.style.left =
        `${cursorX}px`;

      virtualCursor.style.top =
        `${cursorY}px`;
    }


    resetCursor();


    // ========================================================
    // CONVERT SCREEN POSITION → WINDOWS COORDINATE
    // ========================================================

    function getWindowsCoordinates(
      clientX,
      clientY
    ) {

      const rect =
        liveScreen.getBoundingClientRect();


      const naturalWidth =
        liveScreen.naturalWidth || 1920;

      const naturalHeight =
        liveScreen.naturalHeight || 1080;


      let x =
        (clientX - rect.left)
        *
        (
          naturalWidth /
          rect.width
        );


      let y =
        (clientY - rect.top)
        *
        (
          naturalHeight /
          rect.height
        );


      x = Math.round(x);
      y = Math.round(y);


      x = Math.max(
        0,
        Math.min(
          naturalWidth - 1,
          x
        )
      );


      y = Math.max(
        0,
        Math.min(
          naturalHeight - 1,
          y
        )
      );


      return {
        x,
        y
      };
    }


    // ========================================================
    // SEND CURSOR POSITION
    // ========================================================

    async function sendCursorPosition(
      x,
      y
    ) {

      return await sendCommand(
        deviceId,
        `mouse_move_to:${x}:${y}`
      );
    }


    // ========================================================
    // SCREEN POINTER
    // ========================================================

    let screenDragging = false;

    let lastScreenX = 0;
    let lastScreenY = 0;

    let lastTapTime = 0;

    let screenMoveTimer = null;

    let pendingScreenX = null;
    let pendingScreenY = null;


    function updateScreenCursor(
      clientX,
      clientY
    ) {

      const rect =
        liveScreen.getBoundingClientRect();


      const localX =
        clientX - rect.left;

      const localY =
        clientY - rect.top;


      setCursorPosition(
        localX,
        localY
      );


      const coords =
        getWindowsCoordinates(
          clientX,
          clientY
        );


      pendingScreenX =
        coords.x;

      pendingScreenY =
        coords.y;


      if (!screenMoveTimer) {

        screenMoveTimer =
          setTimeout(
            async () => {

              screenMoveTimer =
                null;


              if (
                pendingScreenX !== null &&
                pendingScreenY !== null
              ) {

                const x =
                  pendingScreenX;

                const y =
                  pendingScreenY;


                pendingScreenX = null;
                pendingScreenY = null;


                await sendCursorPosition(
                  x,
                  y
                );

              }

            },
            60
          );

      }

    }


    // ========================================================
    // MOUSE DOWN
    // ========================================================

    liveScreen.addEventListener(
      "pointerdown",
      (event) => {

        if (
          event.pointerType ===
          "mouse"
        ) {

          event.preventDefault();

        }


        if (!liveScreen.complete) {
          return;
        }


        screenDragging = true;


        lastScreenX =
          event.clientX;

        lastScreenY =
          event.clientY;


        liveScreen.setPointerCapture?.(
          event.pointerId
        );


        updateScreenCursor(
          event.clientX,
          event.clientY
        );


        const now =
          Date.now();


        const timeSinceLastTap =
          now - lastTapTime;


        if (
          timeSinceLastTap < 350
        ) {

          const coords =
            getWindowsCoordinates(
              event.clientX,
              event.clientY
            );


          sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );


          sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );

        }


        lastTapTime = now;

      }
    );


    // ========================================================
    // POINTER MOVE
    // ========================================================

    liveScreen.addEventListener(
      "pointermove",
      (event) => {

        if (!screenDragging) {
          return;
        }


        event.preventDefault();


        const dx =
          event.clientX -
          lastScreenX;


        const dy =
          event.clientY -
          lastScreenY;


        lastScreenX =
          event.clientX;

        lastScreenY =
          event.clientY;


        if (
          Math.abs(dx) < 1 &&
          Math.abs(dy) < 1
        ) {

          return;

        }


        updateScreenCursor(
          event.clientX,
          event.clientY
        );

      }
    );


    // ========================================================
    // POINTER UP
    // ========================================================

    liveScreen.addEventListener(
      "pointerup",
      (event) => {

        screenDragging = false;


        try {

          liveScreen.releasePointerCapture?.(
            event.pointerId
          );

        } catch (error) {
          // ignore
        }

      }
    );


    liveScreen.addEventListener(
      "pointercancel",
      () => {

        screenDragging = false;

      }
    );


    // ========================================================
    // SCREEN LEFT CLICK
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


          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );

        }
      );


    // ========================================================
    // SCREEN RIGHT CLICK
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


          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:right`
          );

        }
      );


    // ========================================================
    // SCREEN MIDDLE CLICK
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


          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:middle`
          );

        }
      );


    // ========================================================
    // SCREEN DOUBLE CLICK
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


          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );


          await sendCommand(
            deviceId,
            `mouse_click_at:${coords.x}:${coords.y}:left`
          );

        }
      );


    // ========================================================
    // GET CURRENT VIRTUAL CURSOR COORDINATES
    // ========================================================

    function getVirtualCursorWindowsCoordinates() {

      const rect =
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
          rect.left
        )
        *
        (
          imageWidth /
          rect.width
        );


      let y =
        (
          cursorCenterY -
          rect.top
        )
        *
        (
          imageHeight /
          rect.height
        );


      x = Math.round(x);
      y = Math.round(y);


      x = Math.max(
        0,
        Math.min(
          imageWidth - 1,
          x
        )
      );


      y = Math.max(
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
    // TOUCHPAD
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


      const dx =
        rawDX *
        sensitivity;


      const dy =
        rawDY *
        sensitivity;


      moveDX += dx;
      moveDY += dy;

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


              if (!cursorReady) {

                resetCursor();

              }


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


          if (screenMoveTimer) {

            clearTimeout(
              screenMoveTimer
            );

            screenMoveTimer = null;

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