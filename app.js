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

app.get('/', async (req,res) => {
 res.render('index.ejs', { req });
});

app.post('/submit', async (req,res) => {
 let url = req.body.url;

 let vld = valid({ strict: true }).test(url);

 if (!vld) return res.redirect('/error?t=' + encodeURI('Your URL is not valid!'));
 
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
 });
});


let listener = app.listen(process.env.PORT, function () {
 console.log(`Listening to ${listener.address().port}`);
});
