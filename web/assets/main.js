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
    consentKey: "seelsorge-consent",
    userLikeWidgetURL: "https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/312f12586e214ec29e39002ead86655719beb0d14edc4a278a3ed623a56da65a.js",
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

/** @type {HTMLElement} */
let noSlotsModal = null;
/** @type {HTMLElement} */
let serviceTimeModal = null;
/** @type {HTMLElement} */
let loadModal = null;
/** @type {HTMLElement} */
let privacyModal = null;
/** @type {HTMLButtonElement} */
let privacyAccept = null;
/** @type {HTMLButtonElement} */
let privacyDecline = null;
/** @type {HTMLElement} */
let declinedPrivacyModal = null;
/** @type {HTMLButtonElement} */
let declinedPrivacyModalButton = null;

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
 * @type {number}
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
 * Check if the given element has the given CSS class.
 * @param {HTMLElement} element 
 * @param {string} className
 */
const hasClass = (element, className) => {
    return element.classList.contains(className);
}

/**
 * Remove the given CSS class from the given element if present.
 * @param {HTMLElement} element 
 * @param {string} className 
 */
const removeClassIfPresent = (element, className) => {
    if (hasClass(element, className)) {
        element.classList.remove(className);
    }
}

/**
 * Add the given class to the element if not set.
 * @param {HTMLElement} element 
 * @param {string} className 
 */
const addClass = (element, className) => {
    if (!hasClass(element, className)) {
        element.classList.add(className);
    }
}

/**
 * Clear/stop the given interval if it exists.
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


/**
 * Show the hint that the chat status is loading.
 * Hides all other modals.
 */
const showLoadHint = () => {
    removeClassIfPresent(serviceTimeModal, "active");
    removeClassIfPresent(noSlotsModal, "show");
    removeClassIfPresent(declinedPrivacyModal, "show");
    addClass(loadModal, "show");
}

/**
 * Show the hint that it isn't that service time.
 * Hides all other modals.
 */
const showServiceTimeHint = () => {
    removeClassIfPresent(loadModal, "show");
    removeClassIfPresent(noSlotsModal, "show");
    removeClassIfPresent(declinedPrivacyModal, "show");
    addClass(serviceTimeModal, "active");
}

/**
 * Show the hint that the chat is full.
 * Hides all other modals.
 */
const showNoSlotsHint = () => {
    removeClassIfPresent(serviceTimeModal, "active");
    removeClassIfPresent(loadModal, "show");
    removeClassIfPresent(declinedPrivacyModal, "show");
    addClass(noSlotsModal, "show");
}

/**
 * Show the hint that the user has declined the privacy prompt within the fullscreen modal.
 * Hides all other modals.
 */
const showDeclinedPrivacyHint = () => {
    removeClassIfPresent(serviceTimeModal, "active");
    removeClassIfPresent(loadModal, "show");
    removeClassIfPresent(noSlotsModal, "show");
    addClass(declinedPrivacyModal, "show");
}

const hideAllModals = () => {
    [
        [serviceTimeModal, "active"],
        [loadModal, "show"],
        [noSlotsModal, "show"],
        [declinedPrivacyModal, "show"],
    ].forEach(([element, className]) => {
        removeClassIfPresent(element, className);
    })
    debugLog("hidden all custom modals");
}

/**
 * Set the 'display' style value of the given element to 'block'.
 * @param {HTMLElement} element 
 */
const showElement = (element) => {
    element.style.display = "block";
}

/**
 * Set the 'display' style value of the given element to 'none'.
 * @param {HTMLElement} element 
 */
const hideElement = (element) => {
    element.style.display = "none";
}

let checks = 0;
let offlineRuns = 0;

/**
 * Check the DOM for the userlike element. Userlike appends a div with the id
 * 'userlike-XXXXX' to the body. Check until the div was found.
 * If the div has children, an operator is available so we hide all our own modals.
 * If the div has no children, no operator is available so we show no-slots modal @see {@link showNoSlotsHint}
 * The detection runs a specified amount iterations after the div was detected to avoid any race-conditions
 * where an operator is available, we detect the div but the userlike code has not yet attached
 * any elements to the div.
 */
const detectUserLike = () => {
    if (!serviceTimeModal || !noSlotsModal || !loadModal) {
        console.error("failed to find required modals");
        return;
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
            hideAllModals();
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
        ele.onclick = () => {
            ele.classList.toggle("active");
            const panel = ele.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = `${panel.scrollHeight}px`;
            }
        }
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

const embedUserLike = () => {
    const userLikeScript = document.createElement("script");
    userLikeScript.async = true;
    userLikeScript.type = "text/javascript";
    userLikeScript.src = config.userLikeWidgetURL;
    document.body.append(userLikeScript);
    debugLog("embedded userlike script");
}

document.addEventListener('DOMContentLoaded', () => {
    serviceTimeModal = document.getElementById("service-time-window");
    noSlotsModal = document.getElementById("no-slots-window");
    loadModal = document.getElementById("load-hint-window");
    privacyModal = document.getElementById("privacy-window");
    privacyAccept = document.getElementById("accept");
    privacyDecline = document.getElementById("decline");
    declinedPrivacyModal = document.getElementById("declined-privacy-window");
    declinedPrivacyModalButton = document.getElementById("declined-accept");

    const consentValue = localStorage.getItem(config.consentKey);
    // no stored value => first time visit => show fullscreen prompt
    if (consentValue === null) {
        showElement(privacyModal);
    } else {
        const hasConsent = consentValue === "1";
        // if the user has declined previously, show a hint with a button to accept
        if (!hasConsent) {
            debugLog("user has denied consent");
            showDeclinedPrivacyHint();
        } else {
            debugLog("user has consented");
            // if the user has already accepted, embed userlike and start probing
            embedUserLike();
            probeId = setInterval(detectUserLike, config.probeInterval);
        }
    }

    const allowCookies = () => {
        localStorage.setItem(config.consentKey, 1);
        embedUserLike();
        probeId = setInterval(detectUserLike, config.probeInterval);
        hideElement(privacyModal);
        debugLog("user has clicked accept");
    }
    const denyCookies = () => {
        localStorage.setItem(config.consentKey, 0);
        hideElement(privacyModal);
        showDeclinedPrivacyHint();
        debugLog("user has clicked deny");
    }

    privacyAccept.onclick = allowCookies;
    declinedPrivacyModal.onclick = allowCookies;
    privacyDecline.onclick = denyCookies;

    if (document.querySelector("#animated") != null) {
        setTimeout(typeText, 0);
    }
    deleteCookies();
    mobileMenu();
    faqBox();
});

window.onscroll = () => {
    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight) {
        addClass(serviceTimeModal, "offset");
        addClass(noSlotsModal, "offset");
        addClass(loadModal, "offset");
        addClass(declinedPrivacyModal, "offset");
    } else {
        removeClassIfPresent(serviceTimeModal, "offset");
        removeClassIfPresent(loadModal, "offset");
        removeClassIfPresent(noSlotsModal, "offset");
        removeClassIfPresent(declinedPrivacyModal, "offset");
    }
}
