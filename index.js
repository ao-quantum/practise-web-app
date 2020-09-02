const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: 'express_test',
    password: "express_test",
    database: 'express_test'
});

const app = express();

app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs');
app.use(session({
    secret: "yanan",
    cookie: {
        maxAge: 60000
    },
    resave: true,
    saveUninitialized: false
}));

app.get("/", (req, res, next) => {
    if (!req.session) return res.render('pages/index', {data: {world: "! Some bad programming happened"}}) && next();
    if (!req.session.auth) return res.redirect(403, "/login") && next();
    res.render("pages/index", {
        data: {
            title: "Welcome!",
            heading: `Welcome ${req.session.authas.user}`
        }
    });
    return next();
});

// Login system
app.get("/login", (req, res, next) => {
    if (!req.session) return res.render('pages/index', {data: {world: "! Some bad programming happened"}}) && next();
    if (req.session.auth) return res.redirect(200, "/") && next();
    res.render("pages/login", {data: {
        title: "Login",
        header: "Please login"
    }})
    return next();
});

app.post("/login", (req, res) => {
    if (!req.session) return res.render('pages/index', {data: {world: "! Some bad programming happened"}}) && next();
    if (req.session.auth) return res.redirect(200, "/") && next();
    con.query(`SELECT * FROM users WHERE ?? = ?`, ["name", req.body.username], (err, rows) => {
        if (rows.length <= 0) return res.render("pages/login", {
            data: {
                title: "Login",
                error: {
                    message: "Invalid username or password!"
                }
            }
        }) && next();
        if (bcrypt.compareSync(req.body.password, rows[0].password)) {
            req.session.auth = true;
            req.session.authas = {
                user: rows[0].name
            }
            res.redirect(200, "/")
        } else {
            res.render("pages/login", {data: {
                title: "Login",
                error: {
                    message: "Invalid username or password!"
                }
            }});
        }
    })
})

// Registration system
app.get("/register", (req, res, next) => {
    if (!req.session) return res.render('pages/index', {data: {world: "! Some bad programming happened"}}) && next();
    if (req.session.auth) return res.redirect(200, "/") && next();
    res.render("pages/register", {data: {
        title: "Register",
        header: "Please enter the password"
    }})
    return next();
});

app.post("/register", (req, res, next) => {
    if (!req.session) return res.render('pages/index', {data: {world: "! Some bad programming happened"}}) && next();
    if (req.session.auth) return res.redirect(200, "/") && next();
    con.query(`INSERT INTO users (??, ??) VALUES (?, ?)`, ["name", "password", req.body.username, bcrypt.hashSync(req.body.password, 12)], (err, rows) => {
        if (err) throw err;

        res.redirect(200, "/login")
        return next();
    })
});

// Logout
app.post("/logout", (req, res, next) => {
    req.session.auth = false;
    if (req.session.authas) {
        delete req.session.authas;
    }
    
    res.redirect("/login", 200)
});

app.listen(3000, () => {
    console.log("Server is online!")
})
