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
        this.buffer = false;//临时数据,3D坐标转2D坐标
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
                    width:config.width == "normal"?this.pointWidth:config.width,//如果宽度不给，均为10;如果给了宽，则可选是否随机
                    height:config.height == "normal"?this.pointHeight:config.height,
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
             *   inTask:false//!!!!!!!!!!!!!!未知，初始个false
             *   noTask:false//!!!!!!!!!!!!!!未知，初始个false
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
        setPointFree:function(config){
            config = config ? config:{};
            config.index = config.index ? config.index:0;
            config.limit = config.limit ? config.limit:60;
            config.speed = ("number" == typeof config.speed) ? config.speed:3;
            config.zFlag = ("boolean" == typeof config.zFlag) ? config.zFlag:true;
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
            }
        }
        ,
        draw:function(){
            this.setTime();
            this._ctx.clearRect(-this._canvas.width/2,-this._canvas.height/2,this._canvas.width,this._canvas.height);
            
            // this.setTime();
            // this._ctx.drawImage(this.pointObj,0,0,this.pointObj.width,this.pointObj.height,0,0,this.pointObj.width,this.pointObj.height);
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
            return ~~(Math.random() * (max - min + 1) + min)
        },
        now:function(){
            return new Date().getTime();
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
        stopRAF:function(){
            window.cancelAnimationFrame(this.RAF);
        },
    };

    var app = new main();//添加一个canvasAnimation实例
    app.start();//自定义主流程内容，可操控canvasAnimation实例
    app.startRAF();//开始渲染
// })();