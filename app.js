if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

 

const express = require("express");
const app = express();
const mongoose = require("mongoose");
// const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
// const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
// const { listingSchema, reviewSchema} = require("./schema.js");
// const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");




main().then(() => {
    console.log("connected to db");
}).catch((err) => {
    console.log(err)
});

async function main() {
    // await mongoose.connect(MONGO_URL);
    await mongoose.connect(process.env.MONGO_URI);
}
viewPath = path.join(__dirname, "views");
console.log(viewPath)
app.set("view engine", "ejs");
app.set("views",viewPath);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
staticPath = path.join(__dirname, "/public")
app.use(express.static(staticPath));
console.log(staticPath);
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))

const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    crypto: {
        secret: process.env.SECRET,
},
touchAfter: 24*3600,
});

//to check for errors
store.on("error", ()=>{
    console.log("error in MONGO SESSION STORE" , err);
});

const sessionOptions = {
    store, //to pass the store info in the express session
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
};

// app.get("/", (req, res) => {
//     res.send("Hi, I am Root");
// });



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success,  ");
    res.locals.error = req.flash("error");
    // console.log(res.locals.success);
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "student@gmail.com",
//         username: "delta-student"
//     });
//     //to store
//     let registeredUser= await User.register(fakeUser, "helloworld");
//     //these are username and password
//     res.send(registeredUser);
// });
app.get("/", (req,res)=>{
    res.redirect("/listings");
});

app.use("/listings", listingRouter);
// app.use("/symptoms",sympotomsRouter);
//reviews
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.get("/symptoms", (req, res) => {
    res.render('symptoms');

});

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found !"));
});

//middleware to handle error 
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error.ejs", { err })
    // res.status(statusCode).send(message);
});

// app.get("/testListing", async (req, res)=>{
// let sampleListing = new Listing({
//     title: "My New Villa",
//     description: "By the Beach",
//     price: 1200,
//     location: "Calanguate, Goa",
//     country: "India",
// });
 


// await sampleListing.save();
// console.log("Sample was saved");
// res.send("Successful testing");
// });
app.listen(3003, () => {
    console.log("server is listening to port 3003");
});