// Force HTTPS
// const BASE_URL = "http://localhost:1234"
const BASE_URL = "https://seelsorge-chat.de"
if (window.location.protocol === "http:") {
    window.location = BASE_URL + window.location.pathname;
}

const IS_DEBUG = true;

const debugLog = (...message) => {
    if (IS_DEBUG) {
        console.log("[DEBUG]::", ...message);
    }
}

const TIMEFRAME = {
    start: 1555,
    end: 1855
}

const MONDAY = 1;
const FRIDAY = 5;
const SUNDAY = 0;
const SATURDAY = 6;

/**
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
const inRange = (val, min, max) => val >= min && val <= max;


const serviceTime = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours() * 100;
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes;
    return inRange(currentDay, SUNDAY, SATURDAY) && inRange(currentTime, TIMEFRAME.start, TIMEFRAME.end);
}

async function toggleBehaviour() {
    async function freeSlots() {
        try { 
            return await getFreeSlots();
        }
        catch (e) {
            console.log("Can't fetch Operatordata");
            console.log(e);
            return 0;
        }
    }

    const slots = await freeSlots();
    debugLog(`${slots} slots available`);
    const outOfService = document.querySelector(".service-time");
    const noSlots = document.querySelector(".no-slots");
    if (!serviceTime()) {
        debugLog("outside of timeframe")
        outOfService.classList.add("active");
    } else if (slots === 0) {
        debugLog('no slots available');
        debugLog('showing "no-slots" prompt')
        noSlots.classList.add("show");
    }
}
setTimeout(toggleBehaviour, 0);

const deleteCookies = () => {
    const cookies = document.cookie.split(";");
    cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie;
        if (name.indexOf("uslk") > -1) {
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
    });
}
setTimeout(deleteCookies, 0);

function mobileMenu() {
    const menu = document.querySelector(".mobile-menu");
    const items = document.querySelector(".nav-items");
    const body = document.querySelector("body");
    const servicePopUp = document.querySelector(".service-time");
    menu.onclick = () => {
        menu.classList.toggle("change");
        items.classList.toggle("open");
        body.classList.toggle("blur");
        servicePopUp.classList.toggle("blur");
    }
}
setTimeout(mobileMenu, 0);

function faqBox() {
    const acc = document.querySelectorAll(".accordion");
    acc.forEach(ele => {
        ele.addEventListener("click", () => {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = `${panel.scrollHeight}px`;
            }
        })
    });
}
setTimeout(faqBox, 0);

function typeText() {
    const heading = document.querySelector("#animated");
    const sourceText = heading.innerHTML + ""; // Dadurch erzwingen wir eine Kopie
    for (let i = 0; i <= sourceText.length; i++) {
        setTimeout(() => {
            heading.innerHTML = sourceText.slice(0, i);
        }, 650 * i);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector("#animated") != null) {
        setTimeout(typeText, 0);
    }
});

window.onscroll = function () {
    const outOfService = document.querySelector(".service-time");
    const noSlots = document.querySelector(".no-slots");
    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight) {
        outOfService.classList.add("offset");
        noSlots.classList.add("offset");
    } else {
        outOfService.classList.remove("offset");
        noSlots.classList.remove("offset");
    }
}

const getFreeSlots = async () => {
    console.time('operator-fetch')
    const rawResponse = await fetch(`${BASE_URL}/status.php`, {
        cache: "no-store",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    console.timeEnd('operator-fetch');
    /**
     * @typedef {Object} APIResponse
     * @property {number} slotsFree - number of availabe operators
     * @property {string | null} error - optional error during API call
     * @property {boolean} usingCache - if the result is cached or not
     * @property {number} totalOps - total number of operators
     * @property {number} apiCode - UserLike API reply code
     * @property {string[]} warnings - warnings during API call
     * @property {number} duration - time it took for the API call on the server in seconds
     */

    /** @type {APIResponse} */
    const content = await rawResponse.json();
    debugLog(`script execution took: ${content.duration.toFixed(2)}s`);
    if (content.usingCache) {
        console.warn('using cached API results');
    }
    content.warnings.forEach(warning => {
        console.warn(warning);
    });
    if (content.error !== null) {
        console.error(content.error);
    }
    if (content && content.slotsFree) {
        return content.slotsFree || 0;
    } else {
        return 0;
    }
}
