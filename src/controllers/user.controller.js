import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" //c alling user dorm mongo
import {uploadOnCloudinary}  from "../utils/cloudinary.js"

import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshToken=async (userID)=>{
    try{
       const user =await User.findById(userID);
       //generating tokens
       const accessToken=user.generateAccessToken()
       const refereshToken=user.generateRefreshToken()
       // savinf g in databses
       user.refereshToken=refereshToken
       await user.save({validateBeforeSave:false})// beforing saving data into mongo we need to reguklate it 
       
       return {accessToken,refereshToken}

    }
    
    catch(error){
        throw new ApiError(500,"Somthing went wrong while generating tokens")
    }
}




// this the register for u a user
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


const loginUser=asyncHandler(async (req,res)=>{
      //  req->body
      // username or email
      // find the user
      //passwrod check
      // access and refresh token generate
      //sedn cookies
      // response to senf it suucessffuly

       
      const {email,username,password}=req.body;

      if(!username && !email){
        throw new ApiError(400,"Username or email not there")

      }

      const user= await User.findOne({
        $or:[username,email]
      })

      if(!user) throw new ApiError(404,"user not found")

      const isPasswordValid=await user.isPasswordCorrect(password)
      if(!isPasswordValid) throw new ApiError(401,"password incorrect")
      
      const {accessToken,refereshToken}=await generateAccessAndRefreshToken(user._id)
    
      const loggedInUser=User.findById(user._id).
      select("-password -refreshToken")

      //send ookies
      //security steps to ensure midfy only by server
      const options={
        httpOnly:true,
        secure:true
      }

      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refereshToken,options)
      .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refereshToken,
            
        },
         "User logged in succsfully"
        )
      )
})

const logoutUser=asyncHandler(async(req,res)=>{
    // cookies clear
    // removing access token form database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refereshToken:undefined} // updating 
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logout"))




    



})

export {registerUser,loginUser,logoutUser}