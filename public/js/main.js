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
        usersList = $('.users-list');

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
        if($.cookie("chat_username")){
            chatUsername = $.cookie("chat_username");
        } else {
            chatUsername = 'anon' /* + (new Date()).getTime()*/;
        }

        $.cookie("chat_username", chatUsername);
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
            $.cookie("chat_username", usernameField.val());
            chatUsernameIndicator.text(chatUsername);
            socket.emit("username", chatUsername);

            $(".login").addClass("hide");
        }
    });

    socket.on("username", function(data){
        console.log(data);
    });
});