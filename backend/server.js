const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)
// const origin = 'http://192.168.1.5:3000'
const io = require("socket.io")(server, {
	cors: {
		origin : "*" ,
		methods: [ "GET", "POST" ]
	}
})

io.on("connection", (socket) => {
	socket.emit("me", socket.id)
	console.log(socket.id.length)
	socket.on("disconnect", () => {
		console.log("callEnded")
		socket.broadcast.emit("callEnded")
	})

	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", {signal : data.signal,name : data.name})
	})
})

server.listen(5000, () => console.log("server is running on port 5000"))
