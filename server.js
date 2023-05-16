const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const https = require("https");
const { type } = require("os");
const request = require("request");

const API_KEY = "AIzaSyBcB4AaEFGTrK0-dk26PFi95WMWdLoWqlM";
const API_URL = "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=";

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public")); //미들웨어
var db;
MongoClient.connect(
  "mongodb+srv://kimjeongyeon113:smart123@cluster0.vr7efrs.mongodb.net/?retryWrites=true&w=majority",
  { useUnifiedTopology: true },
  function (에러, client) {
    if (에러) return console.log(에러);

    db = client.db("Music");

    // db.collection("post").insertOne({ 이름: "JeongYeon", 나이: 24 }, function (에러, 결과) {
    //   console.log("db저장완료");
    // });
    app.listen(3000, function () {
      console.log("listening on 3000");
    });

    // db get part
    app.get("/list", function (요청, 응답) {
      db.collection("main")
        .find()
        .toArray(function (에러, 결과) {
          console.log("--------db 추출결과--------");
          console.log(결과);
          응답.render("list.ejs", { mains: 결과 });
        });
    });

    // db post part

    app.post("/add", function (요청, 응답) {
      console.log(요청.body);
      db.collection("counter").findOne({ name: "게시물 갯수" }, function (에러, 결과) {
        console.log("totalPost 결과 값");
        console.log(결과.totalPost);
        var totalPost = 결과.totalPost;

        // 유튜브 API이용하여 DB에 데이터 저장하기

        API_URL_FOR_DB = API_URL + 요청.body.videoId + "&key=" + API_KEY;
        console.log(API_URL_FOR_DB);
        request(API_URL_FOR_DB, function (에러, 응답, body) {
          console.log("##############  API  ##############");
          console.log(typeof body);
          const videoData = JSON.parse(body);
          var videoTitle = videoData.items[0].snippet.title;
          var videoThumbnail = videoData.items[0].snippet.thumbnails.standard.url;
          var videoViewCount = videoData.items[0].statistics.viewCount;
          var videoId = videoData.items[0].id;

          db.collection("main").insertOne(
            { _id: totalPost, title: videoTitle, videoId: videoId, thumbnail: videoThumbnail, viewCounts: videoViewCount },
            function (에러, 결과) {
              console.log("db저장완료");

              db.collection("counter").updateOne({ name: "게시물 갯수" }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
                if (에러) return console.log(에러);
              });
            }
          );
        });
      });

      응답.render("write.ejs");
    });
  }
);

app.get("/", function (요청, 응답) {
  응답.render("index.ejs");
});
app.get("/write", function (요청, 응답) {
  응답.render("write.ejs");
});
app.delete("/delete", function (요청, 응답) {
  요청.body._id = parseInt(요청.body._id);
  db.collection("main").deleteOne(요청.body, function (에러, 결과) {
    console.log("삭제완료");
    응답.status(200).send({ message: "성공했음." });
  });
  응답.send("삭제완료");
});
app.get("/detail/:postId", function (요청, 응답) {
  db.collection("main").findOne({ _id: parseInt(요청.params.postId) }, function (에러, 결과) {
    console.log(결과);
    응답.render("detail.ejs", { data: 결과 });
  });
});
