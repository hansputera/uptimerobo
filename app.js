const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const valid = require('url-regex');


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('trust proxy', 1);

mongoose.connect('mongodb+srv://anak:sapi@cluster0-dwjqm.mongodb.net/urls?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
 if (err) {
  console.log(err);
 }

 console.log('Successfuly connected to MongoDB!');
});

const dbSchema = new mongoose.Schema({
 URL: String
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

app.get('/', async (req,res) => {
 res.render('index.ejs', { req });
});

app.get('/error', async (req, res) => {

let t = req.query.t;

if (!t) return res.redirect('/');

res.json({ error: t });

});

app.post('/submit', async (req,res) => {
try {
 let url = req.body.url;

 let domain = valid({ strict: true, exact: true }).test(url);

 if (!domain) return res.redirect(`/error?t=${escape('Your URL is not valid!')}`);

 let { status } = await request.get(url);

 if (status === 200) {
 
 await db.findOne({ URL: url.toLowerCase() }, async (err, result) => {
   if (err) {
     res.send(`Sorry, you've been stopped, because: ${err}`);
   }
   if (res) {
    res.send(`Thank you for using our uptime!<br>We detect <strong>${url}</strong> is available!<br>Please go <a href="/">back</a>`);
  } else {
   let data = await db({ URL: url.toLowerCase() });

   data.save().then(error => {
     res.json({ success: true, message: "Your data has saving. Now your domain is online for 24/7!" });
     setTimeout(() => { res.redirect('/'); }, 5000);
   });
  }
 })
 }
 }catch(e) {
  res.redirect(`/error?t=${escape(e.message)}`);
 }
});


let listener = app.listen(process.env.PORT, function () {
 console.log(`Listening to ${listener.address().port}`);
});
