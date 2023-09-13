// socket.io 사용
const chatSocket = io("/CodeChat");
// 방의 이름을 입력받고 방에 입장할 수 있는 페이지 담당 js

const $make_room_form = document.querySelector("#make_room_form"); // 방 정보 입력 폼
const $room_name = document.getElementById("room_name"); // 방 이름 입력 input
const $dev_lang = document.getElementById("dev_lang"); // 방의 언어 방식 select
const $chatRoomMethod = document.getElementById('chatRoomMethod')

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

const openarena = (user) => {
  $("#container").css("display", "flex");
  $(".m_header").css("display", "none");
  $('.notice').css("display", "none");
  $('.chat_open').css('display', 'block')
};

let currentNickname;
// 방 생성 함수
const handleRoomSubmit = (event) => {
  event.preventDefault();
  const room_name = $room_name.value;
  const dev_lang = $dev_lang.value;
  const chatRoomMethod = $chatRoomMethod.value;
  // 지훈 코드 삽입 (방생성)
  axios.get("/codeChat/createRoom", { room: "hi" }).then((res) => {
    currentNickname = res.data; // 방 생성자의 닉네임
    chatSocket.emit("create_room", {
      room_name: room_name,
      dev_lang: dev_lang,
      nickname: res.data, // 방 생성자 이름
      chatRoomMethod : chatRoomMethod, 
    });

    chatSocket.emit("check_admin", { nickname: res.data });

    closeModal(); // 모달 닫고
    // openarena(); // 방 입장
    // chatSocket.emit("welcome", { nickname: res.data });
    $room_name.value = ""; // 방 입력칸 초기화
  });

  $c_c_name.textContent = room_name; // 채팅방 펼쳤을 때 방제
  $mini_room_name.textContent = room_name; // 채팅방 접었을 때 방제
  // $c_a_u_r_name2.textContent = room_name; // Arena 제한 시간 위 방제
};

// 방 생성시 방장 권한 부여
chatSocket.on("admin_status", ({ isAdmin }) => {
  if (isAdmin) {
    chatSocket["isAdmin"] = isAdmin;
  }
});

// 방목록 최신화 ------------------지훈---------------------

let roomName = "";
let roomNum;
let roomLinks;
let clickEventHandler = null;
let socketId;

const handleClick = (e) => {
  const target = e.target;
  if (target.classList.contains("room-link")) {
    let roomNumber = target.getAttribute("data-roomnumber");
    roomNumber = parseInt(roomNumber);
    const roomName = target.getAttribute("data-roomname");
    const roomHost = target.getAttribute("data-roomhost");
    const method = target.getAttribute("data-method");
    if(method == "1:1채팅"){
      axios.post("/codeChat/userFull", {roomNumber})
      .then(res => {
        let data = JSON.parse(res.data)
        if (data.USER_COUNT >= 2){
          alert("방의 인원수가 초과되었습니다.")
        }
        else {
          enterRoom(roomName, roomNumber, roomHost, method);
        }
      })
    }
    else if (method == "오픈채팅"){
      axios.post("/codeChat/userFull", {roomNumber})
      .then(res => {
        let data = JSON.parse(res.data)
        if (data.USER_COUNT >= 4){
          alert("방의 인원수가 초과되었습니다.")
        }
        else {
          enterRoom(roomName, roomNumber, roomHost, method);
        }
      })
    }
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
      if(roomInfo.ROOM_METHOD == '1:1채팅'){
        newRow.id = "room_" + roomInfo.ROOM_NUMBER;
        // 방 정보를 td에 추가
        newRow.innerHTML = `
                <td id="room-Num">${roomInfo.ROOM_NUMBER}</td>
                <td>${roomInfo.ROOM_METHOD}</td>
                <td class="item ${roomInfo.ROOM_LANG}">${roomInfo.ROOM_LANG}</td>
                <th>
                  <a align='center' id='123' class="room-link room-${roomInfo.ROOM_NUMBER}" data-roomnumber="${roomInfo.ROOM_NUMBER}" data-roomname="${roomInfo.ROOM_NAME}" data-roomhost="${roomInfo.ROOM_HOST}" data-method="${roomInfo.ROOM_METHOD}">${roomInfo.ROOM_NAME} ( ${roomInfo.USER_COUNT} / 2 )</a>
                  <p>테스트</p>
                </th>
                <td>${roomInfo.ROOM_HOST}</td>
          `;
        // 새로운 행을 테이블의 맨 위에 추가
        $tbody.prepend(newRow);

        // $c_content_num.textContent = `${roomInfo.USER_COUNT}/2`; // 채팅방 펼쳤을 때 인원 수
        // $mini_room_users.textContent = `${roomInfo.USER_COUNT}/2`; // 채팅방 접었을 때 인원 수
      }
      else if (roomInfo.ROOM_METHOD == '오픈채팅'){
        newRow.id = "room_" + roomInfo.ROOM_NUMBER;
        // 방 정보를 td에 추가
        newRow.innerHTML = `
                <td id="room-Num">${roomInfo.ROOM_NUMBER}</td>
                <td>${roomInfo.ROOM_METHOD}</td>
                <td class="item ${roomInfo.ROOM_LANG}">${roomInfo.ROOM_LANG}</td>
                <th>
                  <a align='center' id='123' class="room-link room-${roomInfo.ROOM_NUMBER}" data-roomnumber="${roomInfo.ROOM_NUMBER}" data-roomname="${roomInfo.ROOM_NAME}" data-roomhost="${roomInfo.ROOM_HOST}" data-method="${roomInfo.ROOM_METHOD}">${roomInfo.ROOM_NAME} ( ${roomInfo.USER_COUNT} / 4 )</a>
                  <p>테스트</p>
                </th>
                <td>${roomInfo.ROOM_HOST}</td>
          `;
        // 새로운 행을 테이블의 맨 위에 추가
        $tbody.prepend(newRow);
        filter()

        // $c_content_num.textContent = `${roomInfo.USER_COUNT}/4`; // 채팅방 펼쳤을 때 인원 수
        // $mini_room_users.textContent = `${roomInfo.USER_COUNT}/4`; // 채팅방 접었을 때 인원 수
      }


    clickEventHandler = handleClick;
    $tbody.addEventListener("click", clickEventHandler);
  });
};


