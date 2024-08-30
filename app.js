//if we are in develop env (not production env) => include variables in ".env" file in process.env
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

const MongoStore = require('connect-mongo');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';


mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
//logic to check if there is an error, if not we can print out "Database connected"
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
//To remove data like: {username: {$gt:""}}
app.use(mongoSanitize());


app.use(helmet());
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/du7ijutnw/", 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60, //24 hours     //time period(refers to unnecesseraly updating) to update the database, we can update it everytime user refresh the page, and we also can declare a time period
    crypto: {
        secret: secret
    }
});

store.on('error', function(e){
    console.log('*****STORE SESSION ERROR*****', e)
})  

// const store = new MongoStore({
//     url: dbUrl,
//     secret: 'thisshouldbeabettersecret!',
//     touchAfter: 24 * 60 * 60
// });
// store.on('error', function(e){
//     console.log("Session store error", e);
// })

const sessionConfig = {                     //the default store that session uses to save data is memory store, it would be problematic BC of that we will use mongo store(MongoDBStore)
    store: store,
    name: 'session',
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,  //cookies only accessible over http, they aren't accessible over JS 
        //1000 * 60 * 60 * 24 * 7 mill seconds in a week
        //secure: true,    //cookies only accessible over https(secure)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
//in a local strategy will make a authentication method and call it authenticate()
passport.use(new LocalStrategy(User.authenticate()));
//telling how to store a user in a session
passport.serializeUser(User.serializeUser());
//telling how to getting out a user from a session
passport.deserializeUser(User.deserializeUser());

app.engine('ejs', ejsMate);

app.use((req, res, next) =>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('page not found', 404));
})

app.use((err, req, res, next) => {
    const {statusCode = 500, message = 'something went wrong'} = err;
    if(!err.message) err.message = 'Something went wrong';
    res.status(statusCode).render('error', {err});
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});




