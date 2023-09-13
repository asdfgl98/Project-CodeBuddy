

const getCurrentURL = () => {
  return window.location.href;
};
const getNamespaceFromURL = (url) => {
  if (url.includes("CodeArena")) {
    return "/CodeArena";
  }
};
// 2023.08.16 11:24
const currentURL = getCurrentURL();
const namespace = getNamespaceFromURL(currentURL);
const arenaSocket = io(namespace);
// const arenaSocket = io.of('/page/CodeArena');

// socket.io 사용
// 방의 이름을 입력받고 방에 입장할 수 있는 페이지 담당 js
const modal1 = document.getElementById("myModal5");
const $make_room_form = document.querySelector("#make_room_form"); // 방 정보 입력 폼
const $room_name = document.getElementById("room_name"); // 방 이름 입력 input
const $dev_lang = document.getElementById("dev_lang"); // 방의 언어 방식 select

const $chat = document.getElementById("chat"); // 전체 div 채팅창 선택
const $chat_1 = $chat.querySelector(".chat_1"); // 접근 1
const $chat_main = $chat_1.querySelector(".chat_main"); // 접근 2
const $c_roomname = $chat_main.querySelector(".c_roomname"); // 방 이름으로 접근
const $c_roomname_1 = $c_roomname.querySelector(".c_roomname_1"); // 방 이름을 접근 2
const $c_content_name = $c_roomname_1.querySelector(".c_content_name"); // 방 이름을 접근 3
const $c_c_name = $c_content_name.querySelector(".c_c_name"); // 방 이름을 적는 곳
const $mini_room_name = document.getElementById("mini_room_name"); // 미니 방 이름 적는 곳
const $c_content_num = $c_content_name.querySelector(".c_content_num"); // 방 인원수 적는 곳
const $mini_room_users = document.getElementById("$mini_room_users"); // 미니 방 인원수 적는 곳
const $c_a_u_r_name2 = document.querySelector(".c_a_u_r_name2");

const openarena = () => {
  let page = document.getElementById("code_arena_zip");
  page.style.display = "block";

  let page2 = document.getElementById("notice");
  page2.style.display = "none";

  let chat = document.getElementById("chat_open");
  chat.style.display = "block";

  let header = document.getElementById("head");
  header.style.display = "none";
};

let currentNickname;
// 방 생성 함수
const handleRoomSubmit = (event) => {
  event.preventDefault();
  const room_name = $room_name.value;
  const dev_lang = $dev_lang.value;
  // 지훈 코드 삽입 (방생성)
  axios.get("/codeArena/createRoom", { room: "hi" }).then((res) => {
    currentNickname = res.data; // 방 생성자의 닉네임
    arenaSocket.emit("create_room", {
      room_name: room_name,
      dev_lang: dev_lang,
      nickname: res.data, // 방 생성자 이름
    });

    arenaSocket.emit("check_admin", { nickname: res.data });

    closeModal(); // 모달 닫고
    // openarena(); // 방 입장
    // arenaSocket.emit("welcome", { nickname: res.data });
    $room_name.value = ""; // 방 입력칸 초기화
  });

  $c_c_name.textContent = room_name; // 채팅방 펼쳤을 때 방제
  $mini_room_name.textContent = room_name; // 채팅방 접었을 때 방제
  $c_a_u_r_name2.textContent = room_name; // Arena 제한 시간 위 방제
};

// 방 생성시 방장 권한 부여
arenaSocket.on("admin_status", ({ isAdmin }) => {
  if (isAdmin) {
    arenaSocket["isAdmin"] = isAdmin;
    buttonDiv.style.display = "block";
    $startBtn.style.display = "block";
  }
});

// 방목록 최신화 ------------------지훈---------------------

let roomName = "";
let roomNum;
let roomLinks;
let clickEventHandler = null;

const handleClick = (e) => {
  const target = e.target;
  if (target.classList.contains("room-link")) {
    let roomNumber = target.getAttribute("data-roomnumber");
    roomNumber = parseInt(roomNumber);
    const roomName = target.getAttribute("data-roomname");
    const roomHost = target.getAttribute("data-roomhost");
    axios.post("/codeArena/userFull", {roomNumber})
      .then(res => {
        let data = JSON.parse(res.data)
        if (data.USER_COUNT >= 4){
          alert("방의 인원수가 초과되었습니다.")
        }
        else {
          enterRoom(roomName, roomNumber, roomHost);
        }
      })
  }
};
//최신화 함수

