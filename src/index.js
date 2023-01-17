const express=require('express')
const route=require('./routes/route')
const app=express()
const mongoose=require('mongoose')

app.use(express.json())
mongoose.set('strictQuery',true)
mongoose.connect('mongodb+srv://nishant55:1234@nishant99.et97kst.mongodb.net/group2Databases',{
    useNewUrlParser:true
})
.then(()=>console.log('MongoDb connected'))
.catch(err=>console.log(err))
app.use('/',route)
app.listen(process.env.PORT || 3000,function(){
    console.log(`connected to port ${process.env.PORT || 3000}`)
} )

