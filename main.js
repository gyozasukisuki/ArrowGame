/// FontFaceオブジェクト生成
var fontFace = new FontFace(
  'DotAyu18', 
  'url(./fonts/JF-Dot-Ayu18.ttf)', 
  { style: 'normal', weight: 700}
);

fontFace.load().then(function(loadedFace){
  /// フォント読み込み成功
  /// body要素全体にそれを適用する
  document.fonts.add(loadedFace);
}).catch(function(e){
  console.error('フォント読み込み失敗');
});

phina.globalize();

const DEFAULT_BOARD_WIDTH = 800;
const DEFAULT_BOARD_HEIGHT = 800;
const DEFAULT_BOARD_DIVIDENUM = 10;
const DEFAULT_BOARD_DIVIDELINE_WIDTH = 2;
const DEFAULT_CURSOR_LINE_COLOR = "red";
const DEFAULT_CURSOR_LINE_WEIGHT = 5;
const DEFAULT_MESSAGEDISPLAY_BACKGROUNDRECT_HEIGHT = 300;
const DEFAULT_MESSAGEDISPLAY_BACKGROUNDRECT_WIDTH = 1400;

const UP_ARROW_DEGREE = 0;
const DOWN_ARROW_DEGREE = 180;
const RIGHT_ARROW_DEGREE = 90;
const LEFT_ARROW_DEGREE = 270;
const UPRIGHT_ARROW_DEGREE = 45;
const UPLEFT_ARROW_DEGREE = -45;
const DOWNRIGHT_ARROW_DEGREE = 135;
const DOWNLEFT_ARROW_DEGREE = -135;

const SCREEN_WIDTH = 1600;
const SCREEN_HEIGHT = 900;

isGoTitle = false;

class Board{
  boardRect; // main board object
  longitudinalDivideLines = [];
  horizontalDivideLines = [];

  info = []; // 矢印についての情報
  // 情報の形式
  // マス目の分だけ文字の要素を持った二次元配列
  // 何もない→""(空文字)
  // 矢印がおいてある "(type)(direction)" type -> 0 or 1 direction -> u(上) l(左) r(右) d(下) ur(右上) ul(左上) dr(右下) dl(左下)
  // ex: "0u", "1dl", ""
  

  constructor(_sceneSelf,{_width=DEFAULT_BOARD_WIDTH,_height=DEFAULT_BOARD_HEIGHT,_boardColor="white",_divideLineColor="black",_divideNum=DEFAULT_BOARD_DIVIDENUM,_divideLineWidth=DEFAULT_BOARD_DIVIDELINE_WIDTH}){
    this.sceneSelf = _sceneSelf;
    this.width = _width;
    this.height = _height;
    this.boardColor = _boardColor;
    this.divideLineColor = _divideLineColor;
    this.divideNum = _divideNum;
    this.divideLineWidth = _divideLineWidth;

    
    for(let i=0; i<this.divideNum; i++){
      let v = [];
      for(let j=0; j<this.divideNum; j++) v.push("");
      this.info.push(v);
    }
  }

  setPosition(_x,_y){
    this.boardRect.setPosition(_x,_y);

    const boardRectLeftX = (this.boardRect.x-this.boardRect.width/2);
    const boardRectTopY = (this.boardRect.y-this.boardRect.height/2);

    for(let i=0; i<this.longitudinalDivideLines.length; i++){
      this.longitudinalDivideLines[i].setPosition(boardRectLeftX+(this.boardRect.width/this.divideNum)*i, boardRectTopY);
    }

    for(let i=0; i<this.horizontalDivideLines.length; i++){
      this.horizontalDivideLines[i].setPosition(boardRectLeftX, boardRectTopY+(this.boardRect.height/this.divideNum)*i);
    }
  }

