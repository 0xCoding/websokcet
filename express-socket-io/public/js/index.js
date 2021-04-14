window.onload=function(){
	var registerView = $(".register_box")
	var loginView = $(".login_box")
	var chatroomView = $(".window_box")
	const socket = io()
	var regexpUser = /\S{2,8}/
	var regexpPwd = /[0-9]{6}/
	var users =null
	var currentUser = null
	var messageBox = {}
	var chatroomID = '聊天室要渲染的消息内容'
	var currentWindowId = chatroomID
	//跳转登录页
	document.getElementById("toLogin_btn").onclick = function(e){
		clearInput()
		toLoginView()

	}
	//跳转注册页
	document.getElementById("toRegister_btn").onclick =  function(e){
		clearInput()
		toRegisterView()
	}
	var flag = false;
	//注册功能
	document.getElementById("register_btn").onclick = function () {
		var  r_userVal =  $("#r_username").val().trim()
		var r_pwdVal = $("#r_password").val().trim()
		var avater = $(".form_item .avater_on img")[0].src
		
		if(regexpUser.test(r_userVal)&& regexpPwd.test(r_pwdVal)){		
			//触发注册事件
			socket.emit("register",{
				name:r_userVal,
				pwd:r_pwdVal,
				avater:avater
			})
			
			//接收注册后服务端发来的信息
			socket.once("registerMessage",function (data) {
				if(data.code==0){
					alert("账户已存在")
					$("#r_password").val("")
				}else if(data.code ==1){
					alert("注册成功")			
					toLoginView()
					clearInput()
					$("#username").val(r_userVal)
				}	
			})
		}else{
			alert("输入格式有误")
		}
	}
	//登录功能
	document.getElementById("login_btn").onclick = function (e) {
		let user = $("#username").val().trim()
		let pwd = $("#password").val().trim()
		if(regexpUser.test(user)&& regexpPwd.test(pwd)){
			//触发登录事件
			socket.emit("login",{
				name:user,
				pwd:pwd
			})
			socket.once("loginMessage",function (data) {
				if(data.code ==0){
					alert("用户名或密码错误")
				}else if(data.code==1){
					currentUser = data.user
					loginView.fadeOut();
					chatroomView.fadeIn();
					//群聊组被选中
					$("#user_list_group").removeClass("user_list_item").addClass("clickonColor")
					//登录成功后显示聊天窗口
					clearInput()
					showChatroomView(data)

				}
			})
		}else{
			alert("请输入3-8位字母、数字、下划线的用户名或6位数字")
		}
	}
	function toLoginView(){
		registerView.fadeOut();
		loginView.fadeIn();
		chatroomView.fadeOut();
	}
	function toRegisterView(){
		registerView.fadeIn();
		loginView.fadeOut();
	}
	//选择头像
	$(".form_item ul li").on("click",function (e) {
		e.stopPropagation()
		$(this).addClass("avater_on").siblings().removeClass("avater_on")
	})
	function clearInput(){
		$("#r_username").val("")
		$("#r_password").val("")
		$("#username").val("")
		$("#password").val("")
	}
	//登录后显示聊天框
	function showChatroomView(data){
		//显示个人信息
		showPersonal(data)
		socket.on("addUser",function(data){	
			//显示所用用户	
			 showAllUser(data)
			 //消息提示显示有人加入聊天室
			 showTime(data.user.time)
			 $(".message_box_content").append(` 
			 	<div class="system_message">${data.user.name}加入了聊天室</div>
			 `)
			 showIntoView()
			
		})
	}
	//显示个人信息
	function showPersonal(data){
		$(".user_list_header_avater_img").attr("src",data.user.avater)
		$(".user_list_header_avater_text p" ).text(data.user.name)
	}
	//显示所有用户列表
	function showAllUser(data){
		users = data.users
		let onliveUser = data.users.filter( item => {
				return item.active == true && item.name != currentUser.name
		})
		let offliveUser = data.users.filter( item => {
			return item.active == false 
		})
		let myslef = data.users.filter( item => {
			return item.name == currentUser.name
		})
		//显示群聊总人数和在线人数
		$(".user_list_little_inline_g").text(onliveUser.length+1)
		$("#user_list_little_count_g").text(data.users.length)
		//显示全部用户
		//先渲染自己
		$(".user_list_item_all").text("")
		myslef.forEach( item => {
			$(".user_list_item_all").append(`
				<div class="user_list_item" id="myslef"> 
					<div class="user_list_item_img">
					 	<img src="${item.avater}">
					</div>
					<div class="user_list_item_text">
						<div class="user_list_item_name">
							<p>${item.name}</p>
						</div>
						<span class="status_tag status_tag_inline">在线</span> 
					</div>
				</div>		
			`)
		})
		//然后显示在线用户
		onliveUser.forEach( item => {
			$(".user_list_item_all").append(`
				<div class="user_list_item"> 
					<div class="user_list_item_img">
					 	<img src="${item.avater}">
					</div>
					<div class="user_list_item_text">
						<div class="user_list_item_name">
							<p>${item.name}</p>
						</div>
						<span class="status_tag status_tag_inline">在线</span> 
					</div>
				</div>		
			`)
		})
		//后显示离线用户
		offliveUser.forEach( item => {
			$(".user_list_item_all").append(`
				<div class="user_list_item">  
					<div class="user_list_item_img">
					 	<img src="${item.avater}">
					</div>
					<div class="user_list_item_text">
						<div class="user_list_item_name">
							<p>${item.name}</p>
						</div>
						<span class="status_tag">离线</span> 
					</div>
				</div>		
			`)
		})
	}
	//注册用户离线事件
	socket.on("delUser",function (data) {
		showAllUser(data)
		showTime(data.user.time)
		 //消息提示显示有人离开聊天室
		$(".message_box_content").append(` 
		 	<div class="system_message">${data.user.name}离开了聊天室</div>
		`)
		showIntoView()
	})
	//显示最新的底部消息
	function showIntoView(){
		$(".message_box_content").children(":last")[0] &&$(".message_box_content").children(":last")[0].scrollIntoView(false)
	}

	// 发送输入的信息
	$("#message_send_box_exeBtn_btn").click(function (e) {
		var message = $("#message_content").html().trim()
		if(!message){
			return 
		}
		$("#message_content").html("")
		socket.emit("sendMessage",currentUser,currentWindowId,message
		)
	})
	//接收服务端广播的消息
	socket.on("broadcastMessage",function (from,toUsername,data) {
		if(currentWindowId == chatroomID){
			showTime(from.time)
			//显示自己发的消息(右边显示)
			if(currentUser && from.name == currentUser.name) {
				$(".message_box_content").append(` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble">
								<p>${data}</p>
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`)
				showIntoView()
			}else{
				$(".message_box_content").append(` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble">
								<p>${data}</p>
							</div>
						</div>	
					</div>
				`)
				showIntoView()
			}
		}else{
			var msgStr = messageBox[chatroomID]
			if(currentUser && from.name == currentUser.name){
				msgStr += ` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble">
								<p>${data}</p>
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`
			}else{
				msgStr += ` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble">
								<p>${data}</p>
							</div>
						</div>	
					</div>
				`
			}
			messageBox[chatroomID] = msgStr
		}
		
	})
		//接收自己发给别人的图片信息
	socket.on("byMe_message",function(from,toUsername,data){
			showTime(from.time)
			$(".message_box_content").append(` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble">
								<p>${data}</p>
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`)
			showIntoView()
	})		
	
	socket.on("byOther_message",function(from,toUsername,data){
		if(currentWindowId == from.name) {
			showTime(from.time)
			$(".message_box_content").append(` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble">
								<p>${data}</p>
							</div>
						</div>	
					</div>
				`)
			showIntoView()

		}else {
			var msgStr = messageBox[from.name] ==undefined ? "":messageBox[from.name]
			msgStr += ` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble">
								<p>${data}</p>
							</div>
						</div>	
					</div>
				`
			 messageBox[from.name]=msgStr
		}
	})
	
	//发送图片
	$("#send_image").on("change",function(data){
		var file = this.files[0]
		var fr = new FileReader()
		fr.readAsDataURL(file)
		fr.onload = function () {
			$("#send_image").val("")
			socket.emit("sendImage",currentUser,currentWindowId,
			{
				img:fr.result
				
			})
		}	
	})
	//接收服务端广播的图片消息
	socket.on("broadcastImage",function(from,toUsername,data){
		if(currentWindowId ==chatroomID){
			showTime(from.time)
			//显示自己发的消息(右边显示)
			if(currentUser && from.name == currentUser.name) {
				$(".message_box_content").append(` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble">
								<img src="${data.img}" alt="" id="lastImg">
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`)
				$(".message_box_content #lastImg:last")[0].onload = function () {				
					showIntoView()
				} 
			}else{
				$(".message_box_content").append(` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble">
								<img src="${data.img}" alt="" id="lastImg">
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`)
				$(".message_box_content #lastImg:last")[0].onload = function () {				
					showIntoView()
				} 					
			}
		}else{
			var msgStr = messageBox[chatroomID]
			if(currentUser && from.name == currentUser.name){
				msgStr += ` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble">
								<p>${data}</p>
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`
			}else{
				msgStr += ` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}" id="lastImg">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble">
								<img src="${data.img}" alt="">
							</div>
						</div>	
					</div>
				`
			}
			messageBox[chatroomID] = msgStr
		}
		
	})
	//接收自己发给别人的图片信息
	socket.on("byMe_image",function(from,toUsername,data){
		showTime(from.time)
		$(".message_box_content").append(` 
					<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble">
								<img src="${data.img}" alt="" id="lastImg">
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
			`)
		$(".message_box_content #lastImg:last")[0].onload = function () {				
					showIntoView()
		} 
	})		
	//接收被人私聊给自己的图片信息
	socket.on("byOther_image",function(from,toUsername,data){
		if(currentWindowId == from.name) {
			showTime(from.time)
			$(".message_box_content").append(` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}" id="lastImg">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble">
								<img src="${data.img}" alt="">
							</div>
						</div>	
					</div>
				`)
			$(".message_box_content #lastImg:last")[0].onload = function () {				
					showIntoView()
			} 

		}else {
			var msgStr = messageBox[from.name] ==undefined ? "":messageBox[from.name]
			msgStr += ` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}" id="lastImg">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble">
								<img src="${data.img}" alt="">
							</div>
						</div>	
					</div>
				`
			 messageBox[from.name]=msgStr
		}
	})
	

	//判断最后一个消息距离接收以及发送的消息事件判断是否显示发送时间
	function showTime(timestamp){		
		var thisTime = new Date().getTime()
		if(thisTime-timestamp > 300000 || !($(".message_box_content").children(":last")[0])){
			var timeDom = timeChange(timestamp)
			$(".message_box_content").append(`
			<div class="system_message">${timeDom}</div> `)
			showIntoView()
		}
	}
	//封装时间格式
	function timeChange(time){
	    var thisTime = new Date().getTime()
	    var timeObj = new Date(time)
	    var hours = timeObj.getHours()
	    var minutes = timeObj.getMinutes()
	    var timeStr = (hours < 10 ? '0' + hours : hours)+":"+(minutes < 10 ? '0' + minutes : minutes)
		// 今天凌晨的时间
	    var thisTime0 = new Date(new Date(thisTime).setHours(0, 0, 0, 0)).getTime()
		// 需要转换的时间的凌晨时间
	    var time0 = new Date(new Date(time).setHours(0, 0, 0, 0)).getTime()
		// 相差天数
	    var dayDiff = Math.floor((thisTime0 - time0)/86400000)

	    if(dayDiff === 0) {
	        return timeStr
	    } else if(dayDiff === 1) {
	        return "昨天 " + timeStr
	    } else if (dayDiff === 2) {
	        return "前天" + timeStr
	    } else {
	        var month = timeObj.getMonth()+1
	        var day = timeObj.getDate()
	        return timeObj.getFullYear()+"-"+(month < 10 ? '0' + month : month)+"-"+(day < 10 ? '0' + day : day) +" "+timeStr
	    }
	}
	socket.onclose = function (e) {
		alert("聊天通道已断开")
		toLoginView()
	}
	socket.onerror = function (ev) {
        alert("聊天室异常！！！");
        toLoginView()
    }
    //切换到某个用户私聊
    $(".user_list_item_all").on("click",".user_list_item:not(#myslef)",function(e){
    	$(this).addClass("clickonColor").siblings().removeClass("clickonColor")
    	$("#user_list_group").removeClass("clickonColor").addClass("user_list_item")

    	//渲染私聊窗口
    	//获取点击的私聊窗口名字
    	var username = this.querySelectorAll("p")[0].innerText
    	$(".message_box_title").html(`<span>${username}</span>`)
    	//第一次是聊天室的聊天记录	 currentWindowId = chatroomID
    	//把当前的聊天记录存起来
    	messageBox[currentWindowId] = $(".message_box_content").html()
    	//存完后 currentWindowId =点击的私聊窗口名字
    	currentWindowId = username
    	//从缓存中获取点击的私聊窗口名字的聊天记录
    	var domMssage = messageBox[currentWindowId]
    	//渲染聊天记录
    	$(".message_box_content").html("")
		if(!($(".message_box_content").children(":last")[0])){
    		showTime(new Date().getTime())
    	}
    	$(".message_box_content").html(domMssage)
    	showIntoView() 	
    })
    //切换到群聊
    $("#user_list_group").click(function (e) {
    	$("#user_list_group").removeClass("user_list_item").addClass("clickonColor")
    	$(".user_list_item").removeClass("clickonColor")
    	//渲染群聊消息窗口
    	//1.标题
    	let onliveUser = users.filter( item => {
				return item.active == true && item.name != currentUser.name
		})
    	$(".message_box_title").html(`聊天室(
					<span class="user_list_little_inline_g">${onliveUser.length+1}</span>
					)`)

 		//2.把当前的聊天记录存起来	
    	messageBox[currentWindowId] = $(".message_box_content").html()
    	currentWindowId = chatroomID
    	//3.从缓存中获取了群聊记录
    	var domMssage = messageBox[currentWindowId]
    	//4.渲染群聊记录
    	$(".message_box_content").html(domMssage)
    	showIntoView() 	
    })
    //发送文件
	$("#send_file").on("change",function (e) {
		var file = this.files[0]
		if(file.size >30720){
			return alert("文件大小不能超过30KB")
		}
		var formData =  new FormData()
		formData.append("upload",file)
		var userData = JSON.stringify(currentUser)
		formData.append("user",userData)
		formData.append("toUsername",currentWindowId)

		$.ajax({
			type:"post",
			url:"http://localhost:3000/upload/",
			data:formData,
			processData: false,
			contentType: false,
			mimeType: "multipart/form-data",
			success:function(data){
				$("#send_file").val("")				
			}
			
		})	
	})

	//接收服务端广播的文件信息
	socket.on("broadcastFile", function(data){
		showTime(data.user.time)			
		//如果当前的聊天窗口是聊天室，直接渲染
		if(currentWindowId == chatroomID){
			//显示自己发的消息(右边显示)
			if(currentUser && data.user.name == currentUser.name) {
				$(".message_box_content").append(` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble file_link">
								<a target="_blank" href="${data.filePath}">
									<div class="file_msg_icon ">
										<span class="iconfont icon-wenjian"></span>
									 </div>
									 <div class="file_msg_link">
									 	${data.filename}
									 </div>
								</a>
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${data.user.avater}">
						</div>
					</div>
				`)				
				showIntoView()				 
			}else{
				$(".message_box_content").append(` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${data.user.avater}" id="lastImg">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${data.user.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble file_link">
								<a target="_blank" href="${data.filePath}">
									<div class="file_msg_icon ">
										<span class="iconfont icon-wenjian"></span>
									 </div>
									 <div class="file_msg_link">
									 	${data.filename}
									 </div>
								</a>
							</div>
						</div>	
					</div>
				`)				
				showIntoView()					
			}	
		}else {
			//获取聊天室聊天记录
			var msgStr = messageBox[chatroomID]
			if(currentUser && data.user.name == currentUser.name) {
				msgStr = msgStr+` 
							<div class="message_item_right">
							<div class="message_item_right_content">
								<div class="message_item_right_bubble file_link">
									<a target="_blank" href="${data.filePath}">
										<div class="file_msg_icon ">
											<span class="iconfont icon-wenjian"></span>
										 </div>
										 <div class="file_msg_link">
										 	${data.filename}
										 </div>
									</a>
								</div>
							</div>
							<div class="message_item_avater">
								<img src="${data.user.avater}">
							</div>
						</div>
					`									 
				}else{
					msgStr = msgStr +` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${data.user.avater}" id="lastImg">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${data.user.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble file_link">
								<a target="_blank" href="${data.filePath}">
									<div class="file_msg_icon ">
										<span class="iconfont icon-wenjian"></span>
									 </div>
									 <div class="file_msg_link">
									 	${data.filename}
									 </div>
								</a>
							</div>
						</div>	
					</div>
					`				
			}
			//把接收的信息拼接完后放回缓存
			messageBox[chatroomID] = msgStr
		}				
	})
	//接收自己发给别人的文件信息
	socket.on("byMe_File",function (from,toUsername,data) {		
		if(currentWindowId == toUsername ){
			showTime(from.time)
			$(".message_box_content").append(` 
						<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble file_link">
								<a target="_blank" href="${data.filePath}">
									<div class="file_msg_icon ">
										<span class="iconfont icon-wenjian"></span>
									 </div>
									 <div class="file_msg_link">
									 	${data.filename}
									 </div>
								</a>
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`)				
				showIntoView()
			}else {
				var msgStr = messageBox[toUsername]
				msgStr = msgStr+` 
					<div class="message_item_right">
						<div class="message_item_right_content">
							<div class="message_item_right_bubble file_link">
								<a target="_blank" href="${data.filePath}">
									<div class="file_msg_icon ">
										<span class="iconfont icon-wenjian"></span>
									 </div>
									 <div class="file_msg_link">
									 	${data.filename}
									 </div>
								</a>
							</div>
						</div>
						<div class="message_item_avater">
							<img src="${from.avater}">
						</div>
					</div>
				`	
				//把接收的信息拼接完后放回缓存
				messageBox[toUsername] = msgStr	
			}
	})
	//接收被人私聊给自己的文件信息
	socket.on("byOther_File",function(from,toUsername,data){

		//如果当前窗口是发送人的窗口，直接渲染
		if(currentWindowId == from.name){
			showTime(from.time)
			$(".message_box_content").append(` 
					<div class="message_item_left">
					<!-- 头像 -->
					<div class="message_item_avater">
						<img src="${from.avater}" id="lastImg">
					</div>
					<div class="message_item_content">
						<!-- 账号名 -->
						<div class="message_item_name">${from.name}</div>
						<!-- 发言内容 -->
						<div class="message_item_bubble file_link">
							<a target="_blank" href="${data.filePath}">
								<div class="file_msg_icon ">
									<span class="iconfont icon-wenjian"></span>
								 </div>
								 <div class="file_msg_link">
								 	${data.filename}
								 </div>
							</a>
						</div>
					</div>	
				</div>
			`)				
			showIntoView()					
			
		}else{//把接收的信息追加到缓存里
			//获取聊天记录
			var msgStr = messageBox[from.name] == undefined ? " ":messageBox[from.name]
				msgStr = msgStr +` 
						<div class="message_item_left">
						<!-- 头像 -->
						<div class="message_item_avater">
							<img src="${from.avater}" id="lastImg">
						</div>
						<div class="message_item_content">
							<!-- 账号名 -->
							<div class="message_item_name">${from.name}</div>
							<!-- 发言内容 -->
							<div class="message_item_bubble file_link">
								<a target="_blank" href="${data.filePath}">
									<div class="file_msg_icon ">
										<span class="iconfont icon-wenjian"></span>
									 </div>
									 <div class="file_msg_link">
									 	${data.filename}
									 </div>
								</a>
							</div>
						</div>	
						</div>
				`				
			}
			//把接收的信息拼接完后放回缓存
			messageBox[from.name] = msgStr
		
	})


    
}
