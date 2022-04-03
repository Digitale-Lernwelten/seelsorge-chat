const serviceTime = () => {
		const currentDay = new Date().getDay();
		const today = new Date();
		const currentTime = (today.getHours() * 100) + today.getMinutes();
		/* Service Time
		if (currentDay >= 1 && currentDay <= 5) {
			if (currentTime >= 1545 && currentTime <= 1930) {
				return true;
			}
			return false;
		}
		*/
		return true;
}

const toggleBehaviour = () => {
	const outOfService = document.querySelector(".service-time");
	const noSlots = document.querySelector(".no-slots");
	if (serviceTime() === false) {
		outOfService.classList.add("active");
	} else if (await getFreeSlots() === 0) {
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
	const rawResponse = await fetch('/status.php', {
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
}