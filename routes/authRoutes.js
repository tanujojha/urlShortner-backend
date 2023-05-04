import express from 'express';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import User from '../modal/user.js';
import checkAuth from '../middlewares/checkAuth.js';
import randomstring from "randomstring";
import transporter from "../config/nodemailerConfig.js"

const router = express.Router();

const clientURL = "https://craurlshortner.netlify.app";

//generate hashed password
const genHashPass = async (password)=>{
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds); //Salting process
    const hashedpassword = await bcrypt.hash(password, salt); //Hashing process
    return hashedpassword;
}

// REGISTER
router.post("/register", async(req, res)=>{
    // console.log(req.body);
    const {firstname, lastname, email, password} = req.body;
    const hashedpassword = await genHashPass(password);
    
    try {

        const userExist = await User.findOne({email: email})

        if(userExist){
            res.status(400).send("Email already Registered")
        }else{

            const randString = randomstring.generate({
                length: 20,
                charset: "alphanumeric"
            })

            const newUser = new User({
                firstname,
                lastname,
                email,
                password: hashedpassword,
                active: false,
                activationToken: randString
            }, false);
            const user = await newUser.save();
            // console.log(user);
    
            if(user){

                const info = await transporter.sendMail({
                    from: process.env.NODEMAILER_EMAIL,
                    to: email,
                    subject: "Account Activation Link",
                    text: "Go to this link and Authorize to activate your account",
                    html: `<p>Go to this link to activate your account</p>
                            <br/>
                            <a>${clientURL || process.env.CLIENT_URL}/accverify/${randString}</a>`
                })

                if(info.messageId){
                    console.log("Registration Successfull activation link sent");
                    res.status(200).send("Registration Successfull activation link sent")
                    
                }else{
                    res.status(401).send({message: "Cant send Email", randStr: randString})
                }

            }else{
                res.status(500).send("Registration Failed")
            }

        }
  
    } catch (error) {
        console.log(error);
    }
});


// TOKEN VERIFICATION FOR ACTIVATION OF ACCOUNT
router.post("/activateaccount", async(req, res)=>{

    const {linkToken} = req.body
    // console.log(linkToken);

    try {

        const checkActivationToken = await User.findOne({activationToken: linkToken});
        // console.log(checkActivationToken);
        if(!checkActivationToken){
            res.status(401).send("Link did not match")
        }else{
            const activatedUser = await User.findOneAndUpdate({_id: checkActivationToken._id}, {$set: {active: true}, $unset: {activationToken: ""}}, {returnOriginal: false, strict: false});
            if(activatedUser){
                console.log("Account activated");
                res.status(200).send({message: "Activated", userID: checkActivationToken._id})
            }else{
                console.log("Account did not activate");
                res.status(400).send("Account did not activate");
            }
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})



// LOGIN
router.post("/login", async(req, res)=>{
    // console.log(req.body);
    const {email, password} = req.body;
    
    try {
        // find user with email from DB
        const user = await User.findOne({email: email});
        // this is to send the user detail to client
        const userToSendToClient = await User.findOne({email: email}, 'name email');
        if(!user){
            res.status(400).send("Email does not exits")
        }else{
            // validate password from DB
            const validatePassword = await bcrypt.compare(password, user.password);
            if(!validatePassword){
                res.status(400).send("wrong password");
            }else{
                // payload for jwt
                const payload = {
                    id: user.id,
                    email: user.email
                }
        
                //sign jwt
                const token = jwt.sign(payload, process.env.JWTSECRET);
                console.log("Login Successfull");
                res.status(200).send({message: "Success", token, user: userToSendToClient})
    
            }

        }

    } catch (error) {
        console.log(error);
    }
})

// FORGOT PASSWORD
// SEND LINK TO EMAIL AFTER EMAIL VERIFICATION
router.post("/fopa", async(req, res)=>{

    const {email} = req.body

    try {

        const userExist = await User.findOne({email: email})
        if(!userExist || userExist.length === 0){
            res.status(401).send("Email not Registered")
        }else{
            const randString = randomstring.generate({
                length: 20,
                charset: "alphanumeric"
            })

            const setRandStr = await User.findOneAndUpdate({ _id: userExist._id}, {$set: {randomString: randString}}, {returnOriginal: false, strict: false});
            // console.log(setRandStr);

            const info = await transporter.sendMail({
                from: process.env.NODEMAILER_EMAIL,
                to: email,
                subject: "Password Reset Link",
                text: "Go to this link and Authorize to reset your Password",
                html: `<p>Go to this link to reset your password</p>
                        <br/>
                        <a>${clientURL || process.env.CLIENT_URL}/fopaverify/${randString}</a>`
            })

            if(info.messageId){
                console.log("foget pass link sent");
                res.status(200).send("A link has been sent to your registered Email")
            }else{
                res.status(401).send({message: "Cant send Email", randStr: randString})
            }

        }   
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
})


// FORGET PASS VERIFY LINK 
router.post("/verifylink", async(req, res)=>{

    const {linkToken} = req.body
    // console.log(linkToken);

    try {

        const checkLinkToken = await User.findOne({randomString: linkToken});
        // console.log(checkLinkToken);
        if(!checkLinkToken){
            res.status(401).send("Link did not match")
        }else{
            console.log("forget pass token verified");
            res.status(200).send({message: "Authorized", userID: checkLinkToken._id})
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


// CHANGE/UPDATE PASSWORD
router.put("/changepassword", async(req, res)=>{
    // console.log(req.headers.user);
    // console.log(req.body);
    const password = req.body.password;
    const userID = req.headers.user
    try {

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatePass = await User.findOneAndUpdate({_id: userID}, {$set: {password: hashedPassword}, $unset: {randomString: ""}}, {returnOriginal: false, strict: false})
        console.log("password updated");
        res.status(200).send("Password Updated")
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})




// TESTING PURPOSE
// GET USER FROM MIDDLEWARE userVerify
router.get("/fetchuser", checkAuth, async(req, res)=>{
    // console.log(req.user);
    try {
        const userID = req.user.id;
        const user = await User.findById(userID).select({password:0});
        res.status(200).send(user)
        
    } catch (error) {
        console.log(error);
        res.status(400).send("something went wrong")
    }
})


export default router