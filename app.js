function checkAuth(req, res, next) {
 if (req.isAuthenticated()) return next();
 res.redirect('/auth/google');
}
function checkAuthan(req, res, next) {
 if (!req.isAuthenticated()) return next();
 res.redirect('/logout');
}

const express = require('express');
const app = express();

const session = require('express-session');
const passport = require('passport');
const Strategy = require('passport-google-oauth2').Strategy;
const StrGit = require('passport-github2').Strategy;
const StrDis = require('passport-discord').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

const request = require('node-superfetch');

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { WAFJS } = require("wafjs");
const valid = require('url-regex');
const baseConf = {
 allowedMethods: ["GET", "POST"],
 contentTypes: ["application/json", "multipart/form-data"]
}

const _wafjs = new WAFJS(baseConf);

const checkBot = (req, res, next) => {
 if(_wafjs.isBotCheck(req.headers['user-agent'])){
  res.status(403).send();
}

 if (_wafjs.reqCheck(req.method, req.headers["content-type"])) {
  res.status(403).send();
 }
};

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('assets'));
app.set('trust proxy', 1);

mongoose.connect('mongodb+srv://anak:sapi@cluster0-dwjqm.mongodb.net/urls?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
 if (err) {
  console.log(err);
 }

 console.log('Successfuly connected to MongoDB!');
});

const dbSchema = new mongoose.Schema({
 URL: String,
 PWD: String
});

const db = mongoose.model('uptime', dbSchema);

setInterval(() => {
db.find({}, function (err, result) {
 if (err) {
  console.log(err);
 } else {
  for (let i = 0; i < result.length; i++) {
    let track = result[i];
    request.get(track.URL).then(res => {
      console.log(`[INFO] REQUEST FOR ${track.URL}`);
    });
  }
 }
});

}, 10 * 1000);

let stc = ['identify', 'email', 'guilds', 'connections', 'guilds.join'];

passport.use(new StrDis({
  clientID: '705889935659630603',
  clientSecret: 'sJa1ZbMIMj3Lca9zr6KMHrY4Zfy-cLJy',
  callbackURL: 'https://uptimeribod.herokuapp.com/auth/discord/callback',
  scope: stc
}, function(accessToken, refreshToken, profile, done) {
 process.nextTick(function() {
  done(null, profile);
  })
}));

passport.use(new StrGit({
 clientID: '5ed94b77a52dae756a73',
 clientSecret: '74fb3522da601cefb36756850505ebd22e963b83',
 callbackURL: 'https://uptimeribod.herokuapp.com/auth/github/callback'
}, function(accessToken, refreshToken, profile, done) {
  process.nextTick(function() {
    done(null, profile);
  })
 }));

passport.use(new Strategy({
    clientID: '396106065900-i47son68ud1rvquc8qqgb2dmenmhlh1m.apps.googleusercontent.com',
    clientSecret: 'cUxAxT1TyL3wqvhyQcOHI9Fd',
    callbackURL: "https://uptimeribod.herokuapp.com/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    process.nextTick(function() {
     done(null, profile);
   })
}));


app.use(session({
secret:'keyboard cat',
resave: true,
saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', async (req,res, next) => {
let foto;
console.log(req.user);

 if (req.user) {
   if (req.user.provider === 'google') foto = req.user.picture;
   if (req.user.provider === 'github') foto = req.user._json["avatar_url"];
   if (req.user.provider === 'discord') {
     req.user.displayName = req.user.username + '#' + req.user.discriminator;
     foto = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}`;
   }
 }


 db.find({}, (err, result) => {
 res.render('index.ejs', { req, result, foto});
 next();
 })
});

app.get('/terms', (req,res) => {
 res.render('tos.ejs', { req });
});

app.get('/policy', (req,res) => res.render('policy.ejs', { req }));

app.get('/list_dom', checkBot, (req,res) => {
 db.find({}, (err, result) => {
  if (err) {
   res.json({ error: err });
  }

 res.json(result);
// res.end(result);
})
});


app.get('/error', async (req, res) => {

let t = req.query.t;

if (!t) return res.redirect('/');

res.json({ error: t });

});


app.get('/removeAll', async (req,res) => {

if (!req.query.pwd || req.query.pwd === '') return res.redirect('/');

db.find({}, async (err, result) => {


 let x = result.filter(x => x.PWD === req.query.pwd);

 if (x === []) return res.redirect('/');

 for (let i = 0; i < x.length; i++) {
   let tr = x[i].URL;


   db.deleteOne({ URL: tr }, (err, polres) => {
    res.json({ anjay: 'DATA DARI PASSWORD ' + req.query.PWD + ' TERHAPUS GAN, AWOKAOWWKAOAK'});
   });
  }
});


});

app.post('/submit', async (req,res) => {
try {
 let url = req.body.url;
 let pwd = req.body.pwd;
 
 const prof = require('profanities');
 const passwordValidator = require('password-validator');
 const schematod = new passwordValidator();
 
schematod
.is().min(8)                                    // Minimum length 8
.is().max(8)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['1234567890', 'kontol']); // Blacklist these values

 if (schematod.validate(pwd)) return res.send('<pre><code>*</code> Requirements Password<br /><br /><strong>1. Minimal and Maximal Password length is <code>8</code><br>2. Must have uppercase and lowercase letters.<br>3. Must have digits or numbers<br>4. Should not have spaces.<br>5. Don\'t use badwords in your password.</strong></pre>');

 if (prof.includes(pwd.toLowerCase())) return res.redirect(`/error?t=${escape('Your password has badwords!')}`);
 

 let domain = valid({ strict: true, exact: true }).test(url);

 if (!domain) return res.redirect(`/error?t=${escape('Your URL is not valid!')}`);

 let { status } = await request.get(url);

 if (status === 200) {
 
 await db.findOne({ URL: url.toLowerCase() }, async (err, result) => {
   if (err) {
     res.send(`Sorry, you've been stopped, because: ${err}`);
     //res.end(err);
   }
   if (result) {
   return res.send(`Thank you for using our uptime!<br>We detect <strong>${url}</strong> is available!<br>Please go <a href="/">back</a>`); //&& res.end('Stop');
  }
   let data = await db({ URL: url.toLowerCase(), PWD: pwd });

   data.save().then(error => {
     res.json({ success: true, message: "Your data has saving. Now your domain is online for 24/7!" });
   });
 })
 }
 }catch(e) {
  res.redirect(`/error?t=${escape(e.message)}`);
 }
});

app.get('/login', checkAuth);

app.get('/logout', checkAuth, (req,res) => {
 req.logout();
 res.redirect('/');
});

app.get('/auth/google', checkAuthan, passport.authenticate('google', { scope:  [ 'https://www.googleapis.com/auth/plus.login',
      , 'https://www.googleapis.com/auth/plus.profile.emails.read' ]}));

app.get('/auth/github', checkAuthan, passport.authenticate('github', { scope: [ 'user:email' ] }));


app.get('/auth/google/callback', 
    passport.authenticate('google', { 
        successRedirect: '/',
        failureRedirect: '/auth/google'
}));

app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/auth/github' }),
  function(req, res) {
    
    res.redirect('/');
  });


app.get('/auth/discord', checkAuthan, passport.authenticate('discord', { scope: stc }));

app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/login'
}), function(req, res) {
    res.redirect('/');
});


let listener = app.listen(process.env.PORT, function () {
 console.log(`Listening to ${listener.address().port}`);
});
