import async_Handler from "../utils/asyncHandler.js"
import apierror from "../utils/Apierror.js"
import {User} from "../models/User.model.js"
import apierrror from "../utils/Apierror.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiresponse } from "../utils/Apiresponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessTokenandRefreshToken= async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new apierrror("something went wrong",500)
    }
}
const registerUser=async_Handler(async(req,res)=>{
    //get user details
    //validation
    //already exists
    //check for images
    //upload them in cloudinary
    //create user object-create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    const {fullname,email,username,password}=req.body
    console.log("email",email);
    if([fullname,email,username,password].some((field)=>field?.trim()==="")){
        throw new apierror("all fields are required",400)
    }
    const existedUser=await User.findOne({$or:[{email},{username}]})
    if(existedUser){
        throw new apierror("user already exists",409)
    }
    console.log(req.files)
    const avatarLocalPath=req.files?.avatar[0]?.path
    let coverimageLocalPath;
    if(req.files&&Array.isArray(req.files.coverimage)&&req.files.coverimage.length>0){
        coverimageLocalPath=req.files.coverimage[0].path
    }
    if(!avatarLocalPath){
        throw new apierrror("images are required",400)
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverimage=await uploadOnCloudinary(coverimageLocalPath)
    if(!avatar){
        throw new apierrror("image upload failed",500)
    }
    const user= await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverimage: coverimage?.url||""
    })
   const createduser= await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if(!createduser){
    throw new apierrror("user not created",500)
   }
return res.status(201).json(
    new apiresponse(201,"user created successfully",createduser)
)
})
const loginUser=async_Handler(async(req,res)=>{
    //req body
    //username or email
    //find the user
    //password check
    //access and refresh token generation
    //send cookie
    const {email,username,password}=req.body
    if(!(email||username)){
        throw new apierrror("username or email is required",400)
    }
    const user=await User.findOne({$or:[{email},{username}]})
    if(!user){
        throw new apierrror("user not found",404)
    }
    const isPasswordCorrect=await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new apierrror("password is incorrect",401)
    }
    const {accessToken,refreshToken}=await generateAccessTokenandRefreshToken(user._id)
    const loggedinuser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    const options={
        httpOnly: true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options).json(
        new apiresponse(200,"user logged in successfully",{user:loggedinuser,accessToken,refreshToken
        })
    )
})
const logoutuser=async_Handler(async (req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );
        
const options={
    httpOnly: true,
    secure:true
}
return res.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options).json(
    new apiresponse(200,"user logged out successfully")
)
})
const refreshAccessToken=async_Handler(async(req,res)=>{
    const incomingrefreshToken=req.cookies.refreshToken||req.body.refreshToken
    if(!incomingrefreshToken){
        throw new apierrror("refresh token is required",400)
    }
try {
    const decodedtoken=jwt.verify(
        incomingrefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
    )
    const user=User.findById(decodedtoken?._id)
    if(!user){
        throw new apierrror("user not found",404)
    }
    if(incomingrefreshToken!==user?.refreshToken){
        throw new apierrror("invalid refresh token",401)
    }
    const options={
        httpOnly: true,
        secure:true
    }
    const {accessToken,newrefreshToken}=await generateAccessTokenandRefreshToken(user._id)
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options).json(
        new apiresponse(200,"new access token generated successfully",{accessToken,newrefreshToken})
    )
} catch (error) {
    throw new apierrror("invalid refresh token",401)
}
})
const changeCurrentPassword=async_Handler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    const user=await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldpassword)
    if(isPasswordCorrect){
        throw new apierrror("old password is incorrect",400)
    }
    user.password=newpassword
    await user.save({validateBeforeSave: false})
    return res.status(200).json(
        new apiresponse(200,"password changed successfully")
    )
})
const getcurrentuser=async_Handler(async(req,res)=>{
    return res.status(200).json(
        new apiresponse(200,"user fetched successfully",req.user)
    )
})
const updatedetails=async_Handler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!(fullname||email)){
        throw new apierrror("all fields are required",400)
    }
    const user=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(
        new apiresponse(200,"user details updated successfully",user)
    )
})
const updateAvatar=async_Handler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new apierrror("image is required",400)
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(avatar.url){
        throw new apierrror("image upload failed",400)
    }
   const user= await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(
        new apiresponse(200,"avatar updated successfully",user)
    )
})
const updatecoverImage=async_Handler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new apierrror("image is required",400)
    }
    const coverImage=await uploadOnCloudinary(avatarLocalPath)
    if(coverImage.url){
        throw new apierrror("image upload failed",400)
    }
   const user= await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                coverimage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(
        new apiresponse(200,"coverImage updated successfully",user)
    )
})
const getchanneldetails=async_Handler(async(req,res)=>{
   const {username}= req.params
   if(!username?.trim()){
    throw new apierrror("username is required",400)
   }
  const channel= await User.aggregate([
    {$match:{username:username?.toLowerCase()}},
    {
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $lookup:{
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedto"
        }
    },
    {
        $addFields:{
            subscriberCount:{$size:"$subscribers"},
            subscribedtoCount:{$size:"$subscribedto"},
            issubscribed:{$cond:{if: {$in:[req.user?._id,"$subscriber._id"]},then:true,else:false}}
        }
    },
    {
        $project:{
            fullname:1,
            username:1,
            avatar:1,
            coverimage:1,
            email:1,
            subscriberCount:1,
            subscribedtoCount:1,
            issubscribed:1,
        }
    }
   ])
   if(!channel?.length){
    throw new apierrror("channel not found",404)
   }
   return res.status(200).json(
    new apiresponse(200,"channel details fetched successfully",channel[0])
   )
})
const getwatchhistory=async_Handler(async(req,res)=>{
    const user=await User.aggregate([
        {$match:{_id:new mongoose.Types.ObjectId(req.user._id)}},
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "WatchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                    $addFields:{
                        owner:{$first:$owner}
                    }
                }
                ]
            }
        },

    ])
    return res.status(200).json(
        new apiresponse(200,"watch history fetched successfully",user[0].watchHistory)
    )
})
export {registerUser,
    loginUser,
    logoutuser,
    refreshAccessToken,
    changeCurrentPassword,
    getcurrentuser,
    updatedetails,
    updateAvatar,
    updatecoverImage,
    getchanneldetails,
    getwatchhistory
};
