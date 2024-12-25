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

	// группируем задачи по датам
	data.forEach((task) => {
		task.nextDue.forEach((isoDate) => {
			const localDate = normalizeToLocalDate(isoDate);

			if (!tasksByDay[localDate]) {
				tasksByDay[localDate] = [];
			}
			tasksByDay[localDate].push(task);
		});
	});

	// сортируем даты
	const sortedDates = Object.keys(tasksByDay).sort((a, b) => {
		return new Date(a) - new Date(b);
	});

	// рендерим данные
	sortedDates.forEach((day) => {
		const dayDetails = document.createElement('details');
		dayDetails.classList.add('tl__day');
		dayDetails.setAttribute('open', '');

		const dayTasks = tasksByDay[day];

		// генерируем задачи
		const tasksHTML = dayTasks
			.map((task) => {
				const repeatHTML = generateCalendar(task.repeat);
				return `
          <div class="tl__item">
            <div class="tl__left-col">
              <div class="tl__item-header">
                <p class="tl__title">${task.text}</p>
                <div class="tl__meta">
                  <img src="./icon/star-four-points-outline.svg" alt="Task value" class="tl__meta-icon" />
                  <p class="tl__value">${task.value}</p>
                </div>
                <div class="tl__meta">
                  <img src="./icon/fast-forward.svg" alt="Streak amount" class="tl__meta-icon" />
                  <p class="tl__value">${task.streak}</p>
                </div>
              </div>
              <p class="tl__item-desc">${task.notes}</p>
            </div>
            <div class="tl__right-col">
              ${repeatHTML}
              <div class="tl__calendar-meta">
                <p class="tl__frequency">${task.frequency}</p>
                <div class="tl__each-amount">
                  <img src="./icon/repeat-variant.svg" alt="Repeat every: " class="tl__frequency-img" />
                  <p class="tl__frequency-interval">${task.everyX}</p>
                </div>
              </div>
            </div>
          </div>
        `;
			})
			.join('');

		dayDetails.innerHTML = `
      <summary class="tl__header">
        <div class="tl__circle"></div>
        <h3 class="tl__date">${day.split('-').reverse().join('.')}</h3>
      </summary>
      ${tasksHTML}
    `;

		timelineElement.appendChild(dayDetails);
	});
}

function normalizeToLocalDate(isoDate) {
	const date = new Date(isoDate);
	const offsetMinutes = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000);
	return localDate.toISOString().split('T')[0];
}

function generateCalendar(repeat) {
	const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
	const repeatKeys = ['m', 't', 'w', 'th', 'f', 's', 'su'];

	const hasActiveDays = repeatKeys.some((key) => repeat[key]);
	if (!hasActiveDays) return '';

	const calendarDays = days
		.map((day, index) => {
			const isActive = repeat[repeatKeys[index]] ? 'active' : '';
			return `<p class="tl__calendar-day ${isActive}">${day}</p>`;
		})
		.join('');

	return `
    <div class="tl__calendar">
      ${calendarDays}
    </div>
  `;
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
