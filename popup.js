let habiticaApiKey = '';
let habiticaUserID = '';
const timelineElement = document.getElementById('timeline-container');
const credentialsElement = document.getElementById('credentials');
const AUTHOR_ID = '6094f21d-7003-48f8-b926-fe379803d8f7';
const SCRIPT_NAME = 'Habitica Timeliner';

const HEADERS = {
	'x-client': AUTHOR_ID + ' - ' + SCRIPT_NAME,
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
	setHeaders(habiticaUserID, habiticaApiKey);

	if (habiticaApiKey && habiticaUserID) {
		credentialsElement.style.display = 'none';
		console.log(`Hide Credentials`);
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

	timelineElement.innerText = `habiticaApiKey: ${habiticaApiKey}; habiticaUserID: ${habiticaUserID}`;

	credentialsElement.style.display = 'block';
});

// const params = {
//   'method' : 'POST',
//   'headers' : HEADERS,
//   'contentType' : 'application/json',
// };

// async function fetchTasks(apiKey) {
//   const response = await fetch('https://habitica.com/api/v3/tasks/user', {
//     headers: {
//       'x-api-user': 'ВАШ_ЮЗЕР_ID',
//       'x-api-key': apiKey,
//     },
//   });
//   const data = await response.json();
//   return data.data; // массив задач
// }

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
