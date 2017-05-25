/**
 * Created by Z on 2016/10/9.
 */
(function(win){
    var CanvasAnimation = new function(){
        this._canvasId;//canvasID
        this._canvas = {};//dom
        this._$container;//canvas外层容器，决定宽高
        this._ctx;//上下文对象
        this._w;//容器的宽
        this._h;//容器的高
        this._canvas.width;//canvas的宽度
        this._canvas.height;//canvas的高度


        this._hd = Math.PI / 180;//弧度

        this.focusLength = 300;//焦距
        this.buffer = {};//临时数据
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

        this.pointImageId;
        this.pointObj;//粒子对象,dom/canvas
        this.pointHeight;//粒子默认宽高10

        this.task = [];//任务数组[{},{}]
        this.points = [];//粒子配置[{},{}]
        this.lines = [];//线条配置[{},{}]

        this.offsetTime = this.nowTime = this.lastTime = undefined;//时间偏移量，此刻时间，上一次时间
        this.speed = 1;//全局动画速度

        this.consoleTime = 0;//debug

    };
    CanvasAnimation.init = function(config){
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
        this._canvasId = config.id ? config.id:"canvas";
        /*********************************初始化canvas*********************************/
        this._canvas = this.getDom(this._canvasId);//dom
        this._$container = jQuery(this._canvas).parent();//canvas外层容器，决定宽高
        this._ctx = this._canvas.getContext("2d");//上下文对象
        this._w = this._$container.width();//容器的宽
        this._h = this._$container.height();//容器的高
        this._canvas.width = this._w;//canvas的宽度
        this._canvas.height = this._h;//canvas的高度
        this._ctx.translate(this._w/2,this._h/2);
        /*********************************初始化canvas*********************************/

        this.pointImageId = config.pointId ? config.pointId:"point1";//粒子图片
        this.pointObj = this.pointImageId ? this.getDom(this.pointImageId):undefined;//粒子对象,dom/canvas
        this.pointHeight = this.pointWidth = 10;//粒子默认宽高10

        if(!this.pointObj){
            return console.log("粒子图片缺失");
        }
        config.pointNumber = config.pointNumber ? config.pointNumber : 10;
        config.opacity = typeof config.opacity == "number" ? config.opacity : 1;
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
                flag:true,
                opacity: config.opacity ,
            });
            if(config.sizeSame){
                this.points[this.points.length-1].width = this.points[this.points.length-1].height;
            }
        }

        // console.log("this.points:"+this.points)
    };
    CanvasAnimation.addPoint = function(config){
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
         *   valid:true//验证点是否还需要绘制，如果超出边界则标记为false
         *   inTask:false//粒子是否在动画中，初始给false
         *   noTask:false//粒子是否有动画任务，初始给false，如果在delay中，则标记为true
         *   opacityTask:false//!!!!!!!!!!!!!!未知，默认为
         *   buffer2D:{x:0,y:0}//3D转2D坐标，初始化0,0
         *   trail:0//!!!!!!!!!!!!!!轨迹，默认为0
         *   offset:0//点位偏移，默认无偏移
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
        config.free.duration = config.free.duration ? config.free.duration : 60;
        config.free.durationtRange = config.free.duration;
        config.free.speed = {x: this.speed, y: this.speed, z: this.speed};
        config.free.speedRange = config.free.speed;

        config.valid = true;
        config.inTask = false;
        config.noTask = false;
        // config.opacityTask = false;
        config.buffer2D={x: 0,y: 0};
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
    };
    CanvasAnimation.addPointTask = function(config){
        config = config ? config:{};
        config.index = "number" == (typeof config.index) ? config.index:(function(){console.log("请确定需要做动画的点");return false;}());//要做动画的points[index]
        config.obj = config.obj ? config.obj : this.points[config.index];//即将做动画的属性来自于obj，默认从整个points数组中搜索
        config.isOver = false;//动画结束标志，默认未结束


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


        config.now = config.now ? config.now:0;//运动进度,默认0开始
        config.duration = config.duration ? config.duration:60;//动画总进度默认60
        config.speed = config.speed ? config.speed : this.speed;//每次刷新改变进度值，默认为全局速度1
        config.type = config.type ? config.type:"easeOut";//动画类型，默认easeOut
        config.attr = config.attr ? config.attr : ["x","y","z"];//需要做动画的属性数组，默认为x,y,z
        config.start = config.start ? config.start : {};//需要做动画的属性的起始点
        config.end = config.end ? config.end : {};//需要做动画的属性的终点
        if("bezier" == config.type.substr(0,6)){
            config.bezierFlag = true;
            config.attr = ["x","y","z"];
        };

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

        config = null;
    };
    CanvasAnimation.addPointsToDataTask = function(config){};//一段粒子到各自应有的位置
    CanvasAnimation.getImageData = function(config){
        config = config ? config:{};

        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            data;
        canvas.width = this._w;
        canvas.height = this._h;

        switch(config.type){
            case "text":
                config.font = config.font ? config.font : "30px Georgia",
                config.content = config.content ? config.content : "Hello World!",
                config.contentX = typeof config.contentX == "number" ? config.contentX : 0;
                config.contentY = typeof config.contentY == "number" ? config.contentY : 0;
                config.color = config.color ? config.color : "#ffffff";
                ctx.font = config.font,
                ctx.fillStyle = config.color,
                ctx.clearRect(-this._w / 2, -this._h / 2, this._w, this._h),
                ctx.fillText(config.content, config.contentX, config.contentY);
                break;
            case "pic":

                config.id = config.id ? config.id : false;
                config.xn = config.xn ? config.xn : 4;//横向间隔
                config.yn = config.yn ? config.yn : 4;//纵向间隔
                config.opacity = config.opacity ? config.opacity : 128;//透明度限制
                config.xOffset = config.xOffset ? config.xOffset : 0;//左右稍作偏移打乱
                config.yOffset = config.yOffset ? config.yOffset : 0;//上下稍作偏移打乱

                var picObj = this.getDom(config.id),
                    $picObj = $(picObj),
                    left = parseInt($picObj.css("left")),
                    top = parseInt($picObj.css("top"));
                ctx.clearRect(-this._w / 2,-this._h / 2,this._w,this.height);
                ctx.drawImage(picObj , 0 , 0 , picObj.width , picObj.height , left-this._w / 2 , picObj.width , picObj.height);
                break;
            default:
                console.error("CanvasAnimation.getImageData(config)缺少config.type属性");
                break;
        }





        b = this.c_obj.getImageData(0, 0, this.width, this.height);
        a = this.getData(b, a.xn, a.yn, a.opacity, a.xOffset, a.yOffset);
        this.c_obj.clearRect(-this.width / 2, -this.height / 2, this.width, this.height);
        return a
    };
    CanvasAnimation.setPointFree = function(config){
        config = config ? config:{};
        config.index = config.index ? config.index:0;
        config.duration = config.duration ? config.duration:60;
        config.speed = ("number" == typeof config.speed) ? config.speed:3;
        config.zFlag = ("boolean" == typeof config.zFlag) ? config.zFlag:false;

        this.points[config.index].free.flag = true;
        this.points[config.index].free.now = 0;
        this.points[config.index].free.zFlag = config.zFlag;
        this.points[config.index].free.durationRange = config.duration;
        this.points[config.index].free.duration = this.rand(this.points[config.index].free.durationRange/2,this.points[config.index].free.durationRange);
        this.points[config.index].free.speedRange = config.speed;
        this.points[config.index].free.speed = {
            x:this.rand(-config.speed,config.speed),
            y:this.rand(-config.speed,config.speed),
            z:this.rand(-config.speed,config.speed)
        };
        // for(var prop in this.points[config.index].free.speed){
        //     if(Math.abs(this.points[config.index].free.speed[prop])<0.5){
        //         this.points[config.index].free.speed[prop]*=2;
        //     }
        //     if(Math.abs(this.points[config.index].free.speed[prop])>1){
        //         this.points[config.index].free.speed[prop]/=2;
        //     }
        // }
    };
    CanvasAnimation.freePoint = function(index){
        if(this.points[index].free.flag == false || this.points[index].inTask){return;};//非自由粒子跳出function

        this.points[index].x+=this.points[index].free.speed.x;
        this.points[index].y+=this.points[index].free.speed.y;
        if(this.points[index].free.zFlag == true){this.points[index].z+=this.points[index].free.speed.z;}
        this.points[index].free.now+=this.speed;

        if(this.points[index].free.now>=this.points[index].free.duration){//到终点了
            this.points[index].free.now = 0;
            this.points[index].free.duration = this.rand(this.points[index].free.durationRange/2,this.points[index].free.durationRange);
            this.points[index].free.speed = {
                x:this.points[index].free.speed.x*=this.getOne(),
                y:this.points[index].free.speed.y*=this.getOne(),
                z:this.points[index].free.speed.z*=this.getOne()
            }
        }
    };
    CanvasAnimation.fixPoint = function(index){
        if(this.points[index].flag==false){return;};

        this.buffer = this.camera_rotate(this.points[index].x,this.points[index].y,this.points[index].z);

        this.buffer = this.change2D(this.buffer.x+this.points[index].offset.x,this.buffer.y+this.points[index].offset.y,this.buffer.z+this.points[index].offset.z,this.focusLength);
        if((this.buffer.x+this.points[index].width*this.buffer.scale)<-this._w/2||this.buffer.x>this._w/2||(this.buffer.y+this.points[index].height*this.buffer.scale)<-this._h/2||this.buffer.y>this._h/2){//左边界、右边界、上边界、下边界监测
            return  false;
        }
        else{
            return  {
                x:this.buffer.x,
                y:this.buffer.y,
                opacity:this.points[index].opacity,
                width:this.points[index].width*this.buffer.scale,
                height:this.points[index].height*this.buffer.scale
            };
        }
    };
    CanvasAnimation.change2D = function(x,y,z,distance){
        var scale = distance / (distance + z);
        return 0 < scale ? {x: x * scale, y: y * scale, scale: scale} : {x: 10 * -this.win_w, y: 10 * -this.win_h}
    };
    CanvasAnimation.camera_rotate = function(x,y,z){
        this.camera.buffer.distance.x = x - this.camera.position.x;
        this.camera.buffer.distance.y = this.camera.position.y - y;
        this.camera.buffer.distance.z = this.camera.position.z - z;

        this.camera.buffer.temp = {x: 0, y: 0, z: 0};

        this.camera.buffer.rotation.x = this.camera.rotation.x * this._hd;
        this.camera.buffer.rotation.y = this.camera.rotation.y * this._hd;
        this.camera.buffer.rotation.z = this.camera.rotation.z * this._hd;

        this.camera.buffer.temp.x = Math.cos(this.camera.buffer.rotation.y) * this.camera.buffer.distance.x - Math.sin(this.camera.buffer.rotation.y) * this.camera.buffer.distance.z;
        this.camera.buffer.temp.z = Math.sin(this.camera.buffer.rotation.y) * this.camera.buffer.distance.x + Math.cos(this.camera.buffer.rotation.y) * this.camera.buffer.distance.z;

        this.camera.buffer.distance.x = this.camera.buffer.temp.x;
        this.camera.buffer.distance.z = this.camera.buffer.temp.z;

        this.camera.buffer.temp.y = Math.cos(this.camera.buffer.rotation.x) * this.camera.buffer.distance.y - Math.sin(this.camera.buffer.rotation.x) * this.camera.buffer.distance.z;
        this.camera.buffer.temp.z = Math.sin(this.camera.buffer.rotation.x) * this.camera.buffer.distance.y + Math.cos(this.camera.buffer.rotation.x) * this.camera.buffer.distance.z;

        this.camera.buffer.distance.y = this.camera.buffer.temp.y;
        this.camera.buffer.distance.z = this.camera.buffer.temp.z;

        this.camera.buffer.temp.x = Math.cos(this.camera.buffer.rotation.z) * this.camera.buffer.distance.x - Math.sin(this.camera.buffer.rotation.z) * this.camera.buffer.distance.y;
        this.camera.buffer.temp.y = Math.sin(this.camera.buffer.rotation.z) * this.camera.buffer.distance.x + Math.cos(this.camera.buffer.rotation.z) * this.camera.buffer.distance.y;

        this.camera.buffer.distance.x = this.camera.buffer.temp.x;
        this.camera.buffer.distance.y = this.camera.buffer.temp.y;
        return {x: this.camera.buffer.distance.x, y: this.camera.buffer.distance.y, z: this.camera.buffer.distance.z}
    };
    CanvasAnimation.taskWork = function(){
        for(var i = 0;i<this.task.length;i++){
            if(this.task[i].delay!= 0 && this.task[i].delayNow<this.task[i].delay){
                this.task[i].delayNow+=this.task[i].speed;
                continue;
            }//处理动画延迟,没到开启时间直接return
            this.task[i].now+=this.task[i].speed;//动画的当前进度更新
            for(var j=0;j<this.task[i].attr.length;j++){//参数运动的属性数量
                this.task[i].obj[this.task[i].attr[j]] = this[this.task[i].type](this.task[i].now,
                    this.task[i].start[this.task[i].attr[j]],
                    this.task[i].end[this.task[i].attr[j]]-this.task[i].start[this.task[i].attr[j]],
                    this.task[i].duration)
            }
            if(this.task[i].now == this.task[i].duration){//task完成
                this.task[i].obj.inTask = false;
                this.task[i].obj.noTask = true;
                if(!!this.task[i].callback){
                    this.task[i].callback();
                }
                this.task.splice(i,1);
            }
        }
    };
    CanvasAnimation.draw = function(){

        this.setTime();
        this._ctx.clearRect(-this._canvas.width/2,-this._canvas.height/2,this._canvas.width,this._canvas.height);
        // this.setTime();
        this.taskWork();

        for(var i = 0;i<this.points.length;i++){
            this.freePoint(i);
            this.buffer = this.fixPoint(i);
            if(this.consoleTime<this.points.length){//测试输出
                // console.log(this.buffer);
                // console.log(this.points);
                this.consoleTime++;
            }
            // console.log(this.buffer)
            // this.fixResult = this.fixPoint(i);



            if(!!this.buffer){
                this.points[i].buffer2D.x = this.buffer.x;
                this.points[i].buffer2D.y = this.buffer.y;

                this.points[i].valid = true;//粒子需要绘制，边界监测通过
                this._ctx.globalAlpha = this.buffer.opacity;
                this._ctx.drawImage(this.pointObj,0,0,this.pointObj.width,this.pointObj.height,this.points[i].buffer2D.x-this.buffer.width/2,this.points[i].buffer2D.y-this.buffer.height/2,this.buffer.width,this.buffer.height);

            }
            else{
                this.points[i].valid = false;
            }//边界监测未通过，不需要绘制

        }
        this.drawLines();
    };//绘制一帧
    CanvasAnimation.drawLines = function(){};

    CanvasAnimation.getImageData = function(config){
        /*config可选参数:
         * config = {
         *   id:"pic",//传入要打散的图片id
         *   opacity:1,//打散的图片的透明度
         *   width:10,//所有粒子的宽，默认10
         *   height:10,//所有粒子的高度，默认10
         *   sizeSame:true,//所有粒子大小是否一致，默认true
         * }
         * */
        config = config ? config : {};
        config.id = config.id ? config.id :(function(){console.error("必须传入图片id");return false;}());
        config.xn = config.xn ? config.xn : 4;
    };

    CanvasAnimation.requestAnimationFrame = function(){
        return window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (handler) {setTimeout(handler, 1000 / 60)}
    };

    CanvasAnimation.setTime = function(){
        this.nowTime = this.getTime();
        if(this.lastTime){
            this.offsetTime = this.nowTime-this.lastTime;//一般而言刷新频率每秒60次，offsetTime为17毫秒
            this.lastTime = this.nowTime;
            return;
        }
        this.lastTime = this.getTime();
    };
    CanvasAnimation.getDom = function(ID){
        return document.getElementById(ID);
    };//获取dom对象
    CanvasAnimation.rand = function (min, max) {
        return (Math.round((Math.random() * (max - min + 1) + min)*100)/100)
    };
    CanvasAnimation.getTime = function(){
        return new Date().getTime();
    };
    CanvasAnimation.getOne = function(){
        return ((Math.random()>0.5)?1:-1)
    };

    CanvasAnimation.linear = function(nowTime,startPosition,delta,duration){
        return delta*nowTime/duration+startPosition;
    };

    CanvasAnimation.easeOut = function(nowTime,startPosition,delta,duration){
        return -delta*(nowTime/=duration)*(nowTime-2)+startPosition;
    };
    CanvasAnimation.easeIn = function(nowTime,startPosition,delta,duration){
        return delta*(nowTime/=duration)*nowTime+startPosition;
    };
    CanvasAnimation.easeInOut = function(nowTime,startPosition,delta,duration){
        return 1 > (nowTime /= duration / 2) ? delta / 2 * nowTime * nowTime + startPosition : -delta / 2 * (--nowTime * (nowTime - 2) - 1) + startPosition
    };

    CanvasAnimation.easeInCubic = function (b,f,g,k) {
        return g * (b /= k) * b * b + f;
    };
    CanvasAnimation.easeOutCubic = function (b,f,g,k) {
        return g * ((b = b / k - 1) * b * b + 1) + f;
    };
    CanvasAnimation.easeInOutCubic = function (b,f,g,k) {
        return 1 > (b /= k / 2) ? g / 2 * b * b * b + f : g / 2 * ((b -= 2) * b * b + 2) + f
    };

    CanvasAnimation.easeInQuart = function (b,f,g,k) {
        return g * (b /= k) * b * b * b + f
    };
    CanvasAnimation.easeOutQuart = function (b,f,g,k) {
        return -g * ((b = b / k - 1) * b * b * b - 1) + f
    };
    CanvasAnimation.easeInOutQuart = function (b,f,g,k) {
        return 1 > (b /= k / 2) ? g / 2 * b * b * b * b + f : -g / 2 * ((b -= 2) * b * b * b - 2) + f
    };

    CanvasAnimation.easeInQuint = function (b,f,g,k) {
        return g * (b /= k) * b * b * b * b + f
    };
    CanvasAnimation.easeOutQuint = function (b,f,g,k) {
        return g * ((b = b / k - 1) * b * b * b * b + 1) + f
    };
    CanvasAnimation.easeInOutQuint = function (b,f,g,k) {
        return 1 > (b /= k / 2) ? g / 2 * b * b * b * b * b + f : g / 2 * ((b -= 2) * b * b * b * b + 2) + f
    };

    CanvasAnimation.easeInSine = function (b,f,g,k) {
        return -g * Math.cos(b / k * (Math.PI / 2)) + g + f
    };
    CanvasAnimation.easeOutSine = function (b,f,g,k) {
        return g * Math.sin(b / k * (Math.PI / 2)) + f
    };
    CanvasAnimation.easeInOutSine = function (b,f,g,k) {
        return -g / 2 * (Math.cos(Math.PI * b / k) - 1) + f
    };

    CanvasAnimation.easeInExpo = function (b,f,g,k) {
        return 0 == b ? f : g * Math.pow(2, 10 * (b / k - 1)) + f
    };
    CanvasAnimation.easeOutExpo = function (b,f,g,k) {
        return b == k ? f + g : g * (-Math.pow(2, -10 * b / k) + 1) + f
    };
    CanvasAnimation.easeInOutExpo = function (b,f,g,k) {
        return 0 == b ? f : b == k ? f + g : 1 > (b /= k / 2) ? g / 2 * Math.pow(2, 10 * (b - 1)) + f : g / 2 * (-Math.pow(2, -10 * --b) + 2) + f
    };

    CanvasAnimation.easeInCirc = function (b, f, g, k) {
        return -g * (Math.sqrt(1 - (b /= k) * b) - 1) + f
    };
    CanvasAnimation.easeOutCirc = function (b, f, g, k) {
        return g * Math.sqrt(1 - (b = b / k - 1) * b) + f
    };
    CanvasAnimation.easeInOutCirc = function (b, f, g, k) {
        return 1 > (b /= k / 2) ? -g / 2 * (Math.sqrt(1 - b * b) - 1) + f : g / 2 * (Math.sqrt(1 - (b -= 2) * b) + 1) + f
    };

    CanvasAnimation.easeInElastic = function (a, b, f, g, k) {
        a = 0;
        var n = g;
        if (0 == b)return f;
        if (1 == (b /= k))return f + g;
        a || (a = .3 * k);
        n < Math.abs(g) ? (n = g, g = a / 4) : g = a / (2 * Math.PI) * Math.asin(g / n);
        return -(n * Math.pow(2, 10 * --b) * Math.sin(2 * (b * k - g) * Math.PI / a)) + f
    };
    CanvasAnimation.easeOutElastic = function (a, b, f, g, k) {
        var n = 0, A = g;
        if (0 == b)return f;
        if (1 == (b /= k))return f + g;
        n || (n = .3 * k);
        A < Math.abs(g) ? (A = g, a = n / 4) : a = n / (2 * Math.PI) * Math.asin(g / A);
        return A * Math.pow(2, -10 * b) * Math.sin(2 * (b * k - a) * Math.PI / n) + g + f
    };
    CanvasAnimation.easeInOutElastic = function (a, b, f, g, k) {
        var n = 0, A = g;
        if (0 == b)return f;
        if (2 == (b /= k / 2))return f + g;
        n || (n = .3 * k * 1.5);
        A < Math.abs(g) ? (A = g, a = n / 4) : a = n / (2 * Math.PI) * Math.asin(g / A);
        return 1 > b ? -.5 * A * Math.pow(2, 10 * --b) * Math.sin(2 * (b * k - a) * Math.PI / n) + f : A * Math.pow(2, -10 * --b) * Math.sin(2 * (b * k - a) * Math.PI / n) * .5 + g + f
    };

    CanvasAnimation.easeInBounce = function (a, b, f, g, k) {
        return g - this.easeOutBounce(a, k - b, 0, g, k) + f
    };
    CanvasAnimation.easeOutBounce = function (a, b, f, g, k) {
        return (b /= k) < 1 / 2.75 ? 7.5625 * g * b * b + f : b < 2 / 2.75 ? g * (7.5625 * (b -= 1.5 / 2.75) * b + .75) + f : b < 2.5 / 2.75 ? g * (7.5625 * (b -= 2.25 / 2.75) * b + .9375) + f : g * (7.5625 * (b -= 2.625 / 2.75) * b + .984375) + f
    };
    CanvasAnimation.easeInOutBounce = function (a, b, f, g, k) {
        return b < k / 2 ? .5 * this.easeInBounce(a, 2 * b, 0, g, k) + f : .5 * this.easeOutBounce(a, 2 * b - k, 0, g, k) + .5 * g + f
    };



    var main = new function(){
        this.RAF = 0;
    };//对CanvasAnimation做了测试，各个使用范例
    main.init = function(){
        CanvasAnimation.init({
            pointNumber:100,
            opacity:0
        });
    };
    /*********************************程序入口*********************************/
    main.start = function(){
        for(var i = 0;i < CanvasAnimation.points.length;i++){
            CanvasAnimation.setPointFree({
                index:i,
                limit:180,
                speed:1,
                zFlag:true
            });
        }
        setTimeout(function(){
            for(var i = 0;i < CanvasAnimation.points.length;i++){
                CanvasAnimation.addPointTask({
                    index:i,
                    attr:["opacity"],
                    start:{opacity:0},
                    end:{opacity:1},
                    duration:180,
                    speed:1,
                    zFlag:true
                });
            }
        },1000)

    };
    /*********************************程序入口*********************************/

    /*********************************渲染开关*********************************/
    main.startRender = function(){
        var loop = function(){
            CanvasAnimation.draw();
            main.RAF = r(loop);
        };
        var r = CanvasAnimation.requestAnimationFrame();
        this.RAF = r(loop);
    };
    main.stopRender = function(){
        window.cancelAnimationFrame(this.RAF);
    };
    /*********************************渲染开关*********************************/

    /*********************************业务*********************************/
    main.backToStart = function(){

        setTimeout(function(){
            var i ;
            for(i=0;i < CanvasAnimation.points.length;i++){
                CanvasAnimation.addPointTask({
                    index:i,
                    attr:["x","y","z"],
                    start:{x:CanvasAnimation.points[i].x,y:CanvasAnimation.points[i].y,z:CanvasAnimation.points[i].z},
                    end:{x:0,y:0,z:0},
                    callback:function(){

                    }
                })
            }
        },5000);
    };//点回到出发点
    main.boom = function(){
        for(var i = 0;i < CanvasAnimation.points.length;i++){
            this.addPointTask({
                index:i,
                attr:["x","y","z"],
                start:{x:CanvasAnimation.points[i].x,y:CanvasAnimation.points[i].y,z:CanvasAnimation.points[i].z},
                end:{x:this.rand(-300,300),y:this.rand(-300,300),z:this.rand(-300,300)},
                duration:60
            })
        }
    };
    main.goToCircle = function(i){
        var deg = this.points.length;
        var limitRad1 = this.rand(0,Math.PI);
        var limitRad2 = this.rand(-Math.PI,Math.PI);
        for(var i = 0;i<this.points.length;i++){
            this.addPointTask({
                index:i,
                attr:["x","y","z"],
                start:{x:this.points[i].x,y:this.points[i].y,z:this.points[i].z},
                end:{x:100*Math.sin(i*Math.PI/deg)*Math.cos(i*(1/50)*Math.PI-Math.PI),y:100*Math.sin(i*Math.PI/deg)*Math.sin(i*(1/50)*Math.PI-Math.PI),z:100*Math.cos(i*Math.PI/deg)},
                duration:200
            })
        }
    };
    /*********************************业务*********************************/



    /*********************************工具函数*********************************/
    main.rand = function (min, max) {
        return (Math.round((Math.random() * (max - min + 1) + min)*100)/100)
    },
    /*********************************工具函数*********************************/



    win.iCreative = {
        CA : CanvasAnimation,
    };
    win.main = main;
})(window);
$(function(){
    main.init();
    main.start();//自定义主流程内容，可操控canvasAnimation实例
    main.startRender();//开始渲染
    main.backToStart();
});