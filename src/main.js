import { createClient } from '@supabase/supabase-js'
import './style.css'


// ==============================
// SUPABASE
// ==============================

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)


let isOnPCPage = false


// ==============================
// AWAL
// ==============================

document.querySelector('#app').innerHTML = `

  <div class="container">

    <h1>Remote PC</h1>

    <p>Mengambil daftar PC...</p>

  </div>

`


// ==============================
// STATUS PC
// ==============================

function getPCStatus(pc) {

  if (pc.status === 'online') {

    return {
      text: 'online',
      icon: '🟢'
    }

  }

  return {
    text: 'offline',
    icon: '🔴'
  }

}


// ==============================
// LOAD PC
// ==============================

async function loadPCs() {

  if (isOnPCPage) {
    return
  }


  const {
    data,
    error
  } = await supabase

    .from('devices')

    .select('*')

    .order(
      'pc_name'
    )


  if (error) {

    document.querySelector('#app').innerHTML = `

      <div class="container">

        <h1>Remote PC</h1>

        <p>
          ❌ Gagal mengambil data PC
        </p>

        <pre>${error.message}</pre>

      </div>

    `

    return

  }


  const pcs = data.map(pc => {

    const status =
      getPCStatus(pc)


    return `

      <div
        class="pc-card"
        onclick="openPC('${pc.device_id}')"
      >

        <div>

          <h2>
            ${pc.pc_name}
          </h2>

          <p>
            ${pc.os}
          </p>

        </div>


        <span
          class="status ${status.text}"
        >

          ${status.icon}
          ${status.text}

        </span>

      </div>

    `

  }).join('')


  document.querySelector('#app').innerHTML = `

    <div class="container">

      <h1>
        Remote PC
      </h1>


      <p>
        PC yang terhubung
      </p>


      <div class="pc-list">

        ${
          pcs ||
          '<p>Belum ada PC.</p>'
        }

      </div>

    </div>

  `

}


// ==============================
// BUKA PC
// ==============================

window.openPC = function (deviceId) {

  isOnPCPage = true


  document.querySelector('#app').innerHTML = `

    <div class="container">

      <h1>
        Remote PC
      </h1>


      <div class="pc-card">

        <div>

          <h2>
            PC Terpilih
          </h2>


          <p>
            ID: ${deviceId}
          </p>

        </div>

      </div>


      <div class="controls">

        <button
          onclick="pingPC('${deviceId}')"
        >
          🏓 Ping PC
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

  `

}


// ==============================
// KEMBALI
// ==============================

window.backToPCList = function () {

  isOnPCPage = false

  loadPCs()

}


// ==============================
// PING PC
// ==============================

window.pingPC = async function (deviceId) {

  const {
    error
  } = await supabase

    .from('commands')

    .insert({

      device_id: deviceId,

      command: 'ping',

      status: 'pending'

    })


  if (error) {

    alert(
      '❌ Gagal mengirim ping:\n\n' +
      error.message
    )

    return

  }


  alert(
    '🏓 Ping berhasil dikirim!'
  )

}


// ==============================
// KIRIM COMMAND
// ==============================

async function sendCommand(
  deviceId,
  command
) {

  const {
    error
  } = await supabase

    .from('commands')

    .insert({

      device_id: deviceId,

      command: command,

      status: 'pending'

    })


  if (error) {

    console.error(
      '❌ Gagal mengirim command:',
      error
    )

    return false

  }


  return true

}


// ==============================
// LIHAT LAYAR
// ==============================

