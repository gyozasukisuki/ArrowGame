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

const SCREEN_WIDTH = 1600;
const SCREEN_HEIGHT = 900;

class Board{
  boardRect; // main board object
  longitudinalDivideLines = [];
  horizontalDivideLines = [];

  constructor(_sceneSelf,{_width=DEFAULT_BOARD_WIDTH,_height=DEFAULT_BOARD_HEIGHT,_boardColor="white",_divideLineColor="black",_divideNum=DEFAULT_BOARD_DIVIDENUM,_divideLineWidth=DEFAULT_BOARD_DIVIDELINE_WIDTH}){
    this.sceneSelf = _sceneSelf;
    this.width = _width;
    this.height = _height;
    this.boardColor = _boardColor;
    this.divideLineColor = _divideLineColor;
    this.divideNum = _divideNum;
    this.divideLineWidth = _divideLineWidth;
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
  a;
  b;
  buttons = [this.up,this.down,this.right,this.left,this.a,this.b];

  constructor(_sceneSelf,_upFunc,_downFunc,_rightFunc,_leftFunc,_aFunc,_bFunc){
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

    this.buttons = [this.up,this.down,this.right,this.left,this.a,this.b];
    this.funcs = [_upFunc,_downFunc,_rightFunc,_leftFunc,_aFunc,_bFunc];

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

phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function(option) {
    this.superInit(option); // 親クラス（DisplayScene）のコンストラクタを呼ぶ
    this.backgroundColor = "green";
    // let boardRect = createBoard(this,{});
    this.board = new Board(this,{});

    this.board.draw();
    this.board.setPosition(this.gridX.center(),this.gridY.center());
    console.log("width",this.board.boardRect.width);

    this.cursor = new BoardCursor(this.board,0,0);
    this.cursor.init();

    this.controller = new Controller(
      this,
      () => this.cursor.setIndex(this.cursor.px,this.cursor.py-1), // up
      () => this.cursor.setIndex(this.cursor.px,this.cursor.py+1), // down
      () => this.cursor.setIndex(this.cursor.px+1,this.cursor.py), // right
      () => this.cursor.setIndex(this.cursor.px-1,this.cursor.py), // left
      helloFunc, // a
      helloFunc // b
    );

    this.board.boardRect.setInteractive(true);
    this.board.boardRect.onpointstart = (e) => {
      let [px,py] = this.board.convertPositionToIndex(e.pointer.x,e.pointer.y);
      this.cursor.setIndex(px,py);
    };
    
    this.messageDis = new MessageDisplay(this,"center");
  },

  update: function(app){
    //ゲームループ
    const key = app.keyboard;
    if(key.getKeyDown("right")) this.cursor.setIndex(this.cursor.px+1,this.cursor.py);
    if(key.getKeyDown("left")) this.cursor.setIndex(this.cursor.px-1,this.cursor.py);
    if(key.getKeyDown("up")) this.cursor.setIndex(this.cursor.px,this.cursor.py-1);
    if(key.getKeyDown("down")) this.cursor.setIndex(this.cursor.px,this.cursor.py+1);
  }
});

phina.main(function() {
  var app = GameApp({
    startLabel: 'main',
    width:SCREEN_WIDTH,
    height:SCREEN_HEIGHT
  });
  app.run();
});

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