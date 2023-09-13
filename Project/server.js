const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const mime = require("mime");
const session = require("express-session");
const dotenv = require("dotenv");
const axios = require("axios");
const qs = require("qs");
// routes 폴더 내 파일 사용
const page = require("./routes/page");
const user = require("./routes/user");
const kakao = require("./routes/kakaoLogin");
const codeChat = require("./routes/codeChat");
const codeArena = require("./routes/codeArena");

// 네임스페이스로 io 서버 분리 /CodeChat, /CodeArena
const ChatNamespace = io.of("/CodeChat");
const ArenaNamespace = io.of("/CodeArena");

// .env 파일 사용
dotenv.config();

// 동적 페이지 사용
const nunjucks = require("nunjucks");
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

// 정적 폴더 사용
app.use(express.static("public"));

// post방식 -> body영역 사용등록
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session 사용
app.use(
  session({
    httpOnly: true, // http 통신일때 허용
    secret: process.env.SESSION_SECRET, // 암호화 키
    resave: false, // 요청이 들어왔을 때 세션에 수정사항이 없더라도 다시저장
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 세션값 쿠키 만료시간 24시간
      secure: false,
    },
  })
);


// CodeChat 네임스페이스 파일 경로 지정
app.use(
  "/CodeChat/public/CodeChat",
  express.static(path.join(__dirname, "public/CodeChat"), {
    setHeaders: (res, filePath) => {
      const mimeType = mime.getType(filePath);
      res.setHeader("Content-Type", mimeType);
    },
  })
);

// CodeArena 네임스페이스 파일 경로 지정
app.use(
  "/CodeArena/public/CodeArena",
  express.static(path.join(__dirname, "public/CodeArena"), {
    setHeaders: (res, filePath) => {
      const mimeType = mime.getType(filePath);
      res.setHeader("Content-Type", mimeType);
    },
  })
);

app.use("/page", page);
app.use("/user", user);
app.use(kakao);
app.use("/codeChat", codeChat);
app.use("/codeArena", codeArena);

