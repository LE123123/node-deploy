const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { Post, User, Hashtag, Room, Chat } = require("../models");
const { v4: uuidv4 } = require("uuid");
const ColorHash = require("color-hash").default;

const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

try {
  fs.readdirSync("gifs");
} catch (err) {
  console.error("gifs 폴더가 없어 gifs 폴더를 생성합니다.");
  fs.mkdirSync("gifs");
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "gifs/");
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const customHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  console.log("hash", hash);
  return hash;
};
const colorHash = new ColorHash({ hash: customHash });

const router = express.Router();
const accessToken = null;

/*
                                템플릿 엔진에서 사용할
    user, followerCount, followingCount, followerIdList 변수를 res.locals로 설정
    이를 이렇게 설정한 이유는 모두 user, followerCount, followingCount, followerIdList 변수를 모든
    템플릿 엔진에서 공통으로 사용하기 때문입니다.
*/
router.use(async (req, res, next) => {
  // console.log("req check", req.session);
  const posts = await Post.findAll({
    include: {
      model: User,
      attributes: ["id", "nick"],
    },
    order: [["createdAt", "DESC"]],
  });

  res.locals.twits = posts;

  // console.log("req.session", req.session.id);
  // console.log("req.sessionID", req.sessionID);
  // req에 user가 있다면 이를 집어 넣는다.
  if (req.user) {
    /**
     * 1) res.locals.user에 유저 정보를 저장해 놓음
     * 2) res.locals.accessToken에 유저 accessToken을 저장해 놓음
     *  < 전역으로 저장해서 어디든 접근 가능하게끔 설정해 놓음 >
     */
    res.locals.user = req.user.user;
    res.locals.accessToken = req.user.accessToken;
    // console.log(
    //   "page router res.locals.user",
    //   JSON.stringify(res.locals.user, null, 2)
    // );

    /**
     * 현재 유저가 받은 좋아요의 개수를 모두 알아내고자 할 때에는
     * 그냥 유저의 post들을 다 찾아낸 다음에 post들에 좋아요를 단 사람들의 개수를 다 더하면 된다.
     */

    const currentUser = await User.findOne({
      where: {
        id: res.locals.user.id,
      },
    });

    const currentUserPost = await currentUser.getPosts();
    // console.log("currentUserPost", currentUserPost.length);

    let postLovedCount = 0;
    await Promise.all(
      currentUserPost.map(async (post) => {
        return (await post.getUserList()).length;
      })
    ).then((data) => {
      for (const countLove of data) {
        // console.log(countLove);
        postLovedCount += countLove;
      }
    });
    res.locals.postLovedCount = postLovedCount;

    await Promise.all(
      posts.map(async (post) => {
        return await post.getUserList();
      })
    )
      .then((data) => {
        /**
         * [[]] 이중 배열로 만들었음
         * 첫번째 배열에는 첫번쨰 post에 좋아요를 단 사람의 정보가 들어있음
         * .. 이하 생략
         */
        // console.log("LoveUserList", data);
        let check;
        const resultList = data.map((data_) => {
          /**
           * data_에는 포스트에 좋아요를 누른 유저들의 목록이 있음
           */
          check = null;
          for (data__ of data_) {
            if (data__.toJSON().id === res.locals.user.id) {
              check = true;
            }
          }
          return check;
        });
        res.locals.postLovedList = res.locals.user ? resultList : [];
        // console.log("res.locals.pstLovedList_2", res.locals.postLovedList);
      })
      .catch((err) => {
        console.error(err);
        next(err);
      });
  }

  res.locals.followerCount = res.locals.user ? res.locals.user.Followers.length : 0;
  // prettier-ignore
  res.locals.followingCount = res.locals.user ? res.locals.user.Followings.length : 0;
  // prettier-ignore
  res.locals.followerIdList = res.locals.user ? res.locals.user.Followings.map((f) => f.id) : [];

  // console.log("followerIdList", res.locals.followerIdList);

  next();
});

router.get("/profile", isLoggedIn, (req, res) => {
  console.log("Profile ROuter에서 session확인", req.session);
  console.log("Profile Router에서 session에 저장되어있는 id확인", req.session.id);
  res.render("profile", { title: "내 정보 - NodeBird" });
});

router.get("/join", isNotLoggedIn, (req, res) => {
  res.render("join", { title: "회원가입 - NodeBird" });
});

