var s = document.head.appendChild(document.createElement("script"));
s.src = "https://mel225.github.io/calcBS/xhrAccesser.js";
s.onload = main;

function main(){
  Promise.all([
    getSongList("https://ongeki-net.com/ongeki-mobile/record/musicGenre/search/?genre=99&diff=3"),
    getSongList("https://ongeki-net.com/ongeki-mobile/record/musicGenre/search/?genre=99&diff=10")
  ]).then(function(list){
    var a = [];
    list.forEach(function(difflist){
      difflist.forEach(function(diffsong){
        a.push.apply(a, diffsong);
      });
    });
    var json = JSON.stringify(a);
    console.log(json);
  });
}

function getSongList(url){
  return xhra.access(url).then(function(doc){
    return Promise.all(Array.from(doc.querySelectorAll("div.container3 form")).map(function(form){
      var parameter = Array.from(form.elements).map(function(element){
        return encodeURIComponent(element.name) + "=" + encodeURIComponent(element.value);
      });
      return getSongData(form.action + "?" + parameter.join("&"));
    }));
  });
}

function getSongData(url){
  return xhra.access(url).then(async function(doc){
    var data = [];
    var musicdt = doc.querySelector("table.music_detail_table");
    Array.from(musicdt.rows).forEach(function(r){
      var diff = r.cells[3].firstElementChild.className.split("_")[0];
      var diffdata = {};
      data.push(diffdata);

      diffdata.difficulty = diff;
      diffdata.level = r.querySelector("div.score_level").innerText;
      diffdata.title = doc.querySelector("div.m_5.f_14.break").innerText.trim();
      diffdata.genre = doc.querySelector("div.t_r.f_12.main_color").innerText.trim();
      var detail = doc.querySelector("div.m_5.f_13.break").innerText.replace(/(^|(?<=\n))[ 　\t]*($|\n)/g, "").split("\n");
      //diffdata.subtitle = detail[0].trim();
      diffdata.boss_name = detail[2].trim().split(" Lv")[0];
      diffdata.boss_level = detail[2].trim().split("Lv.")[1];
      diffdata.boss_attr = doc.querySelector("img.h_16.v_m").src.split("icon_")[1].split(".png")[0];
      //diffdata.first_attr = doc.querySelectorAll("img.v_m")[1].src.split("mini_")[1].split(".png")[0];
      diffdata.jacket = doc.querySelector("img.m_5.f_l").src.replace(/.*\//g, "");
    });

    await new Promise(function(r){setTimeout(r, 1);});
    
    return data;
  });
}