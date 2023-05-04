import express from "express";
import checkAuth from '../middlewares/checkAuth.js';
import Url from "../modal/url.js";
import randomstring from "randomstring";


const router = express.Router();


// POST LONGURL AND GET A SHORT URL STRING
router.post("/gotiny", checkAuth, async(req, res)=>{

    const longurl = req.body.longurl;
    const shortUrlString = randomstring.generate({
        length: 10,
        charset: "alphanumeric"
    });

    try {

        const newUrlData = new Url({
            longurl: longurl,
            shorturl: shortUrlString,
        });
        const urlData = await newUrlData.save();

        if(!urlData){
            console.log("URL not saved in DB");
        }else{
            console.log("URL saved");
            res.status(200).send({message: "URL saved", urlData: urlData})
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
});


// CHECK FOR THE SHORT URL STRING AND GET THE CORROSPONDING LONG URL
router.post("/redirect", checkAuth, async(req, res)=>{

    const shortUrlString = req.body.shortUrlString;
    // console.log(shortUrlString);

    try {

        const urlData = await Url.findOne({shorturl: shortUrlString});

        if(!urlData){
            console.log("no long url for the short url provided");
            res.status(400).send("no long url for the short url provided")
        }else{
            const updatedUrlData = await Url.findOneAndUpdate({_id: urlData._id}, {$set: {count: urlData.count+1}}, {returnOriginal: false, strict: false});
            
            console.log("long url found " + urlData.longurl);
            res.status(200).send({message: "found the long url", urlData: updatedUrlData})
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


// GET ALL URLS
router.get("/getall", checkAuth, async(req, res)=>{
    try {

        const allUrls = await Url.find({})
        // console.log(allUrls);
        res.status(200).send(allUrls)
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


// COUNT URLS CREATED PER DAY
router.get("/getcountbydate", checkAuth, async(req, res)=>{
    try {

        const allUrls = await Url.aggregate([
            {
              $addFields: {
                createdAtDate: {
                  $toDate: "$createdAt"
                },
                
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAtDate"
                  }
                },
                count: {
                  $sum: 1
                }
              }
            },
            {
              $project: {
                count: 1,
                date: "$_id",
                _id: 0
              }
            }
          ])
        // console.log(allUrls);
        res.status(200).send(allUrls)
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


// COUNT URLS CREATED PER MONTH
router.get("/getcountbymonth", checkAuth, async(req, res)=>{
    try {

        const allUrls = await Url.aggregate([ // Url is the model of userSchema
        {
          $group: {
            _id: { $month: "$createdAt" }, // group by the month *number*, mongodb doesn't have a way to format date as month names
            numberofdocuments: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: false, // remove _id
            month: { // set the field month as the month name representing the month number
              $arrayElemAt: [
                [
                  "", // month number starts at 1, so the 0th element can be anything
                  "january",
                  "february",
                  "march",
                  "april",
                  "may",
                  "june",
                  "july",
                  "august",
                  "september",
                  "october",
                  "november",
                  "december"
                ],
                "$_id"
              ]
            },
            numberofdocuments: true // keep the count
          }
        }
      ])
        // console.log(allUrls);
        res.status(200).send(allUrls)
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


export default router