const express=require('express')
const {createUrl,getUrl}=require('../Controllers/urlController')
const router=express.Router()

router.post('/url/shorten',createUrl)
router.get('/:urlCode',getUrl)

router.all('/*',function(req,res){
    res.status(400).send({msg:"invalid Url request"})
})

module.exports=router