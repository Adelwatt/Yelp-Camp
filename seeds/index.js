const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//logic to check if there is an error, if not we can print out "Database connected"
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for(let i = 0; i < 200; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author : '61aa887aa729f11f8a2721e5',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            geometry: {
                type: 'Point',
                coordinates: [cities[random1000].longitude, cities[random1000].latitude]
            },
            title: `${sample(descriptors)}  ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            price,
            images: [
                {
                  url: 'https://res.cloudinary.com/du7ijutnw/image/upload/v1638902399/YelpCamp/bxz6l8bbnyxmsx6olgqd.jpg',
                  filename: 'YelpCamp/bxz6l8bbnyxmsx6olgqd'
                },
                {
                  url: 'https://res.cloudinary.com/du7ijutnw/image/upload/v1638902403/YelpCamp/bz5wyravtskstpxs8fot.jpg',
                  filename: 'YelpCamp/bz5wyravtskstpxs8fot'
                }
              ]
              
        });
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
});


