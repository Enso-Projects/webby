/* WERS Demo App (Front-end)
   - Hash routing for pages
   - LocalStorage persistence
   - Conflict checking to prevent double-booking
   - Equipment status dashboard: Ready / Out for Rental / In Maintenance
   - Admin login gate (admin / Pa$$word1)
*/

const LS_KEYS = {
  USERS: "wers_users",
  SESSION: "wers_session",
  EQUIPMENT: "wers_equipment",
  BOOKINGS: "wers_bookings",
};

const ADMIN = { username: "admin", password: "Pa$$word1" };

const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
function showMessage(msg){
  modalText.textContent = msg;
  if (!modal.open) modal.showModal();
}

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}
function saveJSON(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

function todayISO(){
  const d = new Date();
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

function seedIfNeeded(){
  const equipment = loadJSON(LS_KEYS.EQUIPMENT, null);
  if (!equipment){
    // Starter inventory for demo
    saveJSON(LS_KEYS.EQUIPMENT, [
      { id: "EQ-1001", name: "Concrete Mixer", category: "Construction", pricePerDay: 1200, deposit: 2000, status: "Ready", location: "Warehouse A", notes: "" },
      { id: "EQ-1002", name: "Power Drill Set", category: "Tools", pricePerDay: 250, deposit: 500, status: "Ready", location: "Shelf 3", notes: "" },
      { id: "EQ-1003", name: "Sound System (2 Speakers)", category: "Event", pricePerDay: 800, deposit: 1500, status: "In Maintenance", location: "Service Bay", notes: "Awaiting inspection" },
      { id: "EQ-1004", name: "Folding Chairs (50 pcs)", category: "Event", pricePerDay: 600, deposit: 1200, status: "Ready", location: "Warehouse B", notes: "" },
    ]);
  }
  const users = loadJSON(LS_KEYS.USERS, null);
  if (!users) saveJSON(LS_KEYS.USERS, []);
  const bookings = loadJSON(LS_KEYS.BOOKINGS, null);
  if (!bookings) saveJSON(LS_KEYS.BOOKINGS, []);
  const session = loadJSON(LS_KEYS.SESSION, null);
  if (!session) saveJSON(LS_KEYS.SESSION, { isAuthed:false, role:"guest", username:"Guest" });
}

function getSession(){
  return loadJSON(LS_KEYS.SESSION, { isAuthed:false, role:"guest", username:"Guest" });
}
function setSession(session){
  saveJSON(LS_KEYS.SESSION, session);
  updateNavAndDashboard();
}
function logout(){
  setSession({ isAuthed:false, role:"guest", username:"Guest" });
  location.hash = "#/home";
  showMessage("Logged out.");
}

function isAdmin(){
  const s = getSession();
  return s.isAuthed && s.role === "admin";
}
function isUser(){
  const s = getSession();
  return s.isAuthed && s.role === "user";
}

function daysBetweenInclusive(startISO, endISO){
  const a = new Date(startISO);
  const b = new Date(endISO);
  a.setHours(0,0,0,0);
  b.setHours(0,0,0,0);
  const ms = b - a;
  const days = Math.floor(ms / 86400000) + 1;
  return days;
}
function rangesOverlap(aStart, aEnd, bStart, bEnd){
  // Inclusive overlap: [aStart..aEnd] intersects [bStart..bEnd]
  return !(aEnd < bStart || bEnd < aStart);
}

function updateNavAndDashboard(){
  const s = getSession();
  const sessionInfo = document.getElementById("sessionInfo");
  const navAdminLink = document.getElementById("navAdminLink");
  const navLoginLink = document.getElementById("navLoginLink");
  const logoutBtn = document.getElementById("logoutBtn");

  sessionInfo.textContent = s.isAuthed ? `${s.username} (${s.role})` : "Guest";

  if (s.isAuthed){
    navLoginLink.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  }else{
    navLoginLink.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
  }

  if (s.role === "admin"){
    navAdminLink.classList.remove("hidden");
  }else{
    navAdminLink.classList.add("hidden");
  }

  // Dashboard counts
  const equipment = loadJSON(LS_KEYS.EQUIPMENT, []);
  const ready = equipment.filter(e => e.status === "Ready").length;
  const out = equipment.filter(e => e.status === "Out for Rental").length;
  const maint = equipment.filter(e => e.status === "In Maintenance").length;

  document.getElementById("readyCount").textContent = ready;
  document.getElementById("outCount").textContent = out;
  document.getElementById("maintCount").textContent = maint;
}

/* Responsive nav toggle */
const navToggle = document.getElementById("navToggle");
const primaryNav = document.getElementById("primaryNav");
navToggle.addEventListener("click", () => {
  const open = primaryNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
document.getElementById("logoutBtn").addEventListener("click", logout);

/* Router */
const view = document.getElementById("view");
const routes = {
  "/home": renderHome,
  "/login": renderLogin,
  "/register": renderRegister,
  "/transactions": renderTransactions,
  "/about": renderAbout,
  "/contact": renderContact,
  "/admin": renderAdmin,
};

function route(){
  const hash = location.hash || "#/home";
  const path = hash.replace("#", "");
  const handler = routes[path] || renderNotFound;

  // Close mobile nav after click
  primaryNav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");

  handler();
}
window.addEventListener("hashchange", route);

/* Pages */
function renderHome(){
  view.innerHTML = `
    <article class="grid">
      <section class="card" aria-label="Landing page">
        <header>
          <h1>Rent equipment with real-time scheduling</h1>
          <p class="muted">
            WERS helps rental businesses avoid double-bookings, track equipment status,
            and manage reservations in one place.
          </p>
        </header>

        <section aria-label="Beneficiary process">
          <h2>How the rental process works (WERS)</h2>
          <ol>
            <li><strong>Browse equipment:</strong> Customer checks items and pricing.</li>
            <li><strong>Select dates:</strong> System checks availability to prevent conflicts.</li>
            <li><strong>Reserve and pay deposit:</strong> Booking is saved with total cost.</li>
            <li><strong>Pickup and mark “Out for Rental”:</strong> Staff updates status.</li>
            <li><strong>Return and inspection:</strong> Item is checked, then set to “Ready” or “In Maintenance”.</li>
          </ol>
          <p class="muted">
            This matches your proposal goals: centralized scheduling, conflict prevention, and equipment status tracking.
          </p>
        </section>

        <div class="actions">
          <a class="btn primary" href="#/transactions">Start a reservation</a>
          <a class="btn" href="#/register">Create an account</a>
          <a class="btn" href="#/login">Login</a>
        </div>
      </section>

      <aside class="card" aria-label="Quick info">
        <h2>What you can demo</h2>
        <ul>
          <li>Responsive navigation + dashboard</li>
          <li>User registration + login</li>
          <li>Transactions with conflict checking</li>
          <li>Admin inventory management and status updates</li>
        </ul>
        <hr />
        <p class="muted">
          Admin credentials:<br/>
          Username: <strong>admin</strong><br/>
          Password: <strong>Pa$$word1</strong>
        </p>
      </aside>
    </article>
  `;
}

function renderLogin(){
  view.innerHTML = `
    <article class="grid">
      <section class="card">
        <header>
          <h1>Login</h1>
          <p class="muted">Login as a user, or use the admin credentials to access the Admin page.</p>
        </header>

        <form id="loginForm">
          <div class="field">
            <label for="loginUsername">Username</label>
            <input id="loginUsername" name="username" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="loginPassword">Password</label>
            <input id="loginPassword" name="password" type="password" autocomplete="current-password" required />
          </div>
          <div class="actions">
            <button class="btn primary" type="submit">Login</button>
            <a class="btn" href="#/register">Go to registration</a>
          </div>
        </form>
      </section>

      <aside class="card">
        <h2>Admin access</h2>
        <p class="muted">
          Username: <strong>admin</strong><br/>
          Password: <strong>Pa$$word1</strong>
        </p>
        <p class="muted">
          Admin can update equipment, set statuses, and review bookings.
        </p>
      </aside>
    </article>
  `;

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const username = String(data.get("username")).trim();
    const password = String(data.get("password")).trim();

    if (username === ADMIN.username && password === ADMIN.password){
      setSession({ isAuthed:true, role:"admin", username:"admin" });
      location.hash = "#/admin";
      showMessage("Welcome, Admin.");
      return;
    }

    const users = loadJSON(LS_KEYS.USERS, []);
    const found = users.find(u => u.username === username && u.password === password);
    if (!found){
      showMessage("Invalid username or password.");
      return;
    }

    setSession({ isAuthed:true, role:"user", username: found.username });
    location.hash = "#/transactions";
    showMessage(`Welcome, ${found.username}.`);
  });
}

function renderRegister(){
  view.innerHTML = `
    <article class="grid">
      <section class="card">
        <header>
          <h1>Registration</h1>
          <p class="muted">Create a customer account to place equipment reservations.</p>
        </header>

        <form id="regForm">
          <div class="row">
            <div class="field">
              <label for="regUsername">Username</label>
              <input id="regUsername" name="username" required />
            </div>
            <div class="field">
              <label for="regPhone">Phone</label>
              <input id="regPhone" name="phone" inputmode="tel" placeholder="09xxxxxxxxx" required />
            </div>
          </div>

          <div class="field">
            <label for="regEmail">Email</label>
            <input id="regEmail" name="email" type="email" required />
          </div>

          <div class="row">
            <div class="field">
              <label for="regPassword">Password</label>
              <input id="regPassword" name="password" type="password" minlength="6" required />
            </div>
            <div class="field">
              <label for="regPassword2">Confirm password</label>
              <input id="regPassword2" name="password2" type="password" minlength="6" required />
            </div>
          </div>

          <div class="actions">
            <button class="btn primary" type="submit">Create account</button>
            <a class="btn" href="#/login">Go to login</a>
          </div>
        </form>
      </section>

      <aside class="card">
        <h2>Note</h2>
        <p class="muted">
          This demo stores accounts in your browser (LocalStorage).
          It is enough for class requirements without a server.
        </p>
      </aside>
    </article>
  `;

  document.getElementById("regForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const username = String(data.get("username")).trim();
    const email = String(data.get("email")).trim();
    const phone = String(data.get("phone")).trim();
    const password = String(data.get("password")).trim();
    const password2 = String(data.get("password2")).trim();

    if (password !== password2){
      showMessage("Passwords do not match.");
      return;
    }
    if (username.toLowerCase() === "admin"){
      showMessage("That username is reserved.");
      return;
    }

    const users = loadJSON(LS_KEYS.USERS, []);
    if (users.some(u => u.username === username)){
      showMessage("Username already exists. Try another.");
      return;
    }

    users.push({ username, email, phone, password, createdAt: new Date().toISOString() });
    saveJSON(LS_KEYS.USERS, users);

    showMessage("Account created. You can login now.");
    location.hash = "#/login";
  });
}

function statusBadge(status){
  if (status === "Ready") return `<span class="badge ready">Ready</span>`;
  if (status === "Out for Rental") return `<span class="badge out">Out for Rental</span>`;
  return `<span class="badge maint">In Maintenance</span>`;
}

function renderTransactions(){
  const s = getSession();
  const equipment = loadJSON(LS_KEYS.EQUIPMENT, []);
  const bookings = loadJSON(LS_KEYS.BOOKINGS, []);

  const equipmentRows = equipment.map(eq => {
    const recent = bookings
      .filter(b => b.equipmentId === eq.id)
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0];

    const recentText = recent
      ? `Last booking: ${recent.startDate} to ${recent.endDate} (${recent.status})`
      : "No bookings yet";

    return `
      <tr>
        <td><strong>${eq.name}</strong><br/><small>${eq.id} • ${eq.category}</small></td>
        <td>${statusBadge(eq.status)}<br/><small>${eq.location}</small></td>
        <td>₱${eq.pricePerDay}/day<br/><small>Deposit: ₱${eq.deposit}</small></td>
        <td><small>${recentText}</small></td>
      </tr>
    `;
  }).join("");

  view.innerHTML = `
    <article class="grid">
      <section class="card">
        <header>
          <h1>Transactions</h1>
          <p class="muted">
            Create reservations. The system checks date conflicts to prevent double-booking.
          </p>
        </header>

        <div class="table-wrap" role="region" aria-label="Equipment list table">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Status</th>
                <th>Pricing</th>
                <th>Recent</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentRows || `<tr><td colspan="4">No equipment found.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <aside class="card">
        <h2>Create a reservation</h2>
        <p class="muted">
          ${s.isAuthed ? `Logged in as <strong>${s.username}</strong>.` : `You are browsing as <strong>Guest</strong>. Login to book.`}
        </p>

        <form id="bookingForm">
          <div class="field">
            <label for="equipSelect">Equipment</label>
            <select id="equipSelect" name="equipmentId" required>
              <option value="" selected disabled>Select equipment</option>
              ${equipment.map(eq => `<option value="${eq.id}">${eq.name} (${eq.status})</option>`).join("")}
            </select>
          </div>

          <div class="row">
            <div class="field">
              <label for="startDate">Start date</label>
              <input id="startDate" name="startDate" type="date" min="${todayISO()}" required />
            </div>
            <div class="field">
              <label for="endDate">End date</label>
              <input id="endDate" name="endDate" type="date" min="${todayISO()}" required />
            </div>
          </div>

          <div class="field">
            <label for="customerName">Customer name</label>
            <input id="customerName" name="customerName" placeholder="Full name" required />
          </div>

          <div class="actions">
            <button class="btn primary" type="submit" ${s.isAuthed ? "" : "disabled"}>Reserve</button>
            <button class="btn" type="button" id="viewMyBookingsBtn">View bookings</button>
          </div>

          <p class="muted">
            Booking is disabled for guests. Please login.
          </p>
        </form>
      </aside>
    </article>

    <section class="card" aria-label="Bookings section" style="margin-top:14px">
      <h2>Bookings</h2>
      <p class="muted">Shows all reservations. Admin can also manage equipment statuses in the Admin page.</p>
      <div id="bookingsArea"></div>
    </section>
  `;

  const bookingsArea = document.getElementById("bookingsArea");

  function renderBookingsList(filterUsername = null){
    const list = loadJSON(LS_KEYS.BOOKINGS, []);
    const filtered = filterUsername ? list.filter(b => b.bookedBy === filterUsername) : list;

    if (!filtered.length){
      bookingsArea.innerHTML = `<p class="muted">No bookings found.</p>`;
      return;
    }

    const rows = filtered
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
      .map(b => `
        <tr>
          <td><strong>${b.equipmentName}</strong><br/><small>${b.equipmentId}</small></td>
          <td>${b.startDate} → ${b.endDate}<br/><small>${b.days} day(s)</small></td>
          <td>₱${b.totalCost}<br/><small>Deposit: ₱${b.deposit}</small></td>
          <td>${b.customerName}<br/><small>Booked by: ${b.bookedBy}</small></td>
          <td><small>Status: ${b.status}</small></td>
        </tr>
      `).join("");

    bookingsArea.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Dates</th>
              <th>Cost</th>
              <th>Customer</th>
              <th>Booking</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  renderBookingsList();

  document.getElementById("viewMyBookingsBtn").addEventListener("click", () => {
    const sess = getSession();
    if (!sess.isAuthed){
      showMessage("Login first to view your bookings.");
      return;
    }
    renderBookingsList(sess.username);
  });

  document.getElementById("bookingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const sess = getSession();
    if (!sess.isAuthed){
      showMessage("Please login to reserve.");
      return;
    }

    const data = new FormData(e.target);
    const equipmentId = String(data.get("equipmentId") || "");
    const startDate = String(data.get("startDate") || "");
    const endDate = String(data.get("endDate") || "");
    const customerName = String(data.get("customerName") || "").trim();

    if (!equipmentId || !startDate || !endDate || !customerName){
      showMessage("Please fill out all fields.");
      return;
    }
    if (endDate < startDate){
      showMessage("End date must be on or after start date.");
      return;
    }

    const eqList = loadJSON(LS_KEYS.EQUIPMENT, []);
    const eq = eqList.find(x => x.id === equipmentId);
    if (!eq){
      showMessage("Equipment not found.");
      return;
    }
    if (eq.status === "In Maintenance"){
      showMessage("This equipment is in maintenance and cannot be booked.");
      return;
    }

    // Conflict check: prevent double-booking for overlapping dates
    const allBookings = loadJSON(LS_KEYS.BOOKINGS, []);
    const hasConflict = allBookings.some(b =>
      b.equipmentId === equipmentId &&
      (b.status === "Reserved" || b.status === "Active") &&
      rangesOverlap(startDate, endDate, b.startDate, b.endDate)
    );

    if (hasConflict){
      showMessage("Conflict detected: this equipment is already booked for those dates.");
      return;
    }

    const days = daysBetweenInclusive(startDate, endDate);
    const totalCost = days * Number(eq.pricePerDay);

    allBookings.push({
      id: "BK-" + Math.random().toString(16).slice(2, 8).toUpperCase(),
      equipmentId: eq.id,
      equipmentName: eq.name,
      startDate,
      endDate,
      days,
      totalCost,
      deposit: eq.deposit,
      customerName,
      bookedBy: sess.username,
      status: "Reserved",
      createdAt: new Date().toISOString(),
    });

    // If reservation starts today, mark equipment as out (simple demo logic)
    if (startDate === todayISO()){
      eq.status = "Out for Rental";
      saveJSON(LS_KEYS.EQUIPMENT, eqList);
    }

    saveJSON(LS_KEYS.BOOKINGS, allBookings);
    updateNavAndDashboard();
    renderBookingsList();
    e.target.reset();

    showMessage(`Reservation saved. Total: ₱${totalCost} (Deposit: ₱${eq.deposit}).`);
  });
}

function renderAbout(){
  view.innerHTML = `
    <article class="card">
      <header>
        <h1>About WERS</h1>
        <p class="muted">
          WERS is designed for small-to-medium rental providers who need better scheduling,
          tracking, and reporting without relying on manual spreadsheets.
        </p>
      </header>

      <section>
        <h2>Problem addressed</h2>
        <ul>
          <li>Double-booking due to manual updates</li>
          <li>Slow turnaround from unclear inspection/maintenance tracking</li>
          <li>Poor forecasting without centralized booking data</li>
        </ul>
        <p class="muted">
          These match the issues listed in your proposal and the purpose of building a centralized system.
        </p>
      </section>

      <section>
        <h2>What this demo includes</h2>
        <ul>
          <li>Customer registration and login</li>
          <li>Transactions with date conflict checking</li>
          <li>Status dashboard (Ready / Out / Maintenance)</li>
          <li>Admin inventory management</li>
        </ul>
      </section>
    </article>
  `;
}

function renderContact(){
  view.innerHTML = `
    <article class="grid">
      <section class="card">
        <header>
          <h1>Contact</h1>
          <p class="muted">Send an inquiry about rentals, availability, or support.</p>
        </header>

        <form id="contactForm">
          <div class="row">
            <div class="field">
              <label for="cName">Name</label>
              <input id="cName" name="name" required />
            </div>
            <div class="field">
              <label for="cEmail">Email</label>
              <input id="cEmail" name="email" type="email" required />
            </div>
          </div>

          <div class="field">
            <label for="cTopic">Topic</label>
            <select id="cTopic" name="topic" required>
              <option value="" selected disabled>Select</option>
              <option>Availability</option>
              <option>Pricing</option>
              <option>Maintenance / Damage Report</option>
              <option>Other</option>
            </select>
          </div>

          <div class="field">
            <label for="cMsg">Message</label>
            <textarea id="cMsg" name="message" required></textarea>
          </div>

          <div class="actions">
            <button class="btn primary" type="submit">Send</button>
          </div>

          <p class="muted">
            Demo only: this form shows validation and UI behavior.
          </p>
        </form>
      </section>

      <aside class="card">
        <h2>Office</h2>
        <p class="muted">
          Equipment Rental Provider<br/>
          Dasmariñas, Cavite<br/>
          Open: 9:00 AM to 6:00 PM
        </p>
      </aside>
    </article>
  `;

  document.getElementById("contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    showMessage("Message sent (demo). Thank you.");
    e.target.reset();
  });
}

function renderAdmin(){
  if (!isAdmin()){
    view.innerHTML = `
      <article class="card">
        <h1>Administrator Page</h1>
        <p class="muted">
          Access denied. Please login with the correct admin credentials.
        </p>
        <div class="actions">
          <a class="btn primary" href="#/login">Go to login</a>
        </div>
      </article>
    `;
    return;
  }

  const equipment = loadJSON(LS_KEYS.EQUIPMENT, []);
  const bookings = loadJSON(LS_KEYS.BOOKINGS, []);

  const eqRows = equipment.map(eq => `
    <tr>
      <td><strong>${eq.name}</strong><br/><small>${eq.id} • ${eq.category}</small></td>
      <td>${statusBadge(eq.status)}<br/><small>${eq.location}</small></td>
      <td>₱${eq.pricePerDay}/day<br/><small>Deposit: ₱${eq.deposit}</small></td>
      <td><small>${eq.notes || "-"}</small></td>
    </tr>
  `).join("");

  const bkRows = bookings
    .slice()
    .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
    .map(b => `
      <tr>
        <td><strong>${b.equipmentName}</strong><br/><small>${b.equipmentId}</small></td>
        <td>${b.startDate} → ${b.endDate}</td>
        <td>${b.customerName}<br/><small>Booked by: ${b.bookedBy}</small></td>
        <td><small>${b.status}</small></td>
      </tr>
    `).join("");

  view.innerHTML = `
    <article class="grid">
      <section class="card">
        <header>
          <h1>Administrator Page</h1>
          <p class="muted">
            Manage inventory, update statuses (Ready / Out for Rental / In Maintenance),
            and review bookings.
          </p>
        </header>

        <div class="table-wrap" role="region" aria-label="Admin equipment table">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Status</th>
                <th>Pricing</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${eqRows || `<tr><td colspan="4">No equipment found.</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <aside class="card">
        <h2>Update / Add equipment</h2>

        <form id="adminEqForm">
          <div class="row">
            <div class="field">
              <label for="aeId">Equipment ID</label>
              <input id="aeId" name="id" placeholder="EQ-2001" required />
            </div>
            <div class="field">
              <label for="aeName">Name</label>
              <input id="aeName" name="name" placeholder="Scaffolding Set" required />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label for="aeCat">Category</label>
              <input id="aeCat" name="category" placeholder="Construction / Event / Tools" required />
            </div>
            <div class="field">
              <label for="aeLoc">Location</label>
              <input id="aeLoc" name="location" placeholder="Warehouse A" required />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label for="aePrice">Price per day (₱)</label>
              <input id="aePrice" name="pricePerDay" type="number" min="0" required />
            </div>
            <div class="field">
              <label for="aeDep">Deposit (₱)</label>
              <input id="aeDep" name="deposit" type="number" min="0" required />
            </div>
          </div>

          <div class="field">
            <label for="aeStatus">Status</label>
            <select id="aeStatus" name="status" required>
              <option>Ready</option>
              <option>Out for Rental</option>
              <option>In Maintenance</option>
            </select>
          </div>

          <div class="field">
            <label for="aeNotes">Notes</label>
            <input id="aeNotes" name="notes" placeholder="Inspection due, repair history, etc." />
          </div>

          <div class="actions">
            <button class="btn primary" type="submit">Save equipment</button>
            <button class="btn danger" type="button" id="deleteEqBtn">Delete by ID</button>
          </div>

          <p class="muted">
            Tip: Set to “In Maintenance” after return if inspection/repair is needed.
          </p>
        </form>
      </aside>
    </article>

    <section class="card" style="margin-top:14px" aria-label="Admin bookings">
      <h2>All bookings</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Dates</th>
              <th>Customer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${bkRows || `<tr><td colspan="4">No bookings yet.</td></tr>`}
          </tbody>
        </table>
      </div>

      <hr />

      <div class="actions">
        <button class="btn" id="markReadyBtn" type="button">Mark equipment Ready (by ID)</button>
        <button class="btn" id="markMaintBtn" type="button">Mark equipment In Maintenance (by ID)</button>
      </div>

      <div class="row" style="margin-top:12px">
        <div class="field">
          <label for="statusEqId">Equipment ID for status change</label>
          <input id="statusEqId" placeholder="EQ-1001" />
        </div>
        <div class="field">
          <label for="statusNote">Optional note</label>
          <input id="statusNote" placeholder="Returned, needs inspection" />
        </div>
      </div>
    </section>
  `;

  const adminEqForm = document.getElementById("adminEqForm");
  adminEqForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);

    const id = String(data.get("id")).trim();
    const name = String(data.get("name")).trim();
    const category = String(data.get("category")).trim();
    const location = String(data.get("location")).trim();
    const pricePerDay = Number(data.get("pricePerDay"));
    const deposit = Number(data.get("deposit"));
    const status = String(data.get("status")).trim();
    const notes = String(data.get("notes") || "").trim();

    if (!id || !name) return showMessage("Please complete required fields.");

    const list = loadJSON(LS_KEYS.EQUIPMENT, []);
    const existing = list.find(x => x.id === id);

    if (existing){
      existing.name = name;
      existing.category = category;
      existing.location = location;
      existing.pricePerDay = pricePerDay;
      existing.deposit = deposit;
      existing.status = status;
      existing.notes = notes;
    }else{
      list.push({ id, name, category, location, pricePerDay, deposit, status, notes });
    }

    saveJSON(LS_KEYS.EQUIPMENT, list);
    updateNavAndDashboard();
    showMessage("Equipment saved.");
    renderAdmin();
  });

  document.getElementById("deleteEqBtn").addEventListener("click", () => {
    const id = document.getElementById("aeId").value.trim();
    if (!id) return showMessage("Enter an Equipment ID to delete.");

    const list = loadJSON(LS_KEYS.EQUIPMENT, []);
    const next = list.filter(x => x.id !== id);
    if (next.length === list.length) return showMessage("No matching ID found.");

    saveJSON(LS_KEYS.EQUIPMENT, next);
    updateNavAndDashboard();
    showMessage("Equipment deleted.");
    renderAdmin();
  });

  function setEquipmentStatus(newStatus){
    const id = document.getElementById("statusEqId").value.trim();
    const note = document.getElementById("statusNote").value.trim();
    if (!id) return showMessage("Enter an Equipment ID first.");

    const list = loadJSON(LS_KEYS.EQUIPMENT, []);
    const eq = list.find(x => x.id === id);
    if (!eq) return showMessage("Equipment not found.");

    eq.status = newStatus;
    if (note) eq.notes = note;

    saveJSON(LS_KEYS.EQUIPMENT, list);
    updateNavAndDashboard();
    showMessage(`Status updated to "${newStatus}".`);
    renderAdmin();
  }

  document.getElementById("markReadyBtn").addEventListener("click", () => setEquipmentStatus("Ready"));
  document.getElementById("markMaintBtn").addEventListener("click", () => setEquipmentStatus("In Maintenance"));
}

function renderNotFound(){
  view.innerHTML = `
    <article class="card">
      <h1>Page not found</h1>
      <p class="muted">Go back to the home page.</p>
      <div class="actions">
        <a class="btn primary" href="#/home">Home</a>
      </div>
    </article>
  `;
}

/* Init */
seedIfNeeded();
updateNavAndDashboard();
route();
