const names = document.querySelectorAll('.name');
const icon = document.querySelector('.icon');
const video = document.querySelector('.webcam');

const URL = './model/';

let model, webcam, maxPredictions;

if (!JSON.parse(localStorage.getItem('classNames'))) {
  localStorage.setItem(
    'classNames',
    JSON.stringify(['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'])
  );

  console.log('localStorage Initialize');
}

const classNames = JSON.parse(localStorage.getItem('classNames'));

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

  console.log(prediction);

  // for (let i = 0; i < maxPredictions; i++) {
  //   const className = prediction[i].className;
  //   const probability = prediction[i].probability.toFixed(2) * 100;

  //   prediction.

  // }
};

const loop = async () => {
  webcam.update();
  await predict();

  if (icon.classList.contains('on')) {
    window.requestAnimationFrame(loop);
  }
};

icon.addEventListener('click', async (e) => {
  icon.classList.toggle('on');

  if (icon.classList.contains('on')) {
    await webcam.play();
    window.requestAnimationFrame(loop);
  } else {
    await webcam.pause();
  }
});
