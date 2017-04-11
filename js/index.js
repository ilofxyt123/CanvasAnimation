/**
 * Created by Z on 2016/10/9.
 */
// (function(){
    var CanvasAnimation = function(config){
        config = config ? config:{}
        /*config可选参数:
        * config = {
        *   id:"canvas",//需要做动画的canvasID
        *   pointId:"point",//粒子图片
        * }
        * */
        this._canvasId = config.id ? config.id:"canvas";//canvas的id
        this._canvas = this.getDom(this._canvasId);//dom
        this._$container = jQuery(this._canvas).parent();//canvas外层容器，决定宽高
        this._ctx = this._canvas.getContext("2d");//上下文对象
        this._w = this._$container.width();//容器的宽
        this._h = this._$container.height();//容器的高
        this._canvas.width = this._w;//canvas的宽度
        this._canvas.height = this._h;//canvas的高度
        this._ctx.translate(this._w/2,this._h/2);


        this._hd = Math.PI / 180;//弧度

        this.focusLength = 300;//焦距
        this.fixResult = false;//临时数据,3D坐标转2D坐标
        this.camera = {
            position: {x: 0, y: 0, z: 0},
            rotation: {x: 0, y: 0, z: 0},
            buffer: {
                distance: {x: 0, y: 0, z: 0},
                temp: {x: 0, y: 0, z: 0},
                rotation: {x: 0, y: 0, z: 0},
                result: false
            }
        };//相机

        this.pointImageId = config.pointId ? config.pointId:"point";
        this.pointObj = this.pointImageId ? this.getDom(this.pointImageId):undefined;//粒子对象,dom/canvas
        this.pointHeight = this.pointWidth = 10;//粒子默认宽高10

        this.task = [];//任务数组[{},{}]
        this.points = [];//粒子配置[{},{}]
        this.lines = [];//线条配置[{},{}]

        this.offsetTime = this.nowTime = this.lastTime = undefined;//时间偏移量，此刻时间，上一次时间
        this.speed = 1;//全局动画速度

    };
    CanvasAnimation.prototype = {
        constructor:CanvasAnimation,
        init:function(config){
           config = config ? config:{};
           /*config可选参数:
            * config = {
            *   pointNumber:1000,//初始化粒子数量，默认10个
            *   opacity:1,//所有粒子的透明度,默认1
            *   width:10,//所有粒子的宽，默认10
            *   height:10,//所有粒子的高度，默认10
            *   sizeSame:true,//所有粒子大小是否一致，默认true
            * }
            * */
           if(!this.pointObj){
               return console.log("粒子图片缺失");
           }
           config.pointNumber = config.pointNumber ? config.pointNumber : 10;
           config.opacity = config.opacity ? config.opacity : "normal";
           config.width = config.width ? config.width : "normal";
           config.height = config.height ? config.height : "normal";
           config.sizeSame = "boolean" == typeof config.sizeSame ? config.sizeSame : true;
           var i;
            for(i=0;i<config.pointNumber;i++){
                this.addPoint({
                    x:0,
                    y:0,
                    z:0,
                    width:config.width == "normal" ? this.pointWidth:config.width,//如果宽度不给，均为10;如果给了宽，则可选是否随机
                    height:config.height == "normal" ? this.pointHeight:config.height,
                    flag:false,
                    opacity: "normal" == config.opacity ? 1 : this.rand(0, 10) / 10
                });
                if(config.sizeSame){
                    this.points[this.points.length-1].width = this.points[this.points.length-1].height;
                }
            }
           console.log(this.points)
       },

        
        addPoint:function(config){
            /*config可选参数:
             * config = {
             *   index://不建议配置，默认为数组中的位置
             *   x:0,//x坐标，默认0
             *   y:0,//y坐标，默认0
             *   z:0,//z坐标，默认0
             *   width:10,//所有粒子的宽，默认10
             *   height:10,//所有粒子的高度，默认10
             *   flag:false,//!!!!!!!!!!!!!!未知，默认为false
             *   opacity:1,//透明度，默认为1
             *   material:img//默认pointObj
             *   rotate:0粒子的旋转//默认为0
             *
             *   free:{},//保存自由粒子配置
             *   free.flag:false,//自由粒子标识，默认false
             *   free.zFlag:false,//自由粒子z轴是否开启，默认false
             *   free.now:0//!!!!!!!!!!!!!!未知，默认为0
             *   free.limit:60//!!!!!!!!!!!!!!未知，默认为60
             *   free.limitSpace:60//!!!!!!!!!!!!!!未知，默认为60
             *   free.speed:{x,y,z}//自由粒子速度,默认0,0,0
             *   free.speedSpace:0//!!!!!!!!!!!!!!未知，默认为0,0,0
             *   
             *   valid:true//!!!!!!!!!!!!!!未知，初始为true
             *   inTask:false//粒子是否在动画中，初始给false
             *   noTask:false//!!!!!!!!!!!!!!未知，初始给false
             *   opacityTask:false//!!!!!!!!!!!!!!未知，默认为
             *   buffer2D:{x:0,y:0}//3D转2D坐标，初始化0,0
             *   trail:0//!!!!!!!!!!!!!!轨迹，默认为0
             *   offset:0//!!!!!!!!!!!!!!未知
             *   fadeIn:0//!!!!!!!!!!!!!!未知
             *   fadeOut:0//!!!!!!!!!!!!!!未知
             *   moveTo:0//!!!!!!!!!!!!!!未知
             *   fadeOut:0//!!!!!!!!!!!!!!未知
             *   
             *   
             *   
             * }
             * */
            config = config ? config:{};
            config.index = this.points.length;
            config.x = "number"==typeof config.x ? config.x:0;
            config.y = "number"==typeof config.y ? config.y:0;
            config.z = "number"==typeof config.z ? config.z:0;
            config.width = config.width ? config.width:this.pointWidth;
            config.height = config.height ? config.height:this.pointHeight;
            config.flag = "boolean" == typeof config.flag ? config.flag : false;
            config.opacity = "number" == typeof config.opacity ? config.opacity : 1;
            config.material = config.material ? config.material : this.pointObj;
            config.rotate = "number" == typeof config.rotate ? config.rotate : 0;
            
            config.free = config.free ? config.free:{};
            config.free.flag = "boolean" == config.free.flag ? config.free.flag : false;
            config.free.zFlag = "boolean" == config.free.zFlag ? config.free.zFlag : false;
            config.free.now = config.free.now ? config.free.now : 0;
            config.free.limit = config.free.limit ? config.free.limit : 60;
            config.free.limitSpace = config.free.limit;
            config.free.speed = {x: this.speed, y: this.speed, z: this.speed};
            config.free.speedSpace = config.free.speed;

            config.valid = true;
            config.inTask = false;
            config.noTask = false;
            // config.opacityTask = false;
            config.buffer2D = {x: 0, y: 0};
            config.trail = config.trail ? config.trail : false;
            config.offset = {x: 0, y: 0, z: 0};
            // config.fadeIn = function (a) {
            //     this.flag = !0;
            //     app.addPointTask({obj: this, attr: ["opacity"], start: {opacity: 0}, end: {opacity: 1}, limit: a ? a : 60});
            //     return this
            // };
            // config.fadeOut = function (a) {
            //     app.addPointTask({
            //         obj: this, attr: ["opacity"], end: {opacity: 0}, limit: a ? a : 60, callBack: function () {
            //             this.obj.flag = !1
            //         }
            //     });
            //     return this
            // };
            // config.moveTo = function (a, f, g, k, n, A) {
            //     a = "number" == typeof a ? a : this.x;
            //     f = "number" == typeof f ? f : this.y;
            //     g = "number" == typeof g ? g : this.z;
            //     app.addPointTask({
            //         obj: this,
            //         end: {x: a, y: f, z: g},
            //         limit: k ? k : 60,
            //         type: n ? n : "easeOut",
            //         delay: A ? A : 0
            //     });
            //     return this
            // };
            // config.rand = function (a) {
            //     a = a ? a : 500;
            //     this.set(app.rand(-a, a), app.rand(-a, a), app.rand(-a, a));
            //     return this
            // };
            // config.set = function (a, f, g) {
            //     this.x = "number" == typeof a ? a : this.x;
            //     this.y = "number" == typeof f ? f : this.y;
            //     this.z = "number" == typeof g ? g : this.z;
            //     return this
            // };

            this.points.push(config)
        },
        addPointTask:function(config){
            config = config ? config:{};
            config.index = config.index ? config.index:(function(){console.log("请确定需要做动画的点");return false;}());//要做动画的points[index]
            config.obj = config.obj ? config.obj : this.points[config.index];//即将做动画的属性来自于obj，默认从整个points数组中搜索
            config.isOver = false;//动画结束标志，默认未结束
            config.now = config.now ? config.now:0;//运动进度,默认0
            config.limit = config.limit ? config.limit:60;
            config.type = config.type ? config.type:"easeOut";//动画类型，默认easeOut
            config.callback = config.callback ? config.callback : false;//动画结束回调，默认无回调
            config.everyCallback = config.everyCallback ? config.everyCallback : false;//每一步动画的回调，默认无回调
            config.delay = config.delay ? config.delay : 0;//动画延时时间，默认不延迟
            config.delayNow = config.delayNow ? config.delayNow : 0;//当前延时进度，默认0开始

            config.repeat = config.repeat ? config.repeat : 0;//动画重复次数，默认不重复
            config.repeatNow = config.repeatNow ? config.repeatNow : 0;//动画当前重复进度，默认0开始
            config.repeatDir = ("boolean" == typeof config.repeatDir) ? config.repeatDir : true;//动画重复的方向，默认为true
            config.repeatCallback = config.repeatCallback ? config.repeatCallback : false;//动画单次重复结束后回调，默认无回调

            config.bezierData = config.bezierData ? config.bezierData : false;
            config.bezierFlag = false;//是否为贝塞尔运动
            if("bezier" == config.type.substr(0,6)){
                config.bezierFlag = true;
                config.attr = ["x","y","z"];
            };
            config.attr = config.attr ? config.attr : ["x","y","z"];//需要做动画的属性数组，默认为x,y,z
            config.start = config.start ? config.start : {};//需要做动画的属性的起始点
            config.end = config.end ? config.end : {};//需要做动画的属性的终点

            for(var l= 0;l < config.attr.length;l++){//检测要做动画的属性，起点终点添加是否正确
                if(config.start[config.attr[l]] == undefined){
                    alert("动画添加失败，缺少动画起点属性start")
                }
                if(config.end[config.attr[l]] == undefined){
                    alert("动画添加失败,缺少动画终点属性end");
                    return;
                }
            }

            if(config.attr.length == 1&&config.attr[0]=="opacity"){
                config.obj.inTask = false;//改变透明度不算任务，标记为任务未执行
            }
            else{
                config.obj.inTask = true;//标记为任务执行
            }
            config.obj.noTask = false;//有任务
            this.task.push(config);
        },
        setPointFree:function(config){
            config = config ? config:{};
            config.index = config.index ? config.index:0;
            config.limit = config.limit ? config.limit:60;
            config.speed = ("number" == typeof config.speed) ? config.speed:3;
            config.zFlag = ("boolean" == typeof config.zFlag) ? config.zFlag:false;
            this.points[config.index].free.flag = true;
            this.points[config.index].free.now = 0;
            this.points[config.index].free.zFlag = config.zFlag;
            this.points[config.index].free.limitSpace = config.limit;
            this.points[config.index].free.limit = this.rand(config.limit/2,config.limit);
            this.points[config.index].free.speedSpace = config.speed;
            this.points[config.index].free.speed = {
                x:this.rand(-config.speed,config.speed),
                y:this.rand(-config.speed,config.speed),
                z:this.rand(-config.speed,config.speed)
            };
            for(var prop in this.points[config.index].free.speed){
                if(Math.abs(this.points[config.index].free.speed[prop])<0.5){
                    this.points[config.index].free.speed[prop]*=2;
                }
                if(Math.abs(this.points[config.index].free.speed[prop])>1){
                    this.points[config.index].free.speed[prop]/=2;
                }
            }
        },
        freePoint:function(index){
            var point = this.points[index];
            if(point.free.flag == false || point.inTask){return;};//非自由粒子跳出function

            point.x+=point.free.speed.x;
            point.y+=point.free.speed.y;
            if(point.free.zFlag == true){point.z+=point.free.speed.z;}
            point.free.now+=this.speed;

            if(point.free.now>=point.free.limit){
                point.free.now = 0;
                point.free.limit = this.rand(point.free.limitSpace/2,point.free.limitSpace);
                point.free.speed = {
                    x:point.free.speed.x*=this.getOne(),
                    y:point.free.speed.y*=this.getOne(),
                    z:point.free.speed.z*=this.getOne()
                }
            }

        },
        fixPoint:function(index){
            if(this.points[index].flag==false){return;};
            var point = this.points[index];
        },
        draw:function(){
            this.setTime();
            this._ctx.clearRect(-this._canvas.width/2,-this._canvas.height/2,this._canvas.width,this._canvas.height);
            // this.setTime();
            var i;
            for(i = 0;i<this.points.length;i++){
                this.freePoint(i);
                this.fixResult = this.fixPoint(i);
                this._ctx.drawImage(this.pointObj,0,0,this.pointObj.width,this.pointObj.height,this.points[i].x-this.points[i].width/2,this.points[i].y-this.points[i].height/2,this.points[i].width,this.points[i].height);
            }
            this.drawLines();
        },//绘制一帧
        drawLines:function(){},
        setTime:function(){
            if(this.lastTime){
                this.nowTime = this.now();
                this.offsetTime = this.nowTime-this.lastTime;//一般而言刷新频率每秒60次，offsetTime为17毫秒
                this.lastTime = this.nowTime;
                return;
            }
            this.lastTime = this.now();;
        },
        getDom:function(ID){
            return document.getElementById(ID);
        },//获取dom对象
        requestAnimationFrame:function(){
            return window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (handler) {setTimeout(handler, 1000 / 60)}
        },
        rand:function (min, max) {
            return (Math.round((Math.random() * (max - min + 1) + min)*100)/100)
        },
        now:function(){
            return new Date().getTime();
        },
        getOne:function(){
            return ((Math.random()>0.5)?1:-1)
        },
        T:{
            linear:function(nowTime,startPosition,delta,duration){
                return delta*nowTime/duration+startPosition;
            },

            easeOut:function(nowTime,startPosition,delta,duration){
                return -delta*(nowTime/=duration)*(nowTime-2)+startPosition;
            },
            easeIn:function(nowTime,startPosition,delta,duration){
                return delta*(nowTime/=duration)*nowTime+startPosition;
            },
            easeInOut:function(nowTime,startPosition,delta,duration){
                return 1 > (nowTime /= duration / 2) ? delta / 2 * nowTime * nowTime + startPosition : -delta / 2 * (--nowTime * (nowTime - 2) - 1) + startPosition
            },

            easeInCubic:function (b,f,g,k) {
                return g * (b /= k) * b * b + f;
            },
            easeOutCubic:function (b,f,g,k) {
                return g * ((b = b / k - 1) * b * b + 1) + f;
            },
            easeInOutCubic:function (b,f,g,k) {
                return 1 > (b /= k / 2) ? g / 2 * b * b * b + f : g / 2 * ((b -= 2) * b * b + 2) + f
            },

            easeInQuart:function (b,f,g,k) {
                return g * (b /= k) * b * b * b + f
            },
            easeOutQuart:function (b,f,g,k) {
                return -g * ((b = b / k - 1) * b * b * b - 1) + f
            },
            easeInOutQuart:function (b,f,g,k) {
                return 1 > (b /= k / 2) ? g / 2 * b * b * b * b + f : -g / 2 * ((b -= 2) * b * b * b - 2) + f
            },

            easeInQuint:function (b,f,g,k) {
                return g * (b /= k) * b * b * b * b + f
            },
            easeOutQuint:function (b,f,g,k) {
                return g * ((b = b / k - 1) * b * b * b * b + 1) + f
            },
            easeInOutQuint:function (b,f,g,k) {
                return 1 > (b /= k / 2) ? g / 2 * b * b * b * b * b + f : g / 2 * ((b -= 2) * b * b * b * b + 2) + f
            },
            
            easeInSine:function (b,f,g,k) {
                return -g * Math.cos(b / k * (Math.PI / 2)) + g + f
            },
            easeOutSine:function (b,f,g,k) {
                return g * Math.sin(b / k * (Math.PI / 2)) + f
            },
            easeInOutSine:function (b,f,g,k) {
                return -g / 2 * (Math.cos(Math.PI * b / k) - 1) + f
            },
            
            easeInExpo:function (b,f,g,k) {
                return 0 == b ? f : g * Math.pow(2, 10 * (b / k - 1)) + f
            },
            easeOutExpo:function (b,f,g,k) {
                return b == k ? f + g : g * (-Math.pow(2, -10 * b / k) + 1) + f
            },
            easeInOutExpo:function (b,f,g,k) {
                return 0 == b ? f : b == k ? f + g : 1 > (b /= k / 2) ? g / 2 * Math.pow(2, 10 * (b - 1)) + f : g / 2 * (-Math.pow(2, -10 * --b) + 2) + f
            },
            
            easeInCirc:function (b, f, g, k) {
                return -g * (Math.sqrt(1 - (b /= k) * b) - 1) + f
            },
            easeOutCirc:function (b, f, g, k) {
                return g * Math.sqrt(1 - (b = b / k - 1) * b) + f
            },
            easeInOutCirc:function (b, f, g, k) {
                return 1 > (b /= k / 2) ? -g / 2 * (Math.sqrt(1 - b * b) - 1) + f : g / 2 * (Math.sqrt(1 - (b -= 2) * b) + 1) + f
            },
            
            easeInElastic:function (a, b, f, g, k) {
                a = 0;
                var n = g;
                if (0 == b)return f;
                if (1 == (b /= k))return f + g;
                a || (a = .3 * k);
                n < Math.abs(g) ? (n = g, g = a / 4) : g = a / (2 * Math.PI) * Math.asin(g / n);
                return -(n * Math.pow(2, 10 * --b) * Math.sin(2 * (b * k - g) * Math.PI / a)) + f
            },
            easeOutElastic:function (a, b, f, g, k) {
                var n = 0, A = g;
                if (0 == b)return f;
                if (1 == (b /= k))return f + g;
                n || (n = .3 * k);
                A < Math.abs(g) ? (A = g, a = n / 4) : a = n / (2 * Math.PI) * Math.asin(g / A);
                return A * Math.pow(2, -10 * b) * Math.sin(2 * (b * k - a) * Math.PI / n) + g + f
            },
            easeInOutElastic:function (a, b, f, g, k) {
                var n = 0, A = g;
                if (0 == b)return f;
                if (2 == (b /= k / 2))return f + g;
                n || (n = .3 * k * 1.5);
                A < Math.abs(g) ? (A = g, a = n / 4) : a = n / (2 * Math.PI) * Math.asin(g / A);
                return 1 > b ? -.5 * A * Math.pow(2, 10 * --b) * Math.sin(2 * (b * k - a) * Math.PI / n) + f : A * Math.pow(2, -10 * --b) * Math.sin(2 * (b * k - a) * Math.PI / n) * .5 + g + f
            },
            
            easeInBounce:function (a, b, f, g, k) {
                return g - this.easeOutBounce(a, k - b, 0, g, k) + f
            },
            easeOutBounce:function (a, b, f, g, k) {
                return (b /= k) < 1 / 2.75 ? 7.5625 * g * b * b + f : b < 2 / 2.75 ? g * (7.5625 * (b -= 1.5 / 2.75) * b + .75) + f : b < 2.5 / 2.75 ? g * (7.5625 * (b -= 2.25 / 2.75) * b + .9375) + f : g * (7.5625 * (b -= 2.625 / 2.75) * b + .984375) + f
            },
            easeInOutBounce:function (a, b, f, g, k) {
                return b < k / 2 ? .5 * this.easeInBounce(a, 2 * b, 0, g, k) + f : .5 * this.easeOutBounce(a, 2 * b - k, 0, g, k) + .5 * g + f
            },
        }
    };
    var main = function(){
        this.canvasAnimation = undefined;
        this.RAF = 0;
        this.init();
    };
    main.prototype = {
        init:function(){
            this.canvasAnimation = new CanvasAnimation({
                id:"canvas",
                // pointId:"point",
            });
        },
        start:function(){
            this.canvasAnimation.init({
                pointNumber:11,
            });
            for(var i=8;i<this.canvasAnimation.points.length;i++){
                this.canvasAnimation.setPointFree({
                    index:i,
                    limit:80,
                    speed:2
                });
            }
            console.log(this.canvasAnimation.points)
        },
        startRAF:function(){
            var _self = this;
            var loop = function(){
                _self.canvasAnimation.draw();
                _self.RAF = r(loop);
            };
            var r = this.canvasAnimation.requestAnimationFrame();
            _self.RAF = r(loop);
        },
        backToStart:function(){
            // var _self = this;
            // setTimeout(function(){
            //     for(var i=8;v)
            //     _self.canvasAnimation.addPointTask({
            //         attr:["y","y"],
            //         start:{}
            //     })
            // },3000);

        },
        stopRAF:function(){
            window.cancelAnimationFrame(this.RAF);
        },
        rand:function (min, max) {
            return (Math.round((Math.random() * (max - min + 1) + min)*100)/100)
        },
    };

    var app = new main();//添加一个canvasAnimation实例
    app.start();//自定义主流程内容，可操控canvasAnimation实例
    app.startRAF();//开始渲染
// })();