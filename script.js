"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  // in real world we use libraries to generate unique ids
  id = (Date.now() + '').slice(-10);
  constructor(coords,distance,duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  
  // prettier-ignore
  _setDescription() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[ this.date.getMonth() ]}`; 
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coords,distance,duration,cadence) {
    super(coords,distance,duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace= this.duration/this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords,distance,duration,elevationGain) {
    super(coords,distance,duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance/this.duration/60;
    return this.speed;
  }
}
// const run1 = new Running([23,71],5.2,23,178);
// const cycle1 = new Running([23,71],27,973,523);
// console.log(run1);

//////////////////////////////////////
// APPLICATION ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workouts = []; 

  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Unable to get your location please check and try again.`);
        }
      );
    }
  }

  _loadMap(pos) {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

_hideForm() {
  inputDistance.value =
  inputCadence.value =
  inputDuration.value =
  inputElevation.value =
  ""; 
  form.style.display = 'none';
  form.classList.add('hidden');
  setTimeout(() => (form.style.display = 'grid',1000));
}


  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {

    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp)); //Helper Function 

    const allPositive = (...inputs) => inputs.every(inp => inp>0); //Helper Function

    e.preventDefault(); // prevent instant reloading of page

    const { lat, lng } = this.#mapEvent.latlng;
    //1. Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
      
    //2. If workout running, create running object
      if(type === 'running') {
      const cadence = +inputCadence.value;
    //3. Check if data is valid
      if(!validInputs(distance,duration,cadence) || !allPositive(distance,duration,cadence)) return alert('Please Check and Input valid Numbers');
    // if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number(cadence)) return alert('Input have to be positive');

    workout = new Running({lat,lng},distance,duration,cadence);
  }
  
    //2. If workout cycling, create cyclying object
    if(type === 'cycling') {
      const elevation = +inputElevation.value;
      //3. Check if data is valid
      if(!validInputs(distance,duration,elevation) || !allPositive(distance,duration)) return alert('Please Check and Input valid Numbers');
      workout = new Cycling({lat,lng},distance,duration,elevation);
      this.#workouts.push(workout);
    }
    
    // 4.Add new object to workout array
    this.#workouts.push(workout);

    // 5.Render wprkout on map as marker
    // Display Marker
    this.renerWorkoutMarker(workout);

    // 6. Render Workout on list
    this._renderWorkout(workout);

    // Hide the form + CLearing Input field
    this._hideForm();


  }
   
  renerWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' }
            </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

          if(workout.type === 'running') {
           html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }

        if(workout.type === 'cycling') {
          html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
          `;
        }

        form.insertAdjacentHTML('afterend',html);
  }

}

const app = new App();
