const serviceTime = () => {
		const currentDay = new Date().getDay();
		const today = new Date();
		const currentTime = (today.getHours() * 100) + today.getMinutes();
		if (currentDay >= 1 && currentDay <= 5) {
			if (currentTime >= 1555 && currentTime <= 1855) {
				return true;
			}
			return false;
		}
		return true;
}
setTimeout(serviceTime, 0);

function toggleBehaviour() {
	async function freeSlots() {
		try { return await getFreeSlots()}
		catch (e) {
			console.log("Can't fetch Operatordata");
			console.log(e);
			return 0;
		}
	} 
	freeSlots();
	const outOfService = document.querySelector(".service-time");
	const noSlots = document.querySelector(".no-slots");
	if (serviceTime() === false) {
		outOfService.classList.add("active");
	}else if (freeSlots === 0) {
		noSlots.classList.add("show");
	}
}
setTimeout(toggleBehaviour, 0);

function mobileMenu() {
	const menu = document.querySelector(".mobile-menu");
	const items = document.querySelector(".nav-items");
	const body = document.querySelector("body");
	const servicePopUp = document.querySelector(".service-time");
	menu.onclick = function () {
		menu.classList.toggle("change");
		items.classList.toggle("open");
		body.classList.toggle("blur");
		servicePopUp.classList.toggle("blur");
	};
}
setTimeout(mobileMenu, 0);


function faqBox() {
	const acc = document.querySelectorAll(".accordion");
	acc.forEach(ele => {
		ele.addEventListener("click", function () {
			this.classList.toggle("active");
			var panel = this.nextElementSibling;
			if (panel.style.maxHeight) {
				panel.style.maxHeight = null;
			} else {
				panel.style.maxHeight = panel.scrollHeight + "px";
			}
		});
	});
}
setTimeout(faqBox, 0);

const deleteCookies = () => {
	const cookies = document.cookie.split(";");
	cookies.forEach(cookie => {
		let eqPos = cookie.indexOf("=");
		let name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie;
		if (name.indexOf("uslk") > -1) {
			document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}
	});
}
setTimeout(deleteCookies, 0);

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
    const rawResponse = await fetch('https://seelsorge-chat.de/status.php', {
        cache: "no-store",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    console.timeEnd('operator-fetch');
    /**
     * @type {Object}
     * @property {number} content.slotsFree - number of availabe operators
     * @property {string | null} content.error - optional error during API call
     * @property {boolean} content.usingCache - if the result is cached or not
     * @property {number} content.totalOps - total number of operators
     * @property {number} content.apiCode - UserLike API reply code
     * @property {string[]} content.warnings - warnings during API call
     * @property {number} content.duration - time it took for the API call on the server in seconds
     */
    const content = await rawResponse.json();
    console.log(`script execution took: ${content.duration.toFixed(2)}s`);
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
        return content.slotsFree | 0;
    } else {
        return 0;
    }
}