  draw(){
    this.boardRect = RectangleShape({
        width: this.width,
        height:this.height,
        stroke:"",
        fill:this.boardColor,
        shadow:"black",
        shadowBlur: 150,
    }).addChildTo(this.sceneSelf);
    // console.log(boardRect.x,boardRect.y);

    const boardRectLeftX = this.boardRect.left;
    const boardRectTopY = this.boardRect.top;

    if(this.longitudinalDivideLines.length < this.divideNum+1){
      for(let i=0; i<this.divideNum+1; i++){
        let longitudinalDivideLine = PathShape({
            paths:[
                Vector2(0, 0),
                Vector2(0, this.boardRect.height)
            ],
            stroke:this.divideLineColor,
            strokeWidth:this.divideLineWidth
        }).addChildTo(this.sceneSelf).setPosition(boardRectLeftX+(this.boardRect.width/this.divideNum)*i, boardRectTopY);
        this.longitudinalDivideLines.push(longitudinalDivideLine);
      }
    }
    
    if(this.horizontalDivideLines.length < this.divideNum+1){
      for(let i=0; i<this.divideNum+1; i++){
        let horizontalDivideLine = PathShape({
            paths:[
                Vector2(0, 0),
                Vector2(this.boardRect.width, 0)
            ],
            stroke:this.divideLineColor,
            strokeWidth:this.divideLineWidth
        }).addChildTo(this.sceneSelf).setPosition(boardRectLeftX, boardRectTopY+(this.boardRect.height/this.divideNum)*i);

        this.horizontalDivideLines.push(horizontalDivideLine);
      }
    }

    
  }

  // マス目(囲う線は含まない)の高さ(幅)+囲う線の一本分の高さ(幅) ← 分割数の分繰り返される
  calcOneSquareAndOneLineLong(){
    return (this.boardRect.height-this.divideLineWidth)/this.divideNum;
  }

  calcOneSquareLong(){
    return this.calcOneSquareAndOneLineLong()-this.divideLineWidth;
  }

  // 上からy個目、左からx個目のマスの中心の座標を取得する(0-indexed)
  getPositionOfSquare(_x,_y){
    if(this.divideNum <= _x || this.divideNum <= _y) console.error("指定されたマスは存在しません");
  
    // マス目(囲う線は含まない)の高さ(幅)+囲う線の一本分の高さ(幅) ← 分割数の分繰り返される
    const oneSquareAndOneLineLong = this.calcOneSquareAndOneLineLong();
    // マス目(囲う線は含まない)の高さ(幅)
    const oneSquareLong = this.calcOneSquareLong();

    const leftX = this.boardRect.x-this.boardRect.width/2;
    const topY = this.boardRect.y-this.boardRect.height/2;
  
    const x = Math.round(leftX+oneSquareAndOneLineLong*_x+this.divideLineWidth+(oneSquareLong/2));
    const y = Math.round(topY+oneSquareAndOneLineLong*_y+this.divideLineWidth+(oneSquareLong/2));
  
    return [x,y];
  }

  convertPositionToIndex(_x,_y){
    if(_x > this.boardRect.right || _x < this.boardRect.left || _y > this.boardRect.bottom || _y < this.boardRect.top){
      console.log("その座標はボード範囲外です");
      return;
    }

    let longitudinalDivideLinesX = [];
    for(let i=0; i<this.longitudinalDivideLines.length; i++) longitudinalDivideLinesX.push(this.longitudinalDivideLines[i].x);

    let horizontalDivideLinesY = [];
    for(let i=0; i<this.horizontalDivideLines.length; i++) horizontalDivideLinesY.push(this.horizontalDivideLines[i].y);

    return [lower_bound(longitudinalDivideLinesX,_x)-1, lower_bound(horizontalDivideLinesY,_y)-1];
  }
}

class BoardCursor{
  cursorRect;

  // マスにおいて、左からpx番目(0-indexed)
  // マスにおいて、上からpy番目(0-indexed)

  constructor(_attachBoard,_px=0,_py=0,_lineWeight=DEFAULT_CURSOR_LINE_WEIGHT,_lineColor=DEFAULT_CURSOR_LINE_COLOR){
    this.attachBoard = _attachBoard;
    this.px = _px;
    this.py = _py;
    this.lineWeight = _lineWeight;
    this.lineColor = _lineColor;
  }

