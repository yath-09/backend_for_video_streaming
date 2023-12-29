import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" //c alling user dorm mongo
import {uploadOnCloudinary}  from "../utils/cloudinary.js"

import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser=asyncHandler(async(req,res)=>{
    // get user detials from frontend using postman
    // valdiation not empty 
    // check if user areayd exists"different methods to check
    // we are taking avatar an user imgae s
    //upload them to cloudinary to chec
    // create use obejct  -create entry in db
    // remove passwrod and refresh token from response
    //cheeck for user creation

    const {fullName,email,username,password}=req.body
    //console.log("email:",email);

    // good some point
    if(
        [fullName,email,username,password].some((field)=>
        field?.trim()==="")
    ){
         throw new ApiError(400,"All fields are required")
    }

    const existeduser= await User.findOne({
        $or:[{username},{email}] // to cehck already existed name ir email in db
    })

    if(existeduser){
        throw new ApiError(409,"user with email and username exited already")
    }

    //? is optinally chain
    const avatarLocalPath=req.files?.avatar[0]?.path
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    // trad approcahto check coever image as it is not complusory
    if(req.files && Array.isArray(req.files.coverImage) &&
     req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path

     }



    // to check if it ahs come
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
   
    }

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",// hello imp
        email,
        password,
        username:username.toLowerCase()

    })
     

    // wo daalte hai jo nhi chiaye jaise isme passwrod and referesh toke nahi chaiye bcoz passord in encrpyrre na d
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something wen twrong will user regitring")
    }

    // retunrig n the user
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered succesfully")
    )






})







export {registerUser}