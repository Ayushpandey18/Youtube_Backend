import async_Handler from "../utils/asyncHandler.js";
import jwt from"jsonwebtoken"
import apierrror from "../utils/Apierror.js";
import { User } from "../models/User.model.js";
const verifyJWT=async_Handler(async(req,_,next)=>{
try {
       const token= req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        throw new apierrror("unauthenticated",401)
    }
    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user=await User.findById(decodedToken._id).select("-password -refreshToken")
    if(!user)
        {
            throw new apierrror("unauthenticated",401)
        }
        req.user=user;
        next()
} catch (error) {
    throw new apierrror("something went wrong",401)
}
})
export default verifyJWT;