  init(){
    // マス目(囲う線は含まない)の高さ(幅)
    const oneSquareLong = this.attachBoard.calcOneSquareLong();
    const edgeLong = oneSquareLong+this.attachBoard.divideLineWidth*2;

    this.cursorRect = RectangleShape({
        width: edgeLong,
        height: edgeLong,
        stroke:this.lineColor,
        fill:"",
        strokeWidth:this.lineWeight
    }).addChildTo(this.attachBoard.sceneSelf);

    const pos = this.attachBoard.getPositionOfSquare(this.px,this.py);
    this.cursorRect.setPosition(pos[0],pos[1]);
  }

  setIndex(_px,_py){
    if(_px >= this.attachBoard.divideNum || _py >= this.attachBoard.divideNum || _px < 0 || _py < 0){
      // console.error("指定されたpxまたはpyは不正です");
      return;
    }

    this.px = _px;
    this.py = _py;

    const pos = this.attachBoard.getPositionOfSquare(this.px,this.py);
    this.cursorRect.setPosition(pos[0],pos[1]);
  }
  
}

class Controller{
  up;
  left;
  right;
  down;
  upRight;
  upLeft;
  downRight;
  downLeft;
  a;
  b;
  buttons = [this.up,this.down,this.right,this.left,this.a,this.b];

