const axios = require("axios");
const cookieParser = require("cookie-parser");
const cookie = require("cookie-signature");

module.exports = (server, app, sessionMiddleware) => {
  const io = require("socket.io")(server, {
    path: "/socket.io",
  });

  app.set("io", io);
  /**
   * Socket.IO에 네임스페이스를 부여하는 메서드입니다
   * Socket.IO는 기본적으로 /네임스페이스에 접속하지만, of메서드를 사용한다면 다른 네임스페이스를 만들어
   * 접속할 수 있습니다. 같은 네임스페이스끼리만 데이터를 전달합니다.
   *
   * 1) 현재 채팅방 생성 및 삭제에 관한 정보를 전달하는 /room
   * 2) 채팅 메시지를 전달하는 /chat
   */
  const room = io.of("/room");
  const chat = io.of("/chat");

  /**
   * Societ.IO도 미들웨어를 사용할 수 있으므로 express-session을 여기에서 공유하면 된다.
   */

  room.on("connection", (socket) => {
    console.log("room 네임스페이스에 접속");
    console.log("currentRoom", socket.adapter.rooms);
    socket.on("disconnect", () => {
      console.log("room 네임스페이스 접속 해제");
    });
  });

  chat.use((socket, next) => {
    cookieParser(process.env.COOKIE_SECRET)(
      socket.request,
      socket.request.res,
      next
    );
  });

  chat.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next);
  });

  chat.on("connection", (socket) => {
    console.log("chat 네임스페이스에 접속");
    const req = socket.request;
    const {
      headers: { referer },
    } = req;
    const roomId = referer
      .split("/")
      [referer.split("/").length - 1].replace(/\?.+/, "");

    // console.log("chat socket.id의 값이 고유한지 확인", socket.id);
    // console.log("chat socket.session 확인", socket.request.session);
    // 채팅 네임스페이스에 들어오면 방 id에 해당하는 room에 참가한다.

    socket.join(roomId);
    // 방에 들어왔으면 다른 Client들에도 join을 broadcast해준다

    socket.to(roomId).emit("join", {
      chat: `${req.session.passport.user.id}님이 입장하셨습니다.`,
    });

    // prettier-ignore

    // 만약 방에 아무도 없다면 방을 삭제해 버린다.
    // socket.js에서 axios요청을 보낼 때는 요청자가 누구인지에 대한 정보가 들어있지 않습니다.
    // express-session에서는 세션 쿠키인 req.signedCookies['connect.sid']를 보고 현제 세션이 누구에게
    // 속해 있는지를 판단합니다.
    // 브라우저는 axios요청을 보낼 때는 자동으로 쿠키를 갘이 넣어서 보냅니다.
    // 하지만 서버는 쿠키를 같이 보내지 않기 때문에 express-session이 요청자가 누구인지 알 수 없게 된다.
    // 따라서 요청 헤더에 세션 쿠키를 직접 넣어야 한다.

    socket.on("disconnect", () => {
      console.log("chat 네임스페이스 접속 해제");
      socket.leave(roomId);
      // 다 나가고 방안에 0명이라면
      const currentRoom = chat.adapter.rooms.get(roomId);
      const userCount = currentRoom ? currentRoom.size : 0;
      if (userCount === 0) {
        const signedCookie = req.session.id
        const connectSID = cookie.sign(signedCookie, process.env.COOKIE_SECRET);
        axios.delete(`http://localhost:8001/room/${roomId}`, {
          headers: {
            Cookie: `connect.sid=s%3A${connectSID}`,
          },
        }).then(() => {
          console.log('방 제거 요청 성공');
        }).catch((error) => {
          console.error(error);
        })
      } else {
        socket.to(roomId).emit("exit", {
          chat: `${req.session.passport.user.id}님이 퇴장하셨습니다.`,
        })
      }
    });
  });
};
