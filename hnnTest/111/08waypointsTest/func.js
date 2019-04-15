window.SHV = SHV = {

};

SHV.all = {
	//页面滚动时禁止点击
	disableHover: function() {
		var body = document.body,
			timer;
		clearTimeout(timer);
		if(!body.classList.contains('disable-hover')) {
			body.classList.add('disable-hover')
		}
		timer = setTimeout(function() {
			body.classList.remove('disable-hover')
		}, 500);

	},
	//移动端导航栏的打开关闭
	mobileHeadContrl: {
		open: function() {
			$(".nav-more").hide();
			$(".nav-close").show();
			$(".nav-body").show();
			if($(".nav-body").is(":hidden")) {
				$(".sec1").show();
			} else {
				$(".sec1").hide();
			}
		},
		close: function() {
			$(".nav-more").show();
			$(".nav-close").hide();
			$(".nav-body").hide();

			if($(".nav-body").is(":hidden")) {
				$(".sec1").show();
			} else {
				$(".sec1").hide();
			}
		}
	},
	//底部对话框
	toggleFooterDialog: function() {
		if($(document).scrollTop() < 400) {
			$("#footer-dialog").hide();
		} else {
			$("#footer-dialog").show();
		}
	},
	//首屏的视频动画
	videoOpacity: function() {
//		console.log($(document).scrollTop());
		var opc = ($(".sec1").height() / 2 - $(document).scrollTop() - 100) / ($(document).scrollTop());
		var s = -$(document).scrollTop() / 5;
		var toph = ($(".sec1").height() - 132.86 - $(document).scrollTop()) / 2;
		$(".sec1 label").css({
			"opacity": opc,
			"top": toph
		});
		$("#sec1-video_html5_api").css({
			"top": s
		});
	},
	//首屏视频控制
	playVideo: function() {
		var sec1Player = videojs('sec1-video');
		sec1Player.on("playing", function() {
			$(".sec1-img").hide();
			$("#sec1-video").show();
		});
	},
	//手机端手势上下控制
	mobileTouch: function() {
		var startx, starty;
		//获得角度
		function getAngle(angx, angy) {
			return Math.atan2(angy, angx) * 180 / Math.PI;
		};
		//根据起点终点返回方向 1向上 2向下 3向左 4向右 0未滑动
		function getDirection(startx, starty, endx, endy) {
			var angx = endx - startx;
			var angy = endy - starty;
			var result = 0;
			//如果滑动距离太短
			if(Math.abs(angx) < 2 && Math.abs(angy) < 2) {
				return result;
			}
			var angle = getAngle(angx, angy);
			if((angle >= -175 && angle <= -15)) {
				result = 1;
			} else if(angle > 15 && angle < 175) {
				result = 2;
			}
			return result;
		}
		//手指接触屏幕
		document.addEventListener("touchstart", function(e) {
			startx = e.touches[0].pageX;
			starty = e.touches[0].pageY;
		}, false);
		//手指离开屏幕
		document.addEventListener("touchend", function(e) {
			var endx, endy;
			endx = e.changedTouches[0].pageX;
			endy = e.changedTouches[0].pageY;
			var direction = getDirection(startx, starty, endx, endy);
			switch(direction) {
				case 0:
					//					console.log("未滑动！");
					break;
				case 1:
					//					console.log("向上！");
					SHV.all.videoOpacity();
					SHV.all.playVideo();
					break;
				case 2:
					//					console.log("向下！");
					SHV.all.videoOpacity();
					SHV.all.playVideo();

					break;
				default:
			}
		}, false);
	},
	//	表单验证
	nameValid: function(name) {
		if(name.length < 1) {
			$("#tooltip-name").show();
		} else {
			$("#tooltip-name").hide()
		};
	},
	//表单验证
	telValid: function(tel) {
		if(tel.length < 11 || tel.length > 13) {
			$("#tooltip-tel").show();
		} else {
			$("#tooltip-tel").hide()
		};
	},
	//表单提交
	postForm: function(name, tel, email, content) {
		if((name.length >= 1) && (tel.length >= 11 && tel.length <= 13)) {
			$.ajax({
				type: "post",
				url: "http://email.shv.im/?a=sw",
				async: true,
				dataType: "json",
				data: {
					name: name,
					tel: tel,
					email: email,
					content: content
				},
				success: function(data) {
					$("#name").val("");
					$("#tel").val("");
					$("#email").val("");
					$("#liuyan").val("");
					alert("提交成功！");
				},
				error: function(data) {
					alert("提交失败，请重新提交！");
				}
			});
		} else {
			alert("请填写正确称呼和手机号");
			return;

		}
	}

};
SHV.single = {
	//education.html   sec3 点击更换图片样式
	hoverReplaceImg:function(dom,index){
		$(".sec3-line1 div img").eq(index).show().siblings().hide();
		$(".sec3 .shv-3").removeClass("div-active").find("img:first-of-type").show();
		$(".sec3 .shv-3").find("img:last-of-type").hide();
		dom.find("img:first-of-type").hide();
		dom.find("img:last-of-type").show();
		dom.addClass("div-active");
	},
	//首页点击下滑
	clickDown: function(showPage) {
		var scroll_offset = showPage.offset().top - 100;
		$("body,html").animate({
			scrollTop: scroll_offset
		}, 650);
	},
	//3d.html 鼠标滑动时监控视频播放
	playVideo: function() {
		var exhibitionPlayer = videojs('exhibition-video');
		if($("a[href='#3d-index4']").hasClass("active")) {
			exhibitionPlayer.play();
		} else {
			exhibitionPlayer.pause();
		}
	},
	//3d.html 手机端手势上下控制
	mobileTouch: function() {
		var startx, starty;
		//获得角度
		function getAngle(angx, angy) {
			return Math.atan2(angy, angx) * 180 / Math.PI;
		};
		//根据起点终点返回方向 1向上 2向下 3向左 4向右 0未滑动
		function getDirection(startx, starty, endx, endy) {
			var angx = endx - startx;
			var angy = endy - starty;
			var result = 0;
			//如果滑动距离太短
			if(Math.abs(angx) < 2 && Math.abs(angy) < 2) {
				return result;
			}
			var angle = getAngle(angx, angy);
			if((angle >= -175 && angle <= -15)) {
				result = 1;
			} else if(angle > 15 && angle < 175) {
				result = 2;
			}
			return result;
		}
		//手指接触屏幕
		document.addEventListener("touchstart", function(e) {
			startx = e.touches[0].pageX;
			starty = e.touches[0].pageY;
		}, false);
		//手指离开屏幕
		document.addEventListener("touchend", function(e) {
			var endx, endy;
			endx = e.changedTouches[0].pageX;
			endy = e.changedTouches[0].pageY;
			var direction = getDirection(startx, starty, endx, endy);
			switch(direction) {
				case 0:
					break;
				case 1:
					SHV.single.playVideo();
					break;
				case 2:
					SHV.single.playVideo();
					break;
				default:
			}
		}, false);
	},
	//3d.html 鼠标上下控制
	videoScroll:function(){
		var ThisscrollFunc = function(e) {
						e = e || window.event;
						if(e.wheelDelta) { //判断浏览器IE，谷歌滑轮事件      
							if(e.wheelDelta > 0) { //当滑轮向上滚动时  
								SHV.single.playVideo();
							}
							if(e.wheelDelta < 0) { //当滑轮向下滚动时  
								SHV.single.playVideo();
							}
						} else if(e.detail) { //Firefox滑轮事件  
							if(e.detail > 0) { //当滑轮向上滚动时  
								SHV.single.playVideo();
							}
							if(e.detail < 0) { //当滑轮向下滚动时  
								SHV.single.playVideo();
							}
						}
					}
					if(document.addEventListener) { //firefox  
						if(navigator.userAgent.indexOf("Firefox") > 0) {
							document.addEventListener('DOMMouseScroll', ThisscrollFunc, false);
						} else {
							document.addEventListener('mousewheel', ThisscrollFunc, false);
						}
					}
	},
	//导航栏链接
	headText:function(){
		$(".navbar-text a").removeClass("head-text-active")
		if(($(document).scrollTop() >3200) &&  ($(document).scrollTop() <3700)){
			$(".navbar-text:first-of-type a").addClass("head-text-active");
		}
		if($(document).scrollTop() >6300){
			$(".navbar-text:last-of-type a").addClass("head-text-active");
		}
	}
	
}