  constructor(_sceneSelf,_upFunc,_downFunc,_rightFunc,_leftFunc,_upRightFunc,_upLeftFunc,_downRightFunc,_downLeftFunc,_aFunc,_bFunc){
    this.up = TriangleShape({
      radius:64,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200,_sceneSelf.gridY.center());

    this.left = TriangleShape({
      radius:64,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200-100,_sceneSelf.gridY.center()+100).setRotation(-90);

    this.right = TriangleShape({
      radius:64,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200+100,_sceneSelf.gridY.center()+100).setRotation(90);

    this.down = TriangleShape({
      radius:64,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200,_sceneSelf.gridY.center()+200).setRotation(180);

    this.upRight = TriangleShape({
      radius:32,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200+100,_sceneSelf.gridY.center()).setRotation(45);

    this.upLeft = TriangleShape({
      radius:32,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200-100,_sceneSelf.gridY.center()).setRotation(-45);

    this.downRight = TriangleShape({
      radius:32,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200+100,_sceneSelf.gridY.center()+200).setRotation(135);

    this.downLeft = TriangleShape({
      radius:32,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(200-100,_sceneSelf.gridY.center()+200).setRotation(-135);


    this.a = CircleShape({
      radius:64,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(1600-200 +64, _sceneSelf.gridY.center()+50);

    this.aLabel = Label({
      text:"A",
      fontSize:80,
      fill:"white",
      fontFamily:"DotAyu18",
    }).addChildTo(_sceneSelf).setPosition(1600-200 +64, _sceneSelf.gridY.center()+50);

    this.b = CircleShape({
      radius:64,
      fill:"black",
      stroke:"white",
    }).addChildTo(_sceneSelf).setPosition(1600-200 -64, _sceneSelf.gridY.center()+50 +150);

    this.bLabel = Label({
      text:"B",
      fontSize:80,
      fill:"white",
      fontFamily:"DotAyu18",
    }).addChildTo(_sceneSelf).setPosition(1600-200 -64, _sceneSelf.gridY.center()+50 +150);

    this.upRight.hide();
    this.upLeft.hide();
    this.downRight.hide();
    this.downLeft.hide();

    this.buttons = [this.up,this.down,this.right,this.left,this.a,this.b,this.upRight,this.upLeft,this.downRight,this.downLeft];
    this.funcs = [_upFunc,_downFunc,_rightFunc,_leftFunc,_aFunc,_bFunc,_upRightFunc,_upLeftFunc,_downRightFunc,_downLeftFunc];

    for(let i=0; i<this.buttons.length; i++) this.buttons[i].setInteractive(true);
    for(let i=0; i<this.buttons.length; i++){
      this.buttons[i].onpointstart = (e) => {
        this.buttons[i].fill = "yellow";
        if(this.buttons[i] === this.a) this.aLabel.fill = "black";
        if(this.buttons[i] === this.b) this.bLabel.fill = "black";

        this.funcs[i]();
      }

      this.buttons[i].onpointend = (e) =>{
        this.buttons[i].fill = "black";
        if(this.buttons[i] === this.a) this.aLabel.fill = "white";
        if(this.buttons[i] === this.b) this.bLabel.fill = "white";
      }
    }

  }

  appearDiagonalButtons(){
    this.upRight.show();
    this.upLeft.show();
    this.downRight.show();
    this.downLeft.show();
  }

  hideDiagonalButtons(){
    this.upRight.hide();
    this.upLeft.hide();
    this.downRight.hide();
    this.downLeft.hide();
  }
}

class MessageDisplay{
  // メッセージ表示のとき後ろにある四角
  backgroundRect;
  // メッセージ表示用ラベル
  messageLabel;

  constructor(_sceneSelf, verticalPosString){
    let backgroundRectY;
    switch(verticalPosString){
      case "top":
        backgroundRectY = SCREEN_HEIGHT/4;
        break;
      case "center":
        backgroundRectY = _sceneSelf.gridY.center();
        break;
      case "bottom":
        backgroundRectY = SCREEN_HEIGHT-SCREEN_HEIGHT/4;
        break;
      default:
        console.error("MessageDisplayのverticalPosStringが不正です。top,bottom,centerのいずれかである必要があります");
        break;
    }
    

    this.backgroundRect = RectangleShape({
      width: DEFAULT_MESSAGEDISPLAY_BACKGROUNDRECT_WIDTH,
      height: DEFAULT_MESSAGEDISPLAY_BACKGROUNDRECT_HEIGHT,
      fill:"black",
      stroke: "white",
      strokeWidth: 12,

    }).addChildTo(_sceneSelf).setPosition(_sceneSelf.gridX.center(),backgroundRectY);

    this.messageLabel = Label({
      text: "hello\nこんにちは\n謝謝",
      fontSize:64,
      fill: "white",
      fontFamily: "DotAyu18",
      align: "left"
    }).addChildTo(_sceneSelf).setPosition(this.backgroundRect.left+30,backgroundRectY);
  }
}

let turnNum = 0;

const ASSETS = {
  image:{
    'arrowRed':"./assets/yajirushiRed_top.png",
    'arrowBlue':"./assets/yajirushiBlue_top.png"
  },
}

phina.define('TitleScene', {
  superClass: 'DisplayScene',
  
  init: function(option) {
    this.superInit(option);
    this.superInit({
      width:SCREEN_WIDTH,
      height:SCREEN_HEIGHT,
    });
    this.backgroundColor = "skyblue";

    this.titleLabel = Label({
      text:"矢印トライアングルス",
      stroke: "black",
      fill: "white",
      fontSize:80,
      strokeWidth: 4,
    }).addChildTo(this).setPosition(this.gridX.center(),this.gridY.center()-80);

    this.startButton = RectangleShape({
      width:250,
      height:50,
      stroke:"black",
      fill:"white",
    }).addChildTo(this).setPosition(this.gridX.center(),this.gridY.center()+30);

    this.startLabel = Label({
      text:"スタート",
      fill: "black",
      fontSize:20,
    }).addChildTo(this).setPosition(this.startButton.x,this.startButton.y);

  },
  update: function(app){
    this.startButton.setInteractive(true);

    this.startButton.onpointstart = (e) => {
      this.startButton.fill = "black";
      this.startLabel.fill = "white";
    };

    this.startButton.onpointend = (e) => {
      this.app.replaceScene(MainScene());
    }
  }
});

phina.define('GamePoseScene', {
  superClass: 'DisplayScene',
  init: function(option) {
    this.superInit(option);
    this.superInit({
      width:SCREEN_WIDTH,
      height:SCREEN_HEIGHT,
    });
    this.backgroundColor = "rgba(0,0,0,0.6)";

    this.goTitleButton = RectangleShape({
      width:300,
      height:80,
      stroke:"white",
      fill:"black",
    }).addChildTo(this).setPosition(this.gridX.center()+200,this.gridY.center());

    this.goTitleLabel = Label({
      text:"タイトルへ",
      fontSize:40,
      fill:"yellow",
    }).addChildTo(this).setPosition(this.goTitleButton.x,this.goTitleButton.y);

    this.goTitleButton.setInteractive(true);
    this.goTitleButton.onpointstart = (e) => {
      isGoTitle = true;
      this.exit();
    }

    this.backGameButton = RectangleShape({
      width:300,
      height:80,
      stroke:"white",
      fill:"black",
    }).addChildTo(this).setPosition(this.gridX.center()-200,this.gridY.center());

    this.backGameLabel = Label({
      text:"戻る",
      fontSize:40,
      fill:"white",
    }).addChildTo(this).setPosition(this.backGameButton.x,this.backGameButton.y);

    this.backGameButton.setInteractive(true);

    this.backGameButton.onpointstart = (e) => {
      this.exit();
    }
  }
});

phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function(option) {
    this.superInit(option); // 親クラス（DisplayScene）のコンストラクタを呼ぶ
    this.superInit({
      width:SCREEN_WIDTH,
      height:SCREEN_HEIGHT,
    });
    this.backgroundColor = "green";
    // let boardRect = createBoard(this,{});
    this.board = new Board(this,{});

    this.board.draw();
    this.board.setPosition(this.gridX.center(),this.gridY.center());
    console.log("width",this.board.boardRect.width);

    this.cursor = new BoardCursor(this.board,0,0);
    this.cursor.init();

    this.focusArrow = null;

    this.controller = new Controller(
      this,
      () => {
        if(this.focusArrow !== null){
          this.focusArrow.rotation = UP_ARROW_DEGREE;
          return;
        }
        this.cursor.setIndex(this.cursor.px,this.cursor.py-1)
      }, // up
      () => {
        if(this.focusArrow !== null){
          this.focusArrow.rotation = DOWN_ARROW_DEGREE;
          return;
        }
        this.cursor.setIndex(this.cursor.px,this.cursor.py+1)
      }, // down
      () => {
        if(this.focusArrow !== null){
          this.focusArrow.rotation = RIGHT_ARROW_DEGREE;
          return;
        }
        this.cursor.setIndex(this.cursor.px+1,this.cursor.py)
      }, // right
      () => {
        if(this.focusArrow !== null){
          this.focusArrow.rotation = LEFT_ARROW_DEGREE;
          return;
        }
        this.cursor.setIndex(this.cursor.px-1,this.cursor.py)
      }, // left
      () => {
        if(this.focusArrow !== null) this.focusArrow.rotation = UPRIGHT_ARROW_DEGREE;
      }, // upRight
      () => {
        if(this.focusArrow !== null) this.focusArrow.rotation = UPLEFT_ARROW_DEGREE;
      }, // upLeft
      () => {
        if(this.focusArrow !== null) this.focusArrow.rotation = DOWNRIGHT_ARROW_DEGREE;
      }, // downRight
      () => {
        if(this.focusArrow !== null) this.focusArrow.rotation = DOWNLEFT_ARROW_DEGREE;
      }, // downLeft
      () => {
        if(this.focusArrow === null){
          // 矢印の向き選択画面ではない
          if(this.board.info[this.cursor.py][this.cursor.px] != "") return; // マスが空ではなかった
          
          this.focusArrow = putArrow(this,this.cursor.px,this.cursor.py,this.board,(turnNum % 2 ? "red":"blue"));
          this.cursor.cursorRect.stroke = "blue";
          this.controller.appearDiagonalButtons();
          return;
        }
        // 矢印の向き確定処理
        this.board.info[this.cursor.py][this.cursor.px] = String(String((turnNum%2))+changeDegreeToDirectionString(this.focusArrow.rotation));
        this.focusArrow = null;
        this.cursor.cursorRect.stroke = "red";
        this.controller.hideDiagonalButtons();
        let [arrowDx,arrowDy] = getDxDyByData(this.board.info[this.cursor.py][this.cursor.px]);

        // 三角形ができたかジャッジ
        if(judgeStartAt(this.cursor.px,this.cursor.py,arrowDx,arrowDy,turnNum%2,this.board.info,[])){
          this.gameoverMessage = Label({
            text:"Arrow Triangle!!",
            fontSize:80,
            fontFamily: "DotAyu18",
          }).addChildTo(this).setPosition(this.gridX.center(),this.gridY.center());
          console.log("Arrow Triangle!!!");
        }

        turnNum++;
      }, // a
      () => {
        if(this.focusArrow != null){
          this.focusArrow.remove();
          this.focusArrow = null;
          this.cursor.cursorRect.stroke ="red";
          this.controller.hideDiagonalButtons();
          return;
        }
      } // b
    );

    this.board.boardRect.setInteractive(true);
    this.board.boardRect.onpointstart = (e) => {
      if(this.focusArrow !== null){
        return;
      }
      let [px,py] = this.board.convertPositionToIndex(e.pointer.x,e.pointer.y);
      this.cursor.setIndex(px,py);
    };
    console.log(this.board.info);
    
    this.poseButton = RectangleShape({
      width:140,
      height:60,
      stroke: "white",
      fill: "black",

    }).addChildTo(this).setPosition(SCREEN_WIDTH-160,0+80);

    this.poseLabel = Label({
      text: "Exit",
      fill: "white",
    }).addChildTo(this).setPosition(this.poseButton.x,this.poseButton.y);

    this.poseButton.setInteractive(true);
    this.poseButton.onpointstart = (e) => {
      this.app.pushScene(GamePoseScene());
    }
  },

  update: function(app){
    if(isGoTitle){
      isGoTitle = false;
      this.app.replaceScene(TitleScene());
    }

    //ゲームループ
    const key = app.keyboard;
    
    if(key.getKeyDown("up")) this.controller.funcs[0]();
    if(key.getKeyDown("down")) this.controller.funcs[1]();
    if(key.getKeyDown("right")) this.controller.funcs[2]();
    if(key.getKeyDown("left")) this.controller.funcs[3]();
    if(key.getKeyDown("up") && key.getKeyDown("right")) this.controller.funcs[6]();
    if(key.getKeyDown("up") && key.getKeyDown("left")) this.controller.funcs[7]();
    if(key.getKeyDown("down") && key.getKeyDown("right")) this.controller.funcs[8]();
    if(key.getKeyDown("down") && key.getKeyDown("left")) this.controller.funcs[9]();
  }
});

phina.main(function() {
  var app = GameApp({
    startLabel: 'title',
    scenes:[
      {
        className: "TitleScene",
        label: "title",
        nextLabel: "main",
      },
      {
        className: "MainScene",
        label:"main",
        nextLabel: "title",
      },
    ],
    width:SCREEN_WIDTH,
    height:SCREEN_HEIGHT,
    assets:ASSETS,
  });
  app.run();
});

function putArrow(_sceneSelf,_px,_py,_board,_type){
  let arrowSprite;
  if(_type == "red") arrowSprite = Sprite("arrowRed");
  else if(_type == "blue") arrowSprite = Sprite("arrowBlue");
  else{
    console.error("存在しない矢印のタイプです");
  }

  let pos = _board.getPositionOfSquare(_px,_py);

  arrowSprite.addChildTo(_sceneSelf).setPosition(pos[0],pos[1]).setSize(_board.calcOneSquareLong()-30,_board.calcOneSquareLong()-30);
  
  return arrowSprite;
}

function changeDegreeToDirectionString(_degree){
  let res = "";
  switch(_degree){
    case UP_ARROW_DEGREE:
      res = "u";
      break;
    case DOWN_ARROW_DEGREE:
      res = "d";
      break;
    case RIGHT_ARROW_DEGREE:
      res = "r";
      break;
    case LEFT_ARROW_DEGREE:
      res = "l";
      break;
    case UPRIGHT_ARROW_DEGREE:
      res = "ur";
      break;
    case UPLEFT_ARROW_DEGREE:
      res = "ul";
      break;
    case DOWNRIGHT_ARROW_DEGREE:
      res = "dr";
      break;
    case DOWNLEFT_ARROW_DEGREE:
      res = "dl";
      break;
  }
  return res;

}

function isInSquareGrid(_px,_py,_grid){
  return Boolean(_px >= 0 && _px < _grid.length && _py >= 0 && _py < _grid.length);
}

function getDxDyByData(_data){
  const dirData = _data.substring(1);
  let dx=0,dy=0;
  switch(dirData[0]){
    case "u":
      dy = -1;
      break;
    case "d":
      dy = 1;
      break;
    case "r":
      dx = 1;
      break;
    case "l":
      dx = -1;
      break;
  }

  // console.log(_data,dx,dy);
  if(dirData.length === 1) return [dx,dy];

  if(dirData[1] === "r") dx = 1;
  else if(dirData[1] === "l") dx = -1;
  // console.log(_data,dx,dy);
  return [dx,dy];
}

// px,py-> 矢印をおいた場所 dx,dy -> 矢印の向き(=進む向き用) type->矢印の種類(turnNum%2) info -> 矢印とかの情報を持ったBoardクラスの持つ二次元配列 tripos -> 通ってきた矢印の[px,py]の配列
function judgeStartAt(_px,_py,_dx,_dy,_type,_info,_tripos){
  let ans = false;
  
  // 何も置かれていないマス
  if(_info[_py][_px] == ""){
    let nx = _px+_dx;
    let ny = _py+_dy;

    if(isInSquareGrid(nx,ny,_info)) return ans |= judgeStartAt(nx,ny,_dx,_dy,_type,_info,_tripos);
    return ans;
  }

  // 自分とはタイプの異なる矢印
  if(_info[_py][_px][0] !== String(_type)) return ans;

  // 自分と同じタイプの矢印がおいてある
  if(_tripos.length < 3){
    // まだ通ってきた矢印が3つに満たない
    
    //ここの矢印を使う(方向転換)場合と使わない場合どちらも試す
    //使わない場合
    if(_tripos.length >= 1){
      let nx = _px+_dx;
      let ny = _py+_dy;
      
      if(isInSquareGrid(nx,ny,_info)) ans |= judgeStartAt(nx,ny,_dx,_dy,_type,_info,_tripos);
    }   
    
    // 使う場合
    
    _tripos.push([_px,_py]);

    let [ndx,ndy] = getDxDyByData(_info[_py][_px]); // _dx,_dyの調節
    
    if(ndx === _dx*-1 && ndy === _dy*-1) return ans;
    nx = _px+ndx;
    ny = _py+ndy;

    if(isInSquareGrid(nx,ny,_info)) ans |= judgeStartAt(nx,ny,ndx,ndy,_type,_info,_tripos);
    return ans;
  }

  if(_tripos.length == 3 && _tripos[0][0] == _px && _tripos[0][1] == _py){
    // 帰ってきた⇔成立条件を満たした三角形がある
    // console.log("found Triangle!");
    return ans=true;
  }
  
  return ans;
}

function helloFunc(){
  console.log("hello");
}

// 二分探索を用いてarrの中のnum以上の要素で一番小さいインデックスを返す
function lower_bound(arr,num){
  let l=0,r=arr.length-1;
  while(r-l>1){
    let mid = Math.floor((l+r)/2);
    if(arr[mid] >= num) r = mid;
    else l = mid;
  }

  return r;
}