const updateArenaRoom = (roomList) => {
  const $board_list = document.getElementById("board-list");
  const $board_table = $board_list.querySelector(".board-table");
  const $tbody = $board_table.querySelector("tbody");
  const $tr = document.querySelectorAll("tr");
  // $tr.remove();

  if (clickEventHandler) {
    $tbody.removeEventListener("click", clickEventHandler);
  }

  roomList.forEach((roomInfo) => {
    const newRow = document.createElement("tr");
    newRow.id = "room_" + roomInfo.ROOM_NUMBER;
    // 방 정보를 td에 추가
    newRow.innerHTML = `
            <td id="room-Num">${roomInfo.ROOM_NUMBER}</td>
            <td class="item ${roomInfo.ROOM_LANG}">${roomInfo.ROOM_LANG}</td>
            <th>
              <a id='123' class="room-link room-${roomInfo.ROOM_NUMBER}" data-roomnumber="${roomInfo.ROOM_NUMBER}" data-roomname="${roomInfo.ROOM_NAME}" data-roomhost="${roomInfo.ROOM_HOST}">${roomInfo.ROOM_NAME} ( ${roomInfo.USER_COUNT} / 4 )</a>
              <p>테스트</p>
             </th>
            <td>${roomInfo.ROOM_HOST}</td>
      `;
    // 새로운 행을 테이블의 맨 위에 추가
    $tbody.prepend(newRow);

    // axios.get("/room/createRoom", { room: "hi" }).then((res) => {
    //   currentNickname = res.data;
    // });

    clickEventHandler = handleClick;
    $tbody.addEventListener("click", clickEventHandler);

    $c_content_num.textContent = `${roomInfo.USER_COUNT}/4`; // 채팅방 펼쳤을 때 인원 수
    $mini_room_users.textContent = `${roomInfo.USER_COUNT}/4`; // 채팅방 접었을 때 인원 수
  });
};


// 사용자 접속시 채팅방 리스트 최신화
arenaSocket.on("updateRoomList", () => {
  const $board_list = document.getElementById("board-list");
  const $board_table = $board_list.querySelector(".board-table");
  const $tbody = $board_table.querySelector("tbody");
  const $trs = $tbody.querySelectorAll("tr");
  axios.get("/codeArena/arenaList", { re: "hi" }).then((res) => {
    let roomList = JSON.parse(res.data);
    $trs.forEach(($tr) => {
      $tr.remove();
    });
    updateArenaRoom(roomList);
  });
});

// 방 생성시 채팅방 리스트 최신화(기존의 테이블 tr 모두 삭제 후 최신화)
arenaSocket.on("updateRoomList2", () => {
  const $board_list = document.getElementById("board-list");
  const $board_table = $board_list.querySelector(".board-table");
  const $tbody = $board_table.querySelector("tbody");
  const $trs = $tbody.querySelectorAll("tr");
  axios.get("/codeArena/arenaList", { re: "hi" }).then((res) => {
    let roomList = JSON.parse(res.data);
    $trs.forEach(($tr) => {
      $tr.remove();
    });
    updateArenaRoom(roomList);
  });
});

// 인원수 실시간 업데이트
arenaSocket.on("countUpdate", (data) => {
  const $board_list = document.getElementById("board-list");
  const $board_table = $board_list.querySelector(".board-table");
  const $tbody = $board_table.querySelector("tbody");
  const $trs = $tbody.querySelectorAll("tr");
  $trs.forEach(($tr) => {
    $tr.remove();
  });
  updateArenaRoom(data.data);
});

//방장이 방 생성시 database에 방 정보 입력 및 방 입장 처리
arenaSocket.on("host_enterRoom", (data) => {
  let nickName = data[0].createdBy;
  let roomName = data[0].room_name;
  let roomNum = data[0].room_number;
  const addRoomToTable = (updateRooms) => {
    axios.post("/codeArena/updateroom", { updateRooms }).then((res) => {
      let roomInfo = JSON.parse(res.data);
    });
  };
  addRoomToTable(data);
  enterRoom(roomName, roomNum, nickName);
});

// --------------------지훈 끝--------------------------------
//
$make_room_form.addEventListener("submit", handleRoomSubmit);

arenaSocket.on("update_room_list", (roomInfo) => {
  addRoomToTable(roomInfo);
});

// //방 목록 database에 새로운 방 추가하는 함수
const addRoomToTable = (updateRooms) => {
  axios.post("/codeArena/updateroom", { updateRooms }).then((res) => {
    let roomInfo = JSON.parse(res.data);
    arenaSocket.emit("newlist");
  });
};

let conn_user_data;
const enterRoom = (roomName, roomNum, roomHost) => {
  
  //유저접속
  axios.post("/codeArena/connectUser", { roomNum }).then((res) => {
    conn_user_data = JSON.parse(res.data);
  });

  let userCount;
  arenaSocket.on("user_count", ({ user_count }) => {
    userCount = user_count
    $c_content_num.textContent = `${user_count}/4`;
    $mini_room_users.textContent = `${user_count}/4`;
  });
  openarena(); // 방 입장

  arenaSocket["roomNum"] = roomNum;

  axios.post("/codeArena/enterRoom", { roomNum }).then((res) => {
    let data = JSON.parse(res.data);
    currentNickname = data.name;
    arenaSocket.emit("enter_room", {
      room_name: roomName,
      nickname: data.name,
      room_number: roomNum,
      room_host: roomHost,
      conn_user: conn_user_data,
    });
    arenaSocket.emit("userCount", { data: data.result });
  });

  $c_c_name.textContent = roomName; // 채팅방 펼쳤을 때 방제
  $mini_room_name.textContent = roomName; // 채팅방 접었을 때 방제
  $c_a_u_r_name2.textContent = roomName; // Arena 제한 시간 위 방제


  
};

