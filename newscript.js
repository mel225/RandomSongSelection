function set_old_html(e){
  var evt = e || window.event;
  var target = evt.target;

  document.querySelector("input[name=old_html_value]").value = target.value;
}

function new_html_submit(e){
  var date = '' + document.querySelector("input[name=new_html_value]").value;
  document.querySelector("iframe").src = "https://script.google.com/macros/s/AKfycbw0o3DLrOyxljd6PuTZgsCdghchmxKM-rHQeGj8XOevlMM5MCA/exec?date=" + date;
  document.querySelector("span[name=date_str]").innerText = '20' + date.match(/.{2}/g).join("/");  
}

function old_html_submit(e){
  var date = '' + document.querySelector("input[name=old_html_value]").value;
  document.querySelector("iframe").src = "https://script.google.com/macros/s/AKfycbw0o3DLrOyxljd6PuTZgsCdghchmxKM-rHQeGj8XOevlMM5MCA/exec?date=" + date;
  document.querySelector("span[name=date_str]").innerText = '20' + date.match(/.{2}/g).join("/");  
}

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

window.addEventListener("load", function(){
  jsonp("https://script.google.com/macros/s/AKfycbw0o3DLrOyxljd6PuTZgsCdghchmxKM-rHQeGj8XOevlMM5MCA/exec?date=list", function(data){
    console.log(data);
    var date_new = data.shift();
    document.querySelector("input[name=new_html_value]").value = date_new;
    data.forEach(function(item){
      var option = document.querySelector("select[name=old_html]").appendChild(document.createElement("option"));
      option.value = item;
      option.innerText = '20' + item.match(/.{2}/g).join("/");
    });
    document.querySelector("span[name=date_str]").innerText = '20' + date_new.match(/.{2}/g).join("/");
  });
});