router.get("/", async (req, res, next) => {
  try {
    // 모든 포스트를 다 찾는다 => 찾아서 메인 페이지에 다 띄우기 위해 post와 user ( id와 nick만 )를 join시켜서 배열로 받아 넘긴다.

    // console.log("posts check >> ", JSON.stringify(res.locals.twits, null, 2));
    if (res.locals.user) {
      // console.log("postLovedList", res.locals.postLovedList);
    }

    res.render("main", {
      title: "NodeBird",
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/hashtag", async (req, res, next) => {
  const query = req.query.hashtag;
  console.log("query => ", req.body.hashtag);
  if (!query) {
    return res.redirect("/");
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }
    return res.render("main", {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(err);
    return next(error);
  }
  // res.send("asd");
});

router.get("/room", async (req, res, next) => {
  const rooms = await Room.findAll({
    sort: [["createdAt", "ASC"]],
  });
  // transRoom을 정의하였다
  // transRoom은 방의 owner를 HashFunction을 이용해서 userId와 결합해 바꾼 것이다.

  let AllUser = await User.findAll({});
  let idNickDictionary = {};
  AllUser.map((user) => {
    idNickDictionary = { ...idNickDictionary, [user.id]: user.nick };
  });

  // roomId와
  const transRoom = rooms.map((room) => {
    return {
      ...room.toJSON(),
      owner: colorHash.hex(idNickDictionary[room.UserId]),
      // TODO: nick알맞게 설정
      nick: idNickDictionary[room.toJSON().UserId],
    };
  });
  // console.log("transRoom", transRoom);
  return res.render("room", { transRoom });
});

router.get("/room/join", async (req, res, next) => {
  return res.render("roomjoin");
});

router.post("/room", async (req, res, next) => {
  try {
    const { title, max, password } = req.body;
    let newRoom = await Room.create({
      _id: uuidv4(),
      title,
      max,
      password,
      UserId: res.locals.user.id,
    });

    const newRoomOwner = await User.findOne({
      where: {
        id: newRoom.UserId,
      },
    });
    // 방을 만들면 room nsp에 newRoom 이벤트를 걸어주어야 한다
    // io객체를 받아오는 방법은 set('io', io)를 했던것을 바탕으로 get해온다.
    const io = req.app.get("io");
    newRoom = {
      ...newRoom.toJSON(),
      owner: colorHash.hex(newRoomOwner.nick),
      nick: res.locals.user.nick,
    };

    io.of("/room").emit("newRoom", newRoom);
    res.status(302).redirect("/room");
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// id에 해당하는 방에 입장
router.get("/room/:id", async (req, res, next) => {
  try {
    const room = await Room.findOne({
      where: {
        _id: req.params.id,
      },
    });
    // console.log("room", room);
    // 만약 방이 없다면
    if (!room) {
      return res.redirect("/?error=존재하지 않는 방입니다.");
    }

    // 만약 비밀번호가 틀렸다면 ( 비밀방이라는 조건이 만족되어야 함 )
    if (room.password && room.password !== req.query.password) {
      return res.redirect("/?error=방 비밀번호가 틀렸습니다.");
    }

    // chat 네임스페이스로 이제 가야한다.

    const io = req.app.get("io");

    // 해당 방에 해당되는 채팅내역들을 생성된 순으로 정렬한다.
    let chats = await Chat.findAll({
      where: {
        RoomId: room.id,
      },
      sort: [["createdAt", "ASC"]],
    });
    // console.log("chats", chats);
    // 우리는 사용자 id와 nick을 잇는 dictonary를 만들어야 한다
    let userIdNickDictionary = {};
    const allUsers = await User.findAll({});

    allUsers.map((user) => {
      userIdNickDictionary = { ...userIdNickDictionary, [user.id]: user.nick };
    });
    console.log(chats);
    let transformChat = [];

    chats.map((chat) => {
      // 채팅에 nick까지 넣어보자
      transformChat = [
        ...transformChat,
        {
          ...chat.dataValues,
          chatUserNick: userIdNickDictionary[chat.UserId],
          owner: colorHash.hex(userIdNickDictionary[chat.UserId].toString(10)),
        },
      ];
    });

    // 해당 방에 해당하는 채팅들을 다 가져온다.
    return res.render("chat", {
      room,
      chats: transformChat,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/room/:id/chat", async (req, res, next) => {
  try {
    const room = await Room.findOne({
      where: {
        _id: req.params.id,
      },
    });
    // 방의 id UUID -> id
    const { id } = room.toJSON();
    const chat = await Chat.create({
      chat: req.body.chat,
      UserId: res.locals.user.id,
      RoomId: id,
    });

    const chatUser = await User.findOne({
      where: {
        id: chat.UserId,
      },
    });

    const transChat = {
      ...chat.dataValues,
      OwnerStyle: colorHash.hex(chatUser.nick),
      Owner: chatUser.nick,
    };

    const io = req.app.get("io");
    console.log(chat.UserId);
    console.log(res.locals.user.id);
    io.of("/chat").to(req.params.id).emit("chat", transChat);
    res.status(200).send("ok");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/room/:id/gif", upload.single("gif"), async (req, res, next) => {
  const room = await Room.findOne({
    where: {
      _id: req.params.id,
    },
  });
  // 방의 id UUID -> id
  const { id } = room.toJSON();
  const chat = await Chat.create({
    gif: req.file.filename,
    UserId: res.locals.user.id,
    RoomId: id,
  });
  const io = req.app.get("io");
  io.of("/chat").to(req.params.id).emit("chat", chat);
  res.status(200).send("ok");
});

// 방과 채팅내역을 삭제해야 한다.
router.delete("/room/:id", async (req, res, next) => {
  try {
    const currentRoom = await Room.findOne({
      where: {
        _id: req.params.id,
      },
    });
    // currentRoom과 관련된 채팅 내역들을 싹다 삭제해야 한다.
    // TODO: chat이 user와도 관계되어있어서 아래와 같이 하면 삭제되지가 않는 issue 확인
    // await currentRoom.removeChats();
    await Chat.destroy({
      where: {
        RoomId: currentRoom.id,
      },
    });

    // 채팅 내역들을 삭제한 후에 동기적으로 방도 삭제해야 한다.
    await Room.destroy({
      where: {
        _id: req.params.id,
      },
    });

    res.status(200).send("ok");
    // 2초 후에 Client Side에 방을 없애는 요청을 보낸다.

    setTimeout(() => {
      const io = req.app.get("io");
      io.of("/room").emit("removeRoom", req.params.id);
    }, 2000);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
