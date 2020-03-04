var VideoChat = (function(Firebase) {
    var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
        SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription,
        IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate,
        _participantType = {
            INITIATOR: "initiator",
            RESPONDER: "responder"
        },
        _peerConnectionSettings = {
            server: {
                iceServers: [{
                url: "stun:23.21.150.121"
            }, {
                url: "stun:stun.l.google.com:19302"
            }, {
                url: "turn:numb.viagenie.ca",
                username: "fogniebla@hotmail.com",
                credential: "Qazwsxx2"
            }]
        },
        options: {
            optional: [{
                DtlsSrtpKeyAgreement: true
            }]
        }
    };

    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia ||
    navigator.webkitGetUserMedia || navigator.msGetUserMedia;

    if (!navigator.getUserMedia && !window.RTCPeerConnection) {
        throw new Error("Your browser does not support video chat");
    }
    function onError(error) {
        throw new Error(error);
    }
    function VideoChat(options) {
        options = options || {};
        if (typeof options.onLocalStream === "function") {
            this.onLocalStream = options.onLocalStream;
        }
        if (typeof options.onRemoteStream === "function") {
            this.onRemoteStream = options.onRemoteStream;
        }
        this.initializeDatabase(options.firebaseUrl || "");
        this.setupPeerConnection();
    }
    VideoChat.prototype = {
        participantType: _participantType.INITIATOR,
        remoteParticipantType: _participantType.RESPONDER,
        chatRoomName: "",
        database: null,
        onLocalStream: function() {},
        onRemoteStream: function() {},
        initializeDatabase: function(firebaseUrl) {
            var firebase = new Firebase(firebaseUrl);
            this.database = firebase.child("chatRooms");
        },
        saveData: function(chatRoomName, name, value) {
            if (this.database) {
                this.database.child(chatRoomName).child(name).set(value);
            }
        },
        loadData: function(chatRoomName, name, callback) {
            if (this.database) {
                this.database.child(chatRoomName).child(name).on("value", function(data) {
                    var value = data.val();
                    if (value && typeof callback === "function") {
                        callback(value);
                    }
                });
            }
        },
        setupPeerConnection: function() {
            var that = this;
            this.peerConnection = new PeerConnection(_peerConnectionSettings.server, _peerConnectionSettings.options);
            this.peerConnection.onaddstream = function(event) {
                var streamURL = window.URL.createObjectURL(event.stream);
                that.onRemoteStream(streamURL);
            };
            this.peerConnection.onicecandidate = function(event) {
                if (event.candidate) {
                    that.peerConnection.onicecandidate = null;
                    that.loadData(that.chatRoomName, "candidate:" + that.remoteParticipantType,
    function(candidate) {
                        that.peerConnection.addIceCandidate(new IceCandidate(JSON.parse(candidate)));
                        });
                        that.saveData(that.chatRoomName, "candidate:" + that.participantType, JSON.stringify(event.candidate));
                    }
                };
            },

            call: function() {
                var that = this,
                    _constraints = {
                        mandatory: {
                            OfferToReceiveAudio: true,
                            OfferToReceiveVideo: true
                        }
                    };
                navigator.getUserMedia({
                    video: true,
                    audio: true
                }, function(stream) {
                    that.peerConnection.addStream(stream);
                    that.onLocalStream(window.URL.createObjectURL(stream));
                    if (that.participantType === _participantType.INITIATOR) {
                        that.peerConnection.createOffer(function(offer) {
                            that.peerConnection.setLocalDescription(offer);
                            that.saveData(that.chatRoomName, "offer", JSON.stringify(offer));
                            that.loadData(that.chatRoomName, "answer", function(answer) {
                                that.peerConnection.setRemoteDescription(new SessionDescription(JSON.parse(answer)));
                            });
                        }, onError, _constraints);
                    } else {
                        that.loadData(that.chatRoomName, "offer", function(offer) {
                            that.peerConnection.setRemoteDescription(new SessionDescription(JSON.parse(offer)));
                            that.peerConnection.createAnswer(function(answer) {
                                that.peerConnection.setLocalDescription(answer);
                                that.saveData(that.chatRoomName, "answer", JSON.stringify(answer));
                                }, onError, _constraints);
                            });
                        }
                    }, onError);
                },
                startCall: function() {
                    var randomNumber = Math.round(Math.random() * 999);
                    if (randomNumber < 10) {
                        randomNumber = "00" + randomNumber;
                    } else if (randomNumber < 100) {
                        randomNumber = "0" + randomNumber;
                    }
                    this.chatRoomName = "room-" + randomNumber;
                    this.call();
                    return this.chatRoomName;
                },
                joinCall: function(chatRoomName) {
                    this.chatRoomName = chatRoomName;
                    this.participantType = _participantType.RESPONDER;
                    this.remoteParticipantType = _participantType.INITIATOR;
                    this.call();
                }
            };
            return VideoChat;
}(Firebase));