window.viewScreen = async function (deviceId) {

  document.querySelector('#app').innerHTML = `

    <div
      class="container screen-page"
    >


      <div
        class="screen-header"
      >

        <div>

          <h1>
            🖥️ Lihat Layar
          </h1>


          <p>
            Menampilkan layar PC secara langsung
          </p>

        </div>


        <span
          class="live-status"
        >
          🟡 CONNECTING
        </span>

      </div>


      <div
        class="screen-box"
      >

        <div
          id="screen-loading"
        >

          <div
            class="loader"
          ></div>


          <p>
            Mengambil alamat PC...
          </p>

        </div>


        <img
          id="live-screen"
          alt="Layar PC"
        >

      </div>


      <!-- ========================= -->
      <!-- MOUSE VIRTUAL -->
      <!-- ========================= -->

      <div class="virtual-mouse">

        <div class="virtual-title">
          🖱️ Mouse Virtual
        </div>


        <div
          id="virtual-touchpad"
          class="virtual-touchpad"
        >

          <div class="touchpad-icon">
            🖱️
          </div>

          <div>
            Geser jari untuk menggerakkan mouse
          </div>

        </div>


        <div class="mouse-buttons">

          <button
            id="left-click"
            class="mouse-button"
          >
            👈 Klik Kiri
          </button>


          <button
            id="right-click"
            class="mouse-button"
          >
            👉 Klik Kanan
          </button>

        </div>


        <div class="mouse-buttons">

          <button
            id="double-click"
            class="mouse-button"
          >
            👆 Double Click
          </button>


          <button
            id="middle-click"
            class="mouse-button"
          >
            🖱️ Klik Tengah
          </button>

        </div>


        <div class="scroll-buttons">

          <button
            id="scroll-up"
            class="mouse-button"
          >
            🔼 Scroll Atas
          </button>


          <button
            id="scroll-down"
            class="mouse-button"
          >
            🔽 Scroll Bawah
          </button>

        </div>


        <!-- ========================= -->
        <!-- KEYBOARD -->
        <!-- ========================= -->

        <div class="virtual-keyboard">

          <div class="virtual-title">
            ⌨️ Keyboard Virtual
          </div>


          <input
            id="keyboard-input"
            type="text"
            placeholder="Ketik teks di sini..."
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
          />


          <div class="keyboard-row">

            <button
              data-key="esc"
            >
              Esc
            </button>

            <button
              data-key="tab"
            >
              Tab
            </button>

            <button
              data-key="backspace"
            >
              ⌫
            </button>

            <button
              data-key="enter"
            >
              Enter
            </button>

          </div>


          <div class="keyboard-row">

            <button
              data-key="space"
              class="space-key"
            >
              Space
            </button>

          </div>


          <div class="keyboard-row">

            <button
              data-key="arrowleft"
            >
              ←
            </button>

            <button
              data-key="arrowup"
            >
              ↑
            </button>

            <button
              data-key="arrowdown"
            >
              ↓
            </button>

            <button
              data-key="arrowright"
            >
              →
            </button>

          </div>


          <div class="keyboard-row">

            <button
              data-key="ctrl"
            >
              Ctrl
            </button>

            <button
              data-key="shift"
            >
              Shift
            </button>

            <button
              data-key="alt"
            >
              Alt
            </button>

            <button
              data-key="delete"
            >
              Del
            </button>

          </div>

        </div>

      </div>


      <button
        class="back-button"
        onclick="openPC('${deviceId}')"
      >
        ← Kembali
      </button>


    </div>

  `


  const img =
    document.querySelector(
      '#live-screen'
    )


  const loading =
    document.querySelector(
      '#screen-loading'
    )


  const liveStatus =
    document.querySelector(
      '.live-status'
    )


  // ==============================
  // VIRTUAL MOUSE ELEMENT
  // ==============================

  const touchpad =
    document.querySelector(
      '#virtual-touchpad'
    )


  const leftClick =
    document.querySelector(
      '#left-click'
    )


  const rightClick =
    document.querySelector(
      '#right-click'
    )


  const doubleClick =
    document.querySelector(
      '#double-click'
    )


  const middleClick =
    document.querySelector(
      '#middle-click'
    )


  const scrollUp =
    document.querySelector(
      '#scroll-up'
    )


  const scrollDown =
    document.querySelector(
      '#scroll-down'
    )


  // ==============================
  // TOUCHPAD
  // ==============================

  let touching = false

  let lastX = 0

  let lastY = 0

  let moveBufferX = 0

  let moveBufferY = 0

  let moveTimer = null


  function sendMouseMove() {

    if (
      moveBufferX === 0 &&
      moveBufferY === 0
    ) {
      return
    }


    const dx =
      Math.round(moveBufferX)

    const dy =
      Math.round(moveBufferY)


    moveBufferX = 0
    moveBufferY = 0


    sendCommand(
      deviceId,
      `mouse_move_relative:${dx}:${dy}`
    )

  }


  function startTouch(event) {

    event.preventDefault()


    const touch =
      event.touches[0]


    lastX =
      touch.clientX


    lastY =
      touch.clientY


    touching = true

  }


  function moveTouch(event) {

    event.preventDefault()


    if (!touching) {
      return
    }


    const touch =
      event.touches[0]


    const dx =
      (touch.clientX - lastX) * 2.5


    const dy =
      (touch.clientY - lastY) * 2.5


    lastX =
      touch.clientX


    lastY =
      touch.clientY


    moveBufferX += dx

    moveBufferY += dy


    if (!moveTimer) {

      moveTimer = setTimeout(
        function () {

          sendMouseMove()

          moveTimer = null

        },
        80
      )

    }

  }


  function endTouch(event) {

    event.preventDefault()

    touching = false

  }


  touchpad.addEventListener(
    'touchstart',
    startTouch,
    {
      passive: false
    }
  )


  touchpad.addEventListener(
    'touchmove',
    moveTouch,
    {
      passive: false
    }
  )


  touchpad.addEventListener(
    'touchend',
    endTouch,
    {
      passive: false
    }
  )


  touchpad.addEventListener(
    'touchcancel',
    endTouch,
    {
      passive: false
    }
  )


  // ==============================
  // MOUSE BUTTONS
  // ==============================

  leftClick.onclick =
    function () {

      sendCommand(
        deviceId,
        'mouse_click:left'
      )

    }


  rightClick.onclick =
    function () {

      sendCommand(
        deviceId,
        'mouse_click:right'
      )

    }


  doubleClick.onclick =
    function () {

      sendCommand(
        deviceId,
        'mouse_double_click:left'
      )

    }


  middleClick.onclick =
    function () {

      sendCommand(
        deviceId,
        'mouse_click:middle'
      )

    }


  // ==============================
  // SCROLL
  // ==============================

  scrollUp.onclick =
    function () {

      sendCommand(
        deviceId,
        'scroll:5'
      )

    }


  scrollDown.onclick =
    function () {

      sendCommand(
        deviceId,
        'scroll:-5'
      )

    }


  // ==============================
  // KEYBOARD
  // ==============================

  const keyboardInput =
    document.querySelector(
      '#keyboard-input'
    )


  let typingTimer = null


  keyboardInput.addEventListener(
    'input',
    function () {

      const text =
        keyboardInput.value


      if (!text) {
        return
      }


      clearTimeout(
        typingTimer
      )


      typingTimer =
        setTimeout(
          function () {

            sendCommand(
              deviceId,
              `type_text:${text}`
            )


            keyboardInput.value = ''

          },
          250
        )

    }
  )


  document
    .querySelectorAll(
      '.keyboard-row button'
    )
    .forEach(
      function (button) {

        button.addEventListener(
          'click',
          function () {

            const key =
              button.dataset.key


            sendCommand(
              deviceId,
              `key:${key}`
            )

          }
        )

      }
    )


  try {

    // ==============================
    // AMBIL CLOUDFLARE TERBARU
    // ==============================

    const {
      data,
      error
    } = await supabase

      .from('tunnel_urls')

      .select(
        'tunnel_url, created_at'
      )

      .eq(
        'device_id',
        deviceId
      )

      .order(
        'id',
        {
          ascending: false
        }
      )

      .limit(1)

      .single()


    if (error) {

      throw new Error(
        'Gagal mengambil URL PC: ' +
        error.message
      )

    }


    if (
      !data ||
      !data.tunnel_url
    ) {

      throw new Error(
        'PC belum memiliki URL Cloudflare.'
      )

    }


    const tunnelUrl =
      data.tunnel_url


    // ==============================
    // HTTPS → WSS
    // ==============================

    const websocketUrl =
      tunnelUrl
        .replace(
          /^https:\/\//,
          'wss://'
        ) +
      '/screen'


    console.log(
      '🌐 Tunnel:',
      tunnelUrl
    )


    console.log(
      '🖥️ WebSocket:',
      websocketUrl
    )


    loading.innerHTML = `

      <div class="loader"></div>

      <p>
        Menghubungkan ke layar PC...
      </p>

    `


    // ==============================
    // WEBSOCKET
    // ==============================

    const socket =
      new WebSocket(
        websocketUrl
      )


    socket.binaryType =
      'blob'


    // ==============================
    // CONNECTED
    // ==============================

    socket.onopen =
      function () {

        console.log(
          '🟢 Terhubung ke screen server'
        )


        liveStatus.textContent =
          '🟢 LIVE'


        loading.innerHTML = `

          <div class="loader"></div>

          <p>
            Menunggu layar PC...
          </p>

        `

      }


    // ==============================
    // FRAME
    // ==============================

    socket.onmessage =
      function (event) {

        const url =
          URL.createObjectURL(
            event.data
          )


        const oldUrl =
          img.dataset.url


        if (oldUrl) {

          URL.revokeObjectURL(
            oldUrl
          )

        }


        img.src =
          url


        img.dataset.url =
          url


        img.style.display =
          'block'


        loading.style.display =
          'none'

      }


    // ==============================
    // ERROR
    // ==============================

    socket.onerror =
      function (error) {

        console.log(
          '❌ Gagal terhubung ke screen server',
          error
        )


        liveStatus.textContent =
          '🔴 OFFLINE'


        loading.innerHTML = `

          <div class="error-icon">
            ❌
          </div>


          <p>
            Gagal terhubung ke PC.
          </p>


          <small>
            Pastikan PC target sedang menyala.
          </small>

        `

      }


    // ==============================
    // CLOSE
    // ==============================

    socket.onclose =
      function () {

        console.log(
          '🔴 Screen server terputus'
        )


        liveStatus.textContent =
          '🔴 TERPUTUS'


        if (
          img.style.display !==
          'block'
        ) {

          loading.innerHTML = `

            <div class="error-icon">
              🔴
            </div>


            <p>
              Koneksi ke PC terputus.
            </p>

          `

        }

      }


  } catch (error) {

    console.error(
      error
    )


    liveStatus.textContent =
      '🔴 ERROR'


    loading.innerHTML = `

      <div class="error-icon">
        ❌
      </div>


      <p>
        Gagal mengambil koneksi PC.
      </p>


      <small>
        ${error.message}
      </small>

    `

  }

}


// ==============================
// SHUTDOWN
// ==============================

window.shutdownPC =
  function (deviceId) {

    alert(
      '⏻ Shutdown belum dibuat.\n\n' +
      'Device: ' +
      deviceId
    )

  }


// ==============================
// LOAD AWAL
// ==============================

loadPCs()


// ==============================
// AUTO REFRESH STATUS
// ==============================

setInterval(
  function () {

    if (!isOnPCPage) {

      loadPCs()

    }

  },
  5000
)