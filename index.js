const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sequelize = require('sequelize');
const db = new sequelize.Sequelize('express_test', 'express_test', 'express_test', {
    dialect: 'mysql',
    host: 'localhost'
});

db.authenticate().then(() => {
    console.log("Database connected!");
}).catch(err => {
    console.error(err);
})

// Models
const User = require('./models/User');

User.init({
    name: {
        type: sequelize.DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: sequelize.DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize: db,
    modelName: 'user',
    tableName: 'users'
});

db.sync({alter: true})

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
    User.findAll({
        where: {
            name: req.body.username
        }
    }).then(user => {
        if (user.length <= 0) {
            return res.render("pages/login", {
                data: {
                    title: "Login",
                    header: "Login",
                    error: {
                        message: "Invalid username or password!"
                    }
                }
            })
        }

        if (bcrypt.compareSync(req.body.password, user[0].getDataValue("password"))) {
            req.session.auth = true;
            req.session.authas = {
                user: user[0].getDataValue("name")
            }
            res.redirect(200, "/");
        } else {
            res.render("pages/login", {
                data: {
                    title: "Login",
                    header: "Login",
                    error: {
                        message: "Invalid username or password!"
                    }
                }
            })
        }
    })
})

// Registration system
app.get("/register", (req, res, next) => {
    if (!req.session) return res.render('pages/index', {data: {world: "! Some bad programming happened"}}) && next();
    if (req.session.auth) return res.redirect(200, "/") && next();
    res.render("pages/register", {data: {
        title: "Register",
        header: "Please register"
    }})
    return next();
});

app.post("/register", (req, res, next) => {
    if (!req.session) return res.render('pages/index', {data: {world: "! Some bad programming happened"}}) && next();
    if (req.session.auth) return res.redirect(200, "/") && next();
    User.findAll({
        where: {
            name: req.body.username
        }
    }).then(user => {
        if (user.length > 0) {
            res.render("pages/register", {
                data: {
                    header: "Register",
                    title: "Reigster",
                    error: {
                        message: "Username already taken!"
                    }
                }
            })
        } else {
            User.create({
                name: req.body.username,
                password: bcrypt.hashSync(req.body.password, 11)
            }).then(() => {
                res.render("pages/login", {
                    data: {
                        header: "Login",
                        title: "Login"
                    }
                })
            })
        }
    })
});

// Logout
app.post("/logout", (req, res, next) => {
    req.session.auth = false;
    if (req.session.authas) {
        delete req.session.authas;
    }
    
    res.redirect(200, "/login")
});

app.listen(3000, () => {
    console.log("Server is online!")
})