// Code Arena  -------설아---------

// 타이머 기능 구현 추가
const Timer = document.getElementById("timer"); //스코어 기록창-분
const Timer_zip = document.getElementById("c_a_above1"); //스코어 기록창-분
const buttonDiv = document.getElementById("c_a_center_button");
const $startBtn = document.getElementById("startBtn");
const $readyBtn = document.getElementById("readyBtn");
const question_div = document.getElementById("c_a_left");
const question_div2 = document.getElementById("c_a_right");
let time = 600000;
let min = 10;
let sec = 60;
let PLYATIME;
Timer.value = min + ":" + "00";
const TIMER = () => {
  PLYATIME = setInterval(() => {
    time = time - 1000; //1초씩 줄어듦
    min = time / (60 * 1000); //초를 분으로 나눠준다.
    if (sec > 0) {
      //sec=60 에서 1씩 빼서 출력해준다.
      sec = sec - 1;
      // sec이 10보다 작을 때 '0'을 붙여서 2자리 형식으로 만들어줍니다.
      Timer.value = Math.floor(min) + ":" + (sec < 10 ? "0" : "") + sec;
      // sec이 10보다 작고 0보다 크거나 같을 때, 즉 10초가 남았을 때 CSS 변경
      if (Math.floor(min) === 0) {
        if (sec < 11 && sec >= 0) {
          // 여기에 원하는 CSS 변경 코드를 추가합니다.
          Timer_zip.style.boxShadow = "1px 0px 12px 8px red";
          Timer_zip.style.animation = "blink 1s infinite";
          if (sec == 0) {
            clearInterval(PLYATIME);
          }
        } else {
          // 원하는 CSS 초기 상태를 설정합니다.
          Timer_zip.style.boxShadow = "1px 0px 12px 8px white";
          Timer_zip.style.animation = "none";
        }
      }
    }
    if (sec === 0) {
      // 0에서 -1을 하면 -59가 출력된다.
      // 그래서 0이 되면 바로 sec을 60으로 돌려주고 value에는 0을 출력하도록 해준다.
      sec = 60;
      Timer.value = Math.floor(min) + ":" + "00";
    }
  }, 1000); //1초마다
};

arenaSocket.on("start_timer", () => {
  $startBtn.style.display = "none";
  $readyBtn.style.display = "none";
  buttonDiv.style.display = "none";
  TIMER();
  question_div.style.display = "block";
  question_div2.style.display = "block";

  //code editor 기본 값 입력
  js.setValue(`function codeBuddy(n){
    let result;
    result = 정답을입력하세요;
    return result;
}`);
});

// 일반 사용자 준비 완료 / 취소 기능

// 레디 버튼을 눌렀을 때 실행되는 함수
const ready = () => {
  arenaSocket.emit("click_ready_btn", { nickName: currentNickname });
};
// 클릭 이벤트 리스너 등록
$readyBtn.addEventListener("click", ready);

arenaSocket.on("my_ready", (data) => {
  axios.post("/codeArena/codeReady", { data }).then((res) => {
    let data = JSON.parse(res.data);
    arenaSocket.emit("update_ready", data[0]);
  });
});

// 준비 / 준비 취소 기능
arenaSocket.on("ready_on", (data) => {
  let $normal_user = document.querySelectorAll(".normal_user"); // 들어온 일반유저 닉네임 태그 전부 가져오기
  let click_nickname = data.nickName; // 클릭한 사용자의 닉네임
  let roomNum = data.roomNum; // 클릭한 사용자가 속해있는 방 번호
  let isReady = data.isReady;

  $normal_user.forEach((user_nick) => {
    // user_nick : 각 일반유저의 닉네임
    let foreach_nickname = user_nick.dataset.user;

    if (isReady == "Y") {
      // 준비X => 준비
      if (click_nickname == foreach_nickname) {
        // 클릭한 사용자만 활성화 하기위해
        let ready_on = document.querySelector(`.${foreach_nickname}`);
        ready_on.style.display = "block"; // 준비 표시 활성화
        arenaSocket.emit("ready_count_up"); // 현재 준비한 인원수+ 체크
      }
    } else {
      // 준비 => 준비X
      if (click_nickname == foreach_nickname) {
        // 클릭한 사용자만 활성화 하기위해
        let ready_on = document.querySelector(`.${foreach_nickname}`);
        ready_on.style.display = "none"; // 준비 표시 비활성화
        // 여기에다가 DB USER_READY를 N로 변경
        arenaSocket.emit("ready_count_down"); // 현재 준비한 인원수- 체크
      }
    }
  });
});

