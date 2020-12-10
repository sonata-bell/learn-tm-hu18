const robotId = document.querySelector('.id');
const names = document.querySelectorAll('.name');
const dropButtons = document.querySelectorAll('.dropbtn');
const commands = document.querySelectorAll('.command');
const commandDatas = document.querySelectorAll('.command-data');
const progresses = document.querySelectorAll('.progress > div');
const icon = document.querySelector('.icon');
const video = document.querySelector('.webcam');

const URL = './model/';
const maxIndex = [];

let model, webcam, maxPredictions;
let request = null;

if (!localStorage.getItem('robotId')) {
  localStorage.setItem('robotId', '0000');
}

if (!localStorage.getItem('commands')) {
  localStorage.setItem(
    'commands',
    JSON.stringify(['Command', 'Command', 'Command', 'Command', 'Command'])
  );
}

if (!localStorage.getItem('command-data')) {
  localStorage.setItem('command-data', JSON.stringify(['0', '0', '0', '0', '0']));
}

if (!JSON.parse(localStorage.getItem('classNames'))) {
  localStorage.setItem(
    'classNames',
    JSON.stringify(['None', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'])
  );
}

robotId.value = localStorage.getItem('robotId');

const classNames = JSON.parse(localStorage.getItem('classNames'));
const commandGroup = JSON.parse(localStorage.getItem('commands'));
const commandGroupData = JSON.parse(localStorage.getItem('command-data'));

dropButtons.forEach((button, index) => {
  button.innerHTML = commandGroup[index];
});

names.forEach((name, index) => {
  name.value = classNames[index];

  name.addEventListener('change', (e) => {
    classNames[index] = e.target.value.trim();

    localStorage.setItem('classNames', JSON.stringify(classNames));
  });
});

const init = async () => {
  const modelURL = URL + 'model.json';
  const metadataURL = URL + 'metadata.json';

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  webcam = new tmImage.Webcam(360, 360, true);
  await webcam.setup();

  video.appendChild(webcam.canvas);
};

init();

const predict = async () => {
  const prediction = await model.predict(webcam.canvas);

  for (let i = 0; i < maxPredictions; i++) {
    const className = prediction[i].className.trim();
    const probability = prediction[i].probability.toFixed(2) * 100;

    names.forEach((name, index) => {
      if (
        name.value === className &&
        progresses[index].style.width.replace('%', '') !== probability
      ) {
        progresses[index].style.width = probability + '%';
      }
    });
  }

  progresses.forEach((progress, index) => {
    if (isNaN(parseInt(progress.style.width.replace('%', '')))) {
      maxIndex[index] = 0;
    } else {
      maxIndex[index] = parseInt(progress.style.width.replace('%', ''));
    }
  });
};

const loop = async () => {
  webcam.update();
  await predict();

  if (icon.classList.contains('on')) {
    window.requestAnimationFrame(loop);
  }
};

robotId.addEventListener('change', (e) => {
  localStorage.setItem('robotId', e.target.value);
});

commands.forEach((command, index) => {
  command.addEventListener('click', (e) => {
    const groupNumber = parseInt(index / 5);

    dropButtons[groupNumber].innerHTML = command.innerHTML;

    commandGroup[groupNumber] = command.innerHTML;

    localStorage.setItem('commands', JSON.stringify(commandGroup));
  });
});

commandDatas.forEach((data, index) => {
  data.value = commandGroupData[index];

  data.addEventListener('change', (e) => {
    commandGroupData[index] = e.target.value;

    localStorage.setItem('command-data', JSON.stringify(commandGroupData));
  });
});

icon.addEventListener('click', async (e) => {
  icon.classList.toggle('on');

  if (icon.classList.contains('on')) {
    await axios.post('http://sblabs.iptime.org:3318/api/hu18', {
      id: robotId.value,
      command: 'motion',
      data: 241,
    });

    await webcam.play();
    window.requestAnimationFrame(loop);

    request = setInterval(() => {
      const index = maxIndex.indexOf(Math.max(...maxIndex));

      if (index > 0) {
        axios.post('http://sblabs.iptime.org:3318/api/hu18', {
          id: robotId.value,
          command: commandGroup[index - 1].toLowerCase(),
          data: parseInt(commandGroupData[index - 1]),
        });
      }
    }, 100);
  } else {
    clearInterval(request);

    await axios.post('http://sblabs.iptime.org:3318/api/hu18', {
      id: robotId.value,
      command: 'motion',
      data: 240,
    });

    await webcam.pause();
  }
});

window.addEventListener('beforeunload', () => {
  clearInterval(request);

  axios.post('http://sblabs.iptime.org:3318/api/hu18', {
    id: robotId.value,
    command: 'motion',
    data: 240,
  });

  webcam.pause();
});
