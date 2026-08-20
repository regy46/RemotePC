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

  const {
    data,
    error
  } = await supabase
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

  const {
    data,
    error
  } = await supabase
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

  if (
    !data ||
    data.length === 0
  ) {

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

  const {
    error
  } = await supabase
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
          Mouse Windows tidak bergerak.
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

  const touchpad =
    document.querySelector(
      "#virtual-touchpad"
    );


  // ========================================================
  // SCREEN SETTINGS
  // ========================================================

  screenBox.style.touchAction =
    "none";

  screenBox.style.userSelect =
    "none";

  screenBox.style.webkitUserSelect =
    "none";

  screenBox.style.webkitTouchCallout =
    "none";

  screenBox.style.pointerEvents =
    "auto";


  liveScreen.style.pointerEvents =
    "auto";

  liveScreen.style.userSelect =
    "none";

  liveScreen.style.webkitUserSelect =
    "none";

  liveScreen.style.webkitTouchCallout =
    "none";

  liveScreen.style.webkitUserDrag =
    "none";


  /*
   * VIRTUAL CURSOR SAMA SEKALI TIDAK
   * BOLEH MENERIMA POINTER.
   */

  virtualCursor.style.pointerEvents =
    "none";


  // ========================================================
  // VIRTUAL CURSOR STATE
  // ========================================================

  let cursorX = 0;
  let cursorY = 0;

  let cursorInitialized =
    false;


  // ========================================================
  // RESET CURSOR
  // ========================================================

  function resetVirtualCursor() {

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


    cursorInitialized =
      true;


    virtualCursor.style.left =
      `${cursorX}px`;

    virtualCursor.style.top =
      `${cursorY}px`;
  }


  // ========================================================
  // MOVE VIRTUAL CURSOR
  //
  // PENTING:
  //
  // Fungsi ini TIDAK PERNAH memanggil:
  //
  // sendCommand()
  //
  // Jadi mouse Windows tidak tersentuh.
  // ========================================================

  function moveVirtualCursor(
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


    /*
     * Posisi touch relatif terhadap
     * gambar layar.
     */

    let localX =
      clientX -
      imageRect.left;

    let localY =
      clientY -
      imageRect.top;


    /*
     * Batasi cursor di area gambar.
     */

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


    /*
     * Ubah ke posisi relatif screen-box.
     */

    cursorX =
      imageRect.left -
      boxRect.left +
      localX;

    cursorY =
      imageRect.top -
      boxRect.top +
      localY;


    /*
     * HANYA update tampilan cursor.
     */

    virtualCursor.style.left =
      `${cursorX}px`;

    virtualCursor.style.top =
      `${cursorY}px`;
  }


  // ========================================================
  // POINTER STATE
  // ========================================================

  let virtualDragging =
    false;

  let activePointerId =
    null;


  // ========================================================
  // POINTER DOWN
  //
  // TIDAK ADA COMMAND MOUSE.
  // ========================================================

  function virtualPointerDown(
    event
  ) {

    /*
     * Hanya pointer utama.
     */

    if (
      event.pointerType ===
      "mouse"
    ) {

      /*
       * Mouse komputer di browser
       * tetap boleh menggerakkan cursor
       * virtual.
       */

    }


    event.preventDefault();

    virtualDragging =
      true;

    activePointerId =
      event.pointerId;


    try {

      screenBox.setPointerCapture(
        event.pointerId
      );

    } catch {
      // ignore
    }


    moveVirtualCursor(
      event.clientX,
      event.clientY
    );
  }


  // ========================================================
  // POINTER MOVE
  //
  // INI HANYA MENGGERAKKAN CURSOR BIRU.
  //
  // TIDAK ADA:
  //
  // sendCommand()
  //
  // pyautogui
  //
  // mouse_move
  //
  // mouse_move_to
  //
  // ========================================================

  function virtualPointerMove(
    event
  ) {

    if (!virtualDragging) {
      return;
    }

    if (
      activePointerId !==
      event.pointerId
    ) {
      return;
    }


    event.preventDefault();


    moveVirtualCursor(
      event.clientX,
      event.clientY
    );
  }


  // ========================================================
  // POINTER UP
  // ========================================================

  function virtualPointerUp(
    event
  ) {

    if (
      activePointerId !==
      event.pointerId
    ) {
      return;
    }


    event.preventDefault();


    virtualDragging =
      false;

    activePointerId =
      null;


    try {

      screenBox.releasePointerCapture(
        event.pointerId
      );

    } catch {
      // ignore
    }
  }


  // ========================================================
  // POINTER CANCEL
  // ========================================================

  function virtualPointerCancel() {

    virtualDragging =
      false;

    activePointerId =
      null;
  }


  // ========================================================
  // REGISTER SCREEN POINTER
  // ========================================================

  screenBox.addEventListener(
    "pointerdown",
    virtualPointerDown,
    {
      passive: false
    }
  );

  screenBox.addEventListener(
    "pointermove",
    virtualPointerMove,
    {
      passive: false
    }
  );

  screenBox.addEventListener(
    "pointerup",
    virtualPointerUp,
    {
      passive: false
    }
  );

  screenBox.addEventListener(
    "pointercancel",
    virtualPointerCancel,
    {
      passive: false
    }
  );


  // ========================================================
  // BLOCK NATIVE DRAG
  // ========================================================

  liveScreen.addEventListener(
    "dragstart",
    (event) => {

      event.preventDefault();

    }
  );


  // ========================================================
  // WINDOWS SCREEN COORDINATES
  //
  // HANYA dipanggil ketika CLICK.
  // ========================================================

  function getVirtualCursorCoordinates() {

    const imageRect =
      liveScreen.getBoundingClientRect();


    const screenWidth =
      liveScreen.naturalWidth;

    const screenHeight =
      liveScreen.naturalHeight;


    if (
      !screenWidth ||
      !screenHeight ||
      imageRect.width <= 0 ||
      imageRect.height <= 0
    ) {

      return null;
    }


    /*
     * Cursor virtual berada
     * dalam screen-box.
     *
     * Ambil titik tengah cursor.
     */

    const cursorRect =
      virtualCursor.getBoundingClientRect();


    const centerX =
      cursorRect.left +
      cursorRect.width / 2;

    const centerY =
      cursorRect.top +
      cursorRect.height / 2;


    /*
     * Konversi posisi browser
     * ke resolusi layar Windows.
     */

    let x =
      (
        centerX -
        imageRect.left
      ) /
      imageRect.width *
      screenWidth;


    let y =
      (
        centerY -
        imageRect.top
      ) /
      imageRect.height *
      screenHeight;


    x =
      Math.round(x);

    y =
      Math.round(y);


    x =
      Math.max(
        0,
        Math.min(
          screenWidth - 1,
          x
        )
      );

    y =
      Math.max(
        0,
        Math.min(
          screenHeight - 1,
          y
        )
      );


    return {
      x,
      y
    };
  }


  // ========================================================
  // VIRTUAL LEFT CLICK
  // ========================================================

  document
    .querySelector(
      "#screen-left-click"
    )
    .addEventListener(
      "click",
      async () => {

        const coords =
          getVirtualCursorCoordinates();


        if (!coords) {
          return;
        }


        console.log(
          "🔵 Virtual LEFT:",
          coords.x,
          coords.y
        );


        /*
         * BARU DI SINI mouse Windows
         * diperintahkan bergerak dan klik.
         */

        await sendCommand(
          deviceId,
          `mouse_click_at:${coords.x}:${coords.y}:left`
        );

      }
    );


  // ========================================================
  // VIRTUAL RIGHT CLICK
  // ========================================================

  document
    .querySelector(
      "#screen-right-click"
    )
    .addEventListener(
      "click",
      async () => {

        const coords =
          getVirtualCursorCoordinates();


        if (!coords) {
          return;
        }


        console.log(
          "🔵 Virtual RIGHT:",
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
  // VIRTUAL MIDDLE CLICK
  // ========================================================

  document
    .querySelector(
      "#screen-middle-click"
    )
    .addEventListener(
      "click",
      async () => {

        const coords =
          getVirtualCursorCoordinates();


        if (!coords) {
          return;
        }


        console.log(
          "🔵 Virtual MIDDLE:",
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
  // VIRTUAL DOUBLE CLICK
  // ========================================================

  document
    .querySelector(
      "#screen-double-click"
    )
    .addEventListener(
      "click",
      async () => {

        const coords =
          getVirtualCursorCoordinates();


        if (!coords) {
          return;
        }


        console.log(
          "🔵 Virtual DOUBLE:",
          coords.x,
          coords.y
        );


        /*
         * Dua click pada koordinat
         * cursor virtual.
         */

        await sendCommand(
          deviceId,
          `mouse_click_at:${coords.x}:${coords.y}:left`
        );


        await new Promise(
          (resolve) =>
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
  // INI SATU-SATUNYA BAGIAN YANG
  // MENGGERAKKAN MOUSE WINDOWS
  // SECARA TERUSAN.
  // ========================================================

  let touching =
    false;

  let lastTouchX =
    0;

  let lastTouchY =
    0;

  let moveDX =
    0;

  let moveDY =
    0;

  let moveTimer =
    null;


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


    moveDX =
      0;

    moveDY =
      0;


    /*
     * HANYA TOUCHPAD yang
     * mengirim mouse_move_relative.
     */

    sendCommand(
      deviceId,
      `mouse_move_relative:${dx}:${dy}`
    );
  }


  function startTouch(
    event
  ) {

    if (
      !event.touches ||
      event.touches.length === 0
    ) {
      return;
    }


    event.preventDefault();


    const touch =
      event.touches[0];


    touching =
      true;


    lastTouchX =
      touch.clientX;

    lastTouchY =
      touch.clientY;


    if (!moveTimer) {

      moveTimer =
        setInterval(
          sendBufferedMovement,
          80
        );

    }
  }


  function moveTouch(
    event
  ) {

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
      lastTouchX;

    const rawDY =
      touch.clientY -
      lastTouchY;


    lastTouchX =
      touch.clientX;

    lastTouchY =
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


  function endTouch(
    event
  ) {

    if (!touching) {
      return;
    }


    event.preventDefault();


    touching =
      false;


    sendBufferedMovement();


    if (moveTimer) {

      clearInterval(
        moveTimer
      );

      moveTimer =
        null;

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


            if (
              !cursorInitialized
            ) {

              resetVirtualCursor();

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

          moveTimer =
            null;
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