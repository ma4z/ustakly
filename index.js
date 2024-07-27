const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const settings = require('./settings.json');

const app = express();

// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new DiscordStrategy({
  clientID: settings.discordClientID,
  clientSecret: settings.discordClientSecret,
  callbackURL: settings.discordCallbackURL,
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => {
  process.nextTick(() => {
    return done(null, profile);
  });
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: settings.sessionSecret,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard');
  } else {
    res.render('login');
  }
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('dashboard', { user: req.user });
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.listen(settings.port, () => {
  console.log(`Server running on port ${settings.port}`);
});
