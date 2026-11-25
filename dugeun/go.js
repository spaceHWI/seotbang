// ?i=<물건 id> 가 있으면 그 물건으로, 없으면 두근 목록으로
var m = /[?&]i=([0-9a-f-]{36})/.exec(location.search);
location.replace("../#/dugeun" + (m ? "/" + m[1] : ""));
