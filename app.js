const express = require('express');
const app = express();

const session = require('express-session');
const passport = require('passport');
const Strategy = require('passport-google-oauth2').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

const request = require('node-superfetch');

const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const valid = require('url-regex');


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


passport.use(session({
secret:'keyboard cat',
resave: true,
saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', async (req,res, next) => {
 db.find({}, (err, result) => {
 res.render('index.ejs', { req, result});
 next();
 })
});


app.get('/list_dom', (req,res) => {
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


app.get('/auth/google',
  passport.authenticate('google', { scope: 
      [ 'https://www.googleapis.com/auth/plus.login',
      , 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }
));

app.get('/auth/google/callback', 
    passport.authenticate('google', { 
        successRedirect: '/',
        failureRedirect: '/auth/google'
}));



let listener = app.listen(process.env.PORT, function () {
 console.log(`Listening to ${listener.address().port}`);
});
