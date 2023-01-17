const urlModel = require("../Models/urlModel");
const shortId = require("shortid");
const validator = require("validator");
const Base_Url = "http://localhost:3000/";
//--------------------------------CreateUrl------------------------------------------------//
const createUrl = async function (req, res) {
  try {
    let data = {};
    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "please enter longUrl" });
    }

    if (Object.keys(req.body).length >1) {
      return res
        .status(400)
        .send({ status: false, message: "body should have only longUrl" });
    }
    let longUrl = req.body["longUrl"];
    if (longUrl != undefined && longUrl.trim() == "") {
      return res
        .status(400)
        .send({ status: false, message: "url cannot be empty" });
    }

    if (!validator.isURL(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "please enter validUrl" });
    }

    let codeUrl = await urlModel.findOne({ longUrl: longUrl }).select({_id:0,urlCode:1,longUrl:1,shortUrl:1});
    if (codeUrl) {
      return res
        .status(200)
        .send({status:true, message: "ShortUrl already generated", data: codeUrl });
    }
    let urlCode = shortId.generate(longUrl);

    let shortUrl = Base_Url + urlCode.toLowerCase();
    data["urlCode"] = urlCode.toLowerCase();
    data["longUrl"] = longUrl;
    data["shortUrl"] = shortUrl;
    let createdUrl = await urlModel.create(data);
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

    let isUrl = await urlModel
      .findOne({ urlCode: urlCode })
      .select({ _id: 0, longUrl: 1 });
    if (!isUrl) {
      return res
        .status(404)
        .send({ status: false, message: "longUrl not found" });
    }
    let longUrl = isUrl.longUrl;
    return res.status(302).redirect(longUrl);
  } catch (err) {
    return res.status(500).send({ status: false, err: err.message });
  }
};
module.exports.getUrl = getUrl;
//------------------------------END----------------------------------------------------------