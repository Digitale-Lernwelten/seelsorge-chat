async function privacyDisclaimer() {
	const cookies = document.cookie.split(";");
	const accept = document.querySelector("#accept");
	const decline = document.querySelector("#decline");
	const cookieYear = new Date().getFullYear() + 1;
	const outOfService = document.querySelector(".service-time");
	const noSlots = document.querySelector(".no-slots");
	const serviceTime = () => {
		const currentDay = new Date().getDay();
		const today = new Date();
		const currentTime = (today.getHours() * 100) + today.getMinutes();
		if (currentDay >= 1 && currentDay <= 5) {
			if (currentTime >= 1545 && currentTime <= 1930) {
				return true;
			}
			return false;
		}
	};

	//add script
	
	const addScript = () => {
		let script = document.createElement("script");
		script.setAttribute('src', 'https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/312f12586e214ec29e39002ead86655719beb0d14edc4a278a3ed623a56da65a.js');
		document.head.appendChild(script);
	}


	for (let i = 0; i < cookies.length; i++) {
		let cookie = cookies[i];
		let eqPos = cookie.indexOf("=");
		let name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie;
		if (name.indexOf("soulchat-allow") > -1) {
			if (serviceTime() === true) {
				if (await getFreeSlots()) {
					addScript();
				} else {
					noSlots.classList.add("show");
				}
			} else {
				outOfService.classList.add("active");
			}
			return;
		};
		if (name.indexOf("soulchat-denied") > -1) {
			return;
		};
	};
	const banner = document.querySelector(".privacy-disclaimer");
	banner.classList.add("show");
	accept.onclick = function () {
		banner.classList.toggle("show");
		document.cookie = `soulchat-allow= allow; expires=Thu, 18 Dec ${cookieYear} 12:00:00 UTC; path=/; Secure`;
		location.reload();
		return;
	};
	const denyCookies = () => {
		const banner = document.createElement("DIV");
		const buttons = document.createElement("DIV");
		const wrapper = document.createElement("DIV");
		const acceptButton = document.createElement("BUTTON");
		const declineButton = document.createElement("BUTTON");
		const body = document.querySelector("body");
		wrapper.setAttribute("class", "margin-wrap");
		buttons.setAttribute("class", "buttons");
		acceptButton.setAttribute("id", "denial-banner-accept");
		declineButton.setAttribute("id", "denial-banner-decline");
		banner.setAttribute("id", "cookies-denial-banner");
		acceptButton.innerHTML = "Doch zustimmen";
		declineButton.innerHTML = "Endgültig ablehnen";
		wrapper.innerHTML = `<p>Achtung: Du kannst den Chat nur nutzen, wenn Du die <a class="link" href="./datenschutz.html">Datenschutzbestimmungen</a> zur Kenntnis nimmst und Cookies akzeptierst.</p>`;
		buttons.appendChild(acceptButton);
		buttons.appendChild(declineButton);
		wrapper.appendChild(buttons);
		banner.appendChild(wrapper);
		document.body.append(banner);
		body.classList.toggle("strong-blur");
		declineButton.onclick = function () {
			document.cookie = `soulchat-denied= denied; expires=Thu, 18 Dec ${cookieYear} 12:00:00 UTC; path=/; Secure`;
			body.classList.toggle("strong-blur");
			banner.classList.add("hide");
			return;
		}
		acceptButton.onclick = function () {
			document.cookie = `soulchat-allow= allow; expires=Thu, 18 Dec ${cookieYear} 12:00:00 UTC; path=/; Secure`;
			body.classList.toggle("strong-blur");
			location.reload();
			return;
		}
	}
	decline.onclick = function () {
		banner.classList.toggle("show");
		denyCookies();
	};
};


document.addEventListener('DOMContentLoaded', function () {
	setTimeout(privacyDisclaimer, 0);
});


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
};
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
};
setTimeout(faqBox, 0);

function deleteCookies() {
	const cookies = document.cookie.split(";");
	for (let i = 0; i < cookies.length; i++) {
		let cookie = cookies[i];
		let eqPos = cookie.indexOf("=");
		let name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie;
		if (name.indexOf("uslk") > -1) {
			document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}
	}
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
	const rawResponse = await fetch('https://soul-chat.de/status.php', {
		cache: "no-store",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});
	const content = await rawResponse.json();
	if (content && content.slotsFree) {
		return content.slotsFree | 0;
	} else {
		return 0;
	}
};