/**
 * Created by Z on 2016/10/9.
 */
// (function(){
    var CanvasAnimation = function(config){

        /*config可选参数:
        * config = {
        *   id:"canvas",
        *   pointId:"point",
        * }
        * */
        this._canvasId = undefined;//canvas的id
        this._canvas = undefined;//dom
        this._container = undefined;//canvas外层容器，决定宽高
        this._ctx = undefined;//上下文对象
        this._w = undefined;//canvas宽
        this._h = undefined;//canvas高
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

        this._pointImageId = undefined;//粒子图片的id
        this.pointsObject = undefined;//粒子图片dom
        this.pointHeight = this.pointWidth = undefined;//粒子的宽高

        this.task = [];//任务数组[{},{}]
        this.points = [];//粒子配置[{},{}]
        this.lines = [];//线条配置[{},{}]

        this.offsetTime = this.nowTime = this.lastTime = undefined;//时间偏移量，此刻时间，上一次时间
        this.speed = 1;//全局动画速度


        this.init(config);//配置静态数据
    };
    CanvasAnimation.prototype = {
        constructor:CanvasAnimation,
       init:function(config){
           var cfg = config?config:{};
           this._canvasId = cfg.id?cfg.id:"canvas";//canvas的id
           this._canvas = this.getDom(this._canvasId);//dom
           this._$container = jQuery(this._canvas).parent();//canvas外层容器，决定宽高
           this._ctx = this._canvas.getContext("2d");//上下文对象
           this._w = this._$container.width();//容器的宽
           this._h = this._$container.height();//容器的高

           this._canvas.width = this._w;//canvas的宽度
           this._canvas.height = this._h;//canvas的高度

       },

        draw:function(){

        },
        getDom:function(ID){
            return document.getElementById(ID);
        },
        requestAnimationFrame:function(){
            return window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (handler) {setTimeout(handler, 1000 / 60)}
        },
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
                pointId:"point",
            });
        },
        start:function(){
            this.canvasAnimation.init();
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
    
    var app = new main();
    console.log(app);
    app.start();
    app.startRAF();
// })();