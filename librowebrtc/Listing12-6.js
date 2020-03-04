var localVideoElement = document.getElementById("local-video"),
    remoteVideoElement = document.getElementById("remote-video"),
    startCallButton = document.getElementById("start-call"),
    joinCallButton = document.getElementById("join-call"),
    roomNameElement = document.getElementById("room-name"),
    videoChat = new VideoChat({
        firebaseUrl: "https://glaring-fire-9593.firebaseio.com/",
        onLocalStream: function(streamSrc) {
            localVideoElement.src = streamSrc;
        },
        onRemoteStream: function(streamSrc) {
            remoteVideoElement.src = streamSrc;
        }
     });
startCallButton.addEventListener("click", function() {
    var roomName = videoChat.startCall();
    roomNameElement.innerHTML = "Created call with room name: " + roomName;
}, false);
joinCallButton.addEventListener("click", function() {
    var roomName = prompt("What is the name of the chat room you would like to join?");
    videoChat.joinCall(roomName);
    roomNameElement.innerHTML = "Joined call with room name: " + roomName;
}, false);