// 사용자 접속시 채팅방 리스트 최신화
chatSocket.on("updateRoomList", () => {
  const $board_list = document.getElementById("board-list");
  const $board_table = $board_list.querySelector(".board-table");
  const $tbody = $board_table.querySelector("tbody");
  const $trs = $tbody.querySelectorAll("tr");
  axios.get("/codeChat/arenaList", { re: "hi" }).then((res) => {
    let roomList = JSON.parse(res.data);
    $trs.forEach(($tr) => {
      $tr.remove();
    });
    updateArenaRoom(roomList);
  });
});

// 방 생성시 채팅방 리스트 최신화(기존의 테이블 tr 모두 삭제 후 최신화)
chatSocket.on("updateRoomList2", () => {
  const $board_list = document.getElementById("board-list");
  const $board_table = $board_list.querySelector(".board-table");
  const $tbody = $board_table.querySelector("tbody");
  const $trs = $tbody.querySelectorAll("tr");
  axios.get("/codeChat/arenaList", { re: "hi" }).then((res) => {
    let roomList = JSON.parse(res.data);
    $trs.forEach(($tr) => {
      $tr.remove();
    });
    updateArenaRoom(roomList);
  });
});

// 인원수 실시간 업데이트
chatSocket.on("countUpdate", (data) => {
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
chatSocket.on("host_enterRoom", (data) => {
  let nickName = data[0].createdBy;
  let roomName = data[0].room_name;
  let roomNum = data[0].room_number;
  let method = data[0].chatRoomMethod;
  const addRoomToTable = (updateRooms) => {
    axios.post("/codeChat/updateroom", { updateRooms }).then((res) => {
      let roomInfo = JSON.parse(res.data);
    });
  };
  addRoomToTable(data);
  enterRoom(roomName, roomNum, nickName, method);
});

// 코드 보내기 클릭
const codeSend = document.querySelector('#codeSend')
codeSend.addEventListener('click',()=>{
  chatSocket.emit('sendClick')
  })

chatSocket.on('socketUser',(data)=>{
  const checkUser = document.getElementsByName('checkuser')
  
  let myHtml = html ? html.getValue() : '';
  let myCss = css ? css.getValue() : '';
  let myJs = js ? js.getValue() : '';
  
  checkUser.forEach((user)=>{
    if(user.checked == true){
      axios.post('/codeChat/userSocket', {name : user.value, roomNum : data.roomNum})
        .then(res=>{
          let data = JSON.parse(res.data)
          chatSocket.emit('codeSendBtn', {html : myHtml, css : myCss, js : myJs, name:user.value, socketId : data.SOCKET_ID})
        })
    }
  })
})


//코드 유저에게 전송
chatSocket.on('codeSend',(data)=>{
  const tabData = document.querySelector('.tab')
  const $tabLang = document.querySelectorAll('.tab-container__item2')
  html2.setValue(data.html)
  css2.setValue(data.css)
  js2.setValue(data.js)
  
  $tabLang.forEach((tab)=>{
    tab.addEventListener('click',()=>{
      if(tab.dataset.tab == 'tab4'){
        html2.setValue(data.html)
      }
      else if(tab.dataset.tab == 'tab5'){
        css2.setValue(data.css)
      }
      else if(tab.dataset.tab == 'tab6'){
        js2.setValue(data.js)
      }
    })
  })


  // if(data.socketId ==  tabData.dataset.id){
  //   $tabLang.addEventListener('click',()=>{
  //     if($tabLang.dataset.tab == 'tab4'){
  //       html2.setValue(data.html)
  //     }
  //     else if($tabLang.dataset.tab == 'tab5'){
  //       css2.setValue(data.css)
  //     }
  //     else if($tabLang.dataset.tab == 'tab6'){
  //       js2.setValue(data.js)
  //     }
  //   })
  // }
})



const $btn_group  = document.querySelector('.btn-group')
/* codeChat 접속시 사용자 정보 */
const updataChatUser = (conn_user, name, roomNum)=>{
  let count = 1
  conn_user.forEach((userInfo)=>{
    if(userInfo.CONN_USER != currentNickname){
      if(userInfo.ROOM_NUMBER == roomNum){  // 체크박스
        const checkUser = document.createElement('input')
        // 사용자 이름
        const labelUser = document.createElement('label')
        // 체크박스 속성 값 지정
        checkUser.setAttribute('type','checkbox')
        checkUser.setAttribute('name','checkuser')
        checkUser.setAttribute('value', `${userInfo.CONN_USER}`)
        checkUser.className = 'btn-group'
        checkUser.id = `${userInfo.CONN_USER}`
        // 사용자 이름과 체크박스 연동 (for 와 id)
        labelUser.className = 'btn btn-outline-secondary'
        labelUser.setAttribute('for',`${userInfo.CONN_USER}`)
        labelUser.innerText = `${userInfo.CONN_USER}`
        // if(userInfo.CONN_USER != name){
        //   $btn_group.append(checkUser);
        //   $btn_group.append(labelUser);
        // }
        $btn_group.append(checkUser);
        $btn_group.append(labelUser);
        count++
      }
    }
    })
  const $userTabs = document.querySelector('.tabs')
  let cnt = 1
  conn_user.forEach((userInfo)=>{
    if(userInfo.ROOM_NUMBER == roomNum){
      if(userInfo.CONN_USER != currentNickname){
        if(cnt == 1){
          $userTabs.innerHTML += `
          <label class="tab" id="one-tab" for="one" data-id='${chatSocket.id}'>${userInfo.CONN_USER}</label>
          `      
        }
        else if(cnt == 2){
          $userTabs.innerHTML += `
          <label class="tab" id="one-tab" for="one" data-id='${chatSocket.id}'>${userInfo.CONN_USER}</label>
        `
        }
        else{
          $userTabs.innerHTML += `
          <label class="tab" id="one-tab" for="one" data-id='${chatSocket.id}'>${userInfo.CONN_USER}</label>
         `
        }
        cnt++
      }
    }
  })
  
}


// codechat 유저 접속시 리스트 업데이트
chatSocket.on('userConnectInfo',(data)=>{
  let data1 = data.data
  let roomNum = data.roomNum
  const $tabs = document.querySelector('.tabs')
  const userTab = $tabs.querySelectorAll('label')
  const userCheck = $btn_group.querySelectorAll('input')
  const userLabel = $btn_group.querySelectorAll('label')
  userCheck.forEach((check)=>{
    check.remove()
  })
  userLabel.forEach((label)=>{
    label.remove()
  })
  userTab.forEach((tab)=>{
    tab.remove()
  })
  updataChatUser(data1,currentNickname,roomNum)
})

// --------------------지훈 끝--------------------------------
//
$make_room_form.addEventListener("submit", handleRoomSubmit);

chatSocket.on("update_room_list", (roomInfo) => {
  addRoomToTable(roomInfo);
});

// //방 목록 database에 새로운 방 추가하는 함수
const addRoomToTable = (updateRooms) => {
  axios.post("/codeChat/updateroom", { updateRooms }).then((res) => {
    let roomInfo = JSON.parse(res.data);
    chatSocket.emit("newlist");
  });
};

let conn_user_data;
const enterRoom = (roomName, roomNum, roomHost, method) => {
  //유저접속
  axios.post("/codeChat/connectUser", { roomNum: roomNum, socketId : chatSocket.id }).then((res) => {
    conn_user_data = JSON.parse(res.data);
  });

  axios.post("/codeChat/enterRoom", { roomNum }).then((res) => {
    let data = JSON.parse(res.data);
    currentNickname = data.name;
    chatSocket.emit("enter_room", {
      room_name: roomName,
      nickname: data.name,
      room_number: roomNum,
      room_host: roomHost,
      conn_user: conn_user_data,
    });
    chatSocket.emit("userCount", { data: data.result });
  });
  $c_c_name.textContent = roomName; // 채팅방 펼쳤을 때 방제
  $mini_room_name.textContent = roomName; // 채팅방 접었을 때 방제
  // $c_a_u_r_name2.textContent = roomName; // Arena 제한 시간 위 방제
  let userCount;
  chatSocket.on("user_count", ({ user_count }) => {
    userCount = user_count;
    if(method == "1:1채팅"){
      $c_content_num.textContent = `${userCount}/2`; // 채팅방 펼쳤을 때 인원 수
      $mini_room_users.textContent = `${userCount}/2`; // 채팅방 접었을 때 인원 수
    }
    else if (method == "오픈채팅"){
      $c_content_num.textContent = `${userCount}/4`; // 채팅방 펼쳤을 때 인원 수
      $mini_room_users.textContent = `${userCount}/4`; // 채팅방 접었을 때 인원 수
    }
  });





  openarena(); // 방 입장
};


const $leave_room = document.getElementById("leave_room_cc");

const leaveRoomBtn = (e) => {
  e.preventDefault()
    $("#container").css("display", "none");
    $(".m_header").css("display", "flex");
    $('.notice').css("display", "block");

    chatSocket.emit('leave_room', {currentNickname})
    chatSocket.emit("leave_count");
    chatSocket.emit('textReset')
};

chatSocket.on('resetStart',()=>{  
    resetEditor(html);
    resetEditor(css);
    resetEditor(js);
    resetEditor(html2);
    resetEditor(css2);
    resetEditor(js2);
})

let disconn_user_data;
chatSocket.on("leaveuser", (data) => {
  //유저 나감
  axios.post("/codeChat/disconnectUser", { data }).then((res) => {
    disconn_user_data = JSON.parse(res.data);
    chatSocket.emit("disconn_chat_user", { user_data: disconn_user_data });
    // chatSocket.emit("disconn_arena_user", {disconn_user_data})
  });

  axios.post("/codeChat/leave", { data }).then((res) => {
    let data = JSON.parse(res.data);
    chatSocket.emit("userCount", { data: data.result });
    location.reload();
  });
});

$leave_room.addEventListener("click", leaveRoomBtn);

// 인원 수 초과 됐을 때
chatSocket.on("user_full", () => {
  alert("방 인원 초과");
});

window.addEventListener("beforeunload", () => {
  chatSocket.emit("leave_count");
  chatSocket.emit("leave_room", { currentNickname });
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

  // 메세지 공백 아닐시 메세지 전송
  if(checkMessage !== ""){ 
    chatSocket.emit("new_message", { currentNickname, message: message });
  }
  $form_input.value = ""; // 입력 창 초기화
};
// ---------------함수 정의 끝------------------

chatSocket.on("connect", () => {
  console.log("프론트와 서버와의 연결 성공");
});

function scrollToBottom() {
  $c_main_content.scrollTop = $c_main_content.scrollHeight;
}

chatSocket.on("my_message", ({ currentNickname, message }) => {
  const $div = document.createElement("div");
  const $Div = document.createElement('div')
  $Div.id ='my_M'
  $div.id = "my_message"
  $div.textContent = `${message}`;
  $Div.appendChild($div);
  $c_main_content.appendChild($Div);
  scrollToBottom()
});

chatSocket.on("other_message", ({ currentNickname, message }) => {
  const $div = document.createElement("div");
  $div.id = "other_message"
  $div.textContent = `${currentNickname} : ${message}`;
  $c_main_content.appendChild($div);
  scrollToBottom()
});


chatSocket.on("welcome", ({ nickname }) => {
  addNotice(`${nickname}(이)가 방에 입장했습니다.`);
});


//여기요
chatSocket.on("leave_normal_user", ({ disconn_chat_user, room_number }) => {
  let data1 = disconn_chat_user
  let roomNum = room_number
  const $tabs = document.querySelector('.tabs')
  const userTab = $tabs.querySelectorAll('label')
  const userCheck = $btn_group.querySelectorAll('input')
  const userLabel = $btn_group.querySelectorAll('label')
  userCheck.forEach((check)=>{
    check.remove()
  })
  userLabel.forEach((label)=>{
    label.remove()
  })
  userTab.forEach((tab)=>{
    tab.remove()
  })
  updataChatUser(data1,currentNickname,roomNum)
});

chatSocket.on("get_out", () => {
  $leave_room.click()
});





chatSocket.on("bye", ({ currentNickname }) => {
  addNotice(`${currentNickname}(이)가 방에서 나갔습니다.`);
});

//채팅 보내기
$c_chatting_2_btn.addEventListener("click", handleMessageSubmit);
const enterChat = (e)=>{
  if(e.keyCode == 13){
    $c_chatting_2_btn.click()
  }
}

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