let ready_count;
let currentUsers;

arenaSocket.on("user_count", (user_count) => {
  currentUsers = user_count.user_count;
});

arenaSocket.on("ready_count", () => {
  axios
    .post("/codeArena/readyCount", { roomNum: arenaSocket.roomNum })
    .then((res) => {
      let arenaUsers = JSON.parse(res.data);
      ready_count = arenaUsers[0].COUNT;
    });
});

// 방장이 start 버튼을 눌렀을 때
$startBtn.addEventListener("click", () => {
  
  if (arenaSocket.isAdmin) {
    currentUsers = parseInt(currentUsers);
    ready_count = parseInt(ready_count);
    if (currentUsers - 1 == ready_count) {
      arenaSocket.emit("click_start_btn");

      $startBtn.style.display = "none";
      buttonDiv.style.display = "none";
      TIMER();
      question_div.style.display = "block";
      question_div2.style.display = "block";
    }
    else { // 시작 조건 미충족일 때 클릭 시 start 빨간색 => 하얀색
      $startBtn.classList.add("clicked"); // clicked 클래스 추가
      setTimeout(() => {
        $startBtn.classList.remove("clicked")
      }, 500)
    }
  }
  //code editor 기본 값 입력
  js.setValue(`function codeBuddy(n){
      let result;
      result = 정답을입력하세요;
      return result;
  }`);
});

//방장이 Game 시작시 모든유저 ready Y -> N 변경
arenaSocket.on('gameStart',(roomNum)=>{
  axios.post('/codeArena/gameStart', {roomNum})
})

// 방장이 Game 시작시 모든유저 ready 표시 해제
arenaSocket.on("remove_ok", () => {
  let green_ok = document.querySelectorAll(".u_r_circle")
  green_ok.forEach((ok) => {
    ok.style.display = "none"
  })
})

const $leave_room = document.getElementById("leave_room");

const leaveRoomBtn = () => {
  let page = document.getElementById("code_arena_zip");
  page.style.display = "none";

  let page2 = document.getElementById("notice");
  page2.style.display = "block";

  let chat = document.getElementById("chat_open");
  chat.style.display = "none";
  let header = document.getElementById("head");
  header.style.display = "block";

  $startBtn.style.display = "none";
  $readyBtn.style.display = "none";

  ready_count = 0;

  clearInterval(PLYATIME); // 기존의 타이머 인터벌 초기화

  // 10분으로 제한시간 설정
  time = 600000;
  min = 10;
  sec = 60;
  Timer.value = min + ":" + "00";

  arenaSocket.emit("leave_room", { currentNickname });
  arenaSocket.emit("leave_count");

  question_div.style.display = "none";
  question_div2.style.display = "none";
};

let disconn_user_data;
arenaSocket.on("leaveuser", (data) => {

  axios.post("/codeArena/updateReady", { data });
  //유저 나감
  axios.post("/codeArena/disconnectUser", { data }).then((res) => {
    disconn_user_data = JSON.parse(res.data);
    arenaSocket.emit("disconn_arena_user", { user_data: disconn_user_data });
  });

  axios.post("/codeArena/leave", { data }).then((res) => {
    let data = JSON.parse(res.data);
    arenaSocket.emit("userCount", { data: data.result });
    location.reload();
  });
});

$leave_room.addEventListener("click", leaveRoomBtn);

// 인원 수 초과 됐을 때
arenaSocket.on("user_full", () => {
  alert("방 인원 초과");
});

window.addEventListener("beforeunload", () => {
  arenaSocket.emit("leave_count");
  arenaSocket.emit("leave_room", { currentNickname });
});


// -------------------------리스트 페이지 끝 -----------CodeArena 페이지 시작---------------------------------------------------------------------
const $c_main_content = $chat_main.querySelector(".c_main_content"); // 채팅 내용이 들어갈 곳
const $c_chatting = $chat_main.querySelector(".c_chatting"); // 채팅작성 및 전송
const $c_chatting_form = $c_chatting.querySelector(".c_chatting_form"); // 채팅 작성 form
const $form_input = $c_chatting_form.querySelector("#form_input"); // 채팅 작성 form의 input
const $c_chatting_2 = $c_chatting_form.querySelector(".c_chatting_2");
const $c_chatting_2_btn = $c_chatting_2.querySelector(".c_chatting_2_btn");

// 공지
const addNotice = (message) => {
  const $div = document.createElement("div");
  $div.id = 'notice'
  $div.textContent = message;
  $c_main_content.appendChild($div);
  scrollToBottom()
};