// "Chat" namespace에 접속한 클라이언트 처리-----------------------------------------------------
ChatNamespace.on("connection", (socket) => {
  console.log("Chat 네임스페이스에 클라이언트가 연결되었습니다.");

  const usedRoomNumbers = new Set(); // 사용된 방 번호를 저장하는 Set
  const rooms = new Map(); // 방 정보를 저장할 Map
  // 함수 정의
  // 방 번호를 생성하는 함수
  const generateRoomNumber = () => {
    let room_number;
    do {
      room_number = Math.floor(Math.random() * 100) + 1; // 1부터 100 사이의 난수 생성
    } while (usedRoomNumbers.has(room_number)); // 중복되는 방 번호가 나오지 않도록 반복

    usedRoomNumbers.add(room_number); // 사용된 방 번호 Set에 추가
    return room_number;
  };

  // 방의 인원수를 세는 함수
  const countRoomUsers = (room_name) => {
    const room = ChatNamespace.adapter.rooms.get(room_name);
    return room ? room.size : 0;
  };

  // 함수 정의 끝

  // 방목록 code로 전달
  socket.emit("updateRoomList");

  socket.on(
    "create_room",
    ({ room_name, dev_lang, nickname, chatRoomMethod }) => {

      const roomInfo = {
        room_number: generateRoomNumber(),
        room_name: room_name,
        dev_lang: dev_lang,
        createdBy: nickname,
        chatRoomMethod: chatRoomMethod,
        userCount: countRoomUsers(room_name),
      };

      rooms.set(roomInfo.room_number, roomInfo);

      socket.on("check_admin", (nickname) => {
        let isAdmin = false;

        if (nickname.nickname == roomInfo.createdBy) {
          isAdmin = true;
          socket["isAdmin"] = true;
        } else {
          isAdmin = false;
        }
        socket.emit("admin_status", { isAdmin });
      });

      // 업데이트된 방 리스트 전체에 브로드캐스팅
      const updatedRoomList = Array.from(rooms.values());
      socket.emit("host_enterRoom", updatedRoomList);
    }
  );

  socket.on("newlist", () => {
    ChatNamespace.emit("updateRoomList2");
  });

  socket.on("userCount", (data) => {
    ChatNamespace.emit("countUpdate", data);
  });

  // chat 방 입장 enter_room 감지하기-------------------------------------------------
  socket.on(
    "enter_room",
    ({ room_name, nickname: nickname, room_number, room_host, conn_user }) => {
      socket["room_number"] = room_number; // 소캣 객체에 "room_number"이라는 속성 추가

      const roomInfo = rooms.get(room_number);
      if (roomInfo) {
        roomInfo.userCount = (roomInfo.userCount || 0) + 1;
        rooms.set(room_number, roomInfo);
      }


      if (countRoomUsers(room_number) >= 4) {
        // 들어가기 전에 방의 인원이 4명이면 입장 불가
        socket.emit("user_full");
      } else {
        socket.join(room_number); // 들어가기 전에 방의 인원이 3의 이하면 입장
        ChatNamespace.to(room_number).emit("welcome", { nickname });
      }

      socket["nickname"] = nickname;

      ChatNamespace.to(room_number).emit("user_count", {
        user_count: countRoomUsers(room_number),
      });
      ChatNamespace.to(room_number).emit("userConnectInfo", {
        data: conn_user,
        roomNum: room_number,
      });
    }
  );
  // enter_room 끝-------------------------------------------------------------

  socket.on("new_message", ({ currentNickname, message: message }) => {
    let roomNum = socket.room_number;
    socket.emit("my_message", { currentNickname, message: message });

    socket.broadcast
      .to(roomNum)
      .emit("other_message", { currentNickname, message: message });

    // 방 이름 정보를 가져와서 해결해야함
  });

  let disconn_arena_user;
  let room_number;
  let user_name;
  socket.on("leave_room", (currentNickname, user_data) => {
    room_number = socket.room_number;
    user_name = currentNickname.currentNickname;
    const roomInfo = rooms.get(room_number);
    const disconn_arena_user = user_data;

    socket.emit("leaveuser", {
      room_number: room_number,
      user_name: user_name,
    });

    if (room_number) {
      socket.leave(room_number); // 방에서 퇴장

      if (roomInfo) {
        roomInfo.userCount--; // 유저 인원수 감소
        if (roomInfo.userCount === 0) {
          rooms.delete(room_number); // 방 삭제
        }
        // 방 정보 갱신하여 방 리스트 업데이트
        const updatedRoomList = Array.from(rooms.values());
      }
      socket.room_number = null; // 방 이름 정보 초기화
    }
    currentNickname = socket.nickname; // 퇴장하는 사람의 닉네임

    if (roomInfo) {
      if (roomInfo.createdBy == currentNickname) {
        ChatNamespace.to(room_number).emit("get_out");
      }
    }

    ChatNamespace.to(room_number).emit("bye", { currentNickname });

    socket.on("leave_count", () => {
      ChatNamespace.to(room_number).emit("user_count", {
        user_count: countRoomUsers(room_number),
      });
    });

  });
  // leave_room 이벤트 끝

  socket.on("disconn_chat_user", ({ user_data }) => {
    disconn_arena_user = user_data;

    // room_number = socket.room_number;
    ChatNamespace.to(room_number).emit("leave_normal_user", {
      disconn_chat_user: user_data,
      room_number: room_number,
    });
  });

  socket.on("disconnecting", () => {
    const room_number = socket.room_number;
    socket.emit("leaveuser", {
      room_number: room_number,
      user_name: user_name,
    });
    if (room_number) {
      socket.leave(room_number); // 방에서 퇴장

      const roomInfo = rooms.get(room_number);
      if (roomInfo) {
        roomInfo.userCount--; // 유저 인원수 감소
        if (roomInfo.userCount === 0) {
          rooms.delete(room_number); // 방 삭제
        }
        // 방 정보 갱신하여 방 리스트 업데이트
        const updatedRoomList = Array.from(rooms.values());
        // ChatNamespace.emit("update_room_list", updatedRoomList);
      }
      socket.room_number = null; // 방 이름 정보 초기화
    }

    const currentNickname = socket.nickname;
    ChatNamespace.to(room_number).emit("bye", { currentNickname });

    socket.on("leave_count", () => {
      ChatNamespace.to(room_number).emit("user_count", {
        user_count: countRoomUsers(room_number),
      });
    });

  });

  // 코드 에디터 코드전송
  socket.on("codeSendBtn", (data) => {
    socket.to(data.socketId).emit("codeSend", data);
  });

  socket.on("sendClick", () => {
    let room_num = socket.room_number;
    ChatNamespace.to(socket.room_number).emit("socketUser", {
      roomNum: socket.room_number,
    });
  });

});

