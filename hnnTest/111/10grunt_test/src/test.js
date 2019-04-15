var timer = null;
var _isMove = false;
var api_this=null;




function api() {
	this.multiple = 5; //缩放倍数
	this.maxZoom = 3; //最大缩放比
	//存放wrapper
	MeowGodThree.wrapper = document.getElementById('wrapper');
	//检测url
	this.initDefaultApp();
	api_this=this;
	
}
//
api.prototype.initDefaultApp = function() {
	MeowGodThree.Util
	.createScript('dist/js/Genesis.js',function(){
		api_this.multiple = 15;
		MeowGodThree.Genesis.init(api_this.onWindowScroll);
	})
	this.bindEvent()
}

//初始化判断加载什么control等
api.prototype.init = function(info) {
	this.bindEvent()
}

api.prototype.bindEvent = function() {
	//制作一个Magic Leep的效果
	this.updateWrapper();

	window.addEventListener('resize', this.onWindowResize.bind(this), false)
	window.addEventListener('scroll', this.onWindowScroll.bind(this), false)
}

//wrapper 设置高度
api.prototype.updateWrapper = function() {
		var Scrollw= changeWH.w();
	var Scrollh = changeWH.h();
		if(!isPCFlag) {
			if(isPortrait) {
				//竖屏
				Scrollw = changeWH.w();
				Scrollh = changeWH.h();   
			} else {              
				//横屏
				Scrollw = changeWH.h()>=changeWH.w()?changeWH.h():changeWH.w();
				Scrollh = changeWH.h()<changeWH.w()?changeWH.h():changeWH.w();   
			}
			}
	MeowGodThree.wrapper.style.height = Scrollh * this.maxZoom + 'px';
//}
}

//停止渲染
api.prototype.stopAnimation = function() {
	if(MeowGodThree.animationId) {
		cancelAnimationFrame(MeowGodThree.animationId);
		MeowGodThree.animationId = null;
	}
}
//监听窗口是否聚焦
api.prototype.onBlurAnimation = function() {
	window.onblur = function() {
		ThreeApp.stopAnimation()
	}
	window.onfocus = function() {
		if(!MeowGodThree.animationId) {
			ThreeApp.initPlugin('animate')
		}
	}

}

//监听鼠标事件，进去渲染，离开停止
api.prototype.onMouseMove = function() {
	//15s不操作，默认离开，停止渲染
	MeowGodThree.wrapper.addEventListener("mousemove", function() {
		if(_isMove) {
			clearTimeout(timer);
			if(!MeowGodThree.animationId) {
				ThreeApp.initPlugin('animate')
				_isMove = false;
			}
		} else {
			clearTimeout(timer);
			timer = setTimeout(function() {
				ThreeApp.stopAnimation()
				_isMove = true;
			}, 180000)
		}
	})

	MeowGodThree.wrapper.addEventListener("mouseenter", function() {
		if(!MeowGodThree.animationId) {
			ThreeApp.initPlugin('animate')
		}
	})

	MeowGodThree.wrapper.addEventListener("mouseleave", function() {
		clearTimeout(timer);
		ThreeApp.stopAnimation()
	})

}
//监听窗口缩放
api.prototype.onWindowResize = function() {
	this.updateWrapper();
	//某个模型的resize
	ThreeApp.initPlugin('resize')
}

/*
 * 根据滚动后的距离与总距离的比例更改相机的z轴
 * 通过给canvas动态给class实现sticky
 * 当滚动超过时，停止渲染
 */
api.prototype.onWindowScroll = function(e) {
		var Scrollw= changeWH.w();
	var Scrollh = changeWH.h();
		if(!isPCFlag) {
			if(isPortrait) {
				Scrollw = changeWH.w();
				Scrollh = changeWH.h();   
			} else {              
				Scrollw = changeWH.h()>=changeWH.w()?changeWH.h():changeWH.w();
				Scrollh = changeWH.h()<changeWH.w()?changeWH.h():changeWH.w();   
			}
			}
			
			
	var max = Scrollh * ThreeApp.maxZoom;
	
	var top = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
	var point = max * (ThreeApp.maxZoom - 1) / ThreeApp.maxZoom;
	if(top >= max) {
		clearTimeout(timer);
		ThreeApp.stopAnimation()

	} else {
		//未启动时，再次启动
		if(!MeowGodThree.animationId) {
			ThreeApp.initPlugin('animate');

			clearTimeout(timer);
			timer = setTimeout(function() {
				ThreeApp.stopAnimation()
			}, 180000)
		}
	}

	//清除canvas的class
	if(ThreeApp.canvas) {
		ThreeApp.canvas.className = '';
	}

	if(ThreeApp.canvas1) {
		ThreeApp.canvas1.className = '';
	}

	if(top > point) {

		if(ThreeApp.canvas) {
			ThreeApp.canvas.className = 'sticky';

		} else {
			ThreeApp.canvas = MeowGodThree.wrapper.getElementsByTagName('canvas')[0];
			if(ThreeApp.canvas) {
				ThreeApp.canvas.className = 'sticky';
			}
		}

		if(ThreeApp.canvas1) {
			ThreeApp.canvas1.className = 'sticky';
		} else {
			ThreeApp.canvas1 = MeowGodThree.wrapper.getElementsByTagName('canvas')[1];
			if(ThreeApp.canvas1) {
				ThreeApp.canvas1.className = 'sticky';
			}
		}
		top = point;
	}
	var s = ThreeApp.maxZoom * ThreeApp.multiple * top / max;
	ThreeApp.initPlugin('camera', s)
}

//提取多余的统一修改
api.prototype.initPlugin = function(name, s) {
	if(name === 'animate') {
		if(MeowGodThree.Genesis) {
			MeowGodThree.Genesis.animate(MeowGodThree.Genesis);
		}
	} else if(name === 'resize') {
		if(MeowGodThree.Genesis) {
			MeowGodThree.Genesis.onWindowResize();
		}

		this.onWindowScroll();
	} else if(name === 'camera') {
		if(MeowGodThree.Genesis && MeowGodThree.Genesis.camera) {
			var cameraPositionZ = s * ThreeApp.multiple + 30;
			MeowGodThree.Genesis.camera.position.z = cameraPositionZ;
			MeowGodThree.Genesis.thirdcamera.position.z = cameraPositionZ;
			//var a=1.2-1.08*(s * ThreeApp.multiple + 30-30)/450;
//			MeowGodThree.Genesis.maskPass.uniforms.viewNum.value = 1.272 - 0.0024 * cameraPositionZ
			MeowGodThree.Genesis.maskPass.uniforms.viewNum.value = 1.377-0.0026 * cameraPositionZ
		}
	}
}

var ThreeApp = new api();