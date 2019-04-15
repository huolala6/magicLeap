// --------------------------------------
// 
//    _  _ _/ .  _  _/ /_ _  _  _        
//   /_|/_ / /|//_  / / //_ /_// /_/     
//   http://activetheory.net     _/      
// 
// --------------------------------------
//   11/26/17 7:10a
// --------------------------------------

window.Global = {};
window.getURL = function(url, target) {
	if(!target) target = "_blank";
	window.open(url, target)
};
if(typeof console === "undefined") {
	window.console = {};
	console.log = console.error = console.info = console.debug = console.warn = console.trace = function() {}
}
if(!window.requestAnimationFrame) {
	window.requestAnimationFrame = function() {
		return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
			window.setTimeout(callback, 1e3 / 60)
		}
	}()
}
window.performance = function() {
	if(window.performance && window.performance.now) return window.performance;
	else return Date
}();
Date.now = Date.now || function() {
	return +new Date
};
window.Class = function(_class, _type) {
	var _this = this || window;
	var _string = _class.toString();
	var _name = _class.toString().match(/function ([^\(]+)/)[1];
	var _static = null;
	if(typeof _type === "function") {
		_static = _type;
		_type = null
	}
	_type = (_type || "").toLowerCase();
	_class.prototype.__call = function() {
		if(this.events) this.events.scope(this)
	};
	if(!_type) {
		_this[_name] = _class;
		_static && _static()
	} else {
		if(_type == "static") {
			_this[_name] = new _class
		} else if(_type == "singleton") {
			_this[_name] = function() {
				var __this = {};
				var _instance;
				__this.instance = function(a, b, c) {
					if(!_instance) _instance = new _class(a, b, c);
					return _instance
				};
				return __this
			}()
		}
	}
	if(this !== window) {
		if(!this.__namespace) this.__namespace = this.constructor.toString().match(/function ([^\(]+)/)[1];
		this[_name]._namespace = this.__namespace
	}
};
window.Inherit = function(child, parent, param) {
	if(typeof param === "undefined") param = child;
	var p = new parent(param, true);
	var save = {};
	for(var method in p) {
		child[method] = p[method];
		save[method] = p[method]
	}
	if(child.__call) child.__call();
	defer(function() {
		for(method in p) {
			if(child[method] && save[method] && child[method] !== save[method]) {
				child["_" + method] = save[method]
			}
		}
		p = save = null;
		child = parent = param = null
	})
};
window.Implement = function(cl, intr) {
	Render.nextFrame(function() {
		var intrface = new intr;
		for(var property in intrface) {
			if(typeof cl[property] === "undefined") {
				throw "Interface Error: Missing Property: " + property + " ::: " + intr
			} else {
				var type = typeof intrface[property];
				if(typeof cl[property] != type) throw "Interface Error: Property " + property + " is Incorrect Type ::: " + intr
			}
		}
	})
};
window.Namespace = function(name) {
	if(typeof name === "string") window[name] = {
		Class: window.Class
	};
	else name.Class = window.Class
};
window.Interface = function(display) {
	var name = display.toString().match(/function ([^\(]+)/)[1];
	Hydra.INTERFACES[name] = display
};
window.THREAD = false;
Class(function HydraObject(_selector, _type, _exists, _useFragment) {
	this._children = new LinkedList;
	this.__useFragment = _useFragment;
	this._initSelector(_selector, _type, _exists)
}, () => {
	var prototype = HydraObject.prototype;
	prototype._initSelector = function(_selector, _type, _exists) {
		if(_selector && typeof _selector !== "string") {
			this.div = _selector
		} else {
			var first = _selector ? _selector.charAt(0) : null;
			var name = _selector ? _selector.slice(1) : null;
			if(first != "." && first != "#") {
				name = _selector;
				first = "."
			}
			if(!_exists) {
				this._type = _type || "div";
				if(this._type == "svg") {
					this.div = document.createElementNS("http://www.w3.org/2000/svg", this._type);
					this.div.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
				} else {
					this.div = document.createElement(this._type);
					if(first) {
						if(first == "#") this.div.id = name;
						else this.div.className = name
					}
				}
			} else {
				if(first != "#") throw "Hydra Selectors Require #ID";
				this.div = document.getElementById(name)
			}
		}
		this.div.hydraObject = this
	};
	prototype.addChild = prototype.add = function(child) {
		var div = this.div;
		var createFrag = function() {
			if(this.__useFragment) {
				if(!this._fragment) {
					this._fragment = document.createDocumentFragment();
					var _this = this;
					defer(function() {
						if(!_this._fragment || !_this.div) return _this._fragment = null;
						_this.div.appendChild(_this._fragment);
						_this._fragment = null
					})
				}
				div = this._fragment
			}
		};
		if(child.element && child.element instanceof HydraObject) {
			createFrag();
			div.appendChild(child.element.div);
			this._children.push(child.element);
			child.element._parent = this;
			child.element.div.parentNode = this.div
		} else if(child.div) {
			createFrag();
			div.appendChild(child.div);
			this._children.push(child);
			child._parent = this;
			child.div.parentNode = this.div
		} else if(child.nodeName) {
			createFrag();
			div.appendChild(child);
			child.parentNode = this.div
		}
		return this
	};
	prototype.clone = function() {
		return $(this.div.cloneNode(true))
	};
	prototype.create = function(name, type) {
		var $obj = $(name, type);
		this.addChild($obj);
		if(this.__root) {
			this.__root.__append[name] = $obj;
			$obj.__root = this.__root
		}
		return $obj
	};
	prototype.empty = function() {
		var child = this._children.start();
		while(child) {
			if(child && child.remove) child.remove();
			child = this._children.next()
		}
		this.div.innerHTML = "";
		return this
	};
	prototype.parent = function() {
		return this._parent
	};
	prototype.children = function() {
		return this.div.children ? this.div.children : this.div.childNodes
	};
	prototype.append = function(callback, params) {
		if(!this.__root) {
			this.__root = this;
			this.__append = {}
		}
		return callback.apply(this, params)
	};
	prototype.removeChild = function(object, keep) {
		try {
			object.div.parentNode.removeChild(object.div)
		} catch(e) {};
		if(!keep) this._children.remove(object)
	};
	prototype.remove = prototype.destroy = function() {
		this.removed = true;
		var parent = this._parent;
		if(!!(parent && !parent.removed && parent.removeChild)) parent.removeChild(this, true);
		var child = this._children.start();
		while(child) {
			if(child && child.remove) child.remove();
			child = this._children.next()
		}
		this._children.destroy();
		this.div.hydraObject = null;
		Utils.nullObject(this)
	}
});
Class(function Hydra() {
	var _this = this;
	var _inter, _pool;
	var _readyCallbacks = [];
	this.READY = false;
	this.HASH = window.location.hash.slice(1);
	this.LOCAL = !window._BUILT_ && (location.hostname.indexOf("local") > -1 || location.hostname.split(".")[0] == "10" || location.hostname.split(".")[0] == "192");
	(function() {
		initLoad()
	}());

	function initLoad() {
		if(!document || !window) return setTimeout(initLoad, 1);
		if(window._NODE_ || window._GLES_) {
			_this.addEvent = "addEventListener";
			_this.removeEvent = "removeEventListener";
			return setTimeout(loaded, 1)
		}
		if(window.addEventListener) {
			_this.addEvent = "addEventListener";
			_this.removeEvent = "removeEventListener";
			window.addEventListener("load", loaded, false)
		} else {
			_this.addEvent = "attachEvent";
			_this.removeEvent = "detachEvent";
			window.attachEvent("onload", loaded)
		}
	}

	function loaded() {
		if(window.removeEventListener) window.removeEventListener("load", loaded, false);
		if(!_readyCallbacks) return;
		for(var i = 0; i < _readyCallbacks.length; i++) {
			_readyCallbacks[i]()
		}
		_readyCallbacks = null;
		_this.READY = true;
		if(window.Main) Hydra.Main = new window.Main
	}
	this.development = function(flag, array) {
		var matchArray = function(prop) {
			if(!array) return false;
			for(var i = 0; i < array.length; i++) {
				if(prop.strpos(array[i])) return true
			}
			return false
		};
		clearInterval(_inter);
		if(flag) {
			_inter = setInterval(function() {
				for(var prop in window) {
					if(prop.strpos("webkit")) continue;
					var obj = window[prop];
					if(typeof obj !== "function" && prop.length > 2) {
						if(prop.strpos("_ga") || prop.strpos("_typeface_js") || matchArray(prop)) continue;
						var char1 = prop.charAt(0);
						var char2 = prop.charAt(1);
						if(char1 == "_" || char1 == "$") {
							if(char2 !== char2.toUpperCase()) {
								console.log(window[prop]);
								throw "Hydra Warning:: " + prop + " leaking into global scope"
							}
						}
					}
				}
			}, 1e3)
		}
	};
	this.getArguments = function(value) {
		var saved = this.arguments;
		var args = [];
		for(var i = 1; i < saved.length; i++) {
			if(saved[i] !== null) args.push(saved[i])
		}
		return args
	};
	this.getClassName = function(obj) {
		return obj.constructor.name || obj.constructor.toString().match(/function ([^\(]+)/)[1]
	};
	this.ready = function(callback) {
		if(this.READY) return callback();
		_readyCallbacks.push(callback)
	};
	this.$ = function(selector, type, exists) {
		return new HydraObject(selector, type, exists)
	};
	this.__triggerReady = function() {
		loaded()
	};
	this.setPageOffset = function(x, y) {
		_this.__offset = {
			x: x,
			y: y
		};
		Stage.css({
			left: x,
			top: y,
			width: Stage.width - x,
			height: Stage.height - y
		})
	};
	this.INTERFACES = {};
	this.HTML = {};
	this.JSON = {};
	this.SVG = {};
	this.$.fn = HydraObject.prototype;
	window.$ = this.$;
	window.ready = this.ready
}, "Static");
Hydra.ready(function() {
	window.__window = $(window);
	window.__document = $(document);
	window.__body = $(document.getElementsByTagName("body")[0]);
	window.Stage = window.Stage ? $(window.Stage) : __body.create("#Stage");
	Stage.size("100%");
	Stage.__useFragment = true;
	Stage.width = document.body.clientWidth || document.documentElement.offsetWidth || window.innerWidth;
	Stage.height = document.body.clientHeight || document.documentElement.offsetHeight || window.innerHeight;
	(function() {
		var _time = Date.now();
		var _last;
		setTimeout(function() {
			var list = ["hidden", "msHidden", "webkitHidden"];
			var hidden, eventName;
			(function() {
				for(var key in list) {
					if(document[list[key]] !== "undefined") {
						hidden = list[key];
						switch(hidden) {
							case "hidden":
								eventName = "visibilitychange";
								break;
							case "msHidden":
								eventName = "msvisibilitychange";
								break;
							case "webkitHidden":
								eventName = "webkitvisibilitychange";
								break
						}
						return
					}
				}
			}());
			if(typeof document[hidden] === "undefined") {
				if(Device.browser.ie) {
					document.onfocus = onfocus;
					document.onblur = onblur
				} else {
					window.onfocus = onfocus;
					window.onblur = onblur
				}
			} else {
				document.addEventListener(eventName, function() {
					var time = Date.now();
					if(time - _time > 10) {
						if(document[hidden] === false) onfocus();
						else onblur()
					}
					_time = time
				})
			}
		}, 250);

		function onfocus() {
			if(_last != "focus") HydraEvents._fireEvent(HydraEvents.BROWSER_FOCUS, {
				type: "focus"
			});
			_last = "focus"
		}

		function onblur() {
			if(_last != "blur") HydraEvents._fireEvent(HydraEvents.BROWSER_FOCUS, {
				type: "blur"
			});
			_last = "blur"
		}
	}());
	window.onresize = function() {
		if(!Device.mobile) {
			Stage.width = document.body.clientWidth || document.documentElement.offsetWidth || window.innerWidth;
			Stage.height = document.body.clientHeight || document.documentElement.offsetHeight || window.innerHeight;
			if(Hydra.__offset) {
				Stage.width -= Hydra.__offset.x;
				Stage.height -= Hydra.__offset.y;
				Stage.css({
					width: Stage.width,
					height: Stage.height
				})
			}
			HydraEvents._fireEvent(HydraEvents.RESIZE)
		}
	}
});
(function() {
	$.fn.text = function(text) {
		if(typeof text !== "undefined") {
			if(this.__cacheText != text) this.div.textContent = text;
			this.__cacheText = text;
			return this
		} else {
			return this.div.textContent
		}
	};
	$.fn.html = function(text, force) {
		if(text && !text.strpos("<") && !force) return this.text(text);
		if(typeof text !== "undefined") {
			this.div.innerHTML = text;
			return this
		} else {
			return this.div.innerHTML
		}
	};
	$.fn.hide = function() {
		this.div.style.display = "none";
		return this
	};
	$.fn.show = function() {
		this.div.style.display = "";
		return this
	};
	$.fn.visible = function() {
		this.div.style.visibility = "visible";
		return this
	};
	$.fn.invisible = function() {
		this.div.style.visibility = "hidden";
		return this
	};
	$.fn.setZ = function(z) {
		this.div.style.zIndex = z;
		return this
	};
	$.fn.clearAlpha = function() {
		this.div.style.opacity = "";
		return this
	};
	$.fn.size = function(w, h, noScale) {
		if(typeof w === "string") {
			if(typeof h === "undefined") h = "100%";
			else if(typeof h !== "string") h = h + "px";
			this.div.style.width = w;
			this.div.style.height = h
		} else {
			this.div.style.width = w + "px";
			this.div.style.height = h + "px";
			if(!noScale) this.div.style.backgroundSize = w + "px " + h + "px"
		}
		this.width = w;
		this.height = h;
		return this
	};
	$.fn.mouseEnabled = function(bool) {
		this.div.style.pointerEvents = bool ? "auto" : "none";
		return this
	};
	$.fn.fontStyle = function(family, size, color, style) {
		var font = {};
		if(family) font.fontFamily = family;
		if(size) font.fontSize = size;
		if(color) font.color = color;
		if(style) font.fontStyle = style;
		this.css(font);
		return this
	};
	$.fn.bg = function(src, x, y, repeat) {
		if(!src) return this;
		if(src.strpos(".")) src = Images.getPath(src);
		if(!src.strpos(".")) this.div.style.backgroundColor = src;
		else this.div.style.backgroundImage = "url(" + src + ")";
		if(typeof x !== "undefined") {
			x = typeof x == "number" ? x + "px" : x;
			y = typeof y == "number" ? y + "px" : y;
			this.div.style.backgroundPosition = x + " " + y
		}
		if(repeat) {
			this.div.style.backgroundSize = "";
			this.div.style.backgroundRepeat = repeat
		}
		if(x == "cover" || x == "contain") {
			this.div.style.backgroundSize = x;
			this.div.style.backgroundPosition = typeof y != "undefined" ? y + " " + repeat : "center"
		}
		return this
	};
	$.fn.center = function(x, y, noPos) {
		var css = {};
		if(typeof x === "undefined") {
			css.left = "50%";
			css.top = "50%";
			css.marginLeft = -this.width / 2;
			css.marginTop = -this.height / 2
		} else {
			if(x) {
				css.left = "50%";
				css.marginLeft = -this.width / 2
			}
			if(y) {
				css.top = "50%";
				css.marginTop = -this.height / 2
			}
		}
		if(noPos) {
			delete css.left;
			delete css.top
		}
		this.css(css);
		return this
	};
	$.fn.mask = function(arg, x, y, w, h) {
		this.div.style[CSS.prefix("Mask")] = (arg.strpos(".") ? "url(" + arg + ")" : arg) + " no-repeat";
		this.div.style[CSS.prefix("MaskSize")] = "contain";
		return this
	};
	$.fn.blendMode = function(mode, bg) {
		if(bg) {
			this.div.style["background-blend-mode"] = mode
		} else {
			this.div.style["mix-blend-mode"] = mode
		}
		return this
	};
	$.fn.css = function(obj, value) {
		if(typeof value == "boolean") {
			skip = value;
			value = null
		}
		if(typeof obj !== "object") {
			if(!value) {
				var style = this.div.style[obj];
				if(typeof style !== "number") {
					if(style.strpos("px")) style = Number(style.slice(0, -2));
					if(obj == "opacity") style = !isNaN(Number(this.div.style.opacity)) ? Number(this.div.style.opacity) : 1
				}
				if(!style) style = 0;
				return style
			} else {
				this.div.style[obj] = value;
				return this
			}
		}
		TweenManager.clearCSSTween(this);
		for(var type in obj) {
			var val = obj[type];
			if(!(typeof val === "string" || typeof val === "number")) continue;
			if(typeof val !== "string" && type != "opacity" && type != "zIndex") val += "px";
			this.div.style[type] = val
		}
		return this
	};
	$.fn.transform = function(props) {
		if(this.multiTween && this.cssTweens && this._cssTweens.length > 1 && this.__transformTime && Render.TIME - this.__transformTime < 15) return;
		this.__transformTime = Render.TIME;
		TweenManager.clearCSSTween(this);
		if(Device.tween.css2d) {
			if(!props) {
				props = this
			} else {
				for(var key in props) {
					if(typeof props[key] === "number") this[key] = props[key]
				}
			}
			var transformString;
			if(!this._matrix) {
				transformString = TweenManager.parseTransform(props)
			} else {
				if(this._matrix.type == "matrix2") {
					this._matrix.setTRS(this.x, this.y, this.rotation, this.scaleX || this.scale, this.scaleY || this.scale)
				} else {
					this._matrix.setTRS(this.x, this.y, this.z, this.rotationX, this.rotationY, this.rotationZ, this.scaleX || this.scale, this.scaleY || this.scale, this.scaleZ || this.scale)
				}
				transformString = this._matrix.getCSS()
			}
			if(this.__transformCache != transformString) {
				this.div.style[Device.styles.vendorTransform] = transformString;
				this.__transformCache = transformString
			}
		}
		return this
	};
	$.fn.useMatrix3D = function() {
		this._matrix = new Matrix4;
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.rotationX = 0;
		this.rotationY = 0;
		this.rotationZ = 0;
		this.scale = 1;
		return this
	};
	$.fn.useMatrix2D = function() {
		this._matrix = new Matrix2;
		this.x = 0;
		this.y = 0;
		this.rotation = 0;
		this.scale = 1;
		return this
	};
	$.fn.willChange = function(props) {
		if(typeof props === "boolean") {
			if(props === true) this._willChangeLock = true;
			else this._willChangeLock = false
		} else {
			if(this._willChangeLock) return
		}
		var string = typeof props === "string";
		if((!this._willChange || string) && typeof props !== "null") {
			this._willChange = true;
			this.div.style["will-change"] = string ? props : Device.transformProperty + ", opacity"
		} else {
			this._willChange = false;
			this.div.style["will-change"] = ""
		}
	};
	$.fn.backfaceVisibility = function(visible) {
		if(visible) this.div.style[CSS.prefix("BackfaceVisibility")] = "visible";
		else this.div.style[CSS.prefix("BackfaceVisibility")] = "hidden"
	};
	$.fn.enable3D = function(perspective, x, y) {
		this.div.style[CSS.prefix("TransformStyle")] = "preserve-3d";
		if(perspective) this.div.style[CSS.prefix("Perspective")] = perspective + "px";
		if(typeof x !== "undefined") {
			x = typeof x === "number" ? x + "px" : x;
			y = typeof y === "number" ? y + "px" : y;
			this.div.style[CSS.prefix("PerspectiveOrigin")] = x + " " + y
		}
		return this
	};
	$.fn.disable3D = function() {
		this.div.style[CSS.prefix("TransformStyle")] = "";
		this.div.style[CSS.prefix("Perspective")] = "";
		return this
	};
	$.fn.transformPoint = function(x, y, z) {
		var origin = "";
		if(typeof x !== "undefined") origin += typeof x === "number" ? x + "px " : x + " ";
		if(typeof y !== "undefined") origin += typeof y === "number" ? y + "px " : y + " ";
		if(typeof z !== "undefined") origin += typeof z === "number" ? z + "px" : z;
		this.div.style[CSS.prefix("TransformOrigin")] = origin;
		return this
	};
	$.fn.tween = function(props, time, ease, delay, callback, manual) {
		if(typeof delay === "boolean") {
			manual = delay;
			delay = 0;
			callback = null
		} else if(typeof delay === "function") {
			callback = delay;
			delay = 0
		}
		if(typeof callback === "boolean") {
			manual = callback;
			callback = null
		}
		if(!delay) delay = 0;
		var usePromise = null;
		if(callback && callback instanceof Promise) {
			usePromise = callback;
			callback = callback.resolve
		}
		var tween = TweenManager._detectTween(this, props, time, ease, delay, callback, manual);
		return usePromise || tween
	};
	$.fn.clearTransform = function() {
		if(typeof this.x === "number") this.x = 0;
		if(typeof this.y === "number") this.y = 0;
		if(typeof this.z === "number") this.z = 0;
		if(typeof this.scale === "number") this.scale = 1;
		if(typeof this.scaleX === "number") this.scaleX = 1;
		if(typeof this.scaleY === "number") this.scaleY = 1;
		if(typeof this.rotation === "number") this.rotation = 0;
		if(typeof this.rotationX === "number") this.rotationX = 0;
		if(typeof this.rotationY === "number") this.rotationY = 0;
		if(typeof this.rotationZ === "number") this.rotationZ = 0;
		if(typeof this.skewX === "number") this.skewX = 0;
		if(typeof this.skewY === "number") this.skewY = 0;
		this.div.style[Device.styles.vendorTransform] = "";
		return this
	};
	$.fn.stopTween = function() {
		if(this._cssTween) this._cssTween.stop();
		if(this._mathTween) this._mathTween.stop();
		return this
	};
	$.fn.keypress = function(callback) {
		this.div.onkeypress = function(e) {
			e = e || window.event;
			e.code = e.keyCode ? e.keyCode : e.charCode;
			if(callback) callback(e)
		}
	};
	$.fn.keydown = function(callback) {
		this.div.onkeydown = function(e) {
			e = e || window.event;
			e.code = e.keyCode;
			if(callback) callback(e)
		}
	};
	$.fn.keyup = function(callback) {
		this.div.onkeyup = function(e) {
			e = e || window.event;
			e.code = e.keyCode;
			if(callback) callback(e)
		}
	};
	$.fn.attr = function(attr, value) {
		if(attr && value) {
			if(value == "") this.div.removeAttribute(attr);
			else this.div.setAttribute(attr, value)
		} else if(attr) {
			return this.div.getAttribute(attr)
		}
		return this
	};
	$.fn.val = function(value) {
		if(typeof value === "undefined") {
			return this.div.value
		} else {
			this.div.value = value
		}
		return this
	};
	$.fn.change = function(callback) {
		var _this = this;
		if(this._type == "select") {
			this.div.onchange = function() {
				callback({
					object: _this,
					value: _this.div.value || ""
				})
			}
		}
	};
	$.fn.svgSymbol = function(id, width, height) {
		var config = SVG.getSymbolConfig(id);
		var svgHTML = '<svg viewBox="0 0 ' + config.width + " " + config.height + '" width="' + width + '" height="' + height + '">' + '<use xlink:href="#' + config.id + '" x="0" y="0" />' + "</svg>";
		this.html(svgHTML, true)
	}
}());
(function() {
	var windowsPointer = !!window.MSGesture;
	var translateEvent = function(evt) {
		if(Hydra.addEvent == "attachEvent") {
			switch(evt) {
				case "click":
					return "onclick";
					break;
				case "mouseover":
					return "onmouseover";
					break;
				case "mouseout":
					return "onmouseleave";
					break;
				case "mousedown":
					return "onmousedown";
					break;
				case "mouseup":
					return "onmouseup";
					break;
				case "mousemove":
					return "onmousemove";
					break
			}
		}
		if(windowsPointer) {
			switch(evt) {
				case "touchstart":
					return "pointerdown";
					break;
				case "touchmove":
					return "MSGestureChange";
					break;
				case "touchend":
					return "pointerup";
					break
			}
		}
		return evt
	};
	$.fn.click = function(callback) {
		var _this = this;

		function click(e) {
			if(!_this.div) return false;
			if(Mouse._preventClicks) return false;
			e.object = _this.div.className == "hit" ? _this.parent() : _this;
			e.action = "click";
			if(!e.pageX) {
				e.pageX = e.clientX;
				e.pageY = e.clientY
			}
			if(callback) callback(e);
			if(Mouse.autoPreventClicks) Mouse.preventClicks()
		}
		this.div[Hydra.addEvent](translateEvent("click"), click, true);
		this.div.style.cursor = "pointer";
		return this
	};
	$.fn.hover = function(callback) {
		var _this = this;
		var _over = false;
		var _time;

		function hover(e) {
			if(!_this.div) return false;
			var time = Date.now();
			var original = e.toElement || e.relatedTarget;
			if(_time && time - _time < 5) {
				_time = time;
				return false
			}
			_time = time;
			e.object = _this.div.className == "hit" ? _this.parent() : _this;
			switch(e.type) {
				case "mouseout":
					e.action = "out";
					break;
				case "mouseleave":
					e.action = "out";
					break;
				default:
					e.action = "over";
					break
			}
			if(_over) {
				if(Mouse._preventClicks) return false;
				if(e.action == "over") return false;
				if(e.action == "out") {
					if(isAChild(_this.div, original)) return false
				}
				_over = false
			} else {
				if(e.action == "out") return false;
				_over = true
			}
			if(!e.pageX) {
				e.pageX = e.clientX;
				e.pageY = e.clientY
			}
			if(callback) callback(e)
		}

		function isAChild(div, object) {
			var len = div.children.length - 1;
			for(var i = len; i > -1; i--) {
				if(object == div.children[i]) return true
			}
			for(i = len; i > -1; i--) {
				if(isAChild(div.children[i], object)) return true
			}
		}
		this.div[Hydra.addEvent](translateEvent("mouseover"), hover, true);
		this.div[Hydra.addEvent](translateEvent("mouseout"), hover, true);
		return this
	};
	$.fn.press = function(callback) {
		var _this = this;

		function press(e) {
			if(!_this.div) return false;
			e.object = _this.div.className == "hit" ? _this.parent() : _this;
			switch(e.type) {
				case "mousedown":
					e.action = "down";
					break;
				default:
					e.action = "up";
					break
			}
			if(!e.pageX) {
				e.pageX = e.clientX;
				e.pageY = e.clientY
			}
			if(callback) callback(e)
		}
		this.div[Hydra.addEvent](translateEvent("mousedown"), press, true);
		this.div[Hydra.addEvent](translateEvent("mouseup"), press, true);
		return this
	};
	$.fn.bind = function(evt, callback) {
		if(!this._events) this._events = {};
		if(windowsPointer && this == __window) {
			return Stage.bind(evt, callback)
		}
		if(evt == "touchstart") {
			if(!Device.mobile) evt = "mousedown"
		} else if(evt == "touchmove") {
			if(!Device.mobile) evt = "mousemove";
			if(windowsPointer && !this.div.msGesture) {
				this.div.msGesture = new MSGesture;
				this.div.msGesture.target = this.div
			}
		} else if(evt == "touchend") {
			if(!Device.mobile) evt = "mouseup"
		}
		this._events["bind_" + evt] = this._events["bind_" + evt] || [];
		var _events = this._events["bind_" + evt];
		var e = {};
		var target = this.div;
		e.callback = callback;
		e.target = this.div;
		_events.push(e);

		function touchEvent(e) {
			if(windowsPointer && target.msGesture && evt == "touchstart") {
				target.msGesture.addPointer(e.pointerId)
			}
			var touch = Utils.touchEvent(e);
			if(windowsPointer) {
				var windowsEvt = e;
				e = {};
				e.x = Number(windowsEvt.pageX || windowsEvt.clientX);
				e.y = Number(windowsEvt.pageY || windowsEvt.clientY);
				e.target = windowsEvt.target;
				e.currentTarget = windowsEvt.currentTarget;
				e.path = [];
				var node = e.target;
				while(node) {
					e.path.push(node);
					node = node.parentElement || null
				}
				e.windowsPointer = true
			} else {
				e.x = touch.x;
				e.y = touch.y
			}
			for(var i = 0; i < _events.length; i++) {
				var ev = _events[i];
				if(ev.target == e.currentTarget) {
					ev.callback(e)
				}
			}
		}
		if(!this._events["fn_" + evt]) {
			this._events["fn_" + evt] = touchEvent;
			this.div[Hydra.addEvent](translateEvent(evt), touchEvent, true)
		}
		return this
	};
	$.fn.unbind = function(evt, callback) {
		if(!this._events) this._events = {};
		if(windowsPointer && this == __window) {
			return Stage.unbind(evt, callback)
		}
		if(evt == "touchstart") {
			if(!Device.mobile) evt = "mousedown"
		} else if(evt == "touchmove") {
			if(!Device.mobile) evt = "mousemove"
		} else if(evt == "touchend") {
			if(!Device.mobile) evt = "mouseup"
		}
		var _events = this._events["bind_" + evt];
		if(!_events) return this;
		for(var i = 0; i < _events.length; i++) {
			var ev = _events[i];
			if(ev.callback == callback) _events.splice(i, 1)
		}
		if(this._events["fn_" + evt] && !_events.length) {
			this.div[Hydra.removeEvent](translateEvent(evt), this._events["fn_" + evt], Device.mobile ? {
				passive: true
			} : true);
			this._events["fn_" + evt] = null
		}
		return this
	};
	$.fn.interact = function(overCallback, clickCallback) {
		if(!this.hit) {
			this.hit = $(".hit");
			this.hit.css({
				width: "100%",
				height: "100%",
				zIndex: 99999,
				top: 0,
				left: 0,
				position: "absolute"
			});
			this.addChild(this.hit)
		}
		if(!Device.mobile) this.hit.hover(overCallback).click(clickCallback);
		else this.hit.touchClick(overCallback, clickCallback)
	};
	$.fn.touchSwipe = function(callback, distance) {
		if(!window.addEventListener) return this;
		var _this = this;
		var _distance = distance || 75;
		var _startX, _startY;
		var _moving = false;
		var _move = {};
		if(Device.mobile) {
			this.div.addEventListener(translateEvent("touchstart"), touchStart, {
				passive: true
			});
			this.div.addEventListener(translateEvent("touchend"), touchEnd, {
				passive: true
			});
			this.div.addEventListener(translateEvent("touchcancel"), touchEnd, {
				passive: true
			})
		}

		function touchStart(e) {
			var touch = Utils.touchEvent(e);
			if(!_this.div) return false;
			if(e.touches.length == 1) {
				_startX = touch.x;
				_startY = touch.y;
				_moving = true;
				_this.div.addEventListener(translateEvent("touchmove"), touchMove, {
					passive: true
				})
			}
		}

		function touchMove(e) {
			if(!_this.div) return false;
			if(_moving) {
				var touch = Utils.touchEvent(e);
				var dx = _startX - touch.x;
				var dy = _startY - touch.y;
				_move.direction = null;
				_move.moving = null;
				_move.x = null;
				_move.y = null;
				_move.evt = e;
				if(Math.abs(dx) >= _distance) {
					touchEnd();
					if(dx > 0) {
						_move.direction = "left"
					} else {
						_move.direction = "right"
					}
				} else if(Math.abs(dy) >= _distance) {
					touchEnd();
					if(dy > 0) {
						_move.direction = "up"
					} else {
						_move.direction = "down"
					}
				} else {
					_move.moving = true;
					_move.x = dx;
					_move.y = dy
				}
				if(callback) callback(_move, e)
			}
		}

		function touchEnd(e) {
			if(!_this.div) return false;
			_startX = _startY = _moving = false;
			_this.div.removeEventListener(translateEvent("touchmove"), touchMove)
		}
		return this
	};
	$.fn.touchClick = function(hover, click) {
		if(!window.addEventListener) return this;
		var _this = this;
		var _time, _move;
		var _start = {};
		var _touch = {};
		if(Device.mobile) {
			this.div.addEventListener(translateEvent("touchmove"), touchMove, {
				passive: true
			});
			this.div.addEventListener(translateEvent("touchstart"), touchStart, {
				passive: true
			});
			this.div.addEventListener(translateEvent("touchend"), touchEnd, {
				passive: true
			})
		}

		function touchMove(e) {
			if(!_this.div) return false;
			_touch = Utils.touchEvent(e);
			if(Utils.findDistance(_start, _touch) > 5) {
				_move = true
			} else {
				_move = false
			}
		}

		function setTouch(e) {
			var touch = Utils.touchEvent(e);
			e.touchX = touch.x;
			e.touchY = touch.y;
			_start.x = e.touchX;
			_start.y = e.touchY
		}

		function touchStart(e) {
			if(!_this.div) return false;
			_time = Date.now();
			e.action = "over";
			e.object = _this.div.className == "hit" ? _this.parent() : _this;
			setTouch(e);
			if(hover && !_move) hover(e)
		}

		function touchEnd(e) {
			if(!_this.div) return false;
			var time = Date.now();
			var clicked = false;
			e.object = _this.div.className == "hit" ? _this.parent() : _this;
			setTouch(e);
			if(_time && time - _time < 750) {
				if(Mouse._preventClicks) return false;
				if(click && !_move) {
					clicked = true;
					e.action = "click";
					if(click && !_move) click(e);
					if(Mouse.autoPreventClicks) Mouse.preventClicks()
				}
			}
			if(hover) {
				e.action = "out";
				if(!Mouse._preventFire) hover(e)
			}
			_move = false
		}
		return this
	}
}());
Class(function MVC() {
	Inherit(this, Events);
	var _setters = {};
	var _active = {};
	var _timers = [];
	this.classes = {};

	function defineSetter(_this, prop) {
		_setters[prop] = {};
		Object.defineProperty(_this, prop, {
			set: function(v) {
				if(_setters[prop] && _setters[prop].s) _setters[prop].s.call(_this, v);
				v = null
			},
			get: function() {
				if(_setters[prop] && _setters[prop].g) return _setters[prop].g.apply(_this)
			}
		})
	}
	this.set = function(prop, callback) {
		if(!_setters[prop]) defineSetter(this, prop);
		_setters[prop].s = callback
	};
	this.get = function(prop, callback) {
		if(!_setters[prop]) defineSetter(this, prop);
		_setters[prop].g = callback
	};
	this.delayedCall = function(callback, time, params) {
		var _this = this;
		var timer = Timer.create(function() {
			if(_this.destroy) {
				callback && callback(params)
			}
			_this = callback = null
		}, time || 0);
		_timers.push(timer);
		if(_timers.length > 20) _timers.shift();
		return timer
	};
	this.initClass = function(clss, a, b, c, d, e, f, g) {
		var name = Utils.timestamp();
		if(window.Hydra) Hydra.arguments = arguments;
		var child = new clss(a, b, c, d, e, f, g);
		if(window.Hydra) Hydra.arguments = null;
		child.parent = this;
		if(child.destroy) {
			this.classes[name] = child;
			this.classes[name].__id = name
		}
		var lastArg = arguments[arguments.length - 1];
		if(Array.isArray(lastArg) && lastArg.length == 1 && lastArg[0] instanceof HydraObject) lastArg[0].addChild(child);
		else if(this.element && lastArg !== null) this.element.addChild(child);
		return child
	};
	this.destroy = function() {
		if(this.onDestroy) this.onDestroy();
		if(this.__renderLoop) Render.stop(this.__renderLoop);
		for(var i in this.classes) {
			var clss = this.classes[i];
			if(clss && clss.destroy) clss.destroy()
		}
		this.clearTimers && this.clearTimers();
		this.classes = null;
		if(this.events) this.events = this.events.destroy();
		if(this.element && this.element.remove) this.element = this.container = this.element.remove();
		if(this.parent && this.parent.__destroyChild) this.parent.__destroyChild(this.__id);
		return Utils.nullObject(this)
	};
	this.clearTimers = function() {
		for(let i = 0; i < _timers.length; i++) clearTimeout(_timers[i]);
		_timers.length = 0
	};
	this.active = function(name, value, time) {
		if(typeof value !== "undefined") {
			_active[name] = value;
			if(time) {
				this.delayedCall(function() {
					_active[name] = !_active[name]
				}, time)
			}
		} else {
			return _active[name]
		}
	};
	this.wait = function(callback, object, key) {
		var _this = this;
		if(!!object[key]) callback();
		else _this.delayedCall(function() {
			_this.wait(callback, object, key)
		}, 32)
	};
	this.__destroyChild = function(name) {
		delete this.classes[name]
	}
});
Class(function Model(name) {
	Inherit(this, MVC);
	var _storage = {};
	var _data = 0;
	var _triggered = 0;
	this.push = function(name, val) {
		_storage[name] = val
	};
	this.pull = function(name) {
		return _storage[name]
	};
	this.waitForData = this.promiseData = function(num = 1) {
		_data += num
	};
	this.fulfillData = this.resolveData = function() {
		_triggered++;
		if(_triggered == _data) {
			this.dataReady = true
		}
	};
	this.onReady = function(callback) {
		let promise = Promise.create();
		if(callback) promise.then(callback);
		this.wait(() => promise.resolve(), this, "dataReady");
		return promise
	};
	this.initWithData = function(data) {
		this.STATIC_DATA = data;
		for(var key in this) {
			var model = this[key];
			var init = false;
			for(var i in data) {
				if(i.toLowerCase().replace(/-/g, "") == key.toLowerCase()) {
					init = true;
					if(model.init) model.init(data[i])
				}
			}
			if(!init && model.init) model.init()
		}
		this.init && this.init(data)
	};
	this.loadData = function(url, callback) {
		let promise = Promise.create();
		if(!callback) callback = promise.resolve;
		var _this = this;
		XHR.get(url + "?" + Utils.timestamp(), function(d) {
			defer(function() {
				_this.initWithData(d);
				callback(d)
			})
		});
		return promise
	};
	this.Class = function(model) {
		var name = model.toString().match(/function ([^\(]+)/)[1];
		this[name] = new model
	}
});
Class(function View(_child) {
	Inherit(this, MVC);
	var _resize;
	var name = Hydra.getClassName(_child);
	this.element = $("." + name);
	this.element.__useFragment = true;
	this.css = function(obj) {
		this.element.css(obj);
		return this
	};
	this.transform = function(obj) {
		this.element.transform(obj || this);
		return this
	};
	this.tween = function(props, time, ease, delay, callback, manual) {
		return this.element.tween(props, time, ease, delay, callback, manual)
	};
	this.startRender = function(callback) {
		this.__renderLoop = callback;
		Render.start(callback)
	};
	this.stopRender = function(callback) {
		this.__renderLoop = null;
		Render.stop(callback)
	};
	var inter = Hydra.INTERFACES[name] || Hydra.INTERFACES[name + "UI"];
	if(inter) {
		this.ui = {};
		var params = Hydra.getArguments();
		params.push(_child);
		_resize = this.element.append(inter, params);
		var append = this.element.__append;
		for(var key in append) this.ui[key] = append[key];
		if(_resize) {
			this.resize = function() {
				_resize.apply(this.ui, arguments)
			}
		}
	}
	this.__call = function() {
		this.events.scope(this)
	}
});
Class(function Controller(name) {
	Inherit(this, MVC);
	name = Hydra.getClassName(name);
	this.element = this.container = $("#" + name);
	this.element.__useFragment = true;
	this.css = function(obj) {
		this.container.css(obj)
	}
});
Class(function Component() {
	Inherit(this, MVC);
	this.startRender = function(callback) {
		this.__renderLoop = callback;
		Render.start(callback)
	};
	this.stopRender = function(callback) {
		this.__renderLoop = null;
		Render.stop(callback)
	};
	this.__call = function() {
		this.events.scope(this);
		delete this.__call
	}
});
Class(function Utils() {
	var _this = this;
	var _obj = {};
	if(typeof Float32Array == "undefined") Float32Array = Array;
	if(typeof Promise == "undefined") Promise = {};

	function rand(min, max) {
		return lerp(Math.random(), min, max)
	}

	function lerp(ratio, start, end) {
		return start + (end - start) * ratio
	}
	this.doRandom = function(min, max, precision) {
		if(typeof precision == "number") {
			var p = Math.pow(10, precision);
			return Math.round(rand(min, max) * p) / p
		} else {
			return Math.round(rand(min - .5, max + .5))
		}
	};
	this.headsTails = function(heads, tails) {
		return !_this.doRandom(0, 1) ? heads : tails
	};
	this.toDegrees = function(rad) {
		return rad * (180 / Math.PI)
	};
	this.toRadians = function(deg) {
		return deg * (Math.PI / 180)
	};
	this.findDistance = function(p1, p2) {
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;
		return Math.sqrt(dx * dx + dy * dy)
	};
	this.timestamp = function() {
		var num = Date.now() + _this.doRandom(0, 99999);
		return num.toString()
	};
	this.hitTestObject = function(obj1, obj2) {
		var x1 = obj1.x,
			y1 = obj1.y,
			w = obj1.width,
			h = obj1.height;
		var xp1 = obj2.x,
			yp1 = obj2.y,
			wp = obj2.width,
			hp = obj2.height;
		var x2 = x1 + w,
			y2 = y1 + h,
			xp2 = xp1 + wp,
			yp2 = yp1 + hp;
		if(xp1 >= x1 && xp1 <= x2) {
			if(yp1 >= y1 && yp1 <= y2) {
				return true
			} else if(y1 >= yp1 && y1 <= yp2) {
				return true
			}
		} else if(x1 >= xp1 && x1 <= xp2) {
			if(yp1 >= y1 && yp1 <= y2) {
				return true
			} else if(y1 >= yp1 && y1 <= yp2) {
				return true
			}
		}
		return false
	};
	this.randomColor = function() {
		var color = "#" + Math.floor(Math.random() * 16777215).toString(16);
		if(color.length < 7) color = this.randomColor();
		return color
	};
	this.touchEvent = function(e) {
		var touchEvent = {};
		touchEvent.x = 0;
		touchEvent.y = 0;
		if(e.windowsPointer) return e;
		if(!e) return touchEvent;
		if(Device.mobile && (e.touches || e.changedTouches)) {
			if(e.touches.length) {
				touchEvent.x = e.touches[0].pageX;
				touchEvent.y = e.touches[0].pageY - Mobile.scrollTop
			} else {
				touchEvent.x = e.changedTouches[0].pageX;
				touchEvent.y = e.changedTouches[0].pageY - Mobile.scrollTop
			}
		} else {
			touchEvent.x = e.pageX;
			touchEvent.y = e.pageY
		}
		if(Mobile.orientationSet && Mobile.orientation !== Mobile.orientationSet) {
			if(window.orientation == 90 || window.orientation === 0) {
				var x = touchEvent.y;
				touchEvent.y = touchEvent.x;
				touchEvent.x = Stage.width - x
			}
			if(window.orientation == -90 || window.orientation === 180) {
				var y = touchEvent.x;
				touchEvent.x = touchEvent.y;
				touchEvent.y = Stage.height - y
			}
		}
		return touchEvent
	};
	this.clamp = function(num, min, max) {
		return Math.min(Math.max(num, min), max)
	};
	this.constrain = function(num, min, max) {
		return Math.min(Math.max(num, Math.min(min, max)), Math.max(min, max))
	};
	this.nullObject = function(object) {
		if(object.destroy || object.div) {
			for(var key in object) {
				if(typeof object[key] !== "undefined") object[key] = null
			}
		}
		return null
	};
	this.convertRange = this.range = function(oldValue, oldMin, oldMax, newMin, newMax, clamped) {
		var oldRange = oldMax - oldMin;
		var newRange = newMax - newMin;
		var newValue = (oldValue - oldMin) * newRange / oldRange + newMin;
		if(clamped) return _this.clamp(newValue, Math.min(newMin, newMax), Math.max(newMin, newMax));
		return newValue
	};
	this.cloneObject = function(obj) {
		return JSON.parse(JSON.stringify(obj))
	};
	this.mergeObject = function() {
		var obj = {};
		for(var i = 0; i < arguments.length; i++) {
			var o = arguments[i];
			for(var key in o) {
				obj[key] = o[key]
			}
		}
		return obj
	};
	this.mix = function(from, to, alpha) {
		return from * (1 - alpha) + to * alpha
	};
	this.numberWithCommas = function(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	};
	this.query = function(key) {
		return decodeURI(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURI(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"))
	};
	this.smoothstep = function(min, max, value) {
		var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
		return x * x * (3 - 2 * x)
	};
	this.shuffleArray = function(array) {
		var currentIndex = array.length;
		var temporaryValue;
		var randomIndex;
		while(0 !== currentIndex) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue
		}
		return array
	};
	this.sign = function(num) {
		return num < 0 ? -1 : 1
	};
	String.prototype.strpos = function(str) {
		if(Array.isArray(str)) {
			for(var i = 0; i < str.length; i++) {
				if(this.indexOf(str[i]) > -1) return true
			}
			return false
		} else {
			return this.indexOf(str) != -1
		}
	};
	String.prototype.clip = function(num, end) {
		return this.length > num ? this.slice(0, num) + end : this
	};
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1)
	};
	Array.prototype.findAndRemove = function(reference) {
		if(!this.indexOf) return;
		var index = this.indexOf(reference);
		if(index > -1) return this.splice(index, 1)
	};
	Array.prototype.getRandom = function() {
		return this[_this.doRandom(0, this.length - 1)]
	};
	Array.prototype.last = function() {
		return this[this.length - 1]
	};
	Promise.create = function() {
		var promise = new Promise(function(resolve, reject) {
			_obj.resolve = resolve;
			_obj.reject = reject
		});
		promise.resolve = _obj.resolve;
		promise.reject = _obj.reject;
		if(arguments.length) {
			var fn = arguments[0];
			var params = [];
			for(var i = 1; i < arguments.length; i++) params.push(arguments[i]);
			params.push(promise.resolve);
			fn.apply(fn, params)
		}
		_obj.resolve = _obj.reject = null;
		return promise
	}
}, "Static");
Class(function CSS() {
	var _this = this;
	var _obj, _style, _needsUpdate;
	Hydra.ready(function() {
		_style = "";
		_obj = document.createElement("style");
		_obj.type = "text/css";
		document.getElementsByTagName("head")[0].appendChild(_obj)
	});

	function objToCSS(key) {
		var match = key.match(/[A-Z]/);
		var camelIndex = match ? match.index : null;
		if(camelIndex) {
			var start = key.slice(0, camelIndex);
			var end = key.slice(camelIndex);
			key = start + "-" + end.toLowerCase()
		}
		return key
	}

	function cssToObj(key) {
		var match = key.match(/\-/);
		var camelIndex = match ? match.index : null;
		if(camelIndex) {
			var start = key.slice(0, camelIndex);
			var end = key.slice(camelIndex).slice(1);
			var letter = end.charAt(0);
			end = end.slice(1);
			end = letter.toUpperCase() + end;
			key = start + end
		}
		return key
	}

	function setHTML() {
		_obj.innerHTML = _style;
		_needsUpdate = false
	}
	this._read = function() {
		return _style
	};
	this._write = function(css) {
		_style = css;
		if(!_needsUpdate) {
			_needsUpdate = true;
			defer(setHTML)
		}
	};
	this._toCSS = objToCSS;
	this.style = function(selector, obj) {
		var s = selector + " {";
		for(var key in obj) {
			var prop = objToCSS(key);
			var val = obj[key];
			if(typeof val !== "string" && key != "opacity") val += "px";
			s += prop + ":" + val + "!important;"
		}
		s += "}";
		_obj.innerHTML += s
	};
	this.get = function(selector, prop) {
		var values = new Object;
		var string = _obj.innerHTML.split(selector + " {");
		for(var i = 0; i < string.length; i++) {
			var str = string[i];
			if(!str.length) continue;
			var split = str.split("!important;");
			for(var j in split) {
				if(split[j].strpos(":")) {
					var fsplit = split[j].split(":");
					if(fsplit[1].slice(-2) == "px") {
						fsplit[1] = Number(fsplit[1].slice(0, -2))
					}
					values[cssToObj(fsplit[0])] = fsplit[1]
				}
			}
		}
		if(!prop) return values;
		else return values[prop]
	};
	this.textSize = function($obj) {
		var $clone = $obj.clone();
		$clone.css({
			position: "relative",
			cssFloat: "left",
			styleFloat: "left",
			marginTop: -99999,
			width: "",
			height: ""
		});
		__body.addChild($clone);
		var width = $clone.div.offsetWidth;
		var height = $clone.div.offsetHeight;
		$clone.remove();
		return {
			width: width,
			height: height
		}
	};
	this.prefix = function(style) {
		return Device.styles.vendor == "" ? style.charAt(0).toLowerCase() + style.slice(1) : Device.styles.vendor + style
	}
}, "Static");
Class(function Device() {
	var _this = this;
	var _tagDiv;
	this.agent = navigator.userAgent.toLowerCase();
	this.detect = function(array) {
		if(typeof array === "string") array = [array];
		for(var i = 0; i < array.length; i++) {
			if(this.agent.strpos(array[i])) return true
		}
		return false
	};
	var prefix = function() {
		var pre = "";
		if(!window._NODE_ && !window._GLES_) {
			var styles = window.getComputedStyle(document.documentElement, "");
			pre = (Array.prototype.slice.call(styles).join("").match(/-(moz|webkit|ms)-/) || styles.OLink === "" && ["", "o"])[1];
			var dom = "WebKit|Moz|MS|O".match(new RegExp("(" + pre + ")", "i"))[1]
		} else {
			pre = "webkit"
		}
		var IE = _this.detect("trident");
		return {
			unprefixed: IE && !_this.detect("msie 9"),
			dom: dom,
			lowercase: pre,
			css: "-" + pre + "-",
			js: (IE ? pre[0] : pre[0].toUpperCase()) + pre.substr(1)
		}
	}();

	function checkForTag(prop) {
		var div = _tagDiv || document.createElement("div"),
			vendors = "Khtml ms O Moz Webkit".split(" "),
			len = vendors.length;
		_tagDiv = div;
		if(prop in div.style) return true;
		prop = prop.replace(/^[a-z]/, function(val) {
			return val.toUpperCase()
		});
		while(len--) {
			if(vendors[len] + prop in div.style) {
				return true
			}
		}
		return false
	}
	this.mobile = !window._NODE_ && (!!("ontouchstart" in window || "onpointerdown" in window) && this.detect(["ios", "iphone", "ipad", "windows", "android", "blackberry"])) ? {} : false;
	if(this.mobile && this.detect("windows") && !this.detect("touch")) this.mobile = false;
	if(this.mobile) {
		this.mobile.tablet = Math.max(screen.width, screen.height) > 800;
		this.mobile.phone = !this.mobile.tablet
	}
	this.browser = {};
	this.browser.ie = function() {
		if(_this.detect("msie")) return true;
		if(_this.detect("trident") && _this.detect("rv:")) return true;
		if(_this.detect("windows") && _this.detect("edge")) return true
	}();
	this.browser.chrome = !this.browser.ie && this.detect("chrome");
	this.browser.safari = !this.browser.chrome && !this.browser.ie && this.detect("safari");
	this.browser.firefox = this.detect("firefox");
	this.browser.version = function() {
		try {
			if(_this.browser.chrome) return Number(_this.agent.split("chrome/")[1].split(".")[0]);
			if(_this.browser.firefox) return Number(_this.agent.split("firefox/")[1].split(".")[0]);
			if(_this.browser.safari) return Number(_this.agent.split("version/")[1].split(".")[0].split(".")[0]);
			if(_this.browser.ie) {
				if(_this.detect("msie")) return Number(_this.agent.split("msie ")[1].split(".")[0]);
				if(_this.detect("rv:")) return Number(_this.agent.split("rv:")[1].split(".")[0]);
				return Number(_this.agent.split("edge/")[1].split(".")[0])
			}
		} catch(e) {
			return -1
		}
	}();
	this.vendor = prefix.css;
	this.transformProperty = function() {
		switch(prefix.lowercase) {
			case "moz":
				return "-moz-transform";
				break;
			case "webkit":
				return "-webkit-transform";
				break;
			case "o":
				return "-o-transform";
				break;
			case "ms":
				return "-ms-transform";
				break;
			default:
				return "transform";
				break
		}
	}();
	this.system = {};
	this.system.retina = window.devicePixelRatio > 1;
	this.system.webworker = typeof window.Worker !== "undefined";
	this.system.offline = typeof window.applicationCache !== "undefined";
	if(!window._NODE_) {
		this.system.geolocation = typeof navigator.geolocation !== "undefined";
		this.system.pushstate = typeof window.history.pushState !== "undefined"
	}
	this.system.webcam = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
	this.system.language = window.navigator.userLanguage || window.navigator.language;
	this.system.webaudio = typeof window.AudioContext !== "undefined";
	this.system.vr = !!window.VRDisplay;
	try {
		this.system.localStorage = typeof window.localStorage !== "undefined"
	} catch(e) {
		this.system.localStorage = false
	}
	this.system.fullscreen = typeof document[prefix.lowercase + "CancelFullScreen"] !== "undefined";
	this.system.os = function() {
		if(_this.detect("mac os")) return "mac";
		else if(_this.detect("windows nt 6.3")) return "windows8.1";
		else if(_this.detect("windows nt 6.2")) return "windows8";
		else if(_this.detect("windows nt 6.1")) return "windows7";
		else if(_this.detect("windows nt 6.0")) return "windowsvista";
		else if(_this.detect("windows nt 5.1")) return "windowsxp";
		else if(_this.detect("windows")) return "windows";
		else if(_this.detect("linux")) return "linux";
		return "undetected"
	}();
	this.pixelRatio = window.devicePixelRatio;
	this.media = {};
	this.media.audio = function() {
		if(!!document.createElement("audio").canPlayType) {
			return _this.detect(["firefox", "opera"]) ? "ogg" : "mp3"
		} else {
			return false
		}
	}();
	this.media.video = function() {
		var vid = document.createElement("video");
		if(!!vid.canPlayType) {
			if(Device.mobile) return "mp4";
			if(_this.browser.chrome) return "webm";
			if(_this.browser.firefox || _this.browser.opera) {
				if(vid.canPlayType('video/webm; codecs="vorbis,vp8"')) return "webm";
				return "ogv"
			}
			return "mp4"
		} else {
			return false
		}
	}();
	this.media.webrtc = !!(window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection || window.oRTCPeerConnection || window.RTCPeerConnection);
	this.graphics = {};
	this.graphics.webgl = function() {
		try {
			var gl;
			var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
			var canvas = document.createElement("canvas");
			for(var i = 0; i < names.length; i++) {
				gl = canvas.getContext(names[i]);
				if(gl) break
			}
			var info = gl.getExtension("WEBGL_debug_renderer_info");
			var output = {};
			if(info) {
				var gpu = info.UNMASKED_RENDERER_WEBGL;
				output.gpu = gl.getParameter(gpu).toLowerCase()
			}
			output.renderer = gl.getParameter(gl.RENDERER).toLowerCase();
			output.version = gl.getParameter(gl.VERSION).toLowerCase();
			output.glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION).toLowerCase();
			output.extensions = gl.getSupportedExtensions();
			output.detect = function(matches) {
				if(output.gpu && output.gpu.toLowerCase().strpos(matches)) return true;
				if(output.version && output.version.toLowerCase().strpos(matches)) return true;
				for(var i = 0; i < output.extensions.length; i++) {
					if(output.extensions[i].toLowerCase().strpos(matches)) return true
				}
				return false
			};
			return output
		} catch(e) {
			return false
		};
	}();
	this.graphics.canvas = function() {
		var canvas = document.createElement("canvas");
		return canvas.getContext ? true : false
	}();
	this.styles = {};
	this.styles.filter = checkForTag("filter");
	this.styles.blendMode = checkForTag("mix-blend-mode");
	this.styles.vendor = prefix.unprefixed ? "" : prefix.js;
	this.styles.vendorTransition = this.styles.vendor.length ? this.styles.vendor + "Transition" : "transition";
	this.styles.vendorTransform = this.styles.vendor.length ? this.styles.vendor + "Transform" : "transform";
	this.tween = {};
	this.tween.transition = checkForTag("transition");
	this.tween.css2d = checkForTag("transform");
	this.tween.css3d = checkForTag("perspective");
	this.tween.complete = function() {
		if(prefix.unprefixed) return "transitionend";
		return prefix.lowercase + "TransitionEnd"
	}();
	this.test = function(name, test) {
		this[name] = test()
	};

	function checkFullscreen() {
		if(!_this.getFullscreen()) {
			HydraEvents._fireEvent(HydraEvents.FULLSCREEN, {
				fullscreen: false
			});
			Render.stop(checkFullscreen)
		}
	}
	this.openFullscreen = function(obj) {
		obj = obj || __body;
		if(obj && _this.system.fullscreen) {
			if(obj == __body) obj.css({
				top: 0
			});
			obj.div[prefix.lowercase + "RequestFullScreen"]();
			HydraEvents._fireEvent(HydraEvents.FULLSCREEN, {
				fullscreen: true
			});
			Render.start(checkFullscreen, 10)
		}
	};
	this.closeFullscreen = function() {
		if(_this.system.fullscreen) document[prefix.lowercase + "CancelFullScreen"]();
		Render.stop(checkFullscreen)
	};
	this.getFullscreen = function() {
		if(_this.browser.firefox) return document.mozFullScreen;
		return document[prefix.lowercase + "IsFullScreen"]
	}
}, "Static");
Class(function DynamicObject(_properties) {
	var prototype = DynamicObject.prototype;
	if(_properties) {
		for(var key in _properties) {
			this[key] = _properties[key]
		}
	}
	this._tweens = {};
	if(typeof prototype.tween !== "undefined") return;
	prototype.tween = function(properties, time, ease, delay, update, complete) {
		if(typeof delay !== "number") {
			complete = update;
			update = delay;
			delay = 0
		}
		if(!this.multiTween) this.stopTween();
		if(typeof complete !== "function") complete = null;
		if(typeof update !== "function") update = null;
		this._tween = TweenManager.tween(this, properties, time, ease, delay, complete, update);
		return this._tween
	};
	prototype.stopTween = function(tween) {
		var _tween = tween || this._tween;
		if(_tween && _tween.stop) _tween.stop()
	};
	prototype.pause = function() {
		var _tween = this._tween;
		if(_tween && _tween.pause) _tween.pause()
	};
	prototype.resume = function() {
		var _tween = this._tween;
		if(_tween && _tween.resume) _tween.resume()
	};
	prototype.copy = function(pool) {
		var c = pool && pool.get ? pool.get() : new DynamicObject;
		for(var key in this) {
			if(typeof this[key] === "number") c[key] = this[key]
		}
		return c
	};
	prototype.copyFrom = function(obj) {
		for(var key in obj) {
			if(typeof obj[key] == "number") this[key] = obj[key]
		}
	};
	prototype.copyTo = function(obj) {
		for(var key in obj) {
			if(typeof this[key] == "number") obj[key] = this[key]
		}
	};
	prototype.clear = function() {
		for(var key in this) {
			if(typeof this[key] !== "function") delete this[key]
		}
		return this
	}
});
Class(function ObjectPool(_type, _number) {
	var _this = this;
	var _pool = [];
	this.array = _pool;
	(function() {
		if(_type) {
			_number = _number || 10;
			_type = _type || Object;
			for(var i = 0; i < _number; i++) {
				_pool.push(new _type)
			}
		}
	}());
	this.get = function() {
		return _pool.shift() || (_type ? new _type : null)
	};
	this.empty = function() {
		_pool.length = 0
	};
	this.put = function(obj) {
		if(obj) _pool.push(obj)
	};
	this.insert = function(array) {
		if(typeof array.push === "undefined") array = [array];
		for(var i = 0; i < array.length; i++) {
			_pool.push(array[i])
		}
	};
	this.length = function() {
		return _pool.length
	};
	this.destroy = function() {
		for(var i = 0; i < _pool.length; i++) {
			if(_pool[i].destroy) _pool[i].destroy()
		}
		_pool = null
	}
});
Class(function LinkedList() {
	var prototype = LinkedList.prototype;
	this.length = 0;
	this.first = null;
	this.last = null;
	this.current = null;
	this.prev = null;
	if(typeof prototype.push !== "undefined") return;
	prototype.push = function(obj) {
		if(!this.first) {
			this.first = obj;
			this.last = obj;
			obj.__prev = obj;
			obj.__next = obj
		} else {
			obj.__next = this.first;
			obj.__prev = this.last;
			this.last.__next = obj;
			this.last = obj
		}
		this.length++
	};
	prototype.remove = function(obj) {
		if(!obj || !obj.__next) return;
		if(this.length <= 1) {
			this.empty()
		} else {
			if(obj == this.first) {
				this.first = obj.__next;
				this.last.__next = this.first;
				this.first.__prev = this.last
			} else if(obj == this.last) {
				this.last = obj.__prev;
				this.last.__next = this.first;
				this.first.__prev = this.last
			} else {
				obj.__prev.__next = obj.__next;
				obj.__next.__prev = obj.__prev
			}
			this.length--
		}
		obj.__prev = null;
		obj.__next = null
	};
	prototype.empty = function() {
		this.first = null;
		this.last = null;
		this.current = null;
		this.prev = null;
		this.length = 0
	};
	prototype.start = function() {
		this.current = this.first;
		this.prev = this.current;
		return this.current
	};
	prototype.next = function() {
		if(!this.current) return;
		this.current = this.current.__next;
		if(this.length == 1 || this.prev.__next == this.first) return;
		this.prev = this.current;
		return this.current
	};
	prototype.destroy = function() {
		Utils.nullObject(this);
		return null
	}
});
Class(function Mouse() {
	var _this = this;
	var _capturing;
	this.x = 0;
	this.y = 0;
	this.lastX = 0;
	this.lastY = 0;
	this.moveX = 0;
	this.moveY = 0;
	this.autoPreventClicks = false;

	function moved(e) {
		_this.lastX = _this.x;
		_this.lastY = _this.y;
		_this.ready = true;
		if(e.windowsPointer) {
			_this.x = e.x;
			_this.y = e.y
		} else {
			var convert = Utils.touchEvent(e);
			_this.x = convert.x;
			_this.y = convert.y
		}
		_this.moveX = _this.x - _this.lastX;
		_this.moveY = _this.y - _this.lastY;
		defer(resetMove)
	}
	this.capture = function(x, y) {
		if(_capturing) return false;
		_capturing = true;
		_this.x = x || 0;
		_this.y = y || 0;
		if(!Device.mobile) {
			__window.bind("mousemove", moved)
		} else {
			__window.bind("touchmove", moved);
			__window.bind("touchstart", moved)
		}
	};
	this.stop = function() {
		if(!_capturing) return false;
		_capturing = false;
		_this.x = 0;
		_this.y = 0;
		if(!Device.mobile) {
			__window.unbind("mousemove", moved)
		} else {
			__window.unbind("touchmove", moved);
			__window.unbind("touchstart", moved)
		}
	};
	this.preventClicks = function() {
		_this._preventClicks = true;
		Timer.create(function() {
			_this._preventClicks = false
		}, 300)
	};
	this.preventFireAfterClick = function() {
		_this._preventFire = true
	};

	function resetMove() {
		_this.moveX = 0;
		_this.moveY = 0
	}
}, "Static");
Class(function Timer() {
	var _this = this;
	var _clearTimeout, _created;
	var _callbacks = [];
	var _completed = [];
	var _pool = new ObjectPool(Object, 100);

	function loop(t, tsl, delta) {
		var len = _completed.length;
		for(var i = 0; i < len; i++) {
			var obj = _completed[i];
			obj.callback = null;
			_callbacks.findAndRemove(obj);
			_pool.put(obj)
		}
		if(len > 0) _completed.length = 0;
		if(delta > 70) return;
		len = _callbacks.length;
		for(var i = 0; i < len; i++) {
			var obj = _callbacks[i];
			if(!obj) continue;
			if(obj.frames) {
				++obj.current;
				if(obj.current >= obj.frames) {
					obj.callback();
					_completed.push(obj)
				}
			}
			if(obj.time) {
				obj.current += delta;
				if(obj.current >= obj.time) {
					obj.callback();
					_completed.push(obj)
				}
			}
		}
	}

	function find(ref) {
		for(var i = _callbacks.length - 1; i > -1; i--) {
			var c = _callbacks[i];
			if(c.ref == ref) return c
		}
	}

	function create() {
		_created = true;
		Render.start(loop)
	}
	_clearTimeout = window.clearTimeout;
	window.clearTimeout = function(ref) {
		var c = find(ref);
		if(c) {
			_callbacks.findAndRemove(c)
		} else {
			_clearTimeout(ref)
		}
	};
	this.create = function(callback, time) {
		if(!_created) create();
		if(window._NODE_) return setTimeout(callback, time);
		if(time <= 0) return callback();
		var obj = _pool.get();
		obj.time = time;
		obj.current = 0;
		obj.ref = Utils.timestamp();
		obj.callback = callback;
		_callbacks.push(obj);
		return obj.ref
	};
	this.waitFrames = function(callback, frames) {
		var obj = _pool.get();
		obj.frames = frames;
		obj.current = 0;
		obj.callback = callback;
		_callbacks.push(obj)
	}
}, "static");
Class(function Render() {
	var _this = this;
	var _timer, _last, _timerName;
	var _render = [];
	var _time = Date.now();
	var _timeSinceRender = 0;
	var rAF = window.requestAnimationFrame;
	this.TIME = Date.now();
	this.TARGET_FPS = 60;
	(function() {
		if(!THREAD) {
			rAF(render);
			Hydra.ready(addListeners)
		}
	}());

	function render() {
		var t = Date.now();
		var timeSinceLoad = t - _time;
		var diff = 0;
		var fps = 60;
		if(_last) {
			diff = t - _last;
			fps = 1e3 / diff
		}
		_last = t;
		_this.FPS = fps;
		_this.TIME = t;
		_this.DELTA = diff;
		_this.TSL = timeSinceLoad;
		for(var i = _render.length - 1; i > -1; i--) {
			var callback = _render[i];
			if(!callback) continue;
			if(callback.fps) {
				_timeSinceRender += diff > 200 ? 0 : diff;
				if(_timeSinceRender < 1e3 / callback.fps) continue;
				_timeSinceRender -= 1e3 / callback.fps
			}
			callback(t, timeSinceLoad, diff, fps, callback.frameCount++)
		}
		if(!THREAD) rAF(render)
	}

	function addListeners() {
		HydraEvents._addEvent(HydraEvents.BROWSER_FOCUS, focus, _this)
	}

	function focus(e) {
		if(e.type == "focus") {
			_last = Date.now()
		}
	}
	this.resetTSL = function() {
		_time = Date.now()
	};
	this.startRender = this.start = function(callback, fps) {
		var allowed = true;
		var count = _render.length - 1;
		if(this.TARGET_FPS < 60) fps = this.TARGET_FPS;
		if(typeof fps == "number") callback.fps = fps;
		callback.frameCount = 0;
		if(_render.indexOf(callback) == -1) _render.push(callback)
	};
	this.stopRender = this.stop = function(callback) {
		var i = _render.indexOf(callback);
		if(i > -1) _render.splice(i, 1)
	};
	this.startTimer = function(name) {
		_timerName = name || "Timer";
		if(console.time && !window._NODE_) console.time(_timerName);
		else _timer = Date.now()
	};
	this.stopTimer = function() {
		if(console.time && !window._NODE_) console.timeEnd(_timerName);
		else console.log("Render " + _timerName + ": " + (Date.now() - _timer))
	};
	this.nextFrame = function(callback) {
		Timer.create(callback, 2)
	};
	this.tick = function() {
		if(!THREAD) return;
		render()
	};
	this.renderVR = function(fn) {
		if(window.VRDisplay) rAF = fn
	};
	this.onIdle = function(callback, max) {
		if(window.requestIdleCallback) {
			if(max) max = {
				timeout: max
			};
			return window.requestIdleCallback(callback, max)
		} else {
			var start = _this.TIME;
			return defer(function() {
				callback({
					didTimeout: false,
					timeRemaining: function() {
						return Math.max(0, 50 - (_this.TIME - start))
					}
				})
			})
		}
	};
	window.defer = this.nextFrame;
	window.onIdle = this.onIdle
}, "Static");
Class(function HydraEvents() {
	var _events = [];
	var _e = {};
	this.BROWSER_FOCUS = "hydra_focus";
	this.HASH_UPDATE = "hydra_hash_update";
	this.COMPLETE = "hydra_complete";
	this.PROGRESS = "hydra_progress";
	this.UPDATE = "hydra_update";
	this.LOADED = "hydra_loaded";
	this.END = "hydra_end";
	this.FAIL = "hydra_fail";
	this.SELECT = "hydra_select";
	this.ERROR = "hydra_error";
	this.READY = "hydra_ready";
	this.RESIZE = "hydra_resize";
	this.CLICK = "hydra_click";
	this.HOVER = "hydra_hover";
	this.MESSAGE = "hydra_message";
	this.ORIENTATION = "orientation";
	this.BACKGROUND = "background";
	this.BACK = "hydra_back";
	this.PREVIOUS = "hydra_previous";
	this.NEXT = "hydra_next";
	this.RELOAD = "hydra_reload";
	this.FULLSCREEN = "hydra_fullscreen";
	this._checkDefinition = function(evt) {
		if(typeof evt == "undefined") {
			throw "Undefined event"
		}
	};
	this._addEvent = function(e, callback, object) {
		if(this._checkDefinition) this._checkDefinition(e);
		var add = new Object;
		add.evt = e;
		add.object = object;
		add.callback = callback;
		_events.push(add)
	};
	this._removeEvent = function(eventString, callback) {
		if(this._checkDefinition) this._checkDefinition(eventString);
		defer(function() {
			for(var i = _events.length - 1; i > -1; i--) {
				if(_events[i].evt == eventString && _events[i].callback == callback) {
					_events[i] = null;
					_events.splice(i, 1)
				}
			}
		})
	};
	this._destroyEvents = function(object) {
		for(var i = _events.length - 1; i > -1; i--) {
			if(_events[i].object == object) {
				_events[i] = null;
				_events.splice(i, 1)
			}
		}
	};
	this._fireEvent = function(eventString, obj) {
		if(this._checkDefinition) this._checkDefinition(eventString);
		var fire = true;
		obj = obj || _e;
		obj.cancel = function() {
			fire = false
		};
		let called = false;
		for(var i = 0; i < _events.length; i++) {
			let evt = _events[i];
			if(evt.evt == eventString) {
				if(fire) {
					evt.callback(obj);
					called = true
				} else {
					return true
				}
			}
		}
		return called
	};
	this._consoleEvents = function() {
		console.log(_events)
	};
	this._saveLink = function(obj) {
		if(!this.links) this.links = [];
		if(this.links.indexOf(obj) == -1) this.links.push(obj)
	};
	this.createLocalEmitter = function(child) {
		var events = new HydraEvents;
		if(child) {
			child.on = events._addEvent;
			child.off = events._removeEvent;
			child.fire = events._fireEvent;
			child.destroyEvents = events._destroyEvents
		}
		return events
	}
}, "Static");
Class(function Events(_this) {
	this.events = {};
	var _events = {};
	var _e = {};
	var _emitter, _linked;
	this.events.subscribe = function(object, evt, callback) {
		if(typeof object !== "object") {
			callback = evt;
			evt = object;
			object = null
		}
		if(object) {
			if(!_linked) _linked = [];
			let emitter = object.events.emitter();
			emitter._addEvent(evt, !!callback.resolve ? callback.resolve : callback, _this);
			emitter._saveLink(_this);
			_linked.push(emitter)
		} else {
			HydraEvents._addEvent(evt, !!callback.resolve ? callback.resolve : callback, _this)
		}
		return callback
	};
	this.events.unsubscribe = function(object, evt, callback) {
		if(typeof object !== "object") {
			callback = evt;
			evt = object;
			object = null
		}
		if(object) object.events.emitter()._removeEvent(evt, !!callback.resolve ? callback.resolve : callback, _this);
		else HydraEvents._removeEvent(evt, !!callback.resolve ? callback.resolve : callback)
	};
	this.events.fire = function(evt, obj, avoidGlobal) {
		obj = obj || _e;
		HydraEvents._checkDefinition(evt);
		if(_emitter && _emitter._fireEvent(evt, obj)) {} else if(_events[evt]) {
			obj.target = obj.target || _this;
			_events[evt](obj);
			obj.target = null
		} else if(!avoidGlobal) {
			HydraEvents._fireEvent(evt, obj)
		}
	};
	this.events.add = function(evt, callback) {
		HydraEvents._checkDefinition(evt);
		_events[evt] = !!callback.resolve ? callback.resolve : callback;
		return callback
	};
	this.events.remove = function(evt) {
		HydraEvents._checkDefinition(evt);
		if(_events[evt]) delete _events[evt]
	};
	this.events.bubble = function(object, evt) {
		HydraEvents._checkDefinition(evt);
		var _this = this;
		object.events.add(evt, function(e) {
			_this.fire(evt, e)
		})
	};
	this.events.scope = function(ref) {
		_this = ref
	};
	this.events.destroy = function() {
		HydraEvents._destroyEvents(_this);
		if(_linked) _linked.forEach(emitter => emitter._destroyEvents(_this));
		if(_emitter && _emitter.links) _emitter.links.forEach(obj => obj.events && obj.events._unlink(_emitter));
		_events = null;
		_this = null;
		return null
	};
	this.events.emitter = function() {
		if(!_emitter) _emitter = HydraEvents.createLocalEmitter();
		return _emitter
	};
	this.events.createEmitter = function() {
		HydraEvents.createLocalEmitter(_this)
	};
	this.events._unlink = function(emitter) {
		_linked.findAndRemove(emitter)
	}
});
Class(function Dispatch() {
	var _this = this;
	var _callbacks = {};
	var _instances = {};

	function empty() {}
	this.register = function(object, method) {
		defer(function() {
			_callbacks[Hydra.getClassName(object) + "-" + method] = object[method]
		})
	};
	this.instance = function(object) {
		_instances[Hydra.getClassName(object)] = object
	};
	this.find = function(object, method, args) {
		let name = object.toString().match(/function ([^\(]+)/)[1];
		if(!method) return _instances[name] || console.error(`No instance ${name} found`);
		let path = name + "-" + method;
		if(_callbacks[path]) {
			return _callbacks[path]
		} else {
			delete _callbacks[path];
			return empty
		}
	}
}, "static");
Class(function Mobile() {
	Inherit(this, Component);
	var _this = this;
	var _lastTime;
	var _cancelScroll = true;
	var _scrollTarget = {};
	var _orientationPrevent, _type, _lastWidth;
	this.sleepTime = 1e4;
	this.scrollTop = 0;
	this.autoResizeReload = true;
	this.disableScrollManagement = false;
	Mobile.ScreenLock;
	if(Device.mobile) {
		for(var b in Device.browser) {
			Device.browser[b] = false
		}
		this.phone = Device.mobile.phone;
		this.tablet = Device.mobile.tablet;
		this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
		this.os = function() {
			if(Device.detect("windows", "iemobile")) return "Windows";
			if(Device.detect(["ipad", "iphone"])) return "iOS";
			if(Device.detect(["android", "kindle"])) return "Android";
			if(Device.detect("blackberry")) return "Blackberry";
			return "Unknown"
		}();
		this.version = function() {
			try {
				if(_this.os == "iOS") {
					var num = Device.agent.split("os ")[1].split("_");
					var main = num[0];
					var sub = num[1].split(" ")[0];
					return Number(main + "." + sub)
				}
				if(_this.os == "Android") {
					var version = Device.agent.split("android ")[1].split(";")[0];
					if(version.length > 3) version = version.slice(0, -2);
					if(version.charAt(version.length - 1) == ".") version = version.slice(0, -1);
					return Number(version)
				}
				if(_this.os == "Windows") {
					if(Device.agent.strpos("rv:11")) return 11;
					return Number(Device.agent.split("windows phone ")[1].split(";")[0])
				}
			} catch(e) {}
			return -1
		}();
		this.browser = function() {
			if(_this.os == "iOS") {
				if(Device.detect(["twitter", "fbios"])) return "Social";
				if(Device.detect("crios")) return "Chrome";
				if(Device.detect("safari")) return "Safari";
				return "Unknown"
			}
			if(_this.os == "Android") {
				if(Device.detect(["twitter", "fb", "facebook"])) return "Social";
				if(Device.detect("chrome")) return "Chrome";
				if(Device.detect("firefox")) return "Firefox";
				return "Browser"
			}
			if(_this.os == "Windows") return "IE";
			return "Unknown"
		}();
		if(this.os == "Android" && this.browser == "Chrome") {
			this.browserVersion = Number(Device.agent.split("chrome/")[1].split(".")[0])
		}
		Hydra.ready(function() {
			window.addEventListener("orientationchange", orientationChange);
			window.onresize = resizeHandler;
			if(_this.browser == "Safari" && (!_this.NativeCore || !_this.NativeCore.active)) {
				document.body.scrollTop = 0;
				__body.css({
					height: "101%"
				})
			}
			setHeight();
			_this.orientation = Stage.width > Stage.height ? "landscape" : "portrait";
			if(!(_this.NativeCore && _this.NativeCore.active)) {
				window.addEventListener("touchstart", touchStart)
			} else {
				Stage.css({
					overflow: "hidden"
				})
			}
			determineType();
			_type = _this.phone ? "phone" : "tablet";
			_lastWidth = Stage.width
		});

		function determineType() {
			Device.mobile.tablet = function() {
				if(Stage.width > Stage.height) return document.body.clientWidth > 800;
				else return document.body.clientHeight > 800
			}();
			Device.mobile.phone = !Device.mobile.tablet;
			_this.phone = Device.mobile.phone;
			_this.tablet = Device.mobile.tablet
		}

		function setHeight() {
			Stage.width = document.body.clientWidth;
			Stage.height = document.body.clientHeight;
			if(Hydra.__offset) {
				Stage.width -= Hydra.__offset.x;
				Stage.height -= Hydra.__offset.y;
				Stage.css({
					width: Stage.width,
					height: Stage.height
				})
			}
			if(_this.browser == "Social" && _this.os == "iOS") {
				Stage.width = window.innerWidth;
				Stage.height = window.innerHeight
			}
		}

		function resizeHandler() {
			clearTimeout(_this.fireResize);
			if(!_this.allowScroll) document.body.scrollTop = 0;
			_this.fireResize = _this.delayedCall(function() {
				setHeight();
				determineType();
				var type = _this.phone ? "phone" : "tablet";
				if((_this.os == "iOS" || _this.os == "Android" && _this.version >= 7) && type != _type && _lastWidth != Stage.width && _this.autoResizeReload) window.location.reload();
				_this.orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
				_this.events.fire(HydraEvents.RESIZE);
				_lastWidth = Stage.width
			}, 32)
		}

		function orientationChange() {
			_this.events.fire(HydraEvents.ORIENTATION)
		}

		function touchStart(e) {
			if(_this.disableScrollManagemenet) return;
			var touch = Utils.touchEvent(e);
			var target = e.target;
			var inputElement = target.nodeName == "INPUT" || target.nodeName == "TEXTAREA" || target.nodeName == "SELECT" || target.nodeName == "A";
			if(inputElement) return;
			if(_cancelScroll) return e.preventDefault();
			var prevent = true;
			target = e.target;
			while(target.parentNode) {
				if(target._scrollParent) {
					prevent = false;
					_scrollTarget.target = target;
					_scrollTarget.y = touch.y;
					target.hydraObject.__preventY = touch.y
				}
				target = target.parentNode
			}
			if(prevent) e.preventDefault()
		}
	}

	function checkTime() {
		var time = Date.now();
		if(_lastTime) {
			if(time - _lastTime > _this.sleepTime) {
				_this.events.fire(HydraEvents.BACKGROUND)
			}
		}
		_lastTime = time
	}
	this.Class = window.Class;
	this.fullscreen = function() {
		if(_this.NativeCore && _this.NativeCore.active || _this.isPWA() || navigator.platform && navigator.platform.toLowerCase().strpos(["windows", "mac"])) return;
		if(_this.os == "Android") {
			__window.bind("touchstart", function() {
				Device.openFullscreen()
			});
			if(_this.orientationSet) _this.events.fire(HydraEvents.RESIZE);
			return true
		}
		return false
	};
	this.overflowScroll = function($object, dir) {
		if(!Device.mobile) return false;
		var x = !!dir.x;
		var y = !!dir.y;
		var overflow = {
			"-webkit-overflow-scrolling": "touch"
		};
		if(!x && !y || x && y) overflow.overflow = "scroll";
		if(!x && y) {
			overflow.overflowY = "scroll";
			overflow.overflowX = "hidden"
		}
		if(x && !y) {
			overflow.overflowX = "scroll";
			overflow.overflowY = "hidden"
		}
		$object.css(overflow);
		$object.div._scrollParent = true;
		_cancelScroll = false;
		$object.div._preventEvent = function(e) {
			if($object.maxScroll) {
				var touch = Utils.touchEvent(e);
				var delta = touch.y - $object.__preventY < 0 ? 1 : -1;
				if($object.div.scrollTop < 2) {
					if(delta == -1) e.preventDefault();
					else e.stopPropagation()
				} else if($object.div.scrollTop > $object.maxScroll - 2) {
					if(delta == 1) e.preventDefault();
					else e.stopPropagation()
				}
			} else {
				e.stopPropagation()
			}
		};
		if(!_this.isNative()) $object.div.addEventListener("touchmove", $object.div._preventEvent)
	};
	this.removeOverflowScroll = function($object) {
		$object.css({
			overflow: "hidden",
			overflowX: "",
			overflowY: "",
			"-webkit-overflow-scrolling": ""
		});
		$object.div.removeEventListener("touchmove", $object.div._preventEvent)
	};
	this.setOrientation = function(type) {
		if(_this.System && _this.NativeCore.active) {
			_this.System.orientation = _this.System[type.toUpperCase()];
			return
		}
		if(Device.mobile) {
			_this.ScreenLock.lock(type)
		}
		_this.orientationSet = type
	};
	this.vibrate = function(time) {
		navigator.vibrate && navigator.vibrate(time)
	};
	this.isPWA = function() {
		if(!Device.mobile) return false;
		if(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
		if(window.navigator.standalone) return true;
		return false
	};
	this.isNative = function() {
		return _this.NativeCore && _this.NativeCore.active
	}
}, "Static");
Class(function Modules() {
	var _this = this;
	var _modules = {};
	(function() {
		defer(exec)
	}());

	function exec() {
		for(var m in _modules) {
			for(var key in _modules[m]) {
				var module = _modules[m][key];
				if(module._ready) continue;
				module._ready = true;
				if(module.exec) module.exec()
			}
		}
	}

	function requireModule(root, path) {
		var module = _modules[root];
		if(!module) throw `Module ${root} not found`;
		module = module[path];
		if(!module._ready) {
			module._ready = true;
			if(module.exec) module.exec()
		}
		return module
	}
	this.push = function(module) {};
	this.Module = function(module) {
		var m = new module;
		var name = module.toString().slice(0, 100).match(/function ([^\(]+)/);
		if(name) {
			m._ready = true;
			name = name[1];
			_modules[name] = {
				index: m
			}
		} else {
			if(!_modules[m.module]) _modules[m.module] = {};
			_modules[m.module][m.path] = m
		}
	};
	this.require = function(path) {
		var root;
		if(!path.strpos("/")) {
			root = path;
			path = "index"
		} else {
			root = path.split("/")[0];
			path = path.replace(root + "/", "")
		}
		return requireModule(root, path).exports
	};
	window.Module = this.Module;
	if(!window._NODE_ || window.EJECTA) {
		window.requireNative = window.require;
		window.require = this.require
	}
}, "Static");
Class(function Color(_value) {
	Inherit(this, Component);
	var _this = this;
	var _hsl, _array;
	this.r = 1;
	this.g = 1;
	this.b = 1;
	(function() {
		set(_value)
	}());

	function set(value) {
		if(value instanceof Color) {
			copy(value)
		} else if(typeof value === "number") {
			setHex(value)
		} else if(Array.isArray(value)) {
			setRGB(value)
		} else {
			setHex(Number("0x" + value.slice(1)))
		}
	}

	function copy(color) {
		_this.r = color.r;
		_this.g = color.g;
		_this.b = color.b
	}

	function setHex(hex) {
		hex = Math.floor(hex);
		_this.r = (hex >> 16 & 255) / 255;
		_this.g = (hex >> 8 & 255) / 255;
		_this.b = (hex & 255) / 255
	}

	function setRGB(values) {
		_this.r = values[0];
		_this.g = values[1];
		_this.b = values[2]
	}

	function hue2rgb(p, q, t) {
		if(t < 0) t += 1;
		if(t > 1) t -= 1;
		if(t < 1 / 6) return p + (q - p) * 6 * t;
		if(t < 1 / 2) return q;
		if(t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
		return p
	}
	this.set = function(value) {
		set(value);
		return this
	};
	this.setRGB = function(r, g, b) {
		this.r = r;
		this.g = g;
		this.b = b;
		return this
	};
	this.setHSL = function(h, s, l) {
		if(s === 0) {
			this.r = this.g = this.b = l
		} else {
			var p = l <= .5 ? l * (1 + s) : l + s - l * s;
			var q = 2 * l - p;
			this.r = hue2rgb(q, p, h + 1 / 3);
			this.g = hue2rgb(q, p, h);
			this.b = hue2rgb(q, p, h - 1 / 3)
		}
		return this
	};
	this.offsetHSL = function(h, s, l) {
		var hsl = this.getHSL();
		hsl.h += h;
		hsl.s += s;
		hsl.l += l;
		this.setHSL(hsl.h, hsl.s, hsl.l);
		return this
	};
	this.getStyle = function() {
		return "rgb(" + (this.r * 255 | 0) + "," + (this.g * 255 | 0) + "," + (this.b * 255 | 0) + ")"
	};
	this.getHex = function() {
		return this.r * 255 << 16 ^ this.g * 255 << 8 ^ this.b * 255 << 0
	};
	this.getHexString = function() {
		return "#" + ("000000" + this.getHex().toString(16)).slice(-6)
	};
	this.getHSL = function() {
		_hsl = _hsl || {
			h: 0,
			s: 0,
			l: 0
		};
		var hsl = _hsl;
		var r = this.r,
			g = this.g,
			b = this.b;
		var max = Math.max(r, g, b);
		var min = Math.min(r, g, b);
		var hue, saturation;
		var lightness = (min + max) / 2;
		if(min === max) {
			hue = 0;
			saturation = 0
		} else {
			var delta = max - min;
			saturation = lightness <= .5 ? delta / (max + min) : delta / (2 - max - min);
			switch(max) {
				case r:
					hue = (g - b) / delta + (g < b ? 6 : 0);
					break;
				case g:
					hue = (b - r) / delta + 2;
					break;
				case b:
					hue = (r - g) / delta + 4;
					break
			}
			hue /= 6
		}
		hsl.h = hue;
		hsl.s = saturation;
		hsl.l = lightness;
		return hsl
	};
	this.add = function(color) {
		this.r += color.r;
		this.g += color.g;
		this.b += color.b
	};
	this.mix = function(color, percent) {
		this.r = this.r * (1 - percent) + color.r * percent;
		this.g = this.g * (1 - percent) + color.g * percent;
		this.b = this.b * (1 - percent) + color.b * percent
	};
	this.addScalar = function(s) {
		this.r += s;
		this.g += s;
		this.b += s
	};
	this.multiply = function(color) {
		this.r *= color.r;
		this.g *= color.g;
		this.b *= color.b
	};
	this.multiplyScalar = function(s) {
		this.r *= s;
		this.g *= s;
		this.b *= s
	};
	this.clone = function() {
		return new Color([this.r, this.g, this.b])
	};
	this.toArray = function() {
		if(!_array) _array = [];
		_array[0] = this.r;
		_array[1] = this.g;
		_array[2] = this.b;
		return _array
	}
});
Class(function Noise() {
	var module = this;

	function Grad(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z
	}
	Grad.prototype.dot2 = function(x, y) {
		return this.x * x + this.y * y
	};
	Grad.prototype.dot3 = function(x, y, z) {
		return this.x * x + this.y * y + this.z * z
	};
	var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0), new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1), new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];
	var p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
	var perm = new Array(512);
	var gradP = new Array(512);
	module.seed = function(seed) {
		if(seed > 0 && seed < 1) {
			seed *= 65536
		}
		seed = Math.floor(seed);
		if(seed < 256) {
			seed |= seed << 8
		}
		for(var i = 0; i < 256; i++) {
			var v;
			if(i & 1) {
				v = p[i] ^ seed & 255
			} else {
				v = p[i] ^ seed >> 8 & 255
			}
			perm[i] = perm[i + 256] = v;
			gradP[i] = gradP[i + 256] = grad3[v % 12]
		}
	};
	module.seed(0);
	var F2 = .5 * (Math.sqrt(3) - 1);
	var G2 = (3 - Math.sqrt(3)) / 6;
	var F3 = 1 / 3;
	var G3 = 1 / 6;
	module.simplex2 = function(xin, yin) {
		var n0, n1, n2;
		var s = (xin + yin) * F2;
		var i = Math.floor(xin + s);
		var j = Math.floor(yin + s);
		var t = (i + j) * G2;
		var x0 = xin - i + t;
		var y0 = yin - j + t;
		var i1, j1;
		if(x0 > y0) {
			i1 = 1;
			j1 = 0
		} else {
			i1 = 0;
			j1 = 1
		}
		var x1 = x0 - i1 + G2;
		var y1 = y0 - j1 + G2;
		var x2 = x0 - 1 + 2 * G2;
		var y2 = y0 - 1 + 2 * G2;
		i &= 255;
		j &= 255;
		var gi0 = gradP[i + perm[j]];
		var gi1 = gradP[i + i1 + perm[j + j1]];
		var gi2 = gradP[i + 1 + perm[j + 1]];
		var t0 = .5 - x0 * x0 - y0 * y0;
		if(t0 < 0) {
			n0 = 0
		} else {
			t0 *= t0;
			n0 = t0 * t0 * gi0.dot2(x0, y0)
		}
		var t1 = .5 - x1 * x1 - y1 * y1;
		if(t1 < 0) {
			n1 = 0
		} else {
			t1 *= t1;
			n1 = t1 * t1 * gi1.dot2(x1, y1)
		}
		var t2 = .5 - x2 * x2 - y2 * y2;
		if(t2 < 0) {
			n2 = 0
		} else {
			t2 *= t2;
			n2 = t2 * t2 * gi2.dot2(x2, y2)
		}
		return 70 * (n0 + n1 + n2)
	};
	module.simplex3 = function(xin, yin, zin) {
		var n0, n1, n2, n3;
		var s = (xin + yin + zin) * F3;
		var i = Math.floor(xin + s);
		var j = Math.floor(yin + s);
		var k = Math.floor(zin + s);
		var t = (i + j + k) * G3;
		var x0 = xin - i + t;
		var y0 = yin - j + t;
		var z0 = zin - k + t;
		var i1, j1, k1;
		var i2, j2, k2;
		if(x0 >= y0) {
			if(y0 >= z0) {
				i1 = 1;
				j1 = 0;
				k1 = 0;
				i2 = 1;
				j2 = 1;
				k2 = 0
			} else if(x0 >= z0) {
				i1 = 1;
				j1 = 0;
				k1 = 0;
				i2 = 1;
				j2 = 0;
				k2 = 1
			} else {
				i1 = 0;
				j1 = 0;
				k1 = 1;
				i2 = 1;
				j2 = 0;
				k2 = 1
			}
		} else {
			if(y0 < z0) {
				i1 = 0;
				j1 = 0;
				k1 = 1;
				i2 = 0;
				j2 = 1;
				k2 = 1
			} else if(x0 < z0) {
				i1 = 0;
				j1 = 1;
				k1 = 0;
				i2 = 0;
				j2 = 1;
				k2 = 1
			} else {
				i1 = 0;
				j1 = 1;
				k1 = 0;
				i2 = 1;
				j2 = 1;
				k2 = 0
			}
		}
		var x1 = x0 - i1 + G3;
		var y1 = y0 - j1 + G3;
		var z1 = z0 - k1 + G3;
		var x2 = x0 - i2 + 2 * G3;
		var y2 = y0 - j2 + 2 * G3;
		var z2 = z0 - k2 + 2 * G3;
		var x3 = x0 - 1 + 3 * G3;
		var y3 = y0 - 1 + 3 * G3;
		var z3 = z0 - 1 + 3 * G3;
		i &= 255;
		j &= 255;
		k &= 255;
		var gi0 = gradP[i + perm[j + perm[k]]];
		var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
		var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
		var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];
		var t0 = .6 - x0 * x0 - y0 * y0 - z0 * z0;
		if(t0 < 0) {
			n0 = 0
		} else {
			t0 *= t0;
			n0 = t0 * t0 * gi0.dot3(x0, y0, z0)
		}
		var t1 = .6 - x1 * x1 - y1 * y1 - z1 * z1;
		if(t1 < 0) {
			n1 = 0
		} else {
			t1 *= t1;
			n1 = t1 * t1 * gi1.dot3(x1, y1, z1)
		}
		var t2 = .6 - x2 * x2 - y2 * y2 - z2 * z2;
		if(t2 < 0) {
			n2 = 0
		} else {
			t2 *= t2;
			n2 = t2 * t2 * gi2.dot3(x2, y2, z2)
		}
		var t3 = .6 - x3 * x3 - y3 * y3 - z3 * z3;
		if(t3 < 0) {
			n3 = 0
		} else {
			t3 *= t3;
			n3 = t3 * t3 * gi3.dot3(x3, y3, z3)
		}
		return 32 * (n0 + n1 + n2 + n3)
	};

	function fade(t) {
		return t * t * t * (t * (t * 6 - 15) + 10)
	}

	function lerp(a, b, t) {
		return(1 - t) * a + t * b
	}
	module.perlin = function(x) {
		return module.perlin2(x, 0)
	};
	module.perlin2 = function(x, y) {
		var X = Math.floor(x),
			Y = Math.floor(y);
		x = x - X;
		y = y - Y;
		X = X & 255;
		Y = Y & 255;
		var n00 = gradP[X + perm[Y]].dot2(x, y);
		var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
		var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
		var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);
		var u = fade(x);
		return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y))
	};
	module.perlin3 = function(x, y, z) {
		var X = Math.floor(x),
			Y = Math.floor(y),
			Z = Math.floor(z);
		x = x - X;
		y = y - Y;
		z = z - Z;
		X = X & 255;
		Y = Y & 255;
		Z = Z & 255;
		var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
		var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
		var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
		var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
		var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
		var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
		var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
		var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);
		var u = fade(x);
		var v = fade(y);
		var w = fade(z);
		return lerp(lerp(lerp(n000, n100, u), lerp(n001, n101, u), w), lerp(lerp(n010, n110, u), lerp(n011, n111, u), w), v)
	}
}, "Static");
Class(function Matrix2() {
	var _this = this;
	var prototype = Matrix2.prototype;
	var a11, a12, a13, a21, a22, a23, a31, a32, a33;
	var b11, b12, b13, b21, b22, b23, b31, b32, b33;
	this.type = "matrix2";
	this.data = new Float32Array(9);
	(function() {
		identity()
	}());

	function identity(d) {
		d = d || _this.data;
		d[0] = 1, d[1] = 0, d[2] = 0;
		d[3] = 0, d[4] = 1, d[5] = 0;
		d[6] = 0, d[7] = 0, d[8] = 1
	}

	function noE(n) {
		n = Math.abs(n) < .000001 ? 0 : n;
		return n
	}
	if(typeof prototype.identity !== "undefined") return;
	prototype.identity = function(d) {
		identity(d);
		return this
	};
	prototype.transformVector = function(v) {
		var d = this.data;
		var x = v.x;
		var y = v.y;
		v.x = d[0] * x + d[1] * y + d[2];
		v.y = d[3] * x + d[4] * y + d[5];
		return v
	};
	prototype.setTranslation = function(tx, ty, m) {
		var d = m || this.data;
		d[0] = 1, d[1] = 0, d[2] = tx;
		d[3] = 0, d[4] = 1, d[5] = ty;
		d[6] = 0, d[7] = 0, d[8] = 1;
		return this
	};
	prototype.getTranslation = function(v) {
		var d = this.data;
		v = v || new Vector2;
		v.x = d[2];
		v.y = d[5];
		return v
	};
	prototype.setScale = function(sx, sy, m) {
		var d = m || this.data;
		d[0] = sx, d[1] = 0, d[2] = 0;
		d[3] = 0, d[4] = sy, d[5] = 0;
		d[6] = 0, d[7] = 0, d[8] = 1;
		return this
	};
	prototype.setShear = function(sx, sy, m) {
		var d = m || this.data;
		d[0] = 1, d[1] = sx, d[2] = 0;
		d[3] = sy, d[4] = 1, d[5] = 0;
		d[6] = 0, d[7] = 0, d[8] = 1;
		return this
	};
	prototype.setRotation = function(a, m) {
		var d = m || this.data;
		var r0 = Math.cos(a);
		var r1 = Math.sin(a);
		d[0] = r0, d[1] = -r1, d[2] = 0;
		d[3] = r1, d[4] = r0, d[5] = 0;
		d[6] = 0, d[7] = 0, d[8] = 1;
		return this
	};
	prototype.setTRS = function(tx, ty, a, sx, sy) {
		var d = this.data;
		var r0 = Math.cos(a);
		var r1 = Math.sin(a);
		d[0] = r0 * sx, d[1] = -r1 * sy, d[2] = tx;
		d[3] = r1 * sx, d[4] = r0 * sy, d[5] = ty;
		d[6] = 0, d[7] = 0, d[8] = 1;
		return this
	};
	prototype.translate = function(tx, ty) {
		this.identity(Matrix2.__TEMP__);
		this.setTranslation(tx, ty, Matrix2.__TEMP__);
		return this.multiply(Matrix2.__TEMP__)
	};
	prototype.rotate = function(a) {
		this.identity(Matrix2.__TEMP__);
		this.setTranslation(a, Matrix2.__TEMP__);
		return this.multiply(Matrix2.__TEMP__)
	};
	prototype.scale = function(sx, sy) {
		this.identity(Matrix2.__TEMP__);
		this.setScale(sx, sy, Matrix2.__TEMP__);
		return this.multiply(Matrix2.__TEMP__)
	};
	prototype.shear = function(sx, sy) {
		this.identity(Matrix2.__TEMP__);
		this.setRotation(sx, sy, Matrix2.__TEMP__);
		return this.multiply(Matrix2.__TEMP__)
	};
	prototype.multiply = function(m) {
		var a = this.data;
		var b = m.data || m;
		a11 = a[0], a12 = a[1], a13 = a[2];
		a21 = a[3], a22 = a[4], a23 = a[5];
		a31 = a[6], a32 = a[7], a33 = a[8];
		b11 = b[0], b12 = b[1], b13 = b[2];
		b21 = b[3], b22 = b[4], b23 = b[5];
		b31 = b[6], b32 = b[7], b33 = b[8];
		a[0] = a11 * b11 + a12 * b21 + a13 * b31;
		a[1] = a11 * b12 + a12 * b22 + a13 * b32;
		a[2] = a11 * b13 + a12 * b23 + a13 * b33;
		a[3] = a21 * b11 + a22 * b21 + a23 * b31;
		a[4] = a21 * b12 + a22 * b22 + a23 * b32;
		a[5] = a21 * b13 + a22 * b23 + a23 * b33;
		return this
	};
	prototype.inverse = function(m) {
		m = m || this;
		var a = m.data;
		var b = this.data;
		a11 = a[0], a12 = a[1], a13 = a[2];
		a21 = a[3], a22 = a[4], a23 = a[5];
		a31 = a[6], a32 = a[7], a33 = a[8];
		var det = m.determinant();
		if(Math.abs(det) < 1e-7) {}
		var invdet = 1 / det;
		b[0] = (a22 * a33 - a32 * a23) * invdet;
		b[1] = (a13 * a32 - a12 * a33) * invdet;
		b[2] = (a12 * a23 - a13 * a22) * invdet;
		b[3] = (a23 * a31 - a21 * a33) * invdet;
		b[4] = (a11 * a33 - a13 * a31) * invdet;
		b[5] = (a21 * a13 - a11 * a23) * invdet;
		b[6] = (a21 * a32 - a31 * a22) * invdet;
		b[7] = (a31 * a12 - a11 * a32) * invdet;
		b[8] = (a11 * a22 - a21 * a12) * invdet;
		return m
	};
	prototype.determinant = function() {
		var a = this.data;
		a11 = a[0], a12 = a[1], a13 = a[2];
		a21 = a[3], a22 = a[4], a23 = a[5];
		a31 = a[6], a32 = a[7], a33 = a[8];
		return a11 * (a22 * a33 - a32 * a23) - a12 * (a21 * a33 - a23 * a31) + a13 * (a21 * a32 * a22 * a31)
	};
	prototype.copyTo = function(m) {
		var a = this.data;
		var b = m.data || m;
		b[0] = a[0], b[1] = a[1], b[2] = a[2];
		b[3] = a[3], b[4] = a[4], b[5] = a[5];
		b[6] = a[6], b[7] = a[7], b[8] = a[8];
		return m
	};
	prototype.copyFrom = function(m) {
		var a = this.data;
		var b = m.data || m;
		b[0] = a[0], b[1] = a[1], b[2] = a[2];
		b[3] = a[3], b[4] = a[4], b[5] = a[5];
		b[6] = a[6], b[7] = a[7], b[8] = a[8];
		return this
	};
	prototype.getCSS = function(force2D) {
		var d = this.data;
		if(Device.tween.css3d && !force2D) {
			return "matrix3d(" + noE(d[0]) + ", " + noE(d[3]) + ", 0, 0, " + noE(d[1]) + ", " + noE(d[4]) + ", 0, 0, 0, 0, 1, 0, " + noE(d[2]) + ", " + noE(d[5]) + ", 0, 1)"
		} else {
			return "matrix(" + noE(d[0]) + ", " + noE(d[3]) + ", " + noE(d[1]) + ", " + noE(d[4]) + ", " + noE(d[2]) + ", " + noE(d[5]) + ")"
		}
	}
}, function() {
	Matrix2.__TEMP__ = (new Matrix2).data
});
Class(function Matrix4() {
	var _this = this;
	var prototype = Matrix4.prototype;
	this.type = "matrix4";
	this.data = new Float32Array(16);
	(function() {
		identity()
	}());

	function identity(m) {
		var d = m || _this.data;
		d[0] = 1, d[4] = 0, d[8] = 0, d[12] = 0;
		d[1] = 0, d[5] = 1, d[9] = 0, d[13] = 0;
		d[2] = 0, d[6] = 0, d[10] = 1, d[14] = 0;
		d[3] = 0, d[7] = 0, d[11] = 0, d[15] = 1
	}

	function noE(n) {
		return Math.abs(n) < .000001 ? 0 : n
	}
	if(typeof prototype.identity !== "undefined") return;
	prototype.identity = function() {
		identity();
		return this
	};
	prototype.transformVector = function(v, pv) {
		var d = this.data;
		var x = v.x,
			y = v.y,
			z = v.z,
			w = v.w;
		pv = pv || v;
		pv.x = d[0] * x + d[4] * y + d[8] * z + d[12] * w;
		pv.y = d[1] * x + d[5] * y + d[9] * z + d[13] * w;
		pv.z = d[2] * x + d[6] * y + d[10] * z + d[14] * w;
		return pv
	};
	prototype.multiply = function(m, d) {
		var a = this.data;
		var b = m.data || m;
		var a00, a01, a02, a03, a04, a05, a06, a07, a08, a09, a10, a11, a12, a13, a14, a15;
		var b00, b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11, b12, b13, b14, b15;
		a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
		a04 = a[4], a05 = a[5], a06 = a[6], a07 = a[7];
		a08 = a[8], a09 = a[9], a10 = a[10], a11 = a[11];
		a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
		b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
		b04 = b[4], b05 = b[5], b06 = b[6], b07 = b[7];
		b08 = b[8], b09 = b[9], b10 = b[10], b11 = b[11];
		b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
		a[0] = a00 * b00 + a04 * b01 + a08 * b02 + a12 * b03;
		a[1] = a01 * b00 + a05 * b01 + a09 * b02 + a13 * b03;
		a[2] = a02 * b00 + a06 * b01 + a10 * b02 + a14 * b03;
		a[3] = a03 * b00 + a07 * b01 + a11 * b02 + a15 * b03;
		a[4] = a00 * b04 + a04 * b05 + a08 * b06 + a12 * b07;
		a[5] = a01 * b04 + a05 * b05 + a09 * b06 + a13 * b07;
		a[6] = a02 * b04 + a06 * b05 + a10 * b06 + a14 * b07;
		a[7] = a03 * b04 + a07 * b05 + a11 * b06 + a15 * b07;
		a[8] = a00 * b08 + a04 * b09 + a08 * b10 + a12 * b11;
		a[9] = a01 * b08 + a05 * b09 + a09 * b10 + a13 * b11;
		a[10] = a02 * b08 + a06 * b09 + a10 * b10 + a14 * b11;
		a[11] = a03 * b08 + a07 * b09 + a11 * b10 + a15 * b11;
		a[12] = a00 * b12 + a04 * b13 + a08 * b14 + a12 * b15;
		a[13] = a01 * b12 + a05 * b13 + a09 * b14 + a13 * b15;
		a[14] = a02 * b12 + a06 * b13 + a10 * b14 + a14 * b15;
		a[15] = a03 * b12 + a07 * b13 + a11 * b14 + a15 * b15;
		return this
	};
	prototype.setTRS = function(tx, ty, tz, rx, ry, rz, sx, sy, sz, m) {
		m = m || this;
		var d = m.data;
		identity(m);
		var six = Math.sin(rx);
		var cox = Math.cos(rx);
		var siy = Math.sin(ry);
		var coy = Math.cos(ry);
		var siz = Math.sin(rz);
		var coz = Math.cos(rz);
		d[0] = (coy * coz + siy * six * siz) * sx;
		d[1] = (-coy * siz + siy * six * coz) * sx;
		d[2] = siy * cox * sx;
		d[4] = siz * cox * sy;
		d[5] = coz * cox * sy;
		d[6] = -six * sy;
		d[8] = (-siy * coz + coy * six * siz) * sz;
		d[9] = (siz * siy + coy * six * coz) * sz;
		d[10] = coy * cox * sz;
		d[12] = tx;
		d[13] = ty;
		d[14] = tz;
		return m
	};
	prototype.setScale = function(sx, sy, sz, m) {
		m = m || this;
		var d = m.data || m;
		identity(m);
		d[0] = sx, d[5] = sy, d[10] = sz;
		return m
	};
	prototype.setTranslation = function(tx, ty, tz, m) {
		m = m || this;
		var d = m.data || m;
		identity(m);
		d[12] = tx, d[13] = ty, d[14] = tz;
		return m
	};
	prototype.setRotation = function(rx, ry, rz, m) {
		m = m || this;
		var d = m.data || m;
		identity(m);
		var sx = Math.sin(rx);
		var cx = Math.cos(rx);
		var sy = Math.sin(ry);
		var cy = Math.cos(ry);
		var sz = Math.sin(rz);
		var cz = Math.cos(rz);
		d[0] = cy * cz + sy * sx * sz;
		d[1] = -cy * sz + sy * sx * cz;
		d[2] = sy * cx;
		d[4] = sz * cx;
		d[5] = cz * cx;
		d[6] = -sx;
		d[8] = -sy * cz + cy * sx * sz;
		d[9] = sz * sy + cy * sx * cz;
		d[10] = cy * cx;
		return m
	};
	prototype.setLookAt = function(eye, center, up, m) {
		m = m || this;
		var d = m.data || m;
		var f = D3.m4v31;
		var s = D3.m4v32;
		var u = D3.m4v33;
		f.subVectors(center, eye).normalize();
		s.cross(f, up).normalize();
		u.cross(s, f);
		d[0] = s.x;
		d[1] = u.x;
		d[2] = -f.x;
		d[3] = 0;
		d[4] = s.y;
		d[5] = u.y;
		d[6] = -f.y;
		d[7] = 0;
		d[8] = s.z;
		d[9] = u.z;
		d[10] = -f.z;
		d[11] = 0;
		d[12] = 0;
		d[13] = 0;
		d[14] = 0;
		d[15] = 1;
		this.translate(-eye.x, -eye.y, -eye.z);
		return this
	};
	prototype.setPerspective = function(fovy, aspect, near, far, m) {
		var e, rd, s, ct;
		if(near === far || aspect === 0) {
			throw "null frustum"
		}
		if(near <= 0) {
			throw "near <= 0"
		}
		if(far <= 0) {
			throw "far <= 0"
		}
		fovy = Math.PI * fovy / 180 / 2;
		s = Math.sin(fovy);
		if(s === 0) {
			throw "null frustum"
		}
		rd = 1 / (far - near);
		ct = Math.cos(fovy) / s;
		e = m ? m.data || m : this.data;
		e[0] = ct / aspect;
		e[1] = 0;
		e[2] = 0;
		e[3] = 0;
		e[4] = 0;
		e[5] = ct;
		e[6] = 0;
		e[7] = 0;
		e[8] = 0;
		e[9] = 0;
		e[10] = -(far + near) * rd;
		e[11] = -1;
		e[12] = 0;
		e[13] = 0;
		e[14] = -2 * near * far * rd;
		e[15] = 0
	};
	prototype.setRotationFromQuaternion = function(q) {
		var d = this.data;
		var x = q.x,
			y = q.y,
			z = q.z,
			w = q.w;
		var x2 = x + x,
			y2 = y + y,
			z2 = z + z;
		var xx = x * x2,
			xy = x * y2,
			xz = x * z2;
		var yy = y * y2,
			yz = y * z2,
			zz = z * z2;
		var wx = w * x2,
			wy = w * y2,
			wz = w * z2;
		d[0] = 1 - (yy + zz);
		d[4] = xy - wz;
		d[8] = xz + wy;
		d[1] = xy + wz;
		d[5] = 1 - (xx + zz);
		d[9] = yz - wx;
		d[2] = xz - wy;
		d[6] = yz + wx;
		d[10] = 1 - (xx + yy);
		d[3] = 0;
		d[7] = 0;
		d[11] = 0;
		d[12] = 0;
		d[13] = 0;
		d[14] = 0;
		d[15] = 1;
		return this
	}, prototype.perspective = function(fov, aspect, near, far) {
		this.setPerspective(fov, aspect, near, far, Matrix4.__TEMP__);
		return this.multiply(Matrix4.__TEMP__)
	};
	prototype.lookAt = function(eye, center, up) {
		this.setLookAt(eye, center, up, Matrix4.__TEMP__);
		return this.multiply(Matrix4.__TEMP__)
	};
	prototype.translate = function(tx, ty, tz) {
		this.setTranslation(tx, ty, tz, Matrix4.__TEMP__);
		return this.multiply(Matrix4.__TEMP__)
	};
	prototype.rotate = function(rx, ry, rz) {
		this.setRotation(rx, ry, rz, Matrix4.__TEMP__);
		return this.multiply(Matrix4.__TEMP__)
	};
	prototype.scale = function(sx, sy, sz) {
		this.setScale(sx, sy, sz, Matrix4.__TEMP__);
		return this.multiply(Matrix4.__TEMP__)
	};
	prototype.copyTo = function(m) {
		var a = this.data;
		var b = m.data || m;
		for(var i = 0; i < 16; i++) b[i] = a[i]
	};
	prototype.copyFrom = function(m) {
		var a = this.data;
		var b = m.data || m;
		for(var i = 0; i < 16; i++) a[i] = b[i];
		return this
	};
	prototype.copyRotationTo = function(m) {
		var a = this.data;
		var b = m.data || m;
		b[0] = a[0];
		b[1] = a[1];
		b[2] = a[2];
		b[3] = a[4];
		b[4] = a[5];
		b[5] = a[6];
		b[6] = a[8];
		b[7] = a[9];
		b[8] = a[10];
		return m
	};
	prototype.copyPosition = function(m) {
		var to = this.data;
		var from = m.data || m;
		to[12] = from[12];
		to[13] = from[13];
		to[14] = from[14];
		return this
	};
	prototype.getCSS = function() {
		var d = this.data;
		return "matrix3d(" + noE(d[0]) + "," + noE(d[1]) + "," + noE(d[2]) + "," + noE(d[3]) + "," + noE(d[4]) + "," + noE(d[5]) + "," + noE(d[6]) + "," + noE(d[7]) + "," + noE(d[8]) + "," + noE(d[9]) + "," + noE(d[10]) + "," + noE(d[11]) + "," + noE(d[12]) + "," + noE(d[13]) + "," + noE(d[14]) + "," + noE(d[15]) + ")"
	};
	prototype.extractPosition = function(v) {
		v = v || new Vector3;
		var d = this.data;
		v.set(d[12], d[13], d[14]);
		return v
	};
	prototype.determinant = function() {
		var d = this.data;
		return d[0] * (d[5] * d[10] - d[9] * d[6]) + d[4] * (d[9] * d[2] - d[1] * d[10]) + d[8] * (d[1] * d[6] - d[5] * d[2])
	};
	prototype.inverse = function(m) {
		var d = this.data;
		var a = m ? m.data || m : this.data;
		var det = this.determinant();
		if(Math.abs(det) < .0001) {
			console.warn("Attempt to inverse a singular Matrix4. ", this.data);
			console.trace();
			return m
		}
		var d0 = d[0],
			d4 = d[4],
			d8 = d[8],
			d12 = d[12],
			d1 = d[1],
			d5 = d[5],
			d9 = d[9],
			d13 = d[13],
			d2 = d[2],
			d6 = d[6],
			d10 = d[10],
			d14 = d[14];
		det = 1 / det;
		a[0] = (d5 * d10 - d9 * d6) * det;
		a[1] = (d8 * d6 - d4 * d10) * det;
		a[2] = (d4 * d9 - d8 * d5) * det;
		a[4] = (d9 * d2 - d1 * d10) * det;
		a[5] = (d0 * d10 - d8 * d2) * det;
		a[6] = (d8 * d1 - d0 * d9) * det;
		a[8] = (d1 * d6 - d5 * d2) * det;
		a[9] = (d4 * d2 - d0 * d6) * det;
		a[10] = (d0 * d5 - d4 * d1) * det;
		a[12] = -(d12 * a[0] + d13 * a[4] + d14 * a[8]);
		a[13] = -(d12 * a[1] + d13 * a[5] + d14 * a[9]);
		a[14] = -(d12 * a[2] + d13 * a[6] + d14 * a[10]);
		return m
	};
	prototype.transpose = function(m) {
		var d = this.data;
		var a = m ? m.data || m : this.data;
		var d0 = d[0],
			d4 = d[4],
			d8 = d[8],
			d1 = d[1],
			d5 = d[5],
			d9 = d[9],
			d2 = d[2],
			d6 = d[6],
			d10 = d[10];
		a[0] = d0;
		a[1] = d4;
		a[2] = d8;
		a[4] = d1;
		a[5] = d5;
		a[6] = d9;
		a[8] = d2;
		a[9] = d6;
		a[10] = d10
	}
}, function() {
	Matrix4.__TEMP__ = (new Matrix4).data
});
Class(function Vector2(_x, _y) {
	var _this = this;
	var prototype = Vector2.prototype;
	this.x = typeof _x == "number" ? _x : 0;
	this.y = typeof _y == "number" ? _y : 0;
	this.type = "vector2";
	if(typeof prototype.set !== "undefined") return;
	prototype.set = function(x, y) {
		this.x = x;
		this.y = y;
		return this
	};
	prototype.clear = function() {
		this.x = 0;
		this.y = 0;
		return this
	};
	prototype.copyTo = function(v) {
		v.x = this.x;
		v.y = this.y;
		return this
	};
	prototype.copyFrom = prototype.copy = function(v) {
		this.x = v.x;
		this.y = v.y;
		return this
	};
	prototype.addVectors = function(a, b) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		return this
	};
	prototype.subVectors = function(a, b) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		return this
	};
	prototype.multiplyVectors = function(a, b) {
		this.x = a.x * b.x;
		this.y = a.y * b.y;
		return this
	};
	prototype.add = function(v) {
		this.x += v.x;
		this.y += v.y;
		return this
	};
	prototype.sub = function(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this
	};
	prototype.multiply = function(v) {
		this.x *= v;
		this.y *= v;
		return this
	};
	prototype.divide = function(v) {
		this.x /= v;
		this.y /= v;
		return this
	};
	prototype.lengthSq = function() {
		return this.x * this.x + this.y * this.y || .00001
	};
	prototype.length = function() {
		return Math.sqrt(this.lengthSq())
	};
	prototype.setLength = function(length) {
		this.normalize().multiply(length);
		return this
	};
	prototype.normalize = function() {
		var length = this.length();
		this.x /= length;
		this.y /= length;
		return this
	};
	prototype.perpendicular = function(a, b) {
		var tx = this.x;
		var ty = this.y;
		this.x = -ty;
		this.y = tx;
		return this
	};
	prototype.lerp = function(v, alpha) {
		this.x += (v.x - this.x) * alpha;
		this.y += (v.y - this.y) * alpha;
		return this
	};
	prototype.interp = function(v, alpha, ease) {
		var a = 0;
		var f = TweenManager.Interpolation.convertEase(ease);
		var calc = Vector2.__TEMP__;
		calc.subVectors(this, v);
		var dist = Utils.clamp(Utils.range(calc.lengthSq(), 0, 5e3 * 5e3, 1, 0), 0, 1) * (alpha / 10);
		if(typeof f === "function") a = f(dist);
		else a = TweenManager.Interpolation.solve(f, dist);
		this.x += (v.x - this.x) * a;
		this.y += (v.y - this.y) * a
	};
	prototype.setAngleRadius = function(a, r) {
		this.x = Math.cos(a) * r;
		this.y = Math.sin(a) * r;
		return this
	};
	prototype.addAngleRadius = function(a, r) {
		this.x += Math.cos(a) * r;
		this.y += Math.sin(a) * r;
		return this
	};
	prototype.clone = function() {
		return new Vector2(this.x, this.y)
	};
	prototype.dot = function(a, b) {
		b = b || this;
		return a.x * b.x + a.y * b.y
	};
	prototype.distanceTo = function(v, noSq) {
		var dx = this.x - v.x;
		var dy = this.y - v.y;
		if(!noSq) return Math.sqrt(dx * dx + dy * dy);
		return dx * dx + dy * dy
	};
	prototype.solveAngle = function(a, b) {
		if(!b) b = this;
		return Math.atan2(a.y - b.y, a.x - b.x)
	};
	prototype.equals = function(v) {
		return this.x == v.x && this.y == v.y
	};
	prototype.console = function() {
		console.log(this.x, this.y)
	};
	prototype.toString = function(split) {
		split = split || " ";
		return this.x + split + this.y
	}
}, function() {
	Vector2.__TEMP__ = new Vector2;
	Vector2.__TEMP2__ = new Vector2
});
Class(function Vector3(_x, _y, _z, _w) {
	var _this = this;
	var prototype = Vector3.prototype;
	this.x = typeof _x === "number" ? _x : 0;
	this.y = typeof _y === "number" ? _y : 0;
	this.z = typeof _z === "number" ? _z : 0;
	this.w = typeof _w === "number" ? _w : 1;
	this.type = "vector3";
	if(typeof prototype.set !== "undefined") return;
	prototype.set = function(x, y, z, w) {
		this.x = x || 0;
		this.y = y || 0;
		this.z = z || 0;
		this.w = w || 1;
		return this
	};
	prototype.clear = function() {
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.w = 1;
		return this
	};
	prototype.copyTo = function(p) {
		p.x = this.x;
		p.y = this.y;
		p.z = this.z;
		p.w = this.w;
		return p
	};
	prototype.copyFrom = prototype.copy = function(p) {
		this.x = p.x || 0;
		this.y = p.y || 0;
		this.z = p.z || 0;
		this.w = p.w || 1;
		return this
	};
	prototype.lengthSq = function() {
		return this.x * this.x + this.y * this.y + this.z * this.z
	};
	prototype.length = function() {
		return Math.sqrt(this.lengthSq())
	};
	prototype.normalize = function() {
		var m = 1 / this.length();
		this.set(this.x * m, this.y * m, this.z * m);
		return this
	};
	prototype.setLength = function(length) {
		this.normalize().multiply(length);
		return this
	};
	prototype.addVectors = function(a, b) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		return this
	};
	prototype.subVectors = function(a, b) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		return this
	};
	prototype.multiplyVectors = function(a, b) {
		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;
		return this
	};
	prototype.add = function(v) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this
	};
	prototype.sub = function(v) {
		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		return this
	};
	prototype.multiply = function(v) {
		this.x *= v;
		this.y *= v;
		this.z *= v;
		return this
	};
	prototype.divide = function(v) {
		this.x /= v;
		this.y /= v;
		this.z /= v;
		return this
	};
	prototype.limit = function(max) {
		if(this.length() > max) {
			this.normalize();
			this.multiply(max)
		}
	};
	prototype.heading2D = function() {
		var angle = Math.atan2(-this.y, this.x);
		return -angle
	};
	prototype.lerp = function(v, alpha) {
		this.x += (v.x - this.x) * alpha;
		this.y += (v.y - this.y) * alpha;
		this.z += (v.z - this.z) * alpha;
		return this
	};
	prototype.deltaLerp = function(v, alpha, delta) {
		delta = delta || 1;
		for(var i = 0; i < delta; i++) {
			var f = alpha;
			this.x += (v.x - this.x) * alpha;
			this.y += (v.y - this.y) * alpha;
			this.z += (v.z - this.z) * alpha
		}
		return this
	};
	prototype.interp = function(v, alpha, ease, dist) {
		if(!Vector3.__TEMP__) Vector3.__TEMP__ = new Vector3;
		dist = dist || 5e3;
		var a = 0;
		var f = TweenManager.Interpolation.convertEase(ease);
		var calc = Vector3.__TEMP__;
		calc.subVectors(this, v);
		var dist = Utils.clamp(Utils.range(calc.lengthSq(), 0, dist * dist, 1, 0), 0, 1) * (alpha / 10);
		if(typeof f === "function") a = f(dist);
		else a = TweenManager.Interpolation.solve(f, dist);
		this.x += (v.x - this.x) * a;
		this.y += (v.y - this.y) * a;
		this.z += (v.z - this.z) * a
	};
	prototype.setAngleRadius = function(a, r) {
		this.x = Math.cos(a) * r;
		this.y = Math.sin(a) * r;
		this.z = Math.sin(a) * r;
		return this
	};
	prototype.addAngleRadius = function(a, r) {
		this.x += Math.cos(a) * r;
		this.y += Math.sin(a) * r;
		this.z += Math.sin(a) * r;
		return this
	};
	prototype.dot = function(a, b) {
		b = b || this;
		return a.x * b.x + a.y * b.y + a.z * b.z
	};
	prototype.clone = function() {
		return new Vector3(this.x, this.y, this.z)
	};
	prototype.cross = function(a, b) {
		if(!b) b = this;
		var x = a.y * b.z - a.z * b.y;
		var y = a.z * b.x - a.x * b.z;
		var z = a.x * b.y - a.y * b.x;
		this.set(x, y, z, this.w);
		return this
	};
	prototype.distanceTo = function(v, noSq) {
		var dx = this.x - v.x;
		var dy = this.y - v.y;
		var dz = this.z - v.z;
		if(!noSq) return Math.sqrt(dx * dx + dy * dy + dz * dz);
		return dx * dx + dy * dy + dz * dz
	};
	prototype.solveAngle = function(a, b) {
		if(!b) b = this;
		return Math.acos(a.dot(b) / (a.length() * b.length() || .00001))
	};
	prototype.solveAngle2D = function(a, b) {
		if(!b) b = this;
		Vector2.__TEMP__.copy(a);
		Vector2.__TEMP2__.copy(b);
		return Vector2.__TEMP__.solveAngle(Vector2.__TEMP2__)
	};
	prototype.equals = function(v) {
		return this.x == v.x && this.y == v.y && this.z == v.z
	};
	prototype.console = function() {
		console.log(this.x, this.y, this.z)
	};
	prototype.toString = function(split) {
		split = split || " ";
		return this.x + split + this.y + split + this.z
	};
	prototype.applyQuaternion = function(q) {
		var x = this.x,
			y = this.y,
			z = this.z;
		var qx = q.x,
			qy = q.y,
			qz = q.z,
			qw = q.w;
		var ix = qw * x + qy * z - qz * y;
		var iy = qw * y + qz * x - qx * z;
		var iz = qw * z + qx * y - qy * x;
		var iw = -qx * x - qy * y - qz * z;
		this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
		return this
	}
}, function() {
	Vector3.__TEMP__ = new Vector3
});
Mobile.Class(function Accelerometer() {
	var _this = this;
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.alpha = 0;
	this.beta = 0;
	this.gamma = 0;
	this.heading = 0;
	this.rotationRate = {};
	this.rotationRate.alpha = 0;
	this.rotationRate.beta = 0;
	this.rotationRate.gamma = 0;
	this.toRadians = Mobile.os == "iOS" ? Math.PI / 180 : 1;
	HydraEvents.createLocalEmitter(this);

	function updateAccel(e) {
		switch(window.orientation) {
			case 0:
				_this.x = -e.accelerationIncludingGravity.x;
				_this.y = e.accelerationIncludingGravity.y;
				_this.z = e.accelerationIncludingGravity.z;
				if(e.rotationRate) {
					_this.rotationRate.alpha = e.rotationRate.beta * _this.toRadians;
					_this.rotationRate.beta = -e.rotationRate.alpha * _this.toRadians;
					_this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
				}
				break;
			case 180:
				_this.x = e.accelerationIncludingGravity.x;
				_this.y = -e.accelerationIncludingGravity.y;
				_this.z = e.accelerationIncludingGravity.z;
				if(e.rotationRate) {
					_this.rotationRate.alpha = -e.rotationRate.beta * _this.toRadians;
					_this.rotationRate.beta = e.rotationRate.alpha * _this.toRadians;
					_this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
				}
				break;
			case 90:
				_this.x = e.accelerationIncludingGravity.y;
				_this.y = e.accelerationIncludingGravity.x;
				_this.z = e.accelerationIncludingGravity.z;
				if(e.rotationRate) {
					_this.rotationRate.alpha = e.rotationRate.alpha * _this.toRadians;
					_this.rotationRate.beta = e.rotationRate.beta * _this.toRadians;
					_this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
				}
				break;
			case -90:
				_this.x = -e.accelerationIncludingGravity.y;
				_this.y = -e.accelerationIncludingGravity.x;
				_this.z = e.accelerationIncludingGravity.z;
				if(e.rotationRate) {
					_this.rotationRate.alpha = -e.rotationRate.alpha * _this.toRadians;
					_this.rotationRate.beta = -e.rotationRate.beta * _this.toRadians;
					_this.rotationRate.gamma = e.rotationRate.gamma * _this.toRadians
				}
				break
		}
		_this.fire("motion", null)
	}

	function updateOrientation(e) {
		for(var key in e) {
			if(key.toLowerCase().strpos("heading")) _this.heading = e[key]
		}
		switch(window.orientation) {
			case 0:
				_this.alpha = e.beta * _this.toRadians;
				_this.beta = -e.alpha * _this.toRadians;
				_this.gamma = e.gamma * _this.toRadians;
				break;
			case 180:
				_this.alpha = -e.beta * _this.toRadians;
				_this.beta = e.alpha * _this.toRadians;
				_this.gamma = e.gamma * _this.toRadians;
				break;
			case 90:
				_this.alpha = e.alpha * _this.toRadians;
				_this.beta = e.beta * _this.toRadians;
				_this.gamma = e.gamma * _this.toRadians;
				break;
			case -90:
				_this.alpha = -e.alpha * _this.toRadians;
				_this.beta = -e.beta * _this.toRadians;
				_this.gamma = e.gamma * _this.toRadians;
				break
		}
		_this.tilt = e.beta * _this.toRadians;
		_this.yaw = e.alpha * _this.toRadians;
		_this.roll = -e.gamma * _this.toRadians;
		if(Mobile.os == "Android") _this.heading = compassHeading(e.alpha, e.beta, e.gamma);
		_this.fire("orientation", null)
	}

	function compassHeading(alpha, beta, gamma) {
		var degtorad = Math.PI / 180;
		var _x = beta ? beta * degtorad : 0;
		var _y = gamma ? gamma * degtorad : 0;
		var _z = alpha ? alpha * degtorad : 0;
		var cX = Math.cos(_x);
		var cY = Math.cos(_y);
		var cZ = Math.cos(_z);
		var sX = Math.sin(_x);
		var sY = Math.sin(_y);
		var sZ = Math.sin(_z);
		var Vx = -cZ * sY - sZ * sX * cY;
		var Vy = -sZ * sY + cZ * sX * cY;
		var compassHeading = Math.atan(Vx / Vy);
		if(Vy < 0) {
			compassHeading += Math.PI
		} else if(Vx < 0) {
			compassHeading += 2 * Math.PI
		}
		return compassHeading * (180 / Math.PI)
	}
	this.capture = function() {
		if(!this.active) {
			this.active = true;
			window.ondevicemotion = updateAccel;
			window.addEventListener("deviceorientation", updateOrientation)
		}
	};
	this.stop = function() {
		this.active = false;
		window.ondevicemotion = null;
		_this.x = _this.y = _this.z = 0;
		window.removeEventListener("deviceorientation", updateOrientation)
	}
}, "Static");
Mobile.Class(function ScreenLock() {
	Inherit(this, Component);
	var _this = this;
	var _lockedNodes = [];
	(function() {
		addListeners()
	}());

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, orientationChange)
	}

	function orientationChange() {
		var width = document.body.clientWidth;
		var height = document.body.clientHeight;
		_lockedNodes.forEach(function(e) {
			if(Device.getFullscreen() && window.screen && window.screen.orientation.lock) {
				window.screen.orientation.lock(e.orientation == "portrait" ? "portrait" : "landscape");
				if(!Mobile.ScreenLock.FORCE_LOCK) return;
				e.object.size(width, height);
				e.object.div.style.transformOrigin = "";
				e.object.div.style.transform = "";
				return
			}
			if(!Mobile.ScreenLock.FORCE_LOCK) return;
			if(width < height) {
				e.object.size(width, height);
				e.object.div.style.transformOrigin = "";
				e.object.div.style.transform = ""
			} else {
				var w = width;
				var h = height;
				width = Math.max(w, h);
				height = Math.min(w, h);
				e.object.size(height, width);
				e.object.div.style.transformOrigin = "0% 0%";
				if(window.orientation == -90 || window.orientation == 180) {
					e.object.div.style.transform = "translateX(" + width + "px) rotate(90deg)"
				} else {
					e.object.div.style.transform = "translateY(" + height + "px) rotate(-90deg)"
				}
			}
		})
	}
	this.lock = function(orientation) {
		_lockedNodes.push({
			object: Stage,
			orientation: orientation
		});
		orientationChange()
	};
	this.unlock = function() {
		var obj = Stage;
		_lockedNodes.every(function(o, i) {
			if(o.object == obj) {
				_lockedNodes.splice(i, 1);
				return false
			}
			return true
		})
	};
	this.forceOrientationChange = orientationChange
}, "static");
Class(function Interaction() {
	Namespace(this);
	this.CLICK = "interaction_click";
	this.START = "interaction_start";
	this.MOVE = "interaction_move";
	this.END = "interaction_end"
}, "static");
Interaction.Class(function Input(_object) {
	Inherit(this, Component);
	var _this = this;
	var _hold = new Vector2;
	var _diff = new Vector2;
	var _lastMove = new Vector2;
	var _distance = new Vector2;
	var _delta = Render.TIME;
	var _lastTime = Render.TIME;
	this.velocity = new Vector2;
	this.clickLimit = 20;
	this.requireDrag = true;
	(function() {
		if(_object instanceof HydraObject) addListeners()
	}());

	function addListeners() {
		if(_object == Stage || _object == __window) Interaction.Input.bind("touchstart", touchStart);
		else _object.bind("touchstart", touchStart);
		Interaction.Input.bind("touchmove", touchMove);
		Interaction.Input.bind("touchend", touchEnd)
	}

	function touchStart(e) {
		_this.touching = true;
		_this.velocity.clear();
		_distance.clear();
		_hold.copyFrom(e);
		_lastMove.copyFrom(e);
		_this.events.fire(Interaction.START, e, true)
	}

	function touchMove(e) {
		if(_this.requireDrag && !_this.touching) return;
		_diff.subVectors(e, _hold);
		_delta = Render.TIME - _lastTime || .01;
		if(_delta >= 16) {
			_this.velocity.subVectors(e, _lastMove);
			_distance.x += Math.abs(_this.velocity.x);
			_distance.y += Math.abs(_this.velocity.y);
			_this.velocity.divide(_delta);
			_lastTime = Render.TIME;
			_lastMove.copyFrom(e)
		}
		e.delta = _diff;
		_this.events.fire(Interaction.MOVE, e, true)
	}

	function touchEnd(e) {
		if(_this.requireDrag && !_this.touching) return;
		_this.touching = false;
		_this.events.fire(Interaction.END, e, true);
		if(_distance.length() < _this.clickLimit) {
			_this.events.fire(Interaction.CLICK, e, true)
		}
	}
	this.attach = function(object) {
		if(_object instanceof HydraObject) _object.unbind("touchstart", touchStart);
		_object = object;
		addListeners()
	};
	this.touchStart = function(e) {
		touchStart({
			x: Mouse.x,
			y: Mouse.y
		})
	};
	this.end = this.touchEnd = function() {
		touchEnd()
	};
	this.set("onStart", callback => {
		_this.events.add(Interaction.START, callback);
		console.warn("Interaction.Input::onStart has switched to Interaction.START Hydra event")
	});
	this.set("onUpdate", callback => {
		_this.events.add(Interaction.MOVE, callback);
		console.warn("Interaction.Input::onUpdate has switched to Interaction.MOVE Hydra event; diff is now e.delta")
	});
	this.set("onEnd", callback => {
		_this.events.add(Interaction.END, callback);
		console.warn("Interaction.Input::onEnd has switched to Interaction.END Hydra event")
	});
	this.set("onClick", callback => {
		_this.events.add(Interaction.CLICK, callback);
		console.warn("Interaction.Input::onClick has switched to Interaction.CLICK Hydra event")
	});
	this.destroy = function() {
		Interaction.Input.unbind("touchmove", touchMove);
		Interaction.Input.unbind("touchstart", touchStart);
		Interaction.Input.unbind("touchend", touchEnd);
		_object && _object.unbind && _object.unbind("touchstart", touchStart);
		return this._destroy()
	}
}, () => {
	var _events = {
		touchstart: [],
		touchmove: [],
		touchend: []
	};
	var _bound;

	function bind() {
		_bound = true;
		__window.bind("touchstart", touchStart);
		__window.bind("touchmove", touchMove);
		__window.bind("touchend", touchEnd);
		__window.bind("touchcancel", touchEnd);
		__window.bind("contextmenu", touchEnd)
	}

	function touchMove(e) {
		_events.touchmove.forEach(function(callback) {
			callback(e)
		})
	}

	function touchStart(e) {
		_events.touchstart.forEach(function(callback) {
			callback(e)
		})
	}

	function touchEnd(e) {
		_events.touchend.forEach(function(callback) {
			callback(e)
		})
	}
	Interaction.Input.bind = function(evt, callback) {
		_events[evt].push(callback);
		if(!_bound) bind()
	};
	Interaction.Input.unbind = function(evt, callback) {
		_events[evt].findAndRemove(callback)
	}
});
Class(function ParticlePhysics(_integrator) {
	Inherit(this, Component);
	var _this = this;
	_integrator = _integrator || new EulerIntegrator;
	var _timestep = 1 / 60;
	var _time = 0;
	var _step = 0;
	var _clock = null;
	var _buffer = 0;
	var _toDelete = [];
	this.friction = 1;
	this.maxSteps = 1;
	this.emitters = new LinkedList;
	this.initializers = new LinkedList;
	this.behaviors = new LinkedList;
	this.particles = new LinkedList;
	this.springs = new LinkedList;

	function init(p) {
		var i = _this.initializers.start();
		while(i) {
			i(p);
			i = _this.initializers.next()
		}
	}

	function updateSprings(dt) {
		var s = _this.springs.start();
		while(s) {
			s.update(dt);
			s = _this.springs.next()
		}
	}

	function deleteParticles() {
		for(var i = _toDelete.length - 1; i > -1; i--) {
			var particle = _toDelete[i];
			_this.particles.remove(particle);
			particle.system = null
		}
		_toDelete.length = 0
	}

	function updateParticles(dt) {
		var index = 0;
		var p = _this.particles.start();
		while(p) {
			if(p.enabled) {
				var b = _this.behaviors.start();
				while(b) {
					b.applyBehavior(p, dt, index);
					b = _this.behaviors.next()
				}
				if(p.behaviors.length) p.update(dt, index)
			}
			index++;
			p = _this.particles.next()
		}
	}

	function integrate(dt) {
		updateParticles(dt);
		if(_this.springs.length) updateSprings(dt);
		if(!_this.skipIntegration) _integrator.integrate(_this.particles, dt, _this.friction)
	}
	this.addEmitter = function(emitter) {
		if(!emitter.emit) throw "Emitter must be Emitter";
		this.emitters.push(emitter);
		emitter.parent = emitter.system = this
	};
	this.removeEmitter = function(emitter) {
		if(!emitter.emit) throw "Emitter must be Emitter";
		this.emitters.remove(emitter);
		emitter.parent = emitter.system = null
	};
	this.addInitializer = function(init) {
		if(typeof init !== "function") throw "Initializer must be a function";
		this.initializers.push(init)
	};
	this.removeInitializer = function(init) {
		this.initializers.remove(init)
	};
	this.addBehavior = function(b) {
		this.behaviors.push(b);
		b.system = this
	};
	this.removeBehavior = function(b) {
		this.behaviors.remove(b)
	};
	this.addParticle = function(p) {
		if(!_integrator.type) {
			if(typeof p.pos.z === "number") _integrator.type = "3D";
			else _integrator.type = "2D"
		}
		p.system = this;
		this.particles.push(p);
		if(this.initializers.length) init(p)
	};
	this.removeParticle = function(p) {
		p.system = null;
		_toDelete.push(p)
	};
	this.addSpring = function(s) {
		s.system = this;
		this.springs.push(s)
	};
	this.removeSpring = function(s) {
		s.system = null;
		this.springs.remove(s)
	};
	this.update = function(force) {
		if(!_clock) _clock = THREAD ? Date.now() : Render.TIME;
		var time = THREAD ? Date.now() : Render.TIME;
		var delta = time - _clock;
		if(!force && delta <= 0) return;
		delta *= .001;
		_clock = time;
		_buffer += delta;
		if(!force) {
			var i = 0;
			while(_buffer >= _timestep && i++ < _this.maxSteps) {
				integrate(_timestep);
				_buffer -= _timestep;
				_time += _timestep
			}
		} else {
			integrate(.016)
		}
		_step = Date.now() - time;
		if(_toDelete.length) deleteParticles()
	}
});
Class(function Particle(_pos, _mass, _radius) {
	var _this = this;
	var _vel, _acc, _old;
	var prototype = Particle.prototype;
	this.mass = _mass || 1;
	this.massInv = 1 / this.mass;
	this.enabled = true;
	this.radius = _radius || 1;
	this.radiusSq = this.radius * this.radius;
	this.behaviors = new LinkedList;
	this.fixed = false;
	(function() {
		initVectors()
	}());

	function initVectors() {
		var Vector = typeof _pos.z === "number" ? Vector3 : Vector2;
		_pos = _pos || new Vector;
		_vel = new Vector;
		_acc = new Vector;
		_old = {};
		_old.pos = new Vector;
		_old.acc = new Vector;
		_old.vel = new Vector;
		_old.pos.copyFrom(_pos);
		_this.pos = _this.position = _pos;
		_this.vel = _this.velocity = _vel;
		_this.acc = _this.acceleration = _acc;
		_this.old = _old
	}
	this.moveTo = function(pos) {
		_pos.copyFrom(pos);
		_old.pos.copyFrom(_pos);
		_acc.clear();
		_vel.clear()
	};
	if(typeof prototype.setMass !== "undefined") return;
	prototype.setMass = function(mass) {
		this.mass = mass || 1;
		this.massInv = 1 / this.mass
	};
	prototype.setRadius = function(radius) {
		this.radius = radius;
		this.radiusSq = radius * radius
	};
	prototype.update = function(dt) {
		if(!this.behaviors.length) return;
		var b = this.behaviors.start();
		while(b) {
			b.applyBehavior(this, dt);
			b = this.behaviors.next()
		}
	};
	prototype.applyForce = function(force) {
		this.acc.add(force)
	};
	prototype.addBehavior = function(behavior) {
		if(!behavior || typeof behavior.applyBehavior === "undefined") throw "Behavior must have applyBehavior method";
		this.behaviors.push(behavior)
	};
	prototype.removeBehavior = function(behavior) {
		if(!behavior || typeof behavior.applyBehavior === "undefined") throw "Behavior must have applyBehavior method";
		this.behaviors.remove(behavior)
	}
});
Class(function EulerIntegrator() {
	Inherit(this, Component);
	var _this = this;
	var _vel, _accel;
	this.useDeltaTime = false;
	(function() {}());

	function createVectors() {
		var Vector = _this.type == "3D" ? Vector3 : Vector2;
		_vel = new Vector;
		_accel = new Vector
	}
	this.integrate = function(particles, dt, drag) {
		if(!_vel) createVectors();
		var dtSq = dt * dt;
		var p = particles.start();
		while(p) {
			if(!p.fixed && !p.disabled) {
				p.old.pos.copyFrom(p.pos);
				p.acc.multiply(p.massInv);
				_vel.copyFrom(p.vel);
				_accel.copyFrom(p.acc);
				if(this.useDeltaTime) {
					p.pos.add(_vel.multiply(dt)).add(_accel.multiply(.5 * dtSq));
					p.vel.add(p.acc.multiply(dt))
				} else {
					p.pos.add(_vel).add(_accel.multiply(.5));
					p.vel.add(p.acc)
				}
				if(drag) p.vel.multiply(drag);
				p.acc.clear()
			}
			if(p.saveTo) p.pos.copyTo(p.saveTo);
			p = particles.next()
		}
	}
});
Class(function Emitter(_position, _startNumber) {
	Inherit(this, Component);
	var _this = this;
	var _pool;
	var _total = 0;
	var Vector = _position.type == "vector3" ? Vector3 : Vector2;
	this.initializers = [];
	this.position = _position;
	this.autoEmit = 1;
	this.persist = true;
	(function() {
		initObjectPool();
		if(_startNumber != 0) addParticles(_startNumber || 100)
	}());

	function initObjectPool() {
		_pool = _this.initClass(ObjectPool);
		_this.pool = _pool
	}

	function addParticles(total) {
		_total += total;
		var particles = [];
		for(var i = 0; i < total; i++) {
			particles.push(new Particle)
		}
		_pool.insert(particles)
	}
	this.addInitializer = function(callback) {
		if(typeof callback !== "function") throw "Initializer must be a function";
		this.initializers.push(callback)
	};
	this.removeInitializer = function(callback) {
		var index = this.initializers.indexOf(callback);
		if(index > -1) this.initializers.splice(index, 1)
	};
	this.emit = function(num) {
		if(!this.parent) throw "Emitter needs to be added to a System";
		num = num || this.autoEmit;
		for(var i = 0; i < num; i++) {
			var p = _pool.get();
			if(!p) return;
			p.moveTo(this.position);
			p.emitter = this;
			p.enabled = true;
			if(!p.system) this.parent.addParticle(p);
			for(var j = 0; j < this.initializers.length; j++) {
				this.initializers[j](p, i / num)
			}
		}
	};
	this.remove = function(particle) {
		_pool.put(particle);
		if(!_this.persist) _this.parent.removeParticle(particle);
		particle.enabled = false
	};
	this.mix = function() {
		for(var i = 0; i < 6; i++) Utils.shuffleArray(_pool.array)
	};
	this.addToPool = function(particle) {
		_pool.put(particle);
		if(!_this.persist && particle.system) _this.parent.removeParticle(particle);
		particle.enabled = false
	}
});
Class(function SplitTextfield() {
	var _style = {
		display: "block",
		position: "relative",
		padding: 0,
		margin: 0,
		cssFloat: "left",
		styleFloat: "left",
		width: "auto",
		height: "auto"
	};

	function splitLetter($obj) {
		var _array = [];
		var text = $obj.div.innerHTML;
		var split = text.split("");
		$obj.div.innerHTML = "";
		for(var i = 0; i < split.length; i++) {
			if(split[i] == " ") split[i] = "&nbsp;";
			var letter = $("t", "span");
			letter.html(split[i], true).css(_style);
			_array.push(letter);
			$obj.addChild(letter)
		}
		return _array
	}

	function splitWord($obj) {
		var _array = [];
		var text = $obj.div.innerHTML;
		var split = text.split(" ");
		$obj.empty();
		for(var i = 0; i < split.length; i++) {
			var word = $("t", "span");
			var empty = $("t", "span");
			word.html(split[i]).css(_style);
			empty.html("&nbsp", true).css(_style);
			_array.push(word);
			_array.push(empty);
			$obj.addChild(word);
			$obj.addChild(empty)
		}
		return _array
	}
	this.split = function($obj, by) {
		if(by == "word") return splitWord($obj);
		else return splitLetter($obj)
	}
}, "Static");
Class(function CSSFilter($object, _vert, _frag) {
	Inherit(this, Component);
	var _this = this;
	var _filter = "";
	var _filters = ["grayscale", "sepia", "saturate", "hue", "invert", "opacity", "brightness", "contrast", "blur"];
	var _killTween, _tween;

	function checkFilter(key) {
		for(var i = _filters.length - 1; i > -1; i--) {
			if(_filters[i] == key) return true
		}
		return false
	}

	function buildFilters() {
		var str = "";
		var len = _filters.length - 1;
		for(var key in _this) {
			if(!checkFilter(key)) continue;
			var filter = key;
			var value = _this[key];
			if(typeof value === "number") {
				filter = filter == "hue" ? "hue-rotate" : filter;
				value = filter == "hue-rotate" ? value + "deg" : value;
				value = filter == "blur" ? value + "px" : value;
				str += filter + "(" + value + ") "
			}
		}
		_filter = str
	}

	function clearTween() {
		if(_tween || !$object || !$object.div) return false;
		$object.div.style[CSS.prefix("Transition")] = ""
	}
	this.apply = function() {
		buildFilters();
		$object.div.style[CSS.prefix("Filter")] = _filter
	};
	this.tween = function(props, time, ease, delay, callback) {
		if(typeof delay === "function") {
			callback = delay;
			delay = 0
		}
		delay = delay || 0;
		_killTween = false;
		var filter = "-" + Device.styles.vendor.toLowerCase() + "-filter";
		$object.willChange(filter);
		Render.setupTween(function() {
			if(_killTween) return;
			$object.div.style[CSS.prefix("Transition")] = filter + " " + time + "ms " + TweenManager.getEase(ease) + " " + delay + "ms";
			for(var key in props) {
				_this[key] = props[key]
			}
			_tween = _this.delayedCall(function() {
				$object.willChange(null);
				if(callback) callback()
			}, time + delay);
			_this.apply()
		})
	};
	this.stopTween = function() {
		clearTimeout(_tween);
		_killTween = true;
		clearTween()
	};
	this.clear = function() {
		for(var key in _this) {
			if(checkFilter(key)) delete _this[key]
		}
		if(_tween) this.stopTween();
		this.apply()
	};
	this.destroy = function() {
		this.clear();
		$object = null;
		_tween = null;
		return this._destroy()
	}
});
Class(function CSSAnimation() {
	Inherit(this, Component);
	var _this = this;
	var _name = "a" + Utils.timestamp();
	var _frames, _timer, _started;
	var _duration = 1e3;
	var _ease = "linear";
	var _delay = 0;
	var _loop = false;
	var _count = 1;
	var _steps = null;
	var _applyTo = [];
	(function() {}());

	function complete() {
		_this.playing = false;
		if(_this.events) _this.events.fire(HydraEvents.COMPLETE, null, true)
	}

	function updateCSS() {
		var css = CSS._read();
		var id = "/*" + _name + "*/";
		var keyframe = "@" + Device.vendor + "keyframes " + _name + " {\n";
		var string = id + keyframe;
		if(css.strpos(_name)) {
			var split = css.split(id);
			css = css.replace(id + split[1] + id, "")
		}
		var steps = _frames.length - 1;
		var perc = Math.round(100 / steps);
		var total = 0;
		for(var i = 0; i < _frames.length; i++) {
			var frame = _frames[i];
			if(i == _frames.length - 1) total = 100;
			string += (frame.percent || total) + "% {\n";
			var hasTransform = false;
			var transforms = {};
			var styles = {};
			for(var key in frame) {
				if(TweenManager.checkTransform(key)) {
					transforms[key] = frame[key];
					hasTransform = true
				} else {
					styles[key] = frame[key]
				}
			}
			if(hasTransform) {
				string += Device.vendor + "transform: " + TweenManager.parseTransform(transforms) + ";"
			}
			for(key in styles) {
				var val = styles[key];
				if(typeof val !== "string" && key != "opacity" && key != "zIndex") val += "px";
				string += CSS._toCSS(key) + ": " + val + ";"
			}
			string += "\n}\n";
			total += perc
		}
		string += "}" + id;
		css += string;
		CSS._write(css)
	}

	function destroy() {
		var css = CSS._read();
		var id = "/*" + _name + "*/";
		if(css.strpos(_name)) {
			var split = css.split(id);
			css = css.replace(id + split[1] + id, "")
		}
		CSS._write(css)
	}

	function applyTo(callback) {
		for(var i = _applyTo.length - 1; i > -1; i--) callback(_applyTo[i])
	}
	this.set("frames", function(frames) {
		_frames = frames;
		updateCSS()
	});
	this.set("steps", function(steps) {
		_steps = steps;
		if(_this.playing) {
			applyTo(function($obj) {
				$obj.div.style[CSS.prefix("AnimationTimingFunction")] = "steps(" + steps + ")"
			})
		}
	});
	this.set("duration", function(duration) {
		_duration = Math.round(duration);
		if(_this.playing) {
			applyTo(function($obj) {
				$obj.div.style[CSS.prefix("AnimationDuration")] = _this.duration + "ms"
			})
		}
	});
	this.get("duration", function() {
		return _duration
	});
	this.set("ease", function(ease) {
		_ease = ease;
		if(_this.playing) {
			applyTo(function($obj) {
				$obj.div.style[CSS.prefix("AnimationTimingFunction")] = TweenManager.getEase(_ease)
			})
		}
	});
	this.get("ease", function() {
		return _ease
	});
	this.set("loop", function(loop) {
		_loop = loop;
		if(_this.playing) {
			applyTo(function($obj) {
				$obj.div.style[CSS.prefix("AnimationIterationCount")] = _loop ? "infinite" : _count
			})
		}
	});
	this.get("loop", function() {
		return _loop
	});
	this.set("count", function(count) {
		_count = count;
		if(_this.playing) {
			applyTo(function($obj) {
				$obj.div.style[CSS.prefix("AnimationIterationCount")] = _loop ? "infinite" : _count
			})
		}
	});
	this.get("count", function() {
		return _count
	});
	this.set("delay", function(delay) {
		_delay = delay;
		if(_this.playing) {
			applyTo(function($obj) {
				$obj.div.style[CSS.prefix("AnimationDelay")] = _delay + "ms"
			})
		}
	});
	this.get("delay", function() {
		return _delay
	});
	this.play = function() {
		applyTo(function($obj) {
			defer(function() {
				$obj.div.style[CSS.prefix("Animation")] = _name + " " + _this.duration + "ms " + (_steps ? "steps(" + _steps + ")" : TweenManager.getEase(_ease)) + " " + (_loop ? "infinite" : _count);
				$obj.div.style[CSS.prefix("AnimationPlayState")] = "running"
			})
		});
		_this.playing = true;
		clearTimeout(_timer);
		if(!_this.loop) {
			_started = Date.now();
			_timer = _this.delayedCall(complete, _count * _duration)
		}
	};
	this.pause = function() {
		_this.playing = false;
		clearTimeout(_timer);
		applyTo(function($obj) {
			$obj.div.style[CSS.prefix("AnimationPlayState")] = "paused"
		})
	};
	this.stop = function() {
		_this.playing = false;
		clearTimeout(_timer);
		applyTo(function($obj) {
			$obj.div.style[CSS.prefix("AnimationName")] = ""
		})
	};
	this.applyTo = function($obj) {
		_applyTo.push($obj);
		if(_this.playing) {
			defer(function() {
				$obj.div.style[CSS.prefix("Animation")] = _name + " " + _this.duration + "ms " + (_steps ? "steps(" + _steps + ")" : TweenManager.getEase(_ease)) + " " + (_loop ? "infinite" : _count);
				$obj.div.style[CSS.prefix("AnimationPlayState")] = "running"
			})
		}
	};
	this.remove = function($obj) {
		$obj.div.style[CSS.prefix("AnimationName")] = "";
		var i = _applyTo.indexOf($obj);
		if(i > -1) _applyTo.splice(i, 1)
	};
	this.destroy = function() {
		if(!this._destroy) return;
		this.stop();
		_frames = null;
		destroy();
		return this._destroy()
	}
});
Class(function Canvas(_width, _height, _retina) {
	Inherit(this, Component);
	var _this = this;
	var _interactive, _over, _down, _local, _imgData;
	this.children = [];
	this.offset = {
		x: 0,
		y: 0
	};
	this.retina = _retina;
	(function() {
		if(_retina instanceof HydraObject) {
			initAsBackground(_retina)
		} else {
			initAsElement()
		}
		_this.width = _width;
		_this.height = _height;
		_this.context._matrix = new Matrix2;
		resize(_width, _height, _retina)
	}());

	function initAsBackground() {
		var id = "c" + Utils.timestamp();
		_this.context = document.getCSSCanvasContext("2d", id, _width, _height);
		_this.background = "-" + Device.styles.vendor.toLowerCase() + "-canvas(" + id + ")";
		_retina.css({
			backgroundImage: _this.background
		});
		_retina = null
	}

	function initAsElement() {
		_this.div = document.createElement("canvas");
		_this.context = _this.div.getContext("2d");
		_this.object = $(_this.div)
	}

	function resize(w, h, retina) {
		var ratio = retina && Device.system.retina ? 2 : 1;
		if(_this.div) {
			_this.div.width = w * ratio;
			_this.div.height = h * ratio
		}
		_this.width = w;
		_this.height = h;
		_this.scale = ratio;
		if(_this.object) _this.object.size(_this.width, _this.height);
		if(Device.system.retina && retina) {
			_this.context.scale(ratio, ratio);
			_this.div.style.width = w + "px";
			_this.div.style.height = h + "px"
		}
	}

	function findHit(e) {
		e = Utils.touchEvent(e);
		e.x -= _this.offset.x;
		e.y -= _this.offset.y;
		e.width = 1;
		e.height = 1;
		for(var i = _this.children.length - 1; i > -1; i--) {
			var hit = _this.children[i].hit(e);
			if(hit) return hit
		}
		return false
	}

	function touchStart(e) {
		var hit = findHit(e);
		if(!hit) return _this.interacting = false;
		_this.interacting = true;
		_down = hit;
		if(Device.mobile) {
			hit.events.fire(HydraEvents.HOVER, {
				action: "over"
			}, true);
			hit.__time = Date.now()
		}
	}

	function touchMove(e) {
		var hit = findHit(e);
		if(hit) _this.interacting = true;
		else _this.interacting = false;
		if(!Device.mobile) {
			if(hit && _over) {
				if(hit != _over) {
					_over.events.fire(HydraEvents.HOVER, {
						action: "out"
					}, true);
					hit.events.fire(HydraEvents.HOVER, {
						action: "over"
					}, true);
					_over = hit
				}
			} else if(hit && !_over) {
				_over = hit;
				hit.events.fire(HydraEvents.HOVER, {
					action: "over"
				}, true)
			} else if(!hit && _over) {
				if(_over) _over.events.fire(HydraEvents.HOVER, {
					action: "out"
				}, true);
				_over = null
			}
		}
	}

	function touchEnd(e) {
		var hit = findHit(e);
		if(hit) _this.interacting = true;
		else _this.interacting = false;
		if(!_down && !hit) return;
		if(!Device.mobile) {
			if(hit && hit == _down) hit.events.fire(HydraEvents.CLICK, {
				action: "click"
			}, true)
		} else {
			if(_down) _down.events.fire(HydraEvents.HOVER, {
				action: "out"
			}, true);
			if(hit == _down) {
				if(Date.now() - _down.__time < 750) hit.events.fire(HydraEvents.CLICK, {
					action: "click"
				}, true)
			}
		}
		_down = null
	}
	this.set("interactive", function(val) {
		if(!_interactive && val) {
			Stage.bind("touchstart", touchStart);
			Stage.bind("touchmove", touchMove);
			Stage.bind("touchend", touchEnd)
		} else if(_interactive && !val) {
			Stage.unbind("touchstart", touchStart);
			Stage.unbind("touchmove", touchMove);
			Stage.unbind("touchend", touchEnd)
		}
		_interactive = val
	});
	this.get("interactive", function() {
		return _interactive
	});
	this.toDataURL = function(type, quality) {
		return _this.div.toDataURL(type, quality)
	};
	this.sort = function() {
		_objects.sort(function(a, b) {
			return a.z - b.z
		})
	};
	this.render = function(noClear) {
		if(!(typeof noClear === "boolean" && noClear)) _this.clear();
		var len = _this.children.length;
		for(var i = 0; i < len; i++) {
			_this.children[i].render()
		}
		this._rendered = Render.TIME
	};
	this.clear = function() {
		_this.context.clearRect(0, 0, _this.div.width, _this.div.height)
	};
	this.add = function(display) {
		display.setCanvas(this);
		display._parent = this;
		this.children.push(display);
		display._z = this.children.length
	};
	this.remove = function(display) {
		display._canvas = null;
		display._parent = null;
		var i = this.children.indexOf(display);
		if(i > -1) this.children.splice(i, 1)
	};
	this.destroy = function() {
		if(_interactive) {
			Stage.unbind("touchstart", touchStart);
			Stage.unbind("touchmove", touchMove);
			Stage.unbind("touchend", touchEnd)
		}
		this.stopRender();
		for(var i = 0; i < this.children.length; i++) {
			if(this.children[i].destroy) this.children[i].destroy()
		}
		return this._destroy()
	};
	this.startRender = function() {
		Render.startRender(_this.render)
	};
	this.stopRender = function() {
		Render.stopRender(_this.render)
	};
	this.getImageData = function(x, y, w, h) {
		this.imageData = this.context.getImageData(x || 0, y || 0, w || this.width, h || this.height);
		return this.imageData
	};
	this.getPixel = function(x, y, dirty) {
		if(!this.imageData || dirty) _this.getImageData(0, 0, _this.width, _this.height);
		if(!_imgData) _imgData = {};
		var index = (x + y * _this.width) * 4;
		var pixels = this.imageData.data;
		_imgData.r = pixels[index];
		_imgData.g = pixels[index + 1];
		_imgData.b = pixels[index + 2];
		_imgData.a = pixels[index + 3];
		return _imgData
	};
	this.texture = function(src) {
		var img = new Image;
		img.src = src;
		return img
	};
	this.localizeMouse = function() {
		_local = _local || {};
		_local.x = Mouse.x - _this.offset.x;
		_local.y = Mouse.y - _this.offset.y;
		return _local
	};
	this.size = resize
});
Class(function CanvasTexture(_texture, _w, _h, _force) {
	Inherit(this, CanvasObject);
	var _this = this;
	var _mask;
	this.width = _w || 0;
	this.height = _h || 0;
	(function() {
		initTexture()
	}());

	function initTexture() {
		if(typeof _texture === "string") {
			_texture = CanvasTexture.createImage(_texture, _force);
			if(_texture.width > 0) setDimensions();
			else _texture.onload = setDimensions
		} else {
			setDimensions()
		}
		_this.texture = _texture
	}

	function setDimensions() {
		if(_this.onload) _this.onload();
		if(!_this.width && !_this.height) {
			_this.width = _texture.width / (_this._canvas && _this._canvas.retina ? 2 : 1);
			_this.height = _texture.height / (_this._canvas && _this._canvas.retina ? 2 : 1)
		}
	}
	this.set("texture", function(img) {
		_texture = img
	});
	this.draw = function(override) {
		var context = this._canvas.context;
		if(this.isMask() && !override) return false;
		if(_texture) {
			this.startDraw(this.anchor.tx, this.anchor.ty, override);
			context.drawImage(_texture, -this.anchor.tx, -this.anchor.ty, this.width, this.height);
			this.endDraw()
		}
		if(_mask) {
			context.globalCompositeOperation = "source-in";
			_mask.render(true);
			context.globalCompositeOperation = "source-over"
		}
	};
	this.mask = function(object) {
		if(!object) return _mask = null;
		if(!this._parent) throw "CanvasTexture :: Must add to parent before masking.";
		var siblings = this._parent.children;
		var canMask = false;
		for(var i = 0; i < siblings.length; i++) {
			if(object == siblings[i]) canMask = true
		}
		if(canMask) {
			_mask = object;
			object.masked = this
		} else {
			throw "CanvasGraphics :: Can only mask a sibling"
		}
	}
}, function() {
	var _images = {};
	CanvasTexture.createImage = function(src, force) {
		if(!_images[src] || force) {
			var img = Images.createImg(src);
			if(force) return img;
			_images[src] = img
		}
		return _images[src]
	}
});
Class(function CanvasGraphics(_w, _h) {
	Inherit(this, CanvasObject);
	var _this = this;
	var _props = {};
	var _draw = [];
	var _pool, _mask;
	this.width = _w || 0;
	this.height = _h || 0;
	(function() {
		initArrayPool()
	}());

	function setProperties(context) {
		for(var key in _props) {
			var val = _props[key];
			if(val instanceof Color) {
				context[key] = val.getHexString()
			} else {
				context[key] = val
			}
		}
	}

	function initArrayPool() {
		_pool = new ObjectPool(Array, 25)
	}

	function draw() {
		var array = _pool.get() || [];
		for(var i = 0; i < arguments.length; i++) {
			array[i] = arguments[i]
		}
		_draw.push(array)
	}
	this.set("strokeStyle", function(val) {
		_props.strokeStyle = val
	});
	this.get("strokeStyle", function() {
		return _props.strokeStyle
	});
	this.set("fillStyle", function(val) {
		_props.fillStyle = val
	});
	this.get("fillStyle", function() {
		return _props.fillStyle
	});
	this.set("lineWidth", function(val) {
		_props.lineWidth = val
	});
	this.get("lineWidth", function() {
		return _props.lineWidth
	});
	this.set("lineWidth", function(val) {
		_props.lineWidth = val
	});
	this.get("lineWidth", function() {
		return _props.lineWidth
	});
	this.set("lineCap", function(val) {
		_props.lineCap = val
	});
	this.get("lineCap", function() {
		return _props.lineCap
	});
	this.set("lineDashOffset", function(val) {
		_props.lineDashOffset = val
	});
	this.get("lineDashOffset", function() {
		return _props.lineDashOffset
	});
	this.set("lineJoin", function(val) {
		_props.lineJoin = val
	});
	this.get("lineJoin", function() {
		return _props.lineJoin
	});
	this.set("lineJoin", function(val) {
		_props.lineJoin = val
	});
	this.get("lineJoin", function() {
		return _props.lineJoin
	});
	this.set("lineJoin", function(val) {
		_props.lineJoin = val
	});
	this.get("lineJoin", function() {
		return _props.lineJoin
	});
	this.set("miterLimit", function(val) {
		_props.miterLimit = val
	});
	this.get("miterLimit", function() {
		return _props.miterLimit
	});
	this.set("font", function(val) {
		_props.font = val
	});
	this.get("font", function(val) {
		return _props.font
	});
	this.set("textAlign", function(val) {
		_props.textAlign = val
	});
	this.get("textAlign", function(val) {
		return _props.textAlign
	});
	this.set("textBaseline", function(val) {
		_props.textBaseline = val
	});
	this.get("textBaseline", function(val) {
		return _props.textBaseline
	});
	this.draw = function(override) {
		if(this.isMask() && !override) return false;
		var context = this._canvas.context;
		this.startDraw(-this.anchor.tx, -this.anchor.ty);
		setProperties(context);
		for(var i = 0; i < _draw.length; i++) {
			var cmd = _draw[i];
			if(!cmd) continue;
			var fn = cmd.shift();
			context[fn].apply(context, cmd);
			cmd.unshift(fn)
		}
		this.endDraw();
		if(_mask) {
			context.save();
			context.clip();
			_mask.render(true);
			context.restore()
		}
	};
	this.clear = function() {
		for(var i = 0; i < _draw.length; i++) {
			_draw[i].length = 0;
			_pool.put(_draw[i])
		}
		_draw.length = 0
	};
	this.arc = function(x, y, endAngle, radius, startAngle, anti) {
		if(x && !y) {
			endAngle = x;
			x = 0;
			y = 0
		}
		x = x || 0;
		y = y || 0;
		endAngle = endAngle || 0;
		endAngle -= 90;
		anti = anti || false;
		startAngle = startAngle || 0;
		startAngle -= 90;
		radius = radius ? radius : this.radius || this.width / 2;
		draw("beginPath");
		draw("arc", x, y, radius, Utils.toRadians(startAngle), Utils.toRadians(endAngle), anti)
	};
	this.quadraticCurveTo = function(cpx, cpy, x, y) {
		draw("quadraticCurveTo", cpx, cpy, x, y)
	};
	this.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
		draw("bezierCurveTo", cp1x, cp1y, cp2x, cp2y, x, y)
	};
	this.fillRect = function(x, y, w, h) {
		draw("fillRect", x, y, w, h)
	};
	this.clearRect = function(x, y, w, h) {
		draw("clearRect", x, y, w, h)
	};
	this.strokeRect = function(x, y, w, h) {
		draw("strokeRect", x, y, w, h)
	};
	this.moveTo = function(x, y) {
		draw("moveTo", x, y)
	};
	this.lineTo = function(x, y) {
		draw("lineTo", x, y)
	};
	this.stroke = function() {
		draw("stroke")
	};
	this.fill = function() {
		if(!_mask) draw("fill")
	};
	this.beginPath = function() {
		draw("beginPath")
	};
	this.closePath = function() {
		draw("closePath")
	};
	this.fillText = function(text, x, y) {
		draw("fillText", text, x, y)
	};
	this.strokeText = function(text, x, y) {
		draw("strokeText", text, x, y)
	};
	this.setLineDash = function(value) {
		draw("setLineDash", value)
	};
	this.mask = function(object) {
		if(!object) return _mask = null;
		if(!this._parent) throw "CanvasTexture :: Must add to parent before masking.";
		var siblings = this._parent.children;
		var canMask = false;
		for(var i = 0; i < siblings.length; i++) {
			if(object == siblings[i]) canMask = true
		}
		if(canMask) {
			_mask = object;
			object.masked = this;
			for(i = 0; i < _draw.length; i++) {
				if(_draw[i][0] == "fill" || _draw[i][0] == "stroke") {
					_draw[i].length = 0;
					_pool.put(_draw[i]);
					_draw.splice(i, 1)
				}
			}
		} else {
			throw "CanvasGraphics :: Can only mask a sibling"
		}
	}
});
Class(function CanvasObject() {
	Inherit(this, Component);
	var _this = this;
	this.alpha = 1;
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.rotation = 0;
	this.scale = 1;
	this.visible = true;
	this.anchor = {
		x: .5,
		y: .5
	};
	this.values = new CanvasValues;
	this.styles = new CanvasValues(true);
	this.children = [];
	this.blendMode = "normal";
	this.updateValues = function() {
		this.anchor.tx = this.anchor.x <= 1 && !this.anchor.full ? this.anchor.x * this.width : this.anchor.x;
		this.anchor.ty = this.anchor.y <= 1 && !this.anchor.full ? this.anchor.y * this.height : this.anchor.y;
		this.values.setTRSA(this.x, this.y, Utils.toRadians(this.rotation), this.scaleX || this.scale, this.scaleY || this.scale, this.alpha);
		if(this._parent.values) this.values.calculate(this._parent.values);
		if(this._parent.styles) this.styles.calculateStyle(this._parent.styles)
	};
	this.render = function(override) {
		if(!this.visible) return false;
		this.updateValues();
		if(this.draw) this.draw(override);
		var len = this.children.length;
		for(var i = 0; i < len; i++) {
			this.children[i].render(override)
		}
	};
	this.startDraw = function(ox, oy, override) {
		var context = this._canvas.context;
		var v = this.values.data;
		var x = v[0] + (ox || 0);
		var y = v[1] + (oy || 0);
		if(this.styles.styled) context.save();
		context._matrix.setTRS(x, y, v[2], v[3], v[4]);
		if(!override) context.globalCompositeOperation = this.blendMode || "normal";
		var m = context._matrix.data;
		context.transform(m[0], m[3], m[1], m[4], m[2], m[5]);
		context.globalAlpha = v[5];
		if(this.styles.styled) {
			var values = this.styles.values;
			for(var key in values) {
				var val = values[key];
				if(val instanceof Color) {
					context[key] = val.getHexString()
				} else {
					context[key] = val
				}
			}
		}
	};
	this.endDraw = function() {
		var context = this._canvas.context;
		context._matrix.inverse();
		var m = context._matrix.data;
		if(this.styles.styled) context.restore();
		else context.transform(m[0], m[3], m[1], m[4], m[2], m[5])
	};
	this.add = function(display) {
		display._canvas = this._canvas;
		display._parent = this;
		this.children.push(display);
		display._z = this.children.length
	};
	this.setCanvas = function(canvas) {
		this._canvas = canvas;
		for(var i = this.children.length - 1; i > -1; i--) {
			var child = this.children[i];
			child.setCanvas(canvas)
		}
	};
	this.remove = function(display) {
		display._canvas = null;
		display._parent = null;
		var i = this.children.indexOf(display);
		if(i > -1) this.children.splice(i, 1)
	};
	this.isMask = function() {
		var obj = this;
		while(obj) {
			if(obj.masked) return true;
			obj = obj._parent
		}
		return false
	};
	this.unmask = function() {
		this.masked.mask(null);
		this.masked = null
	};
	this.setZ = function(z) {
		if(!this._parent) throw "CanvasObject :: Must add to parent before setZ";
		this._z = z;
		this._parent.children.sort(function(a, b) {
			return a._z - b._z
		})
	};
	this.hit = function(e) {
		if(!this.ignoreHit) {
			var hit = Utils.hitTestObject(e, this.values.hit(this));
			if(hit) return this
		}
		for(var i = this.children.length - 1; i > -1; i--) {
			var child = this.children[i];
			hit = child.hit(e);
			if(hit) return child
		}
		return false
	};
	this.destroy = function() {
		for(var i = 0; i < this.children.length; i++) {
			if(this.children[i].destroy) this.children[i].destroy()
		}
		return Utils.nullObject(this)
	}
});
Class(function CanvasValues(_style) {
	Inherit(this, Component);
	var _this = this;
	var _styles = {};
	var _hit = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	if(!_style) {
		this.data = new Float32Array(6)
	} else {
		this.styled = false
	}
	this.set("shadowOffsetX", function(val) {
		_this.styled = true;
		_styles.shadowOffsetX = val
	});
	this.get("shadowOffsetX", function() {
		return _styles.shadowOffsetX
	});
	this.set("shadowOffsetY", function(val) {
		_this.styled = true;
		_styles.shadowOffsetY = val
	});
	this.get("shadowOffsetY", function() {
		return _styles.shadowOffsetY
	});
	this.set("shadowBlur", function(val) {
		_this.styled = true;
		_styles.shadowBlur = val
	});
	this.get("shadowBlur", function() {
		return _styles.shadowBlur
	});
	this.set("shadowColor", function(val) {
		_this.styled = true;
		_styles.shadowColor = val
	});
	this.get("shadowColor", function() {
		_this.styled = true;
		return _styles.shadowColor
	});
	this.get("values", function() {
		return _styles
	});
	this.setTRSA = function(x, y, r, sx, sy, a) {
		var m = this.data;
		m[0] = x;
		m[1] = y;
		m[2] = r;
		m[3] = sx;
		m[4] = sy;
		m[5] = a
	};
	this.calculate = function(values) {
		var v = values.data;
		var m = this.data;
		m[0] = m[0] + v[0];
		m[1] = m[1] + v[1];
		m[2] = m[2] + v[2];
		m[3] = m[3] * v[3];
		m[4] = m[4] * v[4];
		m[5] = m[5] * v[5]
	};
	this.calculateStyle = function(parent) {
		if(!parent.styled) return false;
		this.styled = true;
		var values = parent.values;
		for(var key in values) {
			if(!_styles[key]) _styles[key] = values[key]
		}
	};
	this.hit = function(object) {
		_hit.x = this.data[0];
		_hit.y = this.data[1];
		_hit.width = object.width;
		_hit.height = object.height;
		return _hit
	}
});
Class(function GLStage(_width, _height, _retina, _options) {
	Inherit(this, Component);
	var _this = this;
	var _canvas, _gl, _composer;
	var _texture, _utils, _extensions;
	this.children = [];
	this.retina = _retina;
	(function() {
		initCanvas();
		resize(_width, _height, _retina);
		getContext();
		addListeners();
		HydraEvents.createLocalEmitter(_this)
	}());

	function initCanvas() {
		_canvas = document.createElement("canvas");
		_this.div = _canvas;
		_this.object = $(_canvas)
	}

	function getContext() {
		var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
		for(var i = 0; i < names.length; i++) {
			try {
				_gl = _canvas.getContext(names[i], _options)
			} catch(e) {};
			if(_gl) break
		}
		for(i = 0; i < _this.children.length; i++) _this.children[i].gl(_gl, _this);
		if(_composer) _composer.gl(_gl, _this);
		_gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);
		_gl.enable(_gl.BLEND);
		_gl.disable(_gl.DEPTH_TEST);
		if(_this.fire && _this.context != _gl) _this.fire("context", {
			gl: _gl
		});
		_this.context = _gl;
		if(_extensions) {
			_extensions.forEach(function(ext) {
				_gl.getExtension(ext)
			})
		}
	}

	function resize(w, h, retina) {
		var ratio = retina && Device.system.retina ? 2 : 1;
		if(_this.div) {
			_this.div.width = w * ratio;
			_this.div.height = h * ratio
		}
		_this.width = w;
		_this.height = h;
		_this.scale = ratio;
		if(_this.object) _this.object.size(_this.width, _this.height, true);
		if(_gl) _gl.viewport(0, 0, w * ratio, h * ratio);
		if(_composer) _composer.resize(_this.width, _this.height)
	}

	function addListeners() {
		_canvas.addEventListener("webglcontextlost", contextLost);
		_canvas.addEventListener("webglcontextrestored", getContext)
	}

	function contextLost() {
		_gl = null
	}
	this.size = function(width, height, retina) {
		resize(width, height, retina);
		_this.fire("resize")
	};
	this.startRender = function() {
		Render.startRender(_this.render)
	};
	this.stopRender = function() {
		Render.stopRender(_this.render)
	};
	this.add = function(obj) {
		obj.gl(_gl, this);
		obj._parent = this;
		this.children.push(obj);
		obj._z = this.children.length
	};
	this.remove = function(obj) {
		var index = this.children.indexOf(obj);
		if(index > -1) {
			obj._parent = null;
			this.children.splice(index, 1)
		}
	};
	this.render = function(fbo) {
		if(!_gl) return;
		fbo = fbo && typeof fbo !== "number" ? fbo : null;
		if(fbo) fbo._startDraw(_gl, _this);
		_gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BIT);
		_this.renderChildren();
		if(fbo) fbo._endDraw()
	};
	this.renderChildren = function() {
		for(var i = 0; i < _this.children.length; i++) {
			var obj = _this.children[i];
			if(obj.render) obj.render()
		}
	};
	this.setClearColor = function(color, alpha) {
		_gl.clearColor(color.r, color.g, color.b, alpha)
	};
	this.enableExtension = function(ext) {
		if(!_extensions) _extensions = [];
		_extensions.push(ext);
		_gl.getExtension(ext)
	};
	this._draw = function(obj) {
		if(_gl.program != obj.shader.program) {
			_gl.program = obj.shader.program;
			_gl.useProgram(_gl.program)
		}
		if(obj.blending == GLObject.ADDITIVE_BLENDING) _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE);
		else if(obj.blending == GLObject.PREMULTIPLIED_BLENDING) _gl.blendFunc(_gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);
		else _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);
		_gl.uniform2f(_gl.getUniformLocation(_gl.program, "resolution"), _this.width, _this.height);
		obj.geometry.setupBuffers(_gl);
		obj.setupMatrices();
		obj.shader.update();
		obj.draw();
		var drawMode;
		switch(obj.getDrawMode()) {
			case "points":
				drawMode = _gl.POINTS;
				break;
			case "wireframe":
				drawMode = _gl.LINE_STRIP;
				break;
			default:
				drawMode = _gl.TRIANGLES;
				break
		}
		_gl.drawArrays(drawMode, 0, obj.geometry._vertexCount)
	};
	this.destroy = function() {
		if(!this._destroy) return;
		_this.object.remove();
		this.stopRender();
		return this._destroy()
	}
});
Class(function GLPlaneGeometry(_width, _height, _rows, _cols) {
	Inherit(this, GLGeometry);
	var _this = this;
	this.width = _width;
	this.height = _height;
	this.rows = _rows || 1;
	this.cols = _cols || 1;
	this.vertices = [];
	(function() {
		initVertices()
	}());

	function initVertices() {
		if(!_this.vertexAttribute) {
			_this.vertexAttribute = new GLAttribute("position", getTris(), 3);
			_this.uvAttribute = new GLAttribute("uv", getUV(), 2);
			_this.addBuffer(_this.vertexAttribute);
			_this.addBuffer(_this.uvAttribute)
		} else {
			_this.vertexAttribute.array = getTris();
			_this.uvAttribute.array = getUV();
			_this.vertexAttribute.needsUpdate = true;
			_this.uvAttribute.needsUpdate = true
		}
	}

	function findVertex(x, y) {
		for(var i = _this.vertices.length - 1; i > -1; i--) {
			var v = _this.vertices[i];
			if(v.x == x && v.y == y) return v
		}
		v = new Vector3(x, y, 0);
		v.updateX = [];
		v.updateY = [];
		v.updateZ = [];
		_this.vertices.push(v);
		return v
	}

	function getTris() {
		var w = _this.width;
		var h = _this.height;
		var xseg = _this.rows;
		var yseg = _this.cols;
		var x = 0;
		var y = 0;
		var xw = w / xseg;
		var yh = h / yseg;
		var tris = [];
		var total = xseg * yseg;
		var x1, y1, x2, y2, v;
		for(var i = 0; i < total; i++) {
			x1 = x;
			x2 = x + xw;
			y1 = y;
			y2 = y + yh;
			x1 = parseFloat(x1.toFixed(1));
			x2 = parseFloat(x2.toFixed(1));
			y1 = parseFloat(y1.toFixed(1));
			y2 = parseFloat(y2.toFixed(1));
			tris.push(x1);
			tris.push(y1);
			tris.push(0);
			v = findVertex(x1, y1);
			v.updateX.push(tris.length - 3);
			v.updateY.push(tris.length - 2);
			v.updateZ.push(tris.length - 1);
			tris.push(x2);
			tris.push(y1);
			tris.push(0);
			v = findVertex(x2, y1);
			v.updateX.push(tris.length - 3);
			v.updateY.push(tris.length - 2);
			v.updateZ.push(tris.length - 1);
			tris.push(x1);
			tris.push(y2);
			tris.push(0);
			v = findVertex(x1, y2);
			v.updateX.push(tris.length - 3);
			v.updateY.push(tris.length - 2);
			v.updateZ.push(tris.length - 1);
			tris.push(x1);
			tris.push(y2);
			tris.push(0);
			v = findVertex(x1, y2);
			v.updateX.push(tris.length - 3);
			v.updateY.push(tris.length - 2);
			v.updateZ.push(tris.length - 1);
			tris.push(x2);
			tris.push(y1);
			tris.push(0);
			v = findVertex(x2, y1);
			v.updateX.push(tris.length - 3);
			v.updateY.push(tris.length - 2);
			v.updateZ.push(tris.length - 1);
			tris.push(x2);
			tris.push(y2);
			tris.push(0);
			v = findVertex(x2, y2);
			v.updateX.push(tris.length - 3);
			v.updateY.push(tris.length - 2);
			v.updateZ.push(tris.length - 1);
			x += xw;
			if(x > w - 1) {
				x = 0;
				y += yh
			}
		}
		x = _this.width / 2 - w / 2;
		y = _this.height / 2 - h / 2;
		var count = 0;
		for(i = 0; i < tris.length; i++) {
			if(i % 3 == 0) continue;
			if(count % 2 == 0) {
				tris[i] += x
			} else {
				tris[i] += y
			}
			count++
		}
		_this._num = tris.length / 3;
		return new Float32Array(tris)
	}

	function getUV() {
		var w = _this.width;
		var h = _this.height;
		var xseg = _this.rows;
		var yseg = _this.cols;
		var x = 0;
		var y = 0;
		var xw = w / xseg;
		var yh = h / yseg;
		var tris = [];
		var total = xseg * yseg;
		var x1, y1, x2, y2, v;
		for(var i = 0; i < total; i++) {
			x1 = x;
			x2 = x + xw;
			y1 = y;
			y2 = y + yh;
			tris.push(x1);
			tris.push(y1);
			tris.push(x2);
			tris.push(y1);
			tris.push(x1);
			tris.push(y2);
			tris.push(x1);
			tris.push(y2);
			tris.push(x2);
			tris.push(y1);
			tris.push(x2);
			tris.push(y2);
			x += xw;
			if(x > w - 1) {
				x = 0;
				y += yh
			}
		}
		x = _this.width / 2 - w / 2;
		y = _this.height / 2 - h / 2;
		for(i = 0; i < tris.length; i++) {
			if(i % 2 == 0) {
				tris[i] /= w
			} else {
				tris[i] /= h
			}
		}
		return new Float32Array(tris)
	}
	this.updateVertices = function() {
		var array = _this.vertexAttribute.array;
		for(var i = _this.vertices.length - 1; i > -1; i--) {
			var v = _this.vertices[i];
			for(var x = v.updateX.length - 1; x > -1; x--) {
				array[v.updateX[x]] = v.x
			}
			for(var y = v.updateY.length - 1; y > -1; y--) {
				array[v.updateY[y]] = v.y
			}
			for(var z = v.updateZ.length - 1; z > -1; z--) {
				array[v.updateZ[z]] = v.z
			}
		}
		_this.vertexAttribute.needsUpdate = true
	};
	this.setOrigin = function(x, y) {
		var w = _this.width * x;
		var h = _this.height * y;
		for(var i = _this.vertices.length - 1; i > -1; i--) {
			var v = _this.vertices[i];
			v.copyFrom(v.origin);
			v.x -= w;
			v.y -= h
		}
		_this.updateVertices()
	};
	this.resize = function(width, height) {
		_width = _this.width = width;
		_height = _this.height = height;
		_this.vertices.length = [];
		initVertices()
	}
});
Class(function GLObject() {
	Inherit(this, Component);
	var _this = this;
	var _gl, _stage;
	this.children = [];
	this.position = new Vector3;
	this.rotation = new Vector3;
	this.scale = new Vector3(1, 1, 1);
	this.alpha = 1;
	this.globalAlpha = 1;
	this.matrix = new Matrix4;
	this.worldMatrix = new Matrix4;
	this.visible = true;
	this.useMatrix = true;

	function visible() {
		var parent = _this._parent;
		while(parent && !(parent instanceof GLStage)) {
			if(!parent.visible) return false;
			parent = parent._parent
		}
		return _this.visible
	}
	this.gl = this.init = function(gl, stage) {
		_this = this;
		_gl = gl;
		_stage = stage;
		for(var i = 0; i < this.children.length; i++) this.children[i].gl(_gl, stage)
	};
	this.updateMatrix = function(force) {
		if(!this.useMatrix && !force) return;
		var p = this.position;
		var r = this.rotation;
		var s = this.scale;
		this.matrix.setTRS(p.x, p.y, p.z, r.x, r.y, r.z, s.x, s.y, s.z);
		if(this._parent && this._parent.worldMatrix) {
			this._parent.worldMatrix.copyTo(this.worldMatrix);
			this.worldMatrix.multiply(this.matrix);
			this.globalAlpha = this._parent.globalAlpha * this.alpha
		} else {
			this.matrix.copyTo(this.worldMatrix);
			this.globalAlpha = this.alpha
		}
	};
	this.setupMatrices = function() {
		var transformMatrix = _gl.getUniformLocation(_gl.program, "transformMatrix");
		_gl.uniformMatrix4fv(transformMatrix, false, _this.worldMatrix.data);
		if(this.uniformMatrix) {
			for(var key in this.uniformMatrix) {
				var loc = _gl.getUniformLocation(_gl.program, key);
				_gl.uniformMatrix4fv(loc, false, this.uniformMatrix[key])
			}
		}
		var alpha = _gl.getUniformLocation(_gl.program, "alpha");
		_gl.uniform1f(alpha, false, _this.globalAlpha)
	};
	this.add = function(obj) {
		obj.gl(_gl, _stage);
		obj._parent = this;
		this.children.push(obj);
		obj._z = this.children.length
	};
	this.remove = function(obj) {
		var index = this.children.indexOf(obj);
		if(index > -1) {
			obj._parent = null;
			this.children.splice(index, 1)
		}
	};
	this.setZ = function(z) {
		if(!this._parent) return;
		this._z = z;
		this._parent.children.sort(function(a, b) {
			if(a._z == b._z) {
				if(a == this) return a;
				return b
			}
			return a._z - b._z
		})
	};
	this.render = function() {
		this.updateMatrix();
		if(this.shader && visible()) _stage._draw(this);
		for(var i = 0; i < this.children.length; i++) {
			var obj = this.children[i];
			obj.render()
		}
	}
}, function() {
	GLObject.ADDITIVE_BLENDING = 1;
	GLObject.PREMULTIPLIED_BLENDING = 2
});
Class(function GLMesh(_texture, _geometry, _shader) {
	Inherit(this, GLObject);
	var _this = this;
	var _gl, _stage;
	_shader = _shader || new GLShader;
	this.texture = _texture;
	this.geometry = _geometry;
	this.shader = _shader;
	(function() {
		if(!_geometry) throw "GLMesh requires geometry";
		_this.uniforms = _this.shader.uniforms
	}());
	this.gl = function(gl, stage) {
		_gl = gl;
		_stage = stage;
		_this.texture.gl(gl, stage);
		_this.shader.gl(gl, stage);
		_this.init(gl, stage)
	};
	this.draw = function() {
		if(_this.texture) _this.texture.drawTexture(_gl, "uTexture", 0)
	};
	this.getDrawMode = function() {
		if(this.wireframe) return "wireframe";
		return "triangle"
	}
});
Class(function GLParticles(_geometry, _shader) {
	Inherit(this, GLObject);
	var _this = this;
	var _gl, _stage;
	this.geometry = _geometry;
	this.shader = _shader || new GLShader;
	(function() {
		if(!_geometry) throw "GLMesh reqires geometry";
		_this.uniforms = _this.shader.uniforms;
		_shader.processShader = processShader
	}());

	function processShader(type, string) {
		if(type == "vertex") {
			string = string.replace("varying vec2 vUv;", "");
			string = string.replace("attribute vec2 uv;", "")
		} else {
			string = string.replace("varying vec2 vUv;", "")
		}
		return string
	}
	this.gl = function(gl, stage) {
		_gl = gl;
		_stage = stage;
		_shader.gl(gl, stage);
		_this.init(gl, stage)
	};
	this.draw = function() {};
	this.getDrawMode = function() {
		return "points"
	}
});
Class(function TweenManager() {
	Namespace(this);
	var _this = this;
	var _tweens = [];
	(function() {
		if(window.Hydra) Hydra.ready(initPools);
		if(window.Render) Render.startRender(updateTweens)
	}());

	function initPools() {
		_this._dynamicPool = new ObjectPool(DynamicObject, 100);
		_this._arrayPool = new ObjectPool(Array, 100);
		_this._dynamicPool.debug = true
	}

	function updateTweens(time) {
		for(var i = 0; i < _tweens.length; i++) {
			_tweens[i].update(time)
		}
	}

	function stringToValues(str) {
		var values = str.split("(")[1].slice(0, -1).split(",");
		for(var i = 0; i < values.length; i++) values[i] = parseFloat(values[i]);
		return values
	}

	function findEase(name) {
		var eases = _this.CSSEases;
		for(var i = eases.length - 1; i > -1; i--) {
			if(eases[i].name == name) {
				return eases[i]
			}
		}
		return false
	}
	this._addMathTween = function(tween) {
		_tweens.push(tween)
	};
	this._removeMathTween = function(tween) {
		_tweens.findAndRemove(tween)
	};
	this._detectTween = function(object, props, time, ease, delay, callback) {
		if(ease === "spring") {
			return new SpringTween(object, props, time, ease, delay, callback)
		}
		if(!_this.useCSSTrans(props, ease, object)) {
			return new FrameTween(object, props, time, ease, delay, callback)
		} else {
			if(Device.tween.webAnimation) {
				return new CSSWebAnimation(object, props, time, ease, delay, callback)
			} else {
				return new CSSTransition(object, props, time, ease, delay, callback)
			}
		}
	};
	this.tween = function(obj, props, time, ease, delay, complete, update, manual) {
		if(typeof delay !== "number") {
			update = complete;
			complete = delay;
			delay = 0
		}
		var tween;
		if(ease === "spring") {
			tween = new SpringTween(obj, props, time, ease, delay, update, complete)
		} else {
			tween = new MathTween(obj, props, time, ease, delay, update, complete, manual)
		}
		var usePromise = null;
		if(complete && complete instanceof Promise) {
			usePromise = complete;
			complete = complete.resolve
		}
		return usePromise || tween
	};
	this.iterate = function(array, props, time, ease, offset, delay, callback) {
		if(typeof delay !== "number") {
			callback = delay;
			delay = 0
		}
		props = new DynamicObject(props);
		if(!array.length) throw "TweenManager.iterate :: array is empty";
		var len = array.length;
		for(var i = 0; i < len; i++) {
			var obj = array[i];
			var complete = i == len - 1 ? callback : null;
			obj.tween(props.copy(), time, ease, delay + offset * i, complete)
		}
	};
	this.clearTween = function(obj) {
		if(obj._mathTween && obj._mathTween.stop) obj._mathTween.stop();
		if(obj._mathTweens) {
			var tweens = obj._mathTweens;
			for(var i = 0; i < tweens.length; i++) {
				var tw = tweens[i];
				if(tw && tw.stop) tw.stop()
			}
			obj._mathTweens = null
		}
	};
	this.clearCSSTween = function(obj) {
		if(obj && !obj._cssTween && obj.div._transition && !obj.persistTween) {
			obj.div.style[Device.styles.vendorTransition] = "";
			obj.div._transition = false;
			obj._cssTween = null
		}
	};
	this.checkTransform = function(key) {
		var index = _this.Transforms.indexOf(key);
		return index > -1
	};
	this.addCustomEase = function(ease) {
		var add = true;
		if(typeof ease !== "object" || !ease.name || !ease.curve) throw "TweenManager :: addCustomEase requires {name, curve}";
		for(var i = _this.CSSEases.length - 1; i > -1; i--) {
			if(ease.name == _this.CSSEases[i].name) {
				add = false
			}
		}
		if(add) {
			if(ease.curve.charAt(0).toLowerCase() == "m") ease.path = new EasingPath(ease.curve);
			else ease.values = stringToValues(ease.curve);
			_this.CSSEases.push(ease)
		}
		return ease
	};
	this.getEase = function(name, values) {
		if(Array.isArray(name)) {
			var c1 = findEase(name[0]);
			var c2 = findEase(name[1]);
			if(!c1 || !c2) throw "Multi-ease tween missing values " + JSON.stringify(name);
			if(!c1.values) c1.values = stringToValues(c1.curve);
			if(!c2.values) c2.values = stringToValues(c2.curve);
			if(values) return [c1.values[0], c1.values[1], c2.values[2], c2.values[3]];
			return "cubic-bezier(" + c1.values[0] + "," + c1.values[1] + "," + c2.values[2] + "," + c2.values[3] + ")"
		} else {
			var ease = findEase(name);
			if(!ease) return false;
			if(values) {
				return ease.path ? ease.path.solve : ease.values
			} else {
				return ease.curve
			}
		}
	};
	this.inspectEase = function(name) {
		return findEase(name)
	};
	this.getAllTransforms = function(object) {
		var obj = {};
		for(var i = _this.Transforms.length - 1; i > -1; i--) {
			var tf = _this.Transforms[i];
			var val = object[tf];
			if(val !== 0 && typeof val === "number") {
				obj[tf] = val
			}
		}
		return obj
	};
	this.parseTransform = function(props) {
		var transforms = "";
		var translate = "";
		if(props.perspective > 0) transforms += "perspective(" + props.perspective + "px)";
		if(typeof props.x !== "undefined" || typeof props.y !== "undefined" || typeof props.z !== "undefined") {
			var x = props.x || 0;
			var y = props.y || 0;
			var z = props.z || 0;
			translate += x + "px, ";
			translate += y + "px";
			if(Device.tween.css3d) {
				translate += ", " + z + "px";
				transforms += "translate3d(" + translate + ")"
			} else {
				transforms += "translate(" + translate + ")"
			}
		}
		if(typeof props.scale !== "undefined") {
			transforms += "scale(" + props.scale + ")"
		} else {
			if(typeof props.scaleX !== "undefined") transforms += "scaleX(" + props.scaleX + ")";
			if(typeof props.scaleY !== "undefined") transforms += "scaleY(" + props.scaleY + ")"
		}
		if(typeof props.rotation !== "undefined") transforms += "rotate(" + props.rotation + "deg)";
		if(typeof props.rotationX !== "undefined") transforms += "rotateX(" + props.rotationX + "deg)";
		if(typeof props.rotationY !== "undefined") transforms += "rotateY(" + props.rotationY + "deg)";
		if(typeof props.rotationZ !== "undefined") transforms += "rotateZ(" + props.rotationZ + "deg)";
		if(typeof props.skewX !== "undefined") transforms += "skewX(" + props.skewX + "deg)";
		if(typeof props.skewY !== "undefined") transforms += "skewY(" + props.skewY + "deg)";
		return transforms
	};
	this.interpolate = function(num, alpha, ease) {
		var fn = _this.Interpolation.convertEase(ease);
		return num * (typeof fn == "function" ? fn(alpha) : _this.Interpolation.solve(fn, alpha))
	};
	this.interpolateValues = function(start, end, alpha, ease) {
		var fn = _this.Interpolation.convertEase(ease);
		return start + (end - start) * (typeof fn == "function" ? fn(alpha) : _this.Interpolation.solve(fn, alpha))
	}
}, "Static");
(function() {
	TweenManager.Transforms = ["scale", "scaleX", "scaleY", "x", "y", "z", "rotation", "rotationX", "rotationY", "rotationZ", "skewX", "skewY", "perspective"];
	TweenManager.CSSEases = [{
		name: "easeOutCubic",
		curve: "cubic-bezier(0.215, 0.610, 0.355, 1.000)"
	}, {
		name: "easeOutQuad",
		curve: "cubic-bezier(0.250, 0.460, 0.450, 0.940)"
	}, {
		name: "easeOutQuart",
		curve: "cubic-bezier(0.165, 0.840, 0.440, 1.000)"
	}, {
		name: "easeOutQuint",
		curve: "cubic-bezier(0.230, 1.000, 0.320, 1.000)"
	}, {
		name: "easeOutSine",
		curve: "cubic-bezier(0.390, 0.575, 0.565, 1.000)"
	}, {
		name: "easeOutExpo",
		curve: "cubic-bezier(0.190, 1.000, 0.220, 1.000)"
	}, {
		name: "easeOutCirc",
		curve: "cubic-bezier(0.075, 0.820, 0.165, 1.000)"
	}, {
		name: "easeOutBack",
		curve: "cubic-bezier(0.175, 0.885, 0.320, 1.275)"
	}, {
		name: "easeInCubic",
		curve: "cubic-bezier(0.550, 0.055, 0.675, 0.190)"
	}, {
		name: "easeInQuad",
		curve: "cubic-bezier(0.550, 0.085, 0.680, 0.530)"
	}, {
		name: "easeInQuart",
		curve: "cubic-bezier(0.895, 0.030, 0.685, 0.220)"
	}, {
		name: "easeInQuint",
		curve: "cubic-bezier(0.755, 0.050, 0.855, 0.060)"
	}, {
		name: "easeInSine",
		curve: "cubic-bezier(0.470, 0.000, 0.745, 0.715)"
	}, {
		name: "easeInCirc",
		curve: "cubic-bezier(0.600, 0.040, 0.980, 0.335)"
	}, {
		name: "easeInBack",
		curve: "cubic-bezier(0.600, -0.280, 0.735, 0.045)"
	}, {
		name: "easeInOutCubic",
		curve: "cubic-bezier(0.645, 0.045, 0.355, 1.000)"
	}, {
		name: "easeInOutQuad",
		curve: "cubic-bezier(0.455, 0.030, 0.515, 0.955)"
	}, {
		name: "easeInOutQuart",
		curve: "cubic-bezier(0.770, 0.000, 0.175, 1.000)"
	}, {
		name: "easeInOutQuint",
		curve: "cubic-bezier(0.860, 0.000, 0.070, 1.000)"
	}, {
		name: "easeInOutSine",
		curve: "cubic-bezier(0.445, 0.050, 0.550, 0.950)"
	}, {
		name: "easeInOutExpo",
		curve: "cubic-bezier(1.000, 0.000, 0.000, 1.000)"
	}, {
		name: "easeInOutCirc",
		curve: "cubic-bezier(0.785, 0.135, 0.150, 0.860)"
	}, {
		name: "easeInOutBack",
		curve: "cubic-bezier(0.680, -0.550, 0.265, 1.550)"
	}, {
		name: "easeInOut",
		curve: "cubic-bezier(.42,0,.58,1)"
	}, {
		name: "linear",
		curve: "linear"
	}];
	TweenManager.useCSSTrans = function(props, ease, object) {
		if(props.math) return false;
		if(typeof ease === "string" && (ease.strpos("Elastic") || ease.strpos("Bounce"))) return false;
		if(object.multiTween || TweenManager.inspectEase(ease).path) return false;
		if(!Device.tween.transition) return false;
		return true
	}
}());
Class(function CSSTransition(_object, _props, _time, _ease, _delay, _callback) {
	var _this = this;
	var _transformProps, _transitionProps, _stack, _totalStacks;
	var _startTransform, _startProps;
	this.playing = true;
	(function() {
		if(typeof _time !== "number") throw "CSSTween Requires object, props, time, ease";
		initProperties();
		if(typeof _ease == "object" && !Array.isArray(_ease)) initStack();
		else initCSSTween()
	}());

	function killed() {
		return !_this || _this.kill || !_object || !_object.div
	}

	function initProperties() {
		var transform = TweenManager.getAllTransforms(_object);
		var properties = [];
		for(var key in _props) {
			if(TweenManager.checkTransform(key)) {
				transform.use = true;
				transform[key] = _props[key];
				delete _props[key]
			} else {
				if(typeof _props[key] === "number" || key.strpos("-")) properties.push(key)
			}
		}
		if(transform.use) properties.push(Device.transformProperty);
		delete transform.use;
		_transformProps = transform;
		_transitionProps = properties
	}

	function initStack() {
		initStart();
		var prevTime = 0;
		var interpolate = function(start, end, alpha, ease, prev, ke) {
			var last = prev[key];
			if(last) start += last;
			return TweenManager.interpolateValues(start, end, alpha, ease)
		};
		_stack = [];
		_totalStacks = 0;
		for(var p in _ease) {
			var perc = p.strpos("%") ? Number(p.replace("%", "")) / 100 : (Number(p) + 1) / _ease.length;
			if(isNaN(perc)) continue;
			var ease = _ease[p];
			_totalStacks++;
			var transform = {};
			var props = {};
			var last = _stack[_stack.length - 1];
			var pr = last ? last.props : {};
			var zeroOut = !last;
			for(var key in _transformProps) {
				if(!_startTransform[key]) _startTransform[key] = key.strpos("scale") ? 1 : 0;
				transform[key] = interpolate(_startTransform[key], _transformProps[key], perc, ease, pr, key);
				if(zeroOut) pr[key] = _startTransform[key]
			}
			for(key in _props) {
				props[key] = interpolate(_startProps[key], _props[key], perc, ease, pr, key);
				if(zeroOut) pr[key] = _startProps[key]
			}
			var time = perc * _time - prevTime;
			prevTime += time;
			_stack.push({
				percent: perc,
				ease: ease,
				transform: transform,
				props: props,
				delay: _totalStacks == 1 ? _delay : 0,
				time: time
			})
		}
		initCSSTween(_stack.shift())
	}

	function initStart() {
		_startTransform = TweenManager.getAllTransforms(_object);
		var transform = TweenManager.parseTransform(_startTransform);
		if(!transform.length) {
			for(var i = TweenManager.Transforms.length - 1; i > -1; i--) {
				var key = TweenManager.Transforms[i];
				_startTransform[key] = key == "scale" ? 1 : 0
			}
		}
		_startProps = {};
		for(key in _props) {
			_startProps[key] = _object.css(key)
		}
	}

	function initCSSTween(values) {
		if(killed()) return;
		if(_object._cssTween) _object._cssTween.kill = true;
		_object._cssTween = _this;
		_object.div._transition = true;
		var strings = function() {
			if(!values) {
				return buildStrings(_time, _ease, _delay)
			} else {
				return buildStrings(values.time, values.ease, values.delay)
			}
		}();
		_object.willChange(strings.props);
		var time = values ? values.time : _time;
		var delay = values ? values.delay : _delay;
		var props = values ? values.props : _props;
		var transformProps = values ? values.transform : _transformProps;
		Timer.create(function() {
			if(killed()) return;
			_object.div.style[Device.styles.vendorTransition] = strings.transition;
			_this.playing = true;
			if(Device.browser.safari) {
				Timer.create(function() {
					if(killed()) return;
					_object.css(props);
					_object.transform(transformProps)
				}, 16)
			} else {
				_object.css(props);
				_object.transform(transformProps)
			}
			Timer.create(function() {
				if(killed()) return;
				if(!_stack) {
					clearCSSTween();
					if(_callback) _callback()
				} else {
					executeNextInStack()
				}
			}, time + delay)
		}, 50)
	}

	function executeNextInStack() {
		if(killed()) return;
		var values = _stack.shift();
		if(!values) {
			clearCSSTween();
			if(_callback) _callback
		} else {
			var strings = buildStrings(values.time, values.ease, values.delay);
			_object.div.style[Device.styles.vendorTransition] = strings.transition;
			_object.css(values.props);
			_object.transform(values.transform);
			Timer.create(executeNextInStack, values.time)
		}
	}

	function buildStrings(time, ease, delay) {
		var props = "";
		var str = "";
		var len = _transitionProps.length;
		for(var i = 0; i < len; i++) {
			var transitionProp = _transitionProps[i];
			props += (props.length ? ", " : "") + transitionProp;
			str += (str.length ? ", " : "") + transitionProp + " " + time + "ms " + TweenManager.getEase(ease) + " " + delay + "ms"
		}
		return {
			props: props,
			transition: str
		}
	}

	function clearCSSTween() {
		if(killed()) return;
		_this.playing = false;
		_object._cssTween = null;
		_object.willChange(null);
		_object = _props = null;
		_this = null;
		Utils.nullObject(this)
	}

	function tweenComplete() {
		if(!_callback && _this.playing) clearCSSTween()
	}
	this.stop = function() {
		if(!this.playing) return;
		this.kill = true;
		this.playing = false;
		_object.div.style[Device.styles.vendorTransition] = "";
		_object.div._transition = false;
		_object.willChange(null);
		_object._cssTween = null;
		_this = null;
		Utils.nullObject(this)
	}
});
Class(function FrameTween(_object, _props, _time, _ease, _delay, _callback, _manual) {
	var _this = this;
	var _endValues, _transformEnd, _transformStart, _startValues;
	var _isTransform, _isCSS, _transformProps;
	var _cssTween, _transformTween;
	this.playing = true;
	(function() {
		if(typeof _ease === "object") _ease = "easeOutCubic";
		if(_object && _props) {
			if(typeof _time !== "number") throw "FrameTween Requires object, props, time, ease";
			initValues();
			startTween()
		}
	}());

	function killed() {
		return _this.kill || !_object || !_object.div
	}

	function initValues() {
		if(_props.math) delete _props.math;
		if(Device.tween.transition && _object.div._transition) {
			_object.div.style[Device.styles.vendorTransition] = "";
			_object.div._transition = false
		}
		_endValues = new DynamicObject;
		_transformEnd = new DynamicObject;
		_transformStart = new DynamicObject;
		_startValues = new DynamicObject;
		if(!_object.multiTween) {
			if(typeof _props.x === "undefined") _props.x = _object.x;
			if(typeof _props.y === "undefined") _props.y = _object.y;
			if(typeof _props.z === "undefined") _props.z = _object.z
		}
		for(var key in _props) {
			if(TweenManager.checkTransform(key)) {
				_isTransform = true;
				_transformStart[key] = _object[key] || (key == "scale" ? 1 : 0);
				_transformEnd[key] = _props[key]
			} else {
				_isCSS = true;
				var v = _props[key];
				if(typeof v === "string") {
					_object.div.style[key] = v
				} else if(typeof v === "number") {
					_startValues[key] = Number(_object.css(key));
					_endValues[key] = v
				}
			}
		}
	}

	function startTween() {
		if(_object._cssTween && !_manual && !_object.multiTween) _object._cssTween.kill = true;
		if(_object.multiTween) {
			if(!_object._cssTweens) _object._cssTweens = [];
			_object._cssTweens.push(_this)
		}
		_object._cssTween = _this;
		_this.playing = true;
		_props = _startValues.copy();
		_transformProps = _transformStart.copy();
		if(_isCSS) _cssTween = TweenManager.tween(_props, _endValues, _time, _ease, _delay, tweenComplete, update, _manual);
		if(_isTransform) _transformTween = TweenManager.tween(_transformProps, _transformEnd, _time, _ease, _delay, !_isCSS ? tweenComplete : null, !_isCSS ? update : null, _manual)
	}

	function clear() {
		if(_object._cssTweens) {
			_object._cssTweens.findAndRemove(_this)
		}
		_this.playing = false;
		_object._cssTween = null;
		_object = _props = null
	}

	function update() {
		if(killed()) return;
		if(_isCSS) _object.css(_props);
		if(_isTransform) {
			if(_object.multiTween) {
				for(var key in _transformProps) {
					if(typeof _transformProps[key] === "number") _object[key] = _transformProps[key]
				}
				_object.transform()
			} else {
				_object.transform(_transformProps)
			}
		}
	}

	function tweenComplete() {
		if(_this.playing) {
			clear();
			if(_callback) _callback()
		}
	}
	this.stop = function() {
		if(!this.playing) return;
		if(_cssTween && _cssTween.stop) _cssTween.stop();
		if(_transformTween && _transformTween.stop) _transformTween.stop();
		clear()
	};
	this.interpolate = function(elapsed) {
		if(_cssTween) _cssTween.interpolate(elapsed);
		if(_transformTween) _transformTween.interpolate(elapsed);
		update()
	};
	this.getValues = function() {
		return {
			start: _startValues,
			transformStart: _transformStart,
			end: _endValues,
			transformEnd: _transformEnd
		}
	};
	this.setEase = function(ease) {
		if(_cssTween) _cssTween.setEase(ease);
		if(_transformTween) _transformTween.setEase(ease)
	}
});
TweenManager.Class(function Interpolation() {
	function calculateBezier(aT, aA1, aA2) {
		return((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT
	}

	function getTForX(aX, mX1, mX2) {
		var aGuessT = aX;
		for(var i = 0; i < 4; i++) {
			var currentSlope = getSlope(aGuessT, mX1, mX2);
			if(currentSlope == 0) return aGuessT;
			var currentX = calculateBezier(aGuessT, mX1, mX2) - aX;
			aGuessT -= currentX / currentSlope
		}
		return aGuessT
	}

	function getSlope(aT, aA1, aA2) {
		return 3 * A(aA1, aA2) * aT * aT + 2 * B(aA1, aA2) * aT + C(aA1)
	}

	function A(aA1, aA2) {
		return 1 - 3 * aA2 + 3 * aA1
	}

	function B(aA1, aA2) {
		return 3 * aA2 - 6 * aA1
	}

	function C(aA1) {
		return 3 * aA1
	}
	this.convertEase = function(ease) {
		var fn = function() {
			switch(ease) {
				case "easeInQuad":
					return TweenManager.Interpolation.Quad.In;
					break;
				case "easeInCubic":
					return TweenManager.Interpolation.Cubic.In;
					break;
				case "easeInQuart":
					return TweenManager.Interpolation.Quart.In;
					break;
				case "easeInQuint":
					return TweenManager.Interpolation.Quint.In;
					break;
				case "easeInSine":
					return TweenManager.Interpolation.Sine.In;
					break;
				case "easeInExpo":
					return TweenManager.Interpolation.Expo.In;
					break;
				case "easeInCirc":
					return TweenManager.Interpolation.Circ.In;
					break;
				case "easeInElastic":
					return TweenManager.Interpolation.Elastic.In;
					break;
				case "easeInBack":
					return TweenManager.Interpolation.Back.In;
					break;
				case "easeInBounce":
					return TweenManager.Interpolation.Bounce.In;
					break;
				case "easeOutQuad":
					return TweenManager.Interpolation.Quad.Out;
					break;
				case "easeOutCubic":
					return TweenManager.Interpolation.Cubic.Out;
					break;
				case "easeOutQuart":
					return TweenManager.Interpolation.Quart.Out;
					break;
				case "easeOutQuint":
					return TweenManager.Interpolation.Quint.Out;
					break;
				case "easeOutSine":
					return TweenManager.Interpolation.Sine.Out;
					break;
				case "easeOutExpo":
					return TweenManager.Interpolation.Expo.Out;
					break;
				case "easeOutCirc":
					return TweenManager.Interpolation.Circ.Out;
					break;
				case "easeOutElastic":
					return TweenManager.Interpolation.Elastic.Out;
					break;
				case "easeOutBack":
					return TweenManager.Interpolation.Back.Out;
					break;
				case "easeOutBounce":
					return TweenManager.Interpolation.Bounce.Out;
					break;
				case "easeInOutQuad":
					return TweenManager.Interpolation.Quad.InOut;
					break;
				case "easeInOutCubic":
					return TweenManager.Interpolation.Cubic.InOut;
					break;
				case "easeInOutQuart":
					return TweenManager.Interpolation.Quart.InOut;
					break;
				case "easeInOutQuint":
					return TweenManager.Interpolation.Quint.InOut;
					break;
				case "easeInOutSine":
					return TweenManager.Interpolation.Sine.InOut;
					break;
				case "easeInOutExpo":
					return TweenManager.Interpolation.Expo.InOut;
					break;
				case "easeInOutCirc":
					return TweenManager.Interpolation.Circ.InOut;
					break;
				case "easeInOutElastic":
					return TweenManager.Interpolation.Elastic.InOut;
					break;
				case "easeInOutBack":
					return TweenManager.Interpolation.Back.InOut;
					break;
				case "easeInOutBounce":
					return TweenManager.Interpolation.Bounce.InOut;
					break;
				case "linear":
					return TweenManager.Interpolation.Linear.None;
					break
			}
		}();
		if(!fn) {
			var curve = TweenManager.getEase(ease, true);
			if(curve) fn = curve;
			else fn = TweenManager.Interpolation.Cubic.Out
		}
		return fn
	};
	this.solve = function(values, elapsed) {
		if(values[0] == values[1] && values[2] == values[3]) return elapsed;
		return calculateBezier(getTForX(elapsed, values[0], values[2]), values[1], values[3])
	};
	this.Linear = {
		None: function(k) {
			return k
		}
	};
	this.Quad = {
		In: function(k) {
			return k * k
		},
		Out: function(k) {
			return k * (2 - k)
		},
		InOut: function(k) {
			if((k *= 2) < 1) return .5 * k * k;
			return -.5 * (--k * (k - 2) - 1)
		}
	};
	this.Cubic = {
		In: function(k) {
			return k * k * k
		},
		Out: function(k) {
			return --k * k * k + 1
		},
		InOut: function(k) {
			if((k *= 2) < 1) return .5 * k * k * k;
			return .5 * ((k -= 2) * k * k + 2)
		}
	};
	this.Quart = {
		In: function(k) {
			return k * k * k * k
		},
		Out: function(k) {
			return 1 - --k * k * k * k
		},
		InOut: function(k) {
			if((k *= 2) < 1) return .5 * k * k * k * k;
			return -.5 * ((k -= 2) * k * k * k - 2)
		}
	};
	this.Quint = {
		In: function(k) {
			return k * k * k * k * k
		},
		Out: function(k) {
			return --k * k * k * k * k + 1
		},
		InOut: function(k) {
			if((k *= 2) < 1) return .5 * k * k * k * k * k;
			return .5 * ((k -= 2) * k * k * k * k + 2)
		}
	};
	this.Sine = {
		In: function(k) {
			return 1 - Math.cos(k * Math.PI / 2)
		},
		Out: function(k) {
			return Math.sin(k * Math.PI / 2)
		},
		InOut: function(k) {
			return .5 * (1 - Math.cos(Math.PI * k))
		}
	};
	this.Expo = {
		In: function(k) {
			return k === 0 ? 0 : Math.pow(1024, k - 1)
		},
		Out: function(k) {
			return k === 1 ? 1 : 1 - Math.pow(2, -10 * k)
		},
		InOut: function(k) {
			if(k === 0) return 0;
			if(k === 1) return 1;
			if((k *= 2) < 1) return .5 * Math.pow(1024, k - 1);
			return .5 * (-Math.pow(2, -10 * (k - 1)) + 2)
		}
	};
	this.Circ = {
		In: function(k) {
			return 1 - Math.sqrt(1 - k * k)
		},
		Out: function(k) {
			return Math.sqrt(1 - --k * k)
		},
		InOut: function(k) {
			if((k *= 2) < 1) return -.5 * (Math.sqrt(1 - k * k) - 1);
			return .5 * (Math.sqrt(1 - (k -= 2) * k) + 1)
		}
	};
	this.Elastic = {
		In: function(k) {
			var s, a = .1,
				p = .4;
			if(k === 0) return 0;
			if(k === 1) return 1;
			if(!a || a < 1) {
				a = 1;
				s = p / 4
			} else s = p * Math.asin(1 / a) / (2 * Math.PI);
			return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p))
		},
		Out: function(k) {
			var s, a = .1,
				p = .4;
			if(k === 0) return 0;
			if(k === 1) return 1;
			if(!a || a < 1) {
				a = 1;
				s = p / 4
			} else s = p * Math.asin(1 / a) / (2 * Math.PI);
			return a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1
		},
		InOut: function(k) {
			var s, a = .1,
				p = .4;
			if(k === 0) return 0;
			if(k === 1) return 1;
			if(!a || a < 1) {
				a = 1;
				s = p / 4
			} else s = p * Math.asin(1 / a) / (2 * Math.PI);
			if((k *= 2) < 1) return -.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
			return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * .5 + 1
		}
	};
	this.Back = {
		In: function(k) {
			var s = 1.70158;
			return k * k * ((s + 1) * k - s)
		},
		Out: function(k) {
			var s = 1.70158;
			return --k * k * ((s + 1) * k + s) + 1
		},
		InOut: function(k) {
			var s = 1.70158 * 1.525;
			if((k *= 2) < 1) return .5 * (k * k * ((s + 1) * k - s));
			return .5 * ((k -= 2) * k * ((s + 1) * k + s) + 2)
		}
	};
	this.Bounce = {
		In: function(k) {
			return 1 - this.Bounce.Out(1 - k)
		},
		Out: function(k) {
			if(k < 1 / 2.75) {
				return 7.5625 * k * k
			} else if(k < 2 / 2.75) {
				return 7.5625 * (k -= 1.5 / 2.75) * k + .75
			} else if(k < 2.5 / 2.75) {
				return 7.5625 * (k -= 2.25 / 2.75) * k + .9375
			} else {
				return 7.5625 * (k -= 2.625 / 2.75) * k + .984375
			}
		},
		InOut: function(k) {
			if(k < .5) return this.Bounce.In(k * 2) * .5;
			return this.Bounce.Out(k * 2 - 1) * .5 + .5
		}
	}
}, "Static");
Class(function EasingPath(_curve) {
	Inherit(this, Component);
	var _this = this;
	var _path, _boundsStartIndex, _pathLength, _pool;
	var _precompute = 145e1;
	var _step = 1 / _precompute;
	var _rect = 100;
	var _approximateMax = 5;
	var _eps = .001;
	var _boundsPrevProgress = -1;
	var _prevBounds = {};
	var _newPoint = {};
	var _samples = [];
	var _using = [];
	(function() {
		initPool();
		initPath();
		preSample()
	}());

	function initPool() {
		_pool = _this.initClass(ObjectPool, Object, 100)
	}

	function initPath() {
		_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		_path.setAttributeNS(null, "d", normalizePath(_curve));
		_pathLength = _path.getTotalLength()
	}

	function preSample() {
		var i, j, length, point, progress, ref;
		for(i = j = 0, ref = _precompute; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
			progress = i * _step;
			length = _pathLength * progress;
			point = _path.getPointAtLength(length);
			_samples.push({
				point: point,
				length: length,
				progress: progress
			})
		}
	}

	function normalizePath(path) {
		var svgRegex = /[M|L|H|V|C|S|Q|T|A]/gim;
		var points = path.split(svgRegex);
		points.shift();
		var commands = path.match(svgRegex);
		var startIndex = 0;
		points[startIndex] = normalizeSegment(points[startIndex], 0);
		var endIndex = points.length - 1;
		points[endIndex] = normalizeSegment(points[endIndex], _rect);
		return joinNormalizedPath(commands, points)
	}

	function normalizeSegment(segment, value) {
		value = value || 0;
		segment = segment.trim();
		var nRgx = /(-|\+)?((\d+(\.(\d|\e(-|\+)?)+)?)|(\.?(\d|\e|(\-|\+))+))/gim;
		var pairs = getSegmentPairs(segment.match(nRgx));
		var lastPoint = pairs[pairs.length - 1];
		var x = lastPoint[0];
		var parsedX = Number(x);
		if(parsedX !== value) {
			segment = "";
			lastPoint[0] = value;
			for(var i = 0; i < pairs.length; i++) {
				var point = pairs[i];
				var space = i === 0 ? "" : " ";
				segment += "" + space + point[0] + "," + point[1]
			}
		}
		return segment
	}

	function joinNormalizedPath(commands, points) {
		var normalizedPath = "";
		for(var i = 0; i < commands.length; i++) {
			var command = commands[i];
			var space = i === 0 ? "" : " ";
			normalizedPath += "" + space + command + points[i].trim()
		}
		return normalizedPath
	}

	function getSegmentPairs(array) {
		if(array.length % 2 !== 0) throw "EasingPath :: Failed to parse path -- segment pairs are not even.";
		var newArray = [];
		for(var i = 0; i < array.length; i += 2) {
			var value = array[i];
			var pair = [array[i], array[i + 1]];
			newArray.push(pair)
		}
		return newArray
	}

	function findBounds(array, p) {
		if(p == _boundsPrevProgress) return _prevBounds;
		if(!_boundsStartIndex) _boundsStartIndex = 0;
		var len = array.length;
		var loopEnd, direction, start;
		if(_boundsPrevProgress > p) {
			loopEnd = 0;
			direction = "reverse"
		} else {
			loopEnd = len;
			direction = "forward"
		}
		if(direction == "forward") {
			start = array[0];
			end = array[array.length - 1]
		} else {
			start = array[array.length - 1];
			end = array[0]
		}
		var i, j, ref, ref1, buffer;
		for(i = j = ref = _boundsStartIndex, ref1 = loopEnd; ref <= ref1 ? j < ref1 : j > ref1; i = ref <= ref1 ? ++j : --j) {
			var value = array[i];
			var pointX = value.point.x / _rect;
			var pointP = p;
			if(direction == "reverse") {
				buffer = pointX;
				pointX = pointP;
				pointP = buffer
			}
			if(pointX < pointP) {
				start = value;
				_boundsStartIndex = i
			} else {
				end = value;
				break
			}
		}
		_boundsPrevProgress = p;
		_prevBounds.start = start;
		_prevBounds.end = end;
		return _prevBounds
	}

	function checkIfBoundsCloseEnough(p, bounds) {
		var point;
		var y = checkIfPointCloseEnough(p, bounds.start.point);
		if(y) return y;
		return checkIfPointCloseEnough(p, bounds.end.point)
	}

	function findApproximate(p, start, end, approximateMax) {
		approximateMax = approximateMax || _approximateMax;
		var approximation = approximate(start, end, p);
		var point = _path.getPointAtLength(approximation);
		var x = point.x / _rect;
		if(closeEnough(p, x)) {
			return resolveY(point)
		} else {
			if(approximateMax-- < 1) {
				return resolveY(point)
			}
			var newPoint = _pool.get();
			newPoint.point = point;
			newPoint.length = approximation;
			_using.push(newPoint);
			if(p < x) return findApproximate(p, start, newPoint, approximateMax);
			else return findApproximate(p, newPoint, end, approximateMax)
		}
	}

	function approximate(start, end, p) {
		var deltaP = end.point.x - start.point.x;
		var percentP = (p - start.point.x / _rect) / (deltaP / _rect);
		return start.length + percentP * (end.length - start.length)
	}

	function checkIfPointCloseEnough(p, point) {
		if(closeEnough(p, point.x / _rect)) return resolveY(point)
	}

	function closeEnough(n1, n2) {
		return Math.abs(n1 - n2) < _eps
	}

	function resolveY(point) {
		return 1 - point.y / _rect
	}

	function cleanUpObjects() {
		for(var i = _using.length - 1; i > -1; i--) {
			_pool.put(_using[i])
		}
		_using.length = 0
	}
	this.solve = function(p) {
		p = Utils.clamp(p, 0, 1);
		var bounds = findBounds(_samples, p);
		var res = checkIfBoundsCloseEnough(p, bounds);
		var output = res;
		if(!output) output = findApproximate(p, bounds.start, bounds.end);
		cleanUpObjects();
		return output
	}
});
Class(function MathTween(_object, _props, _time, _ease, _delay, _update, _callback, _manual) {
	var _this = this;
	var _startTime, _startValues, _endValues, _currentValues;
	var _easeFunction, _paused, _newEase, _stack, _current;
	var _elapsed = 0;
	(function() {
		if(_object && _props) {
			if(typeof _time !== "number") throw "MathTween Requires object, props, time, ease";
			start();
			if(typeof _ease == "object" && !Array.isArray(_ease)) initStack()
		}
	}());

	function start() {
		if(!_object.multiTween && _object._mathTween && !_manual) TweenManager.clearTween(_object);
		if(!_manual) TweenManager._addMathTween(_this);
		_object._mathTween = _this;
		if(_object.multiTween) {
			if(!_object._mathTweens) _object._mathTweens = [];
			_object._mathTweens.push(_this)
		}
		if(typeof _ease == "string") {
			_ease = TweenManager.Interpolation.convertEase(_ease);
			_easeFunction = typeof _ease === "function"
		} else if(Array.isArray(_ease)) {
			_easeFunction = false;
			_ease = TweenManager.getEase(_ease, true)
		}
		_startTime = Date.now();
		_startTime += _delay;
		_endValues = _props;
		_startValues = {};
		_this.startValues = _startValues;
		for(var prop in _endValues) {
			if(typeof _object[prop] === "number") _startValues[prop] = _object[prop]
		}
	}

	function initStack() {
		var prevTime = 0;
		var interpolate = function(start, end, alpha, ease, prev, key) {
			var last = prev[key];
			if(last) start += last;
			return TweenManager.interpolateValues(start, end, alpha, ease)
		};
		_stack = [];
		for(var p in _ease) {
			var perc = p.strpos("%") ? Number(p.replace("%", "")) / 100 : (Number(p) + 1) / _ease.length;
			if(isNaN(perc)) continue;
			var ease = _ease[p];
			var last = _stack[_stack.length - 1];
			var props = {};
			var pr = last ? last.end : {};
			var zeroOut = !last;
			for(var key in _startValues) {
				props[key] = interpolate(_startValues[key], _endValues[key], perc, ease, pr, key);
				if(zeroOut) pr[key] = _startValues[key]
			}
			var time = perc * _time - prevTime;
			prevTime += time;
			_stack.push({
				percent: perc,
				ease: ease,
				start: pr,
				end: props,
				time: time
			})
		}
		_currentValues = _stack.shift()
	}

	function clear() {
		if(!_object && !_props) return false;
		_object._mathTween = null;
		TweenManager._removeMathTween(_this);
		Utils.nullObject(_this);
		if(_object._mathTweens) {
			_object._mathTweens.findAndRemove(_this)
		}
	}

	function updateSingle(time) {
		_elapsed = (time - _startTime) / _time;
		_elapsed = _elapsed > 1 ? 1 : _elapsed;
		var delta = _easeFunction ? _ease(_elapsed) : TweenManager.Interpolation.solve(_ease, _elapsed);
		for(var prop in _startValues) {
			if(typeof _startValues[prop] === "number") {
				var start = _startValues[prop];
				var end = _endValues[prop];
				_object[prop] = start + (end - start) * delta
			}
		}
		if(_update) _update(delta);
		if(_elapsed == 1) {
			if(_callback) _callback();
			clear()
		}
	}

	function updateStack(time) {
		var v = _currentValues;
		if(!v.elapsed) {
			v.elapsed = 0;
			v.timer = 0
		}
		v.timer += Render.DELTA;
		v.elapsed = v.timer / v.time;
		if(v.elapsed < 1) {
			for(var prop in v.start) {
				_object[prop] = TweenManager.interpolateValues(v.start[prop], v.end[prop], v.elapsed, v.ease)
			}
			if(_update) _update(v.elapsed)
		} else {
			_currentValues = _stack.shift();
			if(!_currentValues) {
				if(_callback) _callback();
				clear()
			}
		}
	}
	this.update = function(time) {
		if(_paused || time < _startTime) return;
		if(_stack) updateStack(time);
		else updateSingle(time)
	};
	this.pause = function() {
		_paused = true
	};
	this.resume = function() {
		_paused = false;
		_startTime = Date.now() - _elapsed * _time
	};
	this.stop = function() {
		_this.stopped = true;
		clear();
		return null
	};
	this.setEase = function(ease) {
		if(_newEase != ease) {
			_newEase = ease;
			_ease = TweenManager.Interpolation.convertEase(ease);
			_easeFunction = typeof _ease === "function"
		}
	};
	this.getValues = function() {
		return {
			start: _startValues,
			end: _endValues
		}
	};
	this.interpolate = function(elapsed) {
		var delta = _easeFunction ? _ease(elapsed) : TweenManager.Interpolation.solve(_ease, elapsed);
		for(var prop in _startValues) {
			if(typeof _startValues[prop] === "number" && typeof _endValues[prop] === "number") {
				var start = _startValues[prop];
				var end = _endValues[prop];
				_object[prop] = start + (end - start) * delta
			}
		}
	}
});
Class(function SpringTween(_object, _props, _friction, _ease, _delay, _update, _callback) {
	var _this = this;
	var _startTime, _velocityValues, _endValues, _startValues;
	var _damping, _friction, _count, _paused;
	(function() {
		if(_object && _props) {
			if(typeof _friction !== "number") throw "SpringTween Requires object, props, time, ease";
			start()
		}
	}());

	function start() {
		TweenManager.clearTween(_object);
		_object._mathTween = _this;
		TweenManager._addMathTween(_this);
		_startTime = Date.now();
		_startTime += _delay;
		_endValues = {};
		_startValues = {};
		_velocityValues = {};
		if(_props.x || _props.y || _props.z) {
			if(typeof _props.x === "undefined") _props.x = _object.x;
			if(typeof _props.y === "undefined") _props.y = _object.y;
			if(typeof _props.z === "undefined") _props.z = _object.z
		}
		_count = 0;
		_damping = _props.damping || .5;
		delete _props.damping;
		for(var prop in _props) {
			if(typeof _props[prop] === "number") {
				_velocityValues[prop] = 0;
				_endValues[prop] = _props[prop]
			}
		}
		for(prop in _props) {
			if(typeof _object[prop] === "number") {
				_startValues[prop] = _object[prop] || 0;
				_props[prop] = _startValues[prop]
			}
		}
	}

	function clear(stop) {
		if(_object) {
			_object._mathTween = null;
			if(!stop) {
				for(var prop in _endValues) {
					if(typeof _endValues[prop] === "number") _object[prop] = _endValues[prop]
				}
				if(_object.transform) _object.transform()
			}
		}
		TweenManager._removeMathTween(_this)
	}
	this.update = function(time) {
		if(time < _startTime || _paused) return;
		var vel;
		for(var prop in _startValues) {
			if(typeof _startValues[prop] === "number") {
				var start = _startValues[prop];
				var end = _endValues[prop];
				var val = _props[prop];
				var d = end - val;
				var a = d * _damping;
				_velocityValues[prop] += a;
				_velocityValues[prop] *= _friction;
				_props[prop] += _velocityValues[prop];
				_object[prop] = _props[prop];
				vel = _velocityValues[prop]
			}
		}
		if(Math.abs(vel) < .001) {
			_count++;
			if(_count > 30) {
				if(_callback) _callback.apply(_object);
				clear()
			}
		}
		if(_update) _update(time);
		if(_object.transform) _object.transform()
	};
	this.pause = function() {
		_paused = true
	};
	this.stop = function() {
		clear(true);
		return null
	}
});
Class(function TweenTimeline() {
	Inherit(this, Component);
	var _this = this;
	var _tween;
	var _total = 0;
	var _tweens = [];
	var _fallbacks = [];
	this.elapsed = 0;
	(function() {}());

	function calculate() {
		_tweens.sort(function(a, b) {
			var ta = a.time + a.delay;
			var tb = b.time + b.delay;
			return tb - ta
		});
		var first = _tweens[0];
		_total = first.time + first.delay
	}

	function loop() {
		var time = _this.elapsed * _total;
		for(var i = _tweens.length - 1; i > -1; i--) {
			var t = _tweens[i];
			var relativeTime = time - t.delay;
			var elapsed = Utils.clamp(relativeTime / t.time, 0, 1);
			t.interpolate(elapsed)
		}
		_this.events.fire(TweenTimeline.UPDATE, _this, true)
	}
	this.add = function(object, props, time, ease, delay) {
		var tween;
		if(object instanceof HydraObject) tween = new FrameTween(object, props, time, ease, delay, null, true);
		else tween = new MathTween(object, props, time, ease, delay, null, null, true);
		_tweens.push(tween);
		_fallbacks.push({
			object: object,
			props: props,
			time: time,
			ease: ease,
			delay: delay
		});
		tween.time = time;
		tween.delay = delay || 0;
		calculate();
		return tween
	};
	this.tween = function(to, time, ease, delay, callback) {
		this.stopTween();
		_tween = TweenManager.tween(_this, {
			elapsed: to
		}, time, ease, delay, callback, loop)
	};
	this.stopTween = function() {
		if(_tween && _tween.stop) _tween.stop()
	};
	this.startRender = function() {
		Render.startRender(loop)
	};
	this.stopRender = function() {
		Render.stopRender(loop)
	};
	this.update = function() {
		loop()
	};
	this.calculateRemainingTime = function() {
		return _total - _this.elapsed * _total
	};
	this.fallback = function(dir) {
		_fallbacks.forEach(function(config, index) {
			var fTween = _tweens[index].getValues();
			var props = null;
			if(config.object instanceof HydraObject) {
				if(dir == 1) props = Utils.mergeObject(fTween.end, fTween.transformEnd);
				else props = Utils.mergeObject(fTween.start, fTween.transformStart);
				for(var key in props) {
					if(typeof props[key] != "number") delete props[key]
				}
				config.object.tween(props, config.time, config.ease, config.delay)
			} else {
				if(dir == 1) props = Utils.mergeObject(fTween.end);
				else props = Utils.mergeObject(fTween.start);
				for(var key in props) {
					if(typeof props[key] != "number") delete props[key]
				}
				TweenManager.tween(config.object, props, config.time, config.ease, config.delay)
			}
		})
	};
	this.destroy = function() {
		Render.stopRender(loop);
		for(var i = 0; i < _tweens.length; i++) _tweens[i].stop();
		return this._destroy()
	}
}, () => {
	TweenTimeline.UPDATE = "tweentimeline_update"
});
Class(function Shaders() {
	Inherit(this, MVC);
	var _this = this;
	(function() {}());

	function parseSingleShader(code) {
		let uniforms = code.split("#!UNIFORMS")[1].split("#!")[0];
		let varyings = code.split("#!VARYINGS")[1].split("#!")[0];
		let attributes = code.split("#!ATTRIBUTES")[1].split("#!")[0];
		while(code.strpos("#!SHADER")) {
			code = code.slice(code.indexOf("#!SHADER"));
			let split = code.split("#!SHADER")[1];
			let br = split.indexOf("\n");
			let name = split.slice(0, br).split(": ")[1];
			let glsl = split.slice(br);
			if(name.strpos(".vs")) glsl = attributes + uniforms + varyings + glsl;
			else glsl = uniforms + varyings + glsl;
			_this[name] = glsl;
			code = code.replace("#!SHADER", "$")
		}
	}

	function parseCompiled(shaders) {
		var split = shaders.split("{@}");
		split.shift();
		for(var i = 0; i < split.length; i += 2) {
			var name = split[i];
			var text = split[i + 1];
			if(text.strpos("#!UNIFORMS")) parseSingleShader(text);
			else _this[name] = text
		}
	}

	function parseRequirements() {
		for(var key in _this) {
			var obj = _this[key];
			if(typeof obj === "string") {
				_this[key] = require(obj)
			}
		}
	}

	function require(shader) {
		if(!shader.strpos("require")) return shader;
		shader = shader.replace(/# require/g, "#require");
		while(shader.strpos("#require")) {
			var split = shader.split("#require(");
			var name = split[1].split(")")[0];
			name = name.replace(/ /g, "");
			if(!_this[name]) throw "Shader required " + name + ", but not found in compiled shaders.\n" + shader;
			shader = shader.replace("#require(" + name + ")", _this[name])
		}
		return shader
	}
	this.parse = function(code, file) {
		if(!code.strpos("{@}")) {
			file = file.split("/");
			file = file[file.length - 1];
			_this[file] = code
		} else {
			parseCompiled(code);
			parseRequirements()
		}
		_this.shadersParsed = true
	};
	this.onReady = this.ready = function(callback) {
		let promise = Promise.create();
		if(callback) promise.then(callback);
		this.wait(() => promise.resolve(), this, "shadersParsed");
		return promise
	};
	this.getShader = function(string) {
		if(_this.FALLBACKS) {
			if(_this.FALLBACKS[string]) {
				string = _this.FALLBACKS[string]
			}
		}
		var code = _this[string];
		if(code) {
			while(code.strpos("#test ")) {
				try {
					var test = code.split("#test ")[1];
					var name = test.split("\n")[0];
					var glsl = code.split("#test " + name + "\n")[1].split("#endtest")[0];
					if(!eval(name)) {
						code = code.replace(glsl, "")
					}
					code = code.replace("#test " + name + "\n", "");
					code = code.replace("#endtest", "")
				} catch(e) {
					throw "Error parsing test :: " + string
				}
			}
		}
		return code
	}
}, "static");
Class(function RenderPerformance() {
	Inherit(this, Component);
	var _this = this;
	var _time;
	var _times = [];
	var _fps = [];
	this.enabled = true;
	this.pastFrames = 60;
	this.time = function() {
		if(!this.enabled) return;
		if(!_time) {
			_time = performance.now()
		} else {
			var t = performance.now() - _time;
			_time = null;
			_times.unshift(t);
			if(_times.length > this.pastFrames) _times.pop();
			_fps.unshift(Render.FPS);
			if(_fps.length > this.pastFrames) _fps.pop();
			this.average = 0;
			var len = _times.length;
			for(var i = 0; i < len; i++) {
				this.average += _times[i]
			}
			this.average /= len;
			this.averageFPS = 0;
			len = _fps.length;
			for(i = 0; i < len; i++) {
				this.averageFPS += _fps[i]
			}
			this.averageFPS /= len
		}
	};
	this.clear = function() {
		_times.length = 0
	};
	this.dump = function() {
		console.log(_times)
	};
	this.get("times", function() {
		return _times
	});
	this.get("median", function() {
		_times.sort(function(a, b) {
			return a - b
		});
		return _times[~~(_times.length / 2)]
	})
});
Class(function Video(_params) {
	Inherit(this, Component);
	var _this = this;
	var _inter, _time, _lastTime, _buffering, _seekTo, _loop, _forceRender;
	var _tick = 0;
	var _event = {};
	this.loop = false;
	this.playing = false;
	this.loaded = {
		start: 0,
		end: 0,
		percent: 0
	};
	this.width = _params.width || 0;
	this.height = _params.height || 0;
	(function() {
		createDiv();
		if(_params.preload !== false) preload()
	}());

	function createDiv() {
		var src = _params.src;
		if(src && !src.strpos("webm") && !src.strpos("mp4") && !src.strpos("ogv")) src += "." + Device.media.video;
		_this.div = document.createElement("video");
		if(src) _this.div.src = src;
		_this.div.controls = _params.controls;
		_this.div.id = _params.id || "";
		_this.div.width = _params.width;
		_this.div.height = _params.height;
		_loop = _this.div.loop = _params.loop;
		_this.object = $(_this.div);
		_this.width = _params.width;
		_this.height = _params.height;
		_this.object.size(_this.width, _this.height);
		if(Device.mobile) {
			_this.object.attr("webkit-playsinline", true);
			_this.object.attr("playsinline", true)
		}
	}

	function preload() {
		_this.div.preload = "auto";
		_this.div.load()
	}

	function tick() {
		if(!_this.div || !_this.events) return Render.stopRender(tick);
		_this.duration = _this.div.duration;
		_this.time = _this.div.currentTime;
		if(_this.div.currentTime == _lastTime) {
			_tick++;
			if(_tick > 30 && !_buffering) {
				_buffering = true;
				_this.events.fire(HydraEvents.ERROR, null, true)
			}
		} else {
			_tick = 0;
			if(_buffering) {
				_this.events.fire(HydraEvents.READY, null, true);
				_buffering = false
			}
		}
		_lastTime = _this.div.currentTime;
		if(_this.div.currentTime >= (_this.duration || _this.div.duration) - .001) {
			if(!_loop) {
				if(!_forceRender) Render.stopRender(tick);
				_this.events.fire(HydraEvents.COMPLETE, null, true)
			}
		}
		if(_this.div) {
			_event.time = _this.div.currentTime;
			_event.duration = _this.div.duration;
			_event.loaded = _this.loaded;
			_this.events.fire(HydraEvents.UPDATE, _event, true)
		}
	}

	function checkReady() {
		if(!_this.div) return false;
		if(!_seekTo) {
			_this.buffered = _this.div.readyState == _this.div.HAVE_ENOUGH_DATA
		} else {
			var max = -1;
			var seekable = _this.div.seekable;
			if(seekable) {
				for(var i = 0; i < seekable.length; i++) {
					if(seekable.start(i) < _seekTo) {
						max = seekable.end(i) - .5
					}
				}
				if(max >= _seekTo) _this.buffered = true
			} else {
				_this.buffered = true
			}
		}
		if(_this.buffered) {
			Render.stopRender(checkReady);
			_this.events.fire(HydraEvents.READY, null, true)
		}
	}

	function handleProgress() {
		if(!_this.ready()) return;
		var range = 0;
		var bf = _this.div.buffered;
		var time = _this.div.currentTime;
		while(!(bf.start(range) <= time && time <= bf.end(range))) {
			range += 1
		}
		_this.loaded.start = bf.start(range) / _this.div.duration;
		_this.loaded.end = bf.end(range) / _this.div.duration;
		_this.loaded.percent = _this.loaded.end - _this.loaded.start;
		_this.events.fire(HydraEvents.PROGRESS, _this.loaded, true)
	}
	this.set("loop", function(bool) {
		if(!_this.div) return;
		_loop = bool;
		_this.div.loop = bool
	});
	this.get("loop", function() {
		return _loop
	});
	this.set("src", function(src) {
		if(src && !src.strpos("webm") && !src.strpos("mp4") && !src.strpos("ogv")) src += "." + Device.media.video;
		_this.div.src = src
	});
	this.get("src", function() {
		return _this.div.src
	});
	this.play = function() {
		if(!_this.div) return false;
		_this.playing = true;
		_this.div.play();
		Render.startRender(tick)
	};
	this.pause = function() {
		if(!_this.div) return false;
		_this.playing = false;
		_this.div.pause();
		Render.stopRender(tick)
	};
	this.stop = function() {
		_this.playing = false;
		Render.stopRender(tick);
		if(!_this.div) return false;
		_this.div.pause();
		if(_this.ready()) _this.div.currentTime = 0
	};
	this.volume = function(v) {
		if(!_this.div) return false;
		_this.div.volume = v;
		if(_this.muted) {
			_this.muted = false;
			_this.div.removeAttribute("muted")
		}
	};
	this.mute = function() {
		if(!_this.div) return false;
		_this.volume(0);
		_this.muted = true;
		_this.object.attr("muted", true)
	};
	this.seek = function(t) {
		if(!_this.div) return false;
		if(_this.div.readyState <= 1) {
			Timer.create(function() {
				_this.seek && _this.seek(t)
			}, 32);
			return
		}
		_this.div.currentTime = t
	};
	this.canPlayTo = function(t) {
		_seekTo = null;
		if(t) _seekTo = t;
		if(!_this.div) return false;
		if(!_this.buffered) Render.startRender(checkReady);
		return this.buffered
	};
	this.ready = function() {
		if(!_this.div) return false;
		return _this.div.readyState >= 2
	};
	this.size = function(w, h) {
		if(!_this.div) return false;
		this.div.width = this.width = w;
		this.div.height = this.height = h;
		this.object.css({
			width: w,
			height: h
		})
	};
	this.forceRender = function() {
		_forceRender = true;
		Render.startRender(tick)
	};
	this.trackProgress = function() {
		_this.div.addEventListener("progress", handleProgress)
	};
	this.destroy = function() {
		this.stop();
		this.object.remove();
		this.div.src = "";
		return this._destroy()
	}
});
Class(function Webcam(_width, _height, _audio) {
	Inherit(this, Component);
	var _this = this;
	(function() {
		createVideo();
		initUserMedia()
	}());

	function createVideo() {
		_this.div = document.createElement("video");
		_this.div.width = _width;
		_this.div.height = _height;
		_this.div.autoplay = true;
		_this.element = $(_this.div)
	}

	function initUserMedia() {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		navigator.getUserMedia({
			video: true,
			audio: _audio
		}, success, error)
	}

	function success(stream) {
		_this.div.src = window.URL.createObjectURL(stream);
		_this.events.fire(HydraEvents.READY, null, true);
		_this.element.show()
	}

	function error() {
		_this.events.fire(HydraEvents.ERROR, null, true)
	}
	this.get("width", function() {
		return _width
	});
	this.get("height", function() {
		return _height
	});
	this.size = function(w, h) {
		_this.div.width = _width = w;
		_this.div.height = _height = h;
		if(_this.canvas) _this.canvas.resize(w, h)
	};
	this.getPixels = function() {
		if(!_this.canvas) _this.canvas = _this.initClass(Canvas, _width, _height, null);
		_this.canvas.context.drawImage(_this.div, 0, 0, _width, _height);
		return _this.canvas.context.getImageData(0, 0, _width, _height)
	};
	this.ready = function() {
		return _this.div.readyState > 0
	};
	this.destroy = function() {
		success = error = null;
		return this._destroy()
	}
});
Class(function AssetLoader(_assets, _complete) {
	Inherit(this, Component);
	var _this = this;
	var _total = 0;
	var _loaded = 0;
	var _added = 0;
	var _triggered = 0;
	var _queueLength = 2;
	var _lastTriggered = 0;
	var _queue, _qLoad, _currentQueue;
	var _output, _loadedFiles;
	var _id = Utils.timestamp();
	if(typeof _complete === "number") {
		_queueLength = _complete;
		_complete = null
	}(function() {
		_queue = {};
		_loadedFiles = [];
		prepareAssets();
		startLoading()
	}());

	function prepareAssets() {
		var perQueue = _assets.length / _queueLength;
		var count = 0;
		var index = 0;
		for(var i = 0; i < _assets.length; i++) {
			if(typeof _assets[i] !== "undefined") {
				if(!_queue[index]) _queue[index] = [];
				var queue = _queue[index];
				_total++;
				count++;
				if(count >= perQueue) {
					index += 1;
					count = 0
				}
				queue.push(_assets[i])
			}
		}
	}

	function startLoading() {
		_currentQueue = 0;
		loadQueue()
	}

	function loadQueue() {
		var queue = _queue[_currentQueue];
		if(!queue) return;
		_qLoad = 0;
		for(var i = 0; i < queue.length; i++) {
			loadAsset(queue[i])
		}
	}

	function checkQ() {
		if(!_queue) return;
		var queue = _queue[_currentQueue];
		if(!queue) return;
		var length = queue.length;
		_qLoad++;
		if(_qLoad == length) {
			_currentQueue++;
			loadQueue()
		}
	}

	function missingFiles() {
		if(!_queue) return;
		var missing = [];
		for(var i = 0; i < _queue.length; i++) {
			var loaded = false;
			for(var j = 0; j < _loadedFiles.length; j++) {
				if(_loadedFiles[j] == _queue[i]) loaded = true
			}
			if(!loaded) missing.push(_queue[i])
		}
		if(missing.length) {
			console.log("AssetLoader Files Failed To Load:");
			console.log(missing)
		}
	}

	function wrapXHR(xhr) {
		xhr.onError = function(e) {
			_this.events.fire(HydraEvents.ERROR, e)
		}
	}

	function loadAsset(asset) {
		if(!asset) return;
		var name = asset.split("/");
		name = name[name.length - 1];
		var split = name.split(".");
		var ext = split[split.length - 1].split("?")[0];
		switch(ext) {
			case "html":
				wrapXHR(XHR.get(asset, function(contents) {
					Hydra.HTML[split[0]] = contents;
					assetLoaded(asset)
				}, "text"));
				break;
			case "js":
			case "php":
			case undefined:
				wrapXHR(XHR.get(asset, function(script) {
					script = script.replace("use strict", "");
					eval.call(window, script);
					assetLoaded(asset)
				}, "text"));
				break;
			case "fnt":
			case "json":
				wrapXHR(XHR.get(asset, function(contents) {
					Hydra.JSON[split[0]] = contents;
					assetLoaded(asset)
				}, ext == "fnt" ? "text" : null));
				break;
			case "svg":
				wrapXHR(XHR.get(asset, function(contents) {
					Hydra.SVG[split[0]] = contents;
					assetLoaded(asset)
				}, "text"));
				break;
			case "fs":
			case "vs":
				wrapXHR(XHR.get(asset, function(contents) {
					Shaders.parse(contents, asset);
					assetLoaded(asset)
				}, "text"));
				break;
			default:
				var image = Images.createImg(asset);
				if(image.complete) {
					assetLoaded(asset);
					return
				}
				image.onload = function() {
					assetLoaded(asset)
				};
				break
		}
	}

	function assetLoaded(asset) {
		_loaded++;
		_this.percent = _loaded / _total;
		if(_this.events) _this.events.fire(HydraEvents.PROGRESS, {
			percent: _loaded / _total
		});
		_loadedFiles.push(asset);
		clearTimeout(_output);
		checkQ();
		if(_loaded == _total) {
			_this.complete = true;
			if(_this.events) _this.events.fire(HydraEvents.COMPLETE, null, true);
			if(typeof _complete === "function") _complete()
		} else {
			if(!window.THREAD && _this.delayedCall) _output = _this.delayedCall(missingFiles, 5e3)
		}
	}
	this.add = function(num) {
		_total += num;
		_added += num
	};
	this.trigger = function(num) {
		num = num || 1;
		for(var i = 0; i < num; i++) assetLoaded("trigger")
	};
	this.triggerPercent = function(percent, num) {
		num = num || _added;
		var trigger = Math.ceil(num * percent);
		if(trigger > _lastTriggered) this.trigger(trigger - _lastTriggered);
		_lastTriggered = trigger
	};
	this.destroy = function() {
		_assets = null;
		_loaded = null;
		_queue = null;
		_qLoad = null;
		return this._destroy && this._destroy()
	}
}, function() {
	AssetLoader.loadAllAssets = function(callback, cdn) {
		let promise = Promise.create();
		if(!callback) callback = promise.resolve;
		cdn = cdn || "";
		var list = [];
		for(var i = 0; i < ASSETS.length; i++) {
			list.push(cdn + ASSETS[i])
		}
		var assets = new AssetLoader(list, function() {
			if(callback) callback();
			if(assets && assets.destroy) assets = assets.destroy()
		});
		promise.loader = assets;
		return promise
	};
	AssetLoader.loadAssets = function(list, callback) {
		let promise = Promise.create();
		if(!callback) callback = promise.resolve;
		if(!list.length) return Promise.resolve();
		var assets = new AssetLoader(list, callback);
		promise.loader = assets;
		return promise
	};
	AssetLoader.waitForLib = function(name, callback) {
		let promise = Promise.create();
		if(!callback) callback = promise.resolve;
		var interval = setInterval(function() {
			if(window[name]) {
				clearInterval(interval);
				callback && callback();
				interval = callback = null
			}
		}, 100);
		return promise
	}
});
Class(function AssetUtil() {
	var _this = this;
	var _assets = {};
	var _exclude = ["!!!"];
	this.PATH = "";

	function canInclude(asset, match) {
		for(var i = 0; i < _exclude.length; i++) {
			var excl = _exclude[i];
			if(asset.strpos(excl) && match != excl) return false
		}
		return true
	}
	this.getAssets = this.loadAssets = function(list) {
		if(Hydra.CDN && !_this.PATH.length) _this.PATH = Hydra.CDN;
		var assets = this.get(list);
		var output = [];
		for(var i = assets.length - 1; i > -1; i--) {
			var asset = assets[i];
			if(!_assets[asset]) {
				output.push(asset.strpos("http") ? asset : _this.PATH + asset);
				_assets[asset] = 1
			}
		}
		return output
	};
	this.get = function(list) {
		if(!Array.isArray(list)) list = [list];
		var assets = [];
		for(var i = ASSETS.length - 1; i > -1; i--) {
			var asset = ASSETS[i];
			for(var j = list.length - 1; j > -1; j--) {
				var match = list[j];
				if(asset.strpos(match)) {
					if(canInclude(asset, match)) assets.push(asset)
				}
			}
		}
		return assets
	};
	this.exclude = function(list) {
		if(!Array.isArray(list)) list = [list];
		for(var i = 0; i < list.length; i++) _exclude.push(list[i])
	};
	this.removeExclude = function(list) {
		if(!Array.isArray(list)) list = [list];
		for(var i = 0; i < list.length; i++) _exclude.findAndRemove(list[i])
	};
	this.clearExclude = function() {
		_exclude = ["!!!"]
	};
	this.loadAllAssets = this.getAllAssets = function(list) {
		var assets = _this.loadAssets(list || "/");
		var loader = new AssetLoader(assets)
	};
	this.exists = function(match) {
		for(var i = ASSETS.length - 1; i > -1; i--) {
			var asset = ASSETS[i];
			if(asset.strpos(match)) return true
		}
		return false
	};
	this.prependPath = function(path, files) {
		if(!Array.isArray(files)) files = [files];
		for(var i = ASSETS.length - 1; i > -1; i--) {
			var asset = ASSETS[i];
			files.forEach(function(file) {
				if(asset.strpos(file)) ASSETS[i] = path + asset
			})
		}
	}
}, "Static");
Class(function Images() {
	var _this = this;
	this.inMemory = false;
	this.store = {};
	this.useCORS = false;

	function parseResolution(path) {
		if(!ASSETS.RES) return path;
		var res = ASSETS.RES[path];
		var ratio = Math.min(Device.pixelRatio, 3);
		if(res) {
			if(res["x" + ratio]) {
				var split = path.split("/");
				var file = split[split.length - 1];
				split = file.split(".");
				return path.replace(file, split[0] + "-" + ratio + "x." + split[1])
			} else {
				return path
			}
		} else {
			return path
		}
	}
	this.getPath = function(path) {
		if(path.strpos("http")) return path;
		path = parseResolution(path);
		return(Hydra.CDN || "") + path
	};
	this.createImg = function(path) {
		var cors = _this.useCORS;
		if(!path.strpos("http")) {
			path = parseResolution(path);
			path = (Hydra.CDN || "") + path
		}
		var img = new Image;
		if(cors) img.crossOrigin = "";
		img.src = path;
		if(this.store) this.storeImg(img);
		return img
	};
	this.storeImg = function(img) {
		if(this.inMemory) this.store[img.src] = img
	};
	this.releaseImg = function(path) {
		path = path.src ? path.src : path;
		delete this.store[path]
	}
}, "static");
Class(function PushState(_force) {
	var _this = this;
	if(typeof _force !== "boolean") _force = Hydra.LOCAL;
	this.locked = false;
	this.dispatcher = new StateDispatcher(_force);
	this.getState = function() {
		return this.dispatcher.getState()
	};
	this.setState = function(hash) {
		this.dispatcher.setState(hash)
	};
	this.replaceState = function(hash) {
		this.dispatcher.replaceState(hash)
	};
	this.setTitle = function(title) {
		this.dispatcher.setTitle(title)
	};
	this.lock = function() {
		this.locked = true;
		this.dispatcher.lock()
	};
	this.unlock = function() {
		this.locked = false;
		this.dispatcher.unlock()
	};
	this.setPathRoot = function(root) {
		this.dispatcher.setPathRoot(root)
	}
});
Class(function StateDispatcher(_forceHash) {
	Inherit(this, Events);
	var _this = this;
	var _initHash, _storeHash;
	var _root = "/";
	this.locked = false;
	(function() {
		createListener();
		_initHash = getHash();
		_storeHash = _initHash
	}());

	function createListener() {
		if(!Device.system.pushstate || _forceHash) {
			window.addEventListener("hashchange", function() {
				handleHashChange(getHash())
			}, false)
		} else {
			window.onpopstate = history.onpushstate = handleStateChange
		}
	}

	function getHash() {
		if(!Device.system.pushstate || _forceHash) {
			var value = window.location.hash;
			value = value.slice(3);
			return String(value)
		} else {
			var hash = location.pathname.toString();
			hash = _root != "/" ? hash.split(_root)[1] : hash.slice(1);
			hash = hash || "";
			return hash
		}
	}

	function handleStateChange() {
		var hash = location.pathname;
		if(!_this.locked && hash != _storeHash) {
			hash = _root != "/" ? hash.split(_root)[1] : hash.slice(1);
			hash = hash || "";
			_storeHash = hash;
			_this.events.fire(HydraEvents.UPDATE, {
				value: hash,
				split: hash.split("/")
			})
		} else if(hash != _storeHash) {
			if(_storeHash) window.history.pushState(null, null, _root + hash)
		}
	}

	function handleHashChange(hash) {
		if(!_this.locked && hash != _storeHash) {
			_storeHash = hash;
			_this.events.fire(HydraEvents.UPDATE, {
				value: hash,
				split: hash.split("/")
			})
		} else if(hash != _storeHash) {
			if(_storeHash) window.location.hash = "!/" + _storeHash
		}
	}
	this.getState = function() {
		if(Mobile.NativeCore && Mobile.NativeCore.active) return Storage.get("app_state") || "";
		return getHash()
	};
	this.setPathRoot = function(root) {
		if(root.charAt(0) == "/") _root = root;
		else _root = "/" + root
	};
	this.setState = function(hash) {
		if(Mobile.NativeCore && Mobile.NativeCore.active) {
			Storage.set("app_state", hash)
		}
		if(!Device.system.pushstate || _forceHash) {
			if(hash != _storeHash) {
				window.location.hash = "!/" + hash;
				_storeHash = hash
			}
		} else {
			if(hash != _storeHash) {
				window.history.pushState(null, null, _root + hash);
				_storeHash = hash
			}
		}
	};
	this.replaceState = function(hash) {
		if(!Device.system.pushstate || _forceHash) {
			if(hash != _storeHash) {
				window.location.hash = "!/" + hash;
				_storeHash = hash
			}
		} else {
			if(hash != _storeHash) {
				window.history.replaceState(null, null, _root + hash);
				_storeHash = hash
			}
		}
	};
	this.setTitle = function(title) {
		document.title = title
	};
	this.lock = function() {
		this.locked = true
	};
	this.unlock = function() {
		this.locked = false
	};
	this.forceHash = function() {
		_forceHash = true
	}
});
Class(function XHR() {
	var _this = this;
	var _serial;
	var _android = window.location.href.strpos("file://");
	this.headers = {};
	this.options = {};

	function serialize(key, data) {
		if(typeof data === "object") {
			for(var i in data) {
				var newKey = key + "[" + i + "]";
				if(typeof data[i] === "object") serialize(newKey, data[i]);
				else _serial.push(newKey + "=" + data[i])
			}
		} else {
			_serial.push(key + "=" + data)
		}
	}
	this.get = function(url, data, callback, type) {
		if(typeof data === "function") {
			type = callback;
			callback = data;
			data = null
		} else if(typeof data === "object") {
			var string = "?";
			for(var key in data) {
				string += key + "=" + data[key] + "&"
			}
			string = string.slice(0, -1);
			url += string
		}
		var xhr = new XMLHttpRequest;
		xhr.open("GET", url, true);
		if(type == "text") xhr.overrideMimeType("text/plain");
		if(type == "json") xhr.setRequestHeader("Accept", "application/json");
		for(var key in _this.headers) {
			xhr.setRequestHeader(key, _this.headers[key])
		}
		for(var key in _this.options) {
			xhr[key] = _this.options[key]
		}
		var promise = Promise.create();
		callback = callback || promise.resolve;
		xhr.send();
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4 && (_android || xhr.status == 200)) {
				if(typeof callback === "function") {
					var data = xhr.responseText;
					if(type == "text") {
						callback(data)
					} else {
						try {
							callback(JSON.parse(data))
						} catch(e) {
							throw e
						}
					}
				}
			}
			if(xhr.status == 0 || xhr.status == 401 || xhr.status == 404 || xhr.status == 500) promise.reject(xhr.status + " " + xhr.responseText)
		};
		return promise
	};
	this.post = function(url, data, callback, type, header) {
		if(typeof data === "function") {
			header = type;
			type = callback;
			callback = data;
			data = null
		} else if(typeof data === "object") {
			if(callback == "json" || type == "json" || header == "json") {
				data = JSON.stringify(data);
				header = "json"
			} else {
				_serial = new Array;
				for(var key in data) serialize(key, data[key]);
				data = _serial.join("&");
				data = data.replace(/\[/g, "%5B");
				data = data.replace(/\]/g, "%5D");
				_serial = null
			}
		}
		var xhr = new XMLHttpRequest;
		xhr.open("POST", url, true);
		if(type == "text") xhr.overrideMimeType("text/plain");
		if(type == "json") xhr.setRequestHeader("Accept", "application/json");
		switch(header) {
			case "upload":
				header = "application/upload";
				break;
			case "json":
				header = "application/json";
				break;
			default:
				header = "application/x-www-form-urlencoded";
				break
		}
		xhr.setRequestHeader("Content-type", header);
		for(var key in _this.headers) {
			xhr.setRequestHeader(key, _this.headers[key])
		}
		for(var key in _this.options) {
			xhr[key] = _this.options[key]
		}
		var promise = Promise.create();
		callback = callback || promise.resolve;
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4 && (_android || xhr.status == 200)) {
				if(typeof callback === "function") {
					var data = xhr.responseText;
					if(type == "text") {
						callback(data)
					} else {
						try {
							callback(JSON.parse(data))
						} catch(e) {
							throw e
						}
					}
				}
			}
			if(xhr.status == 0 || xhr.status == 401 || xhr.status == 404 || xhr.status == 500) promise.reject(xhr.status + " " + xhr.responseText)
		};
		xhr.send(data);
		return promise
	}
}, "Static");
Class(function Storage() {
	var _this = this;
	var _storage;
	(function() {
		testStorage()
	}());

	function testStorage() {
		try {
			if(window.localStorage) {
				try {
					window.localStorage["test"] = 1;
					window.localStorage.removeItem("test");
					_storage = true
				} catch(e) {
					_storage = false
				}
			} else {
				_storage = false
			}
		} catch(e) {
			_storage = false
		}
	}

	function cookie(key, value, expires) {
		var options;
		if(arguments.length > 1 && (value === null || typeof value !== "object")) {
			options = {};
			options.path = "/";
			options.expires = expires || 1;
			if(value === null) {
				options.expires = -1
			}
			if(typeof options.expires === "number") {
				var days = options.expires,
					t = options.expires = new Date;
				t.setDate(t.getDate() + days)
			}
			return document.cookie = [encodeURIComponent(key), "=", options.raw ? String(value) : encodeURIComponent(String(value)), options.expires ? "; expires=" + options.expires.toUTCString() : "", options.path ? "; path=" + options.path : "", options.domain ? "; domain=" + options.domain : "", options.secure ? "; secure" : ""].join("")
		}
		options = value || {};
		var result, decode = options.raw ? function(s) {
			return s
		} : decodeURIComponent;
		return(result = new RegExp("(?:^|; )" + encodeURIComponent(key) + "=([^;]*)").exec(document.cookie)) ? decode(result[1]) : null
	}
	this.setCookie = function(key, value, expires) {
		cookie(key, value, expires)
	};
	this.getCookie = function(key) {
		return cookie(key)
	};
	this.set = function(key, value) {
		if(value != null && typeof value === "object") value = JSON.stringify(value);
		if(_storage) {
			if(value === null) window.localStorage.removeItem(key);
			else window.localStorage[key] = value
		} else {
			cookie(key, value, 365)
		}
	};
	this.get = function(key) {
		var val;
		if(_storage) val = window.localStorage[key];
		else val = cookie(key);
		if(val) {
			var char0;
			if(val.charAt) char0 = val.charAt(0);
			if(char0 == "{" || char0 == "[") val = JSON.parse(val);
			if(val == "true" || val == "false") val = val == "true" ? true : false
		}
		return val
	}
}, "Static");
Class(function DistributedWorker(_time) {
	Inherit(this, Component);
	var _this = this;
	var _callback, _total;
	_time = _time || 4;
	(function() {}());

	function loop() {
		while(_total < _time) {
			var start = performance.now();
			if(_callback) _callback();
			else return;
			_total += performance.now() - start
		}
		_total = 0
	}
	this.start = function(callback) {
		Render.startRender(loop);
		_callback = callback;
		_total = 0
	};
	this.pause = function() {
		Render.stop(loop)
	};
	this.resume = function() {
		_total = 0;
		Render.start(loop)
	};
	this.stop = function() {
		Render.stopRender(loop);
		_callback = null
	};
	this.destroy = function() {
		this.stop();
		return this._destroy()
	};
	this.set("time", function(t) {
		_time = t
	});
	this.get("time", function() {
		return _time
	})
});
Class(function Thread(_class) {
	Inherit(this, Component);
	var _this = this;
	var _worker, _callbacks, _path, _mvc;
	var _msg = {};
	(function() {
		init();
		importClasses();
		addListeners()
	}());

	function init() {
		_callbacks = {};
		_worker = new Worker(Thread.PATH + "assets/js/hydra-thread.js")
	}

	function importClasses() {
		importClass(Utils);
		importClass(MVC);
		importClass(Component);
		importClass(Events);
		importClass(_class, true)
	}

	function importClass(_class, scoped) {
		if(!_class) return;
		var code, namespace;
		if(!scoped) {
			if(typeof _class !== "function") {
				code = _class.constructor.toString();
				if(code.strpos("[native")) return;
				namespace = _class.constructor._namespace ? _class.constructor._namespace + "." : "";
				code = namespace + "Class(" + code + ', "static");'
			} else {
				namespace = _class._namespace ? _class._namespace + "." : "";
				code = namespace + "Class(" + _class.toString() + ");"
			}
		} else {
			code = _class.toString().replace("{", "!!!");
			code = code.split("!!!")[1];
			var splitChar = window._MINIFIED_ ? "=" : " ";
			while(code.strpos("this")) {
				var split = code.slice(code.indexOf("this."));
				var name = split.split("this.")[1].split(splitChar)[0];
				code = code.replace("this", "self");
				createMethod(name)
			}
			code = code.slice(0, -1)
		}
		_worker.postMessage({
			code: code
		})
	}

	function createMethod(name) {
		_this[name] = function(message, callback) {
			_this.send(name, message, callback)
		}
	}

	function addListeners() {
		_worker.addEventListener("message", workerMessage)
	}

	function workerMessage(e) {
		if(e.data.console) {
			console.log(e.data.message)
		} else if(e.data.id) {
			var callback = _callbacks[e.data.id];
			if(callback) callback(e.data.message);
			delete _callbacks[e.data.id]
		} else if(e.data.emit) {
			var callback = _callbacks[e.data.evt];
			if(callback) callback(e.data.msg)
		} else {
			var callback = _callbacks["transfer"];
			if(callback) callback(e.data)
		}
	}
	this.on = function(evt, callback) {
		_callbacks[evt] = callback
	};
	this.off = function(evt) {
		delete _callbacks[evt]
	};
	this.loadFunctions = function() {
		for(var i = 0; i < arguments.length; i++) this.loadFunction(arguments[i])
	};
	this.loadFunction = function(code) {
		code = code.toString();
		code = code.replace("(", "!!!");
		var split = code.split("!!!");
		var name = split[0].split(" ")[1];
		code = "self." + name + " = function(" + split[1];
		_worker.postMessage({
			code: code
		});
		createMethod(name)
	};
	this.importScript = function(path) {
		_worker.postMessage({
			path: Thread.absolutePath(path),
			importScript: true
		})
	};
	this.importClass = function() {
		for(var i = 0; i < arguments.length; i++) {
			var code = arguments[i];
			importClass(code)
		}
	};
	this.send = function(name, message, callback) {
		if(typeof name === "string") {
			var fn = name;
			message = message || {};
			message.fn = name
		} else {
			callback = message;
			message = name
		}
		var id = Utils.timestamp();
		if(callback) _callbacks[id] = callback;
		if(message.transfer) {
			message.msg.id = id;
			message.msg.fn = message.fn;
			message.msg.transfer = true;
			_worker.postMessage(message.msg, message.buffer)
		} else {
			_msg.message = message;
			_msg.id = id;
			_worker.postMessage(_msg)
		}
	};
	this.destroy = function() {
		if(_worker.terminate) _worker.terminate();
		if(this._destroy) return this._destroy()
	}
}, () => {
	Thread.PATH = "";
	Thread.absolutePath = function(path) {
		let pathname = location.pathname;
		if(pathname.strpos("/index.html")) pathname = pathname.replace("/index.html", "");
		let port = Number(location.port) > 1e3 ? `:${location.port}` : "";
		return path.strpos("http") ? path : location.protocol + "//" + (location.hostname + port + pathname + "/" + path).replace("//", "/")
	}
});
Class(function Dev() {
	var _this = this;
	var _post, _alert;
	var _id = Utils.timestamp();
	(function() {
		if(Hydra.LOCAL) Hydra.development(true)
	}());

	function catchErrors() {
		window.onerror = function(message, file, line) {
			var string = message + " ::: " + file + " : " + line;
			if(_alert) alert(string);
			if(_post) XHR.post(_post + "/api/data/debug", getDebugInfo(string));
			if(_this.onError) _this.onError(message, file, line)
		}
	}

	function getDebugInfo(string) {
		var obj = {};
		obj.time = (new Date).toString();
		obj.deviceId = _id;
		obj.err = string;
		obj.ua = Device.agent;
		obj.width = Stage.width;
		obj.height = Stage.height;
		obj.screenWidth = screen.width;
		obj.screenHeight = screen.height;
		return obj
	}
	this.alertErrors = function(url) {
		_alert = true;
		if(typeof url === "string") url = [url];
		for(var i = 0; i < url.length; i++) {
			if(location.href.strpos(url[i]) || location.hash.strpos(url[i])) return catchErrors()
		}
	};
	this.postErrors = function(url, post) {
		_post = post;
		if(typeof url === "string") url = [url];
		for(var i = 0; i < url.length; i++) {
			if(location.href.strpos(url[i])) return catchErrors()
		}
	};
	this.expose = function(name, val, force) {
		if(Hydra.LOCAL || force) window[name] = val
	};
	this.logServer = function(msg) {
		if(_post) XHR.post(_post + "/api/data/debug", getDebugInfo(msg))
	};
	this.unsupported = function(needsAlert) {
		if(needsAlert) alert("Hi! This build is not yet ready for this device, things may not work as expected. Refer to build schedule for when this device will be supported.")
	}
}, "Static");
window.ASSETS = ["assets/geometry/everybody1.json", "assets/geometry/everybody2.json", "assets/geometry/woman.json", "assets/images/about/activetheory.png", "assets/images/about/emmit.png", "assets/images/about/th3rdbrain.png", "assets/images/common/dot.png", "assets/images/common/noise.png", "assets/images/menu/blinded.jpg", "assets/images/menu/drive.jpg", "assets/images/menu/everybody.jpg", "assets/images/menu/flame.jpg", "assets/images/menu/halo.jpg", "assets/images/menu/ninety.jpg", "assets/images/menu/oceans.jpg", "assets/images/menu/painting.jpg", "assets/images/menu/stones.jpg", "assets/images/menu/wantit.jpg", "assets/images/menu/woman.jpg", "assets/images/menu/woww.jpg", "assets/images/scenes/blinded/particle.png", "assets/images/scenes/flame/particle.png", "assets/images/scenes/ninetyfive/particle.png", "assets/images/scenes/oceans/glow.png", "assets/images/scenes/oceans/glow2.png", "assets/images/scenes/painting/particle.png", "assets/images/scenes/woman/digitaltransition.jpg", "assets/images/scenes/woman/normal.jpg", "assets/images/scenes/woman/particle.png", "assets/images/scenes/woman/particle2.png", "assets/images/scenes/woman/reflection-matcap.jpg", "assets/images/social/fb.png", "assets/images/social/inst.png", "assets/images/social/itu.png", "assets/images/social/sound.png", "assets/images/social/spot.png", "assets/images/social/tw.png", "assets/images/social/yt.png", "assets/images/social-dark/fb.png", "assets/images/social-dark/inst.png", "assets/images/social-dark/itu.png", "assets/images/social-dark/sound.png", "assets/images/social-dark/spot.png", "assets/images/social-dark/tw.png", "assets/images/social-dark/yt.png", "assets/images/ui/lock.png", "assets/js/lib/cannon.min.js", "assets/js/lib/three.min.js", "assets/js/lib/uil.min.js", "assets/shaders/compiled.vs"];
ASSETS.RES = {};
ASSETS.SW = ["assets/fonts/BrailleNormal.eot", "assets/fonts/BrailleNormal.ttf", "assets/fonts/BrailleNormal.woff", "assets/fonts/montserrat-bold-webfont.woff", "assets/fonts/montserrat-bold-webfont.woff2", "assets/fonts/montserrat-regular-webfont.woff", "assets/fonts/montserrat-regular-webfont.woff2", "assets/fonts/montserrat-semibold-demo.html", "assets/fonts/montserrat-semibold-webfont.woff", "assets/fonts/montserrat-semibold-webfont.woff2", "assets/fonts/specimen_files/grid_12-825-55-15.css", "assets/fonts/specimen_files/specimen_stylesheet.css", "assets/fonts/stylesheet.css", "assets/css/style.css", "assets/js/emmit.js"];
Class(function ColorConfig() {
	var _this = this;
	this.COLORS = {
		aubergine: 525704e1,
		maroon: 918149e1,
		chocolate: 8210482,
		violet: 1147919e1,
		red: 1540869e1,
		fuchsia: 15742885,
		tangerine: 1672965e1,
		salmon: 1608592e1,
		lavender: 11836362,
		orange: 16737335,
		bole: 13139285,
		yellow: 16442925,
		pink: 1676437e1,
		tan: 12818055,
		sunflower: 1676298e1,
		gold: 16096035,
		forest: 2568e1,
		spearmint: 4952445,
		neonGreen: 628872e1,
		electricSeafoam: 169742e1,
		citric: 134977e2,
		powderGreen: 1284116e1,
		midnight: 197898e1,
		royalblue: 2967225,
		kleinBlue: 4260085,
		azure: 5282805,
		aquamarine: 10219745,
		storm: 1053589e1
	};
	this.darken = function(color, perc) {
		let rgb = {
			r: Math.floor(color / (256 * 256)),
			g: Math.floor(color / 256) % 256,
			b: color % 256
		};
		for(var key in rgb) {
			rgb[key] = Math.round(rgb[key] * perc)
		}
		return rgb.r * (256 * 256) + rgb.g * 256 + rgb.b
	}
}, "static");
Class(function Config() {
	var _this = this;
	this.PROXY = "";
	this.CDN = "";
	this.TRANSITION_TIME = 6e3;
	this.TRANSITION_EASE = "easeInOutCubic";
	this.TRANSITION_EASE_OUT = "easeInOutCubic";
	this.TRACKS = [{
		name: "Oceans",
		id: "Oceans",
		hue: 185,
		image: "oceans.jpg",
		color: "hsl(186, 100%, 50%)"
	}, {
		name: "1995",
		id: "Ninety",
		hue: 225,
		image: "ninety.jpg",
		color: "hsl(225, 100%, 55%)"
	}, {
		name: "Painting Greys",
		id: "Painting",
		image: "painting.jpg"
	}, {
		name: "Modern Flame",
		reverse: true,
		id: "Flame",
		color: "hsl(1, 100%, 50%)",
		hue: 1,
		image: "flame.jpg"
	}, {
		name: "Want It",
		id: "Wantit",
		image: "wantit.jpg",
		hue: 305,
		color: "hsl(310, 90%, 65%)"
	}, {
		name: "Stones",
		id: "Stones",
		image: "stones.jpg"
	}, {
		name: "Woman",
		id: "Woman",
		image: "woman.jpg"
	}, {
		name: "Blinded",
		id: "Blinded",
		image: "blinded.jpg"
	}, {
		name: "Everybody Else",
		solid: true,
		id: "Everybody",
		image: "everybody.jpg",
		hue: 54,
		color: "hsl(54, 100%, 50%)"
	}];
	this.VIDEOS = [{
		name: "Memories",
		embed_id: "jU02oLSUwoY",
		image: "memories.jpg"
	}, {
		name: "What we once were",
		embed_id: "Iex2wk_di3Q",
		image: "woww.jpg"
	}, {
		name: "Halo 22",
		embed_id: "vD9yXGBV77s",
		image: "halo.jpg"
	}, {
		name: "Drive",
		embed_id: "iv9pshZ70JE",
		image: "drive.jpg"
	}]
}, "static");
Module(function BlindedConfig() {
	this.exports = {
		track: "assets/audio/tracks/blinded",
		duration: 224,
		background: 1118481,
		bpm: 126.82,
		light_uniforms: {
			fExposure: .9,
			fDecay: .9,
			fDensity: .7,
			fWeight: .15,
			fClamp: 1
		},
		beats: {
			snake1In: [3],
			snake2In: [4],
			snake2Out: [190],
			stall: [134],
			goFast: [150],
			goSlow: [195]
		}
	}
});
Module(function DriveConfig() {
	this.exports = {
		track: "assets/audio/tracks/drive",
		duration: 218,
		background: 1118481,
		bpm: 110,
		light_uniforms: {
			fExposure: .9,
			fDecay: .85,
			fDensity: .6,
			fWeight: .5,
			fClamp: 1
		},
		beats: {
			zoomIn: [38.7, 147.9],
			zoomOut: [55, 160],
			glowIn: [18, 127],
			beatIn: [34, 148],
			beatOut: [73]
		}
	}
});
Module(function EverybodyConfig() {
	this.exports = {
		track: "assets/audio/tracks/everybody-else",
		duration: 234,
		background: 1118481,
		bpm: 115,
		gradient: [16483639, 16752706, 16606776, 14047291, 9379358],
		light_uniforms: {
			fExposure: .95,
			fDecay: .8,
			fDensity: .25,
			fWeight: .4,
			fClamp: 1
		},
		beats: {
			dropIn: [49.5, 132.2],
			dropOut: [100],
			saxIn: [183],
			saxOut: [199.45]
		}
	}
});
Module(function FlameConfig() {
	this.exports = {
		track: "assets/audio/tracks/modern-flame",
		duration: 185,
		background: 1118481,
		bpm: 142.21,
		gradient: [16483639, 16752706, 16606776, 14047291, 9379358],
		light_uniforms: {
			fExposure: .95,
			fDecay: .82,
			fDensity: .8,
			fWeight: .3,
			fClamp: 1
		},
		beats: {
			flameStart: [2],
			bigHit: [57.577, 59.227, 60.977, 62.627, 64.293, 66.076, 67.761, 69.343, 71.093, 72.759, 74.443, 76.177, 77.843, 79.542, 81.227, 82.96, 138.704, 140.32, 142.054, 143.705, 145.403, 147.071, 148.787, 150.504, 152.22, 153.853, 155.553, 157.286, 158.936, 160.703, 162.286, 164.07],
			flameIn: [57.5, 138.7],
			flameOut: [85, 165]
		}
	}
});
Module(function NinetyConfig() {
	this.exports = {
		track: "assets/audio/tracks/1995",
		duration: 226,
		video: true,
		background: 1118481,
		bpm: 139.88,
		light_uniforms: {
			fExposure: .9,
			fDecay: .85,
			fDensity: .6,
			fWeight: .5,
			fClamp: 1
		},
		beats: {
			dropIn: [72, 181.7],
			dropOut: [99, 209],
			beatHit: [75.5, 78.923, 82.286, 85.761, 89.146, 92.583, 96.028, 185.164, 188.621, 192.005, 195.406, 198.845, 202.266, 205.72],
			bassHit: [44.591, 58.419, 161.429]
		}
	}
});
Module(function OceansConfig() {
	this.exports = {
		track: "assets/audio/tracks/oceans",
		duration: 305,
		background: 1118481,
		bpm: 140,
		light_uniforms: {
			fExposure: .9,
			fDecay: .9,
			fDensity: .9,
			fWeight: .3,
			fClamp: 1
		},
		beats: {
			dropIn: [125, 209, 262.2],
			colorIn: [48.4, 58.4],
			dip: [54.95],
			dropOut: [155, 237, 291]
		}
	}
});
Module(function PaintingConfig() {
	this.exports = {
		track: "assets/audio/tracks/painting-greys",
		duration: 227,
		background: 1118481,
		bpm: 133,
		light_uniforms: {
			fExposure: .99,
			fDecay: .94,
			fDensity: .98,
			fWeight: .15,
			fClamp: 1
		},
		beats: {
			bassIn: [30],
			dropIn: [59.5, 175],
			dropOut: [88.44, 203.9]
		}
	}
});
Module(function StonesConfig() {
	this.exports = {
		track: "assets/audio/tracks/stones",
		duration: 214,
		background: 1118481,
		lights: [{
			x: 100,
			y: 20,
			z: 40
		}],
		colors: {
			rocks: {
				base: 1579032,
				light: 7829367
			},
			core: {
				base: 6710886,
				light: 10066329
			}
		},
		bpm: 130,
		light_uniforms: {
			fExposure: .95,
			fDecay: .98,
			fDensity: .9,
			fWeight: .07,
			fClamp: 1
		},
		beats: {
			beatIn: [1, 30, 90, 147],
			beatOut: [27.5, 56, 144, 203],
			dropIn: [89, 145],
			dropOut: [120, 178],
			transition: [60.902, 89.52, 145.446, 179.135],
			out: [179.135]
		}
	}
});
Module(function WantitConfig() {
	this.exports = {
		track: "assets/audio/tracks/want-it",
		duration: 227,
		background: 1118481,
		bpm: 131,
		light_uniforms: {
			fExposure: .95,
			fDecay: .9,
			fDensity: .1,
			fWeight: .2,
			fClamp: 1
		},
		beats: {
			beatIn: [13, 89, 133, 192],
			fadeWire: [59, 162],
			beatOut: [56, 118, 162, 221],
			dropIn: [87, 191.2],
			dropOut: [10, 120]
		}
	}
});
Module(function WavesConfig() {
	this.exports = {
		track: "assets/audio/tracks/stones",
		background: 1118481,
		water: {
			base: 1118481e1,
			light: 1118481
		},
		underwater: {
			color0: 1118481,
			color1: 2236962
		},
		behaviors: [
			[{
				pos: {
					x: .094337,
					y: .200378,
					z: .01225
				},
				radius: 2.8726,
				strength: .001377
			}, {
				pos: {
					x: -.273911,
					y: .249483,
					z: -.313461
				},
				radius: 1.4778,
				strength: .001377
			}, {
				pos: {
					x: .280252,
					y: .098489,
					z: .106969
				},
				radius: 2.7002,
				strength: -.000806
			}],
			[{
				pos: {
					x: .378169,
					y: -.008758,
					z: -.143604
				},
				radius: 1.1566,
				strength: -.0008762
			}, {
				pos: {
					x: -.27525,
					y: -.088328,
					z: .251787
				},
				radius: 1.4778,
				strength: -.0008651
			}, {
				pos: {
					x: -.169017,
					y: .494785,
					z: .36324
				},
				radius: 2.7002,
				strength: .0014452
			}]
		],
		beats: {
			tick: [2.82, 4.666, 6.509, 8.356, 10.204, 12.052, 13.897, 15.745, 17.59, 19.435, 21.283, 23.128, 24.976, 26.817, 32.357, 34.205, 36.05, 37.902, 39.743, 41.591, 43.436, 45.284, 47.125, 48.975, 50.818, 52.665, 54.513, 56.358, 120.975, 122.818, 124.665, 126.51, 128.359, 130.205, 132.051, 133.897, 135.745, 137.588, 139.435, 141.281, 143.129, 144.972, 180.044, 181.896, 183.744, 185.588, 187.436, 189.28, 191.128, 192.972, 194.82, 196.664, 198.512, 200.353, 202.204, 204.045],
			transition: [60.902, 89.52, 145.446, 149.593, 179.135],
			big: [92.361, 94.21, 96.054, 97.903, 99.747, 101.596, 103.442, 105.289, 149.593, 151.439, 153.289, 155.131, 156.041, 156.986, 158.825, 160.673, 162.515, 163.324, 164.363, 166.215, 168.055, 169.899, 170.712, 171.747, 173.595, 175.436, 177.289, 178.098],
			out: [179.135]
		}
	}
});
Module(function WomanConfig() {
	this.exports = {
		track: "assets/audio/tracks/woman",
		duration: 177,
		background: 1118481,
		bpm: 156,
		light_uniforms: {
			fExposure: .95,
			fDecay: .8,
			fDensity: .4,
			fWeight: .5,
			fClamp: 1
		},
		beats: {
			start: [5],
			end: [120],
			out: [160]
		}
	}
});
Class(function EmmitEvents() {
	this.PLAY_PAUSE = "play_pause";
	this.TRACK_COMPLETE = "track_complete";
	this.BEAT_HIT = "beat_change"
}, "Static");
Class(function Antimatter(_num, _renderer) {
	Inherit(this, AntimatterCalculation);
	var _this = this;
	var _buffer, _geometry, _callback;
	var _cursor = 0;
	var _size = findSize();
	this.particleCount = _num;
	(function() {
		if(!window.Shader) throw "Antimatter requires hydra-three";
		defer(createBuffer)
	}());

	function findSize() {
		var values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
		for(var i = 0; i < values.length; i++) {
			var p2 = values[i];
			if(p2 * p2 >= _num) return p2
		}
	}

	function createBuffer() {
		AntimatterUtil.createBufferArray(_size, _num, function(geometry, vertices) {
			_this.vertices = _this.vertices || new AntimatterAttribute(vertices, 4);
			_geometry = new THREE.BufferGeometry;
			_geometry.addAttribute("position", new THREE.BufferAttribute(geometry, 3));
			_this.vertices.geometry = _geometry;
			_this.init(_geometry, _renderer, _size);
			if(_callback) {
				_callback();
				_callback = null
			}
		})
	}
	this.createFloatArray = function(components) {
		return new Float32Array(_size * _size * (components || 3))
	};
	this.ready = function(callback) {
		_callback = callback
	};
	this.getMesh = function() {
		var shader = _this.createShader(_this.fragmentShader || "void main() { gl_FragColor = vec4(1.0); }");
		_this.mesh = new THREE.Points(_geometry, shader.material);
		_this.mesh.frustumCulled = false;
		_this.shader = shader;
		_this.geometry = _geometry;
		return _this.mesh
	};
	this.createShader = function(fs) {
		var uniforms = _this.uniforms || {};
		var shader = new Shader(_this.vertexShader || "AntimatterPosition", fs);
		shader.uniforms = THREE.UniformsUtils.merge([{
			tPos: {
				type: "t",
				value: _this.vertices.texture
			}
		}, uniforms]);
		return shader
	};
	this.getLookupArray = function() {
		return new Float32Array(_this.vertices.geometry.attributes.position.array)
	}
});
Class(function AntimatterAttribute(_data, _components) {
	Inherit(this, Component);
	var _this = this;
	var _size = Math.sqrt(_data.length / (_components || 3));
	this.size = _size;
	this.count = _size * _size;
	this.buffer = _data;
	this.texture = new THREE.DataTexture(_data, _size, _size, _components == 4 ? THREE.RGBAFormat : THREE.RGBFormat, THREE.FloatType);
	this.texture.needsUpdate = true;
	this.set("needsUpdate", function() {
		_this.texture.needsUpdate = true
	});
	this.clone = function() {
		var array = new Float32Array(_data.length);
		array.set(_data);
		return new AntimatterAttribute(array, _components)
	};
	this.onDestroy = function() {
		_this.texture && _this.texture.dispose && _this.texture.dispose()
	}
});
Class(function AntimatterCalculation() {
	Inherit(this, Component);
	var _this, _gpuGeom, _renderer, _size;
	var _scene, _mesh, _camera, _copy, _geometry;
	var _frames = 0;
	var _output = {
		type: "t",
		value: null
	};
	var _callbacks = [];
	this.passes = [];

	function initPasses() {
		_camera = new THREE.OrthographicCamera(_size / -2, _size / 2, _size / 2, _size / -2, 1, 1e3);
		_geometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
		_scene = new THREE.Scene;
		_mesh = new THREE.Mesh(_geometry, new THREE.MeshBasicMaterial);
		_scene.add(_mesh);
		var copyShader = AntimatterCalculation.getCopyShader();
		_copy = new THREE.Mesh(_geometry, copyShader.material);
		_scene.add(_copy);
		_copy.visible = false
	}

	function copy(input, output) {
		var clear = _renderer.autoClear;
		_copy.visible = true;
		_mesh.visible = false;
		_copy.material.uniforms.tDiffuse.value = input;
		_renderer.autoClear = false;
		_renderer.render(_scene, _camera, output, false);
		_renderer.autoClear = clear;
		_copy.visible = false;
		_mesh.visible = true
	}

	function postRender(callback) {
		_callbacks.push(callback)
	}
	this.init = function(geometry, renderer, size) {
		_this = this;
		_gpuGeom = geometry.attributes.position.array;
		_renderer = renderer;
		_size = size;
		initPasses()
	};
	this.addPass = function(pass, index) {
		_this = this;
		var add = function(pass, index) {
			if(typeof index == "number") {
				_this.passes.splice(index, 0, pass);
				return
			}
			_this.passes.push(pass)
		};
		if(_this.passes.length) add(pass, index);
		else postRender(function() {
			add(pass, index)
		})
	};
	this.findPass = function(name) {
		for(var i = 0; i < _this.passes.length; i++) {
			var pass = _this.passes[i];
			if(pass.name == name) return pass
		}
	};
	this.removePass = function(pass) {
		_this = this;
		if(typeof pass == "number") {
			_this.passes.splice(pass)
		} else {
			_this.passes.remove(pass)
		}
	};
	this.update = function() {
		_this = this;
		if(!_this.mesh) return;
		var output = _output.value || _this.vertices.texture;
		for(var i = 0; i < _this.passes.length; i++) {
			var pass = _this.passes[i];
			var needsInit = !pass.init;
			var firstRender = !pass.first;
			if(needsInit) pass.initialize(_size, _this.particleCount);
			pass.first = true;
			_mesh.material = pass.shader.material;
			_mesh.material.uniforms.tInput.value = output;
			_mesh.material.uniforms.tValues.value = firstRender ? i == _this.passes.length - 1 || (pass.origin ? pass.origin.texture || pass.origin || _this.vertices.texture : null) : pass.output;
			_mesh.material.uniforms.tPrev.value = firstRender ? i == _this.passes.length - 1 ? _this.vertices.texture : null : pass.getRead();
			_mesh.material.uniforms.time.value = Render.TSL;
			var rt = firstRender ? pass.getRT(0) : pass.getWrite();
			var output = pass.output;
			_renderer.render(_scene, _camera, rt);
			copy(rt, output);
			if(firstRender) {
				copy(rt, pass.getRT(1));
				copy(rt, pass.getRT(2));
				pass.setRead(2);
				pass.setWrite(1);
				if(i == 0 && _this.passes.length > 1) return
			} else {
				pass.swap()
			}
		}
		if(!output) return;
		_output.value = output;
		_this.mesh.material.uniforms.tPos = _output;
		if(_callbacks.length) {
			_callbacks.forEach(function(c) {
				c()
			});
			_callbacks.length = 0
		}
	};
	this.onDestroy = function() {
		_geometry.dispose();
		_this.vertices.destroy();
		_this.passes.forEach(function(pass) {
			pass.first = false;
			if(!_this.persistPasses) pass && pass.destroy && pass.destroy()
		});
		_this.mesh.material.dispose();
		_this.mesh.geometry.dispose()
	};
	this.getOutput = function() {
		return _output
	}
}, function() {
	var _shader;
	AntimatterCalculation.getCopyShader = function() {
		if(!_shader) {
			_shader = new Shader("AntimatterCopy", "AntimatterCopy");
			_shader.uniforms = {
				tDiffuse: {
					type: "t",
					value: null
				}
			}
		}
		return _shader
	}
});
Class(function AntimatterPass(_shader, _uni, _clone) {
	var _this = this;
	var _uniforms = {
		tInput: {
			type: "t",
			value: null
		},
		tPrev: {
			type: "t",
			value: null
		},
		tValues: {
			type: "t",
			value: null
		},
		time: {
			type: "f",
			value: 0
		},
		fSize: {
			type: "f",
			value: 64
		},
		fTotalNum: {
			type: "f",
			value: 64
		}
	};
	var _rts = [];
	var _read = 0;
	var _write = 0;
	this.uniforms = _uniforms;
	this.output = initRT(64);
	this.name = _shader;
	this.id = Utils.timestamp();
	(function() {
		if(_uni) {
			for(var key in _uni) {
				_uniforms[key] = _uni[key]
			}
		}
	}());

	function prepareShader(size) {
		var utils = Shaders.getShader("antimatter.glsl");
		var fragment = Shaders.getShader(_shader + ".fs");
		fragment = fragment.replace("@SIZE", size);
		return ["uniform sampler2D tInput;", "uniform sampler2D tPrev;", "uniform sampler2D tValues;", "uniform float fSize;", "uniform float fTotalNum;", "uniform float time;", "vec2 getUV() { return (gl_FragCoord.xy / fSize); }", "bool notUsed() { return (gl_FragCoord.x * gl_FragCoord.y) > fTotalNum; }", utils, fragment].join("\n")
	}

	function initRT(size) {
		var type = Mobile.os == "Android" ? THREE.FloatType : THREE.HalfFloatType;
		var parameters = {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false,
			type: type
		};
		var rt = new THREE.WebGLRenderTarget(size, size, parameters);
		rt.texture.generateMipmaps = false;
		return rt
	}
	this.addInput = function(name, attribute) {
		var uniform = function() {
			if(typeof attribute === "object" && !attribute.height && typeof attribute.type === "string") return attribute;
			if(attribute instanceof AntimatterAttribute) return {
				type: "t",
				value: attribute.texture
			};
			return {
				type: "t",
				value: attribute
			}
		}();
		_uniforms[name] = uniform;
		return _uniforms[name]
	};
	this.getRT = function(index) {
		return _rts[index]
	};
	this.getRead = function() {
		return _rts[_read]
	};
	this.getWrite = function() {
		return _rts[_write]
	};
	this.setRead = function(index) {
		_read = index
	};
	this.setWrite = function(index) {
		_write = index
	};
	this.swap = function() {
		_write++;
		if(_write > 2) _write = 0;
		_read++;
		if(_read > 2) _read = 0
	};
	this.initialize = function(size, num) {
		if(_this.init) return;
		_this.init = true;
		for(var i = 0; i < 3; i++) {
			_rts.push(initRT(size))
		}
		_this.output.setSize(size, size);
		_uniforms.fTotalNum.value = num;
		if(!(_shader instanceof Shader)) {
			_shader = new Shader("AntimatterPass", prepareShader(size));
			_shader.uniforms = _uniforms;
			_shader.id = Utils.timestamp()
		}
		_this.shader = _shader;
		_shader.uniforms.fSize.value = size
	};
	this.setUniform = function(key, value) {
		if(_shader && _shader.uniforms) _shader.uniforms[key].value = value
	};
	this.tween = function(key, value, time, ease, delay, callback, update) {
		TweenManager.tween(_shader.uniforms[key], {
			value: value
		}, time, ease, delay, callback, update)
	};
	this.clone = function() {
		return new AntimatterPass(_shader, _uni)
	};
	this.destroy = function() {
		_rts.forEach(function(rt) {
			rt && rt.dispose && rt.dispose()
		})
	}
});
Class(function AntimatterUtil() {
	Inherit(this, Component);
	var _this = this;
	var _thread;
	(function() {
		initThread()
	}());

	function initThread() {
		_thread = _this.initClass(Thread);
		_thread.loadFunction(createBufferArray);
		_thread.loadFunction(encode)
	}

	function encode(value) {
		return(value + 99999) / (99999 * 2)
	}

	function createBufferArray(e, id) {
		var size = e.size;
		var num = e.num;
		var position = new Float32Array(num * 3);
		for(var i = 0; i < num; i++) {
			position[i * 3 + 0] = i % size / size;
			position[i * 3 + 1] = Math.floor(i / size) / size;
			position[i * 3 + 2] = 0
		}
		var vertices = new Float32Array(num * 4);
		for(var i = 0; i < num; i++) {
			vertices[i * 4 + 0] = Utils.doRandom(-15e2, 15e2);
			vertices[i * 4 + 1] = Utils.doRandom(-15e2, 15e2);
			vertices[i * 4 + 2] = Utils.doRandom(-1e3, 1e3);
			vertices[i * 4 + 3] = 1
		}
		post({
			array: position,
			vertices: vertices
		}, id, [position.buffer, vertices.buffer])
	}
	this.createBufferArray = function(size, num, callback) {
		_thread.createBufferArray({
			size: size,
			num: num
		}, function(data) {
			callback(data.array, data.vertices)
		})
	}
}, "static");
Class(function Curl() {
	Inherit(this, Component);
	var _this = this;
	var _dx = new Vector3;
	var _dy = new Vector3;
	var _dz = new Vector3;
	var _x = new Vector3;
	var _v = new Vector3;
	var _pool = new ObjectPool(Vector3, 10);

	function snoise(x) {
		return Noise.simplex3(x.x, x.y, x.z)
	}

	function snoiseVec3(x) {
		var s = snoise(x);
		var s1 = snoise(_v.set(x.y - 19.1, x.z + 33.4, x.x + 47.2));
		var s2 = snoise(_v.set(x.z + 74.2, x.x - 124.5, x.y + 99.4));
		var v = _pool.get();
		v.set(s, s1, s2);
		return v
	}
	this.noise = function(p, o) {
		var e = .1;
		_dx.set(e, 0, 0);
		_dy.set(0, e, 0);
		_dz.set(0, 0, e);
		var p_x0 = snoiseVec3(_x.copy(p).sub(_dx));
		var p_x1 = snoiseVec3(_x.copy(p).add(_dx));
		var p_y0 = snoiseVec3(_x.copy(p).sub(_dy));
		var p_y1 = snoiseVec3(_x.copy(p).add(_dy));
		var p_z0 = snoiseVec3(_x.copy(p).sub(_dz));
		var p_z1 = snoiseVec3(_x.copy(p).add(_dz));
		var x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
		var y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
		var z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
		var divisor = 1 / (2 * e);
		_pool.put(p_x0);
		_pool.put(p_x1);
		_pool.put(p_y0);
		_pool.put(p_y1);
		_pool.put(p_z0);
		_pool.put(p_z1);
		o = o || new Vector3;
		o.set(x, y, z).multiply(divisor).normalize();
		return o
	}
}, "static");
Class(function GATracker() {
	this.trackPage = function(page) {
		if(typeof ga !== "undefined") ga("send", "pageview", page)
	};
	this.trackEvent = function(category, action, label, value) {
		if(typeof ga !== "undefined") ga("send", "event", category, action, label, value || 0)
	}
}, "Static");
Class(function Geo() {
	Inherit(this, Model);
	var _this = this;
	var _data;
	const GOOGLE_GEO_KEY = "AIzaSyA-7wnychFbUZL7MPm9Y9TTBm1y1WOdQQs";
	(function() {}());

	function get() {
		let promise = Promise.create();
		XHR.post("https://www.googleapis.com/geolocation/v1/geolocate?key=" + (Config.GEOLOCATION_API_KEY ? Config.GOOGLE_GEO_KEY : GOOGLE_GEO_KEY)).then(function(geo) {
			if(geo && geo.location && geo.location.lat && geo.location.lng) {
				_data = geo;
				promise.resolve(geo)
			} else {
				promise.reject("Error: geolocate")
			}
		});
		return promise
	}
	this.data = function() {
		let promise = Promise.create();
		if(_data) promise.resolve(_data);
		else return get()
	}
}, "static");
Class(function GeomThread() {
	Inherit(this, Component);
	var _this = this;
	var _thread, _plane, _intro;
	var _data = {};
	(function() {
		initThread()
	}());

	function initThread() {
		_thread = _this.initClass(Thread, GeomThreadWorker);
		_thread.importClass(XHR, FireParticleGenerator, KinectGenerator);
		_thread.importScript("assets/js/lib/three.min.js");
		_thread.init({
			path: location.protocol + "//" + location.hostname + location.pathname
		})
	}
	this.load = function(name, callback) {
		_thread.load({
			name: name
		}, function(data) {
			_data[name] = data;
			callback(data)
		})
	};
	this.setSize = function(size) {
		_thread.setSize({
			size: size,
			gpu: Tests.useGPUParticles()
		})
	};
	this.generatePlane = function(callback) {
		if(_plane) return callback(_plane);
		_thread.generatePlane({}, function(data) {
			_plane = {};
			_plane.vertices = new AntimatterAttribute(data.buffer);
			_plane.attributes = new AntimatterAttribute(data.attribs, 4);
			callback(_plane)
		})
	};
	this.generateIntro = function(callback) {
		_thread.generateIntro({}, function(data) {
			_data["intro"] = data;
			_intro = data;
			callback(data)
		})
	};
	this.plugin = function(fn, data, callback) {
		if(typeof data == "function") {
			callback = data;
			data = {}
		}
		data.plugin = fn;
		_thread.generatePlugin(data, callback)
	};
	this.getData = function(name) {
		return _data[name]
	};
	this.getPlane = function() {
		return _plane
	}
}, "singleton");
Class(function GeomThreadWorker() {
	Inherit(this, Component);
	var _this = this;

	function initPlugins() {
		var plugins = [FireParticleGenerator, KinectGenerator];
		plugins.forEach(function(PluginClass) {
			var obj = new PluginClass;
			for(var key in obj) {
				if(!key.strpos("__")) _this[key] = obj[key]
			}
		})
	}

	function parseForGPU(data, id) {
		var position = data.position.array;
		var normal = data.normal.array;
		var color = data.color.array;
		var c = 4;
		var max = Global.PARTICLE_COUNT * c;
		var outputPosition = new Float32Array(max);
		var outputNormal = new Float32Array(max);
		var outputColor = new Float32Array(max);
		var count = position.length / 3;
		for(var i = 0; i < count; i++) {
			if(i < max) {
				outputPosition[i * c + 0] = position[i * 3 + 0];
				outputPosition[i * c + 1] = position[i * 3 + 1];
				outputPosition[i * c + 2] = position[i * 3 + 2];
				outputPosition[i * c + 3] = 1;
				outputNormal[i * 3 + 0] = normal[i * 3 + 0];
				outputNormal[i * 3 + 1] = normal[i * 3 + 1];
				outputNormal[i * 3 + 2] = normal[i * 3 + 2];
				outputColor[i * 3 + 0] = color[i * 3 + 0];
				outputColor[i * 3 + 1] = color[i * 3 + 1];
				outputColor[i * 3 + 2] = color[i * 3 + 2]
			}
		}
		for(i = i; i < Global.PARTICLE_COUNT; i++) {
			outputPosition[i * c + 0] = 9999999999;
			outputPosition[i * c + 1] = 9999999999;
			outputPosition[i * c + 2] = 9999999999;
			outputPosition[i * c + 3] = 1
		}
		var hit = [];
		var index = 0;
		for(var i = 0; i < count; i += 50) {
			hit[index * 3 + 0] = position[i * 3 + 0];
			hit[index * 3 + 1] = position[i * 3 + 1];
			hit[index * 3 + 2] = position[i * 3 + 2];
			index++
		}
		hit = new Float32Array(hit);
		post({
			vertices: outputPosition,
			normal: outputNormal,
			color: outputColor,
			hit: hit
		}, id, [outputPosition.buffer, outputNormal.buffer, outputColor.buffer, hit.buffer])
	}

	function parseForCPU(data, id) {
		var c = 3;
		var max = Global.PARTICLE_COUNT * c;
		var output = new Float32Array(max);
		var vertices = data.position.array;
		var normal = data.normal.array;
		var color = data.color.array;
		var outputNormal = new Float32Array(max);
		var outputColor = new Float32Array(max);
		var count = vertices.length / 3;
		for(var i = 0; i < count; i++) {
			if(i < max) {
				output[i * c + 0] = vertices[i * 3 + 0];
				output[i * c + 1] = vertices[i * 3 + 1];
				output[i * c + 2] = vertices[i * 3 + 2];
				outputNormal[i * c + 0] = normal[i * 3 + 0];
				outputNormal[i * c + 1] = normal[i * 3 + 1];
				outputNormal[i * c + 2] = normal[i * 3 + 2];
				outputColor[i * c + 0] = color[i * 3 + 0];
				outputColor[i * c + 1] = color[i * 3 + 1];
				outputColor[i * c + 2] = color[i * 3 + 2]
			}
		}
		var index = 0;
		var skip = 15 * c;
		var animated = [];
		var animatedNormal = [];
		var animatedColor = [];
		for(i = 0; i < count; i += skip) {
			animated[index * c + 0] = vertices[i * 3 + 0];
			animated[index * c + 1] = vertices[i * 3 + 1];
			animated[index * c + 2] = vertices[i * 3 + 2];
			animatedNormal[index * c + 0] = normal[i * 3 + 0];
			animatedNormal[index * c + 1] = normal[i * 3 + 1];
			animatedNormal[index * c + 2] = normal[i * 3 + 2];
			animatedColor[index * c + 0] = color[i * 3 + 0];
			animatedColor[index * c + 1] = color[i * 3 + 1];
			animatedColor[index * c + 2] = color[i * 3 + 2];
			index++
		}
		animated = new Float32Array(animated);
		animatedNormal = new Float32Array(animatedNormal);
		animatedColor = new Float32Array(animatedColor);
		var hit = [];
		var index = 0;
		for(var i = 0; i < count; i += 20) {
			hit[index * 3 + 0] = output[i * 3 + 0];
			hit[index * 3 + 1] = output[i * 3 + 1];
			hit[index * 3 + 2] = output[i * 3 + 2];
			index++
		}
		hit = new Float32Array(hit);
		post({
			vertices: output,
			animated: animated,
			normal: outputNormal,
			animatedNormal: animatedNormal,
			animatedColor: animatedColor,
			hit: hit,
			color: outputColor
		}, id, [output.buffer, animated.buffer, outputNormal.buffer, animatedNormal.buffer, animatedColor.buffer, hit.buffer, outputColor.buffer])
	}
	this.init = function(e) {
		Global.PATH = e.path + (e.path.charAt(e.path.length - 1) == "/" ? "" : "/");
		initPlugins()
	};
	this.load = function(e, id) {
		XHR.get(Global.PATH + "assets/lidar/" + e.name + ".json", function(data) {
			var geom = new THREE.BufferGeometry;
			geom.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position), 3));
			geom.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal), 3));
			var color = new Float32Array(data.colors);
			for(var i = color.length - 1; i > -1; i--) {
				color[i] = color[i] / 255
			}
			geom.addAttribute("color", new THREE.BufferAttribute(color, 3));
			geom.computeVertexNormals();
			data = geom.attributes;
			if(Global.GPU) parseForGPU(data, id);
			else parseForCPU(data, id)
		})
	};
	this.setSize = function(e) {
		Global.GPU = e.gpu;
		Global.PARTICLE_COUNT = e.size * e.size
	};
	this.generatePlane = function(e, id) {
		var max = Global.PARTICLE_COUNT;
		var buffer = new Float32Array(max * 3);
		var attribs = new Float32Array(max * 4);
		for(var i = 0; i < max; i++) {
			var x = Utils.doRandom(-960, 960);
			var y = Utils.doRandom(-540, 540);
			buffer[i * 3 + 0] = x;
			buffer[i * 3 + 1] = y;
			buffer[i * 3 + 2] = 0;
			attribs[i * 4 + 0] = Utils.doRandom(50, 550) / 100;
			attribs[i * 4 + 1] = Utils.doRandom(50, 150) / 100;
			attribs[i * 4 + 2] = 0;
			attribs[i * 4 + 3] = 0
		}
		post({
			buffer: buffer,
			attribs: attribs
		}, id, [buffer.buffer, attribs.buffer])
	};
	this.generatePlugin = function(e, id) {
		_this[e.plugin](e, id)
	};
	this.generateIntro = function(e, id) {
		var max = Global.PARTICLE_COUNT;
		var normals = new Float32Array(max * 3);
		var position = new Float32Array(max * 3);
		var color = new Float32Array(max * 3);
		for(var i = 0; i < max; i++) {
			color[i * 3 + 0] = 1;
			color[i * 3 + 1] = 1;
			color[i * 3 + 2] = 1;
			position[i * 3 + 0] = Utils.doRandom(-300, 300);
			position[i * 3 + 1] = Utils.doRandom(-300, 300);
			position[i * 3 + 2] = Utils.doRandom(-300, 300)
		}
		var geom = new THREE.BufferGeometry;
		geom.addAttribute("position", new THREE.BufferAttribute(position, 3));
		geom.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
		geom.addAttribute("color", new THREE.BufferAttribute(color, 3));
		var data = geom.attributes;
		if(Global.GPU) parseForGPU(data, id);
		else parseForCPU(data, id)
	}
});
Class(function FireParticleGenerator() {
	Inherit(this, Component);
	var _this = this;
	(function() {}());
	this.generateFireData = function(e, id) {
		var c = 4;
		var count = e.size;
		var max = count * c;
		var vertices = new Float32Array(max);
		var properties = new Float32Array(max);
		var spawn = new Float32Array(max);
		for(var i = 0; i < count; i++) {
			vertices[i * c + 0] = Utils.doRandom(-50, 50);
			vertices[i * c + 1] = Utils.doRandom(-50, 50);
			vertices[i * c + 2] = Utils.doRandom(-50, 50);
			vertices[i * c + 3] = 1;
			properties[i * c + 0] = Utils.doRandom(5e4, 1e5) / 1e5;
			properties[i * c + 1] = 0;
			properties[i * c + 2] = 0;
			properties[i * c + 3] = 0;
			spawn[i * c + 0] = Utils.doRandom(-5e3, 5e3);
			spawn[i * c + 1] = Utils.doRandom(-5e3, 5e3);
			spawn[i * c + 2] = Utils.doRandom(-5e3, 5e3);
			spawn[i * c + 3] = Utils.doRandom(0, 5e3) / 5e3
		}
		post({
			vertices: vertices,
			properties: properties,
			spawn: spawn
		}, id, [vertices.buffer, properties.buffer, spawn.buffer])
	}
});
Class(function KinectGenerator() {
	Inherit(this, Component);
	var _this = this;
	(function() {}());
	this.generateKinectMap = function(e, id) {
		var count = 256 * 256;
		var vertices = new Float32Array(count * 4);
		var size = 256;
		for(var i = 0; i < count; i++) {
			vertices[i * 4 + 0] = (i % size / size * size - size / 2) * .02;
			vertices[i * 4 + 1] = (Math.floor(i / size) / size * size - size / 2) * .02;
			vertices[i * 4 + 2] = Utils.doRandom(0, 1, 4);
			vertices[i * 4 + 3] = 2
		}
		post({
			vertices: vertices
		}, id, [vertices.buffer])
	}
});
Class(function GLScreenProjection(_camera, _target) {
	Inherit(this, Component);
	var _this = this;
	var _projection = new ScreenProjection(_camera);
	var _m0 = new THREE.Matrix4;
	var _m1 = new THREE.Matrix4;
	this.resolution = new THREE.Vector2;
	this.pos = new THREE.Vector2;
	this.pos3D = new THREE.Vector3;
	this.matrix = new THREE.Matrix4;
	this.uniforms = {
		projMatrix: {
			type: "v4",
			value: this.matrix
		},
		pos: {
			type: "v2",
			value: this.pos
		},
		pos3D: {
			type: "v3",
			value: this.pos3D
		},
		resolution: {
			type: "v2",
			value: this.resolution
		}
	};

	function loop() {
		_this.pos.set(_target.x, _target.y);
		_this.pos3D.copy(_projection.unproject(_this.pos));
		_m0.copy(_camera.projectionMatrix);
		_m1.getInverse(_camera.matrixWorld);
		_this.matrix.multiplyMatrices(_m0, _m1);
		_this.resolution.set(Stage.width, Stage.height)
	}
	this.set("camera", v => {
		_camera = v;
		_projection.camera = _camera
	});
	this.set("target", v => {
		_target = v
	});
	this.update = loop;
	this.start = function() {
		_this.startRender(loop)
	};
	this.stop = function() {
		_this.stopRender(loop)
	}
});
Class(function GPU() {
	Inherit(this, MVC);
	var _this = this;
	var _split = {};
	Timer.create(() => {
		_this.detect = function(match) {
			if(!Device.graphics.webgl) return;
			return Device.graphics.webgl.detect(match)
		};
		_this.detectAll = function() {
			if(!Device.graphics.webgl) return;
			var match = true;
			for(var i = 0; i < arguments.length; i++) {
				if(!Device.graphics.webgl.detect(arguments[i])) match = false
			}
			return match
		};
		_this.gpu = Device.graphics.webgl ? Device.graphics.webgl.gpu : "";

		function splitGPU(string) {
			if(_split[string]) return _split[string];
			if(!_this.detect(string)) return -1;
			try {
				var num = Number(_this.gpu.split(string)[1].split(" ")[0]);
				_split[string] = num;
				return num
			} catch(e) {
				return -1
			}
		}
		Mobile.iOS = require("iOSDevices").find();
		_this.BLACKLIST = require("GPUBlacklist").match();
		_this.T0 = function() {
			if(Device.mobile) return false;
			if(_this.BLACKLIST) return true;
			if(_this.detectAll("intel", "hd")) {
				var intel = splitGPU("hd graphics ");
				if(intel == 0) return true;
				if(intel > -1) return intel > 1e3 && intel < 4e3
			}
			return false
		}();
		_this.T1 = function() {
			if(Device.mobile) return false;
			if(_this.T0) return false;
			if(!_this.detect(["nvidia", "amd"])) return true;
			return false
		}();
		_this.T2 = function() {
			if(Device.mobile) return false;
			if(_this.T0) return false;
			if(_this.detect(["nvidia", "amd"])) return true;
			return false
		}();
		_this.T3 = function() {
			if(Device.mobile) return false;
			if(_this.detect(["titan"])) return true;
			return false
		}();
		_this.MT0 = function() {
			if(!Device.mobile) return false;
			if(Mobile.iOS.strpos(["legacy", "ipad mini 1", "5x", "ipad 4"])) return true;
			if(Mobile.os == "Android" && _this.detect("sgx")) return true;
			var adreno = splitGPU("adreno (tm) ");
			if(adreno > -1) {
				return adreno <= 330
			}
			var mali = splitGPU("mali-t");
			if(mali > -1) {
				return mali < 628
			}
			return false
		}();
		_this.MT1 = function() {
			if(!Device.mobile) return false;
			if(Mobile.iOS.strpos(["5s", "ipad air 1"])) return true;
			if(Mobile.os == "Android" && !_this.MT0) return true;
			return false
		}();
		_this.MT2 = function() {
			if(!Device.mobile) return false;
			if(Mobile.iOS.strpos(["6x", "ipad air 2"])) return true;
			var adreno = splitGPU("adreno (tm) ");
			if(adreno > -1 && Mobile.os == "Android" && Mobile.browserVersion >= 53) {
				return adreno > 400
			}
			return false
		}();
		_this.MT3 = function() {
			if(!Device.mobile) return false;
			if(Mobile.iOS.strpos(["6s", "ipad pro", "7x"])) return true;
			if(_this.detect("nvidia tegra") && Device.detect("pixel c")) {
				return true
			}
			var adreno = splitGPU("adreno (tm) ");
			if(adreno > -1 && Mobile.os == "Android" && Mobile.browserVersion >= 53) {
				return adreno >= 530
			}
			return false
		}();
		_this.lt = function(num) {
			if(_this.TIER > -1) {
				return _this.TIER <= num
			}
			return false
		};
		_this.gt = function(num) {
			if(_this.TIER > -1) {
				return _this.TIER >= num
			}
			return false
		};
		_this.eq = function(num) {
			if(_this.TIER > -1) {
				return _this.TIER == num
			}
			return false
		};
		_this.mobileEq = function(num) {
			if(_this.M_TIER > -1) {
				return _this.M_TIER == num
			}
			return false
		};
		_this.mobileLT = function(num) {
			if(_this.M_TIER > -1) {
				return _this.M_TIER <= num
			}
			return false
		};
		_this.mobileGT = function(num) {
			if(_this.M_TIER > -1) {
				return _this.M_TIER >= num
			}
			return false
		};
		for(var key in _this) {
			if(key.charAt(0) == "T" && _this[key] === true) _this.TIER = Number(key.charAt(1));
			if(key.slice(0, 2) == "MT" && _this[key] === true) _this.M_TIER = Number(key.charAt(2))
		}
		_this.OVERSIZED = !Device.mobile && _this.TIER < 2 && Math.max(window.innerWidth, window.innerHeight) > 144e1;
		_this.initialized = true
	}, 100);
	this.ready = function() {
		let promise = Promise.create();
		_this.wait(() => promise.resolve(), _this, "initialized");
		return promise
	}
}, "static");
Module(function GPUBlacklist() {
	this.exports = {
		match: function() {
			if(!Device.graphics.webgl) return true;
			return Device.graphics.webgl.detect(["radeon hd 6970m", "radeon hd 6770m", "radeon hd 6490m", "radeon hd 6630m", "radeon hd 6750m", "radeon hd 5750", "radeon hd 5670", "radeon hd 4850", "radeon hd 4870", "radeon hd 4670", "geforce 9400m", "geforce 320m", "geforce 330m", "geforce gt 130", "geforce gt 120", "geforce gtx 285", "geforce 8600", "geforce 9600m", "geforce 9400m", "geforce 8800 gs", "geforce 8800 gt", "quadro fx 5", "quadro fx 4", "radeon hd 2600", "radeon hd 2400", "radeon hd 2600", "radeon r9 200", "mali-4", "mali-3", "mali-2"])
		}
	}
});
Class(function Lighting() {
	Inherit(this, Component);
	var _this = this;
	var _particleDepthShader;
	var _lights = [];
	(function() {}());

	function loop() {
		decomposeLights(_lights)
	}

	function decomposeLights(lights) {
		for(var i = lights.length - 1; i > -1; i--) {
			var light = lights[i];
			if(!light.parent) light.updateMatrixWorld();
			else if(!light.parent.parent) light.parent.updateMatrixWorld();
			if(!light._world) light._world = new THREE.Vector3;
			light.getWorldPosition(light._world)
		}
	}

	function updateArrays(shader) {
		var lights = shader.lights;
		var lighting = shader.__lighting;
		var light;
		lighting.position.length = 0;
		lighting.color.length = 0;
		lighting.intensity.length = 0;
		lighting.distance.length = 0;
		for(var i = 0; i < lights.length; i++) {
			light = lights[i];
			lighting.position.push(light._world);
			lighting.color.push(light.color.r, light.color.g, light.color.b);
			lighting.intensity.push(light.intensity);
			lighting.distance.push(light.distance)
		}
		for(i = 0; i < _lights.length; i++) {
			light = _lights[i];
			lighting.position.push(light._world);
			lighting.color.push(light.color.r, light.color.g, light.color.b);
			lighting.intensity.push(light.intensity);
			lighting.distance.push(light.distance)
		}
	}
	this.add = function(light) {
		_lights.push(light);
		Render.start(loop)
	};
	this.remove = function(light) {
		_lights.findAndRemove(light)
	};
	this.getLighting = function(shader, force) {
		if(shader.__lighting && !force) return shader.__lighting;
		var lighting = {
			position: [],
			color: [],
			intensity: [],
			distance: []
		};
		shader.__lighting = lighting;
		if(_lights[0] && !_lights[0]._world) decomposeLights(_lights);
		decomposeLights(shader.lights);
		updateArrays(shader);
		return lighting
	};
	this.update = function(shader) {
		decomposeLights(shader.lights);
		updateArrays(shader)
	};
	this.getParticleDepthShader = function(light, size) {
		if(!_particleDepthShader) {
			_particleDepthShader = new Shader("ParticleDepth");
			_particleDepthShader.uniforms = {
				pointSize: {
					type: "f",
					value: size || 5
				},
				lightPos: {
					type: "v3",
					value: light.position
				},
				far: {
					type: "f",
					value: light.shadow.camera.far
				}
			};
			_particleDepthShader.receiveShadow = true
		}
		var shader = _particleDepthShader.clone();
		shader.set("pointSize", size || 5);
		shader.set("lightPos", light.position);
		shader.set("far", light.shadow.camera.far);
		return shader
	}
}, "static");
Class(function BasicPass() {
	Inherit(this, NukePass);
	var _this = this;
	this.fragmentShader = ["varying vec2 vUv;", "uniform sampler2D tDiffuse;", "void main() {", "gl_FragColor = texture2D(tDiffuse, vUv);", "}"];
	this.init(this.fragmentShader)
});
Class(function FXLayer(_parentNuke, _pass) {
	Inherit(this, Component);
	var _this = this;
	var _nuke, _rt;
	var _scene = new THREE.Scene;
	var _objects = [];
	var _rts = {};
	var _id = Utils.timestamp();
	this.resolution = 1;
	this.autoVisible = true;

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {
		_rt.setSize(_nuke.stage.width * _this.resolution * _nuke.dpr, _nuke.stage.height * _this.resolution * _nuke.dpr)
	}

	function initRT() {
		_rt = Utils3D.createRT(_nuke.stage.width * _this.resolution * _nuke.dpr, _nuke.stage.height * _this.resolution * _nuke.dpr);
		_this.rt = _rt
	}

	function updateTopParent(obj) {
		var parent = obj.parent;
		while(parent) {
			parent.updateMatrixWorld();
			parent = parent.parent
		}
	}
	this.create = function(nuke, pass) {
		if(!nuke) return;
		_this = this;
		_this.scene = _scene;
		_nuke = _this.initClass(Nuke, nuke.stage, {
			renderer: nuke.renderer,
			camera: nuke.camera,
			scene: _scene,
			dpr: nuke.dpr
		});
		_nuke.parentNuke = nuke;
		if(pass) _nuke.add(pass);
		_this.nuke = _nuke;
		initRT();
		addListeners()
	};
	this.addObject = function(object) {
		if(!_nuke) return;
		var clone = object.clone();
		object["clone_" + _id] = clone;
		_scene.add(clone);
		_objects.push(object);
		return clone
	};
	this.removeObject = function(object) {
		if(!_nuke) return;
		_scene.remove(object["clone_" + _id]);
		_objects.findAndRemove(object);
		delete object["clone_" + _id]
	};
	this.render = this.draw = function(stage, camera) {
		if(!_nuke) return;
		if(stage) {
			_nuke.stage = stage;
			_this.setSize(stage.width, stage.height)
		}
		if(camera) {
			_nuke.camera = camera
		} else {
			_nuke.camera = _nuke.parentNuke.camera
		}
		for(var i = _objects.length - 1; i > -1; i--) {
			var obj = _objects[i];
			var clone = obj["clone_" + _id];
			if(_this.autoVisible) {
				clone.material.visible = true;
				var parent = obj;
				while(parent) {
					if(parent.visible == false || parent.material && parent.material.visible == false) {
						clone.material.visible = false
					}
					parent = parent.parent
				}
			}
			if(_this.forceRender) {
				clone.material.visible = true
			}
			obj.updateMatrixWorld();
			if(!obj.ignoreMatrix) Utils3D.decompose(obj, clone)
		}
		_nuke.rtt = _rt;
		_nuke.render()
	};
	this.addPass = function(pass) {
		if(!_nuke) return;
		_nuke.add(pass)
	};
	this.removePass = function(pass) {
		if(!_nuke) return;
		_nuke.remove(pass)
	};
	this.setSize = function(width, height) {
		if(!_nuke) return;
		if(_rt.width == width && _rt.height == height) return;
		_this.events.unsubscribe(HydraEvents.RESIZE, resizeHandler);
		_rt.setSize(width * _this.resolution * _nuke.dpr, height * _this.resolution * _nuke.dpr);
		_nuke.setSize(width * _this.resolution * _nuke.dpr, height * _this.resolution * _nuke.dpr)
	};
	this.setDPR = function(dpr) {
		if(!_nuke) return;
		_nuke.dpr = dpr
	};
	if(_parentNuke instanceof Nuke) this.create(_parentNuke, _pass)
});
Namespace("FX");
Class(function Nuke(_stage, _params) {
	Inherit(this, Component);
	var _this = this;
	if(!_params.renderer) console.error("Nuke :: Must define renderer");
	_this.stage = _stage;
	_this.renderer = _params.renderer;
	_this.camera = _params.camera;
	_this.scene = _params.scene;
	_this.rtt = _params.rtt;
	_this.enabled = _params.enabled == false ? false : true;
	_this.passes = _params.passes || [];
	var _dpr = _params.dpr || 1;
	var _rts = {};
	var _rtStack = [];
	var _rttPing, _rttPong, _nukeScene, _nukeMesh, _rttCamera;
	(function() {
		initNuke();
		addListeners()
	}());

	function initNuke() {
		var width = _this.stage.width * _dpr;
		var height = _this.stage.height * _dpr;
		_rttPing = Nuke.getRT(width, height, "ping");
		_rttPong = Nuke.getRT(width, height, "pong");
		_rttCamera = new THREE.OrthographicCamera(_this.stage.width / -2, _this.stage.width / 2, _this.stage.height / 2, _this.stage.height / -2, 1, 1e3);
		_nukeScene = new THREE.Scene;
		_nukeMesh = new THREE.Mesh(Nuke.getPlaneGeom(), new THREE.MeshBasicMaterial);
		_nukeScene.add(_nukeMesh)
	}

	function finalRender(scene, camera) {
		if(_this.rtt) {
			_this.renderer.render(scene, camera || _this.camera, _this.rtt)
		} else {
			_this.renderer.render(scene, camera || _this.camera)
		}
		_this.postRender && _this.postRender()
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {
		var width = _this.stage.width * _dpr;
		var height = _this.stage.height * _dpr;
		_rttPing.dispose();
		_rttPong.dispose();
		_rttPing = Nuke.getRT(width, height, "ping");
		_rttPong = Nuke.getRT(width, height, "pong");
		_rttCamera.left = _this.stage.width / -2;
		_rttCamera.right = _this.stage.width / 2;
		_rttCamera.top = _this.stage.height / 2;
		_rttCamera.bottom = _this.stage.height / -2;
		_rttCamera.updateProjectionMatrix()
	}
	_this.add = function(pass, index) {
		if(!pass.pass) {
			defer(function() {
				_this.add(pass, index)
			});
			return
		}
		if(typeof index == "number") {
			_this.passes.splice(index, 0, pass);
			return
		}
		_this.passes.push(pass)
	};
	_this.remove = function(pass) {
		if(typeof pass == "number") {
			_this.passes.splice(pass)
		} else {
			_this.passes.findAndRemove(pass)
		}
	};
	_this.renderToTexture = function(clear, rtt) {
		_this.renderer.render(_this.scene, _this.camera, rtt || _rttPing, typeof clear == "boolean" ? clear : true)
	};
	_this.render = function() {
		if(!_this.enabled || !_this.passes.length) {
			finalRender(_this.scene);
			return
		}
		if(!_this.multiRender) {
			_this.renderer.render(_this.scene, _this.camera, _rttPing, true)
		}
		var pingPong = true;
		for(var i = 0; i < _this.passes.length - 1; i++) {
			_nukeMesh.material = _this.passes[i].pass;
			_nukeMesh.material.uniforms.tDiffuse.value = pingPong ? _rttPing.texture : _rttPong.texture;
			_this.renderer.render(_nukeScene, _rttCamera, pingPong ? _rttPong : _rttPing);
			pingPong = !pingPong
		}
		_nukeMesh.material = _this.passes[_this.passes.length - 1].pass;
		_nukeMesh.material.uniforms.tDiffuse.value = pingPong ? _rttPing.texture : _rttPong.texture;
		finalRender(_nukeScene, _rttCamera)
	};
	_this.setSize = function(width, height) {
		_this.events.unsubscribe(HydraEvents.RESIZE, resizeHandler);
		if(!_rts[width + "_" + height]) {
			var rttPing = Nuke.getRT(width * _dpr, height * _dpr, "ping");
			var rttPong = Nuke.getRT(width * _dpr, height * _dpr, "pong");
			_rts[width + "_" + height] = {
				ping: rttPing,
				pong: rttPong,
				name: width + "_" + height
			};
			_rtStack.push(_rts[width + "_" + height]);
			if(_rtStack.length > 3) {
				let rts = _rtStack.shift();
				delete _rts[rts.name];
				rts.ping.dispose();
				rts.pong.dispose()
			}
		}
		var rts = _rts[width + "_" + height];
		_rttPing = rts.ping;
		_rttPong = rts.pong
	};
	_this.set("dpr", function(v) {
		_dpr = v || Device.pixelRatio;
		resizeHandler()
	});
	_this.get("dpr", function() {
		return _dpr
	});
	_this.get("output", function() {
		return _nukeMesh.material.uniforms ? _nukeMesh.material.uniforms.tDiffuse.value : null
	})
}, function() {
	var _plane;
	var _rts = {};
	Nuke.getPlaneGeom = function() {
		if(!_plane) _plane = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
		return _plane
	};
	Nuke.getRT = function(width, height, type) {
		return Utils3D.createRT(width, height)
	}
});
Class(function NukePass(_fs, _vs, _pass) {
	Inherit(this, Component);
	var _this = this;
	this.name = _fs;

	function prefix(code) {
		if(!code) throw `No shader ${_fs} found`;
		var pre = "";
		pre += "precision highp float;\n";
		pre += "precision highp int;\n";
		if(!code.strpos("uniform sampler2D tDiffuse")) {
			pre += "uniform sampler2D tDiffuse;\n";
			pre += "varying vec2 vUv;\n"
		}
		code = pre + code;
		return code
	}

	function getVS() {
		return `
        precision highp float;
        precision highp int;

        varying vec2 vUv;

        attribute vec2 uv;
        attribute vec3 position;

        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
        `
	}
	this.init = function(fs) {
		if(_this.pass) return;
		_this = this;
		var name = fs || this.constructor.toString().match(/function ([^\(]+)/)[1];
		var fragmentShader = Array.isArray(fs) ? fs.join("") : null;
		_this.uniforms = _this.uniforms || {};
		_this.uniforms.tDiffuse = {
			type: "t",
			value: null
		};
		_this.pass = new THREE.RawShaderMaterial({
			uniforms: _this.uniforms,
			vertexShader: typeof _vs === "string" ? Shaders.getShader(name + ".vs") : getVS(),
			fragmentShader: fragmentShader || prefix(Shaders.getShader(name + ".fs"))
		});
		_this.uniforms = _this.pass.uniforms
	};
	this.set = function(key, value) {
		TweenManager.clearTween(_this.uniforms[key]);
		this.uniforms[key].value = value
	};
	this.tween = function(key, value, time, ease, delay, callback, update) {
		TweenManager.tween(_this.uniforms[key], {
			value: value
		}, time, ease, delay, callback, update)
	};
	this.clone = function() {
		if(!_this.pass) _this.init(_fs);
		return new NukePass(null, null, _this.pass.clone())
	};
	if(typeof _fs === "string") {
		defer(function() {
			_this.init(_fs)
		})
	} else if(_pass) {
		_this.pass = _pass;
		_this.uniforms = _pass.uniforms
	}
});
Class(function Raycaster(_camera) {
	Inherit(this, Component);
	var _this = this;
	var _mouse = new THREE.Vector3;
	var _raycaster = new THREE.Raycaster;
	var _debug = null;
	(function() {}());

	function intersect(objects) {
		var hit;
		if(Array.isArray(objects)) {
			hit = _raycaster.intersectObjects(objects)
		} else {
			hit = _raycaster.intersectObject(objects)
		}
		if(_debug) updateDebug();
		return hit
	}

	function updateDebug() {
		var vertices = _debug.geometry.vertices;
		vertices[0].copy(_raycaster.ray.origin.clone());
		vertices[1].copy(_raycaster.ray.origin.clone().add(_raycaster.ray.direction.clone().multiplyScalar(1e4)));
		_debug.geometry.verticesNeedUpdate = true
	}
	this.set("camera", function(camera) {
		_camera = camera
	});
	this.set("pointsThreshold", function(value) {
		_raycaster.params.Points.threshold = value
	});
	this.debug = function(scene) {
		var geom = new THREE.Geometry;
		geom.vertices.push(new THREE.Vector3(-100, 0, 0));
		geom.vertices.push(new THREE.Vector3(100, 0, 0));
		var mat = new THREE.LineBasicMaterial({
			color: 1671168e1
		});
		_debug = new THREE.Line(geom, mat);
		scene.add(_debug)
	};
	this.checkHit = function(objects, mouse) {
		mouse = mouse || Mouse;
		var rect = _this.rect || Stage;
		_mouse.x = mouse.x / rect.width * 2 - 1;
		_mouse.y = -(mouse.y / rect.height) * 2 + 1;
		_raycaster.setFromCamera(_mouse, _camera);
		return intersect(objects)
	};
	this.checkFromValues = function(objects, origin, direction) {
		_raycaster.set(origin, direction, 0, Number.POSITIVE_INFINITY);
		return intersect(objects)
	}
});
Class(function ScreenProjection(_camera) {
	Inherit(this, Component);
	var _this = this;
	var _v3 = new THREE.Vector3;
	var _v32 = new THREE.Vector3;
	var _value = new THREE.Vector3;
	(function() {}());
	this.set("camera", function(v) {
		_camera = v
	});
	this.unproject = function(mouse, distance) {
		var rect = _this.rect || Stage;
		_v3.set(mouse.x / rect.width * 2 - 1, -(mouse.y / rect.height) * 2 + 1, .5);
		_v3.unproject(_camera);
		var pos = _camera.position;
		_v3.sub(pos).normalize();
		var dist = distance || -pos.z / _v3.z;
		_value.copy(pos).add(_v3.multiplyScalar(dist));
		return _value
	};
	this.project = function(pos, screen) {
		screen = screen || Stage;
		if(pos instanceof THREE.Object3D) {
			pos.updateMatrixWorld();
			_v32.set(0, 0, 0).setFromMatrixPosition(pos.matrixWorld)
		} else {
			_v32.copy(pos)
		}
		_v32.project(_camera);
		_v32.x = (_v32.x + 1) / 2 * screen.width;
		_v32.y = -(_v32.y - 1) / 2 * screen.height;
		return _v32
	}
});
Class(function RandomEulerRotation(_container) {
	var _this = this;
	var _euler = ["x", "y", "z"];
	var _rot;
	this.speed = 1;
	(function() {
		initRotation()
	}());

	function initRotation() {
		_rot = {};
		_rot.x = Utils.doRandom(0, 2);
		_rot.y = Utils.doRandom(0, 2);
		_rot.z = Utils.doRandom(0, 2);
		_rot.vx = Utils.doRandom(-5, 5) * .0025;
		_rot.vy = Utils.doRandom(-5, 5) * .0025;
		_rot.vz = Utils.doRandom(-5, 5) * .0025
	}
	this.update = function() {
		var time = Render.TIME;
		for(var i = 0; i < 3; i++) {
			var v = _euler[i];
			switch(_rot[v]) {
				case 0:
					_container.rotation[v] += Math.cos(Math.sin(time * .25)) * _rot["v" + v] * _this.speed;
					break;
				case 1:
					_container.rotation[v] += Math.cos(Math.sin(time * .25)) * _rot["v" + v] * _this.speed;
					break;
				case 2:
					_container.rotation[v] += Math.cos(Math.cos(time * .25)) * _rot["v" + v] * _this.speed;
					break
			}
		}
	};
	this.startRender = function() {
		Render.start(_this.update)
	};
	this.stopRender = function() {
		Render.stop(_this.update)
	};
	this.onDestroy = function() {
		this.stopRender()
	}
});
Class(function Shader(_vertexShader, _fragmentShader, _name, _material) {
	Inherit(this, Component);
	var _this = this;
	this.receiveShadow = false;
	this.receiveLight = false;
	this.lights = [];
	this.uniforms = {};
	this.name = _vertexShader;
	(function() {
		if(!_fragmentShader) _fragmentShader = _vertexShader;
		if(Hydra.LOCAL && _name) expose();
		if(_material) {
			_this.uniforms = _material.uniforms;
			_this.attributes = _material.attributes;
			defer(function() {
				if(_this.receiveLight) {
					initLights();
					Render.start(updateLights)
				}
			})
		}
	}());

	function expose() {
		Dev.expose(_name, _this)
	}

	function process(code, type) {
		var lights = initLights();
		var header;
		if(type == "vs") {
			header = ["precision highp float;", "precision highp int;", "attribute vec2 uv;", "attribute vec3 position;", "attribute vec3 normal;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform mat4 modelMatrix;", "uniform mat4 viewMatrix;", "uniform mat3 normalMatrix;", "uniform vec3 cameraPosition;", ""].join("\n")
		} else {
			header = [code.strpos("dFdx") ? "#extension GL_OES_standard_derivatives : enable" : "", "precision highp float;", "precision highp int;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform mat4 modelMatrix;", "uniform mat4 viewMatrix;", "uniform mat3 normalMatrix;", "uniform vec3 cameraPosition;", ""].join("\n")
		}
		code = lights + code;
		if(!_this.receiveShadow && !_this.useShaderMaterial) code = header + code;
		var threeChunk = function(a, b) {
			return THREE.ShaderChunk[b] + "\n"
		};
		return code.replace(/#s?chunk\(\s?(\w+)\s?\);/g, threeChunk)
	}

	function initLights() {
		if(!_this.receiveLight) return "";
		var lighting = Lighting.getLighting(_this);
		var numLights = lighting.position.length;
		if(numLights == 0) {
			if(!Shader.disableWarnings) console.warn("Lighting enabled but 0 lights added. Be sure to add them before calling shader.material");
			return ""
		}
		return ["#define NUM_LIGHTS " + numLights, "uniform vec3 lightPos[" + numLights + "];", "uniform vec3 lightColor[" + numLights + "];", "uniform float lightIntensity[" + numLights + "];", "uniform float lightDistance[" + numLights + "];", ""].join("\n")
	}

	function updateMaterialLight(lighting) {
		_material.uniforms.lightPos = {
			type: "v3v",
			value: lighting.position
		};
		_material.uniforms.lightColor = {
			type: "fv",
			value: lighting.color
		};
		_material.uniforms.lightIntensity = {
			type: "fv1",
			value: lighting.intensity
		};
		_material.uniforms.lightDistance = {
			type: "fv1",
			value: lighting.distance
		};
		Render.start(updateLights)
	}

	function updateLights() {
		if(_material.visible !== false) Lighting.update(_this, true)
	}
	this.get("material", function() {
		if(!_material) {
			var params = {};
			params.vertexShader = process(Shaders.getShader(_vertexShader + ".vs") || _vertexShader, "vs");
			params.fragmentShader = process(Shaders.getShader(_fragmentShader + ".fs") || _fragmentShader, "fs");
			if(_this.attributes) params.attributes = _this.attributes;
			if(_this.uniforms) params.uniforms = _this.uniforms;
			if(_this.receiveShadow) {
				for(var key in THREE.UniformsLib.lights) {
					params.uniforms[key] = THREE.UniformsLib.lights[key]
				}
			}
			_material = _this.receiveShadow || _this.useShaderMaterial ? new THREE.ShaderMaterial(params) : new THREE.RawShaderMaterial(params);
			_material.shader = _this;
			_this.uniforms = _material.uniforms;
			if(_this.receiveLight) updateMaterialLight(_this.__lighting);
			if(_this.receiveShadow) _material.lights = true
		}
		return _material
	});
	this.set = function(key, value) {
		if(typeof value !== "undefined") _this.uniforms[key].value = value;
		return _this.uniforms[key].value
	};
	this.getValues = function() {
		var out = {};
		for(var key in _this.uniforms) {
			out[key] = _this.uniforms[key].value
		}
		return out
	};
	this.copyUniformsTo = function(obj) {
		for(var key in _this.uniforms) {
			obj.uniforms[key] = _this.uniforms[key]
		}
	};
	this.cloneUniformsTo = function(obj) {
		for(var key in _this.uniforms) {
			obj.uniforms[key] = {
				type: _this.uniforms[key].type,
				value: _this.uniforms[key].value
			}
		}
	};
	this.tween = function(key, value, time, ease, delay, callback, update) {
		return TweenManager.tween(_this.uniforms[key], {
			value: value
		}, time, ease, delay, callback, update)
	};
	this.clone = function(name) {
		var shader = new Shader(_vertexShader, _fragmentShader, name || _name, _this.material.clone());
		shader.receiveLight = this.receiveLight;
		shader.receiveShadow = this.receiveShadow;
		shader.lights = this.lights;
		shader.material.shader = shader;
		return shader
	};
	this.updateLighting = function() {
		var lighting = Lighting.getLighting(_this, true);
		_material.uniforms.lightPos.value = lighting.position;
		_material.uniforms.lightColor.value = lighting.color;
		_material.uniforms.lightIntensity.value = lighting.intensity;
		_material.uniforms.lightDistance.value = lighting.distance
	};
	this.onDestroy = function() {
		Render.stop(updateLights);
		_material && _material.dispose && _material.dispose()
	}
});
Class(function ParticlePhysicsBufferConverter(_geom, _system) {
	Inherit(this, Component);
	var _this = this;
	var _convert = [];
	var _particles = _system.particles;
	_convert.push({
		name: "position",
		props: ["x", "y", "z"],
		size: 3
	});
	this.add = function(name, props) {
		let obj = {
			name,
			props,
			size: props.length
		};
		_convert.push(obj);
		return obj
	};
	this.exec = function() {
		let index = 0;
		let p = _particles.start();
		while(p) {
			for(let i = _convert.length - 1; i > -1; i--) {
				let obj = _convert[i];
				if(obj.disabled) continue;
				let attribute = _geom.attributes[obj.name];
				for(let j = 0; j < obj.size; j++) {
					attribute.array[index * obj.size + j] = p[obj.props[j]] || p.pos[obj.props[j]] || 0
				}
				attribute.needsUpdate = true
			}++index;
			p = _particles.next()
		}
	};
	this.find = function(name) {
		for(let i = 0; i < _convert.length; i++) {
			let obj = _convert[i];
			if(obj.name == name) return obj
		}
	}
});
Class(function RandomEulerRotation(_container) {
	var _this = this;
	var _euler = ["x", "y", "z"];
	var _rot;
	this.speed = 1;
	(function() {
		initRotation()
	}());

	function initRotation() {
		_rot = {};
		_rot.x = Utils.doRandom(0, 2);
		_rot.y = Utils.doRandom(0, 2);
		_rot.z = Utils.doRandom(0, 2);
		_rot.vx = Utils.doRandom(-5, 5) * .0025;
		_rot.vy = Utils.doRandom(-5, 5) * .0025;
		_rot.vz = Utils.doRandom(-5, 5) * .0025
	}
	this.update = function() {
		var time = Render.TIME;
		for(var i = 0; i < 3; i++) {
			var v = _euler[i];
			switch(_rot[v]) {
				case 0:
					_container.rotation[v] += Math.cos(Math.sin(time * .25)) * _rot["v" + v] * _this.speed;
					break;
				case 1:
					_container.rotation[v] += Math.cos(Math.sin(time * .25)) * _rot["v" + v] * _this.speed;
					break;
				case 2:
					_container.rotation[v] += Math.cos(Math.cos(time * .25)) * _rot["v" + v] * _this.speed;
					break
			}
		}
	};
	this.startRender = function() {
		Render.start(_this.update)
	};
	this.stopRender = function() {
		Render.stop(_this.update)
	};
	this.onDestroy = function() {
		this.stopRender()
	}
});
Class(function Utils3D() {
	var _this = this;
	var _objectLoader, _geomLoader, _bufferGeomLoader;
	var _textures = {};
	this.PATH = "";
	this.decompose = function(local, world) {
		local.matrixWorld.decompose(world.position, world.quaternion, world.scale)
	};
	this.createDebug = function(size, color) {
		var geom = new THREE.IcosahedronGeometry(size || 40, 1);
		var mat = color ? new THREE.MeshBasicMaterial({
			color: color
		}) : new THREE.MeshNormalMaterial;
		return new THREE.Mesh(geom, mat)
	};
	this.createRT = function(width, height) {
		var params = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
		};
		return new THREE.WebGLRenderTarget(width, height, params)
	};
	this.getTexture = function(path) {
		if(!_textures[path]) {
			var img = new Image;
			img.crossOrigin = "anonymous";
			img.src = _this.PATH + path;
			var texture = new THREE.Texture(img);
			img.onload = function() {
				texture.needsUpdate = true;
				if(texture.onload) {
					texture.onload();
					texture.onload = null
				}
				if(!THREE.Math.isPowerOfTwo(img.width * img.height)) texture.minFilter = THREE.LinearFilter
			};
			_textures[path] = texture
		}
		return _textures[path]
	};
	this.setInfinity = function(v) {
		var inf = Number.POSITIVE_INFINITY;
		v.set(inf, inf, inf);
		return v
	};
	this.freezeMatrix = function(mesh) {
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix()
	};
	this.getCubemap = function(src) {
		var path = "cube_" + (Array.isArray(src) ? src[0] : src);
		if(!_textures[path]) {
			var images = [];
			for(var i = 0; i < 6; i++) {
				var img = new Image;
				img.crossOrigin = "";
				img.src = _this.PATH + (Array.isArray(src) ? src[i] : src);
				images.push(img);
				img.onload = function() {
					_textures[path].needsUpdate = true
				}
			}
			_textures[path] = new THREE.Texture;
			_textures[path].image = images;
			_textures[path].minFilter = THREE.LinearFilter
		}
		return _textures[path]
	};
	this.loadObject = function(name) {
		let json = typeof name == "object" ? name : Hydra.JSON[name];
		if(json.type == "hydra_c4d") {
			let group = new THREE.Group;
			let mat = new THREE.MeshBasicMaterial({
				wireframe: true,
				color: 104448e1
			});
			json.geometries.forEach(obj => {
				let data = obj.data;
				let geometry = new THREE.BufferGeometry;
				geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position), 3));
				geometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal), 3));
				geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.uv), 2));
				let mesh = new THREE.Mesh(geometry, mat);
				mesh.position.copy(obj.position);
				mesh.rotation.x = obj.rotation.x;
				mesh.rotation.y = obj.rotation.y;
				mesh.rotation.z = obj.rotation.z;
				mesh.scale.copy(obj.scale);
				mesh.name = obj.id;
				group.add(mesh)
			});
			return group
		} else {
			if(!_objectLoader) _objectLoader = new THREE.ObjectLoader;
			return _objectLoader.parse(Hydra.JSON[name])
		}
	};
	this.loadGeometry = function(name) {
		if(!_geomLoader) _geomLoader = new THREE.JSONLoader;
		if(!_bufferGeomLoader) _bufferGeomLoader = new THREE.BufferGeometryLoader;
		var json = Hydra.JSON[name];
		if(json.type == "BufferGeometry") {
			return _bufferGeomLoader.parse(json)
		} else {
			return _geomLoader.parse(json.data).geometry
		}
	};
	this.loadModelGeometry = function(name) {
		if(!_geomLoader) _geomLoader = new THREE.JSONLoader;
		if(!_bufferGeomLoader) _bufferGeomLoader = new THREE.BufferGeometryLoader;
		var json = Hydra.JSON[name].geometries[0];
		if(json.type == "BufferGeometry") {
			return _bufferGeomLoader.parse(json)
		} else {
			return _geomLoader.parse(json.data).geometry
		}
	};
	this.disposeAllTextures = function() {
		for(var key in _textures) {
			_textures[key].dispose()
		}
	};
	this.disableWarnings = function() {
		window.console.warn = function(str, msg) {};
		window.console.error = function() {}
	};
	this.detectGPU = function(matches) {
		var gpu = _this.GPU_INFO;
		if(gpu.gpu && gpu.gpu.strpos(matches)) return true;
		if(gpu.version && gpu.version.strpos(matches)) return true;
		return false
	};
	this.loadBufferGeometry = function(name) {
		var data = Hydra.JSON[name];
		var geometry = new THREE.BufferGeometry;
		if(data.data) data = data.data;
		geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position), 3));
		geometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal || data.position.length), 3));
		geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.uv || data.position.length / 3 * 2), 2));
		return geometry
	};
	this.loadSkinnedGeometry = function(name) {
		var data = Hydra.JSON[name];
		var geometry = new THREE.BufferGeometry;
		geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(data.position), 3));
		geometry.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normal), 3));
		geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(data.uv), 2));
		geometry.addAttribute("skinIndex", new THREE.BufferAttribute(new Float32Array(data.skinIndices), 4));
		geometry.addAttribute("skinWeight", new THREE.BufferAttribute(new Float32Array(data.skinWeights), 4));
		geometry.bones = data.bones;
		return geometry
	};
	this.loadCurve = function(obj) {
		if(typeof obj === "string") obj = Hydra.JSON[obj];
		var data = obj;
		var points = [];
		for(var j = 0; j < data.length; j += 3) {
			points.push(new THREE.Vector3(data[j + 0], data[j + 1], data[j + 2]))
		}
		return new THREE.CatmullRomCurve3(points)
	};
	this.setLightCamera = function(light, size, near, far, texture) {
		light.shadow.camera.left = -size;
		light.shadow.camera.right = size;
		light.shadow.camera.top = size;
		light.shadow.camera.bottom = -size;
		light.castShadow = true;
		if(near) light.shadow.camera.near = near;
		if(far) light.shadow.camera.far = far;
		if(texture) light.shadow.mapSize.width = light.shadow.mapSize.height = texture;
		light.shadow.camera.updateProjectionMatrix()
	};
	this.getRepeatTexture = function(src) {
		var texture = this.getTexture(src);
		texture.onload = function() {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping
		};
		return texture
	};
	this.forceVisible = function(group) {
		let setProperties = obj => {
			if(typeof obj.visible !== "undefined") {
				obj.__visible = obj.visible;
				obj.visible = true
			}
			if(typeof obj.frustumCulled !== "undefined") {
				obj.__frustumCulled = obj.frustumCulled;
				obj.frustumCulled = false
			}
		};
		let children = group.children;
		children.forEach(child => {
			setProperties(child);
			if(child.material) setProperties(child.material);
			_this.forceVisible(child)
		})
	};
	this.resetForceVisible = function(group) {
		let setProperties = obj => {
			if(typeof obj.__visible !== "undefined") {
				obj.visible = obj.__visible;
				delete obj.__visible
			}
			if(typeof obj.__frustumCulled !== "undefined") {
				obj.frustumCulled = obj.__frustumCulled;
				delete obj.__frustumCulled
			}
		};
		let children = group.children;
		children.forEach(child => {
			setProperties(child);
			if(child.material) setProperties(child.material);
			_this.resetForceVisible(child)
		})
	}
}, "static");
Module(function iOSDevices() {
	this.exports = {
		find: function() {
			if(Mobile.os != "iOS") return "";
			if(!Device.graphics.webgl) return "legacy";
			var detect = Device.graphics.webgl.detect;
			if(detect(["a9", "a10", "a11", "a12", "a13", "a14"]) || navigator.platform.toLowerCase().strpos("mac")) return Mobile.phone ? "6s, 7x" : "ipad pro";
			if(detect("a8")) return Mobile.phone ? "6x" : "ipad air 2, ipad mini 4";
			if(detect("a7")) return Mobile.phone ? "5s" : "ipad air 1, ipad mini 2, ipad mini 3";
			if(detect(["sgx554", "sgx 554"])) return Mobile.phone ? "" : "ipad 4";
			if(detect(["sgx543", "sgx 543"])) return Mobile.phone ? "5x, 5c, 4s" : "ipad mini 1, ipad 2";
			return "legacy"
		}
	}
});
Class(function ParticleEngine(_data, _shader, _system, _config) {
	Inherit(this, Component);
	var _this = this;
	var _system, _shader;
	this.group = new THREE.Group;
	this.initialized = false;
	(function() {
		initSubSystem()
	}());

	function initSubSystem() {
		System = _system;
		if(!System) throw "ParticleEngine requires CPU or GPU";
		_system = _this.initClass(System, _data, _shader || "ParticleEngineDefault", _config || {});
		_this.group.add(_system.group);
		_this.system = _system
	}

	function loop() {
		_system && _system.update()
	}
	this.onDestroy = function() {
		Render.stop(loop)
	};
	this.stopRender = function() {
		Render.stop(loop)
	};
	this.startRender = function() {
		Render.start(loop)
	};
	this.onReady = function() {
		let promise = Promise.create();
		_this.wait(promise.resolve, _this, "initialized");
		return promise
	};
	this.ready = function() {
		_this.events.fire(HydraEvents.READY, null, true);
		_this.initialized = true
	};
	this.addBehavior = function(behavior) {
		if(!_system) return _this.delayedCall(_this.addBehavior, 20, behavior);
		_system.addBehavior(behavior)
	};
	this.removeBehavior = function(behavior) {
		if(!_system) return _this.delayedCall(_this.removeBehavior, 20, behavior);
		_system.removeBehavior(behavior)
	}
}, function() {
	ParticleEngine.getShader = function(name, type, size, fs) {
		var shader = new Shader(ParticleEngine.getVS(name, type), fs || name);
		shader.uniforms = ParticleEngine.getUniforms(size);
		ParticleEngine.setProperties(shader);
		return shader
	};
	ParticleEngine.getVS = function(name, type) {
		var base = Shaders.getShader(type == "gpu" ? "ParticleEngineGPU.vs" : "ParticleEngineCPU.vs");
		var vs = Shaders.getShader(name + ".vs");
		if(!vs.strpos("void main() {")) throw "Must have void main() {";
		var split = vs.split("void main() {");
		var output = new String(base);
		output = output.replace("#param", split[0]);
		output = output.replace("#main", split[1].replace("}", ""));
		return output
	};
	ParticleEngine.getUniforms = function(size) {
		return {
			pointSize: {
				type: "f",
				value: size || .1
			}
		}
	};
	ParticleEngine.setProperties = function(shader) {}
});
Class(function ParticleBehavior() {
	Inherit(this, Component);
	var _this = this;
	this.uniforms = {};
	this.uniformUpload = {};
	var _dynamicObjects = {};
	(function() {}());

	function createUniform(name, value) {
		value = function() {
			if(typeof value == "object") {
				if(typeof value.z === "number") return(new Vector3).copy(value);
				if(typeof value.x === "number") return(new Vector2).copy(value)
			}
			return value
		}();
		_this.uniforms[name] = value
	}

	function convertUniform(value) {
		if(typeof value === "object") {
			if(typeof value.z === "number") return(new THREE.Vector3).copy(value);
			if(typeof value.x === "number") return(new THREE.Vector2).copy(value)
		}
		return value
	}
	this.addUniform = function(name, value) {
		this.uniforms[name] = value;
		if(this.pass) {
			value = convertUniform(value);
			var type = function() {
				if(typeof value.z === "number") return "v3";
				if(typeof value.x === "number") return "v2";
				return "f"
			}();
			this.pass.uniforms[name] = {
				type: type,
				value: value
			}
		}
	};
	this.updateUniform = function(name, value, def) {
		if(!def) this.uniforms[name] = value;
		_this = this;
		if(this.pass) {
			var uni = this.pass.uniforms[name];
			if(!uni) {
				nextFrame(function() {
					_this.updateUniform(name, value, true)
				})
			} else {
				this.pass.uniforms[name].value = value
			}
		}
	};
	this.writeUniform = function(name, value) {
		_this = this;
		var uniforms = this.uniforms;
		if(!uniforms[name]) {
			createUniform(name, value)
		}
		if(typeof value === "object") {
			uniforms[name].copy(value)
		} else {
			uniforms[name] = value
		}
	};
	this.tween = function(key, value, time, ease, delay, callback, update) {
		_this = this;
		if(this.pass) {
			if(typeof value === "number") {
				TweenManager.tween(this.pass.uniforms[key], {
					value: value
				}, time, ease, delay, callback)
			} else {
				TweenManager.tween(this.uniforms[key], value, time, ease, delay, callback, update)
			}
		} else {
			if(typeof value === "number") {
				var d = _dynamicObjects[key] || new DynamicObject({
					v: 0
				});
				_dynamicObjects[key] = d;
				if(typeof delay !== "number") {
					update = callback;
					callback = delay;
					delay = 0
				}
				d.stopTween();
				d.v = this.uniforms[key];
				d.tween({
					v: value
				}, time, ease, function() {
					_this.uniforms[key] = d.v
				}, callback)
			} else {
				TweenManager.tween(this.uniforms[key], value, time, ease, delay, callback, update)
			}
			delete _this.uniforms[key]._mathTween
		}
	};
	this.getUniform = function(name) {
		return this.pass ? this.pass.uniforms[name] : this.uniforms[name]
	};
	this.clone = function() {
		_this = this;
		var Behavior = _this.constructor;
		var instance = new Behavior;
		if(_this.pass) instance.pass = _this.pass.clone();
		return instance
	}
});
Class(function ParticleBehaviors() {
	var _this = this;
	var _behaviors = {};
	Namespace(this);
	this.get = function(name) {
		if(!window.THREAD && typeof _this.GPGPU === "undefined") throw ".GPGPU is undefined";
		if(!_this.GPGPU) return new _this[name];
		if(!_behaviors[name]) {
			var behavior = new _this[name];
			behavior.initGPU();
			_behaviors[name] = behavior
		}
		return _behaviors[name].clone()
	}
}, "static");
Class(function ParticleEngineCPU(_data, _vs, _config) {
	Inherit(this, Component);
	var _this = this;
	var _shader, _execPool;
	var _exec = [];
	var _chunks = [];
	var _uniforms = [];
	var _behaviors = [];
	this.group = new THREE.Group;
	this.id = Utils.timestamp();
	(function() {
		initChunks();
		defer(function() {
			_this.parent.ready()
		})
	}());

	function initChunks() {
		_shader = ParticleEngine.getShader(_vs, "cpu", _config.pointSize);
		_this.shader = _shader;
		var num = _config.threads || 1;
		for(var i = 0; i < num; i++) {
			var chunk = _this.initClass(ParticleEngineCPUChunk, _data, i, _shader, _config);
			_this.group.add(chunk.mesh);
			_chunks.push(chunk)
		}
	}

	function callChunks(fn, a, b) {
		for(var i = _chunks.length - 1; i > -1; i--) {
			_chunks[i][fn](a, b)
		}
	}
	this.update = function() {
		_uniforms.length = 0;
		for(var i = 0; i < _behaviors.length; i++) {
			var behavior = _behaviors[i];
			behavior.uniformUpload.name = behavior.name;
			behavior.uniformUpload.uniforms = behavior.uniforms;
			_uniforms.push(behavior.uniformUpload)
		}
		callChunks("update", _uniforms, _exec);
		for(i = 0; i < _exec.length; i++) _execPool.put(_exec[i]);
		_exec.length = 0
	};
	this.addBehavior = function(behavior) {
		behavior.onReady && behavior.onReady();
		behavior.system = this;
		var name = Hydra.getClassName(behavior);
		callChunks("addBehavior", "ParticleBehaviors." + name);
		behavior.name = "ParticleBehaviors." + name;
		_behaviors.push(behavior)
	};
	this.removeBehavior = function(behavior) {
		behavior.system = null;
		var name = Hydra.getClassName(behavior);
		callChunks("removeBehavior", "ParticleBehaviors." + name);
		_behaviors.findAndRemove(behavior)
	};
	this.exec = function(name, fn, data, index) {
		if(typeof index === "number") {
			_chunks[index].exec(name, fn, data)
		}
		if(!_execPool) _execPool = new ObjectPool(Object, 20);
		let obj = _execPool.get();
		obj.name = name;
		obj.cb = fn;
		obj.data = data;
		_exec.push(obj)
	};
	this.importClass = function() {
		for(var i = _chunks.length - 1; i > -1; i--) {
			_chunks[i].importClass.apply(_this, arguments)
		}
	};
	this.importScript = function(path) {
		callChunks("importScript", path)
	};
	this.initialize = function() {
		for(var i = _chunks.length - 1; i > -1; i--) {
			_chunks[i].initialize.apply(_this, arguments)
		}
	};
	this.getChunks = function(callback) {
		for(var i = 0; i < _chunks.length; i++) {
			callback(_chunks[i], i)
		}
	};
	this.getOverrideShader = function(fs) {
		if(!_this.overrideShader) _this.overrideShader = ParticleEngine.getShader(_vs, "cpu", _config.pointSize, fs);
		return _this.overrideShader
	}
});
Class(function ParticleConverter(_particles) {
	Inherit(this, Component);
	var _this = this;
	var _attributes = [];
	var _output = {};

	function createPool(attr) {
		attr.pool = new ObjectPool;
		attr.pool.size = _particles.length * attr.size;
		for(var i = 0; i < 5; i++) {
			attr.pool.put(new Float32Array(attr.pool.size))
		}
	}

	function findAttribute(name) {
		for(var i = 0; i < _attributes.length; i++) {
			var attr = _attributes[i];
			if(attr.name == name) return attr
		}
	}
	this.addAttribute = function(name, params) {
		var attr = {
			name: name,
			size: params.length,
			params: params
		};
		_attributes.push(attr);
		return attr
	};
	this.exec = function() {
		for(var i = 0; i < _attributes.length; i++) {
			var attr = _attributes[i];
			if(attr.disabled) {
				delete _output[attr.name];
				continue
			}
			if(!attr.pool) createPool(attr);
			var array = attr.pool.get() || new Float32Array(_particles.length * attr.size);
			var p = _particles.start();
			var index = 0;
			while(p) {
				for(var j = 0; j < attr.size; j++) {
					array[index * attr.size + j] = p[attr.params[j]] || p.pos[attr.params[j]] || 0
				}
				index++;
				p = _particles.next()
			}
			_output[attr.name] = array
		}
		return _output
	};
	this.recycle = function(e) {
		var attr = findAttribute(e.name);
		if(attr.pool) attr.pool.put(e.array)
	};
	this.clear = function() {
		_attributes.forEach(function(attr) {
			attr.pool = attr.pool.destroy()
		})
	};
	this.findAttribute = findAttribute
});
Class(function ParticleEngineCPUChunk(_data, _index, _shader, _config) {
	Inherit(this, ParticleEngineCPUChunkBase);
	var _this = this;
	var _chunk, _mesh;
	(function() {
		initChunk();
		initMesh();
		initBehaviors()
	}());

	function initChunk() {
		var vertices = [];
		var count = _data.vertices.length / 3;
		var skip = _config.threads || 1;
		var index = 0;
		for(var i = _index; i < count; i += skip) {
			vertices[index * 3 + 0] = _data.vertices[i * 3 + 0];
			vertices[index * 3 + 1] = _data.vertices[i * 3 + 1];
			vertices[index * 3 + 2] = _data.vertices[i * 3 + 2];
			index++
		}
		_this.init(new Float32Array(vertices), _config)
	}

	function initMesh() {
		_mesh = new THREE.Points(_this.geometry, _shader.material);
		_this.mesh = _mesh;
		_mesh.frustumCulled = false
	}

	function initBehaviors() {
		_this.thread.importClass(ParticleBehaviors, ParticleBehavior);
		for(var key in ParticleBehaviors) {
			var Class = ParticleBehaviors[key];
			if(Class.toString().strpos("ParticleBehavior")) {
				_this.thread.importClass(Class)
			}
		}
	}
	this.onDestroy = function() {
		_mesh.material.dispose();
		_mesh.geometry.dispose()
	}
});
Class(function ParticleEngineCPUChunkBase() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _vertices, _thread, _recycle, _bufferCallback, _position;
	var _scale = 1;
	var _delta = 1;
	var _msg = {};
	var _exec = {};

	function initGeometry() {
		_geom = new THREE.BufferGeometry;
		_geom.addAttribute("position", new THREE.BufferAttribute(_vertices, 3));
		_this.geometry = _geom
	}

	function initThread(config) {
		_thread = _this.initClass(config.simulateThread || ParticleEngineCPU.simulateThread ? SimulatedThread : Thread, ParticleEngineCPUThread);
		_thread.importClass(Vector2, Vector3, ParticlePhysics, EulerIntegrator, LinkedList, Particle, ObjectPool, TweenManager, TweenManager.Interpolation, Render, ParticleConverter);
		_this.thread = _thread;
		var clone = new Float32Array(_vertices.length);
		clone.set(_vertices);
		_thread.init({
			transfer: true,
			msg: {
				vertices: clone,
				buffer: [clone.buffer]
			}
		});
		_thread.on("transfer", transfer);
		_this.importClass = _thread.importClass
	}

	function recycle(buffer, key) {
		if(!_recycle) _recycle = {
			transfer: true,
			msg: {
				buffers: []
			}
		};
		_recycle.msg.name = key;
		_recycle.msg.array = buffer;
		_recycle.msg.buffers.length = 0;
		_recycle.msg.buffers.push(buffer.buffer);
		_thread.recycleBuffer(_recycle)
	}

	function interpolate() {
		let position = _geom.attributes.position.array;
		let count = position.length;
		for(let i = 0; i < count; i++) {
			var cx = _position[i * 3 + 0];
			var cy = _position[i * 3 + 1];
			var cz = _position[i * 3 + 2];
			var x = position[i * 3 + 0];
			var y = position[i * 3 + 1];
			var z = position[i * 3 + 2];
			var delta = _delta;
			var dx = cx - x;
			if(dx > 1 || dx < -1) delta = 1;
			x += (cx - x) * delta;
			y += (cy - y) * delta;
			z += (cz - z) * delta;
			position[i * 3 + 0] = x;
			position[i * 3 + 1] = y;
			position[i * 3 + 2] = z
		}
		if(_bufferCallback) {
			_bufferCallback("position", position)
		}
		_geom.attributes.position.needsUpdate = true
	}

	function transfer(e) {
		for(var key in e) {
			var buffer = e[key];
			if(!(buffer instanceof Float32Array)) continue;
			if(key == "position" && _delta < 1) {
				if(_position) recycle(_position, key);
				_position = buffer
			} else {
				if(_bufferCallback) {
					_bufferCallback(key, buffer);
					recycle(buffer, key)
				}
				if(_geom) {
					if(!_geom.attributes[key]) continue;
					_geom.attributes[key].array = buffer;
					_geom.attributes[key].needsUpdate = true;
					recycle(buffer, key)
				}
			}
		}
	}
	this.init = function(vertices, config) {
		_this = this;
		_vertices = vertices;
		initGeometry();
		initThread(config);
		_delta = config.interpolate || 1
	};
	this.update = function(uniforms, exec) {
		_msg.data = uniforms;
		_msg.exec = exec;
		_msg._id = _this.parent.id;
		_thread.send("update", _msg);
		if(_position) interpolate()
	};
	this.addBehavior = function(name) {
		_thread.addBehavior({
			name: name
		})
	};
	this.removeBehavior = function(name) {
		_thread.removeBehavior({
			name: name
		})
	};
	this.exec = function(name, fn, data) {
		_exec.name = name;
		_exec.cb = fn;
		_exec.data = data;
		_exec._id = _this.parent.id;
		_thread.send("exec", _exec)
	};
	this.initialize = function() {
		for(var i = 0; i < arguments.length; i++) {
			_thread.initialize({
				name: arguments[i],
				_id: _this.parent.id
			})
		}
	};
	this.importScript = function(path) {
		_thread.importScript(path)
	};
	this.handleBufferData = function(callback) {
		_bufferCallback = callback
	}
});
Class(function ParticleEngineCPUThread() {
	Inherit(this, Component);
	var _this = this;
	var _system, _vertices, _converter;
	var _behaviors = {};
	var _data = {};
	var _buffers = [];
	(function() {}());

	function initSystem(vertices) {
		_system = new ParticlePhysics;
		Global.SYSTEM = _system;
		var count = vertices.length / 3;
		for(var i = 0; i < count; i++) {
			var p = new Particle(new Vector3);
			p.pos.x = vertices[i * 3 + 0];
			p.pos.y = vertices[i * 3 + 1];
			p.pos.z = vertices[i * 3 + 2];
			_system.addParticle(p)
		}
	}

	function initConverter() {
		_converter = _this.initClass(ParticleConverter, _system.particles);
		_converter.addAttribute("position", ["x", "y", "z"]);
		_this.recycleBuffer = _converter.recycle;
		Global.CONVERTER = _converter
	}

	function loop() {
		_system.update();
		_system.onUpdate && _system.onUpdate();
		var outgoing = _converter.exec();
		_buffers.length = 0;
		for(var key in outgoing) {
			_buffers.push(outgoing[key].buffer)
		}
		emit("transfer", outgoing, _buffers)
	}

	function updateUniforms(e) {
		var uniforms = e.data;
		for(var i = 0; i < uniforms.length; i++) {
			var uni = uniforms[i];
			var behavior = _behaviors[uni.name];
			for(var key in uni.uniforms) {
				behavior.writeUniform(key, uni.uniforms[key])
			}
		}
	}

	function handleExec(array, id) {
		for(let i = 0; i < array.length; i++) {
			let e = array[i];
			Global[e.name + "_" + id][e.cb](e.data)
		}
	}
	this.init = function(e) {
		initSystem(e.vertices);
		initConverter()
	};
	this.update = function(e) {
		Render.tick();
		updateUniforms(e);
		handleExec(e.exec, e._id);
		loop()
	};
	this.addBehavior = function(e) {
		var name = e.name;
		var namespace = window;
		var behavior = null;
		if(name.strpos(".")) {
			var split = name.split(".");
			name = split[1];
			namespace = split[0];
			behavior = new window[namespace][name]
		} else {
			behavior = new window[name]
		}
		_behaviors[e.name] = behavior;
		_system.addBehavior(behavior);
		behavior.onReady && behavior.onReady()
	};
	this.removeBehavior = function(e) {
		var behavior = _behaviors[e.name];
		_system.removeBehavior(behavior);
		delete _behaviors[e.mame]
	};
	this.initialize = function(e) {
		Global[e.name + "_" + e._id] = new window[e.name]
	};
	this.exec = function(e) {
		Global[e.name + "_" + e._id][e.cb](e.data)
	};
	Global.emit = loop
});
Class(function ParticleEngineCameraTransfer(_camera) {
	var _this = this;
	this.obj = {};
	this.stage = {};
	this.mouse = {};
	this.camera = new THREE.PerspectiveCamera(1, 1, 1, 1);
	this.update = function(obj) {
		if(!obj) {
			if(!_this.obj.camera) _this.obj.camera = {
				position: {},
				quaternion: {}
			};
			if(!_this.obj.stage) _this.obj.stage = {};
			if(!_this.obj.pos) _this.obj.pos = {};
			if(!_this.obj.mouse) _this.obj.mouse = {};
			_this.obj.mouse.x = Mouse.x;
			_this.obj.mouse.y = Mouse.y;
			_this.obj.camera.position.x = _camera.position.x;
			_this.obj.camera.position.y = _camera.position.y;
			_this.obj.camera.position.z = _camera.position.z;
			_this.obj.camera.quaternion.x = _camera.quaternion.x;
			_this.obj.camera.quaternion.y = _camera.quaternion.y;
			_this.obj.camera.quaternion.z = _camera.quaternion.z;
			_this.obj.camera.quaternion.w = _camera.quaternion.w;
			_this.obj.aspect = _camera.aspect;
			_this.obj.fov = _camera.fov;
			_this.obj.stage.width = Stage.width;
			_this.obj.stage.height = Stage.height
		} else {
			_this.mouse.x = obj.mouse.x;
			_this.mouse.y = obj.mouse.y;
			_this.stage.width = obj.stage.width;
			_this.stage.height = obj.stage.height;
			_this.camera.position.copy(obj.camera.position);
			_this.camera.quaternion.copy(obj.camera.quaternion);
			_this.camera.aspect = obj.aspect;
			_this.camera.fov = obj.fov;
			_this.camera.updateMatrix();
			_this.camera.updateMatrixWorld();
			_this.camera.updateProjectionMatrix()
		}
	}
});
Class(function SimulatedThread(_class) {
	Inherit(this, Component);
	var _this = this;
	var _blocking = false;
	var _callbacks = {};
	var _blocked = [];
	var self = this;
	var _window = __window.div;
	var window = {
		location: {
			href: ""
		}
	};
	var Global = {};
	var Class = function(_class, _type) {
		var _this = window;
		var _string = _class.toString();
		var _name = _string.match(/function ([^\(]+)/)[1];
		var _static = null;
		if(typeof _type === "function") {
			_static = _type;
			_type = null
		}
		_type = (_type || "").toLowerCase();
		_class.prototype.__call = function() {
			if(this.events) this.events.scope(this)
		};
		if(!_type) {
			_this[_name] = _class;
			if(_static) _static()
		} else {
			if(_type == "static") {
				_this[_name] = new _class
			}
		}
	};

	function parseClass(_class, scoped) {
		if(!_class) return;
		var code, namespace;
		code = _class.toString().replace("{", "!!!");
		code = code.split("!!!")[1];
		var splitChar = _window._MINIFIED_ ? "=" : " ";
		while(code.strpos("this")) {
			var split = code.slice(code.indexOf("this."));
			var name = split.split("this.")[1].split(splitChar)[0];
			code = code.replace("this", "__ths__");
			createMethod(name)
		}
		code = code.slice(0, -1);
		code = code.replace(/__ths__/g, "this");
		return code
	}

	function post(data, id, buffer) {
		if(!(data && id)) {
			id = data;
			data = null
		}
		var callback = _callbacks[id];
		if(callback) callback(data);
		delete _callbacks[id]
	}

	function emit(evt, msg, buffer) {
		let callback = _callbacks[evt];
		callback && callback(msg)
	}

	function handleBlocked() {
		var array = _blocked;
		_blocked = [];
		array.forEach(obj => {
			var args = [];
			for(let i = 0; i < obj.args.length; i++) args.push(obj.args[i]);
			_this[obj.fn].apply(_this, args)
		})
	}

	function createMethod(name) {
		_this[name] = function(message, callback) {
			if(_blocking) return _blocked.push({
				fn: name,
				args: arguments
			});
			_this.send(name, message, callback)
		}
	}

	function sendToThread(msg) {
		if(msg.fn) {
			WORKER[msg.fn](msg, msg.id);
			return
		}
		if(msg.message.fn) {
			WORKER[msg.message.fn](msg.message, msg.id)
		}
	}

	function overloadMVC() {
		let code = MVC.toString();
		let overload = `
        var className = clss.toString().match(/function ([^\(]+)/)[1];
        var child = new window[className](a, b, c, d, e, f, g);
        `;
		code = code.replace(_window._MINIFIED_ ? "var child=new clss(a,b,c,d,e,f,g);" : "var child = new clss(a, b, c, d, e, f, g);", overload);
		return code
	}
	this.importScript = function(path) {
		if(_blocking) return _blocked.push({
			fn: "importScript",
			args: arguments
		});
		_blocking = true;
		SimulatedThread.loadScript(path).then(function() {
			_blocking = false;
			handleBlocked()
		})
	};
	this.loadFunction = function(code) {
		code = code.toString();
		code = code.replace("(", "!!!");
		var split = code.split("!!!");
		var name = split[0].split(" ")[1];
		code = "WORKER." + name + " = function(" + split[1];
		eval(code);
		createMethod(name)
	};
	this.importClass = function() {
		for(let i = 0; i < arguments.length; i++) {
			let _class = arguments[i];
			var code, namespace;
			if(typeof _class !== "function") {
				code = _class.constructor.toString();
				if(code.strpos("[native")) continue;
				namespace = _class.constructor._namespace ? _class.constructor._namespace + "." : "";
				code = namespace + "Class(" + code + ', "static");'
			} else {
				namespace = _class._namespace ? _class._namespace + "." : "";
				code = namespace + "Class(" + _class.toString() + ");"
			}
			if(!code.strpos("{")) continue;
			let name = code.match(/function ([^\(]+)/)[1];
			if(name == "Render") continue;
			eval(code)
		}
	};
	this.on = function(evt, callback) {
		_callbacks[evt] = callback
	};
	this.off = function(evt) {
		delete _callbacks[evt]
	};
	this.send = function(name, message, callback) {
		if(typeof name === "string") {
			var fn = name;
			message = message || {};
			message.fn = name
		} else {
			callback = message;
			message = name
		}
		var id = Utils.timestamp();
		if(callback) _callbacks[id] = callback;
		if(message.transfer) {
			message.msg.id = id;
			message.msg.fn = message.fn;
			message.msg.transfer = true;
			sendToThread(message.msg)
		} else {
			sendToThread({
				message: message,
				id: id
			})
		}
	};
	eval(`
        ${Events.toString()}
        ${overloadMVC()}
        ${Component.toString()}
        
        var WORKER = new function Worker() { ${parseClass(_class,true)} }
    `)
}, function() {
	SimulatedThread.loadScript = function(path) {
		path = "assets" + path.split("assets")[1];
		let promise = Promise.create();
		AssetUtil.clearExclude();
		let assets = AssetUtil.getAssets(path);
		if(!assets.length) promise.resolve();
		AssetLoader.loadAssets(assets, promise.resolve);
		return promise
	};
	SimulatedThread.PATH = "";
	SimulatedThread.absolutePath = function(path) {
		let pathname = location.pathname;
		if(pathname.strpos("/index.html")) pathname = pathname.replace("/index.html", "");
		let port = Number(location.port) > 1e3 ? `:${location.port}` : "";
		return path.strpos("http") ? path : location.protocol + "//" + (location.hostname + port + pathname + "/" + path).replace("//", "/")
	}
});
Class(function ParticleEngineGPU(_data, _shader, _config) {
	Inherit(this, Component);
	var _this = this;
	var _antimatter;
	var _behaviors = [];
	this.group = new THREE.Group;
	(function() {
		initAntimatter()
	}());

	function initAntimatter() {
		if(!_config.renderer) throw "ParticleEngineGPU requires renderer";
		if(!_config.particleCount) throw "ParticleEngineGPU requires particleCount";
		_antimatter = _this.initClass(Antimatter, _config.particleCount, _config.renderer);
		if(_data && _data.vertices) _antimatter.vertices = new AntimatterAttribute(_data.vertices);
		_antimatter.vertexShader = ParticleEngine.getVS(_shader || "ParticleEngineDefault", "gpu");
		_antimatter.fragmentShader = Shaders.getShader((_shader || "ParticleEngineDefault") + ".fs", _config.pointSize);
		_antimatter.uniforms = ParticleEngine.getUniforms(_config.pointSize);
		_antimatter.persistPasses = true;
		if(_data && _data.attributes) _antimatter.particleAttributes = _data.attributes;
		_this.antimatter = _antimatter;
		_antimatter.ready(function() {
			var mesh = _antimatter.getMesh();
			_this.group.add(mesh);
			_this.parent.shader = _antimatter.shader;
			_this.parent.mesh = mesh;
			_this.parent.ready()
		})
	}
	this.update = function() {
		for(var i = _behaviors.length - 1; i > -1; i--) {
			var behavior = _behaviors[i];
			if(!behavior.pass) console.log(behavior);
			for(var key in behavior.uniforms) {
				var uniforms = behavior.pass.uniforms[key];
				if(!uniforms) continue;
				var value = uniforms.value;
				if(typeof value === "object") value.copy(behavior.uniforms[key])
			}
		}
		_antimatter.update()
	};
	this.addBehavior = function(behavior) {
		if(!behavior.pass) behavior.initGPU();
		_behaviors.push(behavior);
		_antimatter.addPass(behavior.pass);
		behavior.onReady && behavior.onReady(_antimatter)
	};
	this.removeBehavior = function(behavior) {
		_antimatter.removePass(behavior.pass);
		_behaviors.findAndRemove(behavior)
	};
	this.getOverrideShader = function(fs) {
		return _antimatter.createShader(fs)
	}
});
Module(function Randomizr() {
	this.exports = random;
	var _last = [];

	function random(min, max, range) {
		var num = Utils.doRandom(min, max);
		if(max > 3) {
			while(_last.indexOf(num) > -1) {
				num = Utils.doRandom(min, max)
			}
			_last.push(num);
			if(_last.length > range) _last.shift()
		}
		return num
	}
});
Class(function ScrollUtil() {
	Inherit(this, Component);
	var _this = this;
	var _divide;
	var _callbacks = [];
	var _time = Date.now();
	var _touch = {
		y: 0,
		save: 0
	};
	var _wheel = false;
	var _delta = {};
	(function() {
		initDivide();
		Hydra.ready(addListeners)
	}());

	function initDivide() {
		if(Device.browser.ie) return _divide = 2;
		if(Device.system.os == "mac") {
			if(Device.browser.chrome || Device.browser.safari) _divide = 40;
			else _divide = 1
		} else {
			if(Device.browser.chrome) _divide = 15;
			else _divide = .5
		}
	}

	function addListeners() {
		if(!Device.mobile) {
			window.addEventListener("wheel", scroll)
		} else {
			__window.bind("touchstart", touchStart);
			__window.bind("touchend", touchEnd);
			__window.bind("touchcancel", touchEnd)
		}
	}

	function touchStart(e) {
		_touch.y = e.y;
		_touch.time = Date.now();
		_touch.velocity = 0;
		__window.bind("touchmove", touchMove)
	}

	function touchMove(e) {
		var diff = e.y - _touch.y;
		_touch.y = e.y;
		_touch.velocity = diff / (_touch.time - Date.now());
		_touch.time = Date.now();
		callback(-diff)
	}

	function touchEnd(e) {
		__window.unbind("touchmove", touchMove);
		callback(_touch.velocity * 100 || 0, _touch)
	}

	function keyPress(e) {
		var value = 750;
		if(e.code == 40) scroll({
			deltaY: value,
			deltaX: 0,
			key: true
		});
		if(e.code == 39) scroll({
			deltaY: 0,
			deltaX: value,
			key: true
		});
		if(e.code == 38) scroll({
			deltaY: -value,
			deltaX: 0,
			key: true
		});
		if(e.code == 37) scroll({
			deltaY: 0,
			deltaX: -value,
			key: true
		})
	}

	function scroll(e) {
		var value = e.wheelDelta || -e.detail;
		var timeDelta = Render.TIME - _time;
		if(typeof e.deltaX !== "undefined" || e.key) {
			_delta.x = -e.deltaX * .4;
			_delta.y = e.deltaY * .4;
			if(Device.browser.firefox && Device.system.os == "mac") {
				_delta.y *= .5;
				if(timeDelta < 50) _delta.y *= 30
			}
		} else {
			_delta.x = 0;
			var delta = Math.ceil(-value / _divide);
			if(delta <= 0) delta -= 1;
			delta = Utils.clamp(delta, -60, 60);
			_delta.y = delta * 3.5
		}
		if(Device.browser.firefox && Device.system.os.strpos("windows")) _delta.y *= 10;
		callback(_delta);
		_time = Render.TIME;
		if(!Device.mobile) {
			if(Math.abs(_delta.y) < 1) _this.TRACKPAD = true;
			if(Math.abs(_delta.y) > 100) _this.TRACKPAD = false
		}
	}

	function callback(delta) {
		for(var i = 0; i < _callbacks.length; i++) _callbacks[i](delta)
	}
	this.reset = function() {
		this.value = 0
	};
	this.link = function(callback) {
		_callbacks.push(callback)
	};
	this.unlink = function(callback) {
		var index = _callbacks.indexOf(callback);
		if(index > -1) _callbacks.splice(index, 1)
	}
}, "Static");
Class(function ShaderUIL() {
	Inherit(this, Component);
	var _this = this;
	var _uil, _active;
	var _groups = [];

	function initUIL() {
		if(!Global.UIL) {
			_uil = new UIL.Gui({
				css: "top: 0; right: 50px;",
				size: 300,
				center: true
			});
			Stage.add(_uil)
		} else {
			_uil = Global.UIL
		}
	}
	this.activate = function() {
		_active = true;
		if(window.UIL) initUIL()
	};
	this.push = function(shader) {
		if(!_uil) {
			if(_active && window.UIL) initUIL();
			else return
		}
		let group = new ShaderUILGroup(shader, _uil);
		_groups.push(group)
	};
	this.list = function() {
		_groups.forEach(group => group.console())
	};
	this.clear = function() {
		_groups.forEach(group => group.clear())
	}
}, "singleton");
Class(function ShaderUILGroup(_shader, _uil) {
	Inherit(this, Component);
	var _this = this;
	var _group = _uil.add("group", {
		name: _shader.name
	});
	var _objects = [];
	var _items = [];
	(function() {
		initItems()
	}());

	function initItems() {
		for(var key in _shader.uniforms) {
			let obj = _shader.uniforms[key];
			switch(obj.type) {
				case "f":
					createNumber(obj, key);
					break;
				case "c":
					createColor(obj, key);
					break
			}
		}
	}

	function createNumber(obj, key) {
		let val = new UILItem(key, obj.value, {
			prefix: _shader.name
		}, val => {
			obj.value = val
		});
		_group.add("number", val.obj);
		_objects.push({
			key,
			obj
		});
		_items.push(val)
	}

	function createColor(obj, key) {
		let val = new UILItem(key, obj.value.getHex(), {
			prefix: _shader.name
		}, val => {
			if(Array.isArray(val)) obj.value.setRGB(val[0], val[1], val[2]);
			else obj.value.set(val)
		});
		_group.add("color", val.obj);
		_objects.push({
			key,
			obj
		});
		_items.push(val)
	}
	this.console = function() {
		console.log(_shader.name);
		_objects.forEach(obj => {
			if(obj.obj.type == "c") console.log(obj.key, "#" + obj.obj.value.getHexString());
			else console.log(obj.key, obj.obj.value)
		});
		console.log("----")
	};
	this.clear = function() {
		_items.forEach(item => item.clear())
	}
});
Class(function UILItem(_name, _value, _params, _callback) {
	Inherit(this, Component);
	var _this = this;
	_value = Storage.get("uilitem_" + _name) || _value;
	if(typeof _params === "function") {
		_callback = _params;
		_params = null
	}(function() {
		_callback && _callback(_value);
		initUIL()
	}());

	function initUIL() {
		_this.obj = {
			name: _name,
			type: "html",
			value: _value,
			callback: callback
		};
		if(_params) {
			for(var key in _params) {
				_this.obj[key] = _params[key]
			}
		}
	}

	function callback(v) {
		_value = v;
		Storage.set("uilitem_" + _name, v);
		_callback && _callback(v)
	}
	this.clear = function() {
		Storage.set("uilitem_" + _name, null)
	};
	this.get("value", function() {
		return _value
	})
});
Class(function VelocityTracker(_vector) {
	Inherit(this, Component);
	var _this = this;
	var Vector = typeof _vector.z === "number" ? Vector3 : Vector2;
	var _velocity = new Vector;
	var _last = new Vector;
	this.value = _velocity;

	function loop() {
		_velocity.subVectors(_vector, _last);
		_last.copy(_vector)
	}
	this.startRender = function() {
		_this.startRender(loop)
	};
	this.onDestroy = this.stopRender = function() {
		_this.stopRender(loop)
	};
	this.copy = function() {
		_last.copy(_vector)
	};
	this.update = loop
});
Module(function VRDetect() {
	var _this = this;

	function detect() {
		let promise = Promise.create();
		if(!navigator.getVRDisplays) return promise.reject();
		navigator.getVRDisplays().then(displays => {
			let display = displays[0];
			_this.exports.hardware = display.displayName.toLowerCase();
			promise.resolve(_this.exports.hardware)
		});
		return promise
	}
	this.exports = {
		detect
	}
});
Class(function GameControllerCardboard() {
	Inherit(this, Component);
	var _this = this;
	var _screen, _debug;
	var _pos = new THREE.Vector3;
	var _center = new THREE.Vector2(Stage.width / 2, Stage.height / 2);
	(function() {
		_this.delayedCall(() => GameController.instance().pos.push(_pos), 10);
		initScreen();
		addListeners();
		Render.start(loop)
	}());

	function initDebug() {
		_debug = Utils3D.createDebug(.05);
		World.SCENE.add(_debug)
	}

	function initScreen() {
		_screen = _this.initClass(ScreenProjection, World.CAMERA)
	}

	function loop() {
		_screen.camera = Camera.instance().worldCamera;
		_pos.lerp(_screen.unproject(_center, 1), .1);
		if(_debug) _debug.position.copy(_pos)
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {
		_center.set(Stage.width / 2, Stage.height / 2)
	}
});
Class(function GameControllerKinect() {
	Inherit(this, Component);
	var _this = this;
	var _kinect, _last, _screen;
	var _hand = new Vector2;
	var _pos = new THREE.Vector3;
	this.hand = _hand;
	var Kinect2;
	(function() {
		_this.delayedCall(() => GameController.instance().pos.push(_pos), 10);
		if(Hardware.KINECT) init()
	}());

	function init() {
		Kinect2 = requireNative("kinect2");
		_kinect = new Kinect2;
		if(_kinect.open()) {
			_kinect.on("bodyFrame", bodyData);
			_kinect.openBodyReader()
		} else {
			throw "Could not connect to kinect!!!!!"
		}
		initScreen();
		Render.start(loop)
	}

	function isHand(type) {
		return type == Kinect2.JointType.handRight
	}

	function initScreen() {
		_screen = _this.initClass(ScreenProjection, World.CAMERA)
	}

	function loop() {
		_screen.camera = Camera.instance().worldCamera;
		_pos.lerp(_screen.unproject(_hand, _this.parent.distance), .1)
	}

	function bodyData(frame) {
		var total = 0;
		frame.bodies.forEach(function(body) {
			if(!body.tracked) return;
			for(let type in body.joints) {
				if(isHand(type)) {
					let data = body.joints[type];
					_hand.x = Utils.range(data.depthX, .3, .7, 0, Stage.width, true);
					_hand.y = Utils.range(data.depthY, .3, .7, 0, Stage.height, true)
				}
			}
		});
		_last = total
	}
});
Class(function GameControllerMouse() {
	Inherit(this, Component);
	var _this = this;
	var _screen, _debug;
	var _pos = new THREE.Vector3;
	(function() {
		_this.delayedCall(() => GameController.instance().pos.push(_pos), 10);
		initScreen();
		Render.start(loop)
	}());

	function initDebug() {
		_debug = Utils3D.createDebug(.05);
		World.SCENE.add(_debug)
	}

	function initScreen() {
		_screen = _this.initClass(ScreenProjection, World.CAMERA)
	}

	function loop() {
		_screen.camera = Camera.instance().worldCamera;
		_pos.copy(_screen.unproject(Mouse, _this.parent.distance));
		if(_debug) _debug.position.copy(_pos)
	}
});
Class(function GameControllerOculus() {
	Inherit(this, Component);
	var _this = this;
	var _screen, _debug;
	var _pos = new THREE.Vector3;
	var _center = new THREE.Vector2(Stage.width / 2, Stage.height / 2);
	(function() {
		_this.delayedCall(() => GameController.instance().pos.push(_pos), 10);
		initScreen();
		addListeners();
		Render.start(loop)
	}());

	function initDebug() {
		_debug = Utils3D.createDebug(.05);
		World.SCENE.add(_debug)
	}

	function initScreen() {
		_screen = _this.initClass(ScreenProjection, World.CAMERA)
	}

	function loop() {
		_screen.camera = World.CAMERA;
		_pos.copy(_screen.unproject(_center, 1));
		if(_debug) _debug.position.copy(_pos)
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {
		_center.set(Stage.width / 2, Stage.height / 2)
	}
});
Class(function GameControllerVive() {
	Inherit(this, Component);
	var _this = this;
	this.hands = [];
	(function() {
		defer(() => {
			_this.wait(initControllers, Hydra.JSON, "vive-controller")
		})
	}());

	function initControllers() {
		ViveControllers.addControls(Dispatch.find(WorldRenderer).controls);
		let geometry = Utils3D.loadBufferGeometry("vive-controller");
		let controllerShader = _this.initClass(Shader, "GameController");
		controllerShader.uniforms = {
			visibility: {
				type: "f",
				value: 1
			}
		};
		controllerShader.material.transparent = true;
		for(var i = 0; i < 2; i++) {
			let shader = controllerShader.clone();
			shader.set("visibility", 1);
			let mesh = new THREE.Mesh(geometry, shader.material);
			mesh.shader = shader;
			let controller = ViveControllers.addController(mesh);
			World.SCENE.add(controller.object);
			GameController.instance().pos.push(controller.object.position);
			_this.hands.push(controller)
		}
		World.CAMERA.position.head = true;
		GameController.instance().pos.push(World.CAMERA.position)
	}
	this.lockHand = function(index) {
		GameController.instance().pos.findAndRemove(_this.hands[index].object.position);
		GameController.instance().pos.unshift(_this.hands[index].object.position);
		_this.hands.forEach(hand => {
			hand.object.shader.tween("visibility", 0, 500, "easeOutSine", () => hand.object.visible = false)
		})
	}
});
Class(function Hardware() {
	Inherit(this, Component);
	var _this = this;
	this.ELECTRON = !!window.process;
	this.KINECT = this.ELECTRON && process.platform != "darwin";
	this.CARDBOARD = Hydra.HASH.strpos("cardboard");
	this.MOBILE_VR = this.CARDBOARD || Device.system.vr && Device.mobile;
	this.ROOMSCALE_VR = Device.system.vr && !Device.mobile;
	this.VR_TYPE = function() {
		if(Device.system.vr) {
			defer(() => {
				require("VRDetect").detect().then(hardware => {
					_this.VR_TYPE = hardware;
					_this.ADJUST_ROOMSCALE = !hardware.strpos("vive");
					if(Device.mobile) {
						_this.NATIVE_CARDBOARD = hardware.strpos("cardboard");
						_this.DAYDREAM = hardware.strpos("daydream");
						_this.GEAR = hardware.strpos(["samsung", "gear"])
					}
				})
			})
		} else {
			if(_this.MOBILE_VR) return "mobile vr"
		}
		return ""
	}();
	GPU.ready().then(() => {});
	this.vrControllers = function() {
		return this.detect("vive")
	};
	this.detect = function(type) {
		return _this.VR_TYPE.strpos(type)
	};
	this.detectVR = function() {
		return _this.VR_TYPE != ""
	};
	this.getThreadType = function() {
		return Hardware.EJECTA ? SimulatedThread : Thread
	};
	this.detectGamePad = function() {
		if(!navigator.getGamepads) return;
		return !!navigator.getGamepads()[0]
	}
}, "static");
Class(function KeyboardUtil() {
	Inherit(this, Component);
	var _this = this;
	_this.DOWN = "keyboard_down";
	_this.PRESS = "keyboard_press";
	_this.UP = "keyboard_up";
	(function() {
		Hydra.ready(addListeners)
	}());

	function addListeners() {
		__window.keydown(keydown);
		__window.keyup(keyup);
		__window.keypress(keypress)
	}

	function keydown(e) {
		_this.events.fire(_this.DOWN, e)
	}

	function keyup(e) {
		_this.events.fire(_this.UP, e)
	}

	function keypress(e) {
		_this.events.fire(_this.PRESS, e)
	}
}, "static");
Class(function Tests() {
	var _this = this;
	this.getDPR = function() {
		if(GPU.mobileLT(0) || GPU.lt(0)) return .75;
		if(GPU.mobileLT(1) || GPU.lt(1)) return 1;
		if(Device.mobile || GPU.lt(1)) return 1.2;
		if(GPU.OVERSIZED) return .8;
		return Math.max(1, Device.pixelRatio / 1.5)
	};
	this.stonesElementParticles = function() {
		if(GPU.mobileLT(2)) return 3;
		if(Device.mobile || GPU.lt(1)) return 4;
		return 10
	};
	this.renderShadows = function() {
		return false
	};
	this.renderVFX = function() {
		if(Hardware.IRIS) return true;
		if(Hardware.MOBILE_VR && (GPU.mobileLT(2) || Hardware.DAYDREAM)) return false;
		if(GPU.gt(2)) return true;
		if(GPU.mobileGT(3)) return true;
		return false
	};
	this.flameParticleCount = function() {
		if(!_this.useGPGPU()) return 500;
		if(GPU.mobileGT(3)) Math.pow(256, 2);
		if(Device.mobile || GPU.lt(1)) return Math.pow(128, 2);
		if(Hardware.detect(["vive", "oculus"])) return Math.pow(256, 2);
		return Math.pow(256, 2)
	};
	this.useGPGPU = function() {
		if(!GPU.detect("float")) return false;
		return true
	};
	this.vfxDOF = function() {
		if(Hardware.ROOMSCALE_VR || Hardware.CARDBOARD || Hardware.MOBILE_VR) return false;
		return true
	};
	this.vfxLight = function() {
		if(Hardware.MOBILE_VR) return true;
		return true
	};
	this.vfxSSR = function() {
		if(Hardware.detectVR()) return false;
		if(!_this.renderVFX()) return false;
		return true
	};
	this.hqBlur = function() {
		return GPU.gt(3)
	};
	this.gemRefraction = function() {
		if(!_this.renderVFX()) return false;
		if(Device.mobile && GPU.mobileLT(2)) return false;
		return true
	};
	this.dcParticleReduce = function() {
		if(Mobile.os == "Android" && GPU.mobileLT(2)) return .2;
		if(Device.mobile) return .5;
		return .75
	};
	this.lonelinessFogReduce = function() {
		if(GPU.lt(1) || GPU.mobileLT(2)) return .7;
		return 1
	};
	this.lonelinessParticlesReduce = function() {
		if(GPU.lt(1) || GPU.mobileLT(2)) return .5;
		if(Device.mobile) return .75;
		return 1
	};
	this.ninetyParticleCount = function() {
		if(Device.mobile) return 128;
		if(GPU.lt(2)) return 256;
		return 512
	};
	this.reconnectionParticleCount = function() {
		if(GPU.mobileGT(3)) Math.pow(256, 2);
		if(Device.mobile) return Math.pow(128, 2);
		if(Hardware.ROOMSCALE_VR) return Math.pow(512, 2);
		return Math.pow(256, 2)
	};
	this.reconnectionAlpha = function() {
		return 1
	};
	this.foreverParticleReduce = function() {
		if(Mobile.os == "Android" && GPU.mobileLT(2)) return .3;
		if(GPU.mobileLT(1)) return .35;
		if(Device.mobile) return .75;
		return 1
	};
	this.foreverAmbienceReduce = function() {
		if(Mobile.os == "Android" && GPU.mobileLT(2)) return .4;
		if(Device.mobile) return .75;
		return 1
	};
	this.foreverBlending = function() {
		if(GPU.gt(2) || GPU.mobileGT(3)) return true;
		return false
	};
	this.simpleVertexTransition = function() {
		if(Mobile.os == "Android" && GPU.mobileLT(2)) return true;
		return false
	};
	this.socialBrowser = function() {
		if(Hydra.HASH.strpos("socialBrowser")) return true;
		if(!Device.mobile) return false;
		return Mobile.browser == "Social" && Mobile.os == "iOS"
	};
	this.renderFog = function() {
		if(_this.renderVFX()) return true;
		return false
	}
}, "static");
Class(function Data() {
	Inherit(this, Model);
	Inherit(this, PushState);
	var _this = this;
	(function() {
		document.title = "Emmit Fenn";
		addListeners()
	}());

	function addListeners() {
		_this.dispatcher.events.add(HydraEvents.UPDATE, stateChange)
	}

	function stateChange(e) {
		var page = _this.convertPerma(e.value)
	}
	this.setState = function(page, title) {
		GATracker.trackPage(page);
		if(title) document.title = "Emmit Fenn: " + title;
		else document.title = "Emmit Fenn";
		this._setState(page)
	};
	this.getState = function() {
		var hash = _this.dispatcher.getState();
		var name = hash.split("/")[0].split("-").join(" ");
		if(name == "eclipse") Global.LOAD_ECLIPSE = true;
		console.log(name);
		var data = null;
		for(var i = 0; i < Config.TRACKS.length; i++) {
			if(Config.TRACKS[i].name.toLowerCase() == name) data = Config.TRACKS[i]
		}
		if(!data) _this._setState("");
		return data
	}
}, "Static");
Data.Class(function Player() {
	Inherit(this, Model);
	var _this = this;
	var _audio, _video, _media, $debug, $progress;
	var _src;
	var _volume = new DynamicObject({
		a: 1
	});
	var _beats, _times = [],
		_bpm;
	(function() {}());

	function init() {
		initAudio();
		addListeners();
		Render.start(loop)
	}

	function initAudio() {
		_audio = _audio != null ? _audio : new Audio;
		_audio = new Audio;
		_audio.controls = false;
		_media = _audio;
		_video = _this.initClass(Video, {
			src: "",
			width: 256,
			height: 256
		});
		_video.object.setZ(999).bg("#222").transformPoint("10%", "10%").transform({
			scale: .4,
			y: 30
		});
		_this.video = _video;
		_video.div.setAttribute("crossorigin", "anonymous");
		if(Hydra.LOCAL && Hydra.HASH.strpos("playground")) {
			Stage.add(_video);
			$debug = Stage.create(".debug");
			$debug.fontStyle("Courier", 18, "#fff");
			$debug.css({
				top: 15,
				left: 15,
				letterSpacing: 2
			}).setZ(10).hide();
			$debug.html("0.00")
		}
		$progress = Stage.create(".progress");
		$progress.size("100%", Mobile.phone ? 4 : 2).bg("#fff").css({
			bottom: 0
		}).setZ(1e3).transformPoint("0%", "50%").transform({
			scaleX: 0
		}).invisible();
		Global.PROGRESS_BAR = $progress
	}

	function addListeners() {
		_audio.addEventListener("play", playing);
		_audio.addEventListener("pause", paused);
		_audio.addEventListener("timeupdate", update);
		_audio.addEventListener("ended", ended);
		_video.div.addEventListener("play", playing);
		_video.div.addEventListener("pause", paused);
		_video.div.addEventListener("timeupdate", update);
		_video.div.addEventListener("ended", ended);
		if(Hydra.LOCAL) _this.events.subscribe(KeyboardUtil.DOWN, keyPress);
		_this.events.subscribe(HydraEvents.BROWSER_FOCUS, focus);
		if(Device.mobile) {
			Stage.bind("touchend", () => {
				if(Global.IN_SCENE) _media.play()
			})
		}
	}

	function focus(e) {
		if(!Global.IN_SCENE) return;
		switch(e.type) {
			case "focus":
				if(_media && _media.play) _media.play();
				break;
			case "blur":
				if(_media && _media.pause) _media.pause();
				break
		}
	}

	function keyPress(e) {
		if(!_media.src) return;
		if(e.keyCode == 39) _media.currentTime += 5;
		if(e.keyCode == 37) _media.currentTime -= 5;
		if(e.keyCode == 32) {
			_times.push(Number(_this.time.toFixed(3)));
			console.log(_times)
		}
		if(e.keyCode == 27) ended()
	}

	function playing() {
		if(FX && FX.Light && FX.Light.instance) FX.Light.instance().animateIn();
		_this.playing = true;
		_this.events.fire(EmmitEvents.PLAY_PAUSE, {
			playing: _this.playing
		})
	}

	function paused() {
		_this.playing = false;
		_this.events.fire(EmmitEvents.PLAY_PAUSE, {
			playing: _this.playing
		})
	}

	function update() {
		_this.duration = _media.duration;
		_this.elapsed = _media.currentTime / _this.duration;
		_this.last = Render.TIME
	}

	function loop(t) {
		if(!_this.playing || !_this.current) return;
		_this.time = _media.currentTime;
		if(_beats) {
			for(var i in _beats) {
				var type = _beats[i];
				for(var j = _beats.passed[i] + 1; j < type.length; j++) {
					if(type[j] < _this.time) {
						_beats.passed[i] = j;
						_this.events.fire(EmmitEvents.BEAT_HIT, {
							type: i,
							time: type[j],
							count: j
						});
						break
					}
				}
			}
		}
		$progress.scaleX = _this.time / _this.current.duration;
		$progress.transform();
		if($debug && _this.time) $debug.html(_this.time.toFixed(2).toString())
	}

	function ended() {
		_this.pause();
		_this.playing = false;
		_audio.src = null;
		$progress.invisible();
		_this.events.fire(EmmitEvents.TRACK_COMPLETE)
	}

	function changeSong(type) {
		var current = require(type);
		_this.current = current;
		if(_media.src) _media.pause();
		_media.currentTime = 0;
		_media = current.video && !Tests.socialBrowser() ? _video.div : _audio;
		_src = Config.CDN + current.track;
		_src += current.video && !Tests.socialBrowser() ? "." + Device.media.video : ".mp3";
		_bpm = current.bpm || null;
		_beats = current.beats || null;
		_beats.beat = [];
		_this.time = 0;
		var time = 0;
		while(time < 300) {
			_beats.beat.push(time.toFixed(3));
			time += 60 / _bpm
		}
		if(_beats) {
			_beats.passed = {};
			for(var i in _beats) _beats.passed[i] = -1
		}
		if(current.video) _video.object.show();
		else _video.object.hide();
		$progress.scaleX = _this.time / _audio.duration;
		$progress.bg(Global.TRACK_COLOR);
		$progress.transform();
		_volume.a = 0;
		updateSound();
		if(Device.mobile) start();
		else _this.delayedCall(start, 1e3);

		function start() {
			if(current.light_uniforms) FX.Light.instance().setUniforms(current.light_uniforms);
			Render.resetTSL();
			_media.src = _src;
			_media.play();
			$progress.visible();
			_volume.a = 0;
			_volume.tween({
				a: 1
			}, 3e3, "easeInOutSine", 200, updateSound)
		}
	}

	function updateSound() {
		let volume = Device.browser.chrome && !Device.mobile ? _volume.a : 1;
		if(Hydra.HASH.strpos("mute")) volume = 0;
		_media.volume = volume
	}
	this.init = init;
	this.change = changeSong;
	this.pause = function() {
		if(!_media.src) return;
		_volume.tween({
			a: 0
		}, 500, "easeOutSine", updateSound, function() {
			_media.pause()
		})
	};
	this.play = function() {
		if(!_media.src) return;
		_media.play();
		_volume.a = 0;
		updateSound();
		_volume.tween({
			a: 1
		}, 500, "easeOutSine", updateSound)
	}
});
Data.Class(function Preview() {
	Inherit(this, Model);
	var _this = this;
	var _audio;
	var _volume = new DynamicObject({
		a: 1
	});
	(function() {
		Hydra.ready(function() {
			initAudio()
		})
	}());

	function initAudio() {
		_audio = _audio != null ? _audio : new Audio;
		_audio = new Audio;
		_audio.crossOrigin = "anonymous";
		_audio.controls = false
	}

	function updateSound() {
		let volume = Device.browser.chrome && !Device.mobile ? _volume.a : 1;
		if(Hydra.HASH.strpos("mute")) volume = 0;
		_audio.volume = volume
	}
	this.stop = function() {
		_this.playing = false;
		_volume.tween({
			a: 0
		}, 500, "easeOutSine", updateSound, function() {
			_audio.pause()
		})
	};
	this.play = function(e) {
		if(_this.data == e) return;
		_this.data = e;
		if(!e.preview) {
			_volume.tween({
				a: 0
			}, 300, "easeOutSine", updateSound);
			return
		}
		if(_this.playing && _volume.a > 0) _volume.tween({
			a: 0
		}, 200, "easeOutSine", updateSound, newSong);
		else newSong();

		function newSong() {
			_audio.pause();
			_audio.src = "assets/audio/previews/" + e.preview + ".mp3";
			_audio.currentTime = 0;
			_this.playing = true;
			_audio.play();
			_volume.a = 0;
			updateSound();
			_volume.tween({
				a: 1
			}, 4e3, "easeInOutSine", updateSound)
		}
		defer(function() {})
	}
});
Class(function Container() {
	Inherit(this, Controller);
	var _this = this;
	var $container;
	var _ui, _scene;
	(function() {
		initContainer();
		initControllers();
		addListeners()
	}());

	function initContainer() {
		$container = _this.container;
		$container.size("100%");
		Stage.addChild($container);
		Global.CONTAINER = $container
	}

	function initControllers() {
		_ui = _this.initClass(UI);
		_ui.events.add(HydraEvents.COMPLETE, hideUI);
		_ui.events.add(HydraEvents.CLICK, initTrack);
		_ui.events.add(HydraEvents.COMPLETE, initScene)
	}

	function hideUI() {
		_ui.container.hide()
	}

	function initTrack(e) {
		Global.UI_COLOR = e.color || "#ddd";
		Global.TRACK_COLOR = e.color || "#ccc";
		Global.IN_SCENE = true;
		Global.HUE = e.hue ? Utils.range(e.hue, 0, 360, 0, 1) : 0;
		Data.Player.change(e.id + "Config")
	}

	function initScene(e) {
		_scene = _this.initClass(Scene, e.id);
		hash = e.name.split(" ").join("-").toLowerCase();
		Data.setState(hash, e.name)
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.TRACK_COMPLETE, complete)
	}

	function complete() {
		_scene.animateOut(function() {
			Data.setState("");
			Global.IN_SCENE = false;
			Global.TRACK_COLOR = "#888";
			Global.UI_COLOR = "#888";
			Global.HUE = 0;
			Global.PROGRESS_BAR.invisible();
			_ui.container.show();
			_ui.reset()
		})
	}
}, "Singleton");
Class(function About() {
	Inherit(this, Controller);
	var _this = this;
	var $this, $bg;
	var _view, _liquid;
	(function() {
		initHTML();
		initView();
		addListeners()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size("100%").hide().setZ(1e5);
		Stage.add($this);
		$bg = $this.create(".bg");
		$bg.size("100%").bg().setZ(1)
	}

	function initView() {
		_liquid = _this.initClass(LiquidFluid);
		_view = _this.initClass(AboutView)
	}

	function addListeners() {
		$bg.interact(null, close);
		$bg.hit.mouseEnabled(true)
	}

	function close() {
		_this.animateOut()
	}
	this.animateIn = function() {
		Data.Preview.stop();
		$this.show().clearAlpha();
		Global.CONTAINER.tween({
			scale: .94,
			y: 0
		}, 1e3, "easeOutCubic");
		Global.IN_ABOUT = true;
		_this.delayedCall(function() {
			Global.CONTAINER.div.className = "blur"
		}, 500);
		defer(_view.animateIn);
		_liquid.animateIn();
		_liquid.element.css({
			opacity: 0
		}).tween({
			opacity: Global.IN_SCENE ? .6 : .9
		}, 500, "easeInOutSine")
	};
	this.animateOut = function() {
		Global.IN_ABOUT = false;
		Global.CONTAINER.div.className = "";
		Global.CONTAINER.tween({
			scale: 1,
			y: 0
		}, 500, "easeOutCubic");
		_view.animateOut();
		_liquid.animateOut();
		$this.tween({
			opacity: 0
		}, 500, "easeOutSine", function() {
			$this.hide()
		})
	}
}, "Singleton");
Class(function Camera() {
	Inherit(this, Component);
	var _this = this;
	var _debug, _lockCamera, _transition, _timer;
	var _lerp = new DynamicObject({
		v: .02
	});
	var _camera = this.worldCamera = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, .05, 1e3);
	var _origin = new THREE.Group;
	var _target = new THREE.Group;
	this.manual = false;
	(function() {
		if(Hardware.ROOMSCALE_VR) return;
		addListeners();
		if(Global.PLAYGROUND) initPlayground();
		Render.start(loop)
	}());

	function initPlayground() {
		if(Hydra.HASH.strpos("debug")) {
			let white = new THREE.MeshBasicMaterial({
				color: 16777215
			});
			let red = new THREE.MeshBasicMaterial({
				color: 1671168e1
			});
			let materials = [white, white, white, white, white, red];
			_debug = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .1), new THREE.MeshFaceMaterial(materials));
			World.SCENE.add(_debug)
		}
		if(Global.UIL) {
			var check = new UILItem("World Cam", false, function(b) {
				Playground.instance().setCamera(b ? _camera : null)
			});
			Global.UIL.add("bool", check.obj)
		}
	}

	function loop() {
		if(_this.manual) return;
		if(_debug) {
			_debug.position.copy(_camera.position);
			_debug.quaternion.copy(_camera.quaternion)
		}
		if(_lockCamera && !_transition) {
			_target.quaternion.copy(_lockCamera.quaternion);
			_target.position.copy(_lockCamera.position)
		}
		_camera.quaternion.slerp(_target.quaternion, _lerp.v);
		_camera.position.lerp(_target.position, _lerp.v)
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {
		_camera.aspect = Stage.width / Stage.height;
		_camera.updateProjectionMatrix()
	}
	this.setCamera = function(camera) {
		if(Hardware.ROOMSCALE_VR || _this.manual) return;
		if(camera.updateMatrix) camera.updateMatrix();
		if(camera.renderCamera) camera = camera.renderCamera;
		clearTimeout(_timer);
		_camera.fov = camera.fov;
		_camera.updateProjectionMatrix();
		_camera.quaternion.copy(camera.quaternion);
		_camera.position.copy(camera.position);
		_target.quaternion.copy(camera.quaternion);
		_target.position.copy(camera.position);
		_lockCamera = camera;
		_lerp.v = .08
	};
	this.transition = function(camera, time, ease, delay, callback) {
		if(Hardware.ROOMSCALE_VR || _this.manual) return;
		if(camera.renderCamera) camera = camera.renderCamera;
		if(typeof delay == "function") {
			callback = delay;
			delay = 0
		}
		clearTimeout(_timer);
		_timer = _this.delayedCall(function() {
			_transition = true;
			_origin.quaternion.copy(_camera.quaternion);
			_origin.position.copy(_camera.position);
			_lerp.v = .02;
			var p1 = (new Vector3).copy(_origin.position).lerp(camera.position, .5);
			p1.addAngleRadius(Utils.toRadians(Utils.doRandom(0, 360)), -.2);
			var d = new DynamicObject({
				v: 0
			});
			TweenManager.tween(_camera, {
				fov: camera.fov
			}, time, "easeInOutCubic");
			d.tween({
				v: 1
			}, time, ease, 0, function() {
				_lockCamera = camera;
				_target.quaternion.copy(_origin.quaternion).slerp(camera.quaternion, d.v);
				var curve = new THREE.QuadraticBezierCurve3(_origin.position, p1, camera.position);
				_target.position.copy(curve.getPoint(d.v));
				_camera.fov = TweenManager.interpolateValues(_camera.fov, camera.fov, d.v, ease);
				_camera.updateProjectionMatrix()
			}, function() {
				callback && callback();
				_transition = false;
				_lerp.tween({
					v: .08
				}, 25e2, "easeInOutSine")
			})
		}, delay || 0)
	};
	this.lockOnCamera = function(camera) {
		if(Hardware.ROOMSCALE_VR || _this.manual) return;
		if(_camera.fov != _camera.fov) {
			TweenManager.tween(_camera, {
				fov: camera.fov
			}, 1e3, "easeInOutCubic")
		}
		_lockCamera = camera
	};
	this.transitionLerp = function(v, time, ease, delay) {
		_lerp.tween({
			v
		}, time, ease, delay)
	}
}, "singleton");
Class(function SceneCamera() {
	Inherit(this, Component);
	var _this = this;
	var _world = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, .1, 1e3);
	var _local = new THREE.Group;
	var _accel = Mobile.Accelerometer;
	var _target = new Vector3;
	var _pos = new Vector3;
	var _last = new Vector2;
	var _vel = new Vector2;
	const INPUT = Device.mobile ? Mobile.Accelerometer : Mouse;
	this.root = new THREE.Group;
	this.renderCamera = _world;
	this.movement = .2;
	this.world = _world;
	(function() {
		_accel.capture();
		_this.root.add(_local);
		_this.startRender(loop)
	}());

	function loop() {
		_vel.subVectors(INPUT, _last);
		var x = Utils.range(INPUT.x, 0, Stage.width, -1, 1);
		var y = Utils.range(INPUT.y, 0, Stage.height, -1, 1);
		if(Device.mobile) {
			var x = Utils.range(INPUT.x, -5, 5, -1, 1);
			var y = Utils.range(INPUT.y, -5, 5, -1, 1)
		}
		_target.x = -x * _this.movement;
		_target.y = -y * _this.movement * .3;
		_target.z = -1;
		_last.copy(INPUT);
		_pos.interp(_target, .3, "easeOutQuart");
		_pos.copyTo(_local.position);
		_local.lookAt(new THREE.Vector3(0, 0, -3));
		_this.root.updateMatrixWorld();
		Utils3D.decompose(_local, _world)
	}
	this.set("fov", function(v) {
		_world.fov = v
	});
	this.updateMatrix = function() {
		loop()
	}
});
Class(function Embed() {
	Inherit(this, Controller);
	var _this = this;
	var $this, $bg;
	var _view, _liquid;
	(function() {
		initHTML();
		initView();
		addListeners()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size("100%").hide().setZ(1e5);
		Stage.add($this);
		$bg = $this.create(".bg");
		$bg.size("100%").bg().setZ(1)
	}

	function initView() {
		_liquid = _this.initClass(LiquidFluid);
		_view = _this.initClass(EmbedView)
	}

	function addListeners() {
		$bg.interact(null, close);
		$bg.hit.mouseEnabled(true)
	}

	function close() {
		_this.animateOut()
	}
	this.animateIn = function(id) {
		Data.Preview.stop();
		$this.show().clearAlpha();
		Global.CONTAINER.tween({
			scale: .94,
			y: 0
		}, 1e3, "easeOutCubic");
		Global.IN_EMBED = true;
		_this.delayedCall(function() {
			Global.CONTAINER.div.className = "blur"
		}, 500);
		_view.animateIn(id);
		_liquid.animateIn();
		_liquid.element.css({
			opacity: 0
		}).tween({
			opacity: Global.IN_SCENE ? .6 : .9
		}, 500, "easeInOutSine")
	};
	this.animateOut = function() {
		Global.IN_EMBED = false;
		Global.CONTAINER.div.className = "";
		Global.CONTAINER.tween({
			scale: 1,
			y: 0
		}, 500, "easeOutCubic");
		_view.animateOut();
		_liquid.animateOut();
		$this.tween({
			opacity: 0
		}, 500, "easeOutSine", function() {
			$this.hide()
		})
	}
}, "Singleton");
Class(function GameController() {
	Inherit(this, Component);
	var _this = this;
	var _tick = 0;
	var _screen = new ScreenProjection;
	this.pos = [];
	this.distance = 1;
	(function() {
		initControls();
		Render.start(emitPosition)
	}());

	function initControls() {
		if(Hardware.ROOMSCALE_VR) {
			if(Hardware.VR_TYPE.strpos("vive") || Hardware.detectGamePad()) {
				_this.handControls = true;
				_this.control = _this.initClass(GameControllerVive)
			} else {
				_this.control = _this.initClass(GameControllerOculus)
			}
		} else {
			if(Hardware.KINECT) _this.control = _this.initClass(GameControllerKinect);
			else if(Hardware.CARDBOARD) _this.control = _this.initClass(GameControllerCardboard);
			else _this.control = _this.initClass(GameControllerMouse)
		}
	}

	function emitPosition(t) {
		if(_tick++ % 10) return;
		let camera = Hardware.ROOMSCALE_VR ? World.CAMERA : Camera.instance().worldCamera;
		let pos = _this.pos[0];
		if(!pos) return;
		_screen.camera = World.CAMERA;
		let pos2d = _screen.project(pos, Stage);
		pos2d.x /= Stage.width;
		pos2d.y /= Stage.height
	}
}, "singleton");
Class(function Input() {
	Inherit(this, Component);
	var _this = this;
	this.pos = new Vector3;
	this.upload = {
		pos: _this.pos
	};
	this.rotate = 0;
	(function() {
		initControls()
	}());

	function initControls() {
		_this.controls = _this.initClass(InputMouse, _this.pos)
	}
}, "singleton");
Class(function Loader() {
	Inherit(this, Controller);
	var _this = this;
	var _loader, $bar;
	(function() {
		initView();
		initLoader()
	}());

	function initView() {
		Stage.add(_this.element);
		_this.element.size("100%").setZ(9999);
		$bar = _this.element.create(".bar");
		$bar.size(120, 2).center();
		$bar.css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 200, "easeOutSine");
		$bar.inner = $bar.create(".inner");
		$bar.inner.size("100%").bg("#333").transformPoint("50%", "50%").transform({
			scaleX: 1
		})
	}

	function initLoader() {
		let assets = AssetUtil.getAssets(["shaders", "lib", "images", "geometry"]);
		_loader = _this.initClass(AssetLoader, assets);
		_loader.events.add(HydraEvents.COMPLETE, loadComplete);
		_loader.events.add(HydraEvents.PROGRESS, loadProgress);
		Promise.all([AssetLoader.waitForLib("THREE"), Shaders.onReady(), GPU.ready()]).then(prerender).then(_loader.trigger)
	}

	function prerender() {
		About.instance();
		World.instance();
		FX.Light.instance();
		return Promise.resolve()
	}

	function loadComplete() {
		_this.loaded = true;
		_this.delayedCall(function() {
			World.instance().reset();
			_this.events.fire(HydraEvents.COMPLETE)
		}, 200)
	}

	function loadProgress(e) {
		if(_this.loaded) return;
		$bar.inner.tween({
			scaleX: 1 - e.percent
		}, 200, "easeInOutSine")
	}
});
Class(function Playground() {
	Inherit(this, Controller);
	var _this = this;
	var $container;
	var _view, _camera, _controls;
	(function() {
		Global.PLAYGROUND = true;
		initContainer();
		initThree();
		initView()
	}());

	function initContainer() {
		$container = _this.container;
		$container.size("100%");
		Stage.add($container)
	}

	function initThree() {
		World.instance();
		Stage.add(World.ELEMENT);
		_camera = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, .1, 1e3);
		World.instance().setCamera(_camera);
		if(!Hardware.ROOMSCALE_VR) {
			_controls = new THREE.OrbitControls(_camera);
			_controls.enabled = false;
			Render.start(_controls.update);
			if(Hydra.HASH.strpos(["debug", "orbit"])) {
				_camera.position.z = 5;
				_this.delayedCall(() => {
					_controls.enabled = true;
					World.instance().setCamera(_camera)
				}, 50)
			}
		}
	}

	function initView() {
		var hash = Hydra.HASH.split("/")[1].split("?")[0];
		var view = "Playground" + hash;
		if(!hash) throw "No view for Playground found on Hash";
		if(!window[view]) view = hash;
		if(!window[view]) throw "No Playground class " + view + " found.";
		let config = Hydra.HASH.split("/")[1] + "Config";
		let conf = require("NinetyConfig");
		try {
			if(conf) Data.Player.change(config)
		} catch(e) {}
		_view = _this.initClass(window[view], World.instance().camera);
		var object = _view.group || _view.mesh || _view.object3D;
		if(object) World.SCENE.add(object)
	}
	this.resetCamera = function() {
		World.instance().setCamera(_camera)
	}
}, "singleton");
Class(function Scene(_type) {
	Inherit(this, Controller);
	var _this = this;
	var $container;
	var _view, _camera, _controls;
	(function() {
		Global.PLAYGROUND = true;
		initContainer();
		initThree();
		if(!_type) {
			_type = Hydra.HASH;
			initAudio()
		}
		initView()
	}());

	function initContainer() {
		$container = _this.container;
		$container.size("100%");
		$container.css({
			opacity: 0
		})
	}

	function initThree() {
		World.instance().startRender();
		$container.add(World.ELEMENT);
		_camera = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, .1, 1e3);
		World.instance().setCamera(_camera);
		_controls = new THREE.OrbitControls(_camera);
		_controls.enabled = false;
		Render.start(_controls.update);
		if(Hydra.HASH.strpos(["debug", "orbit"])) {
			_camera.position.z = 5;
			_this.delayedCall(() => {
				_controls.enabled = true;
				World.instance().setCamera(_camera)
			}, 50)
		}
	}

	function initAudio() {
		Data.Player.change(_type + "Config")
	}

	function initView() {
		_view = _this.initClass(window[_type], World.instance().camera);
		World.SCENE.add(_view.group || _view.mesh || _view.object3D);
		$container.css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 1e4, "easeOutSine", 500)
	}
	this.resetCamera = function() {
		World.instance().setCamera(_camera)
	};
	this.animateOut = function(callback) {
		$container.tween({
			opacity: 0
		}, 700, "easeInSine", () => {
			$container.empty();
			World.instance().reset();
			$container.add(World.ELEMENT);
			_this.destroy();
			if(callback) callback()
		})
	};
	this.onDestroy = function() {
		Render.stop(_controls.update);
		World.SCENE.remove(_view.group || _view.mesh || _view.object3D)
	}
});
Class(function SceneBase() {
	Inherit(this, Component);
	var _this = this;
	this.group = new THREE.Group;
	this.animateIn = function() {};
	this.animateOut = function() {};
	this.prerender = function() {
		let promise = Promise.create();
		_this.group.visible = true;
		let render = () => {
			setTimeout(() => {
				_this.group.visible = false;
				promise && promise.resolve && promise.resolve()
			}, 20)
		};
		if(this.onPrerender) {
			promise = this.onPrerender();
			promise.then(render)
		} else {
			render()
		}
		return promise
	}
});
Class(function Blinded() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera, _particles;
	var _wrapper = new THREE.Group;
	var _config = require("BlindedConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		_this.startRender(loop);
		addListeners();
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(BlindedElements);
		_this.group.add(_elements.group);
		Global.GROUP = _elements.group;
		_particles = _this.initClass(BlindedParticles);
		_this.group.add(_particles.group);
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180);
		if(Global.PLAYGROUND || !Hardware.detectVR()) Background.instance().setColor(require("BlindedConfig").background)
	}

	function loop() {}

	function addListeners() {}

	function start() {
		TweenManager.tween(_camera.root.position, {
			z: 20
		}, 3e3, "easeInOutCubic")
	}

	function end() {
		TweenManager.tween(_camera.root.position, {
			z: Mobile.phone ? 5 : 0
		}, 3e3, "easeInOutCubic")
	}
	this.animateIn = function() {
		_this.group.visible = true
	};
	this.onDestroy = function() {
		Stage.unbind("touchstart", start);
		Stage.unbind("touchend", end)
	}
});
Class(function Drive() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera;
	var _wrapper = new THREE.Group;
	var _config = require("DriveConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(DriveBall);
		_this.group.add(_elements.group);
		Global.GROUP = _elements.group;
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180)
	}

	function loop() {}
	this.animateIn = function() {
		_this.group.visible = true
	}
});
Class(function Eclipse() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera;
	var _wrapper = new THREE.Group;
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(EclipseElements);
		_this.group.add(_elements.group)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180)
	}

	function loop() {}
	this.animateIn = function() {
		_this.group.visible = true;
		if(FX && FX.Light && FX.Light.instance) FX.Light.instance().animateIn()
	};
	this.onDestroy = function() {}
});
Class(function Everybody() {
	Inherit(this, SceneBase);
	var _this = this;
	var _element1, _element2, _camera, _interaction;
	var _wrapper = new THREE.Group;
	var _mouse = new Vector2;
	var _rotation = new Vector2;
	var _rotationOrigin = new Vector2;
	var _move = new Vector2;
	var _origin = new Vector2;
	var _config = require("EverybodyConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		addListeners();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_element1 = _this.initClass(EverybodyElement, 1);
		_wrapper.add(_element1.group);
		_element2 = _this.initClass(EverybodyElement, 2);
		_wrapper.add(_element2.group);
		_this.group.add(_wrapper);
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_this.group.add(_wrapper);
		World.CAMERA.position.z = 3;
		World.CAMERA.lookAt(new THREE.Vector3)
	}

	function loop() {
		if(Device.mobile) {
			_mouse.lerp(Mobile.Accelerometer, .1);
			let rotation = 3;
			_wrapper.position.x = Utils.range(_mouse.x, -6, 6, rotation, -rotation, true)
		} else {
			_mouse.lerp(Mouse, .03);
			let rotation = 3;
			_wrapper.position.x = Utils.range(_mouse.x, 0, Stage.width, rotation, -rotation);
			_wrapper.position.y = Utils.range(_mouse.y, 0, Stage.height, rotation * .5, -rotation * .5)
		}
	}

	function addListeners() {
		_interaction = _this.initClass(Interaction.Input, Stage);
		_interaction.onStart = start;
		_interaction.onUpdate = update;
		_interaction.onEnd = end
	}

	function start(e) {
		_this.delta = null;
		_origin.copy(e);
		_rotationOrigin.copy(_rotation)
	}

	function update(e) {
		let val = Device.mobile ? .02 : .005;
		_rotation.y = _rotationOrigin.y - (_origin.x - e.x) * val * .5;
		_this.delta = e.delta
	}

	function end(e) {
		if(_this.delta) _rotation.y += _this.delta.x * .0006
	}
	this.animateIn = function() {
		_this.group.visible = true;
		_element1.animateIn();
		_element2.animateIn()
	}
});
Class(function Flame() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera, _particles, _interaction;
	var _wrapper = new THREE.Group;
	var _objects = new THREE.Group;
	var _mouse = new Vector2;
	var _rotation = new Vector2;
	var _rotationOrigin = new Vector2;
	var _move = new Vector2;
	var _origin = new Vector2;
	var _config = require("FlameConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		addListeners();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_this.group.add(_objects);
		_objects.position.z = -2.3;
		_objects.position.y = .52;
		_this.group.rotation.x = Utils.toRadians(-10);
		_particles = _this.initClass(FlameParticles);
		_particles.group.position.y = -.68;
		_particles.group.rotation.x = Utils.toRadians(170);
		_objects.add(_particles.group);
		_elements = _this.initClass(FlameFire);
		_elements.group.position.y = -.3;
		let s = .7;
		_elements.group.scale.set(s, s, s);
		_objects.add(_elements.group);
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180)
	}

	function loop() {
		_mouse.lerp(Mouse, .03);
		let x = Utils.range(_mouse.x, 0, Stage.width, -1, 1);
		let y = Utils.range(_mouse.y, 0, Stage.height, -1, 1);
		let rotation = Utils.toRadians(150);
		_this.group.position.x = x * .1;
		_objects.rotation.y = Utils.range(_mouse.x, 0, Stage.width, -rotation, rotation);
		_move.lerp(_rotation, .07);
		_elements.group.rotation.y = _move.y;
		_particles.group.rotation.y = rotation * x * 1.8
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit);
		_interaction = _this.initClass(Interaction.Input, Stage);
		_interaction.onStart = start;
		_interaction.onUpdate = update;
		_interaction.onEnd = end
	}

	function start(e) {
		_this.delta = null;
		_origin.copy(e);
		_rotationOrigin.copy(_rotation)
	}

	function update(e) {
		let val = Device.mobile ? .02 : .005;
		_rotation.y = _rotationOrigin.y - (_origin.x - e.x) * val;
		_this.delta = e.delta
	}

	function end(e) {
		if(_this.delta) _rotation.y += _this.delta.x * .0006
	}

	function beatHit(e) {
		switch(e.type) {
			case "bigHit":
				_particles.group.scale.set(1.5, 1.5, 1.5);
				TweenManager.tween(_particles.group.scale, {
					x: 1,
					y: 1,
					z: 1
				}, 2e3, "easeInOutSine");
				_elements.group.scale.set(1.4, 1, 1.4);
				TweenManager.tween(_elements.group.scale, {
					x: .7,
					y: .7,
					z: .7
				}, 2e3, "easeInOutSine");
				_elements.group.position.y = -.1;
				TweenManager.tween(_elements.group.position, {
					y: -.3
				}, 2e3, "easeInOutSine");
				break;
			case "flameStart":
				TweenManager.tween(_particles.group.position, {
					y: -.58
				}, 6e4, "easeInOutSIne");
				break;
			case "flameIn":
				TweenManager.tween(_particles.group.position, {
					y: -.4
				}, 500, "easeOutSine");
				break;
			case "flameOut":
				TweenManager.tween(_particles.group.position, {
					y: -.58
				}, 5e4, "easeOutSine");
				break
		}
	}
	this.animateIn = function() {
		_this.group.visible = true
	}
});
Class(function Ninety() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera;
	var _wrapper = new THREE.Group;
	var _config = require("NinetyConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(NinetyParticles);
		World.CAMERA.position.z += 7;
		_this.group.add(_elements.group);
		Global.GROUP = _elements.group;
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180)
	}

	function loop() {}
	this.animateIn = function() {
		_this.group.visible = true
	}
});
Class(function Oceans() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _waves, _camera;
	var _wrapper = new THREE.Group;
	var _mouse = new Vector2;
	var _config = require("OceansConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_waves = _this.initClass(OceansWater);
		_this.group.add(_waves.group);
		Global.GROUP = _waves.group;
		_elements = _this.initClass(PaintingElements, true);
		_this.group.add(_elements.group);
		Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180)
	}

	function loop() {
		_mouse.lerp(Mouse, .03);
		let x = Utils.range(_mouse.x, 0, Stage.width, -1, 1);
		let y = Utils.range(_mouse.y, 0, Stage.height, -1, 1);
		_this.group.position.x = -x;
		_this.group.position.y = y * .3;
		_this.group.rotation.y = x * .1
	}
	this.animateIn = function() {
		_this.group.visible = true
	}
});
Class(function Painting() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera, _particles, _tunnel;
	var _wrapper = new THREE.Group;
	var _config = require("PaintingConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(PaintingElements);
		_this.group.add(_elements.group);
		_tunnel = _this.initClass(PaintingTunnel);
		_this.group.add(_tunnel.group);
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180)
	}

	function loop() {}
	this.animateIn = function() {
		_this.group.visible = true
	};
	this.onDestroy = function() {}
});
Class(function Stones() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera, _terrain;
	var _wrapper = new THREE.Group;
	var _config = require("StonesConfig");
	(function() {
		Global.STONES_LIGHT = Stones.LIGHT = new THREE.Vector3(0, 1, 0);
		initViews();
		initCamera();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(StonesElements);
		_this.group.add(_elements.group);
		Global.GROUP = _elements.group
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		World.CAMERA.position.z = 1.5;
		World.CAMERA.position.y = -1;
		Background.instance().setColor(require("StonesConfig").background)
	}

	function loop() {}
	this.animateIn = function() {
		_this.group.visible = true;
		defer(_elements.animateIn);
		_this.delayedCall(() => Background.instance().transition(require("StonesConfig").background), 1e3)
	};
	this.animateOut = function() {};
	this.onPrerender = function() {
		return _elements.prerender()
	}
});
Class(function Wantit() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera;
	var _wrapper = new THREE.Group;
	var _config = require("WantitConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(WantitBall);
		_this.group.add(_elements.group);
		Global.GROUP = _elements.group;
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.movementX = 0;
		_wrapper.add(_camera.root);
		_this.group.add(_wrapper);
		Camera.instance().setCamera(_camera);
		_camera.root.rotation.y = Utils.toRadians(180)
	}

	function loop() {}
	this.animateIn = function() {
		_this.group.visible = true
	}
});
Class(function Waves() {
	Inherit(this, SceneBase);
	var _this = this;
	var _camera, _particles, _water, _user, _partner, _wrapper, _ambience;
	var _speed = new DynamicObject({
		v: 1
	});
	var _config = require("WavesConfig");
	const TIME_TO_MOVEMENT = 3e4;
	const TIME_TO_COMPLETE = 13e3;
	(function() {
		_this.group.visible = false;
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background);
		initViews();
		initCamera()
	}());

	function startMovement() {
		_water.desaturate()
	}

	function complete() {
		_this.events.fire(HydraEvents.COMPLETE)
	}

	function initViews() {
		_water = _this.initClass(WavesWater);
		_water.group.rotation.set(0, 0, 0);
		_this.group.add(_water.group);
		if(Global.PLAYGROUND) {
			_this.delayedCall(() => _this.animateIn(), 250)
		}
	}

	function initCamera() {
		_camera = _this.initClass(SceneCamera);
		_camera.root.position.set(0, -2, -15);
		_camera.movementX = 0;
		_camera.root.rotation.x = Utils.toRadians(0);
		if(Global.PLAYGROUND) Camera.instance().setCamera(_camera);
		_this.camera = _camera;
		_wrapper = new THREE.Group;
		_wrapper.add(_camera.root)
	}

	function loop() {
		_wrapper.rotation.y += .001 * _speed.v;
		_wrapper.updateMatrixWorld()
	}
	this.animateIn = function() {
		_this.group.visible = true;
		_this.startRender(loop);
		_water.animateIn();
		_this.delayedCall(startMovement, TIME_TO_MOVEMENT);
		Background.instance().transition(_config.background)
	};
	this.animateOut = function() {
		_water.animateOut()
	};
	this.onPrerender = function() {
		return Promise.all([_user.prerender(), _partner.prerender(), _ambience.prerender()])
	}
});
Class(function Woman() {
	Inherit(this, SceneBase);
	var _this = this;
	var _elements, _camera, _interaction;
	var _wrapper = new THREE.Group;
	var _mouse = new Vector2;
	var _rotation = new Vector2;
	var _rotationOrigin = new Vector2;
	var _move = new Vector2;
	var _origin = new Vector2;
	var _config = require("WomanConfig");
	this.group = new THREE.Group;
	(function() {
		initViews();
		initCamera();
		addListeners();
		_this.startRender(loop);
		if(Global.PLAYGROUND) _this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initViews() {
		_elements = _this.initClass(WomanElement);
		_wrapper.add(_elements.group);
		Global.GROUP = _elements.group;
		_this.group.add(_wrapper);
		if(Global.PLAYGROUND) Background.instance().setColor(_config.background)
	}

	function initCamera() {
		_this.group.add(_wrapper);
		World.CAMERA.position.z = 3;
		World.CAMERA.lookAt(new THREE.Vector3)
	}

	function loop() {
		if(Device.mobile) {
			_mouse.lerp(Mobile.Accelerometer, .1);
			let rotation = Utils.toRadians(40);
			_wrapper.rotation.y = Utils.range(_mouse.x, -6, 6, rotation, -rotation, true)
		} else {
			_mouse.lerp(Mouse, .03);
			let rotation = Utils.toRadians(40);
			_wrapper.rotation.y = Utils.range(_mouse.x, 0, Stage.width, rotation, -rotation)
		}
	}

	function addListeners() {
		_interaction = _this.initClass(Interaction.Input, Stage);
		_interaction.onStart = start;
		_interaction.onUpdate = update;
		_interaction.onEnd = end
	}

	function start(e) {
		_this.delta = null;
		_origin.copy(e);
		_rotationOrigin.copy(_rotation)
	}

	function update(e) {
		let val = Device.mobile ? .02 : .005;
		_rotation.y = _rotationOrigin.y - (_origin.x - e.x) * val * .5;
		_this.delta = e.delta
	}

	function end(e) {
		if(_this.delta) _rotation.y += _this.delta.x * .0006
	}
	this.animateIn = function() {
		_this.group.visible = true
	}
});
Class(function UI() {
	Inherit(this, Controller);
	var _this = this;
	var $container, $sound, $bg;
	var _menu, _click, _close, _info, _about, _social;
	var _load = Data.getState();
	if(Mobile.os == "iOS" && Device.mobile) {
		_load = null;
		Data.setState("")
	}(function() {
		initContainer();
		initView();
		defer(animateIn)
	}());

	function initContainer() {
		$container = _this.container;
		$container.size("100%").setZ(100).mouseEnabled(false);
		let size = Mobile.phone ? 8 : 10;
		$sound = $container.create(".lockedtext");
		$sound.fontStyle("MontBold", size, "#aaa");
		$sound.size(300, size).center(1, 0).css({
			lineHeight: size,
			opacity: 0,
			letterSpacing: size * .2,
			bottom: Mobile.phone ? 30 : 40,
			textAlign: "center"
		});
		$sound.html("TURN ON SOUND")
	}

	function initView() {
		_menu = _this.initClass(UIMenu);
		_menu.events.add(HydraEvents.CLICK, click);
		_menu.events.add(HydraEvents.COMPLETE, complete)
	}

	function animateIn() {
		if(_load) {
			click(_load);
			_this.delayedCall(complete, 100, _load);
			_load = null
		} else {
			_about = _this.initClass(UIAboutButton);
			_menu.animateIn()
		}
	}

	function click(e) {
		if(_social) _social.animateOut();
		if(_about) {
			_about.animateOut(function() {
				_about = _about.destroy()
			})
		}
		_this.events.fire(HydraEvents.CLICK, e)
	}

	function complete(e) {
		if(_click) _click = _click.destroy();
		_menu = _menu.destroy();
		_close = _this.initClass(UIClose, e);
		_info = _this.initClass(UIInfo, e);
		_about = _this.initClass(UIAboutButton);
		if($sound && !$sound.shown) {
			$sound.css({
				color: Global.TRACK_COLOR
			});
			$sound.tween({
				opacity: Global.TRACK_COLOR == "#ccc" ? .35 : .5
			}, 2e3, "easeInOutSine", 100, function() {
				$sound.tween({
					opacity: 0
				}, 4e3, "easeInOutSine", function() {
					$sound.hide();
					$sound.shown = true
				})
			})
		}
		_this.delayedCall(_close.animateIn, 2e3);
		_this.delayedCall(_info.animateIn, 2e3);
		_this.events.fire(HydraEvents.COMPLETE, e)
	}
	this.reset = function() {
		$container.tween({
			opacity: 0
		}, 500, "easeOutSine", function() {
			$container.clearAlpha();
			if(_info) _info = _info.destroy();
			if(_close) _close = _close.destroy();
			if(_about) _about = _about.destroy();
			initView();
			_this.delayedCall(animateIn, 100)
		})
	}
});
Class(function World() {
	Inherit(this, Component);
	var _this = this;
	var $fps;
	var _renderer, _scene, _camera, _worldRenderer, _effect, _vfx;
	var _controllers = [];
	var _perf = new RenderPerformance;
	var _baseDPR = Tests.getDPR();
	World.DPR = _baseDPR;
	this.dpr = World.DPR;
	(function() {
		initWorld();
		Render.start(loop)
	}());

	function initWorld() {
		_renderer = new THREE.WebGLRenderer({
			antialias: false
		});
		_renderer.setPixelRatio(World.DPR);
		_renderer.setSize(Stage.width, Stage.height);
		_renderer.setClearColor(1118481);
		_scene = new THREE.Scene;
		_camera = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, .05, 1e3);
		World.SCENE = _scene;
		World.RENDERER = _renderer;
		World.ELEMENT = _renderer.domElement;
		World.CAMERA = _camera;
		_worldRenderer = new WorldRenderer(_renderer, _scene, _camera);
		Background.instance()
	}

	function loop(t, dt) {
		if(!Global.IN_SCENE) return;
		_worldRenderer.render()
	}
	this.setCamera = function(camera) {
		_camera = camera;
		_worldRenderer.camera = _camera;
		World.CAMERA = camera
	};
	this.startRender = function() {
		Render.start(loop)
	};
	this.reset = function() {
		World.SCENE.children.forEach(child => World.SCENE.remove(child));
		World.CAMERA.position.z = 0;
		_worldRenderer.reset();
		Render.stop(loop)
	}
}, function() {
	var _instance;
	World.instance = function() {
		if(!_instance) _instance = new World;
		return _instance
	}
});
Class(function WorldRenderer(_renderer, _scene, _camera) {
	Inherit(this, Component);
	var _this = this;
	var _vr, _nuke, _cardboard, _post, _light;
	var _evt = {};
	(function() {
		initRenderer();
		addListeners();
		initNuke();
		initFX()
	}());

	function initRenderer() {
		if(Hardware.ROOMSCALE_VR) initVR();
		else if(Hardware.CARDBOARD) initCardboard();
		else initCamera();
		World.CAMERA = _camera
	}

	function initVR() {
		_vr = new THREE.VREffect(_renderer);
		_vr.onRenderEye = renderEye;
		_vr.controls = new THREE.VRControls(_camera);
		Stage.bind("click", () => {
			_vr.requestPresent()
		})
	}

	function initCardboard() {
		_cardboard = new THREE.StereoEffect(_renderer);
		_cardboard.setSize(Stage.width, Stage.height);
		_cardboard.onRenderEye = renderEye;
		_cardboard.group = new THREE.Group;
		_cardboard.controls = new THREE.DeviceOrientationControls(_cardboard.group);
		_camera.position.set(0, 1.6, 1)
	}

	function initCamera() {
		if(Hydra.HASH.strpos(["debug", "orbit"])) return;
		_camera = Camera.instance().worldCamera
	}

	function initNuke() {
		_nuke = _this.initClass(Nuke, Stage, {
			renderer: _renderer,
			camera: _camera,
			scene: _scene,
			dpr: World.DPR
		});
		WorldRenderer.NUKE = _nuke
	}

	function initLight() {
		_light = _this.initClass(FX.Light, _nuke);
		FX.Light.instance = () => {
			return _light
		}
	}

	function initFX() {
		initLight();
		FX.Light.instance(_nuke);
		_nuke.add(FX.Light.instance().pass);
		_post = _this.initClass(NukePass, "Post");
		_post.uniforms = {
			uResolution: {
				type: "v2",
				value: new THREE.Vector2(Stage.width * World.DPR, Stage.height * World.DPR)
			}
		};
		_nuke.add(_post)
	}

	function renderEye(stage, camera) {
		_evt.stage = stage;
		_evt.camera = camera;
		_this.events.fire(WorldRenderer.RENDER, _evt);
		if(_nuke.enabled) {
			FX.Light.instance().render(Stage, camera);
			_nuke.scene = _scene;
			_nuke.camera = camera;
			_nuke.setSize(stage.width, stage.height);
			_nuke.render()
		} else {
			_renderer.render(_scene, camera)
		}
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resize)
	}

	function resize() {
		if(_post) _post.uniforms.uResolution.value.set(Stage.width * World.DPR, Stage.height * World.DPR);
		_renderer.setSize(Stage.width, Stage.height);
		_camera.aspect = Stage.width / Stage.height;
		_camera.updateProjectionMatrix()
	}
	this.render = function() {
		if(_vr) {
			_vr.controls.update();
			_vr.render(_scene, _camera)
		} else if(_cardboard) {
			_cardboard.controls.update();
			_camera.quaternion.slerp(_cardboard.group.quaternion, .2);
			_cardboard.render(_scene, _camera)
		} else {
			renderEye(Stage, _camera)
		}
	};
	this.set("camera", c => {
		_camera = c
	});
	this.set("renderer", r => {
		_renderer = r;
		_nuke.renderer = r;
		_this.events.fire(WorldRenderer.CHANGE_RENDERER);
		_nuke.remove(FX.Light.instance().pass);
		if(_post) _nuke.remove(_post);
		_light.destroy();
		initLight();
		_nuke.add(FX.Light.instance().pass);
		if(_post) _nuke.add(_post)
	});
	this.reset = function() {
		_this.events.fire(WorldRenderer.CHANGE_RENDERER);
		_nuke.remove(FX.Light.instance().pass);
		if(_post) _nuke.remove(_post);
		_light.destroy();
		initLight();
		_nuke.add(FX.Light.instance().pass);
		if(_post) _nuke.add(_post)
	}
}, () => {
	WorldRenderer.RENDER = "world_render_eye";
	WorldRenderer.CHANGE_RENDERER = "world_change_renderer"
});
Class(function AboutSocial(_dark) {
	Inherit(this, View);
	var _this = this;
	var $this;
	var _icons;
	var _types = ["sound", "spot", "fb", "tw", "inst", "yt", "itu"];
	var _size = Mobile.phone ? 22 : 24;
	var _gap = Mobile.phone ? 12 : 25;
	var _alpha = _dark ? .25 : .3;
	(function() {
		initHTML();
		initIcons();
		addListeners()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(_size * _types.length + _gap * (_types.length - 1), _size).css({
			bottom: Mobile.phone ? 38 : 50
		}).center(1, 0).setZ(1e3).invisible()
	}

	function initIcons() {
		var x = 0;
		_icons = [];
		for(var i = 0; i < _types.length; i++) {
			var $icon = $this.create(".icon");
			$icon.size(_size, _size).bg("assets/images/social" + (_dark ? "-dark" : "") + "/" + _types[i] + ".png").css({
				opacity: .5,
				left: x
			});
			$icon.type = _types[i];
			_icons.push($icon);
			x += _size + _gap
		}
	}

	function addListeners() {
		for(var i = 0; i < _icons.length; i++) {
			_icons[i].interact(hover, click);
			_icons[i].hit.size(_size * 2, _size * 2).center().mouseEnabled(true)
		}
	}

	function hover(e) {
		if(!_this.clickable) return;
		switch(e.action) {
			case "over":
				e.object.tween({
					opacity: 1
				}, 300, "easeOutSine");
				break;
			case "out":
				e.object.tween({
					opacity: _alpha
				}, 600, "easeOutSine");
				break
		}
	}

	function click(e) {
		if(!_this.clickable) return;
		e.object.tween({
			opacity: _alpha
		}, 400, "easeOutSine");
		switch(e.object.type) {
			case "sound":
				getURL("https://soundcloud.com/emmitfenn", "_blank");
				break;
			case "spot":
				getURL("https://open.spotify.com/artist/3VVLqeEqQQqTgT8YhfY9Z6", "_blank");
				break;
			case "fb":
				getURL("https://www.facebook.com/emmitfennmusic/", "_blank");
				break;
			case "inst":
				getURL("https://www.instagram.com/emmitfenn", "_blank");
				break;
			case "tw":
				getURL("https://twitter.com/emmitfennmusic", "_blank");
				break;
			case "yt":
				getURL("https://www.youtube.com/channel/UC81hioFupMsG2MWMQy78oCw", "_blank");
				break;
			case "itu":
				getURL("https://itunes.apple.com/us/artist/emmit-fenn/id1084146246", "_blank");
				break
		}
	}
	this.animateIn = function() {
		if(_this.visible) return;
		_this.visible = true;
		_this.delayedCall(function() {
			_this.clickable = true
		}, 15e2);
		$this.visible().clearAlpha();
		for(var i = 0; i < _icons.length; i++) {
			_icons[i].transform({
				y: 8
			}).css({
				opacity: 0
			}).tween({
				y: 0,
				opacity: _alpha
			}, 800, "easeOutCubic", i * 100 + 11e2)
		}
	};
	this.animateOut = function() {
		if(!_this.visible) return;
		_this.visible = _this.clickable = false;
		$this.tween({
			opacity: 0
		}, 300, "easeOutSine", function() {
			$this.invisible()
		})
	}
});
Class(function AboutSubmit() {
	Inherit(this, View);
	var _this = this;
	var $this, $border, $text, $over, $solid;
	var _offset = Mobile.phone ? 25 : 40;
	var _color = "#fff";
	_this.width = Mobile.phone ? 120 : 120;
	_this.height = Mobile.phone ? 40 : 40;
	(function() {
		initHTML();
		initText();
		addListeners()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(_this.width, _this.height).css({
			bottom: -50,
			overflow: "hidden"
		}).center(1, 0).setZ(1e3).invisible();
		$border = $this.create(".border");
		$border.size(_this.width - 2, _this.height - 2).css({
			border: "1px solid " + _color,
			opacity: .3
		});
		$solid = $this.create(".solid");
		$solid.size("100%").transform({
			y: _this.height
		}).bg(_color)
	}

	function initText() {
		let size = 11;
		$text = $this.create(".text");
		$text.fontStyle("MontBold", size, _color);
		$text.css({
			width: "100%",
			top: _this.height / 2 - size / 2,
			letterSpacing: 3,
			lineHeight: size,
			textAlign: "center"
		});
		$text.text("SUBMIT");
		$over = $this.create(".text");
		$over.fontStyle("MontBold", size, "#111");
		$over.css({
			width: "100%",
			top: _this.height / 2 - size / 2,
			letterSpacing: 3,
			lineHeight: size,
			textAlign: "center",
			opacity: 0
		}).transform({
			y: 10
		});
		$over.text("SUBMIT")
	}

	function addListeners() {
		$this.interact(hover, click);
		$this.hit.mouseEnabled(true);
		_this.events.subscribe(KeyboardUtil.DOWN, keyPress)
	}

	function hover(e) {
		if(!_this.visible) return;
		switch(e.action) {
			case "over":
				$over.stopTween().transform({
					y: 10
				}).tween({
					y: 0,
					opacity: 1
				}, 400, "easeOutQuart");
				$solid.stopTween().transform({
					y: _this.height
				}).tween({
					y: 0
				}, 400, "easeOutQuart");
				break;
			case "out":
				$solid.tween({
					y: -_this.height
				}, 600, "easeOutQuart");
				$over.tween({
					y: -10,
					opacity: 0
				}, 600, "easeOutQuart");
				break
		}
	}

	function keyPress(e) {
		if(!_this.visible) return;
		if(e.keyCode == 13) click()
	}

	function click() {
		if(!_this.visible) return;
		_this.events.fire(HydraEvents.CLICK)
	}
	this.animateIn = function() {
		if(_this.visible) return;
		_this.visible = true;
		$this.visible().css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 400, "easeOutSine")
	};
	this.animateOut = function() {
		if(!_this.visible) return;
		_this.visible = false;
		$this.tween({
			opacity: 0
		}, 400, "easeOutSine", function() {
			$this.invisible()
		})
	}
});
Class(function AboutView() {
	Inherit(this, View);
	var _this = this;
	var $this, $wrapper, $emmit, $at, $partner, $brain, $music, $visuals, $updated, $input, $label;
	var _scale = Mobile.phone ? .32 : .36;
	var _elements = [],
		_submit, _social;
	var _top = 0;
	var _alpha = .75;
	(function() {
		initHTML();
		initLogos();
		initForm();
		initSocial();
		addListeners();
		resizeHandler()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size("100%").setZ(10).mouseEnabled(false);
		$wrapper = $this.create(".wrapper");
		$wrapper.size(125e1 * _scale, 320).center().mouseEnabled(true)
	}

	function initLogos() {
		$music = $wrapper.create(".text");
		$music.fontStyle("Mont", 10, "#fff");
		$music.size("100%").css({
			top: _top,
			letterSpacing: 6,
			textAlign: "center",
			textTransform: "uppercase"
		}).mouseEnabled(false);
		$music.text("MUSIC BY");
		_elements.push($music);
		$emmit = $wrapper.create(".emmit");
		$emmit.size(125e1 * _scale, 100 * _scale).bg("assets/images/about/emmit.png").center(1, 0).css({
			top: _top + 25
		});
		$emmit.alpha = _alpha;
		$emmit.interact(function(e) {
			if(_this.visible) $emmit.tween({
				opacity: e.action !== "over" ? _alpha : 1
			}, e.action == "over" ? 200 : 400, "easeOutSine")
		}, function() {
			if(_this.visible) getURL("https://soundcloud.com/emmitfenn", "_blank")
		});
		$emmit.hit.mouseEnabled(true);
		_elements.push($emmit);
		_top += 110;
		$visuals = $wrapper.create(".text");
		$visuals.fontStyle("Mont", 10, "#fff");
		$visuals.size("100%").css({
			letterSpacing: 6,
			textAlign: "center",
			top: _top,
			textTransform: "uppercase"
		}).mouseEnabled(false);
		$visuals.text("VISUALS BY");
		_elements.push($visuals);
		$at = $wrapper.create(".emmit");
		$at.size(125e1 * _scale, 100 * _scale).bg("assets/images/about/activetheory.png").center(1, 0).css({
			top: _top + 22
		});
		$at.alpha = _alpha;
		$at.interact(function(e) {
			if(_this.visible) $at.tween({
				opacity: e.action !== "over" ? _alpha : 1
			}, e.action == "over" ? 200 : 400, "easeOutSine")
		}, function() {
			if(_this.visible) getURL("https://activetheory.net", "_blank")
		});
		$at.hit.mouseEnabled(true);
		_elements.push($at);
		_top += 110;
		$partner = $wrapper.create(".text");
		$partner.fontStyle("Mont", 10, "#fff");
		$partner.size("100%").css({
			letterSpacing: 6,
			textAlign: "center",
			top: _top,
			textTransform: "uppercase"
		}).mouseEnabled(false);
		$partner.text("IN PARTNERSHIP WITH");
		_elements.push($partner);
		$brain = $wrapper.create(".emmit");
		$brain.size(125e1 * _scale, 120 * _scale).bg("assets/images/about/th3rdbrain.png").center(1, 0).css({
			top: _top + 22
		});
		$brain.alpha = _alpha;
		$brain.interact(function(e) {
			if(_this.visible) $brain.tween({
				opacity: e.action !== "over" ? _alpha : 1
			}, e.action == "over" ? 200 : 400, "easeOutSine")
		}, function() {
			if(_this.visible) getURL("http://th3rdbrain.com/", "_blank")
		});
		$brain.hit.mouseEnabled(true);
		_elements.push($brain)
	}

	function initForm() {
		if(Storage.get("subscribe_date")) {
			if(Date.now() - Storage.get("subscribe_date") > 1e3 * 60 * 60 * 24) {
				Storage.set("subscribe_date", null);
				Storage.set("subscribe_id", null)
			}
		}
		_top += 115;
		$updated = $wrapper.create(".text");
		$updated.fontStyle("Mont", 10, "#fff");
		$updated.size("100%").css({
			letterSpacing: 6,
			textAlign: "center",
			top: _top,
			textTransform: "uppercase"
		}).mouseEnabled(false);
		$updated.text("STAY UPDATED");
		_elements.push($updated);
		$input = $wrapper.create(".input", "input");
		$input.fontStyle("MontBold", 14, "#111");
		$input.alpha = .1;
		$input.size(125e1 * _scale, 50).center(1, 0).css({
			letterSpacing: 1,
			opacity: .1,
			fontWeight: "light",
			textAlign: "center",
			textTransform: "uppercase",
			top: _top + 25
		}).bg("#eee");
		_elements.push($input);
		$label = $wrapper.create(".text");
		$label.fontStyle("Mont", 11, "#888");
		$label.size("100%").css({
			letterSpacing: 4,
			textAlign: "center",
			top: _top + 40,
			textTransform: "uppercase"
		}).mouseEnabled(false);
		$label.text("ENTER EMAIL OR PHONE NUMBER");
		_elements.push($label);
		_submit = _this.initClass(AboutSubmit, [$wrapper]);
		_elements.push(_submit.element);
		$wrapper.size(125e1 * _scale, _top + 75).center()
	}

	function initSocial() {
		_social = _this.initClass(AboutSocial)
	}

	function addListeners() {
		$input.div.onfocus = focus;
		$input.div.onblur = blur;
		$input.div.oninput = change;
		$input.mouseEnabled(true);
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler);
		_submit.events.add(HydraEvents.CLICK, submit)
	}

	function resizeHandler() {
		let scaleX = Utils.range(Stage.width, 0, 540, 0, 1, true);
		let scaleY = Utils.range(Stage.height, 0, 650, 0, 1, true);
		$wrapper.scale = Math.min(scaleX, scaleY);
		$wrapper.transform()
	}

	function change() {
		let value = $input.div.value;
		if(validateEmail(value) || validatePhone(value)) _submit.animateIn();
		else _submit.animateOut()
	}

	function focus() {
		$input.tween({
			opacity: 1
		}, 300, "easeOutSine");
		$label.tween({
			opacity: 0
		}, 300, "easeOutSine")
	}

	function blur() {
		if($input.div.value !== "") return;
		$input.tween({
			opacity: .1
		}, 300, "easeOutSine");
		$label.tween({
			opacity: 1
		}, 300, "easeOutSine")
	}

	function validateEmail(email) {
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email)
	}

	function validatePhone(number) {
		var phoneRe = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/;
		var digits = number.replace(/\D/g, "");
		return phoneRe.test(digits)
	}

	function submit() {
		let value = $input.div.value;
		let email = "";
		let number = "";
		if(validateEmail(value)) {
			email = value;
			send()
		} else if(validatePhone(value)) {
			number = value;
			send()
		} else {
			$updated.text("INVALID EMAIL OR PHONE NUMBER");
			$updated.stopTween().tween({
				opacity: 0
			}, 300, "easeOutSine", 2e3, function() {
				$updated.text("STAY UPDATED").tween({
					opacity: 1
				}, 300, "easeOutSine")
			})
		}

		function send() {
			XHR.post("https://us-central1-emmit-fenn.cloudfunctions.net/subscribe", {
				id: Storage.get("subscribe_id") ? Storage.get("subscribe_id") : "",
				email: email,
				cellphone: number
			}).then(function(response) {
				if(response && response.success) {
					if(response.id) {
						Storage.set("subscribe_id", response.id);
						Storage.set("subscribe_date", Date.now())
					}
					$input.div.value = "";
					$input.tween({
						opacity: .1
					}, 300, "easeOutSine");
					$label.tween({
						opacity: 1
					}, 300, "easeOutSine");
					$label.text("YOUR INFORMATION IS SUBMITTED");
					$label.stopTween().tween({
						opacity: 0
					}, 300, "easeOutSine", 2e3, function() {
						$label.text("ENTER EMAIL OR PHONE NUMBER").tween({
							opacity: 1
						}, 300, "easeOutSine")
					})
				} else {
					console.log("error submitting form")
				}
			}).catch(function(error) {
				console.log("error submitting form", error)
			})
		}
	}
	this.animateIn = function() {
		for(var i = 0; i < _elements.length; i++) {
			_elements[i].transform({
				y: 15
			}).css({
				opacity: 0
			}).tween({
				opacity: _elements[i].alpha || .7,
				y: 0
			}, 1e3, "easeOutQuart", i * 50 + 300)
		}
		_social.animateIn();
		_this.delayedCall(function() {
			_this.visible = true
		}, 15e2)
	};
	this.animateOut = function() {
		_this.visible = false;
		for(var i = 0; i < _elements.length; i++) {
			_elements[i].tween({
				y: -5,
				opacity: 0
			}, 500, "easeOutCubic", i * 50)
		}
		_social.animateOut();
		_submit.animateOut()
	}
});
Class(function AboutCamera() {
	Inherit(this, Component);
	var _this = this;
	var _debug, _lockCamera, _transition, _timer;
	var _lerp = new DynamicObject({
		v: .02
	});
	var _camera = this.worldCamera = new THREE.PerspectiveCamera(40, Stage.width / Stage.height, 10, 1e4);
	var _origin = new THREE.Object3D;
	var _target = new THREE.Object3D;
	(function() {
		addListeners();
		if(Global.PLAYGROUND) initPlayground();
		_this.startRender(loop)
	}());

	function initPlayground() {
		_debug = Utils3D.createDebug(20);
		Global.PLAYGROUND_SCENE.add(_debug)
	}

	function loop() {
		if(_debug) {
			_debug.position.copy(_camera.position);
			_debug.quaternion.copy(_camera.quaternion)
		}
		if(_lockCamera && !_transition) {
			_target.quaternion.copy(_lockCamera.quaternion);
			_target.position.copy(_lockCamera.position)
		}
		_camera.quaternion.slerp(_target.quaternion, _lerp.v);
		_camera.position.lerp(_target.position, _lerp.v)
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {
		_camera.aspect = Stage.width / Stage.height;
		_camera.updateProjectionMatrix()
	}
	this.setCamera = function(camera) {
		clearTimeout(_timer);
		_camera.fov = camera.fov;
		_camera.updateProjectionMatrix();
		_camera.quaternion.copy(camera.quaternion);
		_camera.position.copy(camera.position);
		_target.quaternion.copy(camera.quaternion);
		_target.position.copy(camera.position);
		_lockCamera = camera;
		_lerp.v = .08
	};
	this.transition = function(camera, time, ease, delay, callback) {
		if(typeof delay == "function") {
			callback = delay;
			delay = 0
		}
		clearTimeout(_timer);
		_timer = _this.delayedCall(function() {
			_transition = true;
			_origin.quaternion.copy(_camera.quaternion);
			_origin.position.copy(_camera.position);
			_lerp.tween({
				v: .02
			}, 15e2, "easeInOutSine");
			var p1 = (new Vector3).copy(_origin.position).lerp(camera.position, .5);
			p1.addAngleRadius(Utils.toRadians(Utils.doRandom(0, 360)), -200);
			var d = new DynamicObject({
				v: 0
			});
			TweenManager.tween(_camera, {
				fov: camera.fov
			}, time, "easeInOutCubic");
			d.tween({
				v: 1
			}, time, ease, 0, function() {
				_lockCamera = camera;
				_target.quaternion.copy(_origin.quaternion).slerp(camera.quaternion, d.v);
				var curve = new THREE.QuadraticBezierCurve3(_origin.position, p1, camera.position);
				_target.position.copy(curve.getPoint(d.v));
				_camera.updateProjectionMatrix()
			}, function() {
				callback && callback();
				_transition = false;
				_lerp.tween({
					v: .08
				}, 15e2, "easeInOutSine")
			})
		}, delay || 0)
	};
	this.lockOnCamera = function(camera) {
		if(_camera.fov != _camera.fov) {
			TweenManager.tween(_camera, {
				fov: camera.fov
			}, 1e3, "easeInOutCubic")
		}
		_lockCamera = camera
	}
}, "singleton");
Class(function AboutLiquid() {
	Inherit(this, Component);
	var _this = this;
	var _scene, _camera, _renderer, _liquid;
	var _canLiquid = Device.graphics.webgl && Device.graphics.webgl.detect("float");
	this.dpr = .5;
	(function() {
		if(_canLiquid) {
			initThree();
			initLiquid();
			addHandlers()
		} else {
			initFallback()
		}
	}());

	function initThree() {
		_scene = new THREE.Scene;
		_renderer = new THREE.WebGLRenderer;
		_renderer.setPixelRatio(1);
		_renderer.setSize(Stage.width, Stage.height);
		if(_canLiquid) Stage.add(_renderer.domElement);
		AboutLiquid.SCENE = _scene;
		AboutLiquid.RENDERER = _renderer;
		_camera = AboutCamera.instance();
		AboutLiquid.CAMERA = _camera.worldCamera;
		_this.scene = _scene
	}

	function initFallback() {
		Stage.bg("assets/images/fallback.jpg", "cover")
	}

	function initLiquid() {
		_liquid = _this.initClass(LiquidFluid)
	}

	function loop() {
		_renderer.render(_scene, _camera.worldCamera)
	}

	function addHandlers() {
		_this.events.subscribe(HydraEvents.RESIZE, resize)
	}

	function resize() {
		AboutLiquid.CAMERA.aspect = Stage.width / Stage.height;
		AboutLiquid.CAMERA.updateProjectionMatrix();
		_renderer.setSize(Stage.width, Stage.height)
	}
	this.animateIn = function() {
		if(_canLiquid) {
			_this.startRender(loop);
			_liquid.animateIn()
		}
	};
	this.animateOut = function() {
		if(_canLiquid) {
			_liquid.animateOut();
			_this.stopRender(loop)
		}
	}
}, function() {
	var _instance;
	AboutLiquid.CAMERA = null;
	AboutLiquid.instance = function() {
		if(!_instance) _instance = new Scene;
		return _instance
	}
});
Class(function LiquidFluid() {
	Inherit(this, View);
	var _this = this;
	var $this;
	var _renderer, _camera, _tween;
	var _inside, _all, _cursor;
	var _velocityFBO0, _velocityFBO1, _divergenceFBO, _pressureFBO0, _pressureFBO1;
	var _advectVelocityKernel, _addForceKernel, _divergenceKernel, _jacobiKernel, _subtractPressureGradientKernel, _drawKernel;
	var _advectVelocityKernelScene, _addForceKernelScene, _divergenceKernelScene, _jacobiKernelScene, _subtractPressureGradientKernelScene, _drawKernelScene;
	var _x0, _y0;
	var _lerp = new Vector2;
	var _webcam = new Vector2(Stage.width / 2, Stage.height / 2);
	var _webcamLerp = new Vector2(Stage.width / 2, Stage.height / 2);
	var _timeout;
	var _count = 0;
	var _resolution = .5;
	var h = Math.round(Utils.convertRange(1, 0, 10, 35, 0));
	var s = Math.round(Utils.convertRange(1, 0, 10, 0, 65));
	var l = Math.round(Utils.convertRange(1, 0, 10, 55, 20));
	var offset = Math.round(Utils.convertRange(1, 0, 10, 30, 0));
	var _options = {
		iterations: 5,
		mouse_force: 1,
		resolution: .4 * _resolution,
		cursor_size: Mobile.phone ? 25 * _resolution : 50 * _resolution,
		step: 1 / 60,
		color1: "hsl(0, 69%, 60%)",
		color2: "hsl(0, 77%, 20%)"
	};
	(function() {
		initRenderer();
		initGeometries();
		initFBOs();
		initShaders();
		addHandlers();
		defer(loop)
	}());

	function initRenderer() {
		$this = _this.element;
		$this.size("100%").mouseEnabled(false);
		_renderer = new THREE.WebGLRenderer;
		_renderer.autoClear = false;
		_renderer.setPixelRatio(1);
		_renderer.setSize(Stage.width * _options.resolution, Stage.height * _options.resolution);
		_renderer.domElement.setAttribute("style", "width: 100%; height: 100%");
		$this.add(_renderer.domElement);
		_camera = new THREE.PerspectiveCamera(45, Stage.width / Stage.height, 1, 1e4)
	}

	function initGeometries() {
		var px_x = 1 / (Stage.width * _options.resolution);
		var px_y = 1 / (Stage.height * _options.resolution);
		_inside = new THREE.PlaneBufferGeometry(2 - px_x * 2 * 2, 2 - px_y * 2 * 2);
		_all = new THREE.PlaneBufferGeometry(2, 2);
		_cursor = new THREE.PlaneBufferGeometry(px_x * _options.cursor_size * 2 * 2, px_y * _options.cursor_size * 2 * 2)
	}

	function initFBOs() {
		var parameters = {
			format: THREE.RGBAFormat,
			type: Mobile.os == "iOS" ? THREE.HalfFloatType : THREE.FloatType,
			depthBuffer: false,
			stencilBuffer: false
		};
		var width = Stage.width * _options.resolution;
		var height = Stage.height * _options.resolution;
		_velocityFBO0 = new THREE.WebGLRenderTarget(width, height, parameters);
		_velocityFBO1 = new THREE.WebGLRenderTarget(width, height, parameters);
		_divergenceFBO = new THREE.WebGLRenderTarget(width, height, parameters);
		_pressureFBO0 = new THREE.WebGLRenderTarget(width, height, parameters);
		_pressureFBO1 = new THREE.WebGLRenderTarget(width, height, parameters);
		_this.texture = new THREE.WebGLRenderTarget(width, height, parameters)
	}

	function createScene(geometry, material) {
		var scene = new THREE.Scene;
		var mesh = new THREE.Mesh(geometry, material);
		mesh.frustumCulled = false;
		scene.add(mesh);
		return scene
	}

	function initShaders() {
		var px_x = 1 / (Stage.width * _options.resolution);
		var px_y = 1 / (Stage.height * _options.resolution);
		var px = new THREE.Vector2(px_x, px_y);
		var px1 = new THREE.Vector2(1, Stage.width / Stage.height);
		_advectVelocityKernel = new Shader("kernel", "advect");
		_advectVelocityKernel.uniforms = {
			px: {
				type: "v2",
				value: px
			},
			px1: {
				type: "v2",
				value: px1
			},
			scale: {
				type: "f",
				value: 1
			},
			velocity: {
				type: "t",
				value: _velocityFBO0
			},
			source: {
				type: "t",
				value: _velocityFBO0
			},
			dt: {
				type: "f",
				value: _options.step
			}
		};
		_advectVelocityKernelScene = createScene(_inside, _advectVelocityKernel.material);
		_addForceKernel = new Shader("cursor", "addForce");
		_addForceKernel.uniforms = {
			px: {
				type: "v2",
				value: px
			},
			force: {
				type: "v2",
				value: new THREE.Vector2(.5, .2)
			},
			center: {
				type: "v2",
				value: new THREE.Vector2(.1, .4)
			},
			scale: {
				type: "v2",
				value: new THREE.Vector2(_options.cursor_size * px_x, _options.cursor_size * px_y)
			}
		};
		_addForceKernel.material.blending = THREE.AdditiveBlending;
		_addForceKernel.material.transparent = true;
		_addForceKernelScene = createScene(_cursor, _addForceKernel.material);
		_divergenceKernel = new Shader("kernel", "divergence");
		_divergenceKernel.uniforms = {
			px: {
				type: "v2",
				value: px
			},
			velocity: {
				type: "t",
				value: _velocityFBO1
			}
		};
		_divergenceKernelScene = createScene(_all, _divergenceKernel.material);
		_jacobiKernel = new Shader("kernel", "jacobi");
		_jacobiKernel.uniforms = {
			pressure: {
				type: "t",
				value: _pressureFBO0
			},
			divergence: {
				type: "t",
				value: _divergenceFBO
			},
			alpha: {
				type: "f",
				value: -1
			},
			beta: {
				type: "f",
				value: .25
			},
			px: {
				type: "v2",
				value: px
			}
		};
		_jacobiKernelScene = createScene(_all, _jacobiKernel.material);
		_subtractPressureGradientKernel = new Shader("kernel", "subtractPressureGradient");
		_subtractPressureGradientKernel.uniforms = {
			scale: {
				type: "f",
				value: 1
			},
			pressure: {
				type: "t",
				value: _pressureFBO0
			},
			velocity: {
				type: "t",
				value: _velocityFBO1
			},
			px: {
				type: "v2",
				value: px
			}
		};
		_subtractPressureGradientKernelScene = createScene(_all, _subtractPressureGradientKernel.material);
		_drawKernel = new Shader("kernel", "visualize");
		_drawKernel.uniforms = {
			pressure: {
				type: "t",
				value: _pressureFBO0
			},
			velocity: {
				type: "t",
				value: _velocityFBO0
			},
			hue: {
				type: "f",
				value: 0
			},
			color1: {
				type: "c",
				value: new THREE.Color(_options.color1)
			},
			color2: {
				type: "c",
				value: new THREE.Color(_options.color2)
			},
			px: {
				type: "v2",
				value: px
			}
		};
		_drawKernelScene = createScene(_all, _drawKernel.material)
	}

	function updatetShaders() {
		var px_x = 1 / (Stage.width * _options.resolution);
		var px_y = 1 / (Stage.height * _options.resolution);
		var px = new THREE.Vector2(px_x, px_y);
		var px1 = new THREE.Vector2(1, Stage.width / Stage.height);
		_advectVelocityKernel.uniforms.px.value = px;
		_advectVelocityKernel.uniforms.px1.value = px1;
		_advectVelocityKernel.uniforms.velocity.value = _velocityFBO0;
		_advectVelocityKernel.uniforms.source.value = _velocityFBO0;
		_addForceKernel.uniforms.px.value = px;
		_addForceKernel.uniforms.scale.value = new THREE.Vector2(_options.cursor_size * px_x, _options.cursor_size * px_y);
		_divergenceKernel.uniforms.px.value = px;
		_divergenceKernel.uniforms.velocity.value = _velocityFBO1;
		_jacobiKernel.uniforms.pressure.value = _pressureFBO0;
		_jacobiKernel.uniforms.divergence.value = _divergenceFBO;
		_jacobiKernel.uniforms.px.value = px;
		_subtractPressureGradientKernel.uniforms.pressure.value = _pressureFBO0;
		_subtractPressureGradientKernel.uniforms.velocity.value = _velocityFBO1;
		_subtractPressureGradientKernel.uniforms.px.value = px;
		_drawKernel.uniforms.pressure.value = _pressureFBO0;
		_drawKernel.uniforms.velocity.value = _velocityFBO0;
		_drawKernel.uniforms.px.value = px
	}

	function loop(t) {
		var x = Mouse.x;
		var y = Mouse.y;
		var autoClear = _renderer.autoClear;
		_renderer.autoClear = false;
		var pixelRatio = _renderer.getPixelRatio();
		_renderer.setPixelRatio(1);
		var px_x = 1 / (Stage.width * _options.resolution);
		var px_y = 1 / (Stage.height * _options.resolution);
		if(_x0 == null) {
			_x0 = x * _options.resolution;
			_y0 = y * _options.resolution
		}
		var x1 = x * _options.resolution;
		var y1 = y * _options.resolution;
		var xd = x1 - _x0;
		var yd = y1 - _y0;
		_x0 = x1;
		_y0 = y1;
		if(_x0 === 0 && _y0 === 0) xd = yd = 0;
		_renderer.render(_advectVelocityKernelScene, _camera, _velocityFBO1);
		_addForceKernel.uniforms.force.value.set(xd * px_x * _options.cursor_size * _options.mouse_force, -yd * px_y * _options.cursor_size * _options.mouse_force);
		_addForceKernel.uniforms.center.value.set(_x0 * px_x * 2 - 1, (_y0 * px_y * 2 - 1) * -1);
		_renderer.state.setBlending(THREE.AdditiveBlending);
		_renderer.render(_addForceKernelScene, _camera, _velocityFBO1);
		_renderer.state.setBlending(null);
		_renderer.render(_divergenceKernelScene, _camera, _divergenceFBO);
		var p0 = _pressureFBO0,
			p1 = _pressureFBO1,
			p_ = p0;
		for(var i = 0; i < _options.iterations; i++) {
			_jacobiKernel.uniforms.pressure.value = p0;
			_renderer.render(_jacobiKernelScene, _camera, p1);
			p_ = p0;
			p0 = p1;
			p1 = p_
		}
		_renderer.render(_subtractPressureGradientKernelScene, _camera, _velocityFBO0);
		_renderer.render(_drawKernelScene, _camera);
		_renderer.autoClear = autoClear;
		_renderer.setPixelRatio(pixelRatio)
	}

	function addHandlers() {
		_this.events.subscribe(HydraEvents.RESIZE, resize)
	}

	function resize() {
		initFBOs();
		updatetShaders();
		var px_x = 1 / (Stage.width * _options.resolution);
		var px_y = 1 / (Stage.height * _options.resolution);
		var newInside = new THREE.PlaneBufferGeometry(2 - px_x * 2 * 2, 2 - px_y * 2 * 2);
		var newAll = new THREE.PlaneBufferGeometry(2, 2);
		var newCursor = new THREE.PlaneBufferGeometry(px_x * _options.cursor_size * 2 * 2, px_y * _options.cursor_size * 2 * 2);
		_inside.attributes.position.array = newInside.attributes.position.array;
		_all.attributes.position.array = newAll.attributes.position.array;
		_cursor.attributes.position.array = newCursor.attributes.position.array;
		_inside.attributes.position.needsUpdate = true;
		_all.attributes.position.needsUpdate = true;
		_cursor.attributes.position.needsUpdate = true;
		_renderer.setSize(Stage.width * _options.resolution, Stage.height * _options.resolution);
		$(_renderer.domElement).css({
			width: "100%",
			height: "100%"
		})
	}
	this.onDestroy = function() {
		_this.stopRender(loop)
	};
	this.animateIn = function() {
		_this.startRender(loop);
		_drawKernel.uniforms.hue.value = Global.HUE
	};
	this.animateOut = function() {
		_this.stopRender(loop)
	}
});
Class(function Background() {
	Inherit(this, Component);
	var _this = this;
	var _shader, _layer;
	this.resolution = new THREE.Vector2(Stage.width, Stage.height);
	this.desaturate = 0;
	(function() {
		initLayer();
		initMesh();
		initProjection();
		addListeners();
		resizeHandler();
		_this.startRender(loop)
	}());

	function initLayer() {
		_layer = _this.initClass(FXLayer, WorldRenderer.NUKE);
		_layer.nuke.dpr = 1;
		_this.rt = _layer.rt
	}

	function initMesh() {
		let geom = new THREE.IcosahedronGeometry(100, 4);
		_shader = _this.initClass(Shader, "Background");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			sat: {
				type: "f",
				value: 0
			},
			color: {
				type: "v3",
				value: new THREE.Color(1118481)
			}
		};
		_shader.material.side = THREE.BackSide;
		let mesh = new THREE.Mesh(geom, _shader.material);
		_layer.nuke.scene.add(mesh);
		_layer.nuke.camera = World.CAMERA
	}

	function initProjection() {
		let geom = new THREE.PlaneBufferGeometry(2, 2);
		let shader = _this.initClass(Shader, "BackgroundPlane");
		shader.uniforms = {
			tMap: {
				type: "t",
				value: _layer.rt.texture
			}
		};
		shader.material.depthWrite = false;
		_this.mesh = new THREE.Mesh(geom, shader.material);
		_this.mesh.frustumCulled = false;
		if(!Hydra.HASH.strpos("noBG")) World.SCENE.add(_this.mesh)
	}

	function loop() {
		_shader.set("time", Render.TSL * .000025);
		_shader.set("sat", _this.desaturate);
		_this.resolution.set(Stage.width, Stage.height)
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler);
		_this.events.subscribe(WorldRenderer.RENDER, renderEye)
	}

	function resizeHandler() {
		_layer.setSize(Stage.width, Stage.height)
	}

	function renderEye(e) {
		_layer.nuke.camera = e.camera;
		_layer.nuke.stage = e.stage;
		_this.resolution.set(e.stage.width, e.stage.height);
		_layer.setSize(e.stage.width, e.stage.height);
		_layer.render()
	}
	this.setColor = function(color) {
		_shader.uniforms.color.value.setHex(color)
	};
	this.transition = function(hex, time = 3e3) {
		let color = new THREE.Color(hex);
		let origin = new THREE.Color(_shader.uniforms.color.value);
		if(!_this.tweenColor) {
			_this.tweenColor = new DynamicObject({
				v: 0
			})
		} else {
			_this.tweenColor.stopTween();
			_this.tweenColor.v = 0
		}
		_this.tweenColor.tween({
			v: 1
		}, time, "easeInOutSine", () => {
			_shader.uniforms.color.value.copy(origin).lerp(color, _this.tweenColor.v)
		})
	}
}, "singleton");
Class(function EmbedView() {
	Inherit(this, View);
	const _this = this;
	var $this, $video, $bg;
	(function() {
		initHTML();
		initVideo();
		addListeners();
		resize()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(128e1, 720).center().invisible().mouseEnabled(true).setZ(10);
		$bg = $this.create(".bg");
		$bg.size("100%").bg("#000");
		let shadow = "0 0 20px hsl(272, 100%, 100%), 0 0 80px hsl(272, 100%, 70%), 0 0 250px hsl(272, 100%, 40%)";
		$bg.css({
			boxShadow: shadow,
			opacity: .4
		})
	}

	function initVideo() {
		$video = $this.create(".video", "iframe");
		$video.size("100%").css({
			border: 0,
			outline: 0
		});
		$video.div.frameborder = 0;
		$video.div.allowfullscreen = true
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resize)
	}

	function resize() {
		let offset = Utils.range(Stage.width, 0, 12e2, 20, 200);
		let w = Stage.width - offset;
		let h = Stage.height - offset;
		let width = Utils.clamp(w, 0, 128e1);
		let height = width * (720 / 128e1);
		if(height > h) {
			height = Utils.clamp(h, 0, 560);
			width = height * (128e1 / 720)
		}
		$this.size(width, height).center()
	}
	this.animateIn = function(id) {
		$video.div.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
		$this.visible().css({
			opacity: 0
		}).transform({
			scale: .95,
			y: 0
		}).tween({
			opacity: 1,
			scale: 1,
			y: 0
		}, 2e3, "easeOutCubic", 500)
	};
	this.animateOut = function() {
		$this.tween({
			opacity: 0
		}, 500, "easeOutSine", function() {
			$this.invisible();
			$video.div.src = ""
		})
	}
});
Class(function PlaygroundShader() {
	Inherit(this, Component);
	var _this = this;
	this.group = new THREE.Group;
	(function() {
		initMesh()
	}());

	function initMesh() {
		let light = getTestLight();
		let shader = new Shader("KnotTest");
		shader.uniforms = {
			tNormal: {
				type: "t",
				value: Utils3D.getRepeatTexture("assets/images/_test/normal.jpg")
			},
			normalStrength: {
				type: "f",
				value: .7
			},
			normalScale: {
				type: "f",
				value: 3
			},
			fMin: {
				type: "f",
				value: .8
			},
			fMax: {
				type: "f",
				value: .9
			},
			brightness: {
				type: "f",
				value: 1.4
			}
		};
		shader.receiveLight = true;
		shader.lights.push(light);
		ShaderUIL.instance().push(shader);
		var geometry = new THREE.TorusKnotBufferGeometry(.5, .2, 100, 16);
		var material = new THREE.MeshBasicMaterial({
			color: 1677696e1
		});
		var torusKnot = new THREE.Mesh(geometry, shader.material);
		_this.group.add(torusKnot)
	}

	function getTestLight() {
		let light = new THREE.PointLight(16777215);
		light.position.set(4, 4, 4);
		let mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(.5, 2), new THREE.MeshBasicMaterial({
			color: 16777215
		}));
		_this.group.add(mesh);
		mesh.position.copy(light.position);
		return light
	}
});
Class(function PlaygroundVideo() {
	Inherit(this, Component);
	var _this = this;
	var _video;
	(function() {
		_video = _this.initClass(Video, {
			src: "assets/audio/tracks/1995.mp4",
			width: 400,
			height: 400
		});
		_video.object.setZ(90);
		Stage.add(_video);
		Stage.bind("touchend", () => {
			_video.play()
		})
	}())
});
Class(function BlindedElements() {
	Inherit(this, Component);
	var _this = this;
	var _snake1, _snake2;
	var _position = new Vector2;
	var _move = new Vector2;
	var _mouse = new Vector2;
	this.group = new THREE.Group;
	_this.beatCount = 0;
	(function() {
		initSnakes();
		addListeners();
		_this.startRender(loop)
	}());

	function initSnakes() {
		_snake1 = _this.initClass(BlindedSnake, true);
		_this.group.add(_snake1.group);
		_snake2 = _this.initClass(BlindedSnake);
		_snake2.group.rotation.y = Utils.toRadians(180);
		_this.group.add(_snake2.group);
		_snake1.group.position.y = -3;
		_snake2.group.position.y = -4;
		_snake2.group.rotation.y = Utils.toRadians(360)
	}

	function loop() {
		_mouse.lerp(Mouse, Mobile.phone ? .4 : .2);
		var x = Mobile.phone ? 1 : 1.5;
		var y = Mobile.phone && Stage.width < Stage.height ? .3 : 0;
		_position.x = Utils.convertRange(_mouse.x, 0, Stage.width, -x, x);
		_position.y = Utils.convertRange(_mouse.y, 0, Stage.height, y, -2);
		_move.lerp(_position, .05);
		_this.group.position.x = _move.x;
		_this.group.position.y = _move.y;
		_this.group.rotation.x = -Utils.toRadians(_move.x * 5);
		_this.group.rotation.z = Utils.toRadians(_move.x * 5);
		_this.group.position.z = Mobile.phone ? -4.5 : -3.5
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 10 == 2 && e.count > 40 && e.time < 134) FX.Light.instance().bounce(8);
				break;
			case "snake1In":
				TweenManager.tween(_snake1.group.position, {
					y: 0
				}, 2e4, "easeOutCubic");
				TweenManager.tween(_snake1.group.rotation, {
					y: Utils.toRadians(0)
				}, 2e4, "easeOutCubic");
				break;
			case "snake2In":
				TweenManager.tween(_snake2.group.position, {
					y: 0
				}, 13e4, "easeOutCubic");
				TweenManager.tween(_snake2.group.rotation, {
					y: Utils.toRadians(180)
				}, 13e4, "easeOutCubic");
				break;
			case "snake2Out":
				TweenManager.tween(_snake2.group.position, {
					y: 5
				}, 25e3, "easeInSine");
				TweenManager.tween(_snake2.group.rotation, {
					y: Utils.toRadians(180) - Utils.toRadians(720)
				}, 25e3, "easeInSine");
				break
		}
	}
	this.animateOut = function() {};
	this.animateIn = function() {}
});
Class(function BlindedSnake(_block) {
	Inherit(this, Component);
	var _this = this;
	var _snake, _mat, _body, _geom, _head, _tail, _sphere;
	var _shader, _light, _lightMesh;
	var _speed = new DynamicObject({
		v: 1
	});
	var _strength = new DynamicObject({
		v: 1
	});
	var _start = Math.random();
	this.group = new THREE.Group;
	(function() {
		initShader();
		initMesh();
		initGlow();
		addListeners();
		_this.startRender(loop)
	}());

	function initMesh() {
		_body = new THREE.Group;
		_this.group.add(_body);
		_mat = new THREE.MeshBasicMaterial({
			color: 16777215
		});
		_mat.blending = THREE.AdditiveBlending;
		var rows = 30;
		_snake = new THREE.CylinderGeometry(0, 1.3, 12, 20, rows, true);
		var s = .15;
		_snake.scale(s, s * 1.2, s * .8);
		_snake.rotateZ(Utils.toRadians(180));
		var size = .5;
		var t = 0;
		for(var i = 0; i < _snake.vertices.length; i++) {
			var vert = _snake.vertices[i];
			x = Math.cos(t) * size;
			y = Math.sin(t) * size;
			var amount = 1;
			vert.x += x * amount;
			vert.z += y * amount;
			t += .0078;
			if(i > _snake.vertices.length - 10) vert.copy(_snake.vertices[_snake.vertices.length - 10])
		}
		_sphere = new THREE.SphereGeometry(.2, 40, 40, 0, Math.PI * 2, 0, Math.PI * 2);
		_geom = new THREE.Geometry;
		var body = new THREE.Mesh(_snake);
		body.updateMatrix();
		_geom.merge(body.geometry, body.matrix);
		var head = new THREE.Mesh(_sphere);
		head.position.set(-.1, 1.07, -.5);
		head.updateMatrix();
		_geom.merge(head.geometry, head.matrix);
		_tail = new THREE.Mesh(_geom, _shader.material);
		_body.add(_tail)
	}

	function initShader() {
		var light = new THREE.DirectionalLight(16777215);
		light.position.set(0, 2, 0);
		_shader = _this.initClass(Shader, "BlindedSnake");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			scale: {
				type: "f",
				value: .4
			},
			opacity: {
				type: "f",
				value: _block ? .2 : 0
			},
			headColor: {
				type: "c",
				value: new THREE.Color(16777215)
			},
			baseColor: {
				type: "c",
				value: new THREE.Color(1118481)
			},
			fMin: {
				type: "f",
				value: .8
			},
			fMax: {
				type: "f",
				value: .9
			},
			brightness: {
				type: "f",
				value: 1
			}
		};
		_shader.receiveLight = true;
		_shader.lights.push(light);
		_shader.material.blending = THREE.AdditiveBlending;
		ShaderUIL.instance().push(_shader)
	}

	function initGlow() {
		var tail = new THREE.Mesh(_snake, _mat);
		_body.add(tail);
		var head = new THREE.Mesh(_sphere, _mat);
		var s = .9;
		head.scale.set(s, s, s);
		head.position.set(-.1, 1.07, -.5);
		_body.add(head);
		if(_block) {
			FX.Light.instance().addOcclusion(tail);
			FX.Light.instance().addOcclusion(head)
		} else {
			FX.Light.instance().addLight(tail);
			FX.Light.instance().addLight(head)
		}
	}

	function loop() {
		_shader.set("time", _start + Render.TSL * .0001 * _strength.v);
		_body.rotation.y -= .022 * _speed.v
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count == 42) {
					if(_block) {
						_shader.tween("opacity", .6, 15e2, "easeOutBack", function() {
							_shader.tween("opacity", 1, 1e5, "easeInSine")
						})
					} else {
						_shader.tween("opacity", 1, 12e4, "easeInSine")
					}
				}
				break;
			case "bassIn":
			case "stall":
				_speed.v = .2;
				_shader.set("opacity", 1);
				_shader.tween("opacity", _block ? .4 : .2, 6e3, "easeOutSine", function() {
					_shader.tween("opacity", 1, 45e3, "easeInSine")
				});
			case "goFast":
				_speed.tween({
					v: 5
				}, 5e4, "easeInSine");
				break;
			case "goSlow":
				_speed.tween({
					v: 1
				}, 2e3, "easeOutSine");
				break;
			case "snake2Out":
				_shader.tween("opacity", .2, 4e4, "easeInSine");
				break
		}
	}
});
Class(function BlindedParticles() {
	Inherit(this, Component);
	var _this = this;
	var _shader, _mesh, _system, _background;
	this.group = new THREE.Group;
	var _move = new Vector2;
	var _position = new Vector2;
	var _mouse = new Vector2;
	(function() {
		initShader();
		initMesh();
		addListeners();
		_this.startRender(loop)
	}());

	function initShader() {
		_shader = _this.initClass(Shader, "BlindedParticles");
		_shader.uniforms = {
			opacity: {
				type: "f",
				value: .4
			},
			tMap0: {
				type: "t",
				value: Utils3D.getTexture("assets/images/scenes/blinded/particle.png")
			}
		};
		_shader.material.transparent = true;
		_shader.material.depthTest = false;
		_shader.material.blending = THREE.AdditiveBlending
	}

	function initMesh() {
		_system = _this.initClass(BlindedParticlesSystem, _shader);
		_this.group.add(_system.group);
		_system.init(_shader, function(mesh, system) {
			_mesh = mesh
		})
	}

	function loop() {
		if(!_mesh) return;
		_system.update();
		_mouse.lerp(Mouse, .1);
		_position.x = Utils.convertRange(_mouse.x, 0, Stage.width, -10, 10);
		_position.y = Utils.convertRange(_mouse.y, 0, Stage.height, -.5, -2);
		_move.lerp(_position, .05);
		_this.group.position.x = _move.x
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 10 == 2 && e.count > 40 && e.time < 134 && !_this.tweening) {
					_shader.set("opacity", .8);
					_shader.tween("opacity", .4, 4e3, "easeInOutSine")
				}
				break;
			case "goFast":
				_this.tweening = true;
				_shader.tween("opacity", 1, 5e4, "easeInSine");
				break;
			case "goSlow":
				_shader.tween("opacity", .4, 2e4, "easeOutSine");
				break
		}
	}
	this.onDestroy = function() {
		_mesh.material.dispose();
		_mesh.geometry.dispose()
	}
});
Class(function BlindedParticlesMovement() {
	Inherit(this, Component);
	var _this = this;
	var _v2 = new Vector2;
	var _v3 = new Vector3;
	var _projection = new ScreenProjection(World.CAMERA);
	var _dist = Math.pow(1e3, 2);
	var _speed = new DynamicObject({
		v: 1
	});

	function init(p) {
		p.speed = 100;
		p.v2 = (new Vector2).copy(p.pos);
		p.v2pos = (new Vector2).copy(p.pos);
		p.o = (new Vector2).copy(p.pos);
		p.v3 = new Vector3;
		p.rangeX = Utils.doRandom(-120, 120) * .01;
		p.rangeY = Utils.doRandom(-120, 120) * .01;
		p.speedX = Utils.doRandom(10, 50) / 2e4;
		p.speedY = .00001;
		p.speedFlow = Utils.doRandom(50, 100) / 250
	}(function() {
		addListeners()
	}());

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "stall":
				_speed.v = .2;
			case "goFast":
				_speed.tween({
					v: 14
				}, 5e4, "easeInSine");
				break;
			case "goSlow":
				_speed.tween({
					v: 1
				}, 2e3, "easeOutSine");
				break;
			case "snake2Out":
				break
		}
	}
	this.applyBehavior = function(p) {
		if(!p.speed) init(p);
		p.o.y -= .2 * _speed.v * p.speedFlow * 1.5;
		if(p.pos.y < -500) {
			p.o.y = 500;
			p.pos.y = 500;
			p.v2pos.copy(p.pos)
		}
		p.origin.x = p.o.x + Math.sin(Render.TIME * p.speedX) * p.rangeX;
		p.origin.y = p.o.y + Math.sin(Render.TIME * p.speedY);
		p.v3.set(p.pos.x, p.pos.y, p.pos.z);
		var screen = _projection.project(p.v3);
		_v2.subVectors(screen, Mouse);
		p.v2.copy(p.origin);
		p.v2pos.lerp(p.v2, .07);
		p.v2pos.copyTo(p.pos)
	}
});
Class(function BlindedParticlesSystem(_shader) {
	Inherit(this, Component);
	var _this = this;
	var _system, _mesh, _geom, _wrapper;
	var _shader, _callback;
	var _mouse = new Vector2;
	this.group = new THREE.Group;
	var NUM = 700;
	(function() {}());

	function initSystem() {
		_system = new ParticlePhysics;
		_system.addBehavior(new BlindedParticlesMovement)
	}

	function initGeom() {
		var index = 0;
		var position = new Float32Array(NUM * 3);
		var alpha = new Float32Array(NUM);
		var scale = new Float32Array(NUM);
		var life = new Float32Array(NUM);
		var worker = new DistributedWorker(1);
		worker.start(function() {
			var pos = new Vector3;
			pos.x = Utils.doRandom(-20, 20);
			pos.y = Utils.doRandom(-500, 500);
			pos.z = Utils.doRandom(80, 120);
			position[index + 0] = pos.x;
			position[index + 1] = pos.y;
			position[index + 2] = pos.z;
			alpha[index] = Utils.doRandom(50, 100) / 100;
			scale[index] = Utils.doRandom(50, 400) / 80;
			life[index] = 1;
			var p = new Particle(pos);
			_system.addParticle(p);
			p.origin = (new Vector3).copy(p.pos);
			index++;
			if(index == NUM) {
				worker.stop();
				initMesh(position, alpha, scale, life)
			}
		})
	}

	function initMesh(position, alpha, scale, life) {
		_geom = new THREE.BufferGeometry;
		_geom.addAttribute("position", new THREE.BufferAttribute(position, 3));
		_geom.addAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
		_geom.addAttribute("scale", new THREE.BufferAttribute(scale, 1));
		_geom.addAttribute("life", new THREE.BufferAttribute(life, 1));
		_mesh = new THREE.Points(_geom, _shader.material);
		_wrapper = new THREE.Group;
		_wrapper.add(_mesh);
		_this.group.add(_wrapper);
		_mesh.position.z = -150;
		_callback(_mesh, _system)
	}
	this.init = function(shader, callback) {
		_this = this;
		_shader = shader;
		_callback = callback;
		initSystem();
		initGeom()
	};
	this.update = function() {
		if(!_geom) return;
		_system.update();
		var updateLife = false;
		var p = _system.particles.start();
		var index = 0;
		while(p) {
			_geom.attributes.position.setXYZ(index, p.pos.x, p.pos.y, p.pos.z);
			if(typeof p.alpha == "number") {
				_geom.attributes.life.setX(index, p.alpha);
				updateLife = true
			}
			index++;
			p = _system.particles.next()
		}
		if(_wrapper && !_this.noRotation) {
			_mouse.lerp(Mouse, .02);
			_wrapper.rotation.y = Utils.convertRange(_mouse.x, 0, Stage.width, Utils.toRadians(-6), Utils.toRadians(6));
			_wrapper.rotation.x = Utils.convertRange(_mouse.y, 0, Stage.height, Utils.toRadians(-6), Utils.toRadians(6))
		}
		_geom.attributes.position.needsUpdate = true;
		if(updateLife) _geom.attributes.life.needsUpdate = true
	}
});
Class(function DriveBall() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _mat, _planet, _glow, _orb;
	var _shader, _light;
	var _speed = new DynamicObject({
		v: 1
	});
	var _strength = new DynamicObject({
		v: 0
	});
	var _mouse = new Vector2;
	var _position = new Vector2;
	var _move = new Vector2;
	this.group = new THREE.Group;
	_this.beatCount = 0;
	(function() {
		initShader();
		initBall();
		initGlow();
		addListeners();
		_this.startRender(loop)
	}());

	function initBall() {
		_geom = new THREE.SphereGeometry(1, 300, 300, 0, Math.PI * 2, 0, Math.PI * 2);
		_geom.rotateZ(Utils.toRadians(90));
		_mat = new THREE.MeshBasicMaterial({
			color: 11361791
		});
		_planet = new THREE.Mesh(_geom, _shader.material);
		_this.group.add(_planet)
	}

	function initShader() {
		_light = new THREE.DirectionalLight(11416762);
		_shader = _this.initClass(Shader, "DriveBall");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			baseColor: {
				type: "c",
				value: new THREE.Color(5592405)
			},
			headColor: {
				type: "c",
				value: new THREE.Color(11361791)
			},
			scale: {
				type: "f",
				value: 0
			},
			fHeight: {
				type: "f",
				value: 1.07
			},
			fMin: {
				type: "f",
				value: 0
			},
			fMax: {
				type: "f",
				value: 1
			},
			brightness: {
				type: "f",
				value: 0
			},
			saturate: {
				type: "f",
				value: .1
			}
		};
		_shader.receiveLight = true;
		_shader.lights.push(_light);
		ShaderUIL.instance().push(_shader)
	}

	function initGlow() {
		_glow = new THREE.Mesh(_geom, _mat);
		var s = 1.3;
		_glow.scale.set(s, s, s);
		_this.group.add(_glow);
		FX.Light.instance().addOcclusion(_planet);
		FX.Light.instance().addLight(_glow);
		_planet.position.z = -7;
		_glow.position.z = -9;
		_light.position.copy(_planet.position);
		_shader.set("brightness", .15);
		_shader.set("scale", .8);
		_strength.tween({
			v: 0
		}, 1e3, "linear")
	}

	function loop() {
		_shader.set("time", Render.TSL * .00015 + .02 * _strength.v);
		_mouse.lerp(Mouse, .2);
		_position.x = Utils.convertRange(_mouse.x, 0, Stage.width, -.1, .1);
		_position.y = Utils.convertRange(_mouse.y, 0, Stage.height, -.05, .05);
		_move.lerp(_position, .05);
		_this.group.position.x = _move.x;
		_this.group.position.y = _move.y;
		_planet.rotation.x += .0025 * _speed.v;
		_glow.position.x = _move.x;
		_light.position.copy(_planet.position);
		_light.position.z += 3;
		_light.position.y += 4
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 4 == 0 && e.count > 5) FX.Light.instance().bounce(2);
				if(_this.pulsate) {
					_speed.v = 3;
					_speed.tween({
						v: 1
					}, 800, "easeOutCubic")
				}
				break;
			case "beatIn":
				_this.pulsate = true;
				break;
			case "beatOut":
				_this.pulsate = false;
				break;
			case "glowIn":
				TweenManager.tween(_glow.position, {
					z: -8
				}, 2e4, "easeOutSine");
				break;
			case "zoomIn":
				_shader.tween("saturate", 1, 1e3, "easeOutSine");
				TweenManager.tween(_planet.position, {
					z: -1,
					y: -1.05
				}, 1e3, "easeOutCubic");
				TweenManager.tween(_glow.position, {
					z: -2,
					y: -2
				}, 1e3, "easeOutCubic");
				_shader.tween("scale", 2, 800, "easeOutCubic", function() {
					_shader.tween("scale", 4, 3e4, "easeInOutSine");
					_shader.tween("fHeight", 1.1, 3e4, "easeInOutSine")
				});
				_shader.tween("fHeight", 1.2, 1e3, "easeOutCubic");
				_shader.tween("brightness", .7, 800, "easeOutCubic");
				break;
			case "zoomOut":
				TweenManager.tween(_planet.position, {
					z: -7,
					y: 0
				}, 7e4, "easeInOutSine");
				TweenManager.tween(_glow.position, {
					z: -9,
					y: 0
				}, 7e4, "easeInOutSine");
				_this.delayedCall(function() {
					_shader.tween("scale", 1, 35e3, "easeInOutSine")
				}, 1e4);
				_shader.tween("fHeight", 1.07, 2e4, "easeInOutSine");
				_shader.tween("brightness", .2, 45e3, "easeInOutSine");
				_shader.tween("saturate", .1, 7e4, "easeInOutSine");
				break
		}
	}
	this.animateOut = function() {};
	this.animateIn = function() {}
});
Class(function EclipseElements() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _mat;
	var _block, _light;
	var _mouse = new Vector2;
	var _position = new Vector2;
	var _move = new Vector2;
	this.group = new THREE.Group;
	_this.beatCount = 0;
	_this.dropCount = 0;
	(function() {
		initPlanes();
		_this.startRender(loop)
	}());

	function initPlanes() {
		let geom = new THREE.BoxGeometry(1, 1, .1);
		_mat = new THREE.MeshBasicMaterial({
			color: 16777215
		});
		_light = new THREE.Mesh(geom, _mat);
		_this.group.add(_light);
		_light.position.z = -1.3;
		FX.Light.instance().addLight(_light);
		geom = new THREE.BoxGeometry(1, 1, .1);
		_block = new THREE.Mesh(geom, _mat);
		_block.position.z = -1.2;
		_this.group.add(_block);
		FX.Light.instance().addOcclusion(_block);
		_this.group.position.z = -2
	}

	function loop(t) {
		_mouse.lerp(Mouse, Mobile.phone ? .4 : .1);
		var x = .1;
		var y = .1;
		_position.x = Utils.range(_mouse.x, 0, Stage.width, x, -x);
		_position.y = Utils.range(_mouse.y, 0, Stage.height, -y, y);
		_move.lerp(_position, .05);
		_light.position.x = -_move.x;
		_light.position.y = -_move.y
	}
	this.animateOut = function() {};
	this.animateIn = function() {}
});
Class(function EverybodyElement(_number) {
	Inherit(this, Component);
	var _this = this;
	var $this;
	var _shader, _geometry, _system, _light, _mesh, _behavior, _converter, _camera;
	var _strength = new DynamicObject({
		v: 1
	});
	var _mouse = new Vector2;
	var _points;
	_this.group = new THREE.Group;
	(function() {
		initMesh();
		initParticles();
		addListeners();
		_this.startRender(loop);
		_this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initMesh() {
		_geometry = _number == 2 ? EverybodyElement.getGeom2() : EverybodyElement.getGeom1();
		_shader = new Shader("EverybodyElement");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			scale: {
				type: "f",
				value: .2
			},
			color0: {
				type: "c",
				value: new THREE.Color(1118481)
			},
			color1: {
				type: "c",
				value: new THREE.Color(0)
			},
			fogColor: {
				type: "c",
				value: new THREE.Color(0)
			},
			tNormal: {
				type: "t",
				value: Utils3D.getTexture("assets/images/scenes/woman/normal.jpg")
			},
			tMatcap: {
				type: "t",
				value: Utils3D.getTexture("assets/images/scenes/woman/reflection-matcap.jpg")
			},
			hueShift: {
				type: "f",
				value: 0
			},
			satShift: {
				type: "f",
				value: 0
			},
			varShift: {
				type: "f",
				value: -.9
			},
			opacity: {
				type: "f",
				value: 0
			},
			alpha: {
				type: "f",
				value: 1
			}
		};
		_light = new THREE.PointLight;
		_light.position.set(100, 100, 0);
		_shader.lights.push(_light);
		_shader.receiveLight = true;
		_shader.material.transparent = true;
		_shader.material.depthTest = false;
		_shader.material.blending = THREE.AdditiveBlending;
		_mesh = new THREE.Mesh(_geometry, _shader.material);
		_this.group.add(_mesh);
		FX.Light.instance().addLight(_mesh)
	}

	function initParticles() {
		_system = _this.initClass(ParticlePhysics);
		let scale = Utils.doRandom(.1, .5, 4);
		for(let i = 3; i < _geometry.vertices.length; i++) {
			let p = new Particle(new Vector3);
			p.pos.copy(_geometry.vertices[i]);
			p.index = i;
			p.vertice = _geometry.vertices[i];
			p.scale = scale;
			if(i % 3 == 0) scale = Utils.doRandom(.1, .5, 4);
			_system.addParticle(p)
		}
		_converter = _this.initClass(ParticlePhysicsBufferConverter, _geometry.buffer, _system);
		_camera = _this.initClass(ParticleEngineCameraTransfer, World.CAMERA);
		_behavior = _this.initClass(EverybodyParticlesBehavior, _camera);
		_system.addBehavior(_behavior)
	}

	function loop(t) {
		_shader.set("time", Render.TSL * .00015 * _strength.v);
		_camera.update();
		_behavior.update();
		_system.update();
		_mouse.lerp(Mouse, .1);
		_geometry.verticesNeedUpdate = true
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 4 == 0 && !_this.noBeat) {
					_shader.set("opacity", _this.dropped ? 1 : .4);
					_shader.tween("opacity", _this.dropped ? .6 : .2, 2e3, "easeInOutSine");
					_behavior.bounce()
				}
				break;
			case "dropIn":
				_this.dropped = true;
				_shader.tween("alpha", 1, 1e3, "easeOutSine");
				_behavior.join();
				break;
			case "dropOut":
				_this.dropped = false;
				_behavior.explode();
				_shader.tween("alpha", .2, 3e4, "easeInOutSine");
				break;
			case "end":
				_behavior.animateOut();
				break;
			case "out":
				break;
			case "saxIn":
				_this.noBeat = true;
				_shader.tween("alpha", .2, 2e4, "easeInOutSine");
				break;
			case "saxOut":
				_this.noBeat = false;
				_shader.tween("alpha", 1, 1e3, "easeOutSine", function() {
					_shader.tween("alpha", .2, 3e4, "easeInSine")
				});
				break
		}
	}
	this.animateIn = function() {
		_shader.set("alpha", 0);
		_shader.tween("alpha", .5, 5e4, "easeOutSine");
		_behavior.animateIn(_number == 2)
	}
}, () => {
	var _geom1, _geom2;
	EverybodyElement.getGeom1 = function() {
		if(!_geom2) {
			let geom = Utils3D.loadModelGeometry("everybody1");
			geom.scale(.065, .065, .02);
			geom.translate(-3.2, 0, -20);
			_geom1 = (new THREE.Geometry).fromBufferGeometry(geom);
			_geom1.computeBoundingBox();
			var vertices = [];
			for(var i = 0, il = _geom1.faces.length; i < il; i++) {
				var n = vertices.length;
				var face = _geom1.faces[i];
				var a = face.a;
				var b = face.b;
				var c = face.c;
				var va = _geom1.vertices[a];
				var vb = _geom1.vertices[b];
				var vc = _geom1.vertices[c];
				vertices.push(va.clone());
				vertices.push(vb.clone());
				vertices.push(vc.clone());
				face.a = n;
				face.b = n + 1;
				face.c = n + 2
			}
			_geom1.vertices = vertices;
			let count = _geom1.vertices.length;
			_geom1.buffer = new THREE.BufferGeometry;
			let position = new Float32Array(count * 3);
			let attribs = new Float32Array(count * 4);
			for(let i = 0; i < count; i++) {
				position[i * 3 + 0] = _geom1.vertices[i].x;
				position[i * 3 + 1] = _geom1.vertices[i].y;
				position[i * 3 + 2] = _geom1.vertices[i].z;
				attribs[i * 4 + 0] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 1] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 2] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 3] = Utils.doRandom(0, 1, 4)
			}
			_geom1.buffer.addAttribute("position", new THREE.BufferAttribute(position, 3));
			_geom1.buffer.addAttribute("attribs", new THREE.BufferAttribute(attribs, 4))
		}
		return _geom1
	};
	EverybodyElement.getGeom2 = function() {
		if(!_geom2) {
			let geom = Utils3D.loadModelGeometry("everybody2");
			geom.scale(.065, .065, .02);
			geom.translate(3.2, -.7, -20);
			_geom2 = (new THREE.Geometry).fromBufferGeometry(geom);
			_geom2.computeBoundingBox();
			var vertices = [];
			for(var i = 0, il = _geom2.faces.length; i < il; i++) {
				var n = vertices.length;
				var face = _geom2.faces[i];
				var a = face.a;
				var b = face.b;
				var c = face.c;
				var va = _geom2.vertices[a];
				var vb = _geom2.vertices[b];
				var vc = _geom2.vertices[c];
				vertices.push(va.clone());
				vertices.push(vb.clone());
				vertices.push(vc.clone());
				face.a = n;
				face.b = n + 1;
				face.c = n + 2
			}
			_geom2.vertices = vertices;
			let count = _geom2.vertices.length;
			_geom2.buffer = new THREE.BufferGeometry;
			let position = new Float32Array(count * 3);
			let attribs = new Float32Array(count * 4);
			for(let i = 0; i < count; i++) {
				position[i * 3 + 0] = _geom2.vertices[i].x;
				position[i * 3 + 1] = _geom2.vertices[i].y;
				position[i * 3 + 2] = _geom2.vertices[i].z;
				attribs[i * 4 + 0] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 1] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 2] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 3] = Utils.doRandom(0, 1, 4)
			}
			_geom2.buffer.addAttribute("position", new THREE.BufferAttribute(position, 3));
			_geom2.buffer.addAttribute("attribs", new THREE.BufferAttribute(attribs, 4))
		}
		return _geom2
	}
});
Class(function EverybodyParticlesBehavior(_camera) {
	Inherit(this, Component);
	var _this = this;
	var _dist = 0;
	var _strength = 0;
	var _radius = 0;
	var _range = 0;
	var _explode = 0;
	var _adjust = 1;
	var _projection = _this.initClass(ScreenProjection, World.CAMERA);
	var _v2 = new Vector2;
	var _velocity = new Vector2;
	var _prev = new Vector2;
	var _screen = new Vector2;
	var _v3 = new THREE.Vector3;
	var _blow = new DynamicObject({
		v: 12
	});
	var _bounce = new DynamicObject({
		v: 1
	});
	var _together = new DynamicObject({
		v: 1
	});
	var _lerp = Device.mobile ? .1 : .05;
	(function() {}());

	function init(p) {
		p.target = (new Vector3).copy(p.pos);
		p.origin = (new Vector3).copy(p.pos);
		p.move = (new Vector3).copy(p.pos);
		p.move.copy(p.origin);
		p.move.multiply(1 + p.scale * _blow.v)
	}
	this.update = function() {
		_screen.set(Stage.width, Stage.height);
		let screenLen = _screen.length();
		_range = .2;
		_radius = screenLen * _range;
		_dist = Math.pow(_radius, 2);
		_velocity.subVectors(Mouse, _prev);
		let len = _velocity.length();
		if(len > 100) len = 0;
		let strength = Utils.range(len, 0, screenLen / 40, 0, 1, true);
		_strength += (strength - _strength) * .2;
		_explode = Utils.range(_blow.v, 20, 0, .2, .01);
		_prev.copy(Mouse)
	};
	this.animateIn = function(_right) {
		_this.right = _right;
		_together.v = _this.right ? 5 : -5;
		TweenManager.tween(_together, {
			v: 0
		}, 8e4, "easeOutQuart")
	};
	this.animateOut = function() {};
	this.explode = function() {
		TweenManager.tween(_blow, {
			v: 40
		}, 3e4, "easeInOutSine");
		TweenManager.tween(_together, {
			v: _this.right ? 1 : -1
		}, 3e4, "easeInOutSine")
	};
	this.join = function() {
		TweenManager.tween(_blow, {
			v: 12
		}, 1e3, "easeOutSine");
		TweenManager.tween(_together, {
			v: 0
		}, 1e3, "easeOutCubic")
	};
	this.bounce = function() {
		_bounce.v = 1.4;
		TweenManager.tween(_bounce, {
			v: 1
		}, 2e3, "easeInOutSine")
	};
	this.applyBehavior = function(p) {
		if(!p.target) init(p);
		_v3.copy(p.pos);
		let screen = _projection.project(_v3);
		_v2.subVectors(screen, Mouse);
		p.move.copy(p.origin);
		p.move.multiply(1 + p.scale * _blow.v * _bounce.v);
		p.move.x += _together.v * 10;
		p.move.z += -1 + _bounce.v * 2;
		let lenSq = _v2.lengthSq();
		if(lenSq < _dist * _strength) {
			let angle = Math.atan2(_v2.y, _v2.x);
			_v2.copy(p.move).addAngleRadius(-angle, _radius * _strength * _adjust * _explode * p.scale);
			p.target.set(_v2.x, _v2.y, p.move.z)
		} else {
			p.target.lerp(p.move, _lerp)
		}
		p.pos.lerp(p.target, _lerp);
		p.vertice.copy(p.pos)
	};
	this.set("strength", v => {
		_adjust = v
	})
});
Class(function FlameFire() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _mat, _water, _sphere, _sun;
	var _shader, _light;
	var _speed = new DynamicObject({
		v: .15
	});
	var _strength = new DynamicObject({
		v: .3
	});
	var _mouse = new Vector2;
	var _position = new Vector2;
	var _move = new Vector2;
	var _elements;
	this.group = new THREE.Group;
	_this.beatCount = 0;
	(function() {
		initShader();
		initElements();
		initSun();
		initGlow();
		addListeners();
		_this.startRender(loop)
	}());

	function initElements() {
		_geom = new THREE.CylinderGeometry(0, .4, 1.4, 5, 3);
		_mat = new THREE.MeshBasicMaterial({
			color: 16777215
		});
		_elements = [];
		for(var i = 0; i < 40; i++) {
			let mesh = new THREE.Mesh(_geom, _shader.material);
			_elements.push(mesh);
			_this.group.add(mesh);
			mesh.oX = Utils.doRandom(-1, 1, 3) * .25;
			mesh.oZ = Utils.doRandom(-1, 1, 3) * .25;
			mesh.rotation.y = Utils.toRadians(Utils.doRandom(0, 360));
			mesh.s = Utils.doRandom(.2, .5, 4) * (1 - Math.abs(mesh.position.x) * Math.abs(mesh.position.z));
			if(i % 5 == 0) {
				mesh.s = Utils.doRandom(.2, .65, 4);
				mesh.oX *= .3;
				mesh.oZ *= .3
			} else {}
			FX.Light.instance().addLight(mesh)
		}
	}

	function initSun() {}

	function initShader() {
		_light = new THREE.DirectionalLight(16777215);
		_light.position.set(0, 2, 2);
		_shader = _this.initClass(Shader, "FlameFire");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			baseColor: {
				type: "c",
				value: new THREE.Color(5592405)
			},
			headColor: {
				type: "c",
				value: new THREE.Color(16777215)
			},
			scale: {
				type: "f",
				value: 0
			},
			saturation: {
				type: "f",
				value: 1
			},
			fHeight: {
				type: "f",
				value: 6
			},
			fMin: {
				type: "f",
				value: 0
			},
			fMax: {
				type: "f",
				value: 1
			},
			brightness: {
				type: "f",
				value: 0
			}
		};
		_shader.receiveLight = true;
		_shader.lights.push(_light);
		_shader.material.transparent = true;
		_shader.material.blending = THREE.AdditiveBlending;
		_shader.material.side = THREE.DoubleSide;
		ShaderUIL.instance().push(_shader)
	}

	function initGlow() {
		_shader.set("brightness", 2.5);
		_shader.set("scale", .5)
	}

	function loop() {
		_shader.set("time", Render.TSL * .001 * _strength.v);
		_mouse.lerp(Mouse, .15);
		let offset = Utils.range(_speed.v, 0, 1, .5, 1);
		for(var i = _elements.length - 1; i > -1; i--) {
			let element = _elements[i];
			s = .55 * _speed.v + Math.sin((Render.TSL + i * 60) * .005) * .5 * _speed.v;
			s *= element.s;
			element.scale.set(element.s * offset, s, element.s * offset);
			element.rotation.y += .002 * _speed.v;
			element.position.y = Utils.range(s, 0, 1, -.65, 0) + .1;
			element.position.x = element.oX * Utils.range(_speed.v, 0, 1, .3, 1);
			element.position.z = element.oZ * Utils.range(_speed.v, 0, 1, .3, 1)
		}
		_shader.set("saturation", Utils.range(_speed.v, 0, 1, .8, 1));
		_position.x = Utils.range(_mouse.x, 0, Stage.width, -.1, .1);
		_position.y = Utils.range(_mouse.y, 0, Stage.height, -.7, 1);
		_move.lerp(_position, .05)
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count < 8) return;
				let ammount = e.count % 8 == 0 && e.count > 67 ? 3 : .8;
				FX.Light.instance().bounce(ammount);
				break;
			case "flameStart":
				_speed.tween({
					v: .5
				}, 6e4, "easeInOutSIne");
				break;
			case "flameIn":
				_strength.v = 1;
				_speed.tween({
					v: 1
				}, 500, "easeOutSIne");
				break;
			case "flameOut":
				_strength.v = .3;
				_speed.tween({
					v: .3
				}, 5e4, "easeOutSIne");
				break
		}
	}
	this.animateOut = function() {};
	this.animateIn = function() {}
});
Class(function FlameParticles() {
	Inherit(this, Component);
	var _this = this;
	var _engine, _system, _shader, _life, _flow, _attributes;
	var _config = require("FlameConfig");
	var _scale = new DynamicObject({
		v: .001
	});
	var _speed = new DynamicObject({
		V: .2
	});
	this.group = new THREE.Group;
	(function() {
		ParticleBehaviors.GPGPU = Tests.useGPGPU();
		if(Tests.useGPGPU()) FlameParticles.getBuffer(Tests.flameParticleCount()).then(initEngine)
	}());

	function initEngine(data) {
		let System = Tests.useGPGPU() ? ParticleEngineGPU : ParticleEngineCPU;
		let config = {
			threads: 2,
			pointSize: .004 * World.DPR,
			renderer: World.RENDERER,
			particleCount: Tests.flameParticleCount()
		};
		_engine = _this.initClass(ParticleEngine, data, "FlameParticles", System, config);
		_this.group.add(_engine.group);
		_system = _engine.system;
		_engine.events.add(HydraEvents.READY, engineReady);
		initBehaviors(data)
	}

	function initBehaviors(data) {
		let attributes = _this.initClass(AntimatterAttribute, data.attributes, 4);
		let life = ParticleBehaviors.get("Life");
		if(life.pass) {
			life.pass.addInput("tDecay", attributes);
			life.pass.origin = _this.initClass(AntimatterAttribute, data.life, 3)
		}
		_engine.addBehavior(life);
		let flow = ParticleBehaviors.get("FlameFlow");
		if(flow.pass) {
			flow.pass.addInput("tOrigin", _system.antimatter.vertices);
			flow.pass.addInput("tLife", life.pass.output);
			flow.pass.addInput("tProperties", attributes)
		}
		_engine.addBehavior(flow);
		_life = life;
		_flow = flow;
		_attributes = attributes
	}

	function getGradient() {
		let array = [];
		let color = new THREE.Color;
		_config.gradient.forEach(c => {
			color.setHex(c);
			array.push(color.r, color.g, color.b)
		});
		return array
	}

	function loop() {}

	function engineReady() {
		_this.ready = true;
		_engine.mesh.renderOrder = 9999;
		_shader = _engine.shader;
		_shader.material.blending = THREE.AdditiveBlending;
		_shader.material.transparent = true;
		_shader.material.depthWrite = false;
		_shader.uniforms.alpha = {
			type: "f",
			value: 0
		};
		_shader.uniforms.tLife = {
			type: "t",
			value: _life.pass.output
		};
		_shader.uniforms.tProperties = {
			type: "t",
			value: _attributes.texture
		};
		_shader.uniforms.tMap = {
			type: "t",
			value: Utils3D.getTexture("assets/images/scenes/flame/particle.png")
		};
		_shader.uniforms.colors = {
			type: "fv",
			value: getGradient()
		};
		_shader.uniforms.hue = {
			type: "f",
			value: 0
		};
		let depth = _system.getOverrideShader("FireParticlesDepth");
		depth.uniforms = _shader.uniforms;
		depth.material.depthWrite = false;
		_engine.mesh.depthMaterial = depth.material;
		FX.Depth.instance().add(_engine.mesh);
		_this.delayedCall(() => _this.animateIn(), 100)
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				break;
			case "flameStart":
				_shader.tween("alpha", .08, 6e4, "easeInOutSIne");
				break;
			case "flameIn":
				_shader.tween("alpha", 1, 500, "easeOutSine");
				break;
			case "flameOut":
				_shader.tween("alpha", .02, 5e4, "easeOutSine");
				break
		}
	}
	this.animateIn = function() {
		if(!Tests.useGPGPU()) return;
		_this.wait(() => {
			_this.startRender(loop);
			_engine.startRender();
			addListeners();
			_shader.set("alpha", 0)
		}, _this, "ready")
	};
	this.animateOut = function() {
		if(!_shader) return;
		_shader.tween("alpha", 0, 15e2, "easeOutSine", function() {
			_engine.stopRender();
			_this.group.visible = false
		})
	};
	this.grow = function() {};
	this.prerender = function() {
		if(!Tests.useGPGPU()) return Promise.resolve();
		let promise = Promise.create();
		_this.wait(() => {
			_engine.onReady().then(() => {
				_engine.startRender();
				_this.delayedCall(() => {
					_engine.stopRender();
					promise.resolve()
				}, 500)
			})
		}, _this, "ready");
		return promise
	}
}, () => {
	var _data;
	FlameParticles.getBuffer = function(size) {
		if(_data) return Promise.resolve(_data);
		let promise = Promise.create();

		function generate(e, id) {
			let num = Math.round(e.size);
			let position = new Float32Array(num * 3);
			let attributes = new Float32Array(num * 4);
			let life = new Float32Array(num * 3);
			let vec3 = new Vector3;
			for(var i = 0; i < num; i++) {
				vec3.x = Utils.doRandom(-.5, .5, 5);
				vec3.y = Utils.doRandom(-.5, .5, 5);
				vec3.z = Utils.doRandom(-.5, .5, 5);
				vec3.normalize().multiply(Utils.doRandom(0, .2, 4));
				position[i * 3 + 0] = vec3.x;
				position[i * 3 + 1] = vec3.y;
				position[i * 3 + 2] = vec3.z;
				attributes[i * 4 + 0] = Utils.doRandom(0, 1, 5);
				attributes[i * 4 + 1] = Utils.doRandom(0, 1, 5);
				attributes[i * 4 + 2] = Utils.doRandom(0, 1, 5);
				attributes[i * 4 + 3] = Utils.doRandom(0, 1, 5);
				life[i * 3 + 0] = i / num
			}
			post({
				vertices: position,
				attributes,
				life
			}, id, [position.buffer, attributes.buffer, life.buffer])
		}
		let ThreadClass = Hardware.getThreadType();
		let thread = new ThreadClass;
		thread.importClass(Vector3);
		thread.loadFunction(generate);
		thread.generate({
			size
		}, data => {
			_data = data;
			promise.resolve(data)
		});
		return promise
	}
});
ParticleBehaviors.Class(function FlameFlow() {
	Inherit(this, ParticleBehavior);
	var _this = this;
	var _speed = new DynamicObject({
		v: 1
	});

	function loop() {
		let scale = 1 + .5 * _speed.v + Math.sin(Render.TIME * .004) * .7 * _speed.v * (Math.sin(Render.TIME * .001) * .7) * 1.5 * _speed.v;
		_this.updateUniform("curlScale", scale)
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				break;
			case "flameStart":
				_speed.tween({
					v: .3
				}, 6e4, "easeInOutSIne");
				break;
			case "flameIn":
				_speed.tween({
					v: 1
				}, 500, "easeOutSIne");
				break;
			case "flameOut":
				_speed.tween({
					v: .3
				}, 5e4, "easeOutSIne");
				break
		}
	}
	this.initGPU = function() {
		_this.pass = new AntimatterPass("FlameFlow")
	};
	this.applyBehavior = function(p) {};
	this.onReady = function(antimatter) {
		if(antimatter) {
			this.addUniform("curlScale", 1);
			_this.startRender(loop)
		}
	}
});
ParticleBehaviors.Class(function Life() {
	Inherit(this, ParticleBehavior);
	var _this = this;

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				break;
			case "flameStart":
				_this.tween("decay", .01, 5e4, "easeOutSine");
				break;
			case "flameIn":
				_this.tween("decay", .006, 500, "easeOutSine");
				break;
			case "flameOut":
				_this.tween("decay", .01, 5e4, "easeOutSine");
				break
		}
	}
	this.initGPU = function() {
		_this.pass = new AntimatterPass("Life")
	};
	this.applyBehavior = function(p) {};
	this.onReady = function(antimatter) {
		if(antimatter) {
			this.addUniform("decay", .05);
			addListeners()
		}
	}
});
Class(function NinetyMask() {
	Inherit(this, Component);
	var _this = this;
	var _canvas, _context, _stamp;
	var _last = new Vector2;
	var _mouse = new Vector2;
	var _v = new Vector2;
	var _stage = new Vector2;
	const SCALE = 1.2;
	(function() {
		_this.startRender(loop);
		initCanvas()
	}());

	function initCanvas() {
		_canvas = new Canvas(256, 256);
		_context = _canvas.context;
		_stamp = Images.createImg("assets/images/common/dot.png");
		_stamp.onload = function() {
			_stamp.width *= SCALE;
			_stamp.height *= SCALE
		};
		_this.texture = new THREE.Texture(_canvas.div)
	}

	function loop() {
		_context.fillStyle = "#000";
		_context.globalAlpha = .03;
		_context.fillRect(0, 0, _canvas.width, _canvas.height);
		_context.globalAlpha = 1;
		_mouse.lerp(Mouse, .4);
		_stage.set(Stage.width, Stage.height);
		let length = _v.subVectors(_mouse, _last).length();
		if(length < 50) {
			let delta = length / _stage.length();
			let scale = Utils.range(delta, 0, .14, 1, 3.5) * Utils.range(delta, 0, .005, 0, 1, true) * (Device.mobile ? .45 : .35);
			let num = Utils.range(delta, 0, .14, 3, 10);
			let sw = _stamp.width * scale;
			let sh = _stamp.height * scale;
			for(let i = 0; i < num; i++) {
				_v.copy(_last).lerp(_mouse, i / num);
				_context.drawImage(_stamp, Utils.range(_v.x, 0, Stage.width, 0, 256) - sw / 2, Utils.range(_v.y, 0, Stage.height, 0, 256) - sh / 2, sw, sh)
			}
			_this.texture.needsUpdate = true
		}
		_last.copy(Mouse)
	}
	this.onDestroy = function() {}
});
Class(function NinetyParticles() {
	Inherit(this, Component);
	var _this = this;
	var _antimatter, _texture, _shader, _wrapper, _projection, _pass;
	var _mask;
	var _explode = new DynamicObject({
		v: Tests.socialBrowser() ? .1 : .01
	});
	var _bounce = new DynamicObject({
		v: 0
	});
	this.group = new THREE.Group;
	var _lights = [{
		pos: new THREE.Vector4(0, -100, 0, .5),
		falloff: 400,
		range: new THREE.Vector3(1, 1, 1),
		color: 4491519,
		name: "light1"
	}, {
		pos: new THREE.Vector4(100, 100, 0, .5),
		falloff: 400,
		range: new THREE.Vector3(1, 1, 1),
		color: 65535,
		name: "light2"
	}];
	var _particles = Tests.ninetyParticleCount();
	var _size = .11;
	if(_particles == 256) _size = .05;
	if(_particles == 512) _size = .03;
	var _debug = [];
	var _distort = {
		type: "f",
		value: 0
	};
	var _center = new Vector2;
	var _calc = new Vector2;
	var _mouse = new Vector2;
	var _rotation = new Vector2;
	var _target = 0;
	var _depth = 300;
	var _video = Data.Player.video;
	(function() {
		initProjection();
		initVideo();
		initAntimatter();
		addListeners()
	}());

	function initVideo() {
		if(Tests.socialBrowser()) {
			img = new Image;
			img.src = "assets/audio/tracks/1995.jpg";
			_texture = new THREE.Texture(img)
		} else {
			_video.size(256, 256);
			_texture = new THREE.Texture(_video.div)
		}
		_texture.needsUpdate = true;
		if(!Tests.useGPGPU() && !Tests.socialBrowser()) {
			Stage.add(_video);
			_video.object.show();
			_video.object.center().mouseEnabled(false);
			let scaleX = Utils.range(Stage.width, 0, 256, 0, 1);
			let scaleY = Utils.range(Stage.height, 0, 256, 0, 1);
			let scale = Math.min(scaleY, scaleX);
			_video.object.transform({
				scale: scale,
				y: 0
			}).transformPoint("50%", "50%");
			_video.object.css({
				opacity: 0
			}).tween({
				opacity: .5
			}, 5e3, "easeInOutSine")
		}
	}

	function initAntimatter() {
		GeomThread.instance().plugin("generateKinectMap", function(thread) {
			_antimatter = _this.initClass(Antimatter, _particles * _particles, World.RENDERER);
			_antimatter.vertices = new AntimatterAttribute(thread.vertices, 4);
			_antimatter.vertexShader = "NinetyParticles";
			_antimatter.fragmentShader = "NinetyParticles";
			_antimatter.ready(particleReady)
		})
	}

	function particleReady() {
		_particles = new THREE.Group;
		_wrapper = new THREE.Group;
		if(Tests.useGPGPU()) _this.group.add(_wrapper);
		var mesh = _antimatter.getMesh();
		_shader = _antimatter.shader;
		_shader.material.blending = THREE.AdditiveBlending;
		_shader.material.transparent = true;
		_shader.material.depthWrite = false;
		_particles.add(mesh);
		_wrapper.add(_particles);
		_shader.uniforms.fAlpha = {
			type: "f",
			value: 1
		};
		_shader.uniforms.time = {
			type: "f",
			value: 1
		};
		_shader.uniforms.highlight = {
			type: "f",
			value: 0
		};
		_shader.uniforms.explode = {
			type: "f",
			value: _explode.v
		};
		_shader.uniforms.bounce = {
			type: "f",
			value: _bounce.v
		};
		_shader.uniforms.pointSize = {
			type: "f",
			value: _size
		};
		_shader.uniforms.tMap = {
			type: "t",
			value: Utils3D.getTexture("assets/images/scenes/ninetyfive/particle.png")
		};
		_shader.uniforms.tKinect = {
			type: "t",
			value: _texture
		};
		_shader.uniforms.tOrigin = {
			type: "t",
			value: _antimatter.vertices.texture
		};
		_shader.uniforms.tMask = {
			type: "t",
			value: _mask.texture
		};
		_shader.uniforms.projMatrix = _projection.uniforms.projMatrix;
		_shader.uniforms.mouse = _projection.uniforms.pos;
		_shader.uniforms.resolution = {
			type: "v2",
			value: new THREE.Vector2(Stage.width, Stage.height)
		};
		let getAttribs = () => {
			let array = _antimatter.createFloatArray(3);
			let len = array.length / 3;
			for(let i = 0; i < len; i++) array[i * 3] = Utils.doRandom(0, 1, 4);
			return new AntimatterAttribute(array)
		};
		_pass = new AntimatterPass("BlowUp");
		_pass.addInput("tOrigin", _antimatter.vertices);
		_pass.addInput("attrib", {
			type: "t",
			value: getAttribs().texture
		});
		_pass.addInput("explode", {
			type: "f",
			value: _explode.v
		});
		_pass.addInput("bounce", {
			type: "f",
			value: _bounce.v
		});
		_antimatter.addPass(_pass);
		_this.startRender(loop)
	}

	function initProjection() {
		_projection = _this.initClass(GLScreenProjection, World.CAMERA, Mouse);
		_projection.start();
		_mask = _this.initClass(NinetyMask)
	}

	function loop(t) {
		_shader.uniforms.time.value = Render.TSL * .0003;
		if(_video && _video.ready() && !_this.dropped) _texture.needsUpdate = true;
		if(_antimatter) _antimatter.update();
		_mouse.lerp(Mouse, .05);
		_shader.uniforms.explode.value = _explode.v;
		_shader.uniforms.bounce.value = _bounce.v;
		_pass.uniforms.explode.value = _explode.v;
		_pass.uniforms.bounce.value = _bounce.v;
		_shader.uniforms.resolution.value.set(Stage.width * World.DPR, Stage.height * World.DPR);
		if(_this.dropped) {}
		var rotation = Utils.toRadians(45);
		_wrapper.rotation.y = Utils.range(_mouse.x, 0, Stage.width, -rotation, rotation) + Math.sin(t * .0005) * .15;
		_wrapper.rotation.x = Utils.range(_mouse.y, 0, Stage.height, -rotation * .5, rotation * .3) + Math.cos(t * .0003) * .15
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 2 == 0) {
					_bounce.v = 1;
					_bounce.tween({
						v: 0
					}, 800, "easeInOutSine")
				}
				break;
			case "beatHit":
				_particles.rotation.y += Utils.toRadians(90);
				_shader.set("highlight", 1);
				_shader.tween("highlight", 0, 2e3, "easeOutSine");
				_particles.scale.set(1.5, 1.5, 1.5);
				TweenManager.tween(_particles.scale, {
					x: 1,
					y: 1,
					z: 1
				}, 5e3, "easeInOutSine");
				break;
			case "bassHit":
				_shader.set("highlight", 1);
				_shader.tween("highlight", 0, 4e3, "easeOutSine");
				break;
			case "dropIn":
				_this.dropped = true;
				_shader.set("highlight", 1);
				_shader.tween("highlight", 0, 2e3, "easeOutSine");
				_explode.tween({
					v: 1
				}, 2e3, "easeOutExpo");
				break;
			case "dropOut":
				_this.dropped = false;
				TweenManager.tween(_particles.rotation, {
					x: 0,
					y: Utils.toRadians(720),
					z: 0
				}, _this.second ? 4e3 : 95e2, "easeInOutSine", function() {
					_particles.rotation.y = 0
				});
				_explode.tween({
					v: Tests.socialBrowser() ? .1 : .01
				}, _this.second ? 4e3 : 95e2, "easeInOutSine");
				_this.second = true;
				break
		}
	}
	this.update = function() {};
	this.onDestroy = function() {
		if(!Tests.useGPGPU() && _video) _video.object.tween({
			opacity: 0
		}, 500, "easeOutSine", function() {
			_video.object.hide()
		})
	}
});
Class(function OceansWater() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _mat, _water, _sphere, _sun, _balls, _ball;
	var _shader, _light;
	var _speed = new DynamicObject({
		v: 1
	});
	var _brightness = new DynamicObject({
		v: 0
	});
	var _dropped = new DynamicObject({
		v: 0
	});
	var _strength = new DynamicObject({
		v: .5
	});
	var _extra = new DynamicObject({
		v: 0
	});
	var _mouse = new Vector2;
	var _position = new Vector2;
	var _move = new Vector2;
	this.group = new THREE.Group;
	_this.beatCount = 0;
	_this.dropCount = 0;
	(function() {
		initShader();
		initWater();
		initBalls();
		animateIn();
		addListeners();
		_this.startRender(loop)
	}());

	function initWater() {
		_geom = new THREE.PlaneGeometry(10, 10, 16, 16);
		_geom.rotateX(Utils.toRadians(-90));
		for(var i = 0; i < _geom.vertices.length; i++) {
			var vert = _geom.vertices[i];
			vert.z += Utils.doRandom(-1, 1, 3) * .15;
			vert.x += Utils.doRandom(-1, 1, 3) * .15
		}
		_mat = new THREE.MeshBasicMaterial({
			color: 16777215
		});
		_water = new THREE.Mesh(_geom, _shader.material);
		_this.group.add(_water);
		FX.Light.instance().addLight(_water)
	}

	function initBalls() {
		_balls = [];
		let material = new THREE.MeshBasicMaterial({
			map: Utils3D.getTexture("assets/images/scenes/oceans/glow.png")
		});
		material.transparent = true;
		material.depthTest = false;
		material.blending = THREE.AdditiveBlending;
		let material2 = new THREE.MeshBasicMaterial({
			map: Utils3D.getTexture("assets/images/scenes/oceans/glow2.png")
		});
		material2.transparent = true;
		material2.depthTest = false;
		material2.blending = THREE.AdditiveBlending;
		let geom = new THREE.PlaneGeometry(6, 6, 16, 16);
		for(var i = 0; i < 100; i++) {
			let ball = new THREE.Mesh(geom, i % 2 == 0 ? material : material2);
			_this.group.add(ball);
			let x = Utils.doRandom(-25, 25, 3);
			let y = Utils.doRandom(-5, 5, 3);
			let z = Utils.doRandom(0, -60, 3);
			ball.position.set(x, y, z);
			_balls.push(ball)
		}
	}

	function initShader() {
		_light = new THREE.DirectionalLight(16777215);
		_shader = _this.initClass(Shader, "OceansWater");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			baseColor: {
				type: "c",
				value: new THREE.Color(5592405)
			},
			headColor: {
				type: "c",
				value: new THREE.Color(16777215)
			},
			scale: {
				type: "f",
				value: 0
			},
			fHeight: {
				type: "f",
				value: 1
			},
			fMin: {
				type: "f",
				value: 0
			},
			fMax: {
				type: "f",
				value: 1
			},
			brightness: {
				type: "f",
				value: 0
			},
			alpha: {
				type: "f",
				value: 1
			},
			opacity: {
				type: "f",
				value: .5
			}
		};
		_shader.receiveLight = true;
		_shader.lights.push(_light);
		_shader.material.transparent = true;
		_shader.material.depthTest = false;
		_shader.material.blending = THREE.AdditiveBlending;
		_shader.material.side = THREE.DoubleSide;
		ShaderUIL.instance().push(_shader)
	}

	function animateIn() {
		_water.position.set(0, -.05, -6);
		_water.rotation.set(Utils.toRadians(5), Utils.toRadians(-225), 0);
		_light.position.set(0, -.6, -7);
		TweenManager.tween(_light.position, {
			y: 1
		}, 12e4, "easeInOutSine");
		_shader.set("brightness", .5);
		_shader.set("scale", .2);
		_strength.v = .1;
		_strength.tween({
			v: .9
		}, 12e4, "easeInOutSine")
	}

	function loop(t) {
		_shader.set("time", Render.TSL * .00015);
		_mouse.lerp(Mouse, .15);
		_position.x = Utils.range(_mouse.x, 0, Stage.width, -.1, .1);
		_position.y = Utils.range(_mouse.y, 0, Stage.height, -.7, 1);
		_move.lerp(_position, .05);
		if(Global.WORM_POSITION) {
			_light.position.x = Global.WORM_POSITION.x * .3;
			_light.position.z = -4 - Global.WORM_POSITION.y * .5
		}
		for(var i = 0; i < _balls.length; i++) {
			let ball = _balls[i];
			let offsetY = -14 + 10 * _dropped.v;
			ball.position.y = offsetY + Math.sin(t * .0002 + i) * 5 * _dropped.v;
			ball.position.z += .07;
			if(ball.position.z > 0) ball.position.z = -60;
			let offset = Utils.range(ball.position.x, -25, 25, -.1, .1);
			let dif = Math.abs(offset - _move.x);
			ball.position.y += Utils.range(dif, 0, .1, 2, 0, true);
			ball.material.opacity = _dropped.v * .04 * _extra.v;
			let s = Utils.range(ball.position.z, -60, 0, .1, 2.5, true) + Math.sin(t * .016 + i) * .07;
			s *= Utils.range(ball.position.z, -60, -50, 0, 1, true);
			ball.scale.set(s, s, s)
		}
		_this.group.position.x = _move.x;
		_this.group.position.y = -.7 + _dropped.v * 2.5;
		Global.WATER_POSITION = _this.group.position;
		let brightness = 3 + _light.position.y * .4;
		_shader.set("fHeight", Utils.range(_dropped.v, 0, 1, .2 + _strength.v, 2) + _extra.v);
		_shader.set("brightness", Utils.range(_dropped.v, 0, 1, 3, 7) + _brightness.v);
		FX.Light.instance().volume.set("fExposure", Utils.range(_dropped.v, 0, 1, .1, .999))
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 8 == 0 && e.count > 30) {
					_shader.set("opacity", 1);
					_shader.tween("opacity", .5, 5e3, "easeInOutSine");
					if(_this.dropped) {
						_extra.v = 1;
						_extra.tween({
							v: 0
						}, 4e3, "easeInOutSine")
					}
				}
				break;
			case "dip":
				_shader.tween("alpha", .3, 15e2, "easeOutSine", function() {
					_shader.tween("alpha", 1, 1e4, "easeInOutSine")
				});
				break;
			case "dropIn":
				_this.dropCount++;
				Global.DROPPED = _this.dropped = true;
				_dropped.tween({
					v: 1
				}, _this.dropCount == 2 ? 2e4 : 4e3, "easeInOutQuart");
				break;
			case "dropOut":
				Global.DROPPED = _this.dropped = false;
				_dropped.tween({
					v: 0
				}, 3e4, "easeInOutSine");
				break
		}
	}
	this.animateOut = function() {};
	this.animateIn = function() {}
});
Class(function PaintingElements(_color) {
	Inherit(this, Component);
	var _this = this;
	var _mouse = new Vector2(Stage.width / 2, Stage.height / 2);
	var _move = new Vector2;
	var _position = new Vector2;
	var _auto = new Vector2;
	var _material, _material2;
	var _elements;
	var _scale = new DynamicObject({
		v: .001
	});
	var _moved = new DynamicObject({
		v: 1
	});
	this.group = new THREE.Group;
	var _count = 50;
	_this.beatCount = 0;
	(function() {
		initPieces();
		addListeners();
		_this.startRender(loop)
	}());

	function initPieces() {
		var geom = new THREE.SphereGeometry(.3, 25, 25, 0, Math.PI * 2, 0, Math.PI * 2);
		_material = new THREE.MeshBasicMaterial({
			color: _color ? 1006679 : 2236962
		});
		_material.transparent = true;
		_material.depthTest = false;
		_material.blending = THREE.SubtractiveBlending;
		_elements = [];
		for(var i = 0; i < _count; i++) {
			let material = new THREE.MeshBasicMaterial({
				color: _color ? 1286 : 328965
			});
			material.transparent = true;
			material.depthTest = false;
			material.blending = THREE.AdditiveBlending;
			var element = new THREE.Mesh(geom, material);
			FX.Light.instance().addOcclusion(element);
			let scale = Utils.range(i, 0, _count - 1, 1, .001);
			element.scale.set(scale, scale, scale);
			element.lerp = Utils.range(i, 0, _count, .2, .3);
			element.move = new Vector2;
			element.position.z = -8 + i * .04;
			_this.group.add(element);
			_elements.push(element)
		}
	}

	function loop() {
		_auto.x = Math.sin(Render.TIME * .0018) * .5;
		_auto.y = Math.sin(Render.TIME * .0014) * .3;
		_mouse.lerp(Mouse, Device.mobile ? .1 : .075);
		let scaleX = Utils.convertRange(Stage.width, 0, 300, 0, 1);
		let scaleY = Utils.convertRange(Stage.height, 0, 300, 0, 1);
		if(Mobile.phone) {
			scaleX *= _color ? 2.5 : 1.5;
			scaleY *= 1.5
		}
		_move.x = Utils.range(_mouse.x, 0, Stage.width, -1, 1) * scaleX;
		_move.y = Utils.range(_mouse.y, 0, Stage.height, 1, -1) * scaleY;
		_move.x += _auto.x * _moved.v;
		_move.y += _auto.y * _moved.v;
		for(var i = 0; i < _elements.length; i++) {
			let element = _elements[i];
			let previous = i == 0 ? _move : _elements[i - 1].move;
			element.move.lerp(previous, Utils.range(i, 0, _elements.length - 1, .8, .5));
			element.position.x = element.move.x + Math.sin((Render.TIME + i * 10) * .002) * .1;
			element.position.y = element.move.y + Math.sin((Render.TIME + i * 10) * .002) * .1;
			if(_color && Global.WATER_POSITION) {
				let y = Global.WATER_POSITION.y * 1.5 - element.position.y;
				element.material.opacity = y < 1 ? 1 : .3
			}
			let scale = Utils.range(i, 0, _count - 1, 1 + _scale.v, .001);
			element.scale.set(scale, scale, scale)
		}
		Global.WORM_POSITION = _move
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit);
		Stage.bind("touchmove", move)
	}

	function move() {
		if(!_this.moved) _moved.tween({
			v: 0
		}, 500, "easeOutSine");
		_this.moved = true;
		clearTimeout(_this.timeout);
		_this.timeout = _this.delayedCall(function() {
			_this.moved = false;
			if(!_this.moved) _moved.tween({
				v: 1
			}, 4e3, "easeInOutSine")
		}, 200)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % (_color ? 8 : 4) == 0 && e.count > 2 && (e.count < 485 || _color)) {
					if(_this.dropped) {
						_scale.v = .8;
						_scale.tween({
							v: .001
						}, 15e2, "easeInOutSine")
					}
				}
				break;
			case "bassIn":
				_this.bassIn = true;
				break;
			case "dropIn":
				_this.dropped = true;
				break;
			case "dropOut":
				_this.dropped = false;
				break
		}
	}
	this.animateOut = function() {};
	this.animateIn = function() {};
	this.onDestroy = function() {
		Stage.unbind("touchmove", move)
	}
});
Class(function PaintingParticles() {
	Inherit(this, Component);
	var _this = this;
	var _shader, _mesh, _system, _background;
	this.group = new THREE.Group;
	var _move = new Vector2;
	var _position = new Vector2;
	var _mouse = new Vector2;
	(function() {
		initShader();
		initMesh();
		Render.start(loop)
	}());

	function initShader() {
		_shader = _this.initClass(Shader, "PaintingParticles");
		_shader.uniforms = {
			alpha: .2,
			tMap0: {
				type: "t",
				value: Utils3D.getTexture("assets/images/scenes/painting/particle.png")
			}
		};
		_shader.material.transparent = true;
		_shader.material.depthTest = false;
		_shader.material.blending = THREE.AdditiveBlending
	}

	function initMesh() {
		_system = _this.initClass(PaintingParticlesSystem, _shader);
		_this.group.add(_system.group);
		_system.init(_shader, function(mesh, system) {
			_mesh = mesh
		})
	}

	function loop() {
		if(!_mesh) return;
		_system.update();
		_mouse.lerp(Mouse, .1);
		_position.x = Utils.convertRange(_mouse.x, 0, Stage.width, -10, 10);
		_position.y = Utils.convertRange(_mouse.y, 0, Stage.height, -.5, -2);
		_move.lerp(_position, .05)
	}
	this.onDestroy = function() {
		Render.stop(loop);
		_mesh.material.dispose();
		_mesh.geometry.dispose();
		_background.stop()
	}
});
Class(function PaintingParticlesMovement() {
	Inherit(this, Component);
	var _this = this;
	var _v2 = new Vector2;
	var _v3 = new Vector3;
	var _projection = new ScreenProjection(World.CAMERA);
	var _dist = Math.pow(1e3, 2);

	function init(p) {
		p.speed = 100;
		p.v2 = (new Vector2).copy(p.pos);
		p.v2pos = (new Vector2).copy(p.pos);
		p.o = (new Vector2).copy(p.pos);
		p.v3 = new Vector3;
		p.rangeX = Utils.doRandom(-120, 120) * .02;
		p.rangeY = Utils.doRandom(-120, 120) * .01;
		p.speedX = Utils.doRandom(10, 50) / 2e4;
		p.speedY = .00001;
		p.speedFlow = Utils.doRandom(50, 100) / 250
	}
	this.applyBehavior = function(p) {
		if(!p.speed) init(p);
		p.o.y -= .3 * p.speedFlow;
		if(p.pos.y < -500) {
			p.o.y = 500;
			p.pos.y = 500;
			p.v2pos.copy(p.pos)
		}
		p.origin.x = p.o.x + Math.sin(Render.TIME * p.speedX) * p.rangeX;
		p.origin.y = p.o.y + Math.sin(Render.TIME * p.speedY);
		p.v3.set(p.pos.x, p.pos.z, p.pos.y);
		var screen = _projection.project(p.v3);
		_v2.subVectors(screen, Mouse);
		p.v2.copy(p.origin);
		p.v2pos.lerp(p.v2, .07);
		p.v2pos.copyTo(p.pos)
	}
});
Class(function PaintingParticlesSystem(_shader) {
	Inherit(this, Component);
	var _this = this;
	var _system, _mesh, _geom, _wrapper;
	var _shader, _callback;
	var _mouse = new Vector2;
	this.group = new THREE.Group;
	var NUM = 1e3;
	(function() {}());

	function initSystem() {
		_system = new ParticlePhysics;
		_system.addBehavior(new PaintingParticlesMovement)
	}

	function initGeom() {
		var index = 0;
		var position = new Float32Array(NUM * 3);
		var alpha = new Float32Array(NUM);
		var scale = new Float32Array(NUM);
		var life = new Float32Array(NUM);
		var worker = new DistributedWorker(1);
		worker.start(function() {
			var pos = new Vector3;
			pos.x = Utils.doRandom(-20, 20);
			pos.y = Utils.doRandom(-20, 20);
			pos.z = Utils.doRandom(500, -500);
			position[index + 0] = pos.x;
			position[index + 1] = pos.y;
			position[index + 2] = pos.z;
			alpha[index] = Utils.doRandom(50, 100) / 100;
			scale[index] = Utils.doRandom(50, 150) / 100;
			life[index] = 1;
			var p = new Particle(pos);
			_system.addParticle(p);
			p.origin = (new Vector3).copy(p.pos);
			index++;
			if(index == NUM) {
				worker.stop();
				initMesh(position, alpha, scale, life)
			}
		})
	}

	function initMesh(position, alpha, scale, life) {
		_geom = new THREE.BufferGeometry;
		_geom.addAttribute("position", new THREE.BufferAttribute(position, 3));
		_geom.addAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
		_geom.addAttribute("scale", new THREE.BufferAttribute(scale, 1));
		_geom.addAttribute("life", new THREE.BufferAttribute(life, 1));
		_mesh = new THREE.Points(_geom, _shader.material);
		_wrapper = new THREE.Group;
		_wrapper.add(_mesh);
		_this.group.add(_wrapper);
		_mesh.position.z = -150;
		_callback(_mesh, _system)
	}
	this.init = function(shader, callback) {
		_this = this;
		_shader = shader;
		_callback = callback;
		initSystem();
		initGeom()
	};
	this.update = function() {
		if(!_geom) return;
		_system.update();
		var updateLife = false;
		var p = _system.particles.start();
		var index = 0;
		while(p) {
			_geom.attributes.position.setXYZ(index, p.pos.x, p.pos.y, p.pos.z);
			if(typeof p.alpha == "number") {
				_geom.attributes.life.setX(index, p.alpha);
				updateLife = true
			}
			index++;
			p = _system.particles.next()
		}
		if(_wrapper && !_this.noRotation) {
			_mouse.lerp(Mouse, .02);
			_wrapper.rotation.y = Utils.convertRange(_mouse.x, 0, Stage.width, Utils.toRadians(-6), Utils.toRadians(6));
			_wrapper.rotation.x = Utils.convertRange(_mouse.y, 0, Stage.height, Utils.toRadians(-6), Utils.toRadians(6))
		}
		_geom.attributes.position.needsUpdate = true;
		if(updateLife) _geom.attributes.life.needsUpdate = true
	}
});
Class(function PaintingTunnel() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _mat, _tunnel, _tunnels;
	var _shader, _light, _debug, _orb, _sphere, _glow, _block;
	var _speed = new DynamicObject({
		v: .5
	});
	var _strength = new DynamicObject({
		v: 0
	});
	var _position = new Vector2;
	var _move = new Vector2;
	var _mouse = new Vector2;
	this.group = new THREE.Group;
	var _length = 120;
	var _count = 1;
	_this.beatCount = 0;
	(function() {
		initMesh();
		initShader();
		initTunnel();
		initGlow();
		addListeners();
		_this.startRender(loop)
	}());

	function initMesh() {
		_geom = new THREE.CylinderGeometry(4, 4, _length, _length * .8, _length, true);
		_geom.rotateX(Utils.toRadians(90));
		for(var i = 0; i < _geom.faces.length; i++) {
			var face = _geom.faces[i];
			var temp = face.a;
			face.a = face.c;
			face.c = temp
		}
		_geom.computeFaceNormals();
		_geom.computeVertexNormals();
		var faceVertexUvs = _geom.faceVertexUvs[0];
		for(var i = 0; i < faceVertexUvs.length; i++) {
			var temp = faceVertexUvs[i][0];
			faceVertexUvs[i][0] = faceVertexUvs[i][2];
			faceVertexUvs[i][2] = temp
		}
		_mat = new THREE.MeshBasicMaterial({
			color: 16777215
		})
	}

	function initShader() {
		_light = new THREE.PointLight(16777215);
		_light.position.set(0, 0, -22);
		_shader = _this.initClass(Shader, "PaintingTunnel");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			length: {
				type: "f",
				value: _length
			},
			scale: {
				type: "f",
				value: 0
			},
			height: {
				type: "f",
				value: .1
			},
			fMin: {
				type: "f",
				value: .8
			},
			fMax: {
				type: "f",
				value: .9
			},
			minBrightness: {
				type: "f",
				value: 0
			},
			brightness: {
				type: "f",
				value: .12
			}
		};
		_shader.receiveLight = true;
		_shader.lights.push(_light);
		ShaderUIL.instance().push(_shader)
	}

	function initTunnel() {
		_tunnel = new THREE.Group;
		_tunnel.rot = 0;
		_this.group.add(_tunnel);
		_tunnels = [];
		for(var i = 0; i < _count; i++) {
			var tunnel = new THREE.Mesh(_geom, _shader.material);
			tunnel.position.set(0, 0, -_length * .3 - i * _length);
			if(i % 2 == 0) {
				tunnel.rotation.z = Utils.toRadians(180)
			}
			_tunnel.add(tunnel);
			_tunnels.push(tunnel)
		}
		_shader.set("scale", .15);
		_shader.set("brightness", 0);
		_strength.tween({
			v: 1
		}, 1e4, "linear");
		_shader.set("height", .1)
	}

	function initGlow() {
		let sphere = new THREE.SphereGeometry(1, 30, 30, 0, Math.PI * 2, 0, Math.PI * 2);
		_glow = new THREE.Mesh(sphere, _shader.material);
		_glow.position.set(0, 0, -50);
		var s = 1.4;
		_glow.scale.set(s, s, s);
		FX.Light.instance().addLight(_glow)
	}

	function loop() {
		_shader.set("time", Render.TSL * -.0005 * _speed.v);
		var base = Mouse;
		_mouse.lerp(base, .2);
		_position.x = Utils.convertRange(_mouse.x, 0, Stage.width, -5, 5);
		_position.y = Utils.convertRange(_mouse.y, 0, Stage.height, 3, -3);
		_move.lerp(_position, .05);
		_tunnel.position.x = _move.x * .4;
		_tunnel.position.y = _move.y * .4;
		_light.position.x = _move.x * .2;
		_light.position.y = _move.y * .2;
		_glow.position.x = _move.x * .2;
		_glow.position.y = _move.y * .2;
		_tunnel.rotation.z += _this.dropped ? -.008 : .003
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 4 == 0 && e.count > 2 && e.count < 485) {
					_speed.v = .498;
					_speed.tween({
						v: .5
					}, 15e2, "easeOutSine");
					FX.Light.instance().bounce(_this.dropped ? 4 : 1);
					var big = _this.bassIn && e.count % 8 == 4;
					var bright = big ? .8 : .2;
					var ease = big ? "easeOutSine" : "easeInSine";
					var base = .15;
					var duration = 15e2;
					if(_this.dropped) {
						ease = "easeInSine";
						bright = 1.1;
						base = .3;
						duration = 2e3
					}
					if(_this.dropped) _tunnel.rotation.z += _this.dropped ? -Utils.toRadians(180) : Utils.toRadians(180);
					if(_this.dropped) _tunnel.position.z = _this.dropped ? -15 : -5;
					TweenManager.tween(_tunnel.position, {
						z: 0
					}, 3e3, "easeOutSine");
					_shader.set("brightness", bright);
					_shader.tween("brightness", base, duration, ease);
					if(_this.dropped) {
						_shader.set("height", .9);
						_shader.tween("height", .2, duration * .5, ease)
					}
					var s = 2.2;
					_glow.scale.set(s * 1.1, s * 1.1, s * 1.1);
					TweenManager.tween(_glow.scale, {
						x: s,
						y: s,
						z: s
					}, 15e2, "easeOutSine")
				}
				break;
			case "bassIn":
				_this.bassIn = true;
				break;
			case "dropIn":
				_this.dropped = true;
				_shader.set("scale", .3);
				break;
			case "dropOut":
				_this.dropped = false;
				_shader.tween("height", .1, 5e3, "easeInOutSine");
				_shader.tween("scale", .05, 7e4, "easeInOutSine");
				break
		}
	}
	this.animateOut = function() {};
	this.animateIn = function() {}
});
Class(function StonesElements() {
	Inherit(this, Component);
	var _this = this;
	var _physics, _generator, _target, _posTexture, _scaleTexture;
	var _elements = [];
	var _config = {
		orientation: 4,
		offset: 3,
		scale: 1
	};
	const ELEMENTS_PER_SET = Tests.stonesElementParticles();
	this.group = new THREE.Group;
	this.group.visible = false;
	this.ready = false;
	this.aoStrength = 1;
	(function() {
		initTarget();
		initElements().then(initPhysics)
	}());

	function initElements() {
		let size = .06;
		let geom = [new THREE.SphereGeometry(size, 40, 40, 0, Math.PI * 2, 0, Math.PI * 2)];
		for(var i = 0; i < 10; i++) {
			var x, y, z, max = 1.5,
				min = 0,
				points = [];
			for(var j = 0; j <= Utils.doRandom(30, 50); j++) {
				x = Utils.doRandom(-100, 100) / 100;
				y = Utils.doRandom(-100, 100) / 100;
				z = Utils.doRandom(-100, 100) / 100;
				points.push(new THREE.Vector3(x * size, y * size, z * size))
			}
			var geometry = new THREE.ConvexGeometry(points);
			geom.push(geometry)
		}
		_generator = _this.initClass(StonesElementsGenerator, Tests.stonesElementParticles());
		let promises = [];
		geom.forEach((g, i) => {
			let shader = _this.initClass(StonesElementsShader, i, _target.pos);
			let element = _this.initClass(StonesElementsSet, (new THREE.BufferGeometry).fromGeometry(g), _generator, shader, i);
			_this.group.add(element.group);
			_elements.push(element);
			promises.push(element.ready())
		});
		return Promise.all(promises)
	}

	function initPhysics() {
		_generator = _generator.destroy();
		_physics = _this.initClass(StonesElementsPhysics, _elements, _target);
		_physics.events.add(StonesElementsPhysics.DATA, physicsData);
		_this.ready = true
	}

	function initTarget() {
		_target = _this.initClass(StonesElementsTarget);
		_this.target = _target
	}

	function physicsData(e) {
		if(e.aoStrength) _this.aoStrength = e.aoStrength.strength;
		var key = e.key;
		var value = e.value;
		if(key == "position") key = "offset";
		let count = _config[key];
		var index = 0;
		for(let i = 0; i < _elements.length; i++) {
			let element = _elements[i];
			let buffer = element.geom.attributes[key];
			for(let i = 0; i < ELEMENTS_PER_SET; i++) {
				for(var j = 0; j < count + 1; j++) {
					buffer.array[i * count + j] = value[index * count + j]
				}++index
			}
			buffer.needsUpdate = true
		}
	}
	this.animateIn = function() {
		_this.wait(() => animateIn(), _this, "ready");

		function animateIn() {
			_this.delayedCall(function() {
				_this.group.visible = true;
				_physics.animateIn()
			}, 500)
		}
	};
	this.animateOut = function() {
		_physics.animateOut()
	};
	this.prerender = function() {
		let promise = Promise.create();
		_this.wait(() => setTimeout(promise.resolve, 200), _this, "ready");
		return promise
	}
});
Class(function StonesElementsGenerator(_total) {
	Inherit(this, Component);
	var _this = this;
	var _thread;
	(function() {
		initThread()
	}());

	function initThread() {
		_thread = _this.initClass(Thread);
		_thread.importScript(Config.CDN + "assets/js/lib/three.min.js");
		_thread.loadFunction(generate)
	}

	function generate(e, id) {
		var vertices = new Float32Array(e.size * 3);
		var scale = new Float32Array(e.size);
		var orientation = new Float32Array(e.size * 4);
		var euler = new THREE.Euler;
		var quaternion = new THREE.Quaternion;
		var vector = new THREE.Vector4;
		for(var i = 0; i < e.size; i++) {
			vertices[i * 3 + 0] = Utils.doRandom(-4, 4, 6);
			vertices[i * 3 + 1] = Utils.doRandom(-4, 4, 6);
			vertices[i * 3 + 2] = Utils.doRandom(-4, 4, 6);
			scale[i] = Utils.doRandom(.8, 1, 3) * 1.2;
			euler.set(Utils.toRadians(Utils.doRandom(0, 360)), Utils.toRadians(Utils.doRandom(0, 360)), Utils.toRadians(Utils.doRandom(0, 360)));
			quaternion.setFromEuler(euler);
			orientation[i * 4 + 0] = quaternion.x;
			orientation[i * 4 + 1] = quaternion.y;
			orientation[i * 4 + 2] = quaternion.z;
			orientation[i * 4 + 3] = quaternion.w
		}
		post({
			offset: vertices,
			scale: scale,
			orientation: orientation
		}, id, [vertices.buffer, scale.buffer, orientation.buffer])
	}
	this.generate = function(_index) {
		let promise = Promise.create();
		_thread.generate({
			size: _index == 0 ? 1 : ~~_total
		}, function(data) {
			promise.resolve(data)
		});
		return promise
	}
});
Class(function StonesElementsSet(_shape, _generator, _shader, _index) {
	Inherit(this, Component);
	var _this = this;
	var _geom, _promise, _clone;
	var _lightMesh;
	this.group = new THREE.Group;
	(function() {
		_generator.generate(_index).then(init)
	}());

	function init(data) {
		initGeometry(data);
		initMesh();
		_promise.resolve()
	}

	function initGeometry(data) {
		_geom = new THREE.InstancedBufferGeometry;
		for(var key in _shape.attributes) {
			_geom.addAttribute(key, _shape.attributes[key])
		}
		let offsets = new THREE.InstancedBufferAttribute(data.offset, 3, 1);
		_geom.addAttribute("offset", offsets);
		let orientations = new THREE.InstancedBufferAttribute(data.orientation, 4, 1);
		_geom.addAttribute("orientation", orientations);
		let scales = new THREE.InstancedBufferAttribute(data.scale, 1, 1);
		_geom.addAttribute("scale", scales);
		_this.data = data;
		_this.geom = _geom
	}

	function initMesh() {
		let mesh = new THREE.Mesh(_geom, _shader.material);
		mesh.frustumCulled = false;
		_this.group.add(mesh);
		mesh.occlusionMaterial = StonesElementsSet.getShaderOcclusion().material;
		mesh.depthMaterial = StonesElementsSet.getShaderDepth().material;
		if(_index == 0) {
			let material = new THREE.MeshBasicMaterial({
				color: 16777215,
				opacity: .5
			});
			_lightMesh = new THREE.Mesh(new THREE.SphereGeometry(.06, 40, 40, 0, Math.PI * 2, 0, Math.PI * 2), material);
			Stones.LIGHT_MESH = _lightMesh;
			FX.Light.instance().addLight(_lightMesh)
		} else {
			FX.Light.instance().addOcclusion(mesh)
		}
		FX.Depth.instance().add(mesh)
	}
	this.ready = function() {
		_promise = Promise.create();
		return _promise
	}
}, () => {
	var _shader, _occlusion, _depth;
	StonesElementsSet.getShader = function() {
		if(!_shader) {
			_shader = new Shader("StonesElementsSet")
		}
		return _shader.clone()
	};
	StonesElementsSet.getShaderOcclusion = function() {
		if(!_occlusion) {
			_occlusion = new Shader("StonesElements", "StonesElementsOcclusion")
		}
		return _occlusion.clone()
	};
	StonesElementsSet.getShaderDepth = function() {
		if(!_depth) {
			_depth = new Shader("StonesElements", "StonesElementsDepth")
		}
		return _depth.clone()
	}
});
Class(function StonesElementsPhysics(_elements, _target) {
	Inherit(this, Component);
	var _this = this;
	var _engine, _system;
	var _msg = {};
	var _movement = new Vector3;
	var _evt = {};
	(function() {
		initBuffer();
		addListeners();
		_this.startRender(loop)
	}());

	function initBuffer() {
		var offset = new Float32Array;
		_elements.forEach(element => {
			let data = element.data;
			offset = concatBuffer(offset, data.offset)
		});
		initEngine({
			vertices: offset
		})
	}

	function initEngine(data) {
		_engine = _this.initClass(ParticleEngine, data, null, ParticleEngineCPU, {
			threads: 1,
			pointSize: .2
		});
		_system = _engine.system;
		let cdn = "https://emmitfenn.com/";
		_system.importScript(cdn + "assets/js/lib/three.min.js");
		_system.importScript(cdn + "assets/js/lib/cannon.min.js");
		_system.importClass(StonesElementsPhysicsThread, Render, TweenManager, TweenManager.Interpolation, MathTween);
		_system.initialize("StonesElementsPhysicsThread");
		_system.exec("StonesElementsPhysicsThread", "init", {
			handControls: GameController.instance().handControls,
			mobile: Device.mobile,
			vr: Hardware.ROOMSCALE_VR || Hardware.DAYDREAM,
			move: Hardware.ADJUST_ROOMSCALE
		});
		_system.getChunks(function(chunk) {
			chunk.handleBufferData(bufferData);
			chunk.thread.on("ao", aoData)
		});
		_engine.startRender()
	}

	function concatBuffer(first, second) {
		var firstLength = first.length,
			result = new Float32Array(firstLength + second.length);
		result.set(first);
		result.set(second, firstLength);
		return result
	}

	function loop() {
		if(!_msg.controllers && GameController.instance().pos.length) {
			_msg.controllers = GameController.instance().pos.slice(0)
		}
		if(_msg.controllers) {
			_msg.controllers[0].x = -_msg.controllers[0].x * 7 + _target.pos.x;
			_msg.controllers[0].y = _msg.controllers[0].y * 7 + _target.pos.y * .5 + .4;
			_msg.controllers[0].z = _target.pos.z;
			_movement.lerp(_msg.controllers[0], .1)
		}
		_msg.orb = _movement;
		_msg.target = _target.pos;
		_system.exec("StonesElementsPhysicsThread", "update", _msg)
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "transition":
				if(!_this.stopped) {
					_this.stopped = true;
					_system.exec("StonesElementsPhysicsThread", "detract", {})
				} else {
					_this.stopped = false;
					_system.exec("StonesElementsPhysicsThread", "attract", {})
				}
				break;
			case "beat":
				if(e.count % 4 == 0 && _this.beat) {
					_system.exec("StonesElementsPhysicsThread", "release", {});
					_system.exec("StonesElementsPhysicsThread", "bounce", {});
					FX.Light.instance().bounce();
					if(_this.dropped) {
						if(!_this.stopped) {
							_this.stopped = true;
							_system.exec("StonesElementsPhysicsThread", "detract", {})
						} else {
							_this.stopped = false;
							_system.exec("StonesElementsPhysicsThread", "attract", {})
						}
					}
				}
				break;
			case "beatIn":
				_this.beat = true;
				break;
			case "beatOut":
				_this.beat = false;
				break;
			case "dropIn":
				_this.dropped = true;
				break;
			case "dropOut":
				_this.dropped = false;
				break;
			case "out":
				_system.exec("StonesElementsPhysicsThread", "animateOut", {});
				break
		}
	}

	function bufferData(key, value) {
		_evt.key = key;
		_evt.value = value;
		_this.events.fire(StonesElementsPhysics.DATA, _evt)
	}

	function aoData(e) {
		Stones.LIGHT.copy(e.firstPos);
		Stones.LIGHT.y -= 1;
		_evt.aoStrength = e
	}
	this.animateIn = function() {
		_system.exec("StonesElementsPhysicsThread", "release", {})
	};
	this.animateOut = function() {
		_system.exec("StonesElementsPhysicsThread", "animateOut", {});
		_this.delayedCall(function() {
			_this.stopRender(loop);
			_engine.stopRender()
		}, 5e3)
	};
	this.onDestroy = function() {}
}, () => {
	StonesElementsPhysics.DATA = "Stones_physics_data"
});
Class(function StonesElementPhysicsConverter(_data) {
	Inherit(this, Component);
	var _this = this;
	var _pools = {};
	var _response = {
		obj: {},
		buffers: []
	};
	var _lengths = {};
	const KEYS = ["orientation", "scale", "offset"];
	(function() {
		initPools()
	}());

	function initPools() {
		KEYS.forEach(key => {
			let buffer = _data[key];
			let pool = new ObjectPool;
			_lengths[key] = buffer.length;
			for(let i = 0; i < 100; i++) pool.put(new Float32Array(buffer.length));
			_pools[key] = pool
		})
	}
	this.exec = function(bodies) {
		let len = bodies.length;
		let orientation = _pools.orientation.get() || new Float32Array(_lengths.orientation);
		let offset = _pools.offset.get() || new Float32Array(_lengths.offset);
		let scale = _pools.scale.get() || new Float32Array(_lengths.scale);
		for(let i = 0; i < len; i++) {
			let body = bodies[i];
			let pos = body.position;
			let quaternion = body.quaternion;
			offset[i * 3 + 0] = pos.x;
			offset[i * 3 + 1] = pos.y;
			offset[i * 3 + 2] = pos.z;
			orientation[i * 4 + 0] = quaternion.x;
			orientation[i * 4 + 1] = quaternion.y;
			orientation[i * 4 + 2] = quaternion.z;
			orientation[i * 4 + 3] = quaternion.w;
			scale[i] = body.scale
		}
		_response.obj.offset = offset;
		_response.obj.orientation = orientation;
		_response.obj.scale = scale;
		_response.buffers.length = 0;
		_response.buffers.push(offset.buffer);
		_response.buffers.push(orientation.buffer);
		_response.buffers.push(scale.buffer);
		return _response
	};
	this.recycleBuffer = function(e) {
		_pools[e.name].put(e.array)
	}
});
Class(function StonesElementsPhysicsThread(_elements) {
	Inherit(this, Component);
	var _this = this;
	var _world, _target;
	var _highCount = 0;
	var _aoEvent = {};
	var _system = Global.SYSTEM;
	var _converter = Global.CONVERTER;
	var _bodies = [];
	var _v3, _v30;
	var _vv = new Vector3;
	var _orb;
	_this.released = 0;

	function initWorld() {
		_world = new CANNON.World;
		_world.gravity.set(0, 0, 0)
	}

	function constructObjects(data) {
		let euler = new THREE.Euler;
		let quaternion = new THREE.Quaternion;
		let count = 0;
		let p = _system.particles.start();
		while(p) {
			p.scale = Utils.doRandom(.2, 2.2, 3);
			euler.set(Utils.toRadians(Utils.doRandom(0, 360)), Utils.toRadians(Utils.doRandom(0, 360)), Utils.toRadians(Utils.doRandom(0, 360)));
			quaternion.setFromEuler(euler);
			p.qx = quaternion.x;
			p.qy = quaternion.y;
			p.qz = quaternion.z;
			p.qw = quaternion.w;
			let config = {};
			config.mass = Utils.convertRange(p.scale, 2, 5, 1, 2, true);
			config.radius = p.scale * .05;
			config.position = new CANNON.Vec3(0, 0, 0);
			config.shape = new CANNON.Box(new CANNON.Vec3(config.radius, config.radius, config.radius));
			config.quaternion = new CANNON.Quaternion(p.qx, p.qy, p.qz, p.qw);
			if(count == 0) {
				config.mass = 10;
				p.scale = .9;
				config.position.set(0, 0, 0);
				config.STATIC = true
			}
			let body = new CANNON.Body(config);
			_bodies.push(body);
			body.chase = Utils.doRandom(2, 2.2, 4);
			body.attract = false;
			body.oScale = p.scale;
			body.scale = 0;
			body.transition = 0;
			body.quaternion.set(0, 0, 0, 1);
			body.velocity.set(0, 0, 0);
			body.angularVelocity.set(0, 0, 0);
			p.body = body;
			_world.addBody(body);
			p = _system.particles.next();
			count++
		}
		_orb = _bodies[0];
		_v3 = new CANNON.Vec3;
		_v30 = new CANNON.Vec3
	}

	function constructBounds() {
		let e = new THREE.Euler;
		let q = new THREE.Quaternion;
		let size = 1;
		let shape = new CANNON.Plane;
		var body = new CANNON.Body({
			mass: 0,
			shape
		});
		body.STATIC = true;
		body.position.z = -size;
		_world.addBody(body);
		body = new CANNON.Body({
			mass: 0,
			shape
		});
		body.STATIC = true;
		body.position.z = size;
		e.set(0, Utils.toRadians(180), 0);
		q.setFromEuler(e);
		body.quaternion.set(q.x, q.y, q.z, q.w);
		_world.addBody(body);
		body = new CANNON.Body({
			mass: 0,
			shape
		});
		body.STATIC = true;
		body.position.y = size * 2;
		e.set(Utils.toRadians(90), 0, 0);
		q.setFromEuler(e);
		body.quaternion.set(q.x, q.y, q.z, q.w);
		_world.addBody(body);
		body = new CANNON.Body({
			mass: 0,
			shape
		});
		body.STATIC = true;
		body.position.y = 0;
		e.set(Utils.toRadians(-90), 0, 0);
		q.setFromEuler(e);
		body.quaternion.set(q.x, q.y, q.z, q.w);
		_world.addBody(body);
		body = new CANNON.Body({
			mass: 0,
			shape
		});
		body.STATIC = true;
		body.position.x = -size;
		e.set(0, Utils.toRadians(90), 0);
		q.setFromEuler(e);
		body.quaternion.set(q.x, q.y, q.z, q.w);
		_world.addBody(body);
		body = new CANNON.Body({
			mass: 0,
			shape
		});
		body.STATIC = true;
		body.position.x = size;
		e.set(0, Utils.toRadians(-90), 0);
		q.setFromEuler(e);
		body.quaternion.set(q.x, q.y, q.z, q.w);
		_world.addBody(body)
	}

	function updateBodies(e) {
		let t = e.target;
		_target = t;
		let speed = .5;
		for(let i = 0; i < _bodies.length; i++) {
			let body = _bodies[i];
			body.scale = body.oScale * body.transition * Utils.range(Math.sin(Render.TIME * .0005 * (Global.VR ? .25 : 1)), -1, 1, .9, 1.2);
			_v3.copy(body.position).vsub(t, _v3);
			if(Global.MOVE) _v3.z += 1;
			_v3.scale(-.03 * speed * (body.attract ? 1 : 0), _v3);
			body.applyImpulse(_v3, body.position)
		}
	}

	function loop() {
		Render.tick();
		_world.step(1 / 60, 1 / 60, 1);
		let count = 1;
		let i = 1;
		let p = _system.particles.start();
		while(p) {
			let body = p.body;
			let pos = body.position;
			let quaternion = body.quaternion;
			p.pos.x = pos.x;
			p.pos.y = pos.y - 1;
			p.pos.z = pos.z;
			_vv.subVectors(p.pos, _target);
			let len = _vv.lengthSq();
			if(len < .25) count++;
			p.qx = quaternion.x;
			p.qy = quaternion.y;
			p.qz = quaternion.z;
			p.qw = quaternion.w;
			p.scale = body.scale;
			p = _system.particles.next();
			i++
		}
		_highCount = Math.max(_highCount, count);
		_aoEvent.strength = count / _highCount;
		_aoEvent.firstPos = _orb.position;
		emit("ao", _aoEvent)
	}
	this.init = function(e) {
		Global.VR = e.vr;
		Global.HAND_CONTROLS = e.handControls;
		TweenManager.Interpolation = Interpolation;
		Global.MOBILE = e.mobile;
		Global.MOVE = e.move;
		_converter.addAttribute("scale", ["scale"]);
		_converter.addAttribute("orientation", ["qx", "qy", "qz", "qw"]);
		initWorld();
		constructBounds();
		constructObjects();
		_system.onUpdate = loop;
		_system.skipIntegration = true
	};
	this.update = function(e) {
		updateBodies(e);
		if(e.orb) {
			_orb.position.copy(e.orb);
			_orb.quaternion.set(0, 0, 0, 1);
			_orb.velocity.set(0, 0, 0);
			_orb.angularVelocity.set(0, 0, 0)
		}
	};
	this.release = function() {
		if(_this.released == _bodies.length || _this.out) return;
		var release = _this.released + Math.round(_bodies.length / 30);
		if(release > _bodies.length) release = _bodies.length;
		for(let i = 0; i < release; i++) {
			if(!_bodies[i].animated) {
				_bodies[i].animated = true;
				_bodies[i].attract = true;
				TweenManager.tween(_bodies[i], {
					transition: 1
				}, 2e3, "easeOutBack")
			}
		}
		_this.released = release
	};
	this.animateIn = function() {
		_this.released = 1;
		TweenManager.tween(_orb, {
			transition: 1
		}, 3e3, "easeOutExpo")
	};
	this.attract = function() {
		for(let i = 1; i < _bodies.length; i++) {
			_bodies[i].attract = true
		}
	};
	this.detract = function() {
		for(let i = 1; i < _bodies.length; i++) {
			_bodies[i].attract = false
		}
	};
	this.bounce = function() {
		_orb.transition = 1.05;
		TweenManager.tween(_orb, {
			transition: 1
		}, 2e3, "easeInOutSine")
	};
	this.animateOut = function() {
		_this.out = true;
		for(let i = 1; i < _bodies.length; i++) {
			var body = _bodies[i];
			TweenManager.tween(body, {
				transition: 0
			}, 7e3, "easeOutCubic", Utils.doRandom(0, 2e4))
		}
	}
});
Class(function StonesElementsShader(_index, _target) {
	Inherit(this, Component);
	var _this = this;
	var _shader, _light;
	var _config = require("StonesConfig");
	var _group = new THREE.Group;
	(function() {
		initShadowLight();
		initShader();
		if(Tests.renderShadows()) initShadows();
		_this.startRender(loop);
		addListeners()
	}());

	function initShadowLight() {
		if(StonesElementsShader.shadowLight) return;
		light = new THREE.DirectionalLight;
		light.position.set(0, 10, 0);
		light.castShadow = true;
		Utils3D.setLightCamera(light, 10, .1, 100, 2048);
		StonesElementsShader.shadowLight = light;
		World.SCENE.add(light)
	}

	function initShader() {
		_shader = _this.initClass(Shader, "StonesElements");
		_shader.uniforms = {
			baseColor: {
				type: "c",
				value: new THREE.Color(_index == 0 ? _config.colors.core.base : _config.colors.rocks.base)
			},
			center: {
				type: "v3",
				value: _target
			},
			aoStrength: {
				type: "f",
				value: 0
			},
			brightness: {
				type: "f",
				value: .6
			},
			highlight: {
				type: "f",
				value: 0
			}
		};
		initLights();
		if(Tests.renderShadows()) _shader.receiveShadow = true;
		_shader.receiveLight = true;
		_this.material = _shader.material;
		_shader.material.extensions.derivatives = true
	}

	function initShadows() {
		let depth = StonesElementsShader.getDepth();
		depth.set("lightPos", StonesElementsShader.shadowLight.position);
		depth.set("far", 100);
		depth.material.side = THREE.DoubleSide;
		_this.depthMaterial = depth.material
	}

	function initLights() {
		for(let i = 0; i < _config.lights.length; i++) {
			let light = new THREE.PointLight(_index == 0 ? _config.colors.core.light : _config.colors.rocks.light, 2, 100);
			light.position.copy(_config.lights[i]);
			_shader.lights.push(light);
			_group.add(light);
			_light = light
		}
		_light.intensity = 0
	}

	function initGroup() {
		_group.r = _this.initClass(RandomEulerRotation, _group);
		_group.r.startRender()
	}

	function loop() {
		_this.parent && _shader.set("aoStrength", _this.parent.aoStrength);
		_light.position.copy(Stones.LIGHT);
		if(Stones.LIGHT_MESH) {
			Stones.LIGHT_MESH.position.copy(Stones.LIGHT)
		}
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 4 == 0) {
					if(_this.beat) {
						_shader.set("brightness", _this.dropped ? 1.6 : 1);
						_shader.tween("brightness", .4, 15e2, "easeInOutSine")
					}
					if(_this.dropped) {
						_shader.set("highlight", .1);
						_shader.tween("highlight", 0, 15e2, "easeInOutSine")
					}
				}
				break;
			case "beatIn":
				_this.beat = true;
				break;
			case "beatOut":
				_this.beat = false;
				break;
			case "dropIn":
				_this.dropped = true;
				break;
			case "dropOut":
				_this.dropped = false;
				break
		}
	}
}, function() {
	var _depth;
	StonesElementsShader.getDepth = function() {
		if(!_depth) {
			_depth = new Shader("StonesElementsDepth");
			_depth.receiveShadow = true;
			_depth.uniforms = {
				lightPos: {
					type: "v3",
					value: null
				},
				far: {
					type: "f",
					value: null
				}
			}
		}
		return _depth.clone()
	}
});
Class(function StonesElementsTarget() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _debug, _tangent;
	const SCALE = .03 * (Hardware.ROOMSCALE_VR ? .6 : 1);
	const SPEED = .001 * .6;
	const Y_OFFSET = Hardware.ROOMSCALE_VR ? 50 : 20;
	var _percent = 0;
	var _follow = 0;
	this.group = new THREE.Group;
	this.pos = new THREE.Vector3;
	this.follow = new THREE.Vector3;
	(function() {
		initGeometry();
		_this.startRender(loop)
	}());

	function initGeometry() {
		let extrude = new THREE.Curves.KnotCurve;
		_geom = new THREE.TubeGeometry(extrude, 50, true, false, 5);
		_geom.translate(0, Y_OFFSET, 0);
		_geom.scale(SCALE, SCALE, SCALE);
		var mat = new THREE.MeshNormalMaterial;
		let mesh = new THREE.Mesh(_geom, mat);
		_this.group.add(mesh);
		_debug = Utils3D.createDebug(.05);
		_this.group.add(_debug)
	}

	function loop() {
		_percent += SPEED;
		if(_percent >= 1) _percent -= 1;
		_follow = _percent - .3;
		if(_follow < 0) _follow += 1;
		_this.pos.set(0, 1.3 + Math.sin(Render.TIME * .00025) * .1, Hardware.ADJUST_ROOMSCALE ? 1 : 0);
		_this.follow.set(0, 1.3, 1.5);
		_debug.position.copy(_this.follow)
	}

	function getPosition(time, speed, percent) {
		speed = speed || 25;
		var looptime = speed * 1e3;
		var t = time % looptime / looptime;
		var pos = _geom.parameters.path.getPointAt(percent || t);
		pos.y += Y_OFFSET;
		pos.multiplyScalar(SCALE);
		return pos
	}
});
Class(function WantitBall() {
	Inherit(this, Component);
	var _this = this;
	var _geom, _mat, _group, _group2, _group3, _planet, _wireframe, _wireframe2;
	var _shader1, _shader2, _light;
	var _speed = new DynamicObject({
		v: 1
	});
	var _strength = new DynamicObject({
		v: 0
	});
	var _mouse = new Vector2;
	var _position = new Vector2;
	var _position2 = new Vector2;
	var _move = new Vector2;
	var _rotation = new Vector2;
	var _rotationOrigin = new Vector2;
	var _rotationMove = new Vector2;
	var _origin = new Vector2;
	var _interaction;
	this.group = new THREE.Group;
	_this.beatCount = 0;
	_this.dropped = 0;
	(function() {
		initShader();
		initBall();
		setPositions();
		addListeners();
		resizeHander();
		_this.startRender(loop)
	}());

	function initBall() {
		_group2 = new THREE.Group;
		_this.group.add(_group2);
		_group = new THREE.Group;
		_group2.add(_group);
		_group3 = new THREE.Group;
		_group.add(_group3);
		let geom = new THREE.IcosahedronGeometry(1, 3);
		_wireframe = new THREE.Mesh(geom, _shader2.material);
		_wireframe.renderOrder = -1;
		let s = 1.6;
		_wireframe.scale.set(s, s, s);
		geom = new THREE.SphereGeometry(1, 200, 200, 0, Math.PI * 2, 0, Math.PI * 2);
		_planet = new THREE.Mesh(geom, _shader1.material);
		_planet.renderOrder = 1;
		FX.Light.instance().addLight(_planet);
		FX.Light.instance().addLight(_wireframe);
		_group3.add(_wireframe);
		_group3.add(_planet)
	}

	function initShader() {
		_light = new THREE.DirectionalLight(16777215);
		_shader1 = _this.initClass(Shader, "Wantit");
		_shader1.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			baseColor: {
				type: "c",
				value: new THREE.Color(5592405)
			},
			headColor: {
				type: "c",
				value: new THREE.Color(11361791)
			},
			scale: {
				type: "f",
				value: 0
			},
			fHeight: {
				type: "f",
				value: .05
			},
			fMin: {
				type: "f",
				value: 0
			},
			fMax: {
				type: "f",
				value: 1
			},
			brightness: {
				type: "f",
				value: 0
			},
			saturate: {
				type: "f",
				value: 1
			},
			alpha: {
				type: "f",
				value: .5
			}
		};
		_shader1.receiveLight = true;
		_shader1.lights.push(_light);
		_shader2 = _this.initClass(Shader, "Wantit");
		_shader2.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			baseColor: {
				type: "c",
				value: new THREE.Color(5592405)
			},
			headColor: {
				type: "c",
				value: new THREE.Color(11361791)
			},
			scale: {
				type: "f",
				value: 0
			},
			fHeight: {
				type: "f",
				value: .05
			},
			fMin: {
				type: "f",
				value: 0
			},
			fMax: {
				type: "f",
				value: 1
			},
			brightness: {
				type: "f",
				value: 0
			},
			saturate: {
				type: "f",
				value: 1
			},
			alpha: {
				type: "f",
				value: 0
			}
		};
		_shader2.receiveLight = true;
		_shader2.lights.push(_light);
		_shader2.material.wireframe = true;
		_shader2.material.transparent = true;
		_shader2.material.blending = THREE.AdditiveBlending
	}

	function setPositions() {
		_group.position.z = -1;
		_group2.position.y = -1.05;
		_shader1.set("brightness", .45);
		_shader1.set("fHeight", .1);
		_shader1.set("scale", 1);
		_shader2.set("brightness", .7);
		_shader2.set("fHeight", .2);
		_shader2.set("scale", 1);
		_strength.tween({
			v: 0
		}, 1e3, "linear")
	}

	function loop(t) {
		_shader1.set("time", Render.TSL * (.0001 + .00008 * _strength.v));
		_shader2.set("time", Render.TSL * (.0001 + .00008 * _strength.v));
		_mouse.lerp(Mouse, .2);
		_position.x = Utils.convertRange(_mouse.x, 0, Stage.width, .8, -.8);
		_position.y = Utils.convertRange(_mouse.y, 0, Stage.height, -.4, .4);
		_position2.lerp(_position, .05);
		_move.lerp(_position2, .05);
		_this.group.position.x = _move.x * .6;
		_this.group.position.y = _move.y * .6;
		_group.rotation.x += .001 * _speed.v + .0005 * _strength.v;
		_wireframe.rotation.y = _move.x;
		_wireframe.rotation.z = _move.y;
		_planet.rotation.y = -_move.x * .4;
		_planet.rotation.z = -_move.y * .4;
		_planet.rotation.x = .5;
		_light.position.x = _move.x;
		_light.position.y = _move.x
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit);
		_this.events.subscribe(HydraEvents.RESIZE, resizeHander)
	}

	function resizeHander() {
		let s = 1;
		if(Stage.width < Stage.height) {
			s = .8
		}
		_group.scale.set(s, s, s)
	}

	function beatHit(e) {
		let time;
		switch(e.type) {
			case "beat":
				if(e.count % 8 == (_this.dropped == 1 ? 4 : 0) && _this.beat) {
					_speed.v = 5;
					_speed.tween({
						v: 1
					}, 4e3, "easeOutQuint");
					_shader1.set("fHeight", .18);
					_shader1.tween("fHeight", .1, 4e3, "easeOutSine");
					_shader1.set("alpha", 1);
					_shader1.tween("alpha", .5, 4e3, "easeInOutSine");
					_shader2.set("alpha", _this.dropped ? 1 : .7);
					_shader2.tween("alpha", 0, 4e3, "easeInOutSine")
				}
				break;
			case "beatIn":
				_this.beat = true;
				break;
			case "beatOut":
				_this.beat = false;
				break;
			case "fadeWire":
				_shader2.tween("alpha", .8, 15e3, "easeOutQuart", function() {
					_shader2.tween("alpha", 0, 15e3, "easeInQuart")
				});
				break;
			case "dropIn":
				_this.dropped++;
				time = 4e3;
				TweenManager.tween(_group2.position, {
					y: -1.05
				}, time, "easeInOutQuint");
				TweenManager.tween(_group.position, {
					z: -1
				}, time, "easeInOutQuint");
				_shader1.tween("scale", 2.5, time, "easeInOutQuint");
				_shader1.tween("brightness", 1, time, "easeInOutQuint");
				_shader2.tween("scale", 2.5, time, "easeInOutQuint");
				_strength.tween({
					v: 1
				}, 35e3, "easeOutSine");
				break;
			case "dropOut":
				time = 75e3;
				TweenManager.tween(_group2.position, {
					y: 0
				}, time * .7, "easeInOutSine");
				TweenManager.tween(_group.position, {
					z: -8
				}, time, "easeInSine");
				_shader1.tween("scale", .3, time, "easeInSine");
				_shader1.tween("brightness", .4, time, "easeInSine");
				_shader2.tween("scale", .3, time, "easeInSine");
				_strength.tween({
					v: 0
				}, time, "easeInSine");
				break
		}
	}
	this.animateOut = function() {};
	this.animateIn = function() {}
});
Class(function WavesTerrain() {
	Inherit(this, Component);
	var _this = this;
	var _shader, _light;
	var _config = require("WavesConfig");
	this.group = new THREE.Group;
	(function() {
		initMesh();
		_this.startRender(loop)
	}());

	function initMesh() {
		let geom = WavesTerrain.getGeom();
		_shader = new Shader("WavesTerrain", "WavesTerrainColor");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			transition: {
				type: "f",
				value: 1
			},
			transHeight: {
				type: "f",
				value: 1.2
			},
			transDirection: {
				type: "f",
				value: 0
			},
			terrainHeight: {
				type: "f",
				value: 1
			},
			baseColor: {
				type: "v3",
				value: new THREE.Color(_config.terrain.base)
			},
			bgMap: {
				type: "t",
				value: Background.instance().rt.texture
			},
			bgResolution: {
				type: "v2",
				value: Background.instance().resolution
			}
		};
		let light = new THREE.PointLight(_config.terrain.light);
		light.position.set(100, 100, 0);
		_shader.lights.push(light);
		_shader.receiveLight = true;
		_shader.material.transparent = true;
		let mesh = new THREE.Mesh(geom, _shader.material);
		_this.group.add(mesh);
		if(Tests.renderVFX()) {
			let depthShader = new Shader("WavesTerrain", "WavesTerrainDepth");
			depthShader.uniforms = _shader.uniforms;
			mesh.depthMaterial = depthShader.material;
			FX.Depth.instance().add(mesh)
		}
		_light = light
	}

	function loop() {
		_shader.set("time", Render.TSL * .00005);
		if(Joy.LIGHT) _light.position.lerp(Joy.LIGHT, .07)
	}
	this.animateOut = function() {
		_shader.tween("terrainHeight", 0, 1e3, "easeOutCubic", 2e3);
		_shader.tween("transHeight", -.22, Config.TRANSITION_TIME * .65, Config.TRANSITION_EASE_OUT);
		_shader.tween("transition", 0, Config.TRANSITION_TIME, Config.TRANSITION_EASE_OUT, () => {
			_shader.material.visible = false
		})
	};
	this.animateIn = function() {
		_shader.material.visible = true;
		_shader.set("transition", 0);
		_shader.set("transDirection", 1);
		_shader.set("transHeight", 0);
		_shader.tween("transition", 1, Config.TRANSITION_TIME, Config.TRANSITION_EASE);
		_shader.tween("transHeight", 1, Config.TRANSITION_TIME, Config.TRANSITION_EASE)
	}
}, () => {
	var _geom, _shader, _light;
	WavesTerrain.getGeom = function() {
		if(!_geom) {
			_geom = Utils3D.loadGeometry("plane");
			_geom.scale(.1, .1, .1);
			_geom.translate(0, 0, 0);
			_geom.computeBoundingBox();
			let posArray = _geom.attributes.position.array;
			let uvArray = _geom.attributes.uv.array;
			let count = _geom.attributes.uv.count;
			for(let i = 0; i < count; i++) {
				let x = posArray[i * 3 + 0];
				let z = posArray[i * 3 + 2];
				let u = Utils.range(x, _geom.boundingBox.min.x, _geom.boundingBox.max.x, 0, 1);
				let v = Utils.range(z, _geom.boundingBox.min.z, _geom.boundingBox.max.z, 0, 1);
				uvArray[i * 2 + 0] = u;
				uvArray[i * 2 + 1] = v
			}
		}
		return _geom
	}
});
Class(function WavesWater() {
	Inherit(this, Component);
	var _this = this;
	var _shader;
	var _config = require("WavesConfig");
	this.group = new THREE.Group;
	(function() {
		initMesh();
		_this.startRender(loop)
	}());

	function initMesh() {
		let geom = WavesTerrain.getGeom();
		_shader = _this.initClass(Shader, "WavesWater", "WavesWaterColor");
		_shader.uniforms = {
			height: {
				type: "f",
				value: Hardware.ROOMSCALE_VR ? 1 : 2
			},
			noiseOffset: {
				type: "v3",
				value: new THREE.Vector3
			},
			baseColor: {
				type: "c",
				value: new THREE.Color(_config.water.base)
			},
			bgMap: {
				type: "t",
				value: Background.instance().rt.texture
			},
			bgResolution: {
				type: "v2",
				value: Background.instance().resolution
			},
			color0: {
				type: "v3",
				value: new THREE.Color(_config.underwater.color0)
			},
			color1: {
				type: "v3",
				value: new THREE.Color(_config.underwater.color1)
			},
			tPrevFrame: {
				type: "t",
				value: null
			},
			transition: {
				type: "f",
				value: 1
			},
			transDirection: {
				type: "f",
				value: 1
			},
			transHeight: {
				type: "f",
				value: 0
			},
			onlyPos: {
				type: "f",
				value: 1
			},
			flatten: {
				type: "f",
				value: 0
			},
			sat: {
				type: "f",
				value: 0
			}
		};
		let light = new THREE.PointLight(_config.water.light);
		light.position.set(100, 100, 0);
		_shader.lights.push(light);
		_shader.receiveLight = true;
		_shader.material.transparent = true;
		if(Global.PLAYGROUND) {}
		let mesh = new THREE.Mesh(geom, _shader.material);
		_this.group.add(mesh);
		if(Tests.renderVFX()) {
			let depthShader = new Shader("WavesWater", "WavesTerrainDepth");
			depthShader.uniforms = _shader.uniforms;
			mesh.depthMaterial = depthShader.material;
			FX.Depth.instance().add(mesh)
		}
	}

	function loop() {
		_shader.set("tPrevFrame", FX.Translucency.instance().rt);
		_shader.uniforms.noiseOffset.value.z = Render.TSL * .0001
	}
	this.animateIn = function() {
		_shader.set("height", Hardware.ROOMSCALE_VR ? 1 : 2);
		_shader.tween("transHeight", 20, Config.TRANSITION_TIME, Config.TRANSITION_EASE, 250)
	};
	this.animateOut = function() {};
	this.desaturate = function() {
		_shader.tween("sat", .55, 3e3, "easeInOutSine");
		TweenManager.tween(Background.instance(), {
			desaturate: .55
		}, 3e3, "easeInOutSine")
	}
});
Class(function WomanElement() {
	Inherit(this, Component);
	var _this = this;
	var $this;
	var _shader, _geometry, _system, _light, _mesh, _behavior, _converter, _camera;
	var _strength = new DynamicObject({
		v: 1
	});
	var _mouse = new Vector2;
	var _points;
	_this.group = new THREE.Group;
	_this.group.scale.y = .7;
	(function() {
		initMesh();
		initParticles();
		addListeners();
		_this.startRender(loop);
		_this.delayedCall(() => _this.animateIn(), 100)
	}());

	function initMesh() {
		_geometry = WomanElement.getGeom();
		_shader = new Shader("WomanElement");
		_shader.uniforms = {
			time: {
				type: "f",
				value: 0
			},
			scale: {
				type: "f",
				value: .2
			},
			color0: {
				type: "c",
				value: new THREE.Color(1118481)
			},
			color1: {
				type: "c",
				value: new THREE.Color(0)
			},
			fogColor: {
				type: "c",
				value: new THREE.Color(0)
			},
			tNormal: {
				type: "t",
				value: Utils3D.getTexture("assets/images/scenes/woman/normal.jpg")
			},
			tMatcap: {
				type: "t",
				value: Utils3D.getTexture("assets/images/scenes/woman/reflection-matcap.jpg")
			},
			hueShift: {
				type: "f",
				value: 0
			},
			satShift: {
				type: "f",
				value: 0
			},
			varShift: {
				type: "f",
				value: -.9
			},
			opacity: {
				type: "f",
				value: 0
			},
			alpha: {
				type: "f",
				value: Device.mobile ? .1 : .05
			}
		};
		_light = new THREE.PointLight;
		_light.position.set(100, 100, 0);
		_shader.lights.push(_light);
		_shader.receiveLight = true;
		_shader.material.transparent = true;
		_shader.material.depthTest = false;
		_shader.material.blending = THREE.AdditiveBlending;
		_mesh = new THREE.Mesh(_geometry, _shader.material);
		_this.group.add(_mesh);
		FX.Light.instance().addLight(_mesh)
	}

	function initParticles() {
		_system = _this.initClass(ParticlePhysics);
		let scale = Utils.doRandom(.1, .5, 4);
		for(let i = 3; i < _geometry.vertices.length; i++) {
			let p = new Particle(new Vector3);
			p.pos.copy(_geometry.vertices[i]);
			p.index = i;
			p.vertice = _geometry.vertices[i];
			p.scale = scale;
			if(i % 3 == 0) scale = Utils.doRandom(.1, .5, 4);
			_system.addParticle(p)
		}
		_converter = _this.initClass(ParticlePhysicsBufferConverter, _geometry.buffer, _system);
		_camera = _this.initClass(ParticleEngineCameraTransfer, World.CAMERA);
		_behavior = _this.initClass(WomanParticlesBehavior, _camera);
		_system.addBehavior(_behavior)
	}

	function loop(t) {
		_shader.set("time", Render.TSL * .00015 * _strength.v);
		_camera.update();
		_behavior.update();
		_system.update();
		_mouse.lerp(Mouse, .1);
		_geometry.verticesNeedUpdate = true
	}

	function addListeners() {
		_this.events.subscribe(EmmitEvents.BEAT_HIT, beatHit)
	}

	function beatHit(e) {
		switch(e.type) {
			case "beat":
				if(e.count % 8 == 0 && e.count < 445) {
					_shader.set("opacity", .8);
					_shader.tween("opacity", 0, 4e3, "easeInOutSine");
					_behavior.bounce()
				}
				break;
			case "start":
				_behavior.animateIn();
				_shader.tween("alpha", 1, 9e4, "easeInOutSine");
				TweenManager.tween(_this.group.position, {
					z: 0,
					y: 0
				}, 8e4, "easeOutSine");
				TweenManager.tween(_this.group.scale, {
					y: 1
				}, 8e4, "easeOutSine");
				break;
			case "end":
				_behavior.animateOut();
				break;
			case "out":
				_shader.tween("alpha", 0, 2e4, "easeInOutSine");
				break
		}
	}
	this.animateIn = function() {}
}, () => {
	var _geom, _shader, _light;
	WomanElement.getGeom = function() {
		if(!_geom) {
			let geom = Utils3D.loadGeometry("woman");
			geom.scale(.1, .1, .1);
			geom.translate(0, -.8, 0);
			geom.rotateY(Utils.toRadians(-90));
			_geom = (new THREE.Geometry).fromBufferGeometry(geom);
			_geom.computeBoundingBox();
			var vertices = [];
			for(var i = 0, il = _geom.faces.length; i < il; i++) {
				var n = vertices.length;
				var face = _geom.faces[i];
				var a = face.a;
				var b = face.b;
				var c = face.c;
				var va = _geom.vertices[a];
				var vb = _geom.vertices[b];
				var vc = _geom.vertices[c];
				vertices.push(va.clone());
				vertices.push(vb.clone());
				vertices.push(vc.clone());
				face.a = n;
				face.b = n + 1;
				face.c = n + 2
			}
			_geom.vertices = vertices;
			let count = _geom.vertices.length;
			_geom.buffer = new THREE.BufferGeometry;
			let position = new Float32Array(count * 3);
			let attribs = new Float32Array(count * 4);
			for(let i = 0; i < count; i++) {
				position[i * 3 + 0] = _geom.vertices[i].x;
				position[i * 3 + 1] = _geom.vertices[i].y;
				position[i * 3 + 2] = _geom.vertices[i].z;
				attribs[i * 4 + 0] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 1] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 2] = Utils.doRandom(0, 1, 4);
				attribs[i * 4 + 3] = Utils.doRandom(0, 1, 4)
			}
			_geom.buffer.addAttribute("position", new THREE.BufferAttribute(position, 3));
			_geom.buffer.addAttribute("attribs", new THREE.BufferAttribute(attribs, 4))
		}
		return _geom
	}
});
Class(function WomanParticlesBehavior(_camera) {
	Inherit(this, Component);
	var _this = this;
	var _dist = 0;
	var _strength = 0;
	var _radius = 0;
	var _range = 0;
	var _explode = 0;
	var _adjust = 1;
	var _projection = _this.initClass(ScreenProjection, World.CAMERA);
	var _v2 = new Vector2;
	var _velocity = new Vector2;
	var _prev = new Vector2;
	var _screen = new Vector2;
	var _v3 = new THREE.Vector3;
	var _blow = new DynamicObject({
		v: Device.mobile ? 10 : 12
	});
	var _bounce = new DynamicObject({
		v: 1
	});
	var _lerp = Device.mobile ? .1 : .05;
	(function() {}());

	function init(p) {
		p.target = (new Vector3).copy(p.pos);
		p.origin = (new Vector3).copy(p.pos);
		p.move = (new Vector3).copy(p.pos);
		p.move.copy(p.origin);
		p.move.multiply(1 + p.scale * _blow.v)
	}
	this.update = function() {
		_screen.set(Stage.width, Stage.height);
		let screenLen = _screen.length();
		_range = Utils.range(_blow.v, 20, 0, .15, .5);
		_radius = screenLen * _range;
		_dist = Math.pow(_radius, 2);
		_velocity.subVectors(Mouse, _prev);
		let len = _velocity.length();
		if(len > 100) len = 0;
		let strength = Utils.range(len, 0, screenLen / 40, 0, 1, true);
		_strength += (strength - _strength) * .2;
		_explode = Utils.range(_blow.v, 20, 0, .005, .001);
		_prev.copy(Mouse)
	};
	this.animateIn = function() {
		TweenManager.tween(_blow, {
			v: 0
		}, 8e4, "easeOutSine")
	};
	this.animateOut = function() {
		TweenManager.tween(_blow, {
			v: Device.mobile ? 20 : 30
		}, 6e4, "easeInSine")
	};
	this.bounce = function() {
		_bounce.v = 1.1;
		TweenManager.tween(_bounce, {
			v: 1
		}, 4e3, "easeInOutSine")
	};
	this.applyBehavior = function(p) {
		if(!p.target) init(p);
		_v3.copy(p.pos);
		let screen = _projection.project(_v3);
		_v2.subVectors(screen, Mouse);
		p.move.copy(p.origin);
		p.move.multiply(1 + p.scale * _blow.v * _bounce.v);
		let lenSq = _v2.lengthSq();
		if(lenSq < _dist * _strength) {
			let angle = Math.atan2(_v2.y, _v2.x);
			_v2.copy(p.move).addAngleRadius(-angle, _radius * _strength * _adjust * _explode * p.scale);
			p.target.set(_v2.x, _v2.y, p.move.z)
		} else {
			p.target.lerp(p.move, _lerp)
		}
		p.pos.lerp(p.target, _lerp);
		p.vertice.copy(p.pos)
	};
	this.set("strength", v => {
		_adjust = v
	})
});
Class(function UIAboutButton() {
	Inherit(this, View);
	var _this = this;
	var $this, $border, $text, $over, $solid;
	var _offset = Mobile.phone ? 30 : 40;
	_this.width = Mobile.phone ? 38 : 46;
	_this.height = Mobile.phone ? 38 : 46;
	(function() {
		initHTML();
		initText();
		addListeners()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(_this.width, _this.height).css({
			bottom: _offset,
			right: _offset,
			overflow: "hidden"
		}).setZ(1e3);
		$this.css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 2e3, "easeInOutSine", Global.IN_SCENE ? 4e3 : 2e3);
		$border = $this.create(".border");
		$border.size(_this.width - 2, _this.height - 2).css({
			border: "1px solid " + Global.UI_COLOR,
			opacity: .3
		});
		$solid = $this.create(".solid");
		$solid.size("100%").transform({
			y: _this.height
		}).bg(Global.UI_COLOR)
	}

	function initText() {
		let size = Mobile.phone ? 14 : 17;
		$text = $this.create(".text");
		$text.fontStyle("Mont", size, Global.UI_COLOR);
		$text.css({
			width: "100%",
			top: _this.height / 2 - size / 2 - 1,
			lineHeight: size,
			textAlign: "center"
		});
		$text.text("?");
		$over = $this.create(".text");
		$over.fontStyle("Mont", size, Global.UI_COLOR == "#ccc" ? "444" : "#fff");
		$over.css({
			width: "100%",
			top: _this.height / 2 - size / 2 - 1,
			lineHeight: size,
			textAlign: "center",
			opacity: 0
		}).transform({
			y: 10
		});
		$over.text("?")
	}

	function addListeners() {
		$this.interact(hover, click);
		$this.hit.mouseEnabled(true)
	}

	function hover(e) {
		switch(e.action) {
			case "over":
				$over.stopTween().transform({
					y: 10
				}).tween({
					y: 0,
					opacity: 1
				}, 400, "easeOutQuart");
				$solid.stopTween().transform({
					y: _this.height
				}).tween({
					y: 0
				}, 400, "easeOutQuart");
				break;
			case "out":
				$solid.tween({
					y: -_this.height
				}, 600, "easeOutQuart");
				$over.tween({
					y: -10,
					opacity: 0
				}, 600, "easeOutQuart");
				break
		}
	}

	function click() {
		About.instance().animateIn()
	}
	this.animateOut = function(callback) {
		$this.tween({
			opacity: 0
		}, 500, "easeOutSine", callback)
	}
});
Class(function UIClose(_data) {
	Inherit(this, View);
	var _this = this;
	var $this, $lines;
	var _lines = [];
	var _offset = Mobile.phone ? 30 : 40;
	var _size = Mobile.phone ? 34 : 44;
	var _alpha = _data.color ? .85 : .7;
	(function() {
		initHTML();
		initLines();
		addListeners();
		resizeHandler()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(_size, _size).css({
			top: _offset,
			right: _offset
		}).invisible()
	}

	function initLines() {
		$lines = $this.create(".lines");
		$lines.size("100%").css({
			opacity: _alpha
		});
		let width = Math.round(_size * .22);
		let count = Config.TRACKS.length;
		for(var i = 0; i < count; i++) {
			var $line = $lines.create(".line");
			$line.size(width, _size).css({
				left: i * width
			});
			let l = 10 + i / Config.TRACKS.length * 80;
			let h = !_data.hue ? 0 : _data.id == "Flame" || _data.id == "Wantit" ? _data.hue - (count / 2 - i) * (_data.id == "Flame" ? 10 : 8) : _data.hue + (count / 2 - i) * 4;
			let s = !_data.hue ? 0 : 80 - l * .05;
			if(h < 0) h = 360 + h;
			if(_data.solid) {
				h = _data.hue;
				l = 100 - i / Config.TRACKS.length * 50;
				s = 100
			}
			$line.css({
				backgroundColor: "hsl(" + Math.round(h) + "," + Math.round(s) + "%," + Math.round(l) + "%)"
			});
			_lines.push($line)
		}
		_this.width = width * _lines.length;
		_this.height = _size;
		$this.size(_this.width, _this.height)
	}

	function addListeners() {
		$this.interact(hover, click);
		$this.hit.mouseEnabled(true);
		$this.hit.size(_this.width * 1.5, _this.height * 1.5).center();
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function hover(e) {
		if(_this.clicked) return;
		switch(e.action) {
			case "over":
				$lines.tween({
					opacity: 1
				}, 200, "easeOutSine");
				break;
			case "out":
				$lines.tween({
					opacity: _alpha
				}, 400, "easeOutSine");
				break
		}
	}

	function resizeHandler() {
		if(Stage.width > Stage.height) $this.transform({
			rotation: 0,
			y: 0,
			x: 0
		});
		else $this.transformPoint("100%", "100%").transform({
			rotation: -90,
			y: -_size
		})
	}

	function click() {
		_this.clicked = true;
		for(var i = 0; i < _lines.length; i++) {
			_lines[i].tween({
				scaleY: 0
			}, 800, "easeOutQuart", i * 30)
		}
		Data.Player.pause();
		defer(function() {
			_this.events.fire(EmmitEvents.TRACK_COMPLETE)
		})
	}
	this.animateIn = function() {
		$this.visible();
		for(var i = 0; i < _lines.length; i++) {
			_lines[i].transform({
				scaleY: 0
			}).tween({
				scaleY: 1
			}, 25e2, "easeInOutQuint", i * 80)
		}
	}
});
Class(function UIInfo(_data) {
	Inherit(this, View);
	var _this = this;
	var $this, $text;
	var _offset = Mobile.phone ? 30 : 40;
	var _size = Mobile.phone ? 15 : 18;
	(function() {
		initHTML();
		initText()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(400, _size).css({
			bottom: _offset,
			left: _offset
		}).invisible()
	}

	function initText() {
		$text = $this.create(".text");
		$text.fontStyle("MontBold", _size, _data.color || "#fff");
		$text.size("100%").css({
			letterSpacing: _size * .05,
			lineHeight: _size,
			textAlign: "left",
			textTransform: "uppercase"
		});
		$text.html(_data.name)
	}
	this.animateIn = function() {
		$this.visible();
		$text.css({
			opacity: 0
		}).tween({
			opacity: _data.color ? .8 : .6,
			y: 0
		}, 6e3, "easeInOutSine")
	}
});
Class(function UIMenu() {
	Inherit(this, View);
	var _this = this;
	var $this;
	var _menu1, _menu2, _current;
	(function() {
		initHTML();
		initMenus();
		addListeners();
		resizeHandler()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size("100%").invisible().bg("#000");
		if(Global.LOAD_ECLIPSE) $this.css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 1e3, "easeOutSine")
	}

	function initMenus() {
		_menu1 = _this.initClass(UIMenuBars, Config.TRACKS);
		_menu2 = _this.initClass(UIMenuBars, Config.VIDEOS, true);
		_current = Global.LOAD_ECLIPSE ? _menu2 : _menu1
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler);
		_this.events.bubble(_menu1, HydraEvents.CLICK);
		_this.events.bubble(_menu1, HydraEvents.COMPLETE);
		if(_menu2) {
			_this.events.bubble(_menu2, HydraEvents.CLICK);
			_this.events.bubble(_menu2, HydraEvents.COMPLETE);
			_this.events.subscribe(KeyboardUtil.UP, keyPress);
			_menu1.events.add(HydraEvents.UPDATE, changeMenu);
			_menu2.events.add(HydraEvents.UPDATE, changeMenu);
			if(!Device.mobile) ScrollUtil.link(scroll);
			else $this.touchSwipe(swipe)
		}
	}

	function keyPress(e) {
		if(e.keyCode == 40) changeMenu(1);
		if(e.keyCode == 38) changeMenu(-1)
	}

	function swipe(e) {
		if(e.direction == "up") changeMenu(1);
		if(e.direction == "down") changeMenu(-1)
	}

	function changeMenu(dir) {
		if(_this.disabled || Global.IN_ABOUT) return;
		_this.disabled = true;
		_this.delayedCall(function() {
			_this.disabled = false
		}, 1e3);
		dir = !dir || isNaN(dir) ? 1 : dir;
		_current.animateOut(-dir);
		_current = _current == _menu1 ? _menu2 : _menu1;
		_current.animateIn(dir)
	}

	function resizeHandler() {
		var width, height;
		if(Stage.width < Stage.height) {
			var h = Math.min(900, Utils.convertRange(Stage.height, 500, 1e3, 320, 550));
			height = Math.round(h / Config.TRACKS.length);
			width = Math.round(height * 4.5)
		} else {
			var w = Math.min(900, Utils.convertRange(Stage.width, 500, 11e2, 300, 640));
			width = Math.round(w / Config.TRACKS.length);
			height = Math.round(width * 3.8)
		}
		_menu1.resize(width, height);
		if(_menu2) _menu2.resize(width, height)
	}

	function scroll(e) {
		if(Math.abs(e.y) < 10) return;
		changeMenu(e.y < 0 ? -1 : 1)
	}
	this.animateIn = function() {
		_current.animateIn()
	};
	this.onDestroy = function() {
		ScrollUtil.unlink(scroll)
	}
});
Class(function UIMenuBars(_data, _eclipse) {
	Inherit(this, View);
	var _this = this;
	var $this, $wrapper, $bg, $slices, $arrow, $line, $dot, $zoom, $text1, $text2;
	var _slices, _social;
	(function() {
		initHTML();
		initSocial();
		initBG();
		initSlices();
		initArrow();
		addListeners()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size("100%").invisible().mouseEnabled(false).css({
			overflow: "hidden"
		});
		if(_eclipse) $this.div.className += " eclipse";
		else $this.bg("#000");
		$wrapper = $this.create(".wrapper");
		$wrapper.size("100%")
	}

	function initSocial() {
		_social = _this.initClass(AboutSocial, !_eclipse, [$wrapper])
	}

	function initBG() {
		$bg = $wrapper.create(".bg");
		$bg.size("100%").bg(_eclipse ? "#000" : "#f5f5f5");
		if(_eclipse) $bg.div.className += " eclipse";
		$bg.inner = $bg.create(".inner");
		$bg.inner.size("100%").bg(!_eclipse ? "#000" : "#f5f5f5").transform({
			scaleX: 0
		})
	}

	function initSlices() {
		$slices = $wrapper.create(".slices");
		$slices.size("100%");
		initText();
		_slices = [];
		for(var i = 0; i < _data.length; i++) {
			var l = 70 - i / _data.length * 70;
			_data[i].bg = "hsl(0,0%," + Math.round(l) + "%)";
			if(_eclipse) {
				_data[i].dark = true;
				_data[i].hue = 264 + i * 4;
				_data[i].bg = "hsl(" + _data[i].hue + ", 100%," + Math.round(i / _data.length * 30 + 30) + "%)";
				_data[i].glow = "hsl(" + _data[i].hue + ", 100%, 60%)"
			}
			_data[i].index = i;
			var slice = _this.initClass(UIMenuSlice, _data[i], [$slices]);
			slice.colorBase = _data[i].bg;
			slice.move = new Vector2(0, 0);
			slice.position = new Vector2(0, 0);
			_slices.push(slice)
		}
	}

	function initText() {
		let size = Device.mobile.phone ? 8 : 9;
		$text1 = $slices.create(".text1");
		$text1.fontStyle("MontBold", size * 1.4, "#888");
		$text1.size(300, size).center(1, 0).css({
			lineHeight: size,
			opacity: 0,
			letterSpacing: size * .25,
			top: Device.mobile.phone ? _eclipse ? -42 : -30 : -60,
			textAlign: "center"
		});
		$text1.html("PROLOGUE EP");
		if(_eclipse) {
			$text2 = $slices.create(".text2");
			$text2.fontStyle("Mont", size, "#888");
			$text2.size(300, size).center(1, 0).css({
				lineHeight: size,
				opacity: 0,
				letterSpacing: size * .2,
				top: Device.mobile.phone ? -30 : -45,
				textAlign: "center"
			});
			$text2.html("8.21.2017");
			$text1.html("ECLIPSE EP")
		}
	}

	function initArrow() {
		$arrow = $slices.create(".text2");
		$arrow.fontStyle("Mont", Device.mobile.phone ? 11 : 14, _eclipse ? "#aaa" : "#777");
		$arrow.size(80, 80).center(1, 0).css({
			lineHeight: 80,
			opacity: 0,
			bottom: Device.mobile.phone ? -65 : -95,
			textAlign: "center"
		});
		$arrow.html("▼");
		$arrow.mouseEnabled(true);
		$arrow.interact(function(e) {
			$arrow.tween({
				opacity: e.action == "over" ? 1 : .6
			}, e.action == "over" ? 200 : 500, "easeOutSine")
		}, function() {
			_this.events.fire(HydraEvents.UPDATE)
		})
	}

	function loop() {
		for(var i = _slices.length - 1; i > -1; i--) {
			var slice = _slices[i];
			slice.position.lerp(slice.move, .12);
			if(_this.portrait) {
				if(slice.glow) {
					slice.glow.y = slice.position.y;
					slice.glow.transform()
				}
				slice.wrapper1.y = slice.position.y;
				slice.wrapper1.scaleX = Utils.convertRange(slice.position.x, 0, -slice.expanded + slice.height, 1.15, 1);
				slice.wrapper1.transform();
				slice.text.y = slice.position.y + slice.expanded / 2 - slice.height / 2;
				slice.text.transform();
				slice.wrapper2.y = slice.position.x;
				slice.wrapper2.transform();
				slice.wrapper3.y = -slice.position.x * .5;
				slice.wrapper3.transform()
			} else {
				if(slice.glow) {
					slice.glow.x = slice.position.x;
					slice.glow.transform()
				}
				slice.wrapper1.x = slice.position.x;
				slice.wrapper1.scaleY = Utils.convertRange(slice.position.y, 0, -slice.expanded + slice.width, 1.15, 1);
				slice.wrapper1.transform();
				slice.text.x = slice.position.x + slice.expanded / 2 - slice.width / 2;
				slice.text.transform();
				slice.wrapper2.x = slice.position.y;
				slice.wrapper2.transform();
				slice.wrapper3.x = -slice.position.y * .5;
				slice.wrapper3.transform()
			}
		}
	}

	function addListeners() {
		for(var i = 0; i < _slices.length; i++) {
			_slices[i].events.add(HydraEvents.HOVER, sliceHover);
			_slices[i].events.add(HydraEvents.CLICK, sliceClick)
		}
		if(Device.mobile) {
			$bg.mouseEnabled(true);
			$bg.bind("touchstart", hoverOut)
		}
	}

	function sliceHover(e) {
		if(_this.clicked || !_this.visible) return;
		if(_this.timeout) clearTimeout(_this.timeout);
		let maxSlices = _eclipse ? 7 : Config.TRACKS.length;
		switch(e.action) {
			case "over":
				Data.Preview.play(e);
				if(_this.portrait) {
					var remaining = _slices[0].height * maxSlices - _slices[0].expanded;
					var skinny = Math.round(remaining / (_slices.length - 1));
					var y = (_slices[0].height * _slices.length - _slices[0].height * maxSlices) / 2;
					var divide = 0;
					for(var i = 0; i < _slices.length; i++) divide += Math.abs(i - e.index);
					for(var i = 0; i < _slices.length; i++) {
						var slice = _slices[i];
						var moveY = -i * slice.height + y;
						var perc = Math.abs(i - e.index) / divide;
						var height = Math.round(skinny * 1.8 - remaining * perc * .8);
						var h = e.index == i ? 0 : -slice.expanded + height;
						slice.move.set(h, moveY);
						if(i == e.index) slice.hoverIn();
						else slice.hoverOut();
						y += e.index == i ? slice.expanded : height
					}
				} else {
					var remaining = _slices[0].width * maxSlices - _slices[0].expanded;
					var skinny = Math.round(remaining / (_slices.length - 1));
					var x = (_slices[0].width * _slices.length - _slices[0].width * maxSlices) / 2;
					var divide = 0;
					for(var i = 0; i < _slices.length; i++) divide += Math.abs(i - e.index);
					for(var i = 0; i < _slices.length; i++) {
						var slice = _slices[i];
						var moveX = -i * slice.width + x;
						var perc = Math.abs(i - e.index) / divide;
						var width = Math.round(skinny * 1.8 - remaining * perc * .8);
						var w = e.index == i ? 0 : -slice.expanded + width;
						slice.move.set(moveX, w);
						if(i == e.index) slice.hoverIn();
						else slice.hoverOut();
						x += e.index == i ? slice.expanded : width
					}
				}
				for(var i = 0; i < _slices.length; i++) {
					let l = _eclipse ? 10 + i / _data.length * 80 : 75 - i / _data.length * 70;
					let h = e.reverse ? e.hue + (e.index - i) * (e.id == "Flame" ? 10 : 5) : e.hue - (e.index - i) * 5;
					let s = 90 - l * .1;
					if(e.id == "Wantit") s -= 20;
					if(e.solid) {
						h = e.hue;
						l = 90 - i / _data.length * 50;
						s = i / _data.length * 50 + 50
					}
					if(h < 0) h = 360 + h;
					if(e.hue) _slices[i].color.div.style.backgroundColor = "hsl(" + Math.round(h) + "," + Math.round(s) + "%," + Math.round(l) + "%)";
					else _slices[i].color.div.style.backgroundColor = _slices[i].colorBase
				}
				break;
			case "out":
				_this.timeout = _this.delayedCall(hoverSlicesOut, 300);
				break
		}
	}

	function hoverSlicesOut() {
		Data.Preview.stop();
		for(var i = 0; i < _slices.length; i++) {
			var slice = _slices[i];
			if(_this.portrait) {
				var height = -slice.expanded + slice.height;
				slice.move.set(height, 0)
			} else {
				var width = -slice.expanded + slice.width;
				slice.move.set(0, width)
			}
			slice.hoverOut();
			slice.color.div.style.backgroundColor = _slices[i].colorBase
		}
	}

	function hoverOut() {
		hoverSlicesOut()
	}

	function sliceClick(e) {
		if(_this.clicked || !_this.visible) return;
		_this.clicked = true;
		_this.stopRender(loop);
		for(var i = _slices.length - 1; i > -1; i--) _slices[i].animateOut();
		if($text1) $text1.tween({
			opacity: 0
		}, 500, "easeOutSine", 200);
		if($text2) $text2.tween({
			opacity: 0
		}, 500, "easeOutSine");
		if($arrow) $arrow.mouseEnabled(false).tween({
			opacity: 0
		}, 500, "easeOutSine");
		_social.animateOut();
		_this.events.fire(HydraEvents.CLICK, e);
		if(_this.portrait) {
			$bg.inner.transform({
				scaleX: 0,
				scaleY: 1
			}).tween({
				scaleX: 1
			}, 11e2, "easeInOutQuint", 600, complete)
		} else {
			$bg.inner.transform({
				scaleX: 1,
				scaleY: 0
			}).tween({
				scaleY: 1
			}, 11e2, "easeInOutQuint", 600, complete)
		}

		function complete() {
			_this.events.fire(HydraEvents.COMPLETE, e)
		}
	}

	function resetSlices() {
		for(var i = _slices.length - 1; i > -1; i--) {
			var slice = _slices[i];
			slice.wrapper1.x = slice.wrapper1.y = 0;
			slice.wrapper1.scaleY = slice.wrapper1.scaleX = 1;
			slice.wrapper1.transform();
			slice.wrapper2.x = slice.wrapper2.y = 0;
			slice.wrapper2.transform();
			slice.wrapper3.x = slice.wrapper3.y = 0;
			slice.wrapper3.transform();
			slice.text.x = slice.text.y = 0;
			slice.text.transform()
		}
	}
	this.resize = function(width, height) {
		resetSlices();
		if(Mobile.phone && Stage.width < 400) _social.element.css({
			left: 40,
			marginLeft: ""
		});
		if(Stage.width < Stage.height) {
			_this.portrait = true;
			_this.height = height * _slices.length;
			_this.width = width;
			var max = Math.round(height * 3);
			for(var i = 0; i < _slices.length; i++) {
				_slices[i].css({
					left: 0,
					top: i * height
				}).resize(width, height, max);
				_slices[i].move.set(-max + height, 0);
				_slices[i].position.set(-max + height, 0)
			}
			$slices.size(width, height * _slices.length).center();
			if($slices.glow) $slices.glow.size("100%").css({
				boxShadow: "0 0 " + height * 5 + "px #777"
			})
		} else {
			_this.portrait = false;
			_this.width = width * _slices.length;
			_this.height = height;
			var max = Math.round(width * 4.7);
			for(var i = 0; i < _slices.length; i++) {
				_slices[i].css({
					top: 0,
					left: i * width
				}).resize(width, height, max);
				_slices[i].move.set(0, -max + width);
				_slices[i].position.set(0, -max + width)
			}
			$slices.size(width * _slices.length, height).center();
			if($slices.glow) $slices.glow.size("100%").css({
				boxShadow: "0 0 " + width * 5 + "px #777"
			})
		}
	};
	this.animateIn = function(dir) {
		if(_this.visible) return;
		_this.visible = true;
		resetSlices();
		_this.startRender(loop);
		_this.delayedCall(_social.animateIn, dir ? 100 : 1e3);
		if(_eclipse) Global.HUE = .75;
		if($text1) $text1.stopTween().css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 1e3, "easeInOutSine", dir ? 0 : 18e2);
		if($text2) $text2.stopTween().css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 1e3, "easeInOutSine", dir ? 500 : 22e2);
		if($arrow) $arrow.stopTween().css({
			opacity: 0
		}).tween({
			opacity: .6
		}, 1e3, "easeInOutSine", dir ? 1e3 : 25e2);
		if(dir) {
			$this.visible();
			$this.stopTween().transform({
				y: Stage.height * dir
			}).tween({
				y: 0
			}, 1e3, "easeInOutQuart");
			$wrapper.stopTween().transform({
				y: -Stage.height * dir * .85
			}).tween({
				y: 0
			}, 1e3, "easeInOutQuart");
			for(var i = 0; i < _slices.length; i++) {
				_slices[i].show();
				if(Stage.width > Stage.height) {
					_slices[i].element.stopTween().transform({
						y: i % 2 == 0 ? -_this.height * .14 * dir : _this.height * .14 * dir
					}).tween({
						y: 0
					}, 15e2, "easeOutQuart")
				} else {
					_slices[i].element.stopTween().transform({
						x: i % 2 == 0 ? -_this.width * .14 * dir : _this.width * .14 * dir
					}).tween({
						x: 0
					}, 15e2, "easeOutQuart")
				}
			}
		} else {
			$this.visible();
			$bg.css({
				opacity: 0
			}).tween({
				opacity: 1
			}, 1e3, "easeOutSine");
			for(var i = 0; i < _slices.length; i++) _slices[i].animateIn(i * 80 + 400)
		}
	};
	this.animateOut = function(dir) {
		if(!_this.visible) return;
		_this.visible = false;
		$wrapper.tween({
			y: -Stage.height * dir * .85
		}, 1e3, "easeInOutQuart");
		$this.tween({
			y: Stage.height * dir
		}, 1e3, "easeInOutQuart", function() {
			hoverSlicesOut();
			_this.stopRender(loop);
			$this.invisible()
		});
		if(_eclipse) Global.HUE = 0;
		for(var i = 0; i < _slices.length; i++) {
			if(Stage.width > Stage.height) {
				_slices[i].element.tween({
					y: i % 2 == 0 ? -_this.height * .06 * dir : _this.height * .06 * dir
				}, 1e3, "easeInCubic")
			} else {
				_slices[i].element.tween({
					x: i % 2 == 0 ? -_this.width * .06 * dir : _this.width * .06 * dir
				}, 1e3, "easeInCubic")
			}
		}
	}
});
Class(function UIMenuSlice(_data) {
	Inherit(this, View);
	var _this = this;
	var $this, $wrapper, $glow, $solid, $color, $wrapper1, $lockText, $lock, $wrapper2, $wrapper3, $bg, $text, $unlocked, $code;
	var _text = _data.name;
	var _interval, _letters1, _letters2;
	(function() {
		initHTML();
		if(_data.locked) initLock();
		initText()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size("100%").invisible().setZ(1);
		$wrapper = $this.create(".wrapper");
		$wrapper.size("100%");
		if(_data.dark) {
			$glow = $wrapper.create(".glow");
			$glow.size("100%").css({
				boxShadow: "0 0 200px " + (_data.bg || "#ccc"),
				opacity: 0
			});
			_this.glow = $glow
		}
		$wrapper1 = $wrapper.create(".wrapper1");
		$wrapper1.size("100%").css({
			overflow: "hidden"
		});
		$wrapper2 = $wrapper1.create(".wrapper");
		$wrapper2.size("100%").css({
			overflow: "hidden"
		});
		$wrapper3 = $wrapper2.create(".wrapper");
		$wrapper3.size("100%");
		$color = $wrapper3.create(".animate-color");
		$color.size("100%").css({
			backgroundColor: _data.bg
		});
		_this.color = $color;
		_this.wrapper1 = $wrapper1;
		_this.wrapper2 = $wrapper2;
		_this.wrapper3 = $wrapper3;
		$bg = $wrapper3.create(".bg");
		$bg.size("100%").bg(_data.locked ? "#111" : _data.color || "#111").css({
			opacity: 0,
			overflow: "hidden"
		});
		$solid = $wrapper3.create(".solid");
		$solid.size("100%").bg("#000").css({
			opacity: 0
		}).setZ(10);
		if(_data.image) {
			$bg.inner = $bg.create(".inner");
			$bg.inner.size("100%").css({
				opacity: 0
			}).transform({
				scaleX: 1.2
			});
			$bg.image = $bg.inner.create(".inner");
			$bg.image.size("100%").bg("assets/images/menu/" + _data.image, "cover")
		}
	}

	function initLock() {
		$lock = $wrapper3.create(".lock");
		$lock.alpha = _data.dark ? .6 : _data.index * .2;
		$lock.size(22, 22).center().css({
			marginTop: -20,
			opacity: $lock.alpha
		}).bg("assets/images/ui/lock.png")
	}

	function initText() {
		$text = $this.create(".text");
		$text.fontStyle("MontBold", 60, "#eee");
		$text.size("100%").css({
			opacity: 0,
			textAlign: "center",
			textTransform: "uppercase"
		});
		_this.text = $text;
		if(_data.locked) {
			let size = Mobile.phone ? 8 : 10;
			$lockText = $text.create(".lockedtext");
			$lockText.fontStyle("Mont", size, _data.dark ? _data.glow : "#888");
			$lockText.size(300, 20).css({
				lineHeight: size * 1.4,
				opacity: 0,
				letterSpacing: size * .2,
				bottom: 20,
				textAlign: "center"
			});
			$lockText.html((Device.mobile ? "TAP" : "CLICK") + " TO STAY UPDATED")
		}
		$text.inner = $text.create(".inner");
		$text.inner.size("100%");
		$code = $text.inner.create(".text");
		$code.css({
			width: "100%",
			textAlign: "center",
			fontFamily: "Braille",
			color: _data.dark ? _data.glow : _data.locked ? "#222" : "#eee"
		});
		$code.html(_text);
		_letters1 = SplitTextfield.split($code);
		for(var i = 0; i < _letters1.length; i++) {
			_letters1[i].css({
				position: "relative",
				float: "",
				cssFloat: "",
				styleFloat: "",
				display: "inline-block"
			});
			if(_letters1.length > 10 && _letters1[i].div.innerHTML == "&nbsp;") {
				_this.doubleLine = true;
				_letters1[i].html("").css({
					display: "block"
				})
			}
		}
		if(!_data.locked) {
			$unlocked = $text.inner.create(".text");
			$unlocked.css({
				width: "100%",
				textAlign: "center"
			});
			$unlocked.html(_text);
			_letters2 = SplitTextfield.split($unlocked);
			_this.lines = 1;
			for(var i = 0; i < _letters2.length; i++) {
				_letters2[i].css({
					position: "relative",
					float: "",
					cssFloat: "",
					styleFloat: "",
					display: "inline-block"
				});
				if(_letters2.length > 10 && _letters2[i].div.innerHTML == "&nbsp;") {
					_this.lines++;
					_letters2[i].html("").css({
						display: "block"
					})
				}
			}
		}
	}

	function addListeners() {
		if(Device.mobile) {
			$wrapper3.bind("touchstart", start);
			$wrapper3.bind("touchend", end);
			$wrapper3.mouseEnabled(true)
		} else {
			$this.interact(hover, click);
			$this.hit.mouseEnabled(true);
			if(_data.locked) $this.hit.css({
				cursor: ""
			})
		}
	}

	function start() {
		_data.action = "over";
		_this.events.fire(HydraEvents.HOVER, _data)
	}

	function end() {
		if(_this.canClick) click()
	}

	function hover(e) {
		if(!_this.visible) return;
		_data.action = e.action;
		_this.events.fire(HydraEvents.HOVER, _data)
	}

	function click() {
		if(!_this.visible) return;
		if(_data.locked) {
			About.instance().animateIn();
			_data.action = "out";
			_this.events.fire(HydraEvents.HOVER, _data)
		} else if(_data.embed_id) {
			Embed.instance().animateIn(_data.embed_id);
			_data.action = "out";
			_this.events.fire(HydraEvents.HOVER, _data)
		} else {
			$solid.css({
				opacity: .1
			}).tween({
				opacity: 0
			}, 500, "easeOutSine");
			_this.events.fire(HydraEvents.CLICK, _data)
		}
	}

	function changeText() {
		if(!_this.hovered) return;
		var letter = Math.random().toString(36).replace(/[^a-z]+/g, "").substr(0, 1);
		_letters1[Utils.doRandom(0, _letters1.length - 1)].html(letter);
		_this.delayedCall(changeText, Utils.doRandom(50, 200))
	}
	this.hoverIn = function() {
		if(_this.hovered) return;
		_this.hovered = true;
		clearTimeout(_this.timeout);
		_this.timeout = _this.delayedCall(function() {
			if(_this.hovered) _this.canClick = true
		}, 1e3);
		if(_data.locked) changeText();
		$text.tween({
			opacity: 1
		}, 24e2, "easeOutCubic");
		$this.setZ(2);
		if(!_data.locked) {
			for(var i = 0; i < _letters1.length; i++) {
				var delay = Utils.doRandom(100, 600);
				_letters1[i].css({
					opacity: _data.locked ? 0 : 1
				}).tween({
					opacity: _data.locked ? 1 : 0
				}, 400, "easeInOutSine", delay);
				if(_letters2 && _letters2[i]) _letters2[i].css({
					opacity: 0
				}).tween({
					opacity: 1
				}, 300, "easeInOutSine", delay)
			}
		}
		if($glow) $glow.stopTween().css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 3e3, "easeOutSine", 400);
		$bg.stopTween().css({
			opacity: 0
		}).tween({
			opacity: 1
		}, $glow ? 12e2 : 500, "easeOutCubic");
		if($lock) $lock.tween({
			opacity: 0
		}, 200, "easeOutSine");
		if($lockText) $lockText.stopTween().css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 1e3, "easeOutSine");
		if($bg.inner) {
			$bg.inner.stopTween().css({
				opacity: 0
			}).tween({
				opacity: 1
			}, 3e3, "easeInOutSine")
		}
	};
	this.hoverOut = function() {
		if(!_this.hovered) return;
		_this.hovered = false;
		_this.canClick = false;
		clearTimeout(_this.timeout);
		$this.setZ(1);
		if($glow) $glow.stopTween().css({
			opacity: 0
		});
		$text.stopTween().css({
			opacity: 0
		});
		if($lock) $lock.tween({
			opacity: $lock.alpha
		}, 500, "easeOutSine");
		$bg.tween({
			opacity: 0
		}, 500, "easeOutSine");
		if($lockText) $lockText.tween({
			opacity: 0
		}, 500, "easeOutSine")
	};
	this.resize = function(width, height, expanded) {
		_this.width = width;
		_this.height = height;
		_this.expanded = expanded;
		var size = Utils.range(Math.min(_this.width, _this.height), 0, 200, 8, 20, true);
		if(Mobile.phone) size = 10;
		if($lock) $lock.size(size, size).center();
		var scale = Mobile.phone ? .35 : .3;
		var fontSize = Math.min(_this.width, _this.height) * scale;
		fontSize = Utils.clamp(fontSize, 8, 36);
		var textHeight = fontSize * _this.lines * 1.1;
		$text.css({
			fontSize: fontSize,
			lineHeight: fontSize * 1.1,
			letterSpacing: fontSize * .05
		});
		$text.size(_this.expanded, textHeight).center();
		if($glow) {
			let radius = Math.max(_this.width, _this.height);
			let shadow = "";
			for(var i = 0; i < 3; i++) {
				shadow += "0 0 " + (radius * .4 + radius * .3 * i) + "px hsl(" + _data.hue + ", 100%, " + (100 - i * 30) + "%)";
				if(i < 2) shadow += ", "
			}
			$glow.css({
				boxShadow: shadow
			})
		}
		$code.css({
			fontSize: fontSize * .8,
			top: fontSize * .1
		});
		$this.size(width, height);
		if(_this.width > _this.height) {
			$wrapper1.size(width, _this.expanded);
			$wrapper2.size(width, _this.expanded).transform({
				y: -_this.expanded + height
			});
			if($lockText) $lockText.size(_this.expanded, 20).css({
				top: _this.expanded / 2 - 30
			});
			$bg.size(width, _this.expanded);
			if($glow) $glow.size(width, _this.expanded)
		} else {
			$wrapper1.size(_this.expanded, height);
			$wrapper2.size(_this.expanded, height).transform({
				x: -_this.expanded + width
			});
			if($lockText) $lockText.size(_this.expanded, 20).css({
				top: _this.height / 2 - 20
			});
			$bg.size(_this.expanded, height);
			if($glow) $glow.size(_this.expanded, height)
		}
	};
	this.animateIn = function(delay) {
		if(_this.visible) return;
		_this.visible = true;
		$this.visible();
		if($lock) $lock.stopTween().css({
			opacity: 0
		}).tween({
			opacity: $lock.alpha
		}, 800, "easeOutSine", 16e2);
		if(_this.width < _this.height) $wrapper.transform({
			scaleY: 0,
			scaleX: 1,
			x: _this.baseX
		});
		else $wrapper.transform({
			scaleX: 0,
			scaleY: 1,
			x: _this.baseX
		});
		$wrapper.tween({
			scaleY: 1,
			scaleX: 1,
			x: _this.baseX
		}, 14e2, "easeInOutQuint", delay);
		_this.delayedCall(addListeners, 14e2 + delay)
	};
	this.show = function() {
		if(_this.visible) return;
		_this.visible = true;
		$this.visible();
		addListeners()
	};
	this.animateOut = function() {
		if(!_this.visible) return;
		_this.visible = false;
		$text.inner.tween({
			opacity: 0
		}, 500, "easeOutSine");
		if($bg.image) $bg.image.tween({
			opacity: 0
		}, 300, "easeOutSine");
		var time = _this.hovered ? 600 : 400;
		var ease = _this.hovered ? "easeInOutQuint" : "easeInOutCubic";
		if(_this.width < _this.height) $wrapper.tween({
			scaleY: 0
		}, time, ease);
		else $wrapper.tween({
			scaleX: 0
		}, time, ease)
	}
});
Class(function UIMobileClick(_data) {
	Inherit(this, View);
	var _this = this;
	var $this, $image, $text;
	var _lines = [];
	(function() {
		initHTML();
		initText();
		addListeners();
		resizeHandler()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(220, 220).center().mouseEnabled(false);
		$image = $this.create(".image");
		$image.size("100%").bg("assets/images/menu/" + _data.image, "cover");
		$image.css({
			opacity: 0
		}).transform({
			scale: .85,
			x: 0
		}).tween({
			scale: 1,
			x: 0,
			opacity: .6
		}, 15e2, "easeOutCubic")
	}

	function initText() {
		$text = $this.create(".text");
		$text.fontStyle("MontBold", 10, "#eee");
		$text.size(200, 10).center().css({
			letterSpacing: 2,
			textAlign: "center",
			textTransform: "uppercase"
		});
		$text.text("TAP TO BEGIN");
		$text.css({
			opacity: 0
		}).tween({
			opacity: 1
		}, 800, "easeOutSine", 500)
	}

	function addListeners() {
		$this.interact(null, click);
		$this.hit.mouseEnabled(true);
		$this.hit.size(_this.width * 1.5, _this.height * 1.5).center();
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {}

	function click() {
		console.log("click");
		_this.events.fire(HydraEvents.CLICK, _data);
		$this.tween({
			scale: .85,
			opacity: 0
		}, 500, "easeOutCubic")
	}
});
Class(function UISubscribe() {
	Inherit(this, View);
	var _this = this;
	var $this, $border, $bg, $text;
	var _border = 1;
	_this.width = 120;
	_this.height = 45;
	(function() {
		initHTML();
		initText();
		addListeners()
	}());

	function initHTML() {
		$this = _this.element;
		$this.size(_this.width, _this.height).center(1, 0).css({
			bottom: 50
		});
		$border = $this.create(".bg");
		$border.size(_this.width - _border * 2, _this.height - _border * 2).css({
			border: "1px solid #111",
			opacity: .2
		});
		$bg = $this.create(".bg");
		$bg.size("100%").bg("#111").css({
			opacity: 0
		})
	}

	function initText() {
		$text = $this.create(".text");
		$text.fontStyle("RalewayBold", 12, "#111");
		$text.size("100%").css({
			top: "50%",
			letterSpacing: 2,
			marginTop: -7,
			textAlign: "center",
			textTransform: "uppercase"
		});
		$text.html("UPDATES")
	}

	function addListeners() {
		$this.interact(hover, click)
	}

	function hover(e) {
		switch(e.action) {
			case "over":
				$bg.tween({
					opacity: .1
				}, 200, "easeOutSine");
				break;
			case "out":
				$bg.tween({
					opacity: 0
				}, 400, "easeOutSine");
				break
		}
	}

	function click() {}
	this.animateIn = function() {}
});
FX.Class(function Depth(_nuke) {
	Inherit(this, FXLayer);
	var _this = this;
	var _material;
	var _resolution = new THREE.Vector2(Stage.width * World.DPR, Stage.height * World.DPR);
	var _focus = new THREE.Vector2(0, 10);
	this.resolution = 1;
	this.passes = [];
	this.focus = _focus;
	this.disabled = !Tests.vfxDOF();
	(function() {
		initMaterial();
		_this.create(_nuke);
		_this.setDPR(1);
		initPass();
		addListeners();
		if(!_this.disabled) _this.startRender(loop)
	}());

	function initMaterial() {
		_material = _this.initClass(Shader, "DepthBasic").material
	}

	function initPass() {
		if(!_this.rt) return;
		let blur = _this.initClass(NukePass, "DepthDOF");
		blur.uniforms = {
			tDepth: {
				type: "t",
				value: _this.rt.texture
			},
			resolution: {
				type: "v2",
				value: _resolution
			},
			direction: {
				type: "v2",
				value: null
			},
			focus: {
				type: "v2",
				value: _focus
			}
		};
		let directions = [new THREE.Vector2(1.5 * World.DPR, 0), new THREE.Vector2(0, 1.5 * World.DPR)];
		directions.forEach(dir => {
			let pass = blur.clone();
			pass.set("direction", dir);
			pass.set("resolution", _resolution);
			pass.set("focus", _focus);
			pass.set("tDepth", _this.rt.texture);
			_this.passes.push(pass)
		})
	}

	function loop() {
		_focus.x = GameController.instance().distance - .5;
		_focus.y = _focus.x + 3
	}

	function addListeners() {
		_this.events.subscribe(HydraEvents.RESIZE, resizeHandler)
	}

	function resizeHandler() {
		_resolution.set(Stage.width * World.DPR, Stage.height * World.DPR)
	}
	this.add = function(mesh) {
		if(_this.disabled) return;
		let obj = this.addObject(mesh);
		if(!obj) return;
		if(mesh.depthMaterial) obj.material = mesh.depthMaterial;
		else obj.material = _material
	};
	this.render = function(stage, camera) {
		if(_this.disabled) return;
		_this.draw(stage, camera)
	};
	this.prerender = function() {
		if(_this.disabled) return Promise.resolve();
		let promise = Promise.create();
		_this.forceRender = true;
		_this.render();
		setTimeout(() => {
			_this.forceRender = false;
			promise.resolve()
		}, 16);
		return promise
	}
}, "singleton");
FX.Class(function Fog(_nuke) {
	Inherit(this, FXLayer);
	var _this = this;
	var _fog;
	this.resolution = .35;
	this.autoVisible = false;
	this.visible = false;
	(function() {
		_this.create(_nuke);
		_this.setDPR(1)
	}());
	this.add = function(mesh) {
		if(!_nuke) return;
		let clone = this.addObject(mesh);
		mesh.visible = false
	};
	this.render = function(stage, camera) {
		if(_this.visible) _this.draw(stage, camera)
	}
}, "singleton");
FX.Class(function Light(_nuke) {
	Inherit(this, FXLayer);
	var _this = this;
	var _projection, _volume, _lightPos;
	var _black = new THREE.MeshBasicMaterial({
		color: 0
	});
	var _blurs = [];
	var _value = new DynamicObject({
		v: 1
	});
	var _uniforms = {
		fExposure: .95,
		fDecay: .7,
		fDensity: .5,
		fWeight: .5,
		fClamp: 1
	};
	this.resolution = .5;
	this.enabled = true;
	(function() {
		_projection = new ScreenProjection(_nuke.camera);
		_this.create(_nuke);
		initBlurPasses();
		initPass();
		addListeners()
	}());

	function initPass() {
		_this.pass = new NukePass("LightComposite");
		_this.pass.uniforms = {
			tInput: {
				type: "t",
				value: _this.rt.texture
			},
			fCoeff: {
				type: "f",
				value: .5
			}
		}
	}

	function initBlurPasses() {
		var blur = new NukePass("LightBlur");
		blur.uniforms = {
			res: {
				type: "v2",
				value: new THREE.Vector2
			},
			dir: {
				type: "v2",
				value: new THREE.Vector2(1, 0)
			}
		};
		var directions = [new THREE.Vector2(.5 * _nuke.dpr, 0), new THREE.Vector2(0, .5 * _nuke.dpr)];
		directions.forEach(function(dir) {
			var pass = blur.clone();
			pass.set("dir", dir);
			_this.nuke.add(pass);
			_blurs.push(pass)
		});
		_volume = new NukePass("LightVolume");
		_volume.uniforms = {
			lightPos: {
				type: "v2",
				value: new THREE.Vector2
			},
			fExposure: {
				type: "f",
				value: 0
			},
			fDecay: {
				type: "f",
				value: 0
			},
			fDensity: {
				type: "f",
				value: 0
			},
			fWeight: {
				type: "f",
				value: 0
			},
			fClamp: {
				type: "f",
				value: 0
			}
		};
		for(var i in _uniforms) {
			_volume.set(i, _uniforms[i])
		}
		_volume.set("fClamp", 0);
		_this.volume = _volume;
		_this.strength = 0;
		_this.nuke.add(_volume)
	}

	function addListeners() {
		_this.events.subscribe(WorldRenderer.CHANGE_RENDERER, changeRenderer)
	}

	function changeRenderer() {
		_nuke.renderer = World.RENDERER
	}
	this.setUniforms = function(obj) {
		for(var i in _uniforms) {
			_uniforms[i] = obj[i]
		}
		for(var i in _uniforms) {
			_volume.set(i, obj[i])
		}
		_volume.set("fClamp", 0)
	};
	this.addLight = function(mesh) {
		let obj = this.addObject(mesh);
		_lightPos = obj.position;
		if(mesh.lightMaterial) obj.material = mesh.lightMaterial;
		return obj
	};
	this.addOcclusion = function(mesh) {
		let obj = this.addObject(mesh);
		obj.material = mesh.occlusionMaterial || _black;
		return obj
	};
	this.animateIn = function() {
		_volume.set("fClamp", _uniforms.fClamp * .5);
		_volume.tween("fClamp", _uniforms.fClamp, 2e3, "easeInOutSine")
	};
	this.bounce = function(v) {
		var value = v || 1;
		var delay = 15e2;
		if(value >= 1) delay += value * 500;
		else delay = 400;
		_volume.set("fExposure", Utils.convertRange(_uniforms.fExposure, 0, 1, .3 * value, 1));
		_volume.tween("fExposure", _uniforms.fExposure, delay, "easeInOutSine");
		_volume.set("fDensity", Utils.convertRange(_uniforms.fDensity, 0, 1, .5, 1));
		_volume.tween("fDensity", _uniforms.fDensity, delay, "easeOutSine");
		_volume.set("fDecay", Utils.convertRange(_uniforms.fDecay, 0, 1, value >= 1 ? .5 : .3, 1));
		_volume.tween("fDecay", _uniforms.fDecay, delay, "easeOutSine");
		_volume.set("fWeight", Utils.convertRange(_uniforms.fWeight, 0, 1, 0, .5));
		_volume.tween("fWeight", _uniforms.fWeight, delay, "easeOutSine");
		_value.v = Mobile.phone ? .8 : .3;
		TweenManager.tween(_value, {
			v: 1
		}, delay, "easeInOutQuart")
	};
	this.render = function(stage = Stage, camera) {
		if(!_lightPos) return;
		_this = this;
		if(stage && camera) {
			_nuke.stage = stage;
			_nuke.camera = camera;
			_this.setSize(stage.width, stage.height)
		}
		for(var i = _blurs.length - 1; i > -1; i--) {
			_blurs[i].uniforms.res.value.set(stage.width * _this.resolution * _value.v, stage.height * _this.resolution * _value.v)
		}
		var clear = _nuke.renderer.getClearColor();
		_nuke.renderer.setClearColor(0);
		if(stage && camera) _this.draw(stage, camera);
		else _this.draw();
		_nuke.renderer.setClearColor(clear);
		_projection.camera = camera || _nuke.camera;
		let screen = _projection.project(_lightPos, stage);
		screen.x /= stage.width;
		screen.y /= stage.height;
		_volume.uniforms.lightPos.value.set(screen.x, 1 - screen.y)
	}
});
FX.Class(function Translucency(_nuke) {
	Inherit(this, FXLayer);
	var _this = this;
	var _shader;
	this.forceRender = true;
	this.resolution = .5;
	(function() {
		_this.debug = true;
		_this.create(_nuke);
		initMesh()
	}());

	function initMesh() {
		if(!_this.rt) return;
		_shader = _this.initClass(Shader, "TranslucencyCopy", "TranslucencyCopy");
		_shader.uniforms = {
			tMap: {
				type: "t",
				value: null
			}
		};
		_shader.material.depthTest = false;
		let geom = new THREE.PlaneBufferGeometry(2, 2);
		let mesh = new THREE.Mesh(geom, _shader.material);
		mesh.frustumCulled = false;
		_this.scene.add(mesh)
	}
	this.render = function(stage, camera) {
		if(!_this.rt) return;
		_shader.set("tMap", _nuke.output);
		_this.draw(stage, camera)
	}
}, "singleton");
Class(function Main() {
	Inherit(this, Component);
	var _this = this;
	var _loader;
	(function() {
		if(!Device.graphics.webgl) window.location = "fallback.html";
		Global.UI_COLOR = "#888";
		Global.TRACK_COLOR = "#ccc";
		Global.HUE = 0;
		Mouse.capture();
		Mobile.Accelerometer.capture();
		if(Hydra.HASH.strpos("playground")) {
			Data.Player.init();
			Global.IN_SCENE = true;
			Global.PLAYGROUND = true;
			Promise.all([AssetLoader.loadAllAssets(), GPU.ready()]).then(Playground.instance)
		} else {
			initLoader()
		}
	}());

	function initLoader() {
		_loader = _this.initClass(Loader);
		_loader.events.add(HydraEvents.COMPLETE, init)
	}

	function init() {
		_loader = _loader.destroy();
		Data.Player.init();
		Container.instance()
	}
})
window._MINIFIED_ = true;
window._BUILT_ = true;