window.addEventListener('scroll', SHV.all.disableHover, false);
$(".nav-more").click(SHV.all.mobileHeadContrl.open);
$(".nav-close").click(SHV.all.mobileHeadContrl.close);
$(".nav-body").click(SHV.all.mobileHeadContrl.close);
SHV.all.toggleFooterDialog();






			

//设置右侧滑动菜单的样式
function rightBar(maxNum, minNum, lastSec, section) {
	function setRightSlide() {
//				console.log($(document).scrollTop());
		if($(document).scrollTop() > maxNum) {
			lastSec.removeClass("active");
		}
		//当从底部向上滑动时，在知识变现页面右边显示菜单
		else if($(document).scrollTop() > minNum) {
			lastSec.addClass("active");
		}
		section.mouseover(function() {
			$(this).siblings().css("display", "inline-block");
			$(this).children(".slider-spot").addClass("spot-active");
		});
		section.mouseout(function() {
			$(".slider-info").css("display", "none");
			$(this).children(".slider-spot").removeClass("spot-active");
		});
	}
	setRightSlide();

	//监测鼠标滚动事件，到底部时，左侧导航栏隐藏
	var scrollFunc = function(e) {
		e = e || window.event;
		//		if($(window).width() > 960) {
		//			var h = $("#header-nav").innerHeight();
		//			var head = $("#header-nav");
		//		} else {
		//			var h = $(".nav-head").innerHeight();
		//			var head = $("#header-nav-phone");
		//		}
		if(e.wheelDelta) { //判断浏览器IE，谷歌滑轮事件               
			if(e.wheelDelta > 0) { //当滑轮向上滚动时  
				setRightSlide();
				SHV.all.toggleFooterDialog();
SHV.single.headText();
				//				console.log(h);
				//				head.removeClass("headerNomal");
				//				head.addClass("headerAnimation");
				//				$("body").css({
				//					"padding-top":'calc( 100vh - '+h+'px)'
				//				});
			}
			if(e.wheelDelta < 0) { //当滑轮向下滚动时  
				setRightSlide();
				SHV.all.toggleFooterDialog();
SHV.single.headText();
				//				console.log($(document).scrollTop());
				//				head.removeClass("headerAnimation");
				//				head.addClass("headerNomal");
				//				$("body").css("padding-top", "0");
			}
		} else if(e.detail) { //Firefox滑轮事件  
			if(e.detail > 0) { //当滑轮向上滚动时  
				setRightSlide();
				SHV.all.toggleFooterDialog();
			}
			if(e.detail < 0) { //当滑轮向下滚动时  
				setRightSlide();
				SHV.all.toggleFooterDialog();
			}
		}
	};
	//给页面绑定滑轮滚动事件  
	if(document.addEventListener) { //firefox  
		if(navigator.userAgent.indexOf("Firefox") > 0) {
			document.addEventListener('DOMMouseScroll', scrollFunc, false);
		} else {
			document.addEventListener('mousewheel', scrollFunc, false);
		}
	}
}

//pc端鼠标事件，移入显示二维码,移除隐藏
$("#weixinIcon").hover(function() {
	$("#weixinImg").fadeIn();
}, function() {
	$("#weixinImg").fadeOut();
});
$("#weiboIcon").hover(function() {
	$("#weiboImg").fadeIn();
}, function() {
	$("#weiboImg").fadeOut();
});

//底部表单输入验证提示
$("input[id='name']").blur(function() {
	var name = $("#name").val();
	SHV.all.nameValid(name);
});
$("input[id='tel']").blur(function() {
	var tel = $("#tel").val();
	SHV.all.telValid(tel);
});