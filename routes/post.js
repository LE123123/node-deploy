const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const axios = require("axios");

const { Post, Hashtag, User } = require("../models");
const { isLoggedIn } = require("./middlewares");
const { sequelize } = require("../models/user");

const router = express.Router();

/**
 * uploads폴더를 만들고 만약에 없다면
 * 메세지를 출력해 주고 uploads폴더를 server-side에서 만들어 준다.
 */
try {
  fs.readdirSync("uploads");
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: "ap-northeast-2",
});

/**
 * multer는 파일 업로드를 위해 사용되는 multipart/form-data를 다루기 위한 node.js
 * 의 미들웨어 입니다. 하나 혹은 기 이상의 파일을 다루기 위한 모듈입니다.
 *
 * Multer는 파일을 받아서 request에 file혹인 files를 추가하여 넘겨줍니다.
 */

const upload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: "nodebird-v1",
    key(req, file, cb) {
      cb(null, `original/${Date.now()}${path.basename(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// const upload = multer({
//   /* 파일이 저장될 위치 dest or storage*/
//   storage: multer.diskStorage({
//     destination(req, file, cb) {
//       cb(null, "uploads/");
//     },
//     filename(req, file, cb) {
//       const ext = path.extname(file.originalname);
//       cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
//     },
//   }),
//   /* 업로드 된 데이터의 한도 */
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

/*
    업고드 제 옵ㄴ
    1. upload.single >> req.file객체에 한 개의 파일 업로드
    2. upload.array >> req.files객체에 한 개의 속성, 여러 개의 파일 업로드
    3. upload.none >> 파일 업로드 없이 텍스트 데이터만 multipart형식으로 전송했 을 경우
*/

/* 
    multer.single(fileName)은 fieldName으로 명시된 이름의 파일을 전달 받는다.
    이미지를 받아서 req.file에 저장하여 다음으로 넘겨주는 역할을 한다.
*/
/*
    POST /post/img 라우터에서는 이미지 하나를 업로드받은 뒤 이미지의 저장 경로를 클라이언트로 응답합니다.
    static 미들웨어가 /img경로의 정적 파일을 제공하므로 클라이언트에서 업로드한 이미지에 접근할 수 있습니다.
*/
router.post("/img", isLoggedIn, upload.single("img"), (req, res) => {
  console.log(req.file);
  const originalUrl = req.file.location;
  const url = originalUrl.replace(/\/original\//, "/thumb/");
  res.json({ url, originalUrl });
});

const upload2 = multer();
/**
 * 파일 업로드 없이 텍스트 데이터만 업로드 한 경우 none()함수를 사용해 준다.
 *
 * none을 사용했는데 name="img"를 하게되면 formData에 이미지 파일까지 들어가므로
 * 당연히 오류가 나게 된다.
 */
router.post("/", isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: res.locals.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]+/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) => {
          // findOrCreate 시퀄라이즈 메서드는 데이터베이스에서 해시태그가 존재하면
          // 가져오고, 존재하지 않으면 생성한 후
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          });
        })
      );
      console.log("result", result);
      await post.addHashtags(result.map((r) => r[0]));
    }
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

/**
 * 게시물 삭제
 * 삭제를 하려면 해야하는 것들
 * 1) 데이터베이스에서 한 라인을 삭제해야 한다.
 * 2) 해시태그도 삭제해야 하나..? -> 다른 것에 영향을 받을 수 있으므로 그대로 두기로 결정 TODO: 나중에 수정
 * 3)
 */
router.delete("/:postId/delete", async (req, res, next) => {
  try {
    await Post.destroy({ where: { id: req.params.postId } });
    res.status(200).send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/:postId/love", async (req, res, next) => {
  try {
    const currentUser = await User.findOne({
      where: {
        id: res.locals.user.id,
      },
    });
    /**
     * 현재 유저에 해당 postId에 해당하는 post에 좋아요를 표시하는 행동
     */
    await currentUser.addLovedPostList(req.params.postId);
    res.status(200).send("success adding love from post");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/:postId/deleteLove", async (req, res, next) => {
  try {
    /**
     * 삭제하는것은 어렵지 않다 그냥 관계되어있는 것을 destroy하면 되기 때문
     */
    // const currentUser = await User.findOne({
    //   where: {
    //     id: res.locals.user.id,
    //   },
    // });

    await sequelize.query(
      `delete from PostLoveUser where 
          userId = ${res.locals.user.id} AND 
          postID = ${req.params.postId}`
    );
    res.status(200).send("success delete love from post");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// router.get("/test", isLoggedIn, async (req, res, next) => {
//   try {
//     const user = await User.findOne({
//       where: { id: req.user.id },
//     });
//     console.log("user >> ", JSON.stringify(user, null, 2));
//     const posts = await user.getPosts();
//     console.log("posts >> ", JSON.stringify(posts, null, 2));
//     console.log("id", posts[0].id);

//     const post = await Post.findOne({
//       where: {
//         id: posts[0].id,
//       },
//     });

//     const hashtags = await post.getHashtags();
//     console.log("hashtags >> ", JSON.stringify(hashtags[0], null, 2));

//     hashtags.map((hashtag, index) => console.log(index, " -> ", hashtag.title));
//     res.redirect("/");
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

module.exports = router;
