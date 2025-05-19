import { io } from "socket.io-client";

const token = localStorage.getItem("token"); // store it after login

const socket = io("http://localhost:5000", {
  auth: {
    token: token
  }
});

socket.on("connect", () => {
  console.log("Connected to chat server");
});

socket.on("chatMessage", (data) => {
  console.log(`${data.userId}: ${data.message}`);
});

socket.emit("chatMessage", "Hello world!");
