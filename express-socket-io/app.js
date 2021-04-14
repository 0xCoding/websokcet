var multer  = require('multer')
var upload = multer({ 
	// dest: 'express-socket-io/public/upload/',

	storage:multer.diskStorage({
		destination: function (req, file, cb) {
    		cb(null, 'express-socket-io/public/upload/')
  		},
		filename:function (req,file,cb) {
			var filename = file.originalname
			var suffix = filename.substring(filename.lastIndexOf("."))
			cb(null, file.fieldname + '-' + Date.now()+suffix)
		}
	})	
})
const app= require("express")()
const httpServer = require("http").createServer(app)
const fs = require("fs")
const path = require("path")
const bodyParser = require("body-parser")

//设置接收任意文件
app.use(upload.any())
// 设置request的post参数
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const io = require("socket.io")(httpServer,{})

var users=[]
var arrAllSocket = {};
var chatroomID = '聊天室要渲染的消息内容'

httpServer.listen(3000,function (e) {
	console.log("3000 端口启动")
})

app.use('/public/',require("express").static('./express-socket-io/public/'))
app.use('/favicon.ico',require("express").static('./express-socket-io/public/'))
app.get("/",function (req,res) {
	fs.readFile(path.join(__dirname+"/index.html"),"utf-8",function (error,data) {
		if(error){
			console.log(error)
			res.setHeader('Content-Type','text/html;charset=utf8')
			res.end("加载index.html文件失败")
		}else{		
			res.end(data)
		}
	})
})

io.on("connection",function (socket) {

	console.log("new connection")
	//监听注册事件
	socket.on("register",function(data){
		let user = users.find(item => {
			return item.name == data.name
		})
		if(user!=null){
			socket.emit("registerMessage",{
				code:0,
				msg:"账号已存在"
			})
		}else{
			data.time = new Date().getTime()
			data.active = false
			users.push(data)
			socket.emit("registerMessage",{
				code:1,
				msg:"注册成功"
			})
		}
	})
	//监听登录事件
	socket.on("login",function (data) {
		let user = users.find(item => {
			return item.name ==data.name && item.pwd == data.pwd
		})
		//用户名或密码错误
		if(!user){
			return socket.emit("loginMessage",{
				code:0,
				msg:"用户名或密码错误",
			})
		}else{
			arrAllSocket[user.name]=socket
			user.time = new Date().getTime()
			users.forEach(item =>{
				if(item.name ==user.name){
					item.active =true
				} 
			})

			socket.emit("loginMessage",{
				code:1,
				msg:"登录通过",
				user:user,
			})
			//告诉所有人有新用户进入聊天室
			io.emit("addUser",{
				user:user,
				users:users
			})

			}
		//当前用户离线
		socket.on("disconnect",function(reason){
			users.forEach(item =>{
					if(item.name == user.name){
						item.active = false
					} 
			})
			arrAllSocket[user.name]=null
			user.time = new Date().getTime()
			//告诉所有用户该socket离线
			io.emit("delUser",{
				user:user,
				users:users
			})
		})
		//接收客户端发送的数据
		socket.on("sendMessage",function (from,toUsername,data) {
			from.time = new Date().getTime()
			let targetSocket = arrAllSocket[toUsername]
			let fromSocket = arrAllSocket[from.name]
			if(toUsername == chatroomID) {
				io.emit("broadcastMessage",from,toUsername,data)
			}else if(!targetSocket){
				fromSocket.emit("byMe_message",from,toUsername,data)
			}else{
				fromSocket.emit("byMe_message",from,toUsername,data)
				targetSocket.emit("byOther_message",from,toUsername,data)
			}
			
		})
		//注册接收图片信息
		socket.on("sendImage",function (from,toUsername,data) {
			from.time = new Date().getTime()
			let targetSocket = arrAllSocket[toUsername]
			let fromSocket = arrAllSocket[from.name]
			if(toUsername == chatroomID) {
				io.emit("broadcastImage",from,toUsername,data)
			}else if(!targetSocket){
				fromSocket.emit("byMe_image",from,toUsername,data)
			}else{
				fromSocket.emit("byMe_image",from,toUsername,data)
				targetSocket.emit("byOther_image",from,toUsername,data)
			}
		})

		//接收文件信息
		app.post("/upload",function(req,res){
			//发送人的信息
			let user = req.body.user
			let userObj = JSON.parse(user)
			userObj.time =new Date().getTime()
			let fromSocket = arrAllSocket[userObj.name]
			//文件信息
			var file =req.files[0]
			if(file){
				var filename = file.originalname
				var filePath = "public/upload/"+file.filenamer

			}			
			let toUsername = req.body.toUsername
			let targetSocket = arrAllSocket[toUsername]
			if(toUsername == chatroomID) {
				//广播给群聊
				io.emit("broadcastFile",{
					user:userObj,
					filename:filename,
					filePath:filePath
				})
			}else if(!targetSocket){
				fromSocket.emit("byMe_File",userObj,toUsername,{
					filename:filename,
					filePath:filePath
				})
			}else{
				//私聊给目标用户
				fromSocket.emit("byMe_File",userObj,toUsername,{
					filename:filename,
					filePath:filePath
				})
				targetSocket.emit("byOther_File",userObj,toUsername,{
					filename:filename,
					filePath:filePath
				})
						

			}			
			res.end("文件上传成功")
		})
	


	})
	

})
