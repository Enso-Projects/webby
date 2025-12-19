/* WERS – Web-Based Equipment Rental & Scheduling System
   Front-end only (LocalStorage)
*/

const LS_KEYS = {
  USERS: "wers_users",
  SESSION: "wers_session",
  EQUIPMENT: "wers_equipment",
  BOOKINGS: "wers_bookings"
};

const ADMIN = { username: "admin", password: "Pa$$word1" };

const view = document.getElementById("view");

/* ---------- Utilities ---------- */
function loadJSON(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------- Initial Data ---------- */
function seedData() {
  if (!localStorage.getItem(LS_KEYS.EQUIPMENT)) {
    saveJSON(LS_KEYS.EQUIPMENT, [
      { id: "EQ-001", name: "Concrete Mixer", price: 1200, status: "Ready" },
      { id: "EQ-002", name: "Power Drill", price: 300, status: "Ready" },
      { id: "EQ-003", name: "Sound System", price: 800, status: "In Maintenance" }
    ]);
  }

  if (!localStorage.getItem(LS_KEYS.USERS)) saveJSON(LS_KEYS.USERS, []);
  if (!localStorage.getItem(LS_KEYS.BOOKINGS)) saveJSON(LS_KEYS.BOOKINGS, []);
  if (!localStorage.getItem(LS_KEYS.SESSION)) {
    saveJSON(LS_KEYS.SESSION, { loggedIn: false, role: "guest", username: "Guest" });
  }
}

/* ---------- Session ---------- */
function getSession() {
  return loadJSON(LS_KEYS.SESSION, {});
}

function setSession(session) {
  saveJSON(LS_KEYS.SESSION, session);
  updateDashboard();
}

function logout() {
  setSession({ loggedIn: false, role: "guest", username: "Guest" });
  location.hash = "#/home";
}

/* ---------- Dashboard ---------- */
function updateDashboard() {
  const equipment = loadJSON(LS_KEYS.EQUIPMENT);
  const session = getSession();

  document.getElementById("sessionInfo").textContent =
    session.loggedIn ? session.username : "Guest";

  document.getElementById("readyCount").textContent =
    equipment.filter(e => e.status === "Ready").length;

  document.getElementById("outCount").textContent =
    equipment.filter(e => e.status === "Out for Rental").length;

  document.getElementById("maintCount").textContent =
    equipment.filter(e => e.status === "In Maintenance").length;
}

/* ---------- Router ---------- */
window.addEventListener("hashchange", router);

function router() {
  const page = location.hash.replace("#/", "") || "home";

  const routes = {
    home: renderHome,
    login: renderLogin,
    register: renderRegister,
    transactions: renderTransactions,
    about: renderAbout,
    contact: renderContact,
    admin: renderAdmin
  };

  (routes[page] || renderHome)();
}

/* ---------- Pages ---------- */

function renderHome() {
  view.innerHTML = `
    <section class="card">
      <h1>Rent equipment with real-time scheduling</h1>
      <p class="muted">
        WERS helps rental businesses avoid double-bookings, track equipment status,
        and manage reservations efficiently.
      </p>

      <h2>How the rental process works</h2>
      <ol>
        <li><strong>Browse equipment:</strong> View available items and pricing.</li>
        <li><strong>Select dates:</strong> Availability is checked automatically.</li>
        <li><strong>Reserve:</strong> Booking is saved with total cost.</li>
        <li><strong>Pickup:</strong> Equipment is marked “Out for Rental.”</li>
        <li><strong>Return:</strong> Item is inspected and set to Ready or Maintenance.</li>
      </ol>

      <div class="actions">
        <a class="btn primary" href="#/transactions">Start a reservation</a>
        <a class="btn" href="#/register">Create an account</a>
        <a class="btn" href="#/login">Login</a>
      </div>
    </section>
  `;
}

function renderLogin() {
  view.innerHTML = `
    <section class="card">
      <h1>Login</h1>
      <input id="loginUser" placeholder="Username">
      <input id="loginPass" type="password" placeholder="Password">
      <button class="btn primary" onclick="login()">Login</button>
    </section>
  `;
}

function login() {
  const user = loginUser.value.trim();
  const pass = loginPass.value;

  if (user === ADMIN.username && pass === ADMIN.password) {
    setSession({ loggedIn: true, role: "admin", username: "admin" });
    location.hash = "#/admin";
    return;
  }

  const users = loadJSON(LS_KEYS.USERS);
  const found = users.find(u => u.username === user && u.password === pass);

  if (!found) {
    alert("Invalid username or password.");
    return;
  }

  setSession({ loggedIn: true, role: "user", username: user });
  location.hash = "#/transactions";
}

function renderRegister() {
  view.innerHTML = `
    <article class="grid">
      <section class="card">
        <h1>Registration</h1>
        <p class="muted">
          Create a customer account to place equipment reservations.
        </p>

        <form id="regForm">
          <div class="row">
            <div class="field">
              <label>Username</label>
              <input id="regUsername" required>
            </div>
            <div class="field">
              <label>Phone</label>
              <input id="regPhone" placeholder="09xxxxxxxxx" required>
            </div>
          </div>

          <div class="field">
            <label>Email</label>
            <input id="regEmail" type="email" required>
          </div>

          <div class="row">
            <div class="field">
              <label>Password</label>
              <input id="regPassword" type="password" required>
            </div>
            <div class="field">
              <label>Confirm password</label>
              <input id="regPassword2" type="password" required>
            </div>
          </div>

          <div class="actions">
            <button class="btn primary" type="submit">Create account</button>
            <a class="btn" href="#/login">Go to login</a>
          </div>
        </form>
      </section>
    </article>
  `;

  regForm.addEventListener("submit", e => {
    e.preventDefault();

    if (regPassword.value !== regPassword2.value) {
      alert("Passwords do not match.");
      return;
    }

    const users = loadJSON(LS_KEYS.USERS);
    if (users.some(u => u.username === regUsername.value)) {
      alert("Username already exists.");
      return;
    }

    users.push({
      username: regUsername.value,
      phone: regPhone.value,
      email: regEmail.value,
      password: regPassword.value
    });

    saveJSON(LS_KEYS.USERS, users);
    alert("Account created successfully.");
    location.hash = "#/login";
  });
}

function renderTransactions() {
  const equipment = loadJSON(LS_KEYS.EQUIPMENT);

  view.innerHTML = `
    <section class="card">
      <h1>Transactions</h1>
      <ul>
        ${equipment.map(e =>
          `<li>${e.name} — ₱${e.price} (${e.status})</li>`
        ).join("")}
      </ul>
    </section>
  `;
}

function renderAbout() {
  view.innerHTML = `
    <section class="card">
      <h1>About WERS</h1>
      <p>
        WERS is a web-based equipment rental and scheduling system designed to
        streamline reservations, inventory tracking, and operational efficiency.
      </p>
    </section>
  `;
}

function renderContact() {
  view.innerHTML = `
    <section class="card">
      <h1>Contact</h1>
      <p>Email: support@wers.online</p>
      <p>Location: Cavite, Philippines</p>
    </section>
  `;
}

function renderAdmin() {
  const session = getSession();
  if (session.role !== "admin") {
    view.innerHTML = `<p>Access denied.</p>`;
    return;
  }

  const equipment = loadJSON(LS_KEYS.EQUIPMENT);

  view.innerHTML = `
    <section class="card">
      <h1>Admin Panel</h1>
      <ul>
        ${equipment.map(e =>
          `<li>${e.name} — ${e.status}</li>`
        ).join("")}
      </ul>
    </section>
  `;
}

/* ---------- Init ---------- */
seedData();
updateDashboard();
router();
