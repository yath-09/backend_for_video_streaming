import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}))

app.use(express.json({limit:"16kb"})) 
app.use(express.urlencoded({extended:true,limit:"16kb" }))
app.use(express.static("public"))
app.use(cookieParser())  // this is very usefull as req can also access the cookie so that it can be helped in lplogout functionality


//routes import 
import userRouter from './routes/user.routes.js'



//routes decralaito

//impt point as routes an dcontroleers are diffrent places store

app.use("/api/v1/users",userRouter)
 // https//:localhost8000/api/v1/users/register




export {app}