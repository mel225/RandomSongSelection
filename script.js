window.onload = function(){

  // リストの各行ノードにデータを格納、同時にフィルターの要素生成
  window.filter = {};
  var table = document.querySelector("table[name=songlist]");
  Array.from(table.tBodies[0].rows).forEach(function(tr){
    Array.from(tr.cells).forEach(function(td){
      var item = td.firstElementChild.className.split(" ")[0];
      if(item != "title"){
        var value = td.innerText.replace(/[\r\n]/g, "");
        // データ格納
        tr[item] = value;

        // フィルターの要素生成
        if(window.filter[item]){
          if(window.filter[item].indexOf(value) < 0)
            window.filter[item].push(value);
        }else{
          window.filter[item] = [value];
        }
      }
      tr.setAttribute("display", true);
    });
  });

  // いろいろな初期化
  document.querySelector("span[name=songNum]").innerText = table.tBodies[0].rows.length + "曲";
  window.randomNum = 1;
  window.randomDup = true;
}

// 以下 要素登録関数(onchangeとか)

function viewjacket(tr){
  window.open("https://ongeki-net.com/ongeki-mobile/img/music/" + tr.querySelector("input").value);
}

function setsublist(){
  var count = 0;
  var table = document.querySelector("table[name=songlist]");
  Array.from(table.tBodies[0].rows).forEach(function(tr){
    var applicable = true;
    Object.keys(window.filter).forEach(function(element){
      if(applicable){
        var value = filter[element];
        if(Array.isArray(value)){ // 複数指定
          applicable = (value.indexOf(tr[element]) >= 0);
        }else{ // 単一指定
          applicable = (value == tr[element]);
        }
      }
    });
    if(applicable){
      tr.style.display = "";
      tr.setAttribute("display", true);
      count++;
    }else{
      tr.style.display = "none";
      tr.setAttribute("display", false);
    }
  });

  //alert(count + "曲が該当しました。");
  document.querySelector("span[name=songNum]").innerText = count + "曲";
}

function changeRandomNum(input){
  if(input.value < 1) input.value = 1;
  window.randomNum = parseInt(input.value);
}

function changeRandomDup(input){
  window.randomDup = input.checked;
}

function doRandomSelection(){
  var songs = Array.from(document.querySelectorAll("table[name=songlist] tbody tr[display=true]"));
  var table = document.querySelector("table[name=random]");
  while(table.tBodies[0].rows[0]) table.tBodies[0].deleteRow(0);
  for(var i=0; i<window.randomNum && songs.length; i++){
    var idx = parseInt(Math.random() * (songs.length - 1));
    table.tBodies[0].appendChild(songs[idx].cloneNode(true));
    if(!window.randomDup) songs = songs.filter(function(n, i){return i!=idx;});
  }
}

function filterselectall(input){
  var items = [];
  Array.from(document.querySelectorAll(`table[name=filter] tbody td[value=${input.parentNode.getAttribute("value")}] input[type=checkbox]`)).forEach(function(input){
    input.checked = true;
    items.push(input.value);
  });
  window.filter[input.parentNode.getAttribute("value")] = items;
}

function filternotselectall(input){
  Array.from(document.querySelectorAll(`table[name=filter] tbody td[value=${input.parentNode.getAttribute("value")}] input[type=checkbox]`)).forEach(function(input){
    input.checked = false;
  });
  window.filter[input.parentNode.getAttribute("value")] = [];
}

function changefilteritem(input){
  var item = input.parentNode.parentNode.parentNode.getAttribute("value");
  if(input.checked){
    if(window.filter[item])
      window.filter[item].push(input.value);
    else
      window.filter[item] = [input.value];
  }else{
    window.filter[item] = window.filter[item].filter(function(value){return value != input.value;});
  }
}