let habiticaApiKey = '';
const timelineElement = document.getElementById('timeline-container');

document.getElementById('api-form').addEventListener('submit', (e) => {
	e.preventDefault();
	const apiKey = document.getElementById('api-key').value;
	chrome.storage.local.set({ habiticaApiKey: apiKey });
});

chrome.storage.local.get(['habiticaApiKey'], (result) => {
	habiticaApiKey = result.habiticaApiKey;
	timelineElement.innerText = habiticaApiKey;
});