const handleMessageSubmit = (event) => {
  event.preventDefault();
  const message = $form_input.value; // 메시지 입력값 가져오기

  // 메세지의 공백이나 줄바꿈을 빈 문자열로 바꿔서 빈문자열만 있으면 보내지않기
  let checkMessage = message.replace(/\s| /gi, '');

  // 메세지 공백 아닐 때 메세지 보내기
  if(checkMessage !== ""){
    arenaSocket.emit("new_message", { currentNickname, message: message });
  }

  $form_input.value = ""; // 입력 창 초기화
  scrollToBottom()
};
// ---------------함수 정의 끝------------------

arenaSocket.on("connect", () => {
  console.log("프론트와 서버와의 연결 성공");
});

function scrollToBottom() {
  $c_main_content.scrollTop = $c_main_content.scrollHeight;
}

arenaSocket.on("my_message", ({ currentNickname, message }) => {
  const $div = document.createElement("div");
  const $Div = document.createElement('div')
  $Div.id ='my_M'
  $div.id = "my_message"
  $div.textContent = `${message}`;
  $Div.appendChild($div);
  $c_main_content.appendChild($Div);
  scrollToBottom()
});

arenaSocket.on("other_message", ({ currentNickname, message }) => {
  const $div = document.createElement("div");
  $div.id = "other_message"
  $div.textContent = `${currentNickname} : ${message}`;
  $c_main_content.appendChild($div);
  scrollToBottom()
});


arenaSocket.on("welcome", ({ nickname }) => {
  addNotice(`${nickname}(이)가 방에 입장했습니다.`);
});

arenaSocket.on("enter_host_user", ({ conn_user, room_host, room_number }) => {
  const $c_a_p_user = document.querySelector(".c_a_p_user");
  const $divs = $c_a_p_user.querySelectorAll("div");
  $divs.forEach(($div) => {
    $div.remove();
  });
  // userList는 전체 유저가 입장한 방번호와 닉네임을 객체로 배열에 넣은 것
  // room_number는 입장하는 방의 번호
  // room_host는 입장하는 방을 만든 이
  updateArenaNickname(conn_user, room_host, room_number);
});

arenaSocket.on("enter_normal_user", ({ conn_user, room_host, room_number }) => {
  const $c_a_p_user = document.querySelector(".c_a_p_user");
  const $divs = $c_a_p_user.querySelectorAll("div");
  // $readyBtn.style.display = "block";
  // $startBtn.style.display = "none";
  $divs.forEach(($div) => {
    $div.remove();
  });
  updateArenaNickname(conn_user, room_host, room_number);
});

arenaSocket.on("normal_user_ready", () => {
  buttonDiv.style.display = "block";
  $readyBtn.style.display = "block";
  $startBtn.style.display = "none";
});

arenaSocket.on("leave_normal_user", ({ disconn_arena_user, room_number }) => {
  $("div").remove(".c_a_p_u2");
  updateArenaNickname2(disconn_arena_user, room_number);
});

arenaSocket.on("get_out", () => {
  leaveRoomBtn();
});

const updateArenaNickname = (conn_user, room_host, room_number) => {
  const $c_a_p_user = document.querySelector(".c_a_p_user");
  conn_user.forEach((userInfo) => {
    const newUser = document.createElement("div");
    if (userInfo.ROOM_NUMBER == room_number) {
      if (room_host == userInfo.CONN_USER) {
        // 들어오는 사람이 방을 만든 사람의 닉네임과 같다면? = 방장일 때
        newUser.className = `c_a_p_u1`;
        newUser.innerHTML += `
        <div class="u_info">
        <div class="u_i_img">방장</div>
        <div class="u_i_nick" data-user="${userInfo.CONN_USER}">${userInfo.CONN_USER}</div>
        </div>
        <div class="u_remain">
        <div div class="u_r_ques">
        <div class="u_r_circle ${userInfo.CONN_USER}" style="display:none;">ok</div>
        </div>
        </div>
        `;
        $c_a_p_user.append(newUser);
      } else {
        if (userInfo.USER_READY == "N") {
          // 준비 안했을 때
          // 들어오는 사람이 방을 만든 사람의 닉네임과 같다면? = 일반일 때
          newUser.className = `c_a_p_u2`;
          newUser.innerHTML += `
          <div class="u_info">
          <div class="u_i_img">일반</div>
          <div class="u_i_nick normal_user" data-user="${userInfo.CONN_USER}">${userInfo.CONN_USER}</div>
          </div>
          <div class="u_remain">
          <div div class="u_r_ques">
          <div class="u_r_circle ${userInfo.CONN_USER}" style="display:none;">READY</div>
          </div>
          </div>
          `;
          $c_a_p_user.append(newUser);
        } else {
          // 기존에 준비했던 사람
          // 들어오는 사람이 방을 만든 사람의 닉네임과 같다면? = 일반일 때
          newUser.className = `c_a_p_u2`;
          newUser.innerHTML += `
          <div class="u_info">
          <div class="u_i_img">일반</div>
          <div class="u_i_nick normal_user" data-user="${userInfo.CONN_USER}">${userInfo.CONN_USER}</div>
          </div>
          <div class="u_remain">
          <div div class="u_r_ques">
          <div class="u_r_circle ${userInfo.CONN_USER}" style="display:block;">READY</div>
          </div>
          </div>
          `;
          $c_a_p_user.append(newUser);
        }
      }
    }
  });
};

