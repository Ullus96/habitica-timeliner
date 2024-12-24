let habiticaApiKey = '';
const timelineElement = document.getElementById('timeline-container');
const AUTHOR_ID = '6094f21d-7003-48f8-b926-fe379803d8f7';
const SCRIPT_NAME = 'Habitica Timeliner';

const HEADERS = {
	'x-client': AUTHOR_ID + ' - ' + SCRIPT_NAME,
};

document.getElementById('api-form').addEventListener('submit', (e) => {
	e.preventDefault();
	const apiKey = document.getElementById('api-key').value;
	chrome.storage.local.set({ habiticaApiKey: apiKey });
});

chrome.storage.local.get(['habiticaApiKey'], (result) => {
	habiticaApiKey = result.habiticaApiKey;
	timelineElement.innerText = habiticaApiKey;
});

function setHeaders(userID, apiKey) {
	if (!userID || !apiKey) {
		throw new Error('UserID and API key are required');
	}

	HEADERS['x-api-user'] = userID;
	HEADERS['x-api-key'] = apiKey;
}

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
