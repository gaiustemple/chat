$(document).ready(function() {
    var socket = io(),
        chatForm = $('.chat-form'),
        messageField = chatForm.find('#message-field'),
        messagesList = $('.messages-list'),
        chatUsername,
        chatUsernameIndicator = $('.current-username'),
        usernameForm = $('.username-form'),
        usernameSubmit = $('.username-submit'),
        usernameField = $('.username'),
        usersList = $('.users-list'),
        usernameCookie = getCookie("chat_username"),
        deviceInfo;

    function setCookie(cname,cvalue,exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires=" + d.toGMTString();
        document.cookie = cname+"="+cvalue+"; "+expires;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    

    if (usernameCookie !== "") {
        chatUsernameIndicator.html(usernameCookie);
        chatUsername = usernameCookie;
    }

    if (chatUsernameIndicator.html() == "" || chatUsernameIndicator.html() == "anon") {
        /* $(".login").removeClass("hide"); */
        usernameField.val(chatUsername);
    } else {
        $(".login").addClass("hide");
    }

    chatForm.on("submit", function(e) {
        e.preventDefault();
        var d = new Date (),
            hours = d.getHours();
            mins = d.getMinutes();
        if (hours < 10) {
            hours = "0" + hours;
        };
        if (mins < 10) {
            mins = "0" + mins;
        };
        var time = hours + ":" + mins;
        time.toString();
        var messageText = messageField.val();
        var message = {
            body: messageText,
            user: chatUsername,
            time: time
        };
        /* messagesList.append("<li class='" + message.user + "'>" + message.body + "</li>"); */
        socket.emit("message", message);
        messageField.val("");
    });

    socket.on("message", function(message){
        if (message.user == chatUsername) {
            messagesList.append("<li class='me'><span>" + message.body + "</span><b>" + message.time + "</b></li>");
        } else {
            messagesList.append("<li class='" + message.user + "'><span>" + message.body + "</span><b>" + message.time + "</b></li>");
        }
        $(".messages").stop().animate({
            scrollTop: $(".messages")[0].scrollHeight
        },300);
    });

    socket.on("chatHistory", function(data){
        messagesList.find("li").remove();
        $.each(data, function(){
            if (this.user == chatUsername) {
                messagesList.append("<li class='me'><span>" + this.text + "</span><b>" + this.time + "</b></li>");
            } else {
                messagesList.append("<li class='" + this.user + "'><span>" + this.text + "</span><b>" + this.time + "</b></li>");
            }
        });
        $(".messages").stop().animate({
            scrollTop: $(".messages")[0].scrollHeight
        },300);
    });

    socket.on("connect", function () {
        if(usernameCookie !== ""){
            chatUsername = usernameCookie;
        } else {
            chatUsername = 'anon' /* + (new Date()).getTime()*/;
        }

        function loadpost() {

            var browser;
            var os;
            var device;

            if (is.ie() == true) {
                browser = "ie";
            } else if (is.edge() == true) {
                browser = "edge";
            } else if (is.chrome() == true) {
                browser = "chrome";
            } else if (is.firefox() == true) {
                browser = "firefox";
            } else if (is.opera() == true) {
                browser = "opera";
            } else if (is.safari() == true) {
                browser = "safari";
            } else {
                browser = "undefined";
            }

            if (is.windows() == true) {
                os = "windows";
            } else if (is.mac() == true) {
                os = "mac";
            } else if (is.ios() == true) {
                os = "ios";
            } else if (is.andriod() == true) {
                os = "andriod";
            } else if (is.blackberry() == true) {
                os = "blackberry";
            } else {
                os = "undefined";
            }

            if (is.desktop() == true) {
                device = "desktop";
            } else if (is.mobile() == true) {
                device = "mobile";
            } else {
                device = "undefined";
            }

            deviceInfo = {
                browser: browser,
                os: os,
                device: device
            };
            console.log("test");
            console.log(deviceInfo);

            var onlineData = {
                user: chatUsername,
                state: "true"
            }
            socket.emit("online", onlineData);
            socket.emit("deviceDetails", deviceInfo);
        };


        loadpost();

        chatUsernameIndicator.text(chatUsername);
        socket.emit("username", chatUsername);

        socket.emit("askForConnectedClients", null, function(users){
            usersList.empty();
            $.each(users, function(){
                usersList.append("<li>" + this.username + "</li>")
            })
        });
    });

    socket.on("newConnectedUser", function(users){
        usersList.empty();
        $.each(users, function(){
            usersList.append("<li>"+this.username+"</li>");
        });
    });

    socket.on("newDisconnectedUser", function(users){
        usersList.empty();
        $.each(users, function(){
            usersList.append("<li>"+this.username+"</li>");
        });
    });

    usernameForm.on("submit", function(e) {
        e.preventDefault();
        if (usernameField.val() !== "") {
            chatUsername = usernameField.val();
            setCookie("chat_username", usernameField.val(), 365);
            chatUsernameIndicator.text(chatUsername);
            socket.emit("username", chatUsername);

            $(".login").addClass("hide");
        }
    });

    socket.on("username", function(data){
        console.log(data);
    });

    var focusTimer;

    function blurFunction () {
        $('.wrapper').addClass("blur");
        var onlineData = {
            user: chatUsername,
            state: "false"
        }
        clearInterval(focusTimer);
        socket.emit("online", onlineData);
    };

    window.onblur = blurFunction;

    function focusFunction () {
        $('.wrapper').removeClass("blur");
        var onlineData = {
            user: chatUsername,
            state: "true"
        }

        var focusInterval = function() {
            socket.emit("online", onlineData);
        };
        focusTimer = setInterval(focusInterval,2000);
        socket.emit("online", onlineData);
    };

    $(".clearChat").click(function () {
        socket.emit("clearChat");
    });

    socket.on("isOnline", function(object){
        if (object.user !== chatUsername && object.state == "true") {
            $(".wrapper").addClass("online");
        } else {
            $(".wrapper").removeClass("online");
        }
    });

    window.onfocus = focusFunction;

});

function settings () {
    var settingsMenu = $(".settings");
    if (settingsMenu.hasClass("closed")) {
        settingsMenu.removeClass("closed");
    } else {
        settingsMenu.addClass("closed");
    }
};

function darkback () {
    if (document.body.classList.contains("darkback")) {
        document.body.classList.remove("darkback");
        document.getElementById("bt1").classList.remove("check");
    } else {
        document.body.classList.add("darkback");
        document.getElementById("bt1").classList.add("check");
    }
};