let habiticaApiKey = '';
let habiticaUserID = '';
const timelineElement = document.getElementById('timeline-container');
const credentialsElement = document.getElementById('credentials');
const AUTHOR_ID = '6094f21d-7003-48f8-b926-fe379803d8f7';
const SCRIPT_NAME = 'Habitica Timeliner';

const HEADERS = {
	'x-client': AUTHOR_ID + ' - ' + SCRIPT_NAME,
	'Content-Type': 'application/json',
};

document.getElementById('api-form').addEventListener('submit', (e) => {
	e.preventDefault();
	const apiUserID = document.getElementById('api-userID').value;
	const apiKey = document.getElementById('api-key').value;

	if (apiUserID && apiKey) {
		chrome.storage.local.set({ habiticaApiKey: apiKey });
		chrome.storage.local.set({ habiticaUserID: apiUserID });
		setHeaders(apiUserID, apiKey);

		habiticaApiKey = apiKey;
		habiticaUserID = apiUserID;

		timelineElement.innerText = `habiticaApiKey: ${habiticaApiKey}; habiticaUserID: ${habiticaUserID}`;
		credentialsElement.style.display = 'none';
	} else {
		alert('Please fill in all fields');
	}
});

function getStorageData(keys) {
	return new Promise((resolve) => {
		chrome.storage.local.get(keys, resolve);
	});
}

async function getDataOnFirstLoad() {
	const result = await getStorageData(['habiticaApiKey', 'habiticaUserID']);
	habiticaApiKey = result.habiticaApiKey;
	habiticaUserID = result.habiticaUserID;

	timelineElement.innerText = `habiticaApiKey: ${habiticaApiKey}; habiticaUserID: ${habiticaUserID}`;

	if (habiticaApiKey && habiticaUserID) {
		setHeaders(habiticaUserID, habiticaApiKey);
		credentialsElement.style.display = 'none';

		const mockData = await getMockData();
		const cleanedData = clearData(mockData);
		timelineElement.innerText = '';
		renderTimeline(cleanedData);
		// console.log(mockData);
	}
}

document.addEventListener('DOMContentLoaded', async () => {
	await getDataOnFirstLoad();
});

function setHeaders(userID, apiKey) {
	if (!userID || !apiKey) {
		throw new Error('UserID and API key are required');
	}

	HEADERS['x-api-user'] = userID;
	HEADERS['x-api-key'] = apiKey;
}

// Clear API keys from chrome storage
const footerBtn = document.querySelector('.footer__btn');

function clearUserCredentialsKeys() {
	chrome.storage.local.remove(['habiticaApiKey', 'habiticaUserID'], () => {
		if (chrome.runtime.lastError) {
			console.error('Error removing keys:', chrome.runtime.lastError);
		}
	});
}

footerBtn.addEventListener('click', () => {
	clearUserCredentialsKeys();
	habiticaApiKey = '';
	habiticaUserID = '';

	delete HEADERS['x-api-user'];
	delete HEADERS['x-api-key'];

	timelineElement.innerText = `habiticaApiKey: ${habiticaApiKey}; habiticaUserID: ${habiticaUserID}`;

	credentialsElement.style.display = 'block';
});

// Get tasks
async function fetchTasks(taskType) {
	const params = {
		method: 'GET',
		headers: HEADERS,
	};

	const url = new URL('https://habitica.com/api/v3/tasks/user');
	if (taskType) {
		url.searchParams.append('type', taskType);
	}

	const response = await fetch(url, params);

	if (!response.ok) {
		throw new Error(
			`Error occured while getting tasks: ${response.status} - ${response.statusText}`
		);
	}

	const data = await response.json();
	return data.data;
}

async function getTasks() {
	const tasks = await fetchTasks('dailys');
	console.log(tasks);
	timelineElement.innerText = JSON.stringify(tasks);
}

// const getTasksBtn = document.getElementById('get-tasks');
// getTasksBtn.addEventListener('click', getTasks);

function clearData(tasks) {
	const cleanedData = tasks.map((task) => {
		const {
			id,
			frequency,
			everyX,
			repeat,
			nextDue,
			streak,
			text,
			notes,
			value,
		} = task;

		return {
			id,
			frequency,
			everyX,
			repeat,
			nextDue,
			streak,
			text,
			notes,
			value,
		};
	});

	return cleanedData;
}

function renderTimeline(data) {
	const tasksByDay = {};

	data.forEach((task) => {
		task.nextDue.forEach((isoDate) => {
			const localDate = normalizeToLocalDate(isoDate);

			if (!tasksByDay[localDate]) {
				tasksByDay[localDate] = [];
			}
			tasksByDay[localDate].push(task.text);
		});
	});

	const sortedDates = Object.keys(tasksByDay).sort((a, b) => {
		return new Date(a) - new Date(b);
	});

	sortedDates.forEach((day) => {
		const dayDiv = document.createElement('div');
		dayDiv.innerHTML = `<h3>${day}</h3>`;

		const tasksList = document.createElement('ul');
		tasksByDay[day].forEach((task) => {
			const taskItem = document.createElement('li');
			taskItem.textContent = task;
			tasksList.appendChild(taskItem);
		});

		dayDiv.appendChild(tasksList);
		timelineElement.appendChild(dayDiv);
	});
}

function normalizeToLocalDate(isoDate) {
	const date = new Date(isoDate);
	const offsetMinutes = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);
	return localDate.toISOString().split('T')[0];
}

async function getMockData() {
	let mockData = await new Promise((resolve) => {
		setTimeout(() => {
			resolve();
			// start of resolve

			// end of resolve
		}, 850);
	});

	return mockData;
}
