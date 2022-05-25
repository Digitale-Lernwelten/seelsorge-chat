/**
 * @typedef {Object} config
 * @property {boolean} debugMode
 * @property {number} probeInterval
 * @property {string} url
 * @property {boolean} enableHTTPSRedirect
 * @property {Object} serviceTime
 * @property {Object} serviceTime.time
 * @property {number} service.time.start
 * @property {number} service.time.end
 * @property {Object} serviceTime.day
 * @property {number} service.day.start
 * @property {number} service.day.end
 */
 const config = {
    debugMode: true,
    probeInterval: 250,
    additionalOfflineChecks: 15,
    url: "https://seelsorge-chat.de",
    enableHTTPSRedirect: true,
    serviceTime: {
        time: {
            start: 1555,
            end: 1855
        },
        day: {
            start: 0, // sunday
            end: 6 // saturday
        }
    }
}

let noSlotsModal = null;
let serviceTimeModal = null;
let loadModal = null;

if (config.enableHTTPSRedirect && window.location.protocol === "http:") {
    window.location = config.url + window.location.pathname;
}


const debugLog = (...message) => {
    if (config.debugMode) {
        console.log("[DEBUG]::", ...message);
    }
}

/**
 * Interval id for checking userlike status.
 * @type {number|null}
 */
let probeId = null;

/**
 * Check if the given value is within the given range.
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns {boolean}
 */
const inRange = (val, min, max) => val >= min && val <= max;


/**
 * 
 * @param {HTMLElement} element 
 * @param {string} className
 */
const hasClass = (element, className) => {
    return element.classList.contains(className);
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {string} className 
 */
const removeClassIfPresent = (element, className) => {
    if (hasClass(element, className)) {
        element.classList.remove(className);
    }
}

/**
 * 
 * @param {number | null} id 
 */
const clearIntervalIfPresent = (id) => {
    if (id) {
        debugLog(`cancelling interval: ${id}`);
        clearInterval(id);
    }
}

/**
 * Check if the current time is within specified timeframe.
 * @returns {boolean} true if the current time is within the service time, false otherwise.
 */
const isServiceTime = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours() * 100;
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes;
    const { time, day } = config.serviceTime;
    const isCorrectDay = inRange(currentDay, day.start, day.end);
    const isCorrectTime = inRange(currentTime, time.start, time.end);
    return isCorrectDay && isCorrectTime;
}


const showLoadHint = () => {
    removeClassIfPresent(serviceTimeModal, "active");
    removeClassIfPresent(noSlotsModal, "show");
    loadModal.classList.add("show");
}

const showServiceTimeHint = () => {
    removeClassIfPresent(loadModal, "show");
    removeClassIfPresent(noSlotsModal, "show");
    serviceTimeModal.classList.add("active");
}

const showNoSlotsHint = () => {
    removeClassIfPresent(serviceTimeModal, "active");
    removeClassIfPresent(loadModal, "show");
    noSlotsModal.classList.add("show");
}

let checks = 0;
let offlineRuns = 0;

const detectUserLike = () => {
    if (!serviceTimeModal || !noSlotsModal || !loadModal) {
        console.error("failed to find required modals");
    }
    if (!isServiceTime()) {
        showServiceTimeHint();
        clearIntervalIfPresent(probeId);
        debugLog("outside of service time");
    } else {
        showLoadHint();
    }
    const nodes = Array.from(document.querySelectorAll("div[id^=\"userlike-\"]"));
    if (nodes.length > 0) {
        const userLikeDiv = nodes[0];
        debugLog("found userlike div");
        if (userLikeDiv.childElementCount === 0) {
            offlineRuns++;
            debugLog("no operators available");
            showNoSlotsHint();
        } else {
            removeClassIfPresent(loadModal, "show");
            removeClassIfPresent(serviceTimeModal, "active");
            removeClassIfPresent(noSlotsModal, "show");
            debugLog("detected children in userlike element");
            clearIntervalIfPresent(probeId);
        }
    }
    debugLog(`check: ${checks} offline: ${offlineRuns}`);
    checks++;
    if (offlineRuns === config.additionalOfflineChecks) {
        debugLog(`exceeded maximum checks`);
        clearIntervalIfPresent(probeId);
    }
}


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

const mobileMenu = () => {
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

const faqBox = () => {
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

const typeText = () => {
    const heading = document.querySelector("#animated");
    const sourceText = heading.innerHTML + ""; // Dadurch erzwingen wir eine Kopie
    for (let i = 0; i <= sourceText.length; i++) {
        setTimeout(() => {
            heading.innerHTML = sourceText.slice(0, i);
        }, 650 * i);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    serviceTimeModal = document.getElementById("service-time-window");
    noSlotsModal = document.getElementById("no-slots-window");
    loadModal = document.getElementById("load-hint-window");
    if (document.querySelector("#animated") != null) {
        setTimeout(typeText, 0);
    }
    detectUserLike();
    probeId = setInterval(detectUserLike, config.probeInterval);
    deleteCookies();
    mobileMenu();
    faqBox();
});

window.onscroll = () => {
    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight) {
        serviceTimeModal.classList.add("offset");
        noSlotsModal.classList.add("offset");
        loadModal.classList.add("offset");
    } else {
        removeClassIfPresent(serviceTimeModal, "offset");
        removeClassIfPresent(loadModal, "offset");
        removeClassIfPresent(noSlotsModal, "offset");
    }
}
