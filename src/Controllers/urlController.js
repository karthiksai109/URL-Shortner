const urlModel = require("../Models/urlModel");
const shortId = require("shortid");
const validator = require("validator");
const Base_Url = "http://localhost:3000/";
const redis = require("redis");

const { promisify } = require("util");

//1. Connect to the redis server
const redisClient = redis.createClient(
    10669,
  "redis-10669.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("3xDT5KJiF3JpqBKEbeIEE6luSo8TT681", function (err) {
  if (err) throw err;
});
redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//2. Prepare the functions for each command

const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)


//--------------------------------CreateUrl------------------------------------------------//

const regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(:[0-9]+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
const createUrl = async function (req, res) {
  try {
    let data = {};
    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "request body can't be empty plese provide some data 😩" });
    }

    if (Object.keys(req.body).length >1) {
      return res
        .status(400)
        .send({ status: false, message: "body should have only longUrl 😢" });
    }
    if(!(Object.keys(req.body).includes("longUrl"))){
      
      return res
        .status(400)
        .send({ status: false, message: "you have entered wrong  key 😩" });

    }
    if(typeof(req.body.longUrl)!="string" || req.body.longUrl.trim()==""){
      return res
        .status(400)
        .send({ status: false, message: `longUrl cant be empty or a wrong data type  🤦‍♂️ `});
    }
    let longUrl = req.body["longUrl"];

    if (!validator.isURL(longUrl.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "please enter validUrl" });
    }
    if (!regex.test(longUrl.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "please enter validUrl" });
    }

    let codeUrl = await GET_ASYNC(`${req.body.longUrl}`)
    if (codeUrl) {
      return res
        .status(200)
        .send({status:true, message: "ShortUrl already generated1", data:JSON.parse(codeUrl)  });
    }
    let verify = await urlModel.findOne({ longUrl: longUrl.trim() }).select({_id:0,urlCode:1,longUrl:1,shortUrl:1});
    if (verify) {
      await SET_ASYNC(`${req.body.longUrl}`,86400,JSON.stringify(verify))
      return res
        .status(200)
        .send({status:true, message: "ShortUrl already generated2", data:verify  });
    }

    let urlCode = shortId.generate(longUrl);

    let shortUrl = Base_Url + urlCode.toLowerCase();
    data["urlCode"] = urlCode.toLowerCase();
    data["longUrl"] = longUrl.trim();
    data["shortUrl"] = shortUrl;
    let createdUrl = await urlModel.create(data);
    await SET_ASYNC(`${req.body.longUrl}`,86400,JSON.stringify(data))
    res.status(201).send({ status:true,data: data });
  } catch (err) {
    res.status(500).send({ status: false, err: err.message });
  }
};

module.exports.createUrl = createUrl;
//----------------------------------------------END-------------------------------------------------



//---------------------------------------GetUrl----------------------------------------------
const getUrl = async function (req, res) {
  try {
    let urlCode = req.params["urlCode"];
    if (!shortId.isValid(urlCode.trim())) {
      return res
        .status(400)
        .send({ status: false, message: "plese enter valid url code" });
    }
   

    
    let cachedURL=await GET_ASYNC(`${req.params.urlCode}`)
    if(cachedURL){
       let cacheLongUrl=JSON.parse(cachedURL)
      return res.status(302).redirect(cacheLongUrl.longUrl);
    }
    let isUrl = await urlModel
      .findOne({ urlCode: urlCode })
      .select({ _id: 0, longUrl: 1 });
    if (!isUrl) {
      return res
        .status(404)
        .send({ status: false, message: "longUrl not found" });
    }
   
    let longUrl = isUrl.longUrl;
    await SET_ASYNC(`${req.params.urlCode}`,86400,JSON.stringify(isUrl))
    return res.status(302).redirect(longUrl);
    
  } catch (err) {
    return res.status(500).send({ status: false, err: err.message });
  }
};
module.exports.getUrl = getUrl;
//------------------------------END----------------------------------------------------------