const updateArenaNickname2 = (conn_user, room_number) => {
  const $c_a_p_user = document.querySelector(".c_a_p_user");

  let cnt = 1;
  conn_user.forEach((userInfo) => {
    const newUser = document.createElement("div");
    if (userInfo.ROOM_NUMBER == room_number) {
      if (cnt != 1) {
        if (userInfo.USER_READY == "N") {
          // 들어오는 사람이 방을 만든 사람의 닉네임과 같다면? = 일반일 때
          newUser.className = `c_a_p_u2`;
          newUser.innerHTML += `
            <div class="u_info">
            <div class="u_i_img">일반</div>
            <div class="u_i_nick normal_user" data-user="${userInfo.CONN_USER}">${userInfo.CONN_USER}</div>
            </div>
            <div class="u_remain">
            <div div class="u_r_ques">
            <div class="u_r_circle ${userInfo.CONN_USER}" style="display:none;">ok</div>
            </div>
            </div>
            `;
          $c_a_p_user.append(newUser);
        } else {
          // 들어오는 사람이 방을 만든 사람의 닉네임과 같다면? = 일반일 때
          newUser.className = `c_a_p_u2`;
          newUser.innerHTML += `
            <div class="u_info">
            <div class="u_i_img">일반</div>
            <div class="u_i_nick normal_user" data-user="${userInfo.CONN_USER}">${userInfo.CONN_USER}</div>
            </div>
            <div class="u_remain">
            <div div class="u_r_ques">
            <div class="u_r_circle ${userInfo.CONN_USER}" style="display:block;">READY</div>
            </div>
            </div>
            `;
          $c_a_p_user.append(newUser);
        }
      } else {
        cnt++;
      }
    }
  });
};

arenaSocket.on("bye", ({ currentNickname }) => {
  addNotice(`${currentNickname}(이)가 방에서 나갔습니다.`);
});

// 채팅 전송 클릭 or 엔터
$c_chatting_2_btn.addEventListener("click", handleMessageSubmit);
const enterChat = (e)=>{
  if(e.keyCode == 13){
    $c_chatting_2_btn.click()
  }
}

