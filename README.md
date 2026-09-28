# Value City — E-commerce System

Group project. Currently contains the Admin Dashboard & Inventory Management module.

Stack: React (Vite) + Node/Express + MySQL

## Setup

**1. Install dependencies**

    cd client
    npm install
    cd ../server
    npm install

**2. Set up the database**

- Open phpMyAdmin (MAMP or XAMPP)
- Create a database named `value_city_admin`
- Go to the Import tab and import the `.sql` file from the `database/` folder

**3. Create your environment file**

Create `server/.env` with your own values:

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=root
    DB_NAME=value_city_admin
    DB_PORT=3306
    JWT_SECRET=any_long_random_string

Note on ports: MAMP usually uses 8889 or 3306, XAMPP uses 3306. Check your control panel.
Note on passwords: MAMP's default root password is `root`, XAMPP's is blank.

**4. Run it**

Two terminals, both running at once:

    cd server
    node server.js        # http://localhost:5000

    cd client
    npm run dev           # http://localhost:5173

## Project structure

- `client/` — React frontend
- `server/` — Express API
- `database/` — SQL schema and data backup

## Adding your module

- Backend: add files to `server/controllers/` and `server/routes/`, then register them in `server.js` (a `require` at the top, an `app.use` below)
- Frontend: add pages to `client/src/pages/`, then add a route in `App.jsx`
- Work on your own branch and open a Pull Request into `main`
- When editing `server.js` or `App.jsx`, add your lines at the END of the existing lists to avoid merge conflicts