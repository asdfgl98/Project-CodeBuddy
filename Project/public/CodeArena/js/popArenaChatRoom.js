// --------------------------------------------------------------------------------------------------------------------------

// 움직이는 모달
$(document).on("ready", () => {
  //모달 움직이게 하려면, draggable(); 하면 된다.
  $("#c_content_move button").draggable();
});

// 전송 버튼 ENTER 키 기능
function susubmit(f) {
  if (f.keyCode == 13) {
    $c_chatting_form.submit();
  }
}


// 채팅 내용 왔다리 갔다리
const Chat = (function () {
  let myName = "blue"; // 사용자 이름

  // init 함수
  function init() {
    // enter 키 이벤트
    $(document).on("keydown", "c_chatting_1 textarea", function (e) {
      if (e.keyCode == 13 && !e.shiftKey) {
        e.preventDefault();
        const message = $(this).val();

        // 메시지 전송
        sendMessage(message);
        // 입력창 clear
        clearTextarea();
      }
    });
  }

  // 메세지 태그 생성
  function createMessageTag(LR_className, senderName, message) {
    // 형식 가져오기
    let chatLi = $("div.chat1.format ul li").clone();

    // 값 채우기
    chatLi.addClass(LR_className);
    chatLi.find(".sender span").text(senderName);
    chatLi.find(".message span").text(message);

    return chatLi;
  }

  // 메세지 태그 append
  function appendMessageTag(LR_className, senderName, message) {
    const chatLi = createMessageTag(LR_className, senderName, message);

    $("div.chat:not(.format) ul").append(chatLi);

    // 스크롤바 아래 고정
    $("div.chat1").scrollTop($("div.chat1").prop("scrollHeight"));
  }

  // 메세지 전송
  function sendMessage(nickname, message) {
    console.log("sendMessage 함수 활성화");
    // 서버에 전송하는 코드로 후에 대체
    const data = {
      senderName: nickname,
      message: message,
    };

    // 통신하는 기능이 없으므로 여기서 receive
    resive(data);
  }

  // 메세지 입력박스 내용 지우기
  function clearTextarea() {
    $("c_chatting_1 textarea").val("");
  }

  // 메세지 수신
  function resive(data) {
    const LR = data.senderName != myName ? "left" : "right";
    appendMessageTag("right", data.senderName, data.message);
  }

  return {
    init: init,
  };
})();

$(function () {
  Chat.init();
});


  // 1. 팝업창 열기
  $(document).on("click", ".chat_open", (e) => {
    console.log("팝업창 열기");
    $("#chat").css("display", "block");
  });

  // 1. 팝업창 닫기
  $(document).on("click", ".c_content_close button", (e) => {
    console.log("팝업창 닫기");
    $("#chat").css("display", "none");
  });

  // 2. chat 축소판 다시 열기
  $(document).on("click", ".c_content_mini_btn", (e) => {
    console.log("팝업창 키우기");
    $("#chat_mini").css("display", "flex");
    $("#chat").css("display", "none");
  });

  // 2. chat 축소판 닫기
  $(document).on("click", ".chat_mini_1_2btn", (e) => {
    console.log("팝업창 줄이기");
    $("#chat_mini").css("display", "none");
    $("#chat").css("display", "block");
  });

  