// CodeArena CodeEditor 생성
const textjs = document.querySelector('#js')
const outPut = document.querySelector('#live')

    let js = CodeMirror.fromTextArea(textjs, {
      mode: "text/javascript",
      theme: "darcula",
      lineNumbers: true,
      spellcheck: true,
      extraKeys: { "Ctrl-Space": "autocomplete" }
    })

    // 코드 실행 버튼
    const codeStart = document.getElementById('codeStart')
    // 코드 제출 버튼
    const codeSubmit = document.getElementById('codeSubmit')
    let jsValue    

    // 입력한 코드 문자열로 가져와서 jsValue 변수에 담기
    function executeJavaScript() {      
      jsValue = js.getValue().replace(/\n/g,'')
    }

    // code editor에 입력할때마다 입력값 변수에 담는 함수 실행
    CodeMirror.on(js, 'change', executeJavaScript);

    // 코드실행 버튼 클릭 이벤트
    codeStart.addEventListener('click', async(e)=>{
      e.preventDefault()
       // codeStart 요청을 보내서 문제번호와 일치하는 입력값과 출력값 database에서 반환
       const res = await axios.post('/codeArena/codeStart', {jsValue})
       .then(res=>{
         let data = JSON.parse(res.data)
         //입력값
         let resultInput = data[0].RESULT_INPUT
         //출력값
         let resultOutput = data[0].RESULT_OUTPUT   

         // script 태그 생성
         const scriptElement = document.createElement("script");
         // 생성한 script 태그안에 사용자가 입력한 값 추가
         scriptElement.innerHTML = `var n = ${resultInput};
                                    var outPut = ${resultOutput};
                                    ${jsValue};
                                    try{
                                     console.log('코드실행중');
                                       if(typeof codeBuddy !== 'undefined'){
                                          if(codeBuddy(n) == outPut){
                                            let data = startResult = '작성한 함수에' + n + '를 대입한 결과는 ' + codeBuddy(n) + '입니다.'
                                            document.body.innerHTML = '정답입니다.<br>'+data                                           
                                            
                                          }
                                          else{                                            
                                            let data = startResult = '작성한 함수에' + n + '를 대입한 결과는 ' + codeBuddy(n) + '입니다.'
                                            document.body.innerHTML = '틀렸습니다.<br>'+data 
                                          
                                          }
                                        }
                                       else {
                                         throw new Error('codeBuddy 함수가 정의되지 않았습니다.');
                                       }
                                     }
                                     catch(err){
                                       console.error('에러발생',err);
                                       var body = document.body                      
                                       body.innerHTML = err
                                       body.style.color = 'red'
                                     }
                                     `
                                     
         
         // script를 body 태그 안에 추가(script가 정상작동하게 하기위함)
         outPut.contentWindow.document.body.appendChild(scriptElement);
         
         
       })

    })
  

    // 코드제출 버튼 클릭 이벤트
    codeSubmit.addEventListener('click', async(e)=>{
      e.preventDefault()
      // codeStart 요청을 보내서 문제번호와 일치하는 입력값과 출력값 database에서 반환
      const res = await axios.post('/codeArena/codeStart', {jsValue})
        .then(res=>{
          let data = JSON.parse(res.data)
          //입력값
          let resultInput = data[0].RESULT_INPUT
          //출력값
          let resultOutput = data[0].RESULT_OUTPUT   

          // script 태그 생성
          const scriptElement = document.createElement("script");
          // 생성한 script 태그안에 사용자가 입력한 값 추가
          scriptElement.innerHTML = `
                                     var n = ${resultInput};
                                     var outPut1 = ${resultOutput};
                                     var name = '${currentNickname}';
                                     var startResult;
                                     ${jsValue};
                                     try{
                                      if(typeof codeBuddy !== 'undefined'){
                                        if(codeBuddy(n) == outPut1){
                                          let data = startResult = '작성한 함수에' + n + '를 대입한 결과는 ' + codeBuddy(n) + '입니다.'
                                          let userS = document.querySelectorAll('.u_i_nick')
                                          userS.forEach((user)=>{
                                            if(name == user.dataset.user){                                              
                                              arenaSocket.emit('please', name)
                                              arenaSocket.emit('pleaesRoomNum')
                                            }
                                          })
                                          
                                        }
                                        else{                                            
                                          let data = startResult = '작성한 함수에' + n + '를 대입한 결과는 ' + codeBuddy(n) + '입니다.'
                                        }
                                      }
                                      else {
                                        throw new Error('codeBuddy 함수가 정의되지 않았습니다.');
                                      }
                                    }              
                                      catch(err){
                                        console.error('에러발생',err);
                                    
                                      }
                                      `
                                      
          
          // script를 body 태그 안에 추가(script가 정상작동하게 하기위함)
          document.body.appendChild(scriptElement);
          
          
        })
    })

arenaSocket.on('testSucess',(data)=>{
  let name = data
  let check = document.querySelector(`.${data}`)
  check.style.display = 'block'
  check.innerText = 'ok'

})

arenaSocket.on('okRoomNum',(data)=>{
  let data1 = data.roomNum
  axios.post('/codeArena/testSucess',{roomNum:data1, name:currentNickname})
    .then(res=>{
      let data = JSON.parse(res.data)
      data = data.COUNT
      if(data == currentUsers){
        arenaSocket.emit('gameSet')
      }
    })
})

arenaSocket.on('gameClear',()=>{
  modal1.style.display = "block";
})

//--------------------------------------------------------------------------------------------------------------------------------------------
// 페이징 js
const pagination = document.querySelector(".pagination");

