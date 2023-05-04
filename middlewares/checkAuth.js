import jwt from "jsonwebtoken";

const checkAuth = async(req, res, next)=>{
    const token = req.header("x-auth-token");
    try {
        
        const payload = jwt.verify(token, process.env.JWTSECRET);
        // req.user = payload;      // for testing to check user on the "/fetchuser" route
        next();

    } catch (error) {
        console.log(error);
        res.status(401).send("Authenticate using valid Token")
    }

}

export default checkAuth