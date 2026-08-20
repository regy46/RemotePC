import { createClient } from '@supabase/supabase-js'
import './style.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

let isOnPCPage = false

document.querySelector('#app').innerHTML = `
  <div class="container">
    <h1>Remote PC</h1>
    <p>Mengambil daftar PC...</p>
  </div>
`

function getPCStatus(lastSeen) {
  if (!lastSeen) {
    return {
      text: 'offline',
      icon: '🔴'
    }
  }

  const difference =
    Date.now() - new Date(lastSeen).getTime()

  if (difference > 30000) {
    return {
      text: 'offline',
      icon: '🔴'
    }
  }

  return {
    text: 'online',
    icon: '🟢'
  }
}

async function loadPCs() {
  if (isOnPCPage) return

  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .order('pc_name')

  if (error) {
    document.querySelector('#app').innerHTML = `
      <div class="container">
        <h1>Remote PC</h1>
        <p>❌ Gagal mengambil data PC</p>
        <pre>${error.message}</pre>
      </div>
    `

    return
  }

  const pcs = data.map(pc => {

    const status = getPCStatus(
      pc.last_seen
    )

    return `
      <div
        class="pc-card"
        onclick="openPC('${pc.device_id}')"
      >

        <div>
          <h2>${pc.pc_name}</h2>
          <p>${pc.os}</p>
        </div>

        <span class="status ${status.text}">
          ${status.icon} ${status.text}
        </span>

      </div>
    `
  }).join('')

  document.querySelector('#app').innerHTML = `
    <div class="container">

      <h1>Remote PC</h1>

      <p>PC yang terhubung</p>

      <div class="pc-list">
        ${
          pcs ||
          '<p>Belum ada PC.</p>'
        }
      </div>

    </div>
  `
}


window.openPC = function (deviceId) {

  isOnPCPage = true

  document.querySelector('#app').innerHTML = `
    <div class="container">

      <h1>Remote PC</h1>

      <div class="pc-card">

        <div>
          <h2>PC Terpilih</h2>

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


window.backToPCList = function () {

  isOnPCPage = false

  loadPCs()
}


window.pingPC = async function (deviceId) {

  const { error } = await supabase
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


window.viewScreen = async function (deviceId) {

  document.querySelector('#app').innerHTML = `
    <div class="container screen-page">

      <div class="screen-header">

        <div>
          <h1>🖥️ Lihat Layar</h1>

          <p>
            Menampilkan layar PC secara langsung
          </p>
        </div>

        <span class="live-status">
          🟡 CONNECTING
        </span>

      </div>

      <div class="screen-box">

        <div id="screen-loading">

          <div class="loader"></div>

          <p>
            Mengambil alamat PC...
          </p>

        </div>

        <img
          id="live-screen"
          alt="Layar PC"
        >

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


  try {

    /*
      Ambil URL Cloudflare TERBARU
      khusus untuk PC yang dipilih.
    */

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


    /*
      Contoh:

      https://abc.trycloudflare.com

      menjadi:

      wss://abc.trycloudflare.com/screen
    */

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


    const socket =
      new WebSocket(
        websocketUrl
      )


    socket.binaryType =
      'blob'


    socket.onopen = function () {

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


        img.src = url

        img.dataset.url =
          url

        img.style.display =
          'block'

        loading.style.display =
          'none'
      }


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


window.shutdownPC =
  function (deviceId) {

    alert(
      '⏻ Shutdown belum dibuat.\n\n' +
      'Device: ' +
      deviceId
    )``
  }


loadPCs()