if (pagination) {
  const paginationNumbers = document.querySelectorAll(".pagination__number");
  let paginationActiveNumber = document.querySelector(
    ".pagination__number--active"
  );
  const paginationNumberIndicator = document.querySelector(
    ".pagination__number-indicator"
  );
  const paginationLeftArrow = document.querySelector(
    ".pagination__arrow:not(.pagination__arrow--right)"
  );
  const paginationRightArrow = document.querySelector(
    ".pagination__arrow--right"
  );

  const postionIndicator = (element) => {
    const paginationRect = pagination.getBoundingClientRect();
    const paddingElement = parseInt(
      window.getComputedStyle(element, null).getPropertyValue("padding-left"),
      10
    );
    const elementRect = element.getBoundingClientRect();
    paginationNumberIndicator.style.left = `${
      elementRect.left + paddingElement - paginationRect.left
    }px`;
    paginationNumberIndicator.style.width = `${
      elementRect.width - paddingElement * 2
    }px`;
    if (element.classList.contains("pagination__number--active")) {
      paginationNumberIndicator.style.opacity = 1;
    } else {
      paginationNumberIndicator.style.opacity = 0.2;
    }
  };

  const setActiveNumber = (element) => {
    if (element.classList.contains("pagination__number--active")) return;
    element.classList.add("pagination__number--active");
    paginationActiveNumber.classList.remove("pagination__number--active");
    paginationActiveNumber = element;
    setArrowState();
  };

  const disableArrow = (arrow, disable) => {
    if (
      (!disable && !arrow.classList.contains("pagination__arrow--disabled")) ||
      (disable && arrow.classList.contains("pagination__arrow--disabled"))
    )
      return;
    if (disable) {
      arrow.classList.add("pagination__arrow--disabled");
    } else {
      arrow.classList.remove("pagination__arrow--disabled");
    }
  };

  const setArrowState = () => {
    const previousElement = paginationActiveNumber.previousElementSibling;
    const nextElement = paginationActiveNumber.nextElementSibling;
    if (previousElement.classList.contains("pagination__number")) {
      disableArrow(paginationLeftArrow, false);
    } else {
      disableArrow(paginationLeftArrow, true);
    }

    if (nextElement.classList.contains("pagination__number")) {
      disableArrow(paginationRightArrow, false);
    } else {
      disableArrow(paginationRightArrow, true);
    }
  };

  paginationLeftArrow.addEventListener("click", () => {
    setActiveNumber(paginationActiveNumber.previousElementSibling);
    postionIndicator(paginationActiveNumber);
  });

  paginationRightArrow.addEventListener("click", () => {
    setActiveNumber(paginationActiveNumber.nextElementSibling);
    postionIndicator(paginationActiveNumber);
  });

  Array.from(paginationNumbers).forEach((element) => {
    element.addEventListener("click", () => {
      setActiveNumber(element);
      postionIndicator(paginationActiveNumber);
    });

    element.addEventListener("mouseover", () => {
      postionIndicator(element);
    });

    element.addEventListener("mouseout", () => {
      postionIndicator(paginationActiveNumber);
    });
  });

  postionIndicator(paginationActiveNumber);
}

// 페이지 view js
document.addEventListener("DOMContentLoaded", function () {
  const itemsPerPage = 10;
  let currentPage = 1;
  let filteredItems = [];

  function showItems(page) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    filteredItems.forEach((item, index) => {
      if (index >= startIndex && index < endIndex) {
        item.style.display = "table-row";
      } else {
        item.style.display = "none";
      }
    });
  }

  function handlePagination(page) {
    currentPage = page;
    showItems(currentPage);
    updatePaginationButtons();
  }

  function updatePaginationButtons() {
    const paginationButtons = document.querySelectorAll(".pagination__number");
    paginationButtons.forEach((button) => {
      if (parseInt(button.textContent) === currentPage) {
        button.classList.add("pagination__number--active");
      } else {
        button.classList.remove("pagination__number--active");
      }
    });
  }

  const paginationButtons = document.querySelectorAll(".pagination__number");
  paginationButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const page = parseInt(this.textContent);
      handlePagination(page);
    });
  });

  const paginationArrows = document.querySelectorAll(".pagination__arrow");
  paginationArrows.forEach((arrow) => {
    arrow.addEventListener("click", function () {
      const isRightArrow = this.classList.contains("pagination__arrow--right");
      if (isRightArrow) {
        currentPage++;
      } else {
        currentPage--;
      }

      if (currentPage < 1) currentPage = 1;
      const maxPage = Math.ceil(filteredItems.length / itemsPerPage);
      if (currentPage > maxPage) currentPage = maxPage;

      handlePagination(currentPage);
    });
  });

  const items = document.querySelectorAll("#board-list tbody tr");
  items.forEach((item) => {
    item.style.display = "table-row";
    filteredItems.push(item);
  });

  showItems(currentPage);
});

// 팝업창 js
function openModal() {
  var modal = document.getElementById("modal");
  modal.style.display = "block";
}

function closeModal() {
  var modal = document.getElementById("modal");
  modal.style.display = "none";
}

// 페이지 전환 js
// $(document).on('click', 'table th a', function (e) {
//   $(".code_arena_zip").css("display", "block");
// });

// function closeModal() {
//   var modal = document.getElementById("modal");
//   modal.style.display = "none";
// }

// 지훈 javaScript 추가

// 배너 클릭 시, 메인으로
$("#m_btn").on("click", () => {
  window.location.href = `${window.location.origin}/page`;
});

// Code Chat 클릭시 메인 -> Code Chat 이동
$("#chat_btn").on("click", () => {
  window.location.href = `${window.location.origin}/page/CodeChat/`;
});

// Code Arena 클릭시 메인 -> Code Arena 이동
$("#arena_btn").on("click", () => {
  window.location.href = `${window.location.origin}/page/CodeArena`;
});

// login 클릭시 login 창 이동
$("#login_btn").on("click", () => {
  window.location.href = `${window.location.origin}/page/join`;
});

// Code Arena Code Editor -----지훈--------

const toMain = document.querySelector('#toMain')
toMain.addEventListener('click',(e)=>{
  e.preventDefault()
  window.location.href = `${window.location.origin}/page`;
})