// -------------------------------------------------------- CodeArena 시작 ----------------------------------------------------------------------------------
// "Arena" namespace에 접속한 클라이언트 처리
ArenaNamespace.on("connection", (socket) => {
  console.log("Arena 네임스페이스에 클라이언트가 연결되었습니다.");

  const usedRoomNumbers = new Set(); // 사용된 방 번호를 저장하는 Set
  const rooms = new Map(); // 방 정보를 저장할 Map
  // 함수 정의
  // 방 번호를 생성하는 함수
  const generateRoomNumber = () => {
    let room_number;
    do {
      room_number = Math.floor(Math.random() * 100) + 1; // 1부터 100 사이의 난수 생성
    } while (usedRoomNumbers.has(room_number)); // 중복되는 방 번호가 나오지 않도록 반복

    usedRoomNumbers.add(room_number); // 사용된 방 번호 Set에 추가
    return room_number;
  };

  // 방의 인원수를 세는 함수
  const countRoomUsers = (room_name) => {
    const room = ArenaNamespace.adapter.rooms.get(room_name);
    return room ? room.size : 0;
  };

  // 함수 정의 끝

  // 방목록 arena로 전달
  socket.emit("updateRoomList");

  socket.on("create_room", ({ room_name, dev_lang, nickname }) => {
    const roomInfo = {
      room_number: generateRoomNumber(),
      room_name: room_name,
      dev_lang: dev_lang,
      createdBy: nickname,
      userCount: countRoomUsers(room_name),
    };

    rooms.set(roomInfo.room_number, roomInfo);
    
    socket.on("check_admin", (nickname) => {
      let isAdmin = false;

      if (nickname.nickname == roomInfo.createdBy) {
        isAdmin = true;
        socket["isAdmin"] = true;
      } else {
        isAdmin = false;
      }
      socket.emit("admin_status", { isAdmin });
    });

    // 업데이트된 방 리스트 전체에 브로드캐스팅
    const updatedRoomList = Array.from(rooms.values());
    // 방 생성 후 방장 입장
    socket.emit("host_enterRoom", updatedRoomList);
  });

  socket.on("newlist", () => {
    ArenaNamespace.emit("updateRoomList2");
  });

  socket.on("userCount", (data) => {
    ArenaNamespace.emit("countUpdate", data);
  });

  // Arena 방 입장 enter_room 감지하기
  socket.on(
    "enter_room",
    ({ room_name, nickname: nickname, room_number, room_host, conn_user }) => {
      socket["room_number"] = room_number; // 소캣 객체에 "room_number"이라는 속성 추가

      const roomInfo = rooms.get(room_number);

      if (roomInfo) {
        roomInfo.userCount = (roomInfo.userCount || 0) + 1;
        rooms.set(room_number, roomInfo);
      }

      if (countRoomUsers(room_number) >= 4) {
        // 들어가기 전에 방의 인원이 4명이면 입장 불가
        socket.emit("user_full");
      } 
      else {
        socket.join(room_number); // 들어가기 전에 방의 인원이 3의 이하면 입장
        ArenaNamespace.to(room_number).emit("welcome", { nickname });

        if (room_host != nickname) {
          ArenaNamespace.to(room_number).emit("enter_normal_user", {
            conn_user,
            room_host,
            room_number,
          });
          socket.emit("normal_user_ready");
        } else {
          ArenaNamespace.to(room_number).emit("enter_host_user", {
            conn_user,
            room_host,
            room_number,
          });
        }
      }

      socket["nickname"] = nickname;

      ArenaNamespace.to(room_number).emit("user_count", {
        user_count: countRoomUsers(room_number),
      });
    }
  );

  // 아레나
  socket.on("new_message", ({ currentNickname, message: message }) => {
    let roomNum = socket.room_number;
    socket.emit("my_message", { currentNickname, message: message });

    socket.broadcast
      .to(roomNum)
      .emit("other_message", { currentNickname, message: message });

    // 방 이름 정보를 가져와서 해결해야함
  });

  socket.on("click_start_btn", () => {
    let roomNum = socket.room_number;
    ArenaNamespace.to(roomNum).emit("remove_ok")
    socket.broadcast.to(roomNum).emit("start_timer");
    socket.emit('gameStart',roomNum)
  });

  socket.on("click_ready_btn", (data) => {
    let roomNum = socket.room_number;
    let nickName = data.nickName;
    socket.emit("my_ready", {
      roomNum: socket.room_number,
      nickName: nickName,
    });
  });

  socket.on('pleaesRoomNum',()=>{
    socket.emit('okRoomNum',{roomNum:socket.room_number})
  })

  socket.on('gameSet',()=>{
    ArenaNamespace.to(socket.room_number).emit('gameClear')
  })

  socket.on("update_ready", (data) => {
    let roomNum = data.ROOM_NUMBER;
    let nickName = data.CONN_USER;
    let isReady = data.USER_READY;
    ArenaNamespace.to(roomNum).emit("ready_on", {
      roomNum: roomNum,
      nickName: nickName,
      isReady: isReady,
    });
  });

  socket.on("ready_count_up", () => {
    let roomNum = socket.room_number;
    ArenaNamespace.to(roomNum).emit("ready_count");
  });

  socket.on("ready_count_down", () => {
    let roomNum = socket.room_number;
    ArenaNamespace.to(roomNum).emit("ready_count");
  });

  let disconn_arena_user;
  let room_number;
  let user_name;
  socket.on("leave_room", (currentNickname, user_data) => {
    room_number = socket.room_number;
    user_name = currentNickname.currentNickname;
    const roomInfo = rooms.get(room_number);
    const disconn_arena_user = user_data;

    socket.emit("leaveuser", {
      room_number: room_number,
      user_name: user_name,
      roomNum: room_number,
      nickName: user_name,
    });

    if (room_number) {
      socket.leave(room_number); // 방에서 퇴장

      if (roomInfo) {
        roomInfo.userCount--; // 유저 인원수 감소
        if (roomInfo.userCount === 0) {
          rooms.delete(room_number); // 방 삭제
        }
        // 방 정보 갱신하여 방 리스트 업데이트
        const updatedRoomList = Array.from(rooms.values());
      }
      socket.room_number = null; // 방 이름 정보 초기화
    }
    currentNickname = socket.nickname; // 퇴장하는 사람의 닉네임

    if (roomInfo) {
      if (roomInfo.createdBy == currentNickname) {
        ArenaNamespace.to(room_number).emit("get_out");
      }
    }

    ArenaNamespace.to(room_number).emit("bye", { currentNickname });

    socket.on("leave_count", () => {
      ArenaNamespace.to(room_number).emit("user_count", {
        user_count: countRoomUsers(room_number),
      });
    });

  });
  // leave_room 이벤트 끝

  socket.on("disconn_arena_user", ({ user_data }) => {
    disconn_arena_user = user_data;
    ArenaNamespace.to(room_number).emit("leave_normal_user", {
      disconn_arena_user: user_data,
      room_number: room_number,
    });
  });

  socket.on("disconnecting", () => {
    const room_number = socket.room_number;
    socket.emit("leaveuser", {
      room_number: room_number,
      user_name: user_name,
    });
    if (room_number) {
      socket.leave(room_number); // 방에서 퇴장

      const roomInfo = rooms.get(room_number);
      if (roomInfo) {
        roomInfo.userCount--; // 유저 인원수 감소
        if (roomInfo.userCount === 0) {
          rooms.delete(room_number); // 방 삭제
        }
        // 방 정보 갱신하여 방 리스트 업데이트
        const updatedRoomList = Array.from(rooms.values());
        // ArenaNamespace.emit("update_room_list", updatedRoomList);
      }
      socket.room_number = null; // 방 이름 정보 초기화
    }

    const currentNickname = socket.nickname;
    ArenaNamespace.to(room_number).emit("bye", { currentNickname });

    socket.on("leave_count", () => {
      ArenaNamespace.to(room_number).emit("user_count", {
        user_count: countRoomUsers(room_number),
      });
    });

  });
  socket.on('please',(name)=>{
    ArenaNamespace.to(socket.room_number).emit('testSucess', name)
  })

});


http.listen(3000, function () {
  console.log("Code Buddy server listening on port http://localhost:3000/page");
});
