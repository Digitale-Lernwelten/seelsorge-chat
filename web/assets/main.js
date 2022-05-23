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
    probeInterval: 3,
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


const detectUserLike = () => {
    const serviceTime = document.getElementById("service-time-window");
    const noSlots = document.getElementById("no-slots-window");
    if (!serviceTime || !serviceTime) {
        console.error("failed to find required modals");
    }
    if (!isServiceTime()) {
        serviceTime.classList.add("active");
        clearIntervalIfPresent(probeId);
        debugLog("outside of service time");
    }
    const nodes = document.querySelectorAll("*[id^=\"userlike\"]");
    if (nodes.length > 0) {
        clearIntervalIfPresent(probeId);
        debugLog("found userlike components");
        const userLikeDiv = Array.from(nodes).find(n => n.tagName === "DIV");
        if (userLikeDiv) {
            debugLog("found userlike div");
            if (userLikeDiv.childElementCount === 0) {
                debugLog("no operators available");
                removeClassIfPresent(serviceTime, "active");
                noSlots.classList.add("show");
            } else {
                removeClassIfPresent(serviceTime, "active");
                removeClassIfPresent(noSlots, "show");
                debugLog("online");
            }
        }
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

document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector("#animated") != null) {
        setTimeout(typeText, 0);
    }
    detectUserLike();
    probeId = setInterval(detectUserLike, config.probeInterval * 1000);
    deleteCookies();
    mobileMenu();
    faqBox();
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
