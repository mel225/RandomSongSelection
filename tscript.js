/************** 読み込み時実行内容 ***************/
// 楽曲データの取得
var songlist;
jsonp("https://script.google.com/macros/s/AKfycbzgVmnE9rqcIjH2uaOZizkcYP_wqA8xj6kEqGZVsCYKvL_EIl1i/exec", function(data){
  window.songlist = data;
  if(document.readyState != "complete"){
    window.addEventListener("load", window_onload);
  }else{
    window_onload();
  }
});

// キャラソート順データの取得
jsonp("https://script.google.com/macros/s/AKfycbzgVmnE9rqcIjH2uaOZizkcYP_wqA8xj6kEqGZVsCYKvL_EIl1i/exec?bossname=list", function(data){
  window.boss_name_list = data;
});

function jsonp(url, callback) {
  var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
  window[callbackName] = function(data) {
    delete window[callbackName];
    document.head.removeChild(script);
    callback(data);
  };
  
  var script = document.createElement('script');
  script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
  document.head.appendChild(script);
}

async function window_onload(){  
  // いろいろな初期化
  window.filter = {}; // フィルター条件の初期化
  window.randomNum = 1; // ランダム選曲の曲数の初期化
  window.randomDup = true; // ランダム選曲の重複の初期化
  window.modaljackets = {}; // 画像キャッシュのためのモーダル保存領域の初期化

  // 曲一覧テーブル要素の取得
  var table = document.querySelector("table[name=songlist]");
  if(!table.tBodies.length){
    table.createTBody();
  }

  // songlistからリストを生成、各行要素にデータを格納、同時にフィルターの要素生成
  for(var i = 0; i < songlist.length; i++){
    var song = songlist[i];
    var tr = table.tBodies[0].insertRow();

    tr.onclick = function(){viewjacket(this)};
    tr.setAttribute("display", "true");
    tr.setAttribute("exclude", "false");
    tr.setAttribute("title", song.title);

    ["difficulty", "title", "level", "boss_attr", "boss_name", "boss_level", "genre", "label"].forEach(function(header){

      // 情報の付加
      tr[header] = song[header];

      // 本体の作成
      var div = tr.insertCell().appendChild(document.createElement("div"));
      switch(header){
      case "label":
        var label = div.appendChild(document.createElement("label"));
        label.onclick = exclution;
        label.setAttribute("name", "exclude_" + i);
        label.innerText = "除外";
        break;

      case "difficulty":
      case "boss_attr":
        div.className = header + " " + song[header];
        div.innerText = song[header];
        break;

      default:
        div.className = header;
        div.innerText = song[header];
        break;
      }
      
      // フィルターの要素生成（タイトル以外）
      if(header != "title"){
        if(window.filter[header]){ // すでに項目が生成されている場合
          if(window.filter[header].indexOf(song[header]) < 0) // すでに要素が追加されてなければ追加
            window.filter[header].push(song[header]);
        }else{ // 項目別初となる要素のとき
          window.filter[header] = [song[header]]; // 要素を配列形式にして追加
        }
      }
    })
    
    // 画像のURLを設定
    tr.jacket = "https://ongeki-net.com/ongeki-mobile/img/music/" + song.jacket;

    // 追加日を設定
    tr.append_date = song.append_date;
    
    // 削除日を設定
    tr.delete_date = song.delete_date;

    // サブタイトルを設定
    tr.subtitle - song.subtitle;
  }

  // 曲数を設定
  document.querySelector("span[name=songNum]").innerText = songlist.length + "曲";

  // フィルター要素のソート
  window.filter.level.sort(complevel);
  window.filter.boss_level.sort(complevel);
  await new Promise(function(r){
    var fid = setInterval(function(){
      if(window.boss_name_list){
        clearInterval(fid);
        r();
      }
    });
  },0);
  window.filter.boss_name.sort(function(a,b){
    var ai = window.boss_name_list.indexOf(a);
    var bi = window.boss_name_list.indexOf(b);
    if(bi < 0) return -1;
    if(ai < 0) return 1;
    return ai - bi;
  });
  
  function complevel(a,b){
    var al = a.replace(/[^0-9]/g,"").length;
    var bl = b.replace(/[^0-9]/g,"").length;
    if(al == bl){
      if(a<b) return -1;
      else if(a==b) return 0;
      else return 1;
    }else{
      if(al<bl) return -1;
      else return 1;
    }
  }

  // フィルター表の生成
  createFilter();

  load_complete();
}

// フィルター表の生成
function createFilter(){
  var table = document.querySelector("table[name=filter]");
  var tr = table.tBodies[0].insertRow();
  Array.from(table.tHead.rows[0].cells).forEach(function(th){
    var td = tr.insertCell();
    var item = th.getAttribute("value");
    td.setAttribute("value", item);
    var list = td.appendChild(document.createElement("ul"));
    window.filter[item].forEach(function(e){
      var element = list.appendChild(document.createElement("li"));
      var input = element.appendChild(document.createElement("input"));
      input.type = "checkbox";
      input.style.display = "none";
      input.id = item + "_" + e;
      input.value = e;
      input.setAttribute("checked", true);
      input.setAttribute("onchange", "changefilteritem(this)");
      var label = element.appendChild(document.createElement("label"));
      label.setAttribute("for", item + "_" + e);
      label.innerText = e;
    });
  });
}

// フィルターに設定した条件に基づいて曲一覧を更新する
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
    tdiv.setAttribute("name", "jacket");
    
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
  var songs = Array.from(document.querySelectorAll("table[name=songlist] tbody tr[display=true][exclude=false]")); // 表示されている曲一覧から各行要素を配列形式で取得
  var table = document.querySelector("table[name=random]"); // ランダム選曲された結果を表示するテーブル要素を取得

  // ランダム選曲の現在表示中の結果を破棄
  while(table.tBodies[0].rows[0]) table.tBodies[0].deleteRow(0);

  // 乱数を用いて選曲
  for(var i=0; i<window.randomNum && songs.length > 0; i++){
    // 乱数から添え字を生成
    var idx = parseInt(Math.random() * songs.length);
    // テーブルに要素をコピー
    var copy = songs[idx].cloneNode(true);
    table.tBodies[0].appendChild(copy);
    // labelのonclickを設定
    copy.querySelector("label").onclick = exclution;
    // jacketを設定
    copy.jacket = songs[idx].jacket;
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

  // 条件をセット
  window.filter[item] = items;

  // リストを更新する
  setsublist();
}

// table[name=filter] button onclick フィルターの項目毎の全解除をするときの処理
function filternotselectall(input){
  // 変数宣言
  var item = input.parentNode.getAttribute("value"); // 項目名
  
  // 項目内のリストを配列で取得、各要素に対して処理
  Array.from(document.querySelectorAll(`table[name=filter] tbody td[value=${item}] input[type=checkbox]`)).forEach(function(input){
    input.checked = false; // 非選択状態にする
  });

  // 条件(window.filter)を空にする
  window.filter[item] = [];

  // リストを更新する
  setsublist();
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

  // リストを更新する
  setsublist();
}

// table[name=songlist] div input[type=checkbox] 除外するやつ
function exclution(e){
  stopBubbling(e);
  if(!e.path){
    var f = e.target;
    while(f.parentNode){
      f = f.parentNode;
      set_exclution(f);
    }
  }else{
    e.path.forEach(set_exclution);
  }
  
  function set_exclution(p){
    if(p.tagName == "TABLE"){
      var name = p.getAttribute("name");
      if(name == "songlist"){
        exclude(e.target, true);
      }else if(name == "random"){
        exclude(e.target, false);
        exclude(document.querySelector(`table[name=songlist] tbody label[name=${e.target.getAttribute("name")}]`), true);
      }else if(name == "excludelist"){
        exclude(e.target, false);
        exclude(document.querySelector(`table[name=songlist] tbody label[name=${e.target.getAttribute("name")}]`), false);
      }
    }
  }
}

function stopBubbling(e){
  e.preventDefault();
  e.stopPropagation();
}

function exclude(target, isSonglist){
  var tr = target.parentNode.parentNode.parentNode; // label < div < td < tr
  if(tr.getAttribute("exclude") == "true"){ // to FALSE
    target.innerText = "除外"
    tr.style.background = "#ffff";
    tr.setAttribute("exclude", false);
    if(isSonglist){
      var label = document.querySelector(`table[name=excludelist] tbody tr label[name=${tr.querySelector("label").getAttribute("name")}]`);
      var r = label.parentNode.parentNode.parentNode; // label < div < td < tr
      r.parentNode.removeChild(r);
    }
  }else{ // to TRUE
    target.innerText = "解除";
    tr.style.background = "#666f";
    tr.setAttribute("exclude", true);
    if(isSonglist){
      var copy = tr.cloneNode(true);
      copy.jacket = tr.jacket;
      copy.querySelector("label").onclick = exclution;
      document.querySelector("table[name=excludelist] tbody").appendChild(copy);
    }
  }
}

// table[name=random] thead input[type=button] 除外曲のリストを表示
function exclude_list(){
  document.querySelector("div[name=exclude]").parentNode.style.display = "block";
}

// table[name=excludelist] caption リストを閉じる
function close_exclude_list(){
  document.querySelector("div[name=exclude]").parentNode.style.display = "none";
  Array.from(document.querySelectorAll("table[name=excludelist] tbody tr[exclude=false]")).forEach(function(tr){
    tr.parentNode.removeChild(tr);
  });
}
  

// (table[name=songlist], table[name=excludelist]) thead input[type=button] 除外の全解除
function exclude_allfalse(){
  if(!confirm("除外を全解除します。")) return;
  var e = arguments[0] || window.event;
  e.path.forEach(function(p){
    if(p.tagName == "TABLE"){
      console.log(`table[name=${p.getAttribute("name")}] tbody label[exclude=true]`, document.querySelectorAll(`table[name=${p.getAttribute("name")}] tbody tr[exclude=true] label`));
      Array.from(document.querySelectorAll(`table[name=${p.getAttribute("name")}] tbody tr[exclude=true] label`)).forEach(function(label){
        label.click();
      });
    }
  });
}

function filter_sh(e){
  var evt = e || window.event;
  var target = evt.target;

  var attr = target.getAttribute("sh");

  if(!attr){ // 隠すとき
    target.setAttribute("sh", "hide");
    Array.from(target.parentNode.rows).forEach(function(row){
      row.style.display = "none";
    });
    target.innerText = "フィルター表を表示";
  }else{ // 見せるとき
    target.removeAttribute("sh");
    Array.from(target.parentNode.rows).forEach(function(row){
      row.style.display = "";
    });
    target.innerText = "フィルター表↓を非表示";
  }
}