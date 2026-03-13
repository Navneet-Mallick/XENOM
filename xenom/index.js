require('dotenv').config();

const express = require('express');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();

// Models
const User = require('./models/users.js');
const Login = require('./models/logina.js');
const Schedule = require('./models/Schedule');

// View Engine
app.set('view engine', 'ejs');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ Database Connected");
})
.catch((err) => {
    console.log("❌ Database connection error:", err);
});

// 🔹 Authentication Middleware
const authMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// ======================
// Public Routes
// ======================

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('registration');
});

app.get('/index', (req, res) => {
    res.render('index');
});

app.get('/contacts', (req, res) => {
    res.render('contacts');
});

app.get('/waste', (req, res) => {
    res.render('waste');
});

app.get('/blogpost', (req, res) => {
    res.render('blogpost');
});

// app.get('/dashboard', (req, res) => {
//     res.render('dashboard');
// });

app.get('/schedule-pickup', (req, res) => {
    res.render('schedule-pickup');
});

app.get('/locality', (req, res) => {
    res.render('locality');
});

app.get('/company', (req, res) => {
    res.render('company');
});

// ======================
// Register User
// ======================

app.post('/register', async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    try {

        const newUser = new User({
            name,
            email,
            password,
            phone,
            address
        });

        await newUser.save();

        const newLogin = new Login({
            user_id: newUser._id,
            email,
            password
        });

        await newLogin.save();

        console.log("User Registered:", email);

        res.redirect('/login');

    } catch (err) {

        console.error("Registration Error:", err);

        res.render('registration', {
            error: 'Registration failed. Try again.'
        });

    }
});

// ======================
// Login
// ======================

app.post('/login', async (req, res) => {

    const { email, password } = req.body;

    try {

        const loginData = await Login.findOne({ email });

        if (loginData && password === loginData.password) {

            const user = await User.findById(loginData.user_id);

            req.session.userId = user._id;
            req.session.user = user;

            res.redirect('/home');

        } else {

            res.render('login', {
                error: "Invalid email or password"
            });

        }

    } catch (err) {

        console.error(err);

        res.render('login', {
            error: "Something went wrong"
        });

    }

});

// ======================
// Protected Routes
// ======================

app.get('/', authMiddleware, (req, res) => {
    res.redirect('/home');
});

app.get('/home', authMiddleware, (req, res) => {
    res.render('home', { user: req.session.user });
});

app.get('/someProtectedRoute', authMiddleware, (req, res) => {
    res.render('someProtectedPage', { user: req.session.user });
});

// ======================
// Schedule Pickup
// ======================

app.post('/schedule', async (req, res) => {

    const {
        name,
        contact,
        time,
        location,
        wasteType,
        collectorType,
        weather,
        weight,
        notes
    } = req.body;

    try {

        await Schedule.create({
            name,
            contact,
            time,
            location,
            wasteType,
            collectorType,
            weather,
            weight,
            notes
        });

        res.redirect('/home');

    } catch (err) {

        console.log(err);

        res.send("Error scheduling pickup");

    }

});

// Display schedules
app.get('/schedule', async (req, res) => {

    try {

        const schedules = await Schedule.find();

        res.render('schedule', { schedules });

    } catch (err) {

        console.log(err);

        res.send("Error loading schedules");

    }

});

// ======================
// Logout
// ======================

app.get('/logout', (req, res) => {

    req.session.destroy(() => {
        res.redirect('/login');
    });

});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});