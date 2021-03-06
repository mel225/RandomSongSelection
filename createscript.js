window.onload = async function(){

  window.ver = "2020/07/01";

  // songlist.jsonの読み込み
  if(location.href.split("?")[1]){
    await new Promise(function(resolve){
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "https://script.google.com/macros/s/AKfycbw0o3DLrOyxljd6PuTZgsCdghchmxKM-rHQeGj8XOevlMM5MCA/exec");
      xhr.responseType = "text";
      xhr.onload = function(){
        window.songs = JSON.parse(xhr.response.querySelector("pre").innerText.match(/"(.*)"/)[1].replace(/\\"/g,"\"")); // ")); // 手持ちのエディタのせい
        setTimeout(resolve, 1);
      };
      xhr.send();
    });
  }else{
    await new Promise(function(resolve){
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "./songlist.json");
      xhr.responseType = "text";
      xhr.onload = function(){
        window.songs = JSON.parse(xhr.responseText);
        setTimeout(resolve, 1);
      };
      xhr.send();
    });
  }
  // フィルターの生成
  window.filter = filterselection();
  
  // テーブル要素の取得
  var table = document.querySelector("table[name=songlist]");
  
  // tbodyがなければ生成
  if(!table.tBodies.length)
    table.createTBody();
  var body = table.tBodies[0];
  
  // 表示する各内容の取得
  var celltitles = Array.from(table.tHead.rows[0].cells).map(function(th){return th.getAttribute("value");});
  
  // テーブルに反映
  var exclude_id = 0;
  songs.forEach(function(song){
    var tr = body.insertRow();
    celltitles.forEach(function(ct){
      if(!ct) return;
      var div = tr.insertCell().appendChild(document.createElement("div"));
      div.innerText = song[ct];
      switch(ct){
      case "difficulty":
      case "boss_attr":
        div.className = ct + " " + song[ct];
        break;
      default:
        div.className = ct;
      }
    });

    var div = tr.insertCell().appendChild(document.createElement("div"));
    var label = div.appendChild(document.createElement("label"));
    label.setAttribute("name", "exclude_" + exclude_id++);
    label.innerText = "除外";
    
    var input = tr.appendChild(document.createElement("input"));
    input.type = "hidden";
    input.value = song.jacket;
    tr.setAttribute("onclick", "viewjacket(this)");
    tr.setAttribute("ontouchstart", "");
    tr.setAttribute("display", true);
    tr.setAttribute("style", "");
    tr.setAttribute("exclude", false);
  });
  
  // いろいろな初期化
  document.querySelector("span[name=songNum]").innerText = table.tBodies[0].rows.length + "曲";
  window.randomNum = 1;
  window.randomDup = true;

  // フィルター要素のソート
  window.filter.level.sort(complevel);
  window.filter.boss_level.sort(complevel);
  
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

  
  var td = table.tBodies[0].insertRow().insertCell();
  td.colSpan = 6;
  var button = td.appendChild(document.createElement("button"));
  button.innerText = "ここをクリックすると一覧に反映されます。";
  button.setAttribute("onclick", "setsublist()");
  button.setAttribute("name", "setsublist");

  // scriptファイル名の変更
  document.querySelector("script[src]").src = "./script.js";

  // viewportの変更
  document.querySelector("meta[name=viewport]").setAttribute("content", "width=device-width,initial-scale=1.0,user-scalable=yes,shrink-to-fit=no");

  // html取得
  var html = document.querySelector("html").outerHTML;

  // blobからデータURL生成
  var url = URL.createObjectURL(new Blob([html], {type: "text/plain"}));

  // aタグのdownload属性使用してダウンロード
  var a = document.createElement("a");
  a.style.display = "none";
  a.download = "index.html";
  a.href = url;
  a.click();
  console.log(html);

  if(confirm("早速確認する？")){
    location.href = "./";
  }

  /* これはダメでした
  // せめてouterHTMLをクリップボードに…
  if(window.clipboardData){
    window.clipboardData.setData("Text" , html);
  }else{
    var listener = function(e){

        e.clipboardData.setData("text/plain" , html);    
        // 本来のイベントをキャンセル
        e.preventDefault();
        // 終わったら一応削除
        document.removeEventListener("copy", listener);
    }

    // コピーのイベントが発生したときに、クリップボードに書き込むようにしておく
    document.addEventListener("copy" , listener);

    // コピー
    document.execCommand("copy");
  }
    */
};

function sublist(filter){
  list = [];
  songs.forEach(function(song){
    var applicable = true;
    Object.keys(filter).forEach(function(element){
      if(applicable){
        var value = filter[element];
        if(Array.isArray(value)){ // 複数指定
          applicable = (value.indexOf(song[element]) >= 0);
        }else{ // 単一指定
          if(value != song[element])
            applicable = false;
        }
      }
    });
  });

  return list;
}

function filterselection(){
  var selection = {};
  songs.forEach(function(song){
    Object.keys(song).forEach(function(key){
      if(selection[key]){
        if(selection[key].indexOf(song[key]) < 0)
          selection[key].push(song[key]);
      }else{
        selection[key] = [song[key]];
      }
    });
  });

  return selection;
}

function printList(list){
  var table = document.querySelector("table[name=songlist]");

  // tbodyがなければ生成
  if(!table.tBodies.length)
    table.createTBody();
  var body = table.tBodies[0];

  // 表示する内容の取得
  var celltitles = Array.from(table.tHead.rows[0].cells).map(function(th){return th.getAttribute("value");});

  // 全行削除
  while(body.rows[0]) body.deleteRow(0);

  list.forEach(function(song){
    var tr = body.insertRow();
    celltitles.forEach(function(ct){
      var div = tr.insertCell().appendChild(document.createElement("div"));
      div.innerText = song[ct];
      switch(ct){
      case "difficulty":
      case "boss_attr":
        div.className = ct + " " + song[ct];
        break;
      }
    });
  });
}