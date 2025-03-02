// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
  track_id: undefined,
  track_name: undefined,
  player_id: undefined,
  player_name: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  console.log("Getting form info for dropdowns!");
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt("#tracks", html);
    });

    getRacers().then((racers) => {
      const html = renderRacerCars(racers);
      renderAt("#racers", html);
    });
  } catch (error) {
    console.error("Problem getting tracks and racers:", error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;

      // Race track form field
      if (target.matches(".card.track")) {
        handleSelectTrack(target);
        store.track_id = target.id;
        store.track_name = target.innerHTML;
      }

      // Racer form field
      if (target.matches(".card.racer")) {
        handleSelectRacer(target);
        store.player_id = target.id;
        store.player_name = target.innerHTML;
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate();
      }

      console.log("Store updated :: ", store);
    },
    false
  );
}

async function delay(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// BELOW THIS LINE IS CODE WHERE STUDENT EDITS ARE NEEDED ----------------------------

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  console.log("in create race");

  // Render starting UI
  renderAt("#race", renderRaceStartView(store.track_name));

  // Get player_id and track_id from the store
  const { player_id, track_id } = store;

  // Call the asynchronous method createRace, passing the correct parameters
  const race = await createRace(player_id, track_id);

  // Update the store with the race id in the response
  store.race_id = race.ID;

  console.log("RACE: ", race);

  // The race has been created, now start the countdown
  await runCountdown();

  // Start the race
  await startRace(store.race_id);

  // Run the race
  await runRace(store.race_id);
}

async function runRace(raceID) {
  return new Promise((resolve) => {
    const raceInterval = setInterval(async () => {
      try {
        const raceInfo = await getRace(raceID);

        if (raceInfo.status === "in-progress") {
          renderAt("#leaderBoard", raceProgress(raceInfo.positions));
        } else if (raceInfo.status === "finished") {
          clearInterval(raceInterval);
          renderAt("#race", resultsView(raceInfo.positions));
          resolve(raceInfo);
        }
      } catch (error) {
        console.log("Error in runRace:", error);
        clearInterval(raceInterval);
        resolve(null);
      }
    }, 500);
  });
}

async function runCountdown() {
  try {
    let timer = 3;

    return new Promise((resolve) => {
      const countdownInterval = setInterval(() => {
        document.getElementById("big-numbers").innerHTML = timer;

        if (timer === 0) {
          clearInterval(countdownInterval);
          resolve();
        }
        timer--;
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectRacer(target) {
  console.log("selected a racer", target.id);

  // Remove class selected from all racer options
  const selected = document.querySelector("#racers .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // Add class selected to current target
  target.classList.add("selected");
}

function handleSelectTrack(target) {
  console.log("selected track", target.id);

  // Remove class selected from all track options
  const selected = document.querySelector("#tracks .selected");
  if (selected) {
    selected.classList.remove("selected");
  }

  // Add class selected to current target
  target.classList.add("selected");
}

function handleAccelerate() {
  console.log("accelerate button clicked");
  accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
  if (!racers.length) {
    return `<h4>Loading Racers...</h4>`;
  }

  const results = racers.map(renderRacerCard).join("");

  return `<ul id="racers">${results}</ul>`;
}

function renderRacerCard(racer) {
  const { id, driver_name } = racer;
  return `<h4 class="card racer" id="${id}">${driver_name}</h4>`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `<h4>Loading Tracks...</h4>`;
  }

  const results = tracks.map(renderTrackCard).join("");

  return `<ul id="tracks">${results}</ul>`;
}

function renderTrackCard(track) {
  const { id, name } = track;
  return `<h4 id="${id}" class="card track">${name}</h4>`;
}

function renderCountdown(count) {
  return `
    <h2>Race Starts In...</h2>
    <p id="big-numbers">${count}</p>
  `;
}

function renderRaceStartView(track) {
  return `
    <header>
      <h1>Race: ${track}</h1>
    </header>
    <main id="two-columns">
      <section id="leaderBoard">
        ${renderCountdown(3)}
      </section>
      <section id="accelerate">
        <h2>Directions</h2>
        <p>Click the button as fast as you can to make your racer go faster!</p>
        <button id="gas-peddle">Click Me To Win!</button>
      </section>
    </main>
    <footer></footer>
  `;
}

function resultsView(positions) {
  let count = 1;

  const results = positions.map((p) => {
    return `
      <tr>
        <td>
          <h3>${count++} - ${p.driver_name}</h3>
        </td>
      </tr>
    `;
  });

  return `
    <header>
      <h1>Race Results</h1>
    </header>
    <main>
      <h3>Race Results</h3>
      <p>The race is done! Here are the final results:</p>
      ${results.join("")}
      <a href="/race">Start a new race</a>
    </main>
  `;
}

function raceProgress(positions) {
  let userPlayer = positions.find((e) => e.id === parseInt(store.player_id));
  userPlayer.driver_name += " (you)";

  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions.map((p) => {
    return `
      <tr>
        <td>
          <h3>${count++} - ${p.driver_name}</h3>
        </td>
      </tr>
    `;
  });

  return `<table>${results.join("")}</table>`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);
  node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:3001";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}

// Fetch tracks
async function getTracks() {
  return fetch(`${SERVER}/api/tracks`)
    .then((response) => response.json())
    .catch((error) => console.error("Error:", error));
}

// Fetch racers
async function getRacers() {
  return fetch(`${SERVER}/api/cars`)
    .then((response) => response.json())
    .catch((error) => console.error("error:", error));
}

// Create a race
function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: "POST",
    ...defaultFetchOpts(),
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((e) => console.error("Error creating race:", e));
}

// Get race status
async function getRace(id) {
  return fetch(`${SERVER}/api/races/${id}`)
    .then((res) => res.json())
    .catch((e) => console.error("  :", e));
}

// Start the race
async function startRace(id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: "POST",
    ...defaultFetchOpts(),
  })
    .then((res) => res.json())
    .catch((e) => console.error("There is an error:", e));
}

// Accelerate the car
async function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: "POST",
    ...defaultFetchOpts(),
  }).catch((e) => console.error("Error at accelerating:", e));
}