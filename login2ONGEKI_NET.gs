function testLogin(){
  Logger.log(login2ONGEKI_NET());
}

/******************** main function ********************
 * Execute a series of login steps.
 * return cookie Header string.
 *******************************************************/
function login2ONGEKI_NET(){
  var baseURL = "https://ongeki-net.com/ongeki-mobile/";
  
  var time = new Date().getTime(); // get now msec.
  
  /* get cookie informations of needs to login */
  var cookie = cookie_str2json(access2ONGEKI_NET(baseURL));
  var logincookie = "_t=" + cookie["_t"] + "; userId=" + cookie["userId"] + ";";
  time = sleep(150, time);
  
  /* submit login */
  var payload = {
    segaId: "",
    password: "",
    token: cookie["_t"]
  };
  access2ONGEKI_NET(baseURL + "submit/", logincookie, "POST", payload);
  time = sleep(150, time);
  
  /* access AimeList */
  access2ONGEKI_NET(baseURL + "aimeList/", logincookie);
  time = sleep(150, time);
  
  /* submit selected aime */
  var cookies = cookie_json2str(access2ONGEKI_NET(baseURL + "aimeList/submit/?idx=0", logincookie));
  time = sleep(150, time);
  
  return cookies;
}

/******************** one shot access to ONGEKI.NET ********************
 * Access to url with cookies and payload by method.
 * return cookie Header string.
 ***********************************************************************/
function access2ONGEKI_NET(url, cookies, method="GET", payload){
  var option = {
    method: method,
    followRedirects: false,
  };
  
  if(cookies){
    option.headers = {Cookie: cookies};
  }
  
  if(payload){
    option.payload = payload;
  }
  
  var response = UrlFetchApp.fetch(url, option);
  
  if(response.getAllHeaders()["Set-Cookie"]){
    var responseCookies = cookie_str2json(response.getAllHeaders()["Set-Cookie"]);
  }
  
  return responseCookies;
}

/******************** convert from cookie Header string to JSON object ********************
 * Eliminate duplicate cookies.
 * return cookie JSON object.
 ******************************************************************************************/
function cookie_str2json(cookies){
  if(Array.isArray(cookies)){
    cookies = cookies.join("; ");
  }else if(typeof cookies != "string"){
    return cookies;
  }
  
  return JSON.parse('{' + cookies.split(';').map(function(kv){
    var key = kv.trim().split('=')[0];
    var value = kv.trim().split('=')[1];
    return '"' + key + '":"' + (value ? value : '') + '"';
  }).join(',') + '}');
}

/******************** convert from cookie JSON object to Header string ********************
 * Make usable Header string from JSON object.
 * return cookie Header string.
 ******************************************************************************************/
function cookie_json2str(cookies){
  return Object.keys(cookies).map(function(key){
    return key + '=' + cookies[key];
  }).join('; ');
}

/******************** stop script msec(based on start) ********************
 * title sonomanma dayo.
 **************************************************************************/
function sleep(msec, start){
  if(!start) start = new Date().getTime();
  while(new Date().getTime() < start + msec);
  return;
}