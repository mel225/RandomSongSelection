/************** 読み込み時実行内容 ***************/
window.onload = function(){
  // いろいろな初期化
  window.filter = {}; // フィルター条件の初期化
  window.randomNum = 1; // ランダム選曲の曲数の初期化
  window.randomDup = true; // ランダム選曲の重複の初期化
  window.modaljackets = {}; // 画像キャッシュのためのモーダル保存領域の初期化

  // 曲一覧テーブル要素の取得
  var table = document.querySelector("table[name=songlist]");

  // リストの各行要素にデータを格納、同時にフィルターの要素生成
  Array.from(table.tBodies[0].rows).forEach(function(tr){
    Array.from(tr.cells).forEach(function(td){
      // 項目名の取得
      var item = td.firstElementChild.className.split(" ")[0];
      
      // 要素の取得
      var value = td.innerText.replace(/[\r\n]/g, "");
      
      // データ格納
      tr[item] = value;

      // フィルターの要素生成（タイトル以外）
      if(item != "title"){
        if(window.filter[item]){ // すでに項目が生成されている場合
          if(window.filter[item].indexOf(value) < 0) // すでに要素が追加されてなければ追加
            window.filter[item].push(value);
        }else{ // 項目別初となる要素のとき
          window.filter[item] = [value]; // 要素を配列形式にして追加
        }
      }
    });
    // 画像のURLを設定
    tr.jacket = "https://ongeki-net.com/ongeki-mobile/img/music/" + tr.lastElementChild.value;
  });
}

/************** 以下 要素登録関数(onchangeとか) **************/

// table[name=songlist] tr onclick 曲の行をクリックしたときにモーダルでジャケット画像を表示する
function viewjacket(tr){
  // 別窓で表示
  //window.open("https://ongeki-net.com/ongeki-mobile/img/music/" + tr.querySelector("input").value); モーダル表示に変更のため削除 (200703)

  // キャッシュから取得する（未生成なら作る）
  var div = window.modaljackets[tr.jacket];
  if(!div){
    // 全体を覆う黒幕を生成
    div = document.body.appendChild(document.createElement("div")); // 要素生成
    div.setAttribute("name", "modal"); // name 属性を設定
    
    // テーブルを乗せる要素を生成
    var tdiv = div.appendChild(document.createElement("div")); // 要素生成と追加
    
    // 曲名などの情報を表示するテーブルを生成
    var table = tdiv.appendChild(document.createElement("table")); // 要素生成と追加
    
    // モーダルウィンドウを閉じるボタンを生成
    var button = document.createElement("button");
    button.innerText = "閉じる"; // ボタン上の文字の表示
    button.onclick = function(){ // ボタンがクリックされた際の動作
      // モーダルウィンドウの非表示
      div.style.display = "none";
    };
    
    // 画像の生成
    img = document.createElement("img"); // 要素生成
    img.src = tr.jacket; // 画像のURLを設定
    
    // 曲名の生成
    var span = document.createElement("span"); // 要素生成
    span.innerText = tr.title; // 曲名を設定
    
    // テーブル上に情報を配置する
    table.insertRow().insertCell().appendChild(span); // 曲名の表示
    table.insertRow().insertCell().appendChild(img); // 画像の表示
    table.insertRow().insertCell().appendChild(button); // 閉じるボタンの表示

    // 要素をキャッシュに登録
    window.modaljackets[tr.jacket] = div;
  }

  // モーダルウィンドウを表示
  div.style.display = "block";
}

// table[name=filter] tr onclick フィルターに設定した条件に基づいて曲一覧を更新する
function setsublist(){
  // 変数宣言
  var count = 0; // 該当曲数
  var table = document.querySelector("table[name=songlist]"); // 曲一覧テーブル

  // 条件(window.filter)に従い、曲一覧テーブルの各曲の 表示/非表示 を設定する
  Array.from(table.tBodies[0].rows).forEach(function(tr){
    var applicable = true; // 条件に該当するか
    
    // 各項目条件を参照
    Object.keys(window.filter).forEach(function(item){ // item: 項目名
      if(applicable){ // 有効であれば
        // 各項目の有効条件を取得
        var value = filter[item];
        if(Array.isArray(value)){ // 複数指定のとき
          applicable = (value.indexOf(tr[item]) >= 0);
        }else{ // 単一指定のとき(おそらく不使用)
          applicable = (value == tr[item]);
        }
      }
    });
    
    // 結果に従い表示、非表示の設定
    if(applicable){
      tr.style.display = ""; // [HTMLTable*Element] の表示は "block" ではなく ""
      tr.setAttribute("display", true); // 属性値を付けておく（querySelectorで検出しやすくするため）
      count++; // 該当数のカウントアップ
    }else{
      tr.style.display = "none"; // 非表示設定
      tr.setAttribute("display", false); // 属性値を付けておく（querySelectorで検出しやすくするため）
    }
  });

  // 該当曲数を表示
  document.querySelector("span[name=songNum]").innerText = count + "曲";
}

// table[name=random] input[type=number] onchange ランダム選曲の曲数の値が変更された時の処理
function changeRandomNum(input){
  // エラーを防ぐための処理 (曲数が0以下になることはないため）
  if(input.value < 1) input.value = 1;
  // 処理後の値をグローバル変数にセット
  window.randomNum = parseInt(input.value);
}

// table[name=random] input[type=checkbox] onchange ランダム選曲において重複を許すかのチェックが変更された時の処理
function changeRandomDup(input){
  // 値をグローバル変数にセット
  window.randomDup = input.checked;
}

// table[name=random] button onclick ランダム選曲を実行する時の処理
function doRandomSelection(){
  // 必要な情報を取得
  var songs = Array.from(document.querySelectorAll("table[name=songlist] tbody tr[display=true]")); // 表示されている曲一覧から各行要素を配列形式で取得
  var table = document.querySelector("table[name=random]"); // ランダム選曲された結果を表示するテーブル要素を取得

  // ランダム選曲の現在表示中の結果を破棄
  while(table.tBodies[0].rows[0]) table.tBodies[0].deleteRow(0);

  // 乱数を用いて選曲
  for(var i=0; i<window.randomNum && songs.length > 0; i++){
    // 乱数から添え字を生成
    var idx = parseInt(Math.random() * (songs.length - 1));
    // テーブルに要素をコピー
    table.tBodies[0].appendChild(songs[idx].cloneNode(true));
    // 重複無しの場合は配列から要素を削除
    if(!window.randomDup) songs = songs.filter(function(n, i){return i!=idx;}); // 実際は要素を除いた配列を新たに生成している
  }
}

// table[name=filter] button onclick フィルターの項目毎の全選択をするときの処理
function filterselectall(input){
  // 変数宣言
  var items = []; // フィルターの条件(window.filter)に設定する配列
  var item = input.parentNode.getAttribute("value"); // 項目名

  // 項目内のリストを配列で取得、各要素に対して処理
  Array.from(document.querySelectorAll(`table[name=filter] tbody td[value=${item}] input[type=checkbox]`)).forEach(function(input){
    input.checked = true; // 選択状態にする
    items.push(input.value); // 配列に要素を追加
  });

  console.log("全選択後", window.filter[item]);

  // 条件をセット
  window.filter[item] = items;
}

// table[name=filter] button onclick フィルターの項目毎の全解除をするときの処理
function filternotselectall(input){
  // 変数宣言
  var item = input.parentNode.getAttribute("value"); // 項目名
  
  // 項目内のリストを配列で取得、各要素に対して処理
  Array.from(document.querySelectorAll(`table[name=filter] tbody td[value=${item}] input[type=checkbox]`)).forEach(function(input){
    input.checked = false; // 非選択状態にする
  });

  console.log("全解除後", window.filter[item]);

  // 条件(window.filter)を空にする
  window.filter[item] = [];
}

// table[name=filter] li input onchange フィルターの各要素の状態が変更された時の処理
function changefilteritem(input){
  // 変数宣言
  var item = input.parentNode.parentNode.parentNode.getAttribute("value"); // 項目名

  // 状態によって条件(window.filter)を設定
  if(input.checked){ // 選択状態 条件に要素を追加する
    if(window.filter[item])
      window.filter[item].push(input.value);
    else
      window.filter[item] = [input.value];
  }else{ // 非選択状態 条件から要素を削除する
    window.filter[item] = window.filter[item].filter(function(value){return value != input.value;});
  }
}