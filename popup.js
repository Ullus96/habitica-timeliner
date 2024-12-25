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

// // рендер таймлайна
// function renderTimeline(tasks) {
//   tasks.forEach((task) => {
//     const taskEl = document.createElement('div');
//     taskEl.className = `task ${task.completed ? 'completed' : ''}`;
//     taskEl.textContent = `${task.text} (дата: ${task.date})`;
//     timelineContainer.appendChild(taskEl);

//     // возможность отметить задачу выполненной
//     taskEl.addEventListener('click', () => {
//       taskEl.classList.toggle('completed');
//     